public without sharing class BehavioralSignalSeeder {
  // Seeds realistic behavioral signals on all accounts that have a CustomerTier__c.
  // Values are tier-correlated but noisy enough for the model to learn real patterns.
  // Run via Anonymous Apex: BehavioralSignalSeeder.seed();
  public static void seed() {
    List<Account> accounts = [
      SELECT Id, CustomerTier__c
      FROM Account
      WHERE CustomerTier__c != NULL
      LIMIT 10000
    ];

    Long seed = System.currentTimeMillis();
    List<Account> toUpdate = new List<Account>();

    for (Account acc : accounts) {
      seed = Math.mod(seed * 1664525 + 1013904223, 4294967296L);
      Integer r = (Integer) Math.abs(Math.mod(seed, 100)); // 0–99

      seed = Math.mod(seed * 1664525 + 1013904223, 4294967296L);
      Integer r2 = (Integer) Math.abs(Math.mod(seed, 100));

      seed = Math.mod(seed * 1664525 + 1013904223, 4294967296L);
      Integer r3 = (Integer) Math.abs(Math.mod(seed, 100));

      String tier = acc.CustomerTier__c;

      if (tier == 'Platinum') {
        acc.AvgOrderValue__c = 18000 + Math.mod(r * 317, 32000); // 18k–50k
        acc.DistinctProductsPurchased__c = 8 + Math.mod(r2, 8); // 8–15
        acc.QuoteAcceptanceRate__c = 65 + Math.mod(r3, 31); // 65–95%
        acc.DaysSinceLastPurchase__c = 1 + Math.mod(r, 45); // 1–45d
        acc.Complaints12Months__c = Math.mod(r2, 3); // 0–2
      } else if (tier == 'Gold') {
        acc.AvgOrderValue__c = 5000 + Math.mod(r * 197, 15000); // 5k–20k
        acc.DistinctProductsPurchased__c = 4 + Math.mod(r2, 7); // 4–10
        acc.QuoteAcceptanceRate__c = 38 + Math.mod(r3, 33); // 38–70%
        acc.DaysSinceLastPurchase__c = 20 + Math.mod(r, 80); // 20–99d
        acc.Complaints12Months__c = Math.mod(r2, 4); // 0–3
      } else {
        // Standard
        acc.AvgOrderValue__c = 500 + Math.mod(r * 113, 6500); // 500–7k
        acc.DistinctProductsPurchased__c = 1 + Math.mod(r2, 5); // 1–5
        acc.QuoteAcceptanceRate__c = 8 + Math.mod(r3, 38); // 8–45%
        acc.DaysSinceLastPurchase__c = 60 + Math.mod(r, 241); // 60–300d
        acc.Complaints12Months__c = 1 + Math.mod(r2, 5); // 1–5
      }

      toUpdate.add(acc);
    }

    if (!toUpdate.isEmpty()) {
      update toUpdate;
      System.debug(
        'BehavioralSignalSeeder: seeded ' + toUpdate.size() + ' accounts.'
      );
    }
  }
}
