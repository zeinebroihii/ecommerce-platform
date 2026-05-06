public without sharing class BundleSuggestionEngine {
  // v2
  private static final Integer MAX_SUGGESTIONS = 50;
  private static final Decimal MIN_PAIR_SCORE = 40;

  public static void generateSuggestions() {
    List<Product2> boosted = [
      SELECT
        Id,
        Name,
        Family,
        Stock_Status__c,
        Visibility_Score__c,
        (SELECT UnitPrice FROM PricebookEntries WHERE IsActive = TRUE LIMIT 1)
      FROM Product2
      WHERE Stock_Status__c = 'Boosted' AND IsActive = TRUE
      ORDER BY Visibility_Score__c DESC
      LIMIT 30
    ];
    if (boosted.isEmpty())
      return;

    List<Product2> bestSellers = [
      SELECT
        Id,
        Name,
        Family,
        Visibility_Score__c,
        (SELECT UnitPrice FROM PricebookEntries WHERE IsActive = TRUE LIMIT 1)
      FROM Product2
      WHERE
        Stock_Status__c != 'Buried'
        AND IsActive = TRUE
        AND Visibility_Score__c >= :MIN_PAIR_SCORE
      ORDER BY Visibility_Score__c DESC
      LIMIT 20
    ];
    if (bestSellers.isEmpty())
      return;

    Set<String> existingPairs = new Set<String>();
    for (BundleSuggestion__c bs : [
      SELECT OverstockedProduct__c, PairedProduct__c
      FROM BundleSuggestion__c
      WHERE Status__c IN ('Pending', 'Approved', 'Live')
    ]) {
      existingPairs.add(bs.OverstockedProduct__c + '_' + bs.PairedProduct__c);
    }

    List<BundleSuggestion__c> toInsert = new List<BundleSuggestion__c>();

    for (Product2 overstocked : boosted) {
      Integer pairCount = 0;
      for (Product2 paired : bestSellers) {
        if (paired.Id == overstocked.Id)
          continue;
        String pairKey = overstocked.Id + '_' + paired.Id;
        if (existingPairs.contains(pairKey))
          continue;

        Decimal coScore =
          ((overstocked.Visibility_Score__c ?? 50) * 0.4) +
          ((paired.Visibility_Score__c ?? 50) * 0.6);

        Decimal discount = calculateDiscount(overstocked.Visibility_Score__c);

        toInsert.add(
          new BundleSuggestion__c(
            OverstockedProduct__c = overstocked.Id,
            PairedProduct__c = paired.Id,
            CoOccurrenceScore__c = coScore.setScale(2),
            SuggestedDiscount__c = discount,
            Status__c = 'Pending',
            Source__c = 'Rule-Based'
          )
        );

        existingPairs.add(pairKey);
        pairCount++;
        if (pairCount >= 3)
          break;
      }
      if (toInsert.size() >= MAX_SUGGESTIONS)
        break;
    }

    if (!toInsert.isEmpty()) {
      insert toInsert;
      System.debug(
        'BundleSuggestionEngine: inserted ' + toInsert.size() + ' suggestions'
      );
    }
  }

  public static void promoteToComboPackage(BundleSuggestion__c bs) {
    Map<Id, Product2> products = new Map<Id, Product2>(
      [
        SELECT
          Id,
          Name,
          Family,
          ProductCode,
          Image_URL__c,
          (SELECT UnitPrice FROM PricebookEntries WHERE IsActive = TRUE LIMIT 1)
        FROM Product2
        WHERE Id IN (:bs.OverstockedProduct__c, :bs.PairedProduct__c)
      ]
    );

    Product2 overstocked = products.get(bs.OverstockedProduct__c);
    Product2 paired = products.get(bs.PairedProduct__c);
    if (overstocked == null || paired == null)
      return;

    Decimal overstockedPrice = overstocked.PricebookEntries.isEmpty()
      ? 0
      : overstocked.PricebookEntries[0].UnitPrice;
    Decimal pairedPrice = paired.PricebookEntries.isEmpty()
      ? 0
      : paired.PricebookEntries[0].UnitPrice;

    String pkgName =
      'Bundle: ' +
      abbreviate(overstocked.Name) +
      ' + ' +
      abbreviate(paired.Name);

    ComboPackage__c pkg = new ComboPackage__c(
      Name = pkgName,
      Description__c = 'AI-suggested bundle. Pairs overstocked ' +
        overstocked.Name +
        ' with high-demand ' +
        paired.Name +
        '. Discount applied to clear stock.',
      DiscountPercent__c = bs.SuggestedDiscount__c,
      IsActive__c = true,
      Category__c = overstocked.Family != null ? overstocked.Family : 'Bundle'
    );
    insert pkg;

    List<ComboPackageItem__c> items = new List<ComboPackageItem__c>{
      new ComboPackageItem__c(
        ComboPackage__c = pkg.Id,
        Product__c = overstocked.Id,
        ProductName__c = overstocked.Name,
        ProductPrice__c = overstockedPrice,
        ProductFamily__c = overstocked.Family,
        ProductImageUrl__c = overstocked.Image_URL__c,
        SortOrder__c = 1
      ),
      new ComboPackageItem__c(
        ComboPackage__c = pkg.Id,
        Product__c = paired.Id,
        ProductName__c = paired.Name,
        ProductPrice__c = pairedPrice,
        ProductFamily__c = paired.Family,
        ProductImageUrl__c = paired.Image_URL__c,
        SortOrder__c = 2
      )
    };
    insert items;

    System.debug(
      'BundleSuggestionEngine: promoted BS ' +
        bs.Id +
        ' → ComboPackage ' +
        pkg.Id
    );
  }

  private static Decimal calculateDiscount(Decimal visibilityScore) {
    if (visibilityScore == null)
      return 10;
    if (visibilityScore >= 90)
      return 20;
    if (visibilityScore >= 80)
      return 15;
    return 10;
  }

  private static String abbreviate(String s) {
    if (s == null)
      return '';
    return s.length() > 20 ? s.substring(0, 20) + '…' : s;
  }
}
