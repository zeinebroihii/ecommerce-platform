public without sharing class StockBriefingAction {
  public class Input {
    @InvocableVariable(
      description='Optional filter: Critical, At Risk, Overstock, Pipeline Pressure. Leave blank for full briefing including healthy products with quote pressure.'
    )
    public String riskFilter;
  }

  public class Output {
    @InvocableVariable(
      description='Full stock health briefing text ready to present to the user.'
    )
    public String briefing;
    @InvocableVariable(
      description='Number of Critical products (stock exhausted in 3 days or less).'
    )
    public Integer criticalCount;
    @InvocableVariable(
      description='Number of At Risk products (stock exhausted in 14 days or less).'
    )
    public Integer atRiskCount;
    @InvocableVariable(
      description='Number of Healthy products that have open quotes creating pipeline pressure.'
    )
    public Integer pipelinePressureCount;
    @InvocableVariable(
      description='Total open quote pipeline value in dollars across all flagged products.'
    )
    public Decimal pipelineAtRisk;
  }

  @InvocableMethod(
    label='Get Stock Health Briefing'
    description='Returns a full stock health briefing: Critical, At Risk, and Overstock products plus Healthy products where open quotes exceed or pressure available stock. Includes velocity, days remaining, and pipeline value. Use when the user asks about inventory health, stock status, supply chain risks, pipeline pressure, or wants a briefing before a sales or executive review.'
  )
  public static List<Output> getStockBriefing(List<Input> inputs) {
    String filter = (inputs != null &&
      !inputs.isEmpty() &&
      String.isNotBlank(inputs[0].riskFilter))
      ? inputs[0].riskFilter
      : null;

    // ── Non-healthy products ─────────────────────────────────────────────────
    List<Stock__c> atRiskStocks = [
      SELECT
        Id,
        Product__c,
        Product__r.Name,
        Quantity_Available__c,
        Daily_Velocity__c,
        Days_Remaining__c,
        Risk_Level__c,
        Reorder_Threshold__c
      FROM Stock__c
      WHERE Risk_Level__c != 'Healthy' AND Product__c != NULL
      ORDER BY Days_Remaining__c ASC NULLS LAST
      LIMIT 30
    ];

    // ── Healthy products with open quote commitments ──────────────────────────
    List<Stock__c> healthyStocks = new List<Stock__c>();
    if (filter == null || filter == 'Pipeline Pressure') {
      healthyStocks = [
        SELECT
          Id,
          Product__c,
          Product__r.Name,
          Quantity_Available__c,
          Daily_Velocity__c,
          Days_Remaining__c,
          Risk_Level__c,
          Reorder_Threshold__c
        FROM Stock__c
        WHERE Risk_Level__c = 'Healthy' AND Product__c != NULL
        ORDER BY Quantity_Available__c ASC
        LIMIT 50
      ];
    }

    // Combine for pipeline query
    Set<Id> allProductIds = new Set<Id>();
    for (Stock__c s : atRiskStocks)
      allProductIds.add(s.Product__c);
    for (Stock__c s : healthyStocks)
      allProductIds.add(s.Product__c);

    Map<Id, Decimal> pipelineByProduct = new Map<Id, Decimal>();
    Map<Id, Integer> quoteCountByProduct = new Map<Id, Integer>();
    Map<Id, Decimal> committedByProduct = new Map<Id, Decimal>();

    if (!allProductIds.isEmpty()) {
      for (AggregateResult ar : [
        SELECT
          Product__c pid,
          SUM(Quote__r.GrandTotal__c) val,
          COUNT_DISTINCT(Quote__c) cnt,
          SUM(Quantity__c) qty
        FROM NexusQuoteLineItem__c
        WHERE
          Product__c IN :allProductIds
          AND Quote__r.Status__c NOT IN (
            'Accepted',
            'Rejected',
            'Signed',
            'Expired'
          )
        GROUP BY Product__c
      ]) {
        Id pid = (Id) ar.get('pid');
        pipelineByProduct.put(pid, (Decimal) ar.get('val') ?? 0);
        quoteCountByProduct.put(
          pid,
          Integer.valueOf((Decimal) ar.get('cnt') ?? 0)
        );
        committedByProduct.put(pid, (Decimal) ar.get('qty') ?? 0);
      }
    }

    Integer criticalCount = 0, atRiskCount = 0, pressureCount = 0;
    Decimal totalPipeline = 0;
    List<String> riskLines = new List<String>();
    List<String> pressureLines = new List<String>();

    // ── Non-healthy lines ────────────────────────────────────────────────────
    for (Stock__c s : atRiskStocks) {
      String risk = s.Risk_Level__c;
      if (filter != null && filter != risk)
        continue;
      if (risk == 'Critical')
        criticalCount++;
      else if (risk == 'At Risk')
        atRiskCount++;

      Decimal pipeline = pipelineByProduct.get(s.Product__c) ?? 0;
      Integer quotes = quoteCountByProduct.get(s.Product__c) ?? 0;
      totalPipeline += pipeline;

      String daysStr = s.Days_Remaining__c != null
        ? Integer.valueOf(s.Days_Remaining__c) + ' days'
        : 'no sales data';
      String pipeStr = pipeline > 0
        ? ' | ' +
          quotes +
          ' quote' +
          (quotes > 1 ? 's' : '') +
          ' totalling $' +
          pipeline.setScale(0).toPlainString()
        : '';

      riskLines.add(
        '[' +
          risk.toUpperCase() +
          '] ' +
          s.Product__r.Name +
          ' — ' +
          Integer.valueOf(s.Quantity_Available__c ?? 0) +
          ' units, ' +
          daysStr +
          ' at ' +
          (s.Daily_Velocity__c ?? 0).setScale(2) +
          ' units/day' +
          pipeStr
      );
    }

    // ── Healthy-but-pressured lines ──────────────────────────────────────────
    if (filter == null || filter == 'Pipeline Pressure') {
      for (Stock__c s : healthyStocks) {
        Decimal committed = committedByProduct.get(s.Product__c) ?? 0;
        if (committed == 0)
          continue;

        Decimal stock = s.Quantity_Available__c ?? 0;
        Decimal effective = Math.max(0, stock - committed);
        Decimal threshold = s.Reorder_Threshold__c ?? 10;
        Decimal pipeline = pipelineByProduct.get(s.Product__c) ?? 0;
        Integer quotes = quoteCountByProduct.get(s.Product__c) ?? 0;

        pressureCount++;
        totalPipeline += pipeline;

        String warning = committed > stock
          ? ' ⚠ OVERCOMMITTED — quotes exceed stock!'
          : (effective <= threshold
              ? ' — effective stock below reorder threshold'
              : '');

        pressureLines.add(
          '[HEALTHY — PIPELINE PRESSURE] ' +
            s.Product__r.Name +
            ' — ' +
            Integer.valueOf(stock) +
            ' in stock, ' +
            Integer.valueOf(committed) +
            ' committed in ' +
            quotes +
            ' open quote' +
            (quotes > 1 ? 's' : '') +
            ' ($' +
            pipeline.setScale(0).toPlainString() +
            ')' +
            ', effective: ' +
            Integer.valueOf(effective) +
            ' units' +
            warning
        );
      }
    }

    Output out = new Output();
    out.criticalCount = criticalCount;
    out.atRiskCount = atRiskCount;
    out.pipelinePressureCount = pressureCount;
    out.pipelineAtRisk = totalPipeline;

    Boolean hasRisk = !riskLines.isEmpty();
    Boolean hasPressure = !pressureLines.isEmpty();

    if (!hasRisk && !hasPressure) {
      out.briefing = 'All products are Healthy with no open quote pressure. No immediate stock risk detected.';
    } else {
      String header =
        'STOCK HEALTH BRIEFING\n' +
        '─────────────────────\n' +
        'Critical: ' +
        criticalCount +
        '  |  At Risk: ' +
        atRiskCount +
        '  |  Pipeline pressure: ' +
        pressureCount +
        '  |  Total exposure: $' +
        totalPipeline.setScale(0).toPlainString() +
        '\n';

      String body = '';
      if (hasRisk)
        body += '\n' + String.join(riskLines, '\n');
      if (hasPressure)
        body +=
          '\n\n── Healthy products under quote pressure ──\n' +
          String.join(pressureLines, '\n');

      out.briefing = header + body;
    }
    return new List<Output>{ out };
  }
}
