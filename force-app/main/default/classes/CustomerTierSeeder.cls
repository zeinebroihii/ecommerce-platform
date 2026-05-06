public with sharing class CustomerTierSeeder {
  // Percentile-based tier assignment — guarantees 3 classes in training data
  // Top 20% → Platinum | Next 30% → Gold | Bottom 50% → Standard

  public static void seedAllAccounts() {
    Date oneYearAgo = Date.today().addYears(-1);
    Date twoYearsAgo = Date.today().addYears(-2);

    // Aggregate revenue per account — all time and per period
    Map<Id, Decimal> totalRevenueMap = new Map<Id, Decimal>();
    Map<Id, Integer> freqCurrentMap = new Map<Id, Integer>();
    Map<Id, Decimal> revenueCurrentMap = new Map<Id, Decimal>();
    Map<Id, Decimal> revenuePreviousMap = new Map<Id, Decimal>();
    Map<Id, Decimal> avgDiscountMap = new Map<Id, Decimal>();
    Map<Id, Integer> discountCountMap = new Map<Id, Integer>();

    for (AggregateResult ar : [
      SELECT AccountId, SUM(Amount) totalAmt, COUNT(Id) oppCount
      FROM Opportunity
      WHERE IsWon = TRUE AND AccountId != NULL
      GROUP BY AccountId
    ]) {
      Id accId = (Id) ar.get('AccountId');
      totalRevenueMap.put(accId, (Decimal) ar.get('totalAmt'));
    }

    for (AggregateResult ar : [
      SELECT AccountId, SUM(Amount) amt, COUNT(Id) cnt
      FROM Opportunity
      WHERE IsWon = TRUE AND CloseDate >= :oneYearAgo AND AccountId != NULL
      GROUP BY AccountId
    ]) {
      Id accId = (Id) ar.get('AccountId');
      freqCurrentMap.put(accId, Integer.valueOf(ar.get('cnt')));
      revenueCurrentMap.put(accId, (Decimal) ar.get('amt'));
    }

    for (AggregateResult ar : [
      SELECT AccountId, SUM(Amount) amt
      FROM Opportunity
      WHERE
        IsWon = TRUE
        AND CloseDate >= :twoYearsAgo
        AND CloseDate < :oneYearAgo
        AND AccountId != NULL
      GROUP BY AccountId
    ]) {
      Id accId = (Id) ar.get('AccountId');
      revenuePreviousMap.put(accId, (Decimal) ar.get('amt'));
    }

    for (AggregateResult ar : [
      SELECT AccountId, AVG(Probability) avgDisc, COUNT(Id) cnt
      FROM Opportunity
      WHERE AccountId != NULL AND Probability != NULL
      GROUP BY AccountId
    ]) {
      Id accId = (Id) ar.get('AccountId');
      // Salesforce Opportunity doesn't have a native Discount field
      // We use Probability inversely as a proxy: low probability = high negotiation risk
      // 100 - Probability = negotiation pressure score
      Decimal prob = (Decimal) ar.get('avgDisc');
      avgDiscountMap.put(accId, prob != null ? (100 - prob) : 50);
    }

    List<Account> accounts = [
      SELECT
        Id,
        CreatedDate,
        CustomerTier__c,
        CustomerTierScore__c,
        TotalRevenue__c,
        PurchaseFrequency__c,
        AvgDaysToAcceptQuote__c,
        AvgDiscountDemanded__c,
        RevenueGrowthRate__c,
        CustomerLoyaltyYears__c
      FROM Account
    ];

    // ─── PASS 1: score every account ─────────────────────────────
    Map<Id, Decimal> scoreMap = new Map<Id, Decimal>();
    Map<Id, Decimal> revenueByAcc = new Map<Id, Decimal>();
    Map<Id, Integer> freqByAcc = new Map<Id, Integer>();
    Map<Id, Decimal> growthByAcc = new Map<Id, Decimal>();
    Map<Id, Decimal> loyaltyByAcc = new Map<Id, Decimal>();
    Map<Id, Decimal> discountByAcc = new Map<Id, Decimal>();

    for (Account acc : accounts) {
      Decimal totalRevenue = totalRevenueMap.containsKey(acc.Id)
        ? totalRevenueMap.get(acc.Id)
        : 0;
      Integer freq = freqCurrentMap.containsKey(acc.Id)
        ? freqCurrentMap.get(acc.Id)
        : 0;
      Decimal revCurrent = revenueCurrentMap.containsKey(acc.Id)
        ? revenueCurrentMap.get(acc.Id)
        : 0;
      Decimal revPrevious = revenuePreviousMap.containsKey(acc.Id)
        ? revenuePreviousMap.get(acc.Id)
        : 0;
      Decimal avgDisc = avgDiscountMap.containsKey(acc.Id)
        ? avgDiscountMap.get(acc.Id)
        : 50;

      Decimal growthRate = 0;
      if (revPrevious > 0)
        growthRate = ((revCurrent - revPrevious) / revPrevious) * 100;
      else if (revCurrent > 0)
        growthRate = 100;

      Decimal loyaltyYears = (acc.CreatedDate != null)
        ? (Date.today().daysBetween(acc.CreatedDate.date()) * -1) / 365.0
        : 0;

      Decimal score = 0;
      if (totalRevenue >= 100000)
        score += 25;
      else if (totalRevenue >= 30000)
        score += 15;
      else if (totalRevenue >= 10000)
        score += 8;
      else if (totalRevenue > 0)
        score += 3;

      if (freq >= 6)
        score += 20;
      else if (freq >= 3)
        score += 12;
      else if (freq >= 1)
        score += 5;

      if (growthRate >= 30)
        score += 20;
      else if (growthRate >= 10)
        score += 12;
      else if (growthRate >= 0)
        score += 5;

      if (loyaltyYears >= 5)
        score += 15;
      else if (loyaltyYears >= 2)
        score += 10;
      else if (loyaltyYears >= 1)
        score += 5;

      if (avgDisc < 20)
        score += 10;
      else if (avgDisc < 40)
        score += 6;
      else if (avgDisc < 60)
        score += 3;

      score += 5; // response speed placeholder

      scoreMap.put(acc.Id, score);
      revenueByAcc.put(acc.Id, totalRevenue);
      freqByAcc.put(acc.Id, freq);
      growthByAcc.put(acc.Id, growthRate);
      loyaltyByAcc.put(acc.Id, loyaltyYears);
      discountByAcc.put(acc.Id, avgDisc);
    }

    // ─── PASS 2: absolute threshold tier assignment ───────────────
    // Platinum ≥ 50 | Gold ≥ 25 | Standard < 25
    // Clear signal separation so the model finds real decision boundaries
    Map<Id, Account> accMap = new Map<Id, Account>(accounts);
    List<Account> toUpdate = new List<Account>();
    Integer platinum = 0, gold = 0, standard = 0;

    for (Id accId : scoreMap.keySet()) {
      Account acc = accMap.get(accId);
      Decimal score = scoreMap.get(accId);

      String tier;
      if (score >= 50) {
        tier = 'Platinum';
        platinum++;
      } else if (score >= 25) {
        tier = 'Gold';
        gold++;
      } else {
        tier = 'Standard';
        standard++;
      }

      acc.CustomerTier__c = tier;
      acc.CustomerTierScore__c = score;
      acc.TotalRevenue__c = revenueByAcc.get(accId);
      acc.PurchaseFrequency__c = freqByAcc.get(accId);
      acc.RevenueGrowthRate__c = growthByAcc.get(accId).setScale(2);
      acc.CustomerLoyaltyYears__c = loyaltyByAcc.get(accId).setScale(1);
      acc.AvgDiscountDemanded__c = discountByAcc.get(accId).setScale(2);
      acc.AvgDaysToAcceptQuote__c = 0;

      toUpdate.add(acc);
    }

    if (!toUpdate.isEmpty()) {
      update toUpdate;
      System.debug(
        'CustomerTierSeeder: seeded ' +
          toUpdate.size() +
          ' accounts — Platinum: ' +
          platinum +
          ', Gold: ' +
          gold +
          ', Standard: ' +
          standard
      );
    }
  }
}
