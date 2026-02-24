/**
 * OrderTrackingController
 * Returns the current customer's orders for the orderHistory LWC.
 * Uses "with sharing" so customers only see their own orders.
 */
public with sharing class OrderTrackingController {

    @AuraEnabled(cacheable=true)
    public static List<Order> getMyOrders(Id accountId) {
        if (accountId == null) return new List<Order>();

        return [
            SELECT Id, OrderNumber, Status, TotalAmount, EffectiveDate,
                   Shipping_City__c, Shipping_Country__c,
                   (SELECT Product2.Name, Product2.Family, Quantity, UnitPrice, TotalPrice
                    FROM OrderItems)
            FROM Order
            WHERE AccountId = :accountId
            ORDER BY CreatedDate DESC
            LIMIT 20
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Order getOrderDetail(Id orderId) {
        return [
            SELECT Id, OrderNumber, Status, TotalAmount, EffectiveDate,
                   Account.Name,
                   Shipping_Street__c, Shipping_City__c, Shipping_State__c,
                   Shipping_Zip__c, Shipping_Country__c,
                   (SELECT Product2.Name, Product2.Family, Quantity, UnitPrice, TotalPrice
                    FROM OrderItems)
            FROM Order
            WHERE Id = :orderId
            LIMIT 1
        ];
    }
}
