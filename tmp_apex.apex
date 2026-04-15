List<Profile> profiles = [SELECT Id, Name FROM Profile WHERE Name LIKE '%Community%' OR Name LIKE '%Portal%'];
for(Profile p : profiles) System.debug('Profile: ' + p.Name + ' | ' + p.Id);
ApexClass cls = [SELECT Id FROM ApexClass WHERE Name = 'SupportChatController' LIMIT 1];
System.debug('Class ID: ' + cls.Id);
