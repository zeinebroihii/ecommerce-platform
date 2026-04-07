// Check current user profile + quote sharing
User me = [SELECT Id, Name, ProfileId, Profile.Name, UserType FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
System.debug('Current user: ' + me.Name + ' | Profile: ' + me.Profile.Name + ' | Type: ' + me.UserType);

// Check quotes with sharing context
List<TALEXO_Quote__c> qs = [SELECT Id, Name, Status__c, OwnerId FROM TALEXO_Quote__c LIMIT 5];
System.debug('Quotes visible: ' + qs.size());
for(TALEXO_Quote__c q : qs) System.debug('  ' + q.Name + ' | owner=' + q.OwnerId + ' | me=' + UserInfo.getUserId());
