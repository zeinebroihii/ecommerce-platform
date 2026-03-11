// Direct test: setTargetObjectId only (no setToAddresses) on a Lead
List<Lead> leads = [
    SELECT Id, FirstName, LastName, Email, Company, IsConverted
    FROM Lead
    WHERE IsConverted = false AND Email != null
    LIMIT 1
];
if (leads.isEmpty()) {
    // try converted leads too
    leads = [SELECT Id, FirstName, LastName, Email, Company, IsConverted
             FROM Lead WHERE Email != null LIMIT 1];
}
if (leads.isEmpty()) { System.debug('NO LEAD WITH EMAIL FOUND'); return; }

Lead l = leads[0];
System.debug('Lead: ' + l.Id + ' IsConverted=' + l.IsConverted + ' Email=' + l.Email);

// Build email using setTargetObjectId only (no setToAddresses)
Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
mail.setTargetObjectId(l.Id);
mail.setSubject('TEST — Nexus email setTargetObjectId only');
mail.setHtmlBody('<p>Test email without setToAddresses. Lead: ' + l.FirstName + '</p>');
mail.setSaveAsActivity(!l.IsConverted);

try {
    Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    System.debug('SEND OK - Email Invocations: success');
} catch(Exception e) {
    System.debug('SEND ERROR: ' + e.getMessage());
}
