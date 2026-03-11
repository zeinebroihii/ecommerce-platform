// Find a non-converted lead with email
List<Lead> leads = [
    SELECT Id, FirstName, Email, Status, IsConverted
    FROM Lead
    WHERE IsConverted = false AND Email != null
    LIMIT 1
];
if (leads.isEmpty()) { System.debug('NO LEAD FOUND'); return; }

Lead l = leads[0];
System.debug('PRE-CONVERT: ' + l.Id + ' IsConverted=' + l.IsConverted + ' Email=' + l.Email);

// Simulate convertLeadFull
LeadStatus cs = [SELECT MasterLabel FROM LeadStatus WHERE IsConverted = true LIMIT 1];
Database.LeadConvert lc = new Database.LeadConvert();
lc.setLeadId(l.Id);
lc.setConvertedStatus(cs.MasterLabel);
lc.setDoNotCreateOpportunity(true);
Database.LeadConvertResult res;
try {
    res = Database.convertLead(lc);
    System.debug('convertLead: success=' + res.isSuccess());
} catch(Exception e) {
    System.debug('convertLead ERROR: ' + e.getMessage());
    return;
}

// Now try to query that converted lead by ID (what sendLeadWelcomeEmail does)
List<Lead> afterConvert = [SELECT Id, FirstName, LastName, Email, Company FROM Lead WHERE Id = :l.Id LIMIT 1];
if (afterConvert.isEmpty()) {
    System.debug('POST-CONVERT QUERY: lead NOT FOUND by ID — this is the bug!');
} else {
    System.debug('POST-CONVERT QUERY: lead found, Email=' + afterConvert[0].Email);
    // Now call the email method
    try {
        LeadManagementController.sendLeadWelcomeEmail(l.Id);
        System.debug('sendLeadWelcomeEmail after conversion: OK');
    } catch(Exception e) {
        System.debug('sendLeadWelcomeEmail after conversion ERROR: ' + e.getMessage());
    }
}
