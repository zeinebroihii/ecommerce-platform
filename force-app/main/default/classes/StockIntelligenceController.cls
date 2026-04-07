public without sharing class StockIntelligenceController {
  // ── DTOs ──────────────────────────────────────────────────────────────────

  public class StockRiskItem {
    @AuraEnabled
    public String stockId;
    @AuraEnabled
    public String productId;
    @AuraEnabled
    public String productName;
    @AuraEnabled
    public String productFamily;
    @AuraEnabled
    public String subcategory;
    @AuraEnabled
    public String imageUrl;
    @AuraEnabled
    public Decimal stockLevel;
    @AuraEnabled
    public Decimal dailyVelocity;
    @AuraEnabled
    public Integer daysRemaining;
    @AuraEnabled
    public String riskLevel; // Critical / At Risk / Healthy / Overstock
    @AuraEnabled
    public String aiSummary;
    @AuraEnabled
    public Decimal reorderThreshold;
    @AuraEnabled
    public Integer relatedQuoteCount;
    @AuraEnabled
    public Decimal relatedQuoteValue;
  }

  public class QuoteSummary {
    @AuraEnabled
    public String quoteId;
    @AuraEnabled
    public String quoteName;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public Decimal grandTotal;
    @AuraEnabled
    public String accountName;
  }

  // ── Main query — all stock records ranked by risk ─────────────────────────

  @AuraEnabled(cacheable=true)
  public static List<StockRiskItem> getStockRiskProducts() {
    List<Stock__c> stocks = [
      SELECT
        Id,
        Product__c,
        Product__r.Name,
        Product__r.Family,
        Product__r.Subcategory__c,
        Product__r.Description,
        Quantity_Available__c,
        Daily_Velocity__c,
        Days_Remaining__c,
        Risk_Level__c,
        AI_Risk_Summary__c,
        Reorder_Threshold__c,
        Last_Sync_Date__c
      FROM Stock__c
      WHERE Product__c != NULL
      ORDER BY Days_Remaining__c ASC NULLS LAST
      LIMIT 50
    ];

    // Collect productIds to find related open quotes
    Set<Id> productIds = new Set<Id>();
    for (Stock__c s : stocks)
      productIds.add(s.Product__c);

    // Quote line items referencing these products
    Map<Id, Integer> quoteCountByProduct = new Map<Id, Integer>();
    Map<Id, Decimal> quoteValueByProduct = new Map<Id, Decimal>();
    if (!productIds.isEmpty()) {
      for (NexusQuoteLineItem__c li : [
        SELECT Product__c, Quote__r.GrandTotal__c
        FROM NexusQuoteLineItem__c
        WHERE
          Product__c IN :productIds
          AND Quote__r.Status__c IN ('Draft', 'Sent', 'Negotiating')
        LIMIT 200
      ]) {
        Id pid = li.Product__c;
        quoteCountByProduct.put(pid, (quoteCountByProduct.get(pid) ?? 0) + 1);
        quoteValueByProduct.put(
          pid,
          (quoteValueByProduct.get(pid) ?? 0) + (li.Quote__r.GrandTotal__c ?? 0)
        );
      }
    }

    List<StockRiskItem> result = new List<StockRiskItem>();
    for (Stock__c s : stocks) {
      StockRiskItem item = new StockRiskItem();
      item.stockId = s.Id;
      item.productId = s.Product__c;
      item.productName = s.Product__r.Name;
      item.productFamily = s.Product__r.Family;
      item.subcategory = s.Product__r.Subcategory__c;
      item.stockLevel = s.Quantity_Available__c ?? 0;
      item.dailyVelocity = s.Daily_Velocity__c ?? 0;
      item.daysRemaining = s.Days_Remaining__c != null
        ? Integer.valueOf(s.Days_Remaining__c)
        : 999;
      item.riskLevel = s.Risk_Level__c ?? 'Healthy';
      item.aiSummary = s.AI_Risk_Summary__c;
      item.reorderThreshold = s.Reorder_Threshold__c ?? 10;
      item.relatedQuoteCount = quoteCountByProduct.get(s.Product__c) ?? 0;
      item.relatedQuoteValue = quoteValueByProduct.get(s.Product__c) ?? 0;
      result.add(item);
    }
    return result;
  }

  // ── Quotes blocked / at risk due to this product's stock ─────────────────

  @AuraEnabled(cacheable=true)
  public static List<QuoteSummary> getRelatedQuotes(String productId) {
    List<QuoteSummary> result = new List<QuoteSummary>();
    for (NexusQuoteLineItem__c li : [
      SELECT
        Quote__c,
        Quote__r.Name,
        Quote__r.Status__c,
        Quote__r.GrandTotal__c,
        Quote__r.Opportunity__r.Account.Name
      FROM NexusQuoteLineItem__c
      WHERE
        Product__c = :productId
        AND Quote__r.Status__c IN ('Draft', 'Sent', 'Negotiating')
      LIMIT 20
    ]) {
      QuoteSummary qs = new QuoteSummary();
      qs.quoteId = li.Quote__c;
      qs.quoteName = li.Quote__r.Name;
      qs.status = li.Quote__r.Status__c;
      qs.grandTotal = li.Quote__r.GrandTotal__c;
      qs.accountName = li.Quote__r.Opportunity__r?.Account?.Name;
      result.add(qs);
    }
    return result;
  }

  // ── Acknowledge / dismiss an alert (clears AI summary) ───────────────────

  @AuraEnabled
  public static void acknowledgeAlert(String stockId) {
    Stock__c s = new Stock__c(
      Id = stockId,
      AI_Risk_Summary__c = null,
      Risk_Level__c = 'Healthy'
    );
    update s;
  }

  // ── Summary counts for dashboard header cards ─────────────────────────────

  public class StockSummary {
    @AuraEnabled
    public Integer critical;
    @AuraEnabled
    public Integer atRisk;
    @AuraEnabled
    public Integer healthy;
    @AuraEnabled
    public Integer overstock;
    @AuraEnabled
    public Integer total;
  }

  @AuraEnabled(cacheable=true)
  public static StockSummary getStockSummary() {
    StockSummary s = new StockSummary();
    s.critical = 0;
    s.atRisk = 0;
    s.healthy = 0;
    s.overstock = 0;
    s.total = 0;
    for (AggregateResult ar : [
      SELECT Risk_Level__c level, COUNT(Id) cnt
      FROM Stock__c
      WHERE Product__c != NULL
      GROUP BY Risk_Level__c
    ]) {
      String lvl = (String) ar.get('level');
      Integer cnt = Integer.valueOf(ar.get('cnt'));
      s.total += cnt;
      if (lvl == 'Critical')
        s.critical += cnt;
      else if (lvl == 'At Risk')
        s.atRisk += cnt;
      else if (lvl == 'Healthy')
        s.healthy += cnt;
      else if (lvl == 'Overstock')
        s.overstock += cnt;
    }
    return s;
  }

  // ── Stock check for Quote Builder ─────────────────────────────────────────
  // Returns a map of productId → available quantity for quick cart validation

  public class StockCheck {
    @AuraEnabled
    public String productId;
    @AuraEnabled
    public Decimal available;
    @AuraEnabled
    public String riskLevel;
    @AuraEnabled
    public Boolean sufficient; // set by caller based on requested qty
  }

  @AuraEnabled(cacheable=true)
  public static List<StockCheck> getStockForProducts(List<String> productIds) {
    List<StockCheck> result = new List<StockCheck>();
    if (productIds == null || productIds.isEmpty())
      return result;
    Set<Id> ids = new Set<Id>();
    for (String pid : productIds)
      ids.add((Id) pid);

    for (Stock__c s : [
      SELECT Product__c, Quantity_Available__c, Risk_Level__c
      FROM Stock__c
      WHERE Product__c IN :ids
    ]) {
      StockCheck sc = new StockCheck();
      sc.productId = s.Product__c;
      sc.available = s.Quantity_Available__c ?? 0;
      sc.riskLevel = s.Risk_Level__c ?? 'Healthy';
      sc.sufficient = true;
      result.add(sc);
    }
    return result;
  }

  // ── Prompt Builder reorder brief ──────────────────────────────────────────
  // Tries ConnectApi Prompt Builder; falls back to rule-based brief

  @AuraEnabled
  public static String generateReorderBrief(String stockId) {
    Stock__c s = [
      SELECT
        Product__c,
        Product__r.Name,
        Product__r.Family,
        Quantity_Available__c,
        Daily_Velocity__c,
        Days_Remaining__c,
        Risk_Level__c,
        Reorder_Threshold__c,
        Forecasted_Demand__c,
        AI_Risk_Summary__c
      FROM Stock__c
      WHERE Id = :stockId
      LIMIT 1
    ];

    // Try Prompt Builder — Flex template 'Stock_Reorder_Brief' with text inputs
    try {
      ConnectApi.EinsteinPromptTemplateGenerationsInput input = new ConnectApi.EinsteinPromptTemplateGenerationsInput();
      input.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
      input.additionalConfig.applicationName = 'PromptTemplateGenerationsInvocable';
      input.isPreview = false;

      Decimal vel = s.Daily_Velocity__c ?? 0;
      Decimal stk = s.Quantity_Available__c ?? 0;
      Decimal thresh = s.Reorder_Threshold__c ?? 10;
      String rsk = s.Risk_Level__c ?? 'Healthy';
      Integer dLeft = s.Days_Remaining__c != null
        ? Integer.valueOf(s.Days_Remaining__c)
        : 999;
      String forecast = s.Forecasted_Demand__c != null
        ? String.valueOf(s.Forecasted_Demand__c)
        : 'N/A';

      // Coverage window and minimum order qty — must match JS enrichItem logic
      Integer coverDays = rsk == 'Critical'
        ? 90
        : rsk == 'At Risk' ? 60 : rsk == 'Overstock' ? 0 : 30;
      Integer suggestedQty = rsk == 'Overstock'
        ? 0
        : vel == 0
            ? Integer.valueOf(thresh * 2)
            : Integer.valueOf(Math.max(vel * coverDays, thresh).setScale(0));

      String stockContext =
        'Product: ' +
        s.Product__r.Name +
        ' | Family: ' +
        (s.Product__r.Family ?? 'N/A') +
        ' | Stock: ' +
        Integer.valueOf(stk) +
        ' units' +
        ' | Daily velocity: ' +
        vel.setScale(2) +
        ' units/day' +
        ' | Days remaining: ' +
        (dLeft < 999 ? String.valueOf(dLeft) : 'unknown') +
        ' | Risk: ' +
        rsk +
        ' | Reorder threshold (minimum): ' +
        Integer.valueOf(thresh) +
        ' units' +
        ' | Recommended order quantity: ' +
        suggestedQty +
        ' units (covers ' +
        coverDays +
        ' days)' +
        ' | Forecasted demand: ' +
        forecast;

      Map<String, ConnectApi.WrappedValue> valMap = new Map<String, ConnectApi.WrappedValue>();
      valMap.put('Input:ProductName', wrapString(s.Product__r.Name));
      valMap.put('Input:StockContext', wrapString(stockContext));
      valMap.put('Input:RiskLevel', wrapString(rsk));
      valMap.put(
        'Input:DaysRemaining',
        wrapString(dLeft < 999 ? String.valueOf(dLeft) + ' days' : 'unknown')
      );
      valMap.put('Input:Velocity', wrapString(vel.setScale(2) + ' units/day'));
      input.inputParams = valMap;

      ConnectApi.EinsteinPromptTemplateGenerationsRepresentation result = ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
        'Stock_Reorder_Brief',
        input
      );
      if (
        result != null &&
        result.generations != null &&
        !result.generations.isEmpty()
      ) {
        String text = result.generations[0].text;
        if (String.isNotBlank(text))
          return text;
      }
    } catch (Exception ex) {
      // Prompt Builder unavailable — use rule-based fallback
    }

    // Rule-based fallback brief
    Decimal velocity = s.Daily_Velocity__c ?? 0;
    Decimal stock = s.Quantity_Available__c ?? 0;
    Decimal threshold = s.Reorder_Threshold__c ?? 10;
    String risk = s.Risk_Level__c ?? 'Healthy';
    Integer daysLeft = s.Days_Remaining__c != null
      ? Integer.valueOf(s.Days_Remaining__c)
      : 999;

    // Coverage window varies by risk: critical=90d, at risk=60d, overstock=0, healthy=30d
    Integer coverDays = risk == 'Critical'
      ? 90
      : risk == 'At Risk' ? 60 : risk == 'Overstock' ? 0 : 30;

    // Suggested = max(velocity-based demand for coverDays, threshold, current stock level)
    // This ensures the number is always specific to this product's actual situation
    Decimal velocityBased = velocity * coverDays;
    Decimal suggested;
    if (risk == 'Overstock') {
      suggested = 0;
    } else if (velocity == 0) {
      // No sales data — use threshold as minimum safety stock
      suggested = threshold * 2;
    } else {
      suggested = Math.max(velocityBased, threshold).setScale(0);
    }

    // Urgency line varies by actual days left
    String urgency = daysLeft <= 3
      ? '🚨 CRITICAL — Stock out in ' +
        daysLeft +
        ' day(s). Place emergency order NOW.'
      : daysLeft <= 7
          ? '⚠️ URGENT — Only ' +
            daysLeft +
            ' days remaining. Order within 24 hours.'
          : daysLeft <= 14
              ? '⚠️ HIGH PRIORITY — ' +
                daysLeft +
                ' days of stock left. Order within 3 days.'
              : daysLeft <= 30
                  ? '📅 ' +
                    daysLeft +
                    ' days of stock remaining. Order within the week.'
                  : daysLeft < 999
                      ? '✅ ' +
                        daysLeft +
                        ' days of supply on hand. Monitor and reorder when approaching threshold.'
                      : '❓ No recent sales data. Verify product is still active before ordering.';

    String recommendation = risk == 'Overstock'
      ? 'This product has ' +
        Integer.valueOf(stock) +
        ' units (~' +
        daysLeft +
        ' days supply). Consider running a promotion or pausing new orders to clear excess inventory.'
      : 'Order ' +
        Integer.valueOf(suggested) +
        ' units to cover ' +
        coverDays +
        ' days of demand at the current rate of ' +
        velocity.setScale(2) +
        ' units/day.';

    return '📦 REORDER BRIEF — ' +
      s.Product__r.Name.toUpperCase() +
      '\n\n' +
      '• Current stock: ' +
      Integer.valueOf(stock) +
      ' units\n' +
      '• Daily velocity: ' +
      (velocity > 0 ? velocity.setScale(2) + ' units/day' : 'No recent sales') +
      '\n' +
      '• Days until stockout: ' +
      (daysLeft < 999 ? String.valueOf(daysLeft) + ' days' : 'Unknown') +
      '\n' +
      '• Reorder threshold: ' +
      Integer.valueOf(threshold) +
      ' units\n' +
      '• Risk level: ' +
      risk +
      '\n\n' +
      '💡 RECOMMENDATION\n' +
      recommendation +
      '\n\n' +
      urgency +
      '\n\n' +
      '📊 CATEGORY: ' +
      (s.Product__r.Family ?? 'N/A');
  }

  // ── Sprint 3 — AI Demand Forecast ─────────────────────────────────────────
  // Calls Prompt Builder 'Stock_Demand_Forecast' (Flex template, text inputs)
  // Falls back to rule-based multi-horizon forecast if AI unavailable

  @AuraEnabled
  public static String generateDemandForecast(String stockId) {
    Stock__c s = [
      SELECT
        Product__c,
        Product__r.Name,
        Product__r.Family,
        Quantity_Available__c,
        Daily_Velocity__c,
        Days_Remaining__c,
        Risk_Level__c,
        Reorder_Threshold__c,
        Forecasted_Demand__c,
        AI_Risk_Summary__c,
        Last_Sync_Date__c
      FROM Stock__c
      WHERE Id = :stockId
      LIMIT 1
    ];

    Decimal vel = s.Daily_Velocity__c ?? 0;
    Decimal stock = s.Quantity_Available__c ?? 0;
    Decimal thresh = s.Reorder_Threshold__c ?? 10;
    String risk = s.Risk_Level__c ?? 'Healthy';
    Integer daysLeft = s.Days_Remaining__c != null
      ? Integer.valueOf(s.Days_Remaining__c)
      : 999;

    // Quote pipeline: units committed to open quotes
    Integer quotedUnits = 0;
    Integer openQuotes = 0;
    for (NexusQuoteLineItem__c li : [
      SELECT Quantity__c
      FROM NexusQuoteLineItem__c
      WHERE
        Product__c = :s.Product__c
        AND Quote__r.Status__c IN ('Draft', 'Sent', 'Negotiating')
      LIMIT 50
    ]) {
      openQuotes++;
      quotedUnits += li.Quantity__c != null
        ? Integer.valueOf(li.Quantity__c)
        : 1;
    }

    Decimal adjustedStock = Math.max(stock - quotedUnits, 0);
    Integer adjustedDays = vel > 0
      ? Integer.valueOf((adjustedStock / vel).setScale(0))
      : 999;
    Integer demand30 = Integer.valueOf((vel * 30).setScale(0));
    Integer demand90 = Integer.valueOf((vel * 90).setScale(0));
    String stockoutDate = daysLeft < 999
      ? String.valueOf(Date.today().addDays(daysLeft))
      : 'N/A';

    // Save 30-day projection back to record so it appears in Salesforce reports
    try {
      update new Stock__c(Id = stockId, Forecasted_Demand__c = demand30);
    } catch (Exception ex) {
      /* ignore — read-only or locked */
    }

    // Trend signal
    String trendSignal = vel == 0
      ? 'No sales recorded — demand may have stalled or product is new.'
      : vel * 30 > stock
          ? 'Demand outpacing supply — velocity of ' +
            vel.setScale(2) +
            ' units/day exhausts stock in ' +
            daysLeft +
            ' days.'
          : vel * 30 < thresh
              ? 'Velocity below reorder threshold pace — monitor for slowdown.'
              : 'Velocity stable and within healthy range.';

    // Prompt Builder context
    String stockData =
      'Product: ' +
      s.Product__r.Name +
      ' | Family: ' +
      (s.Product__r.Family ?? 'N/A') +
      ' | Stock: ' +
      Integer.valueOf(stock) +
      ' units' +
      ' | Velocity: ' +
      vel.setScale(2) +
      ' units/day' +
      ' | Days remaining: ' +
      (daysLeft < 999 ? String.valueOf(daysLeft) : 'unknown') +
      ' | Threshold: ' +
      Integer.valueOf(thresh) +
      ' | Risk: ' +
      risk +
      ' | Stockout date: ' +
      stockoutDate +
      ' | 30d demand: ' +
      demand30 +
      ' units | 90d demand: ' +
      demand90 +
      ' units';

    String quoteDemand = openQuotes > 0
      ? openQuotes +
        ' open quotes committing ' +
        quotedUnits +
        ' units. Adjusted runway: ' +
        (adjustedDays < 999 ? adjustedDays + ' days' : 'unknown') +
        '.'
      : 'No open quotes — full stock available.';

    // Try Prompt Builder
    String aiText = null;
    try {
      ConnectApi.EinsteinPromptTemplateGenerationsInput input = new ConnectApi.EinsteinPromptTemplateGenerationsInput();
      input.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
      input.additionalConfig.applicationName = 'PromptTemplateGenerationsInvocable';
      input.isPreview = false;
      Map<String, ConnectApi.WrappedValue> valMap = new Map<String, ConnectApi.WrappedValue>();
      valMap.put('Input:ProductName', wrapString(s.Product__r.Name));
      valMap.put('Input:StockData', wrapString(stockData));
      valMap.put('Input:QuoteDemand', wrapString(quoteDemand));
      valMap.put('Input:TrendSignal', wrapString(trendSignal));
      valMap.put('Input:RiskLevel', wrapString(risk));
      input.inputParams = valMap;
      ConnectApi.EinsteinPromptTemplateGenerationsRepresentation result = ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
        'Stock_Demand_Forecast',
        input
      );
      if (
        result != null &&
        result.generations != null &&
        !result.generations.isEmpty()
      ) {
        String txt = result.generations[0].text;
        if (String.isNotBlank(txt))
          aiText = txt;
      }
    } catch (Exception ex) {
      /* fallback below */
    }

    // Rule-based fallback narrative
    if (String.isBlank(aiText)) {
      String urgency = daysLeft <= 7
        ? '🚨 CRITICAL — Stockout by ' +
          stockoutDate +
          '. Immediate action required.'
        : daysLeft <= 14
            ? '⚠️ HIGH RISK — ' +
              daysLeft +
              ' days remaining. Order within 48h.'
            : daysLeft <= 30
                ? '📅 MONITOR — ' +
                  daysLeft +
                  ' days of supply. Plan reorder this week.'
                : daysLeft < 999
                    ? '✅ HEALTHY — ' + daysLeft + ' days of supply on hand.'
                    : '❓ UNKNOWN — No active velocity. Verify product status.';
      String q = openQuotes > 0
        ? 'Open quotes are committing ' +
          quotedUnits +
          ' units (' +
          openQuotes +
          ' deals), reducing real runway to ' +
          (adjustedDays < 999 ? adjustedDays + ' days' : 'unknown') +
          '.'
        : 'No open quotes — full inventory is available for new orders.';
      aiText = trendSignal + ' ' + q + '\n\n' + urgency;
    }

    // Return JSON so LWC can render charts + narrative separately
    Map<String, Object> payload = new Map<String, Object>{
      'aiText' => aiText,
      'stockLevel' => Integer.valueOf(stock),
      'demand30' => demand30,
      'demand90' => demand90,
      'daysRemaining' => daysLeft < 999 ? daysLeft : -1,
      'adjustedDays' => adjustedDays < 999 ? adjustedDays : -1,
      'quotedUnits' => quotedUnits,
      'openQuotes' => openQuotes,
      'velocity' => vel.setScale(2),
      'risk' => risk,
      'stockoutDate' => stockoutDate,
      'threshold' => Integer.valueOf(thresh),
      'family' => (s.Product__r.Family ?? 'N/A')
    };
    return JSON.serialize(payload);
  }

  private static ConnectApi.WrappedValue wrapString(String val) {
    ConnectApi.WrappedValue wv = new ConnectApi.WrappedValue();
    wv.value = val != null ? val : '';
    return wv;
  }
}
