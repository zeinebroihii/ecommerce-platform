public with sharing class InvoiceController {
  public Order ord { get; private set; }
  public String formattedDate { get; private set; }
  public Decimal subtotal { get; private set; }
  public Decimal shippingAmount { get; private set; }
  public String formattedShipping { get; private set; }
  public Decimal sparksDiscount { get; private set; }
  public Boolean hasSparksDiscount { get; private set; }

  public InvoiceController() {
    Id orderId = ApexPages.currentPage().getParameters().get('id');

    if (orderId == null) {
      ord = new Order();
      subtotal = 0;
      shippingAmount = 0;
      sparksDiscount = 0;
      hasSparksDiscount = false;
      formattedShipping = 'Free';
      return;
    }

    ord = [
      SELECT
        Id,
        OrderNumber,
        Status,
        TotalAmount,
        EffectiveDate,
        Account.Name,
        Account.BillingStreet,
        Account.BillingCity,
        Account.BillingState,
        Account.BillingPostalCode,
        Account.BillingCountry,
        Shipping_Street__c,
        Shipping_City__c,
        Shipping_State__c,
        Shipping_Zip__c,
        Shipping_Country__c,
        Shipping_Amount__c,
        Sparks_Discount__c,
        (
          SELECT Product2.Name, Product2.Family, Quantity, UnitPrice, TotalPrice
          FROM OrderItems
        )
      FROM Order
      WHERE Id = :orderId
      LIMIT 1
    ];

    formattedDate = ord.EffectiveDate != null
      ? ord.EffectiveDate.format()
      : Date.today().format();

    subtotal = 0;
    for (OrderItem oi : ord.OrderItems) {
      subtotal += (oi.TotalPrice != null ? oi.TotalPrice : 0);
    }

    shippingAmount = ord.Shipping_Amount__c != null
      ? ord.Shipping_Amount__c
      : 0;
    sparksDiscount = ord.Sparks_Discount__c != null
      ? ord.Sparks_Discount__c
      : 0;
    hasSparksDiscount = sparksDiscount > 0;
    formattedShipping = shippingAmount > 0
      ? shippingAmount.setScale(2) + ' €'
      : 'Free';
  }
}
