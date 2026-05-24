/**
 * OrderDeliveryTrigger
 *
 * Fires after Order is updated.
 * When Status transitions to 'Delivered', sends a WhatsApp to the buyer
 * asking them to confirm receipt on the portal.
 *
 * Works for all payment methods (Stripe, USDC Escrow, etc.).
 * The escrow-specific FUNDED→DELIVERED transition is handled separately
 * by OrderEscrowTrigger.
 */
trigger OrderDeliveryTrigger on Order(after update) {
  for (Order newOrder : Trigger.new) {
    Order oldOrder = Trigger.oldMap.get(newOrder.Id);
    if (newOrder.Status == 'Delivered' && oldOrder.Status != 'Delivered') {
      if (String.isNotBlank(newOrder.Buyer_Whatsapp__c)) {
        String portalUrl = LiveTrackingConfig.SITE_BASE_URL;
        String msg =
          'Hello!\n\n' +
          'Your *Nexus* delivery (order *' +
          newOrder.OrderNumber +
          '*) has been delivered. ✓\n\n' +
          'Confirm receipt on your customer portal:\n' +
          portalUrl +
          '\n\n' +
          '_Your confirmation allows us to close the order quickly._';
        System.enqueueJob(
          new TwilioNotifyQueueable(newOrder.Buyer_Whatsapp__c, msg)
        );
      }
    }
  }
}
