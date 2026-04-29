public without sharing class NotificationController {

    // ── Customer Portal: get my notifications ─────────────────────────────
    @AuraEnabled(cacheable=false)
    public static List<TALEXO_Notification__c> getMyNotifications() {
        return [
            SELECT Id, Title__c, Message__c, Type__c, IsRead__c, RelatedUrl__c, CreatedDate
            FROM TALEXO_Notification__c
            WHERE User__c = :UserInfo.getUserId()
            ORDER BY CreatedDate DESC
            LIMIT 30
        ];
    }

    @AuraEnabled
    public static void markOneRead(Id notifId) {
        update new TALEXO_Notification__c(Id = notifId, IsRead__c = true);
    }

    @AuraEnabled
    public static void markAllRead() {
        List<TALEXO_Notification__c> unread = [
            SELECT Id FROM TALEXO_Notification__c
            WHERE User__c = :UserInfo.getUserId() AND IsRead__c = false
        ];
        for (TALEXO_Notification__c n : unread) n.IsRead__c = true;
        if (!unread.isEmpty()) update unread;
    }

    // ── Internal helper: create a notification for a user ─────────────────
    public static void push(Id userId, String title, String message,
                             String type, String relatedUrl) {
        if (userId == null) return;
        insert new TALEXO_Notification__c(
            User__c      = userId,
            Title__c     = title,
            Message__c   = message,
            Type__c      = type,
            IsRead__c    = false,
            RelatedUrl__c = relatedUrl
        );
    }

    // ── Admin bell: send a Salesforce platform bell notification to System Admin ──
    // Called from Apex classes on key sales events (lead submit, quote decision,
    // contract signed, quote request).  Silently swallows all errors so that
    // a notification failure never breaks the main transaction.
    public static void pushAdminBell(String title, String body, Id targetId) {
        try {
            List<CustomNotificationType> types = [
                SELECT Id
                FROM CustomNotificationType
                WHERE DeveloperName = 'Nexus_Admin_Alert'
                LIMIT 1
            ];
            if (types.isEmpty()) return;

            // Send to ALL active System Admin users so every admin sees it
            List<User> admins = [
                SELECT Id
                FROM User
                WHERE (Profile.Name = 'System Administrator'
                    OR Profile.Name = 'Administrateur système')
                    AND IsActive = TRUE
                    AND UserType = 'Standard'
                LIMIT 10
            ];
            if (admins.isEmpty()) return;

            Set<String> recipientIds = new Set<String>();
            for (User u : admins) recipientIds.add(u.Id);

            Messaging.CustomNotification notif = new Messaging.CustomNotification();
            notif.setTitle(title);
            notif.setBody(body);
            notif.setNotificationTypeId(types[0].Id);
            if (targetId != null) {
                notif.setTargetId(targetId);
            }
            notif.send(recipientIds);
        } catch (Exception ex) {
            System.debug(LoggingLevel.WARN, '[Nexus] pushAdminBell failed: ' + ex.getMessage());
        }
    }
}
