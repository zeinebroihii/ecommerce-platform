public with sharing class AccountDataGenerator {
  // Generates realistic synthetic B2B accounts + Opportunities for Model Builder training
  // Run via Anonymous Apex: AccountDataGenerator.generate(350);
  // To reset: AccountDataGenerator.deleteSynthetic(); then generate again

  public static void generate(Integer count) {
    List<String> industries = new List<String>{
      'Technology',
      'Manufacturing',
      'Healthcare',
      'Finance',
      'Retail',
      'Energy',
      'Transportation',
      'Construction',
      'Education',
      'Consulting'
    };
    List<String> countries = new List<String>{
      'France',
      'Germany',
      'Belgium',
      'Switzerland',
      'Spain',
      'Italy',
      'Netherlands',
      'Luxembourg',
      'Portugal',
      'Austria'
    };
    List<String> suffixes = new List<String>{
      'SA',
      'SARL',
      'SAS',
      'GmbH',
      'BV',
      'SpA',
      'Ltd',
      'AG',
      'NV',
      'Inc'
    };

    Long seed = System.currentTimeMillis();

    // ─── INSERT ACCOUNTS ─────────────────────────────────────────
    List<Account> toInsert = new List<Account>();
    List<Integer> rValues = new List<Integer>();

    for (Integer i = 0; i < count; i++) {
      seed = Math.mod(seed * 1664525 + 1013904223, 4294967296L);
      Integer r = (Integer) Math.abs(Math.mod(seed, 1000));
      rValues.add(r);

      String industry = industries[Math.mod(i, industries.size())];
      String country = countries[Math.mod(i + 3, countries.size())];
      String suffix = suffixes[Math.mod(i + 7, suffixes.size())];

      Account acc = new Account();
      acc.Name =
        'SYNTHETIC ' +
        industry +
        ' Partenaires ' +
        (i + 1) +
        ' ' +
        suffix;
      acc.Industry = industry;
      acc.BillingCountry = country;
      acc.NumberOfEmployees = 10 + Math.mod(r, 490);
      acc.AnnualRevenue = 50000 + Math.mod(r * 317, 950000);
      acc.Type = 'Customer';
      acc.Rating = (r < 200) ? 'Hot' : (r < 600) ? 'Warm' : 'Cold';
      toInsert.add(acc);
    }

    insert toInsert;
    System.debug(
      'AccountDataGenerator: inserted ' + toInsert.size() + ' accounts.'
    );

    // ─── INSERT OPPORTUNITIES ─────────────────────────────────────
    // Each account gets 0–5 closed-won opportunities spread across
    // this year and last year so RevenueGrowthRate has real variation
    List<Opportunity> opps = new List<Opportunity>();
    Date today = Date.today();
    Date thisYrStart = Date.newInstance(today.year(), 1, 1);
    Date lastYrStart = Date.newInstance(today.year() - 1, 1, 1);

    for (Integer i = 0; i < toInsert.size(); i++) {
      Integer r = rValues[i];
      Integer oppCount = 1 + Math.mod(r, 5); // 1–5 opps per account (min 1)

      for (Integer j = 0; j < oppCount; j++) {
        seed = Math.mod(seed * 1664525 + 1013904223, 4294967296L);
        Integer r2 = (Integer) Math.abs(Math.mod(seed, 1000));

        Decimal amount = 5000 + Math.mod(r2 * 197, 195000);

        // Spread close dates: even j → this year, odd j → last year
        Integer dayOffset = Math.mod(r2, 300);
        Date closeDate = (Math.mod(j, 2) == 0)
          ? thisYrStart.addDays(dayOffset)
          : lastYrStart.addDays(dayOffset);
        if (closeDate > today)
          closeDate = today.addDays(-1);

        Opportunity opp = new Opportunity();
        opp.AccountId = toInsert[i].Id;
        opp.Name = toInsert[i].Name + ' - Deal ' + (j + 1);
        opp.StageName = 'Closed Won';
        opp.CloseDate = closeDate;
        opp.Amount = amount;
        opp.Probability = 10 + Math.mod(r2, 85); // 10–95% → discount proxy

        opps.add(opp);
      }
    }

    if (!opps.isEmpty()) {
      insert opps;
      System.debug(
        'AccountDataGenerator: inserted ' + opps.size() + ' opportunities.'
      );
    }

    // ─── SEED TIERS ───────────────────────────────────────────────
    CustomerTierSeeder.seedAllAccounts();
    System.debug('AccountDataGenerator: tier seeding complete.');
  }

  // Deletes all synthetic accounts (and their child Opportunities via cascade)
  public static void deleteSynthetic() {
    List<Account> synth = [
      SELECT Id
      FROM Account
      WHERE Name LIKE 'SYNTHETIC%'
    ];
    if (!synth.isEmpty()) {
      delete synth;
      System.debug(
        'AccountDataGenerator: deleted ' + synth.size() + ' synthetic accounts.'
      );
    }
  }
}
