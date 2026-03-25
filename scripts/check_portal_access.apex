List<ApexClass> classes = [SELECT Id, Name FROM ApexClass WHERE Name IN ('NexusQuoteController','QuoteController','AuthController') ORDER BY Name];
for (ApexClass c : classes) { System.debug('CLASS: ' + c.Name + ' | Id: ' + c.Id); }

User u = [SELECT Id, ProfileId, Profile.Name, UserType FROM User WHERE Email = 'zeineb.roihi@esprit.tn' LIMIT 1];
System.debug('Portal user profile: ' + u.Profile.Name + ' | Id: ' + u.ProfileId + ' | Type: ' + u.UserType);

// Check existing class access for this profile
List<SetupEntityAccess> sea = [SELECT SetupEntityId FROM SetupEntityAccess WHERE ParentId IN (SELECT Id FROM PermissionSet WHERE ProfileId = :u.ProfileId)];
System.debug('Total setup entity accesses: ' + sea.size());
