public without sharing class OrderManagementController {
  // ── Wrappers ─────────────────────────────────────────────────────────────

  public class OrderDetail {
    @AuraEnabled
    public Id orderId;
    @AuraEnabled
    public String orderNumber;
    @AuraEnabled
    public String account;
    @AuraEnabled
    public Id accountId;
    @AuraEnabled
    public String orderDate;
    @AuraEnabled
    public Decimal totalAmount;
    @AuraEnabled
    public String formattedTotal;
    @AuraEnabled
    public String status;
    @AuraEnabled
    public Integer itemCount;
    @AuraEnabled
    public String shippingAddress;
    @AuraEnabled
    public Decimal shippingAmount;
    @AuraEnabled
    public String formattedShipping;
    @AuraEnabled
    public Decimal sparksDiscount;
    @AuraEnabled
    public String formattedSparksDiscount;
    @AuraEnabled
    public Boolean hasSparksDiscount;
    @AuraEnabled
    public List<OrderLineItem> lineItems;
  }

  public class OrderLineItem {
    @AuraEnabled
    public String productName;
    @AuraEnabled
    public String productFamily;
    @AuraEnabled
    public Integer quantity;
    @AuraEnabled
    public Decimal unitPrice;
    @AuraEnabled
    public Decimal totalPrice;
    @AuraEnabled
    public String formattedUnitPrice;
    @AuraEnabled
    public String formattedTotal;
    @AuraEnabled
    public String imageUrl;
  }

  // ── Portal: orders for the current logged-in user ─────────────────────────

  @AuraEnabled(cacheable=true)
  public static List<OrderDetail> getMyOrders() {
    Id accountId = null;
    try {
      User u = [
        SELECT ContactId
        FROM User
        WHERE Id = :UserInfo.getUserId()
        LIMIT 1
      ];
      if (u.ContactId != null) {
        Contact c = [
          SELECT AccountId
          FROM Contact
          WHERE Id = :u.ContactId
          LIMIT 1
        ];
        accountId = c.AccountId;
      }
    } catch (Exception ex) {
      /* guest or no contact */
    }

    if (accountId == null)
      return new List<OrderDetail>();

    List<OrderDetail> result = new List<OrderDetail>();
    for (Order o : [
      SELECT
        Id,
        OrderNumber,
        Status,
        TotalAmount,
        EffectiveDate,
        AccountId,
        Account.Name,
        Shipping_Street__c,
        Shipping_City__c,
        Shipping_State__c,
        Shipping_Zip__c,
        Shipping_Country__c,
        Shipping_Amount__c,
        Sparks_Discount__c,
        (
          SELECT
            Product2.Name,
            Product2.Family,
            Product2.Image_URL__c,
            Quantity,
            UnitPrice,
            TotalPrice
          FROM OrderItems
        )
      FROM Order
      WHERE AccountId = :accountId
      ORDER BY CreatedDate DESC
      LIMIT 50
    ]) {
      result.add(buildDetail(o));
    }
    return result;
  }

  // ── Admin order list ──────────────────────────────────────────────────────

  @AuraEnabled(cacheable=true)
  public static List<OrderDetail> getOrders() {
    List<OrderDetail> result = new List<OrderDetail>();
    for (Order o : [
      SELECT
        Id,
        OrderNumber,
        Status,
        TotalAmount,
        EffectiveDate,
        AccountId,
        Account.Name,
        Shipping_City__c,
        Shipping_Country__c,
        Shipping_Amount__c,
        Sparks_Discount__c,
        (
          SELECT
            Product2.Name,
            Product2.Family,
            Product2.Image_URL__c,
            Quantity,
            UnitPrice,
            TotalPrice
          FROM OrderItems
        )
      FROM Order
      ORDER BY CreatedDate DESC
      LIMIT 50
    ]) {
      result.add(buildDetail(o));
    }
    return result;
  }

  // ── Single order detail (used by modals) ──────────────────────────────────

  @AuraEnabled(cacheable=true)
  public static OrderDetail getOrderDetail(Id orderId) {
    Order o = [
      SELECT
        Id,
        OrderNumber,
        Status,
        TotalAmount,
        EffectiveDate,
        AccountId,
        Account.Name,
        Shipping_Street__c,
        Shipping_City__c,
        Shipping_State__c,
        Shipping_Zip__c,
        Shipping_Country__c,
        Shipping_Amount__c,
        Sparks_Discount__c,
        (
          SELECT
            Product2.Name,
            Product2.Family,
            Product2.Image_URL__c,
            Quantity,
            UnitPrice,
            TotalPrice
          FROM OrderItems
        )
      FROM Order
      WHERE Id = :orderId
      LIMIT 1
    ];
    return buildDetail(o);
  }

  // ── Invoice generation (calls InvoiceService → @future PDF + email) ───────

  @AuraEnabled
  public static void generateInvoice(Id orderId) {
    InvoiceService.generateInvoice(new List<Id>{ orderId });
  }

  // ── Private helper ────────────────────────────────────────────────────────

  private static OrderDetail buildDetail(Order o) {
    OrderDetail d = new OrderDetail();
    d.orderId = o.Id;
    d.orderNumber = o.OrderNumber;
    d.account = o.Account != null ? o.Account.Name : '—';
    d.accountId = o.AccountId;
    d.orderDate = o.EffectiveDate != null ? o.EffectiveDate.format() : '';
    d.totalAmount = o.TotalAmount != null ? o.TotalAmount : 0;
    d.formattedTotal =
      (d.totalAmount != null ? d.totalAmount.setScale(2) : 0) + ' €';
    d.status = o.Status;

    List<String> addr = new List<String>();
    if (String.isNotBlank(o.Shipping_City__c))
      addr.add(o.Shipping_City__c);
    if (String.isNotBlank(o.Shipping_Country__c))
      addr.add(o.Shipping_Country__c);
    d.shippingAddress = addr.isEmpty() ? '—' : String.join(addr, ', ');

    d.shippingAmount = o.Shipping_Amount__c != null ? o.Shipping_Amount__c : 0;
    d.formattedShipping = (d.shippingAmount > 0)
      ? d.shippingAmount.setScale(2) + ' €'
      : 'Gratuit';
    d.sparksDiscount = o.Sparks_Discount__c != null ? o.Sparks_Discount__c : 0;
    d.hasSparksDiscount = d.sparksDiscount > 0;
    d.formattedSparksDiscount = d.hasSparksDiscount
      ? '-' + d.sparksDiscount.setScale(2) + ' €'
      : null;

    d.lineItems = new List<OrderLineItem>();
    for (OrderItem oi : o.OrderItems) {
      OrderLineItem li = new OrderLineItem();
      li.productName = oi.Product2 != null ? oi.Product2.Name : '—';
      li.productFamily = oi.Product2 != null ? oi.Product2.Family : '—';
      li.imageUrl = oi.Product2 != null ? oi.Product2.Image_URL__c : null;
      li.quantity = Integer.valueOf(oi.Quantity);
      li.unitPrice = oi.UnitPrice;
      li.totalPrice = oi.TotalPrice;
      li.formattedUnitPrice = oi.UnitPrice != null
        ? oi.UnitPrice.setScale(2) + ' €'
        : '—';
      li.formattedTotal = oi.TotalPrice != null
        ? oi.TotalPrice.setScale(2) + ' €'
        : '—';
      d.lineItems.add(li);
    }
    d.itemCount = d.lineItems.size();
    return d;
  }
}
