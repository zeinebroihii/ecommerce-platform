// testDocuSign.apex — quick end-to-end test of DocuSign signing on DEVIS-0022
TALEXO_Quote__c q = [SELECT Id, Name FROM TALEXO_Quote__c WHERE Name = 'DEVIS-0022' LIMIT 1];
System.debug('Triggering DocuSign signing for: ' + q.Name + ' (' + q.Id + ')');
DocuSignService.initiateContractSigning(q.Id);
System.debug('Called — check debug logs for [DocuSign] entries');
