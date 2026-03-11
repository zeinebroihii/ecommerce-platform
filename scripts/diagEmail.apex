// Step 1 — find a pending lead with email
List<Lead> leads = [
    SELECT Id, FirstName, Email, Status, AdminDecision__c
    FROM Lead
    WHERE IsConverted = false AND Email != null
    LIMIT 1
];
if (leads.isEmpty()) { System.debug('NO LEAD FOUND'); return; }

Lead l = leads[0];
System.debug('Lead ID: '    + l.Id);
System.debug('Lead Email: ' + l.Email);
System.debug('Lead Status: ' + l.Status);
System.debug('Decision: '   + l.AdminDecision__c);

// Step 2 — check valid Lead Status picklist values
List<LeadStatus> statuses = [SELECT MasterLabel, IsConverted FROM LeadStatus];
System.debug('Available Lead Statuses:');
for (LeadStatus s : statuses) {
    System.debug('  ' + s.MasterLabel + ' (IsConverted=' + s.IsConverted + ')');
}

// Step 3 — try approveRejectLead (Approved)
try {
    LeadManagementController.approveRejectLead(l.Id, 'Approved');
    System.debug('approveRejectLead(Approved): OK');
} catch(Exception e) {
    System.debug('approveRejectLead(Approved) ERROR: ' + e.getMessage());
}

// Step 4 — try sendLeadWelcomeEmail
try {
    LeadManagementController.sendLeadWelcomeEmail(l.Id);
    System.debug('sendLeadWelcomeEmail: OK');
} catch(Exception e) {
    System.debug('sendLeadWelcomeEmail ERROR: ' + e.getMessage());
}
