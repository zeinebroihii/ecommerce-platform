public with sharing class ComboPackageController {
  @AuraEnabled(cacheable=true)
  public static List<PackageWrapper> getActivePackages() {
    List<ComboPackage__c> packages = [
      SELECT
        Id,
        Name,
        Description__c,
        DiscountPercent__c,
        IsActive__c,
        Category__c,
        (
          SELECT
            Id,
            Product__c,
            ProductName__c,
            ProductImageUrl__c,
            ProductPrice__c,
            ProductFamily__c,
            SortOrder__c
          FROM Combo_Package_Items__r
          ORDER BY SortOrder__c ASC NULLS LAST
        )
      FROM ComboPackage__c
      WHERE IsActive__c = TRUE
      ORDER BY Name ASC
    ];
    List<PackageWrapper> results = new List<PackageWrapper>();
    for (ComboPackage__c pkg : packages) {
      results.add(new PackageWrapper(pkg));
    }
    return results;
  }

  @AuraEnabled(cacheable=true)
  public static List<PackageWrapper> getAllPackages() {
    List<ComboPackage__c> packages = [
      SELECT
        Id,
        Name,
        Description__c,
        DiscountPercent__c,
        IsActive__c,
        Category__c,
        (
          SELECT
            Id,
            Product__c,
            ProductName__c,
            ProductImageUrl__c,
            ProductPrice__c,
            ProductFamily__c,
            SortOrder__c
          FROM Combo_Package_Items__r
          ORDER BY SortOrder__c ASC NULLS LAST
        )
      FROM ComboPackage__c
      WITH SECURITY_ENFORCED
      ORDER BY Name ASC
    ];
    List<PackageWrapper> results = new List<PackageWrapper>();
    for (ComboPackage__c pkg : packages) {
      results.add(new PackageWrapper(pkg));
    }
    return results;
  }

  @AuraEnabled
  public static String savePackage(String packageJson) {
    Map<String, Object> pkg = (Map<String, Object>) JSON.deserializeUntyped(
      packageJson
    );

    String pkgId = (String) pkg.get('id');
    ComboPackage__c record = String.isNotBlank(pkgId)
      ? new ComboPackage__c(Id = pkgId)
      : new ComboPackage__c();

    record.Name = (String) pkg.get('name');
    record.Description__c = (String) pkg.get('description');
    record.Category__c = (String) pkg.get('category');
    record.IsActive__c = pkg.get('isActive') != null
      ? (Boolean) pkg.get('isActive')
      : true;
    record.DiscountPercent__c = pkg.get('discountPercent') != null
      ? Decimal.valueOf(String.valueOf(pkg.get('discountPercent')))
      : 10;

    upsert record;

    // Replace existing items
    delete [
      SELECT Id
      FROM ComboPackageItem__c
      WHERE ComboPackage__c = :record.Id
    ];

    List<Object> items = (List<Object>) pkg.get('items');
    if (items != null && !items.isEmpty()) {
      List<ComboPackageItem__c> newItems = new List<ComboPackageItem__c>();
      Integer sortOrder = 0;
      for (Object rawItem : items) {
        Map<String, Object> item = (Map<String, Object>) rawItem;
        ComboPackageItem__c itemRec = new ComboPackageItem__c();
        itemRec.ComboPackage__c = record.Id;
        itemRec.Product__c = (String) item.get('productId');
        itemRec.ProductName__c = (String) item.get('productName');
        itemRec.ProductImageUrl__c = (String) item.get('productImageUrl');
        itemRec.ProductFamily__c = (String) item.get('productFamily');
        itemRec.ProductPrice__c = item.get('productPrice') != null
          ? Decimal.valueOf(String.valueOf(item.get('productPrice')))
          : 0;
        itemRec.SortOrder__c = sortOrder++;
        newItems.add(itemRec);
      }
      insert newItems;
    }

    return record.Id;
  }

  @AuraEnabled
  public static void deletePackage(String packageId) {
    delete [
      SELECT Id
      FROM ComboPackageItem__c
      WHERE ComboPackage__c = :packageId
    ];
    delete new ComboPackage__c(Id = packageId);
  }

  @AuraEnabled
  public static void togglePackageActive(String packageId, Boolean isActive) {
    update new ComboPackage__c(Id = packageId, IsActive__c = isActive);
  }

  @AuraEnabled
  public static Integer generateAIBundles() {
    List<Product2> boosted = [
      SELECT
        Id,
        Name,
        Family,
        Visibility_Score__c,
        (SELECT UnitPrice FROM PricebookEntries WHERE IsActive = TRUE LIMIT 1)
      FROM Product2
      WHERE Stock_Status__c = 'Boosted' AND IsActive = TRUE
      ORDER BY Visibility_Score__c DESC NULLS LAST
      LIMIT 20
    ];
    if (boosted.isEmpty())
      return 0;

    List<Product2> candidates = [
      SELECT
        Id,
        Name,
        Family,
        Visibility_Score__c,
        (SELECT UnitPrice FROM PricebookEntries WHERE IsActive = TRUE LIMIT 1)
      FROM Product2
      WHERE Stock_Status__c != 'Buried' AND IsActive = TRUE
      ORDER BY Visibility_Score__c DESC NULLS LAST
      LIMIT 40
    ];
    if (candidates.isEmpty())
      return 0;

    Set<String> existingPairs = new Set<String>();
    for (BundleSuggestion__c bs : [
      SELECT OverstockedProduct__c, PairedProduct__c
      FROM BundleSuggestion__c
      WHERE Status__c IN ('Pending', 'Approved', 'Live')
    ]) {
      existingPairs.add(bs.OverstockedProduct__c + '_' + bs.PairedProduct__c);
    }

    Map<String, List<String>> affinityMap = new Map<String, List<String>>{
      'Computing' => new List<String>{
        'Connectivity',
        'Sensors & Monitoring',
        'Computing'
      },
      'Connectivity' => new List<String>{
        'Computing',
        'Sensors & Monitoring',
        'Connectivity'
      },
      'Sensors & Monitoring' => new List<String>{
        'Connectivity',
        'Computing',
        'Sustainability'
      },
      'Sustainability' => new List<String>{
        'Sensors & Monitoring',
        'Connectivity',
        'Sustainability'
      }
    };

    List<BundleSuggestion__c> toInsert = new List<BundleSuggestion__c>();

    for (Product2 b : boosted) {
      Decimal bPrice = b.PricebookEntries.isEmpty()
        ? 0
        : b.PricebookEntries[0].UnitPrice;
      String bFam = b.Family != null ? b.Family : '';
      List<String> affinities = affinityMap.containsKey(bFam)
        ? affinityMap.get(bFam)
        : new List<String>{ bFam };
      Integer pairCount = 0;
      for (Product2 a : candidates) {
        if (a.Id == b.Id)
          continue;
        if (existingPairs.contains(b.Id + '_' + a.Id))
          continue;
        Decimal aPrice = a.PricebookEntries.isEmpty()
          ? 0
          : a.PricebookEntries[0].UnitPrice;
        if (bPrice > 0 && aPrice > 0) {
          Decimal ratio = bPrice > aPrice ? bPrice / aPrice : aPrice / bPrice;
          if (ratio > 10)
            continue;
        }
        String aFam = a.Family != null ? a.Family : '';
        Integer affinityRank = -1;
        for (Integer i = 0; i < affinities.size(); i++) {
          if (affinities[i] == aFam) {
            affinityRank = i;
            break;
          }
        }
        if (affinityRank < 0)
          continue;

        Decimal discount = aiDiscount(b.Visibility_Score__c);
        Decimal score = 90 - (affinityRank * 5);

        toInsert.add(
          new BundleSuggestion__c(
            OverstockedProduct__c = b.Id,
            PairedProduct__c = a.Id,
            SuggestedDiscount__c = discount,
            CoOccurrenceScore__c = score,
            Status__c = 'Pending',
            Source__c = 'AI-Agent',
            AIReason__c = aiBundleReason(b, bPrice, a, aPrice, discount)
          )
        );
        existingPairs.add(b.Id + '_' + a.Id);
        pairCount++;
        if (pairCount >= 2 || toInsert.size() >= 20)
          break;
      }
      if (toInsert.size() >= 20)
        break;
    }

    if (!toInsert.isEmpty())
      insert toInsert;
    return toInsert.size();
  }

  private static Decimal aiDiscount(Decimal score) {
    if (score == null)
      return 10;
    if (score >= 90)
      return 20;
    if (score >= 80)
      return 15;
    return 10;
  }

  private static String aiBundleReason(
    Product2 b,
    Decimal bPrice,
    Product2 a,
    Decimal aPrice,
    Decimal discount
  ) {
    String bFam = b.Family != null ? b.Family : 'hardware';
    String aFam = a.Family != null ? a.Family : 'equipment';
    String bScore = b.Visibility_Score__c != null
      ? b.Visibility_Score__c.setScale(0).toPlainString()
      : 'N/A';
    String aScore = a.Visibility_Score__c != null
      ? a.Visibility_Score__c.setScale(0).toPlainString()
      : 'N/A';
    return b.Name +
      ' is overstocked (score ' +
      bScore +
      '). Bundling with ' +
      a.Name +
      ' (score ' +
      aScore +
      ', ' +
      aFam +
      ') creates a complete ' +
      bFam +
      ' + ' +
      aFam +
      ' deployment kit. A ' +
      discount.setScale(0).toPlainString() +
      '% discount clears inventory while delivering a cohesive solution to B2B buyers.';
  }

  @AuraEnabled(cacheable=true)
  public static List<SuggestionWrapper> getPendingSuggestions() {
    List<BundleSuggestion__c> recs = [
      SELECT
        Id,
        Name,
        Status__c,
        SuggestedDiscount__c,
        CoOccurrenceScore__c,
        Source__c,
        AIReason__c,
        OverstockedProduct__c,
        OverstockedProduct__r.Name,
        OverstockedProduct__r.Family,
        PairedProduct__c,
        PairedProduct__r.Name,
        PairedProduct__r.Family
      FROM BundleSuggestion__c
      WHERE Status__c IN ('Pending', 'Approved')
      ORDER BY CoOccurrenceScore__c DESC
      LIMIT 50
    ];
    List<SuggestionWrapper> out = new List<SuggestionWrapper>();
    for (BundleSuggestion__c bs : recs)
      out.add(new SuggestionWrapper(bs));
    return out;
  }

  @AuraEnabled
  public static void promoteSuggestion(String suggestionId) {
    update new BundleSuggestion__c(Id = suggestionId, Status__c = 'Live');
  }

  @AuraEnabled
  public static void dismissSuggestion(String suggestionId) {
    update new BundleSuggestion__c(Id = suggestionId, Status__c = 'Rejected');
  }

  // ── Wrappers ──────────────────────────────────────────────────────────────

  public class PackageWrapper {
    @AuraEnabled
    public String id;
    @AuraEnabled
    public String name;
    @AuraEnabled
    public String description;
    @AuraEnabled
    public Decimal discountPercent;
    @AuraEnabled
    public Boolean isActive;
    @AuraEnabled
    public String category;
    @AuraEnabled
    public List<ItemWrapper> items;
    @AuraEnabled
    public Decimal originalPrice;
    @AuraEnabled
    public Decimal totalPrice;
    @AuraEnabled
    public Decimal savings;

    public PackageWrapper(ComboPackage__c pkg) {
      this.id = pkg.Id;
      this.name = pkg.Name;
      this.description = pkg.Description__c;
      this.discountPercent = pkg.DiscountPercent__c != null
        ? pkg.DiscountPercent__c
        : 10;
      this.isActive = pkg.IsActive__c;
      this.category = pkg.Category__c;
      this.items = new List<ItemWrapper>();

      Decimal total = 0;
      for (ComboPackageItem__c item : pkg.Combo_Package_Items__r) {
        this.items.add(new ItemWrapper(item));
        total += item.ProductPrice__c != null ? item.ProductPrice__c : 0;
      }
      this.originalPrice = total;
      this.savings = total * (this.discountPercent / 100);
      this.totalPrice = total - this.savings;
    }
  }

  public class SuggestionWrapper {
    @AuraEnabled
    public String id;
    @AuraEnabled
    public String name;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public Decimal discount;
    @AuraEnabled
    public Decimal score;
    @AuraEnabled
    public String source;
    @AuraEnabled
    public String aiReason;
    @AuraEnabled
    public String overstockedProductId;
    @AuraEnabled
    public String overstockedProductName;
    @AuraEnabled
    public String overstockedProductFamily;
    @AuraEnabled
    public String pairedProductId;
    @AuraEnabled
    public String pairedProductName;
    @AuraEnabled
    public String pairedProductFamily;

    public SuggestionWrapper(BundleSuggestion__c bs) {
      this.id = bs.Id;
      this.name = bs.Name;
      this.status = bs.Status__c;
      this.discount = bs.SuggestedDiscount__c;
      this.score = bs.CoOccurrenceScore__c;
      this.source = bs.Source__c;
      this.aiReason = bs.AIReason__c;
      if (bs.OverstockedProduct__r != null) {
        this.overstockedProductId = bs.OverstockedProduct__c;
        this.overstockedProductName = bs.OverstockedProduct__r.Name;
        this.overstockedProductFamily = bs.OverstockedProduct__r.Family;
      }
      if (bs.PairedProduct__r != null) {
        this.pairedProductId = bs.PairedProduct__c;
        this.pairedProductName = bs.PairedProduct__r.Name;
        this.pairedProductFamily = bs.PairedProduct__r.Family;
      }
    }
  }

  public class ItemWrapper {
    @AuraEnabled
    public String id;
    @AuraEnabled
    public String productId;
    @AuraEnabled
    public String productName;
    @AuraEnabled
    public String productImageUrl;
    @AuraEnabled
    public Decimal productPrice;
    @AuraEnabled
    public String productFamily;
    @AuraEnabled
    public Integer sortOrder;

    public ItemWrapper(ComboPackageItem__c item) {
      this.id = item.Id;
      this.productId = item.Product__c;
      this.productName = item.ProductName__c;
      this.productImageUrl = item.ProductImageUrl__c;
      this.productPrice = item.ProductPrice__c;
      this.productFamily = item.ProductFamily__c;
      this.sortOrder = item.SortOrder__c != null
        ? Integer.valueOf(item.SortOrder__c)
        : 0;
    }
  }
}
