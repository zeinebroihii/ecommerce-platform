public with sharing class OrderService {

    @InvocableMethod(label='Create Order from Cart')
    public static List<OrderResult> createOrder(List<OrderRequest> requests) {
        OrderRequest req = requests[0];
        List<OrderResult> results = new List<OrderResult>();

        try {
            // Resolve cart items — Flow passes JSON string, LWC can pass typed list
            List<CartItem> cartItems = req.cartItems;
            if ((cartItems == null || cartItems.isEmpty()) && String.isNotBlank(req.cartItemsJson)) {
                cartItems = (List<CartItem>) JSON.deserialize(req.cartItemsJson, List<CartItem>.class);
            }

            if (cartItems == null || cartItems.isEmpty()) {
                results.add(new OrderResult(null, 'Error', 'Cart is empty.'));
                return results;
            }

            // 1. Create the Order header using standard shipping address fields
            // Query Pricebook2 ID directly to avoid cross-object filter issues in community context
            List<Pricebook2> pbs = [SELECT Id FROM Pricebook2 WHERE IsStandard = true AND IsActive = true LIMIT 1];
            Id standardPbId = pbs.isEmpty()
                ? [SELECT Id FROM Pricebook2 WHERE IsActive = true LIMIT 1].Id
                : pbs[0].Id;

            Order newOrder = new Order();
            newOrder.AccountId     = req.accountId;
            newOrder.Status        = 'Draft';
            newOrder.EffectiveDate = Date.today();
            newOrder.Pricebook2Id  = standardPbId;
            // Custom shipping fields on Order (works in all org editions)
            newOrder.Shipping_Street__c  = req.street;
            newOrder.Shipping_City__c    = req.city;
            newOrder.Shipping_State__c   = req.state;
            newOrder.Shipping_Zip__c     = req.zipCode;
            newOrder.Shipping_Country__c = req.country;
            insert newOrder;

            // 2. Collect all product IDs — ONE SOQL query, not inside loop
            Set<Id> productIds = new Set<Id>();
            for (CartItem ci : cartItems) {
                productIds.add(ci.productId);
            }

            Map<Id, PricebookEntry> pbeMap = new Map<Id, PricebookEntry>();
            for (PricebookEntry pbe : [
                SELECT Id, UnitPrice, Product2Id
                FROM PricebookEntry
                WHERE Product2Id IN :productIds
                AND Pricebook2Id = :standardPbId
                AND IsActive = true
            ]) {
                pbeMap.put(pbe.Product2Id, pbe);
            }

            // 3. Build Order Items using the map
            List<OrderItem> items = new List<OrderItem>();
            for (CartItem ci : cartItems) {
                PricebookEntry pbe = pbeMap.get(ci.productId);
                if (pbe == null) continue; // skip products not in pricebook

                OrderItem oi      = new OrderItem();
                oi.OrderId        = newOrder.Id;
                oi.Product2Id     = ci.productId;
                oi.PricebookEntryId = pbe.Id;
                oi.Quantity       = ci.quantity;
                oi.UnitPrice      = pbe.UnitPrice;
                items.add(oi);
            }
            if (!items.isEmpty()) insert items;

            // 4. Activate the order (triggers stock decrement via trigger)
            newOrder.Status = 'Activated';
            update newOrder;

            results.add(new OrderResult(newOrder.Id, 'Success', null));

        } catch (Exception e) {
            results.add(new OrderResult(null, 'Error', e.getMessage()));
        }

        return results;
    }

    // ─── LWC-callable wrapper ─────────────────────────────────────────────────

    @AuraEnabled
    public static String placeOrderFromLwc(String accountId, String cartItemsJson,
                                            String street,    String city,
                                            String state,     String zipCode,
                                            String country) {
        OrderRequest req   = new OrderRequest();
        req.accountId      = accountId;
        req.cartItemsJson  = cartItemsJson;
        req.street         = street;
        req.city           = city;
        req.state          = state;
        req.zipCode        = zipCode;
        req.country        = country;

        List<OrderResult> results = createOrder(new List<OrderRequest>{ req });
        OrderResult result = results[0];

        if (result.status == 'Error') {
            throw new AuraHandledException(result.errorMessage);
        }
        return result.orderId;
    }

    // ─── Inner Classes ────────────────────────────────────────────────────────

    public class OrderRequest {
        @InvocableVariable public Id     accountId;
        @InvocableVariable public String street;
        @InvocableVariable public String city;
        @InvocableVariable public String state;
        @InvocableVariable public String zipCode;
        @InvocableVariable public String country;
        // Typed list — used when called from Apex directly
        @InvocableVariable public List<CartItem> cartItems;
        // JSON string — used when called from a Screen Flow
        @InvocableVariable public String cartItemsJson;
    }

    public class CartItem {
        @InvocableVariable public Id      productId;
        @InvocableVariable public Integer quantity;
    }

    public class OrderResult {
        @InvocableVariable public Id     orderId;
        @InvocableVariable public String status;
        @InvocableVariable public String errorMessage;

        public OrderResult(Id id, String s, String e) {
            orderId      = id;
            status       = s;
            errorMessage = e;
        }
    }
}
