/**
 * OrderEscrowTrigger
 *
 * Fires after Order records are updated.
 * Watches for two events:
 *
 *   1. Status → 'Delivered'
 *      → Calls EscrowBridgeController.confirmDelivery
 *      → Contract: FUNDED → DELIVERED, 24 h safety delay starts
 *
 *   2. PaymentMethod__c = 'USDC_Escrow' AND Status → 'Cancelled'
 *      → Calls EscrowBridgeController.refundBuyer (expired=false)
 *      → Contract: FUNDED | DISPUTED | FROZEN → REFUNDED
 *
 * Only acts on orders where PaymentMethod__c == 'USDC_Escrow'.
 * Stripe and Cash orders are ignored entirely.
 */
trigger OrderEscrowTrigger on Order(after update) {
  List<String> toConfirm = new List<String>();
  List<String> toRefund = new List<String>();

  for (Order newOrder : Trigger.new) {
    Order oldOrder = Trigger.oldMap.get(newOrder.Id);

    // Only act on USDC Escrow payment method
    if (newOrder.PaymentMethod__c != 'USDC_Escrow')
      continue;

    Boolean statusChanged = newOrder.Status != oldOrder.Status;
    if (!statusChanged)
      continue;

    if (newOrder.Status == 'Delivered') {
      toConfirm.add(newOrder.OrderNumber);
    } else if (newOrder.Status == 'Cancelled') {
      toRefund.add(newOrder.OrderNumber);
    }
  }

  for (String orderNumber : toConfirm) {
    EscrowBridgeController.confirmDelivery(orderNumber);
  }

  for (String orderNumber : toRefund) {
    EscrowBridgeController.refundBuyer(orderNumber, false);
  }
}
