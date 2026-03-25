// Test if compiled QuoteController can query Status__c at runtime
// (pre-compiled Apex vs anonymous apex schema context)
try {
    List<QuoteController.QuoteWrapper> result = QuoteController.getAccountQuotes(null);
    System.debug('getAccountQuotes(null) succeeded — returned: ' + result.size() + ' records');
} catch (Exception ex) {
    System.debug('getAccountQuotes FAILED: ' + ex.getTypeName() + ': ' + ex.getMessage());
}

// Also test NexusQuoteController
try {
    List<NexusQuoteController.QuoteDetailWrapper> allQ = NexusQuoteController.getAllQuotes();
    System.debug('getAllQuotes() succeeded — returned: ' + allQ.size() + ' records');
} catch (Exception ex) {
    System.debug('getAllQuotes FAILED: ' + ex.getTypeName() + ': ' + ex.getMessage());
}
