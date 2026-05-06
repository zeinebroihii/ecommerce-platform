public with sharing class BoostBuryEngine {
  // Score bands:  > 70 → Boosted | 30–70 → Normal | < 30 → Buried

  public static void run() {
    // Load all Stock records with their linked Product
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

    if (stocks.isEmpty()) {
      System.debug('BoostBuryEngine: no stock records found.');
      return;
    }

    // Build product → latest stock map (one stock record per product)
    Map<Id, Stock__c> productStockMap = new Map<Id, Stock__c>();
    for (Stock__c s : stocks) {
      productStockMap.put(s.Product__c, s);
    }

    // Load matching products
    List<Product2> products = [
      SELECT
        Id,
        Visibility_Score__c,
        Stock_Status__c,
        Stock_Threshold_Low__c,
        Stock_Threshold_High__c
      FROM Product2
      WHERE Id IN :productStockMap.keySet() AND IsActive = TRUE
    ];

    List<Product2> toUpdate = new List<Product2>();

    for (Product2 p : products) {
      Stock__c s = productStockMap.get(p.Id);

      Decimal qty = s.Quantity_Available__c != null
        ? s.Quantity_Available__c
        : 0;
      Decimal reorder = s.Reorder_Threshold__c != null
        ? s.Reorder_Threshold__c
        : 10;
      Decimal velocity = s.Daily_Velocity__c != null ? s.Daily_Velocity__c : 0;
      Decimal daysLeft = s.Days_Remaining__c != null ? s.Days_Remaining__c : 30;
      String riskLevel = s.Risk_Level__c != null ? s.Risk_Level__c : 'Healthy';

      Decimal threshLow = p.Stock_Threshold_Low__c != null
        ? p.Stock_Threshold_Low__c
        : 10;
      Decimal threshHigh = p.Stock_Threshold_High__c != null
        ? p.Stock_Threshold_High__c
        : 100;

      // ─── SCORING (100 points) ─────────────────────────────────

      Decimal score = 50; // baseline neutral

      // 1. Risk Level from AI (±30 pts)
      if (riskLevel == 'Overstock')
        score += 30;
      else if (riskLevel == 'Healthy')
        score += 10;
      else if (riskLevel == 'At Risk')
        score -= 20;
      else if (riskLevel == 'Critical')
        score -= 30;

      // 2. Stock vs Reorder Threshold (±25 pts)
      if (reorder > 0) {
        Decimal ratio = qty / reorder;
        if (ratio >= 3.0)
          score += 25; // heavy overstock
        else if (ratio >= 1.5)
          score += 10; // comfortable
        else if (ratio >= 1.0)
          score += 0; // just above threshold
        else if (ratio >= 0.5)
          score -= 15; // getting low
        else
          score -= 25; // dangerously low
      }

      // 3. Days Remaining (±20 pts)
      if (daysLeft >= 60)
        score += 20;
      else if (daysLeft >= 30)
        score += 8;
      else if (daysLeft >= 14)
        score -= 5;
      else if (daysLeft >= 7)
        score -= 15;
      else
        score -= 20; // < 7 days → strong bury

      // Clamp to 0–100
      score = Math.max(0, Math.min(100, score));

      // ─── STATUS ASSIGNMENT ────────────────────────────────────
      String status;
      if (score > 70)
        status = 'Boosted';
      else if (score < 30)
        status = 'Buried';
      else
        status = 'Normal';

      p.Visibility_Score__c = score;
      p.Stock_Status__c = status;
      toUpdate.add(p);
    }

    if (!toUpdate.isEmpty()) {
      update toUpdate;
      System.debug(
        'BoostBuryEngine: updated ' + toUpdate.size() + ' products.'
      );
    }
  }
}
