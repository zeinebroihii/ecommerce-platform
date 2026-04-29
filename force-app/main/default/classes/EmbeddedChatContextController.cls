/**
 * EmbeddedChatContextController
 * Returns the logged-in Experience Cloud user's ContactId and Name
 * so the Embedded Messaging bootstrap can pass them as hidden pre-chat fields.
 * Also provides linkContactToSession() to stamp MessagingEndUser.ContactId
 * at conversation-start time so Agentforce endUserContactId is populated.
 */
public without sharing class EmbeddedChatContextController {

    public class UserContext {
        @AuraEnabled public String contactId;
        @AuraEnabled public String contactName;
        @AuraEnabled public String accountId;
        @AuraEnabled public String email;
    }

    @AuraEnabled(cacheable=false)
    public static UserContext getCurrentUserContext() {
        UserContext ctx = new UserContext();
        try {
            Id userId = UserInfo.getUserId();

            // Get ContactId from User
            List<User> users = [SELECT ContactId FROM User WHERE Id = :userId LIMIT 1];
            if (users.isEmpty() || users[0].ContactId == null) return ctx;

            Id contactId = users[0].ContactId;
            ctx.contactId = contactId;

            // Get Contact details separately
            List<Contact> contacts = [
                SELECT Name, AccountId, Email
                FROM Contact
                WHERE Id = :contactId
                LIMIT 1
            ];
            if (!contacts.isEmpty()) {
                ctx.contactName = contacts[0].Name;
                ctx.accountId   = contacts[0].AccountId;
                ctx.email       = contacts[0].Email;
            }
        } catch (Exception e) {
            System.debug('EmbeddedChatContext error: ' + e.getMessage());
        }
        return ctx;
    }

    /**
     * Called by nexusEmbeddedChatInit LWC on onEmbeddedMessagingConversationStarted.
     * Finds the most recently created MessagingEndUser (within last 3 minutes)
     * that has no ContactId linked yet, and stamps it with the current portal
     * user's ContactId. This populates endUserContactId for Agentforce subagents
     * without asking the customer for any identifying information.
     */
    @AuraEnabled(cacheable=false)
    public static String linkContactToSession() {
        try {
            Id userId = UserInfo.getUserId();
            List<User> users = [SELECT ContactId FROM User WHERE Id = :userId LIMIT 1];
            if (users.isEmpty() || users[0].ContactId == null) {
                return 'SKIP: no contact on user';
            }

            Id contactId = users[0].ContactId;

            // Find the most recently created MessagingEndUser with no ContactId,
            // created within the last 3 minutes (handles slower networks)
            Datetime cutoff = Datetime.now().addMinutes(-3);
            List<MessagingEndUser> endUsers = [
                SELECT Id, ContactId
                FROM MessagingEndUser
                WHERE ContactId = null
                AND CreatedDate >= :cutoff
                ORDER BY CreatedDate DESC
                LIMIT 1
            ];

            if (endUsers.isEmpty()) {
                return 'SKIP: no recent unlinked MessagingEndUser found';
            }

            endUsers[0].ContactId = contactId;
            update endUsers[0];
            return 'OK: linked ' + endUsers[0].Id + ' → ' + contactId;

        } catch (Exception e) {
            System.debug('linkContactToSession error: ' + e.getMessage());
            return 'ERROR: ' + e.getMessage();
        }
    }
}
