/**
 * RecommendationController
 *
 * Agentforce-powered product recommendation engine for logged-in portal users.
 *
 * Flow:
 *  1. Fetch current user's Account (via ContactId)
 *  2. Load purchase history (OrderItems) + quote line items for that Account
 *  3. Load browse history passed from sessionStorage by the LWC
 *  4. Score every active Product2 (rule-based, 0-100)
 *  5. For the top-N products, call Einstein Prompt Builder to generate a
 *     French personalised reason string
 *  6. Persist results to AI_Recommendation__c (upsert by Customer+Product)
 *  7. Return the enriched list to the LWC
 *
 * Prompt Template name (must exist in Setup → Prompt Builder):
 *   API name: Nexus_Product_Recommendation
 */
public without sharing class RecommendationController {
  // ── Constants ─────────────────────────────────────────────────────────────

  private static final Integer TOP_N = 6; // how many recs to surface
  private static final String TEMPLATE_API = 'Nexus_Product_Recommendation';

  // ── Public DTO ────────────────────────────────────────────────────────────

  public class RecommendationResult {
    @AuraEnabled
    public String productId;
    @AuraEnabled
    public String productName;
    @AuraEnabled
    public String productFamily;
    @AuraEnabled
    public String subcategory;
    @AuraEnabled
    public String brand;
    @AuraEnabled
    public Decimal price;
    @AuraEnabled
    public String imageUrl;
    @AuraEnabled
    public Decimal rating;
    @AuraEnabled
    public Integer score;
    @AuraEnabled
    public String reason; // AI-generated French text
    @AuraEnabled
    public String recType; // Cross-Sell | Up-Sell | Similar
  }

  // ── Entry point called by LWC ─────────────────────────────────────────────

  /**
   * @param cartJson       JSON array from sessionStorage ecomm_cart
   * @param browseJson     JSON array from sessionStorage nexus_browse_history
   */
  @AuraEnabled
  public static List<RecommendationResult> getRecommendations(
    String cartJson,
    String browseJson
  ) {
    // 1. Identify account for current logged-in portal user
    Id accountId = resolveAccountId();
    if (accountId == null)
      return new List<RecommendationResult>();

    // 2. Parse inputs from LWC
    List<Object> cartItems = parseJsonArray(cartJson);
    List<Object> browseItems = parseJsonArray(browseJson);
    Set<String> cartIds = extractProductIds(cartItems, 'productId');
    Set<String> browseIds = extractProductIds(browseItems, 'productId');

    // 3. Purchase + quote history for this account
    Set<String> purchasedIds = getPurchasedProductIds(accountId);
    Map<String, Integer> familyCount = getFamilyPurchaseCounts(accountId);
    Map<String, Integer> subCatCount = getSubcategoryBrowseCounts(browseItems);

    // 4. Load all active products (exclude already in cart)
    List<Product2> candidates = [
      SELECT
        Id,
        Name,
        Family,
        Subcategory__c,
        Brand__c,
        Price__c,
        Image_URL__c,
        Rating__c,
        AvailabilityStatus__c,
        IsNew__c,
        Description
      FROM Product2
      WHERE IsActive = TRUE AND Id NOT IN :cartIds
      ORDER BY Rating__c DESC NULLS LAST
      LIMIT 200
    ];

    // 5. Score every candidate and pre-assign type
    List<ScoredProduct> scored = new List<ScoredProduct>();
    for (Product2 p : candidates) {
      Integer s = scoreProduct(
        p,
        purchasedIds,
        browseIds,
        cartItems,
        familyCount,
        subCatCount
      );
      if (s > 0) {
        String t = deriveRecType(
          p,
          purchasedIds,
          cartItems,
          browseIds,
          familyCount,
          subCatCount
        );
        scored.add(new ScoredProduct(p, s, t));
      }
    }

    // Sort descending by score
    scored.sort();

    // 6. Balanced selection: up to 2 per type, then fill remaining with highest score
    List<ScoredProduct> selected = new List<ScoredProduct>();
    Map<String, Integer> typeCounts = new Map<String, Integer>{
      'Cross-Sell' => 0,
      'Up-Sell' => 0,
      'Similar' => 0
    };
    Integer perTypeMax = 2;
    // First pass: up to perTypeMax per type
    for (ScoredProduct sp : scored) {
      Integer cnt = typeCounts.get(sp.recType) ?? 0;
      if (cnt < perTypeMax && selected.size() < TOP_N) {
        selected.add(sp);
        typeCounts.put(sp.recType, cnt + 1);
      }
    }
    // Second pass: fill remaining slots with any highest-score products not yet added
    if (selected.size() < TOP_N) {
      Set<Id> selectedIds = new Set<Id>();
      for (ScoredProduct s : selected)
        selectedIds.add(s.product.Id);
      for (ScoredProduct sp : scored) {
        if (selected.size() >= TOP_N)
          break;
        if (!selectedIds.contains(sp.product.Id)) {
          selected.add(sp);
          selectedIds.add(sp.product.Id);
        }
      }
    }

    // 7. Generate AI reasons for selected products
    List<RecommendationResult> results = new List<RecommendationResult>();
    for (ScoredProduct sp : selected) {
      String recType = sp.recType;
      String reason = generateAIReason(
        sp.product,
        recType,
        accountId,
        cartItems,
        browseItems,
        familyCount
      );

      RecommendationResult rr = new RecommendationResult();
      rr.productId = sp.product.Id;
      rr.productName = sp.product.Name;
      rr.productFamily = sp.product.Family;
      rr.subcategory = sp.product.Subcategory__c;
      rr.brand = sp.product.Brand__c;
      rr.price = sp.product.Price__c;
      rr.imageUrl = sp.product.Image_URL__c;
      rr.rating = sp.product.Rating__c;
      rr.score = sp.score;
      rr.reason = reason;
      rr.recType = recType;
      results.add(rr);
    }

    // 8. Persist to AI_Recommendation__c (non-blocking — results returned regardless)
    try {
      persistRecommendations(accountId, results);
    } catch (Exception ex) {
      System.debug(
        '[RecommendationController] Persist skipped: ' + ex.getMessage()
      );
    }

    return results;
  }

  // ── Scoring engine ────────────────────────────────────────────────────────

  private static Integer scoreProduct(
    Product2 p,
    Set<String> purchasedIds,
    Set<String> browseIds,
    List<Object> cartItems,
    Map<String, Integer> familyCount,
    Map<String, Integer> subCatCount
  ) {
    Integer score = 0;

    // +30 same family as something already purchased
    if (p.Family != null && familyCount.containsKey(p.Family)) {
      score += 30;
    }

    // +25 same subcategory as a browsed product
    if (p.Subcategory__c != null && subCatCount.containsKey(p.Subcategory__c)) {
      score += 25;
    }

    // +20 cross-sell: complements cart family (different subcategory)
    Set<String> cartFamilies = extractFamilies(cartItems);
    if (
      !cartFamilies.isEmpty() &&
      p.Family != null &&
      !cartFamilies.contains(p.Family)
    ) {
      score += 20;
    }

    // +15 high rating
    if (p.Rating__c != null && p.Rating__c >= 4.5) {
      score += 15;
    }

    // +10 browsed product (was viewed but not purchased)
    if (browseIds.contains(p.Id) && !purchasedIds.contains(p.Id)) {
      score += 10;
    }

    // +8 new product — boost discovery
    if (p.IsNew__c == true) {
      score += 8;
    }

    // +5 in stock
    if (p.AvailabilityStatus__c == 'En stock') {
      score += 5;
    }

    // -20 already purchased — avoid redundancy
    if (purchasedIds.contains(p.Id)) {
      score -= 20;
    }

    return Math.max(score, 0);
  }

  private static String deriveRecType(
    Product2 p,
    Set<String> purchasedIds,
    List<Object> cartItems,
    Set<String> browseIds,
    Map<String, Integer> familyCount,
    Map<String, Integer> subCatCount
  ) {
    Set<String> cartFamilies = extractFamilies(cartItems);

    // Up-Sell: user already bought something in this family → suggest upgrade
    if (
      p.Family != null &&
      familyCount.containsKey(p.Family) &&
      !purchasedIds.contains(p.Id)
    ) {
      return 'Up-Sell';
    }

    // Cross-Sell: product is in a different family from the cart / browsed families
    Set<String> browseFamilies = new Set<String>();
    for (String fam : familyCount.keySet())
      browseFamilies.add(fam);
    if (
      !cartFamilies.isEmpty() &&
      p.Family != null &&
      !cartFamilies.contains(p.Family)
    ) {
      return 'Cross-Sell';
    }
    // Cross-Sell from browse: browsed a different family, suggest complement
    if (
      !browseFamilies.isEmpty() &&
      p.Family != null &&
      !browseFamilies.contains(p.Family)
    ) {
      return 'Cross-Sell';
    }

    // Up-Sell via browse: product browsed, same subcategory, not yet purchased
    if (
      p.Subcategory__c != null &&
      subCatCount.containsKey(p.Subcategory__c) &&
      !purchasedIds.contains(p.Id)
    ) {
      return 'Up-Sell';
    }

    return 'Similar';
  }

  // ── Einstein Prompt Builder call ──────────────────────────────────────────

  private static String generateAIReason(
    Product2 p,
    String recType,
    Id accountId,
    List<Object> cartItems,
    List<Object> browseItems,
    Map<String, Integer> familyCount
  ) {
    try {
      // Build a plain-text context summary to pass as input params
      String cartSummary = buildCartSummary(cartItems);
      String browseSummary = buildBrowseSummary(browseItems);

      // Fetch account name for personalisation
      String accountName = '';
      List<Account> accs = [
        SELECT Name
        FROM Account
        WHERE Id = :accountId
        LIMIT 1
      ];
      if (!accs.isEmpty())
        accountName = accs[0].Name;

      ConnectApi.EinsteinPromptTemplateGenerationsInput promptInput = new ConnectApi.EinsteinPromptTemplateGenerationsInput();
      promptInput.isPreview = false;
      promptInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
      promptInput.additionalConfig.applicationName = 'PromptTemplateGenerationsInvocable';

      // Merge product name + family + rec type into one input (5-input limit)
      String productContext =
        p.Name +
        ' | ' +
        (p.Family != null ? p.Family : '') +
        ' | ' +
        recType;

      // Summarise purchase activity for context
      String customerActivity =
        'Famille principale achetée: ' +
        (familyCount != null && !familyCount.isEmpty()
          ? String.join(new List<String>(familyCount.keySet()), ', ')
          : 'aucune');

      Map<String, ConnectApi.WrappedValue> valueMap = new Map<String, ConnectApi.WrappedValue>();

      valueMap.put('Input:CustomerName', wrapString(accountName));
      valueMap.put('Input:CustomerActivity', wrapString(customerActivity));
      valueMap.put('Input:CartContext', wrapString(cartSummary));
      valueMap.put('Input:BrowseContext', wrapString(browseSummary));
      valueMap.put('Input:ProductContext', wrapString(productContext));

      promptInput.inputParams = valueMap;

      ConnectApi.EinsteinPromptTemplateGenerationsRepresentation response = ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
        TEMPLATE_API,
        promptInput
      );

      if (
        response != null &&
        response.generations != null &&
        !response.generations.isEmpty()
      ) {
        return response.generations[0].text;
      }
    } catch (Exception ex) {
      // Prompt Builder not available or template missing — fall back
      System.debug(
        '[RecommendationController] Prompt Builder error: ' + ex.getMessage()
      );
    }

    // Fallback: rule-based French reason
    return buildFallbackReason(p, recType);
  }

  private static String buildFallbackReason(Product2 p, String recType) {
    String family = p.Family != null ? p.Family : 'technologie';
    if (recType == 'Cross-Sell') {
      return 'Ce produit ' +
        family +
        ' complète idéalement votre sélection actuelle.';
    }
    if (recType == 'Up-Sell') {
      return 'Une alternative premium avec de meilleures performances pour votre usage.';
    }
    return 'Produit similaire très apprécié par des clients ayant le même profil.';
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private static void persistRecommendations(
    Id accountId,
    List<RecommendationResult> results
  ) {
    // Deactivate previous recommendations for this customer
    List<AI_Recommendation__c> old = [
      SELECT Id
      FROM AI_Recommendation__c
      WHERE Customer__c = :accountId AND Is_Active__c = TRUE
    ];
    for (AI_Recommendation__c r : old)
      r.Is_Active__c = false;
    if (!old.isEmpty())
      update old;

    // Insert fresh recommendations
    List<AI_Recommendation__c> toInsert = new List<AI_Recommendation__c>();
    Integer rank = 1;
    for (RecommendationResult rr : results) {
      toInsert.add(
        new AI_Recommendation__c(
          Name = 'REC-' + rr.productId.substring(0, 8),
          Customer__c = accountId,
          Product__c = rr.productId,
          Score__c = rr.score,
          Reason__c = rr.reason,
          Is_Active__c = true,
          Generated_Date__c = Date.today(),
          Type__c = rr.recType,
          Rank__c = rank++
        )
      );
    }
    if (!toInsert.isEmpty())
      insert toInsert;
  }

  // ── Data helpers ──────────────────────────────────────────────────────────

  private static Id resolveAccountId() {
    try {
      User u = [
        SELECT ContactId, Contact.AccountId
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
      ];
      return u.Contact?.AccountId;
    } catch (Exception e) {
      return null;
    }
  }

  private static Set<String> getPurchasedProductIds(Id accountId) {
    Set<String> ids = new Set<String>();
    for (OrderItem oi : [
      SELECT Product2Id
      FROM OrderItem
      WHERE Order.AccountId = :accountId AND Order.Status = 'Activated'
    ]) {
      ids.add(oi.Product2Id);
    }
    // Also include accepted quote line items (portal user may lack object access — safe fallback)
    try {
      for (NexusQuoteLineItem__c li : [
        SELECT Product__c
        FROM NexusQuoteLineItem__c
        WHERE
          Quote__r.Opportunity__r.AccountId = :accountId
          AND Quote__r.Status__c = 'Accepted'
      ]) {
        if (li.Product__c != null)
          ids.add(li.Product__c);
      }
    } catch (Exception ex) {
      System.debug(
        '[RecommendationController] QuoteLineItem query skipped: ' +
        ex.getMessage()
      );
    }
    return ids;
  }

  private static Map<String, Integer> getFamilyPurchaseCounts(Id accountId) {
    Map<String, Integer> counts = new Map<String, Integer>();
    for (OrderItem oi : [
      SELECT Product2.Family
      FROM OrderItem
      WHERE Order.AccountId = :accountId AND Order.Status = 'Activated'
    ]) {
      String fam = oi.Product2.Family;
      if (fam != null) {
        counts.put(fam, (counts.get(fam) ?? 0) + 1);
      }
    }
    return counts;
  }

  private static Map<String, Integer> getSubcategoryBrowseCounts(
    List<Object> browseItems
  ) {
    Map<String, Integer> counts = new Map<String, Integer>();
    for (Object item : browseItems) {
      Map<String, Object> m = (Map<String, Object>) item;
      String sub = (String) m.get('subcategory');
      if (sub != null) {
        counts.put(sub, (counts.get(sub) ?? 0) + 1);
      }
    }
    return counts;
  }

  private static Set<String> extractProductIds(
    List<Object> items,
    String field
  ) {
    Set<String> ids = new Set<String>();
    for (Object item : items) {
      Map<String, Object> m = (Map<String, Object>) item;
      Object id = m.get(field);
      if (id != null)
        ids.add((String) id);
    }
    return ids;
  }

  private static Set<String> extractFamilies(List<Object> cartItems) {
    Set<String> families = new Set<String>();
    for (Object item : cartItems) {
      Map<String, Object> m = (Map<String, Object>) item;
      Object fam = m.get('family');
      if (fam != null)
        families.add((String) fam);
    }
    return families;
  }

  private static List<Object> parseJsonArray(String jsonStr) {
    if (String.isBlank(jsonStr))
      return new List<Object>();
    try {
      return (List<Object>) JSON.deserializeUntyped(jsonStr);
    } catch (Exception e) {
      return new List<Object>();
    }
  }

  private static String buildCartSummary(List<Object> cartItems) {
    List<String> names = new List<String>();
    for (Object item : cartItems) {
      Map<String, Object> m = (Map<String, Object>) item;
      Object name = m.get('name');
      if (name != null)
        names.add((String) name);
    }
    return names.isEmpty() ? 'panier vide' : String.join(names, ', ');
  }

  private static String buildBrowseSummary(List<Object> browseItems) {
    List<String> names = new List<String>();
    Integer max = Math.min(5, browseItems.size());
    for (Integer i = 0; i < max; i++) {
      Map<String, Object> m = (Map<String, Object>) browseItems[i];
      Object name = m.get('name');
      if (name != null)
        names.add((String) name);
    }
    return names.isEmpty() ? 'aucune navigation' : String.join(names, ', ');
  }

  private static ConnectApi.WrappedValue wrapString(String val) {
    ConnectApi.WrappedValue wv = new ConnectApi.WrappedValue();
    wv.value = val != null ? val : '';
    return wv;
  }

  // ── Inner sort wrapper ────────────────────────────────────────────────────

  private class ScoredProduct implements Comparable {
    public Product2 product;
    public Integer score;
    public String recType;

    public ScoredProduct(Product2 p, Integer s, String t) {
      this.product = p;
      this.score = s;
      this.recType = t;
    }

    public Integer compareTo(Object other) {
      ScoredProduct o = (ScoredProduct) other;
      return o.score - this.score; // descending
    }
  }
}
