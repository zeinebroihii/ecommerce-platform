public without sharing class PortalHomeController {

    public class PortalSummary {
        @AuraEnabled public Integer activeDeals     = 0;
        @AuraEnabled public Integer totalOrders     = 0;
        @AuraEnabled public Integer openCases       = 0;
        @AuraEnabled public String  latestOppStage  = '—';
    }

    @AuraEnabled(cacheable=true)
    public static PortalSummary getPortalSummary(Id accountId) {
        PortalSummary result = new PortalSummary();
        if (accountId == null) return result;

        // Active Opportunities (not closed)
        result.activeDeals = [
            SELECT COUNT() FROM Opportunity
            WHERE AccountId = :accountId AND IsClosed = false
        ];

        // Total Orders
        result.totalOrders = [
            SELECT COUNT() FROM Order
            WHERE AccountId = :accountId
        ];

        // Open Cases (not Closed)
        result.openCases = [
            SELECT COUNT() FROM Case
            WHERE AccountId = :accountId AND Status != 'Closed'
        ];

        // Latest Opportunity stage
        List<Opportunity> latestOpps = [
            SELECT StageName FROM Opportunity
            WHERE AccountId = :accountId
            ORDER BY LastModifiedDate DESC
            LIMIT 1
        ];
        if (!latestOpps.isEmpty()) {
            result.latestOppStage = latestOpps[0].StageName;
        }

        return result;
    }
}
