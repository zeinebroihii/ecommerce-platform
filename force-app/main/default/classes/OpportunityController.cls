public without sharing class OpportunityController {

    // Stage sequence — mirrors the portal progress bar order
    private static final List<String> STAGE_ORDER = new List<String>{
        'Working',
        'Quote Sent',
        'Quote Accepted',
        'Contract In Progress',
        'Contract Signed',
        'Closed Won'
    };

    @AuraEnabled(cacheable=true)
    public static List<OppWrapper> getMyOpportunities(Id accountId) {
        if (accountId == null) return new List<OppWrapper>();

        List<Opportunity> opps = [
            SELECT Id, Name, StageName, Amount, CloseDate,
                   CreatedDate, Description, IsClosed, IsWon
            FROM   Opportunity
            WHERE  AccountId = :accountId
            ORDER BY CreatedDate DESC
            LIMIT  20
        ];

        List<OppWrapper> result = new List<OppWrapper>();
        for (Opportunity o : opps) {
            result.add(new OppWrapper(o));
        }
        return result;
    }

    // ── Wrapper ───────────────────────────────────────────────────────────────

    public class OppWrapper {
        @AuraEnabled public String  oppId;
        @AuraEnabled public String  name;
        @AuraEnabled public String  stageName;
        @AuraEnabled public Decimal amount;
        @AuraEnabled public String  closeDate;
        @AuraEnabled public String  createdDate;
        @AuraEnabled public String  description;
        @AuraEnabled public Boolean isClosed;
        @AuraEnabled public Boolean isWon;
        @AuraEnabled public Boolean isLost;
        @AuraEnabled public Integer stageIndex;   // 0-based index in STAGE_ORDER
        @AuraEnabled public Integer totalStages;  // total stages count

        public OppWrapper(Opportunity o) {
            this.oppId       = o.Id;
            this.name        = o.Name;
            this.stageName   = o.StageName;
            this.amount      = o.Amount;
            this.closeDate   = o.CloseDate   != null ? o.CloseDate.format()   : '';
            this.createdDate = o.CreatedDate != null
                             ? o.CreatedDate.dateGmt().format() : '';
            this.description = o.Description;
            this.isClosed    = o.IsClosed;
            this.isWon       = o.IsWon;
            this.isLost      = o.IsClosed && !o.IsWon;
            this.totalStages = STAGE_ORDER.size();

            // Find position in the ordered stage list
            Integer idx = STAGE_ORDER.indexOf(o.StageName);
            this.stageIndex = idx >= 0 ? idx : 0;
        }
    }
}
