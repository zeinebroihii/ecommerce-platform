public without sharing class TriggerStockEngineAction {
  public class Input {
    @InvocableVariable(
      description='Optional confirmation message. Pass any value to confirm execution.'
    )
    public String confirm;
  }

  public class Output {
    @InvocableVariable(
      description='Summary of what the engine calculated: product counts by risk level and top items requiring attention.'
    )
    public String summary;
    @InvocableVariable(description='Number of products processed.')
    public Integer productsProcessed;
    @InvocableVariable(
      description='Number of Critical products after recalculation.'
    )
    public Integer criticalCount;
    @InvocableVariable(
      description='Number of At Risk products after recalculation.'
    )
    public Integer atRiskCount;
    @InvocableVariable(description='Timestamp when the engine was run.')
    public String runTimestamp;
  }

  @InvocableMethod(
    label='Run Stock Velocity Engine'
    description='Triggers a fresh run of the Stock Velocity Engine which recalculates daily velocity, days remaining, and risk levels for all products using the latest 30 days of orders and current open quote commitments. Returns a summary of the results. Use when the user asks to refresh stock data, run the engine, recalculate inventory risk, or wants up-to-date stock intelligence.'
  )
  public static List<Output> runEngine(List<Input> inputs) {
    // Snapshot before
    Map<Id, String> riskBefore = new Map<Id, String>();
    for (Stock__c s : [
      SELECT Id, Risk_Level__c
      FROM Stock__c
      WHERE Product__c != NULL
    ]) {
      riskBefore.put(s.Id, s.Risk_Level__c);
    }

    // Run the engine
    StockVelocityEngine.run();

    // Read results after
    List<Stock__c> after = [
      SELECT
        Id,
        Product__r.Name,
        Risk_Level__c,
        Days_Remaining__c,
        Daily_Velocity__c
      FROM Stock__c
      WHERE Product__c != NULL
      ORDER BY Days_Remaining__c ASC NULLS LAST
    ];

    Integer critical = 0, atRisk = 0, overstock = 0, healthy = 0, changed = 0;
    List<String> topItems = new List<String>();

    for (Stock__c s : after) {
      String newRisk = s.Risk_Level__c ?? 'Healthy';
      String oldRisk = riskBefore.get(s.Id) ?? 'Healthy';
      if (newRisk != oldRisk)
        changed++;

      if (newRisk == 'Critical') {
        critical++;
        if (topItems.size() < 5) {
          topItems.add(
            '[CRITICAL] ' +
              s.Product__r.Name +
              (s.Days_Remaining__c != null
                ? ' — ' + Integer.valueOf(s.Days_Remaining__c) + ' days left'
                : '') +
              (newRisk != oldRisk ? ' ← was ' + oldRisk : '')
          );
        }
      } else if (newRisk == 'At Risk') {
        atRisk++;
        if (topItems.size() < 5) {
          topItems.add(
            '[AT RISK] ' +
              s.Product__r.Name +
              (s.Days_Remaining__c != null
                ? ' — ' + Integer.valueOf(s.Days_Remaining__c) + ' days left'
                : '') +
              (newRisk != oldRisk ? ' ← was ' + oldRisk : '')
          );
        }
      } else if (newRisk == 'Overstock') {
        overstock++;
      } else {
        healthy++;
      }
    }

    Output out = new Output();
    out.productsProcessed = after.size();
    out.criticalCount = critical;
    out.atRiskCount = atRisk;
    out.runTimestamp = DateTime.now().format('MMM d, yyyy HH:mm');

    String changeLine = changed > 0
      ? changed + ' product(s) changed risk level since last run.\n'
      : 'No risk level changes since last run.\n';

    out.summary =
      'STOCK ENGINE RUN — ' +
      out.runTimestamp +
      '\n' +
      '─────────────────────────────────\n' +
      out.productsProcessed +
      ' products processed\n' +
      'Critical: ' +
      critical +
      '  |  At Risk: ' +
      atRisk +
      '  |  Overstock: ' +
      overstock +
      '  |  Healthy: ' +
      healthy +
      '\n' +
      changeLine +
      (topItems.isEmpty()
        ? '\nAll products are in a healthy or overstock state.'
        : '\nTop items requiring attention:\n' + String.join(topItems, '\n'));

    return new List<Output>{ out };
  }
}
