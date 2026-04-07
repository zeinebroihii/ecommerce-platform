TALEXO_Quote__c q = [SELECT Id, Name, DvelopEnvelopeId__c FROM TALEXO_Quote__c WHERE Name = 'DEVIS-0022' LIMIT 1];
System.debug('DEVIS-0022 EnvelopeId: ' + q.DvelopEnvelopeId__c);
