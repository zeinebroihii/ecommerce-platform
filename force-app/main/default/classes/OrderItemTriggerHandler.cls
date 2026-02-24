/**
 * OrderItemTriggerHandler
 *
 * WHY a handler class?
 *   Keeping logic here (not in the trigger file) means:
 *   - Easy to unit test (call handler methods directly)
 *   - Easy to disable trigger logic without deleting the trigger
 *   - Follows the Trigger Framework pattern used in enterprise orgs
 *
 * GOVERNOR LIMIT RULES followed here:
 *   ✅ NO SOQL inside a for loop
 *   ✅ NO DML inside a for loop
 *   ✅ Bulk-safe (handles 200 records at once — Salesforce batch size)
 */
public class OrderItemTriggerHandler {

    // ─── Entry Points (called by trigger) ────────────────────────────────────

    public static void handleAfterInsert(List<OrderItem> newItems) {
        // New order items → reduce stock by the ordered quantity
        adjustStock(newItems, 1);
    }

    public static void handleAfterUpdate(List<OrderItem> newItems, Map<Id, OrderItem> oldMap) {
        // Only process items where quantity actually changed
        List<OrderItem> changed = new List<OrderItem>();
        for (OrderItem oi : newItems) {
            if (oi.Quantity != oldMap.get(oi.Id).Quantity) {
                changed.add(oi);
            }
        }
        if (!changed.isEmpty()) {
            adjustStockDelta(changed, oldMap);
        }
    }

    public static void handleAfterDelete(List<OrderItem> deletedItems) {
        // Deleted order items → restore stock (order was cancelled)
        adjustStock(deletedItems, -1);
    }

    // ─── Core Logic ──────────────────────────────────────────────────────────

    /**
     * adjustStock — used for INSERT and DELETE
     * multiplier = 1  → decrease stock (order placed)
     * multiplier = -1 → increase stock (order cancelled)
     */
    private static void adjustStock(List<OrderItem> items, Integer multiplier) {

        // STEP 1: Collect all product IDs in one pass (no SOQL yet)
        Set<Id> productIds = new Set<Id>();
        for (OrderItem oi : items) {
            productIds.add(oi.Product2Id);
        }

        // STEP 2: ONE query to get all relevant Stock records
        Map<Id, Stock__c> stockByProduct = new Map<Id, Stock__c>();
        for (Stock__c s : [
            SELECT Id, Product__c, Quantity_Available__c, Reorder_Threshold__c
            FROM Stock__c
            WHERE Product__c IN :productIds
        ]) {
            stockByProduct.put(s.Product__c, s);
        }

        // STEP 3: Calculate new quantities
        List<Stock__c> toUpdate       = new List<Stock__c>();
        List<Stock__c> lowStockAlerts = new List<Stock__c>();

        for (OrderItem oi : items) {
            Stock__c stock = stockByProduct.get(oi.Product2Id);
            if (stock == null) continue; // no stock record — skip

            stock.Quantity_Available__c -= (oi.Quantity * multiplier);

            // Never let stock go negative
            if (stock.Quantity_Available__c < 0) {
                stock.Quantity_Available__c = 0;
            }

            toUpdate.add(stock);

            // Flag for low stock alert
            if (stock.Quantity_Available__c <= stock.Reorder_Threshold__c) {
                lowStockAlerts.add(stock);
            }
        }

        // STEP 4: ONE DML update for all stocks
        if (!toUpdate.isEmpty()) update toUpdate;

        // STEP 5: Fire platform events for low stock (async, doesn't count against DML)
        if (!lowStockAlerts.isEmpty()) fireLowStockEvents(lowStockAlerts);
    }

    /**
     * adjustStockDelta — used for UPDATE (quantity changed)
     * Adjusts stock by the DIFFERENCE between old and new quantity
     * e.g. old qty = 2, new qty = 5 → reduce stock by 3 more
     */
    private static void adjustStockDelta(List<OrderItem> changedItems, Map<Id, OrderItem> oldMap) {

        Set<Id> productIds = new Set<Id>();
        for (OrderItem oi : changedItems) {
            productIds.add(oi.Product2Id);
        }

        Map<Id, Stock__c> stockByProduct = new Map<Id, Stock__c>();
        for (Stock__c s : [
            SELECT Id, Product__c, Quantity_Available__c, Reorder_Threshold__c
            FROM Stock__c
            WHERE Product__c IN :productIds
        ]) {
            stockByProduct.put(s.Product__c, s);
        }

        List<Stock__c> toUpdate       = new List<Stock__c>();
        List<Stock__c> lowStockAlerts = new List<Stock__c>();

        for (OrderItem oi : changedItems) {
            Stock__c stock = stockByProduct.get(oi.Product2Id);
            if (stock == null) continue;

            // Delta = new quantity minus old quantity
            Decimal delta = oi.Quantity - oldMap.get(oi.Id).Quantity;
            stock.Quantity_Available__c -= delta;

            if (stock.Quantity_Available__c < 0) {
                stock.Quantity_Available__c = 0;
            }

            toUpdate.add(stock);

            if (stock.Quantity_Available__c <= stock.Reorder_Threshold__c) {
                lowStockAlerts.add(stock);
            }
        }

        if (!toUpdate.isEmpty()) update toUpdate;
        if (!lowStockAlerts.isEmpty()) fireLowStockEvents(lowStockAlerts);
    }

    /**
     * fireLowStockEvents
     * Publishes platform events — received by the LowStockResponseFlow
     * which automatically creates a Purchase Order for restocking
     */
    private static void fireLowStockEvents(List<Stock__c> lowStocks) {
        List<Low_Stock_Alert__e> events = new List<Low_Stock_Alert__e>();
        for (Stock__c s : lowStocks) {
            events.add(new Low_Stock_Alert__e(
                Product_Id__c      = s.Product__c,
                Current_Quantity__c = s.Quantity_Available__c
            ));
        }
        EventBus.publish(events);
    }
}
