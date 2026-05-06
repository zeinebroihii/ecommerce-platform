public without sharing class GetProductsForBundleAction {
  public class BundleAnalysisInput {
    @InvocableVariable(
      label='Category Filter'
      description='Optional. Filter to a specific product family (e.g. Computing, Connectivity). Leave blank to analyze all products.'
      required=false
    )
    public String categoryFilter;
  }

  public class BundleAnalysisOutput {
    @InvocableVariable(
      label='Product Catalog Summary'
      description='Formatted text listing all active products with stock status, family, score, and price — ready for AI bundle analysis.'
    )
    public String catalogSummary;

    @InvocableVariable(label='Total Products Found')
    public Integer totalProducts;

    @InvocableVariable(
      label='Boosted Products Count'
      description='Number of overstocked products that need bundle pairing.'
    )
    public Integer boostedCount;
  }

  @InvocableMethod(
    label='Get Products for Bundle Analysis'
    description='Retrieves the Nexus product catalog organized by stock status. Returns a formatted text summary the agent reads to identify bundle opportunities. Call this first before suggesting any bundles.'
  )
  public static List<BundleAnalysisOutput> getProducts(
    List<BundleAnalysisInput> inputs
  ) {
    String catFilter = (inputs != null &&
      !inputs.isEmpty() &&
      inputs[0] != null)
      ? inputs[0].categoryFilter
      : null;

    List<Product2> products;
    if (String.isNotBlank(catFilter)) {
      products = [
        SELECT
          Id,
          Name,
          Family,
          Stock_Status__c,
          Visibility_Score__c,
          (SELECT UnitPrice FROM PricebookEntries WHERE IsActive = TRUE LIMIT 1)
        FROM Product2
        WHERE IsActive = TRUE AND Family = :catFilter
        ORDER BY Visibility_Score__c DESC NULLS LAST
        LIMIT 60
      ];
    } else {
      products = [
        SELECT
          Id,
          Name,
          Family,
          Stock_Status__c,
          Visibility_Score__c,
          (SELECT UnitPrice FROM PricebookEntries WHERE IsActive = TRUE LIMIT 1)
        FROM Product2
        WHERE IsActive = TRUE
        ORDER BY Visibility_Score__c DESC NULLS LAST
        LIMIT 60
      ];
    }

    Map<String, List<Product2>> grouped = new Map<String, List<Product2>>();
    Integer boosted = 0;
    for (Product2 p : products) {
      String status = p.Stock_Status__c != null ? p.Stock_Status__c : 'Unknown';
      if (!grouped.containsKey(status))
        grouped.put(status, new List<Product2>());
      grouped.get(status).add(p);
      if (status == 'Boosted')
        boosted++;
    }

    List<String> lines = new List<String>();
    lines.add(
      'NEXUS PRODUCT CATALOG — ' + products.size() + ' active products'
    );
    lines.add('');

    String[] statuses = new List<String>{
      'Boosted',
      'Active',
      'Buried',
      'Unknown'
    };
    String[] labels = new List<String>{
      'BOOSTED PRODUCTS (Overstocked — high priority for bundle discounts)',
      'ACTIVE PRODUCTS (Good candidates for pairing)',
      'BURIED PRODUCTS (Low visibility)',
      'OTHER PRODUCTS'
    };

    for (Integer i = 0; i < statuses.size(); i++) {
      List<Product2> grp = grouped.get(statuses[i]);
      if (grp == null || grp.isEmpty())
        continue;
      lines.add(labels[i] + ':');
      for (Product2 p : grp) {
        Decimal price = p.PricebookEntries.isEmpty()
          ? 0
          : p.PricebookEntries[0].UnitPrice;
        String score = p.Visibility_Score__c != null
          ? String.valueOf(p.Visibility_Score__c.setScale(0))
          : 'N/A';
        String family = p.Family != null ? p.Family : 'Uncategorized';
        lines.add(
          '  • ID:' +
            p.Id +
            ' | ' +
            p.Name +
            ' | ' +
            family +
            ' | Score:' +
            score +
            ' | $' +
            price.setScale(2)
        );
      }
      lines.add('');
    }

    lines.add('BUNDLE STRATEGY GUIDELINES:');
    lines.add(
      '- Pair BOOSTED (overstocked) products with ACTIVE high-score products'
    );
    lines.add(
      '- Prefer same or complementary families (e.g. Computing + Connectivity, Sensors + Connectivity)'
    );
    lines.add(
      '- Price balance: avoid pairing products with a price ratio greater than 10:1'
    );
    lines.add(
      '- Discount: 10% for Score <80, 15% for Score 80-89, 20% for Score 90+'
    );
    lines.add(
      '- Use the Create Bundle Suggestion action to record each recommended pair'
    );

    BundleAnalysisOutput output = new BundleAnalysisOutput();
    output.catalogSummary = String.join(lines, '\n');
    output.totalProducts = products.size();
    output.boostedCount = boosted;

    return new List<BundleAnalysisOutput>{ output };
  }
}
