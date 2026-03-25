// Find an Accepted quote to test contract generation
List<NexusQuoteController.QuoteDetailWrapper> allQ = NexusQuoteController.getAllQuotes();
Id acceptedQuoteId = null;
for (NexusQuoteController.QuoteDetailWrapper w : allQ) {
    if (w.status == 'Accepted' && acceptedQuoteId == null) {
        acceptedQuoteId = w.quoteId;
        System.debug('Using quote: ' + w.name + ' | ID: ' + w.quoteId + ' | OppId: ' + w.opportunityId);
    }
}

if (acceptedQuoteId == null) {
    System.debug('No Accepted quote found — cannot test contract generation');
} else {
    try {
        Id contractId = NexusQuoteController.generateAndSendContract(acceptedQuoteId);
        System.debug('SUCCESS — Contract created: ' + contractId);
    } catch (Exception ex) {
        System.debug('CONTRACT CREATION FAILED: ' + ex.getTypeName() + ': ' + ex.getMessage());
        System.debug('Stack: ' + ex.getStackTraceString());
    }
}

// Also check Contract Status picklist values
System.debug('=== VALID CONTRACT STATUSES ===');
for (Schema.PicklistEntry pe : Contract.Status.getDescribe().getPicklistValues()) {
    System.debug('CONTRACT STATUS: ' + pe.getValue() + ' | active=' + pe.isActive());
}
