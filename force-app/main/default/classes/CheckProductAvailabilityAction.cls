public without sharing class CheckProductAvailabilityAction {
  public class Input {
    @InvocableVariable(
      required=true
      description='Product name or partial product name to check availability for.'
    )
    public String productName;
    @InvocableVariable(
      description='Quantity the sales rep or customer wants to order. Default is 1.'
    )
    public Integer requestedQuantity;
  }

  public class Output {
    @InvocableVariable(
      description='Fulfillment verdict: YES (safe to commit), TIGHT (possible but risky), or NO (insufficient stock).'
    )
    public String canFulfill;
    @InvocableVariable(description='Current physical stock level in units.')
    public Integer stockLevel;
    @InvocableVariable(description='Units already committed in open quotes.')
    public Integer committedUnits;
    @InvocableVariable(
      description='Effective available stock after subtracting committed units.'
    )
    public Integer effectiveStock;
    @InvocableVariable(
      description='Current risk classification: Critical, At Risk, Healthy, or Overstock.'
    )
    public String riskLevel;
    @InvocableVariable(
      description='Days of stock remaining at current sales velocity.'
    )
    public Integer daysRemaining;
    @InvocableVariable(
      description='Number of open quotes currently competing for this product\'s stock.'
    )
    public Integer openQuoteCount;
    @InvocableVariable(
      description='Advisor recommendation text explaining the availability situation.'
    )
    public String recommendation;
  }

  @InvocableMethod(
    label='Check Product Stock Availability'
    description='Checks whether a specific product can be fulfilled for a given quantity. Returns stock level, committed units from open quotes, effective available stock, and a clear YES/TIGHT/NO verdict with a recommendation. Use when a sales rep asks if we can fulfill an order, or when a customer asks about product availability.'
  )
  public static List<Output> checkAvailability(List<Input> inputs) {
    Input inp = inputs[0];
    Integer requested = (inp.requestedQuantity != null &&
      inp.requestedQuantity > 0)
      ? inp.requestedQuantity
      : 1;

    List<Product2> products = [
      SELECT Id, Name
      FROM Product2
      WHERE Name LIKE :('%' + inp.productName + '%') AND IsActive = TRUE
      LIMIT 1
    ];

    Output out = new Output();
    if (products.isEmpty()) {
      out.canFulfill = 'NO';
      out.stockLevel = 0;
      out.committedUnits = 0;
      out.effectiveStock = 0;
      out.riskLevel = 'Unknown';
      out.daysRemaining = 0;
      out.openQuoteCount = 0;
      out.recommendation =
        'Product "' +
        inp.productName +
        '" not found in the catalog. Please verify the product name.';
      return new List<Output>{ out };
    }

    Id productId = products[0].Id;
    String productName = products[0].Name;

    List<Stock__c> stocks = [
      SELECT
        Quantity_Available__c,
        Daily_Velocity__c,
        Days_Remaining__c,
        Risk_Level__c,
        Reorder_Threshold__c
      FROM Stock__c
      WHERE Product__c = :productId
      LIMIT 1
    ];

    if (stocks.isEmpty()) {
      out.canFulfill = 'NO';
      out.recommendation =
        'No stock record found for ' +
        productName +
        '. Contact inventory management.';
      return new List<Output>{ out };
    }

    Stock__c s = stocks[0];
    Integer stock = Integer.valueOf(s.Quantity_Available__c ?? 0);

    // Committed units from open quotes
    AggregateResult[] ar = [
      SELECT SUM(Quantity__c) qty, COUNT_DISTINCT(Quote__c) cnt
      FROM NexusQuoteLineItem__c
      WHERE
        Product__c = :productId
        AND Quote__r.Status__c NOT IN (
          'Accepted',
          'Rejected',
          'Signed',
          'Expired'
        )
    ];
    Integer committed = ar.isEmpty()
      ? 0
      : Integer.valueOf((Decimal) (ar[0].get('qty')) ?? 0);
    Integer quoteCount = ar.isEmpty()
      ? 0
      : Integer.valueOf((Decimal) (ar[0].get('cnt')) ?? 0);
    Integer effective = Math.max(0, stock - committed);

    out.stockLevel = stock;
    out.committedUnits = committed;
    out.effectiveStock = effective;
    out.riskLevel = s.Risk_Level__c ?? 'Unknown';
    out.daysRemaining = s.Days_Remaining__c != null
      ? Integer.valueOf(s.Days_Remaining__c)
      : null;
    out.openQuoteCount = quoteCount;

    // Verdict
    if (effective >= requested) {
      if (effective - requested < (s.Reorder_Threshold__c ?? 10)) {
        out.canFulfill = 'TIGHT';
        out.recommendation =
          'TIGHT — ' +
          productName +
          ': ' +
          stock +
          ' units in stock, ' +
          committed +
          ' committed in ' +
          quoteCount +
          ' open quote(s), ' +
          effective +
          ' effectively available. ' +
          'The requested ' +
          requested +
          ' unit(s) can be fulfilled but will bring stock below the reorder threshold. ' +
          'Recommend placing a reorder immediately after committing.';
      } else {
        out.canFulfill = 'YES';
        out.recommendation =
          'YES — ' +
          productName +
          ': ' +
          effective +
          ' units available after ' +
          committed +
          ' committed unit(s) in open quotes. ' +
          'Safe to commit ' +
          requested +
          ' unit(s). ' +
          (s.Days_Remaining__c != null
            ? Integer.valueOf(s.Days_Remaining__c) +
              ' days of stock remaining at current velocity.'
            : '');
      }
    } else {
      out.canFulfill = 'NO';
      out.recommendation =
        'NO — ' +
        productName +
        ': only ' +
        effective +
        ' units effectively available ' +
        '(' +
        stock +
        ' in stock, ' +
        committed +
        ' committed in ' +
        quoteCount +
        ' open quote(s)). ' +
        'Cannot fulfill ' +
        requested +
        ' unit(s). ' +
        'Check with procurement for estimated restock date.';
    }
    return new List<Output>{ out };
  }
}
