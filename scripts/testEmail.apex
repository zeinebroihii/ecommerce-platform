List<Lead> leads = [SELECT Id, Email, FirstName, LastName, Company FROM Lead WHERE Email != null LIMIT 1];
if (leads.isEmpty()) {
    System.debug('NO LEADS WITH EMAIL FOUND');
} else {
    Lead l = leads[0];
    System.debug('TEST LEAD: ' + l.Id + ' / ' + l.Email);
    try {
        LeadManagementController.sendLeadRejectionEmail(l.Id);
        System.debug('REJECTION EMAIL: OK');
    } catch(Exception e) {
        System.debug('REJECTION EMAIL ERROR: ' + e.getMessage());
    }
    try {
        LeadManagementController.sendLeadWelcomeEmail(l.Id);
        System.debug('WELCOME EMAIL: OK');
    } catch(Exception e) {
        System.debug('WELCOME EMAIL ERROR: ' + e.getMessage());
    }
}
