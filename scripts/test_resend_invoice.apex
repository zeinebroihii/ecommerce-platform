TALEXO_Quote__c q = [SELECT Id FROM TALEXO_Quote__c WHERE Name = 'DEVIS-0017' LIMIT 1];
NexusQuoteController.devResetQuoteStatus(q.Id, 'Accepted');
System.debug('DEVIS-0017 reset to Accepted — go sign it in the portal');
