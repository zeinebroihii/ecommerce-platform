List<TALEXO_Quote__c> qs = [SELECT Id, Name, Status__c, OwnerId FROM TALEXO_Quote__c LIMIT 10];
System.debug('COUNT: ' + qs.size());
for(TALEXO_Quote__c q : qs) System.debug('Q: ' + q.Name + ' | ' + q.Status__c + ' | owner=' + q.OwnerId);
