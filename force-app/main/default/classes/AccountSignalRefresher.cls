public without sharing class AccountSignalRefresher implements Schedulable {
  public void execute(SchedulableContext ctx) {
    run();
  }

  @AuraEnabled
  public static void run() {
    Date cutoff12m = Date.today().addYears(-1);

    // ── 1. Average Order Value + Last Purchase Date ───────────────────────
    Map<Id, Decimal> avgOrderValueMap = new Map<Id, Decimal>();
    Map<Id, Date> lastPurchaseDateMap = new Map<Id, Date>();

    for (AggregateResult ar : [
      SELECT AccountId, AVG(TotalAmount) avgVal, MAX(EffectiveDate) lastDate
      FROM Order
      WHERE AccountId != NULL AND Status = 'Activated'
      GROUP BY AccountId
    ]) {
      Id accId = (Id) ar.get('AccountId');
      avgOrderValueMap.put(accId, (Decimal) ar.get('avgVal'));
      lastPurchaseDateMap.put(accId, (Date) ar.get('lastDate'));
    }

    // ── 2. Distinct Products Purchased ────────────────────────────────────
    // SOQL doesn't support COUNT(DISTINCT) on related fields — aggregate in Apex
    Map<Id, Set<Id>> productSetMap = new Map<Id, Set<Id>>();
    for (OrderItem oi : [
      SELECT Order.AccountId, Product2Id
      FROM OrderItem
      WHERE Order.AccountId != NULL AND Order.Status = 'Activated'
      LIMIT 10000
    ]) {
      Id accId = oi.Order.AccountId;
      if (!productSetMap.containsKey(accId)) {
        productSetMap.put(accId, new Set<Id>());
      }
      productSetMap.get(accId).add(oi.Product2Id);
    }

    // ── 3. Quote Acceptance Rate ──────────────────────────────────────────
    Map<Id, Integer> quoteTotalMap = new Map<Id, Integer>();
    Map<Id, Integer> quoteAcceptedMap = new Map<Id, Integer>();

    for (AggregateResult ar : [
      SELECT Opportunity__r.AccountId accId, COUNT(Id) total
      FROM TALEXO_Quote__c
      WHERE Opportunity__c != NULL AND Opportunity__r.AccountId != NULL
      GROUP BY Opportunity__r.AccountId
    ]) {
      Id accId = (Id) ar.get('accId');
      quoteTotalMap.put(accId, Integer.valueOf(ar.get('total')));
    }

    for (AggregateResult ar : [
      SELECT Opportunity__r.AccountId accId, COUNT(Id) accepted
      FROM TALEXO_Quote__c
      WHERE
        Opportunity__c != NULL
        AND Opportunity__r.AccountId != NULL
        AND Status__c IN ('Accepted', 'Signed', 'Accepté', 'Signé')
      GROUP BY Opportunity__r.AccountId
    ]) {
      Id accId = (Id) ar.get('accId');
      quoteAcceptedMap.put(accId, Integer.valueOf(ar.get('accepted')));
    }

    // ── 4. Complaints Last 12 Months ──────────────────────────────────────
    Map<Id, Integer> complaintsMap = new Map<Id, Integer>();
    for (AggregateResult ar : [
      SELECT AccountId, COUNT(Id) total
      FROM Case
      WHERE AccountId != NULL AND CreatedDate >= :cutoff12m
      GROUP BY AccountId
    ]) {
      Id accId = (Id) ar.get('AccountId');
      complaintsMap.put(accId, Integer.valueOf(ar.get('total')));
    }

    // ── 5. Build update list ──────────────────────────────────────────────
    List<Account> toUpdate = new List<Account>();

    Set<Id> allAccountIds = new Set<Id>();
    allAccountIds.addAll(avgOrderValueMap.keySet());
    allAccountIds.addAll(productSetMap.keySet());
    allAccountIds.addAll(quoteTotalMap.keySet());
    allAccountIds.addAll(complaintsMap.keySet());

    for (Id accId : allAccountIds) {
      Account acc = new Account(Id = accId);

      // Avg order value
      acc.AvgOrderValue__c = avgOrderValueMap.containsKey(accId)
        ? (avgOrderValueMap.get(accId) ?? 0).setScale(2)
        : 0;

      // Distinct products
      acc.DistinctProductsPurchased__c = productSetMap.containsKey(accId)
        ? productSetMap.get(accId).size()
        : 0;

      // Days since last purchase
      if (
        lastPurchaseDateMap.containsKey(accId) &&
        lastPurchaseDateMap.get(accId) != null
      ) {
        acc.DaysSinceLastPurchase__c = lastPurchaseDateMap.get(accId)
          .daysBetween(Date.today());
      } else {
        acc.DaysSinceLastPurchase__c = 999;
      }

      // Quote acceptance rate
      Integer total = quoteTotalMap.containsKey(accId)
        ? quoteTotalMap.get(accId)
        : 0;
      Integer accepted = quoteAcceptedMap.containsKey(accId)
        ? quoteAcceptedMap.get(accId)
        : 0;
      acc.QuoteAcceptanceRate__c = total > 0
        ? ((Decimal) accepted / total * 100).setScale(1)
        : 0;

      // Complaints
      acc.Complaints12Months__c = complaintsMap.containsKey(accId)
        ? complaintsMap.get(accId)
        : 0;

      toUpdate.add(acc);
    }

    if (!toUpdate.isEmpty()) {
      update toUpdate;
      System.debug(
        'AccountSignalRefresher: updated ' + toUpdate.size() + ' accounts'
      );
    }
  }

  // Schedule daily at 3 AM:
  // System.schedule('Account Signal Refresher', '0 0 3 * * ?', new AccountSignalRefresher());
  public static void scheduleDaily() {
    System.schedule(
      'Account Signal Refresher',
      '0 0 3 * * ?',
      new AccountSignalRefresher()
    );
  }
}
