TALEXO_Quote__c q = [SELECT Id FROM TALEXO_Quote__c WHERE Name = 'DEVIS-0017' LIMIT 1];

// Test 1: with explicit signer email
String result1 = NexusQuoteController.devTestInvoiceEmail(q.Id, 'zeineb.roihi@esprit.tn');
System.debug('Test 1 (explicit email): ' + result1);

// Test 2: with null (fallback to account lookup)
String result2 = NexusQuoteController.devTestInvoiceEmail(q.Id, null);
System.debug('Test 2 (account lookup): ' + result2);
