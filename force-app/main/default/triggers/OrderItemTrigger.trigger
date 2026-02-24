/**
 * OrderItemTrigger
 * Fires after an OrderItem is inserted, updated, or deleted.
 * All logic lives in OrderItemTriggerHandler to keep this file thin.
 *
 * What this does:
 *   INSERT → stock goes DOWN  (customer placed order)
 *   UPDATE → stock adjusts by the DIFFERENCE in quantity
 *   DELETE → stock goes UP    (order cancelled / item removed)
 */
trigger OrderItemTrigger on OrderItem (after insert, after update, after delete) {
    if (Trigger.isAfter) {
        if (Trigger.isInsert) {
            OrderItemTriggerHandler.handleAfterInsert(Trigger.new);
        }
        if (Trigger.isUpdate) {
            OrderItemTriggerHandler.handleAfterUpdate(Trigger.new, Trigger.oldMap);
        }
        if (Trigger.isDelete) {
            OrderItemTriggerHandler.handleAfterDelete(Trigger.old);
        }
    }
}
