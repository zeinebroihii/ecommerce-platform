TALEXO_Quote__c dv17 = [SELECT Id FROM TALEXO_Quote__c WHERE Name='DEVIS-0017' LIMIT 1];
System.debug('DEVIS-0017 Id: ' + dv17.Id);
NexusQuoteController.sendToCustomer(dv17.Id);
Opportunity o = [SELECT StageName FROM Opportunity WHERE Id = '006g5000002YscjAAC'];
System.debug('Opp stage after sendToCustomer: ' + o.StageName);
