/**
 * StockVelocityEngine — Schedulable Apex
 *
 * Runs daily (or on-demand). For every Stock__c record:
 *   1. Calculates daily velocity = units sold in last 30 days ÷ 30
 *   2. Calculates days remaining = Quantity_Available__c ÷ velocity
 *   3. Assigns Risk_Level__c: Critical / At Risk / Healthy / Overstock
 *   4. Writes AI_Risk_Summary__c via Prompt Builder for critical/at-risk items
 *
 * Schedule via Anonymous Apex:
 *   System.schedule('Stock Velocity Engine', '0 0 2 * * ?', new StockVelocityEngine());
 */
public without sharing class StockVelocityEngine implements Schedulable {
  public void execute(SchedulableContext ctx) {
    run();
  }

  @AuraEnabled
  public static void run() {
    // ── 1. Load all Stock records ─────────────────────────────────────────
    List<Stock__c> stocks = [
      SELECT
        Id,
        Product__c,
        Quantity_Available__c,
        Reorder_Threshold__c,
        Daily_Velocity__c,
        Days_Remaining__c,
        Risk_Level__c
      FROM Stock__c
      WHERE Product__c != NULL
    ];
    if (stocks.isEmpty())
      return;

    Set<Id> productIds = new Set<Id>();
    for (Stock__c s : stocks)
      productIds.add(s.Product__c);

    // ── 2. Get units sold per product in last 30 days ─────────────────────
    Date cutoff = Date.today().addDays(-30);
    Map<Id, Decimal> soldByProduct = new Map<Id, Decimal>();
    for (AggregateResult ar : [
      SELECT OrderItem.Product2Id pid, SUM(OrderItem.Quantity) qty
      FROM OrderItem
      WHERE
        OrderItem.Product2Id IN :productIds
        AND Order.EffectiveDate >= :cutoff
        AND Order.Status = 'Activated'
      GROUP BY OrderItem.Product2Id
    ]) {
      soldByProduct.put((Id) ar.get('pid'), (Decimal) ar.get('qty'));
    }

    // ── 2b. Get units + quote count + pipeline value per product ────────────
    Map<Id, Decimal> quotedByProduct = new Map<Id, Decimal>();
    Map<Id, Integer> quoteCountByProduct = new Map<Id, Integer>();
    Map<Id, Decimal> quoteValueByProduct = new Map<Id, Decimal>();
    for (AggregateResult ar : [
      SELECT
        Product__c pid,
        SUM(Quantity__c) qty,
        COUNT_DISTINCT(Quote__c) cnt,
        SUM(Quote__r.GrandTotal__c) val
      FROM NexusQuoteLineItem__c
      WHERE
        Product__c IN :productIds
        AND Quote__r.Status__c NOT IN (
          'Accepted',
          'Rejected',
          'Signed',
          'Expired'
        )
      GROUP BY Product__c
    ]) {
      Id pid = (Id) ar.get('pid');
      quotedByProduct.put(pid, (Decimal) ar.get('qty'));
      quoteCountByProduct.put(pid, Integer.valueOf((Decimal) ar.get('cnt')));
      quoteValueByProduct.put(pid, (Decimal) ar.get('val'));
    }

    // ── 3. Calculate velocity + risk for each stock record ────────────────
    List<Stock__c> toUpdate = new List<Stock__c>();

    for (Stock__c s : stocks) {
      Decimal sold = soldByProduct.get(s.Product__c) ?? 0;
      Decimal velocity = sold / 30.0;
      Decimal stock = s.Quantity_Available__c ?? 0;
      Decimal quoted = quotedByProduct.get(s.Product__c) ?? 0;
      Integer quoteCount = quoteCountByProduct.get(s.Product__c) ?? 0;
      Decimal quoteValue = quoteValueByProduct.get(s.Product__c) ?? 0;
      Decimal effectiveStock = Math.max(0, stock - quoted);
      Decimal threshold = s.Reorder_Threshold__c ?? 10;

      Integer daysLeft;
      if (velocity > 0) {
        daysLeft = Integer.valueOf(Math.floor(effectiveStock / velocity));
      } else {
        daysLeft = 999; // no sales → no immediate risk
      }

      String riskLevel;
      if (daysLeft <= 3)
        riskLevel = 'Critical';
      else if (daysLeft <= 14 || stock <= threshold)
        riskLevel = 'At Risk';
      else if (velocity > 0 && stock > (velocity * 90))
        riskLevel = 'Overstock';
      else
        riskLevel = 'Healthy';

      String aiSummary = buildAISummary(
        s,
        velocity,
        daysLeft,
        riskLevel,
        sold,
        quoted,
        quoteCount,
        quoteValue
      );

      Stock__c upd = new Stock__c(
        Id = s.Id,
        Daily_Velocity__c = velocity.setScale(2),
        Days_Remaining__c = daysLeft == 999 ? null : daysLeft,
        Risk_Level__c = riskLevel,
        AI_Risk_Summary__c = aiSummary,
        Last_Sync_Date__c = DateTime.now()
      );
      toUpdate.add(upd);
    }

    update toUpdate;

    // ── 4. Fire platform event for critical items ─────────────────────────
    List<Low_Stock_Alert__e> events = new List<Low_Stock_Alert__e>();
    for (Stock__c s : toUpdate) {
      if (s.Risk_Level__c == 'Critical') {
        events.add(
          new Low_Stock_Alert__e(
            Product_Id__c = s.Product__c,
            Current_Quantity__c = s.Quantity_Available__c ?? 0
          )
        );
      }
    }
    if (!events.isEmpty())
      EventBus.publish(events);

    // ── 5. Cascade into BoostBuryEngine so Product2.Stock_Status__c ──────────
    // is always in sync — catalog boost/bury sorting depends on this field
    BoostBuryEngine.run();
  }

  // ── AI summary builder (rule-based, no API call needed) ──────────────────
  private static String buildAISummary(
    Stock__c s,
    Decimal velocity,
    Integer daysLeft,
    String riskLevel,
    Decimal sold30,
    Decimal quoted,
    Integer quoteCount,
    Decimal quoteValue
  ) {
    Decimal stock = s.Quantity_Available__c ?? 0;
    Decimal threshold = s.Reorder_Threshold__c ?? 10;
    Decimal suggested = Math.max(sold30 * 1.5, threshold * 3).setScale(0);
    Decimal effStock = Math.max(0, stock - quoted);

    // Pipeline pressure note
    String pipelineNote = '';
    if (quoteCount > 0) {
      String valStr = '$' + quoteValue.setScale(0).toPlainString();
      pipelineNote =
        ' Pipeline: ' +
        quoteCount +
        ' open quote' +
        (quoteCount > 1 ? 's' : '') +
        ' (' +
        valStr +
        ') — ' +
        Integer.valueOf(quoted) +
        ' units committed, effective stock: ' +
        Integer.valueOf(effStock) +
        '.';
    }

    // Healthy — only generate insight when there is meaningful pipeline pressure
    if (riskLevel == 'Healthy') {
      if (quoteCount > 0 && effStock <= threshold * 2) {
        return 'HEALTHY (pipeline pressure): ' +
          Integer.valueOf(stock) +
          ' units on hand.' +
          pipelineNote +
          ' Stock appears adequate today, but open quotes could accelerate depletion.' +
          ' Monitor closely and consider a pre-emptive reorder of ' +
          Integer.valueOf(suggested) +
          ' units.';
      }
      return null;
    }

    if (riskLevel == 'Critical') {
      String urgency = quoteCount > 0
        ? ' Open quotes are competing for the remaining stock — fulfilment is at risk.'
        : '';
      return 'CRITICAL: Only ' +
        Integer.valueOf(stock) +
        ' units in stock.' +
        pipelineNote +
        ' At current velocity (' +
        velocity.setScale(2) +
        ' units/day), stock exhausted in ' +
        daysLeft +
        ' day(s).' +
        urgency +
        ' Reorder ' +
        Integer.valueOf(suggested) +
        ' units immediately.';
    }

    if (riskLevel == 'At Risk') {
      String quoteRisk = quoteCount > 0
        ? ' With ' +
          quoteCount +
          ' open quote' +
          (quoteCount > 1 ? 's' : '') +
          ' in the pipeline, actual runway is shorter than history alone suggests.'
        : '';
      return 'AT RISK: ' +
        Integer.valueOf(stock) +
        ' units in stock (~' +
        daysLeft +
        ' days).' +
        pipelineNote +
        quoteRisk +
        ' Velocity: ' +
        velocity.setScale(2) +
        ' units/day. ' +
        'Reorder threshold: ' +
        Integer.valueOf(threshold) +
        ' units. ' +
        'Schedule a reorder of ' +
        Integer.valueOf(suggested) +
        ' units within 3 days.';
    }

    if (riskLevel == 'Overstock') {
      Decimal excessDays = velocity > 0 ? (stock / velocity).setScale(0) : 999;
      String quoteAbsorb = quoteCount > 0
        ? ' However, ' +
          quoteCount +
          ' open quote' +
          (quoteCount > 1 ? 's' : '') +
          ' (' +
          Integer.valueOf(quoted) +
          ' units) could absorb part of the surplus if closed.'
        : '';
      return 'OVERSTOCK: ' +
        Integer.valueOf(stock) +
        ' units on hand (~' +
        Integer.valueOf(excessDays) +
        ' days of supply). ' +
        'Only ' +
        velocity.setScale(2) +
        ' units/day sold.' +
        quoteAbsorb +
        ' Consider a promotion or bundling with fast-moving products to reduce inventory.';
    }
    return null;
  }
}
