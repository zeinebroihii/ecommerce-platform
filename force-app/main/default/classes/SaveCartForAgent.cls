/**
 * SaveCartForAgent
 * Called by nexusEmbeddedChatInit LWC when a chat conversation starts.
 * Reads the cart JSON from the browser (passed as parameter) and saves it
 * to Contact.Agent_Cart_JSON__c so GetCustomerCartForAgent can read it.
 */
public without sharing class SaveCartForAgent {

    @AuraEnabled(cacheable=false)
    public static void saveCart(String cartJson) {
        try {
            Id userId = UserInfo.getUserId();
            List<User> users = [SELECT ContactId FROM User WHERE Id = :userId LIMIT 1];
            if (users.isEmpty() || users[0].ContactId == null) return;

            Contact c = new Contact(Id = users[0].ContactId);
            c.Agent_Cart_JSON__c = cartJson;
            update c;
        } catch (Exception e) {
            System.debug('SaveCartForAgent error: ' + e.getMessage());
        }
    }
}
