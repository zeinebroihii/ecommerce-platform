public without sharing class OrderManagementController {

    // ── Wrappers ─────────────────────────────────────────────────────────────

    public class OrderDetail {
        @AuraEnabled public Id      orderId;
        @AuraEnabled public String  orderNumber;
        @AuraEnabled public String  account;
        @AuraEnabled public Id      accountId;
        @AuraEnabled public String  orderDate;
        @AuraEnabled public Decimal totalAmount;
        @AuraEnabled public String  formattedTotal;
        @AuraEnabled public String  status;
        @AuraEnabled public Integer itemCount;
        @AuraEnabled public String  shippingAddress;
        @AuraEnabled public List<OrderLineItem> lineItems;
    }

    public class OrderLineItem {
        @AuraEnabled public String  productName;
        @AuraEnabled public String  productFamily;
        @AuraEnabled public Integer quantity;
        @AuraEnabled public Decimal unitPrice;
        @AuraEnabled public Decimal totalPrice;
        @AuraEnabled public String  formattedUnitPrice;
        @AuraEnabled public String  formattedTotal;
    }

    // ── Admin order list ──────────────────────────────────────────────────────

    @AuraEnabled(cacheable=true)
    public static List<OrderDetail> getOrders() {
        List<OrderDetail> result = new List<OrderDetail>();
        for (Order o : [
            SELECT Id, OrderNumber, Status, TotalAmount, EffectiveDate,
                   AccountId, Account.Name,
                   Shipping_City__c, Shipping_Country__c,
                   (SELECT Product2.Name, Product2.Family,
                           Quantity, UnitPrice, TotalPrice
                    FROM OrderItems)
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
            SELECT Id, OrderNumber, Status, TotalAmount, EffectiveDate,
                   AccountId, Account.Name,
                   Shipping_Street__c, Shipping_City__c, Shipping_State__c,
                   Shipping_Zip__c, Shipping_Country__c,
                   (SELECT Product2.Name, Product2.Family,
                           Quantity, UnitPrice, TotalPrice
                    FROM OrderItems)
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
        OrderDetail d       = new OrderDetail();
        d.orderId           = o.Id;
        d.orderNumber       = o.OrderNumber;
        d.account           = o.Account != null ? o.Account.Name : '—';
        d.accountId         = o.AccountId;
        d.orderDate         = o.EffectiveDate != null ? o.EffectiveDate.format() : '';
        d.totalAmount       = o.TotalAmount != null ? o.TotalAmount : 0;
        d.formattedTotal    = (d.totalAmount != null
                               ? d.totalAmount.setScale(2) : 0) + ' €';
        d.status            = o.Status;

        List<String> addr = new List<String>();
        if (String.isNotBlank(o.Shipping_City__c))    addr.add(o.Shipping_City__c);
        if (String.isNotBlank(o.Shipping_Country__c)) addr.add(o.Shipping_Country__c);
        d.shippingAddress   = addr.isEmpty() ? '—' : String.join(addr, ', ');

        d.lineItems = new List<OrderLineItem>();
        for (OrderItem oi : o.OrderItems) {
            OrderLineItem li        = new OrderLineItem();
            li.productName          = oi.Product2 != null ? oi.Product2.Name   : '—';
            li.productFamily        = oi.Product2 != null ? oi.Product2.Family : '—';
            li.quantity             = Integer.valueOf(oi.Quantity);
            li.unitPrice            = oi.UnitPrice;
            li.totalPrice           = oi.TotalPrice;
            li.formattedUnitPrice   = oi.UnitPrice  != null
                                      ? oi.UnitPrice.setScale(2)  + ' €' : '—';
            li.formattedTotal       = oi.TotalPrice != null
                                      ? oi.TotalPrice.setScale(2) + ' €' : '—';
            d.lineItems.add(li);
        }
        d.itemCount = d.lineItems.size();
        return d;
    }
}
