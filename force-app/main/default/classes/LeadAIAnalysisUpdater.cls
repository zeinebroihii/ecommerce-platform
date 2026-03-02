public without sharing class LeadAIAnalysisUpdater {

    public class UpdateRequest {
        @InvocableVariable(label='Lead ID' required=true)
        public String leadId;

        @InvocableVariable(label='AI Analysis (French)')
        public String aiReason;

        @InvocableVariable(label='Decision (Approved / Rejected / Pending)')
        public String decision;
    }

    public class UpdateResult {
        @InvocableVariable(label='Result Message')
        public String message;
    }

    @InvocableMethod(
        label='Update Lead AI Analysis'
        description='Called by Agentforce to write its Einstein analysis and decision back to the Lead record.'
    )
    public static List<UpdateResult> updateAnalysis(List<UpdateRequest> requests) {
        UpdateResult res = new UpdateResult();
        if (requests == null || requests.isEmpty()) {
            res.message = 'No request provided.';
            return new List<UpdateResult>{ res };
        }
        UpdateRequest req = requests[0];
        Lead l = new Lead(Id = req.leadId);
        if (String.isNotBlank(req.aiReason))  l.AIReason__c      = req.aiReason;
        if (String.isNotBlank(req.decision))  l.AdminDecision__c = req.decision;
        update l;
        res.message = 'Analyse IA enregistrée avec succès.';
        return new List<UpdateResult>{ res };
    }
}
