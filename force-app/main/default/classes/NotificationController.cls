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
}
