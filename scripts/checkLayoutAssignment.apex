String profileId = [SELECT ProfileId FROM User WHERE Username = 'zeineb.roihi.c4d9e01c2cc0@agentforce.com' LIMIT 1].ProfileId;
String profileName = [SELECT Name FROM Profile WHERE Id = :profileId LIMIT 1].Name;
System.debug('Profile: ' + profileName);

List<ProfileLayout> assignments = [SELECT Id, Layout.Name FROM ProfileLayout WHERE SobjectType = 'Product2' AND Profile.Name = :profileName];
for (ProfileLayout pl : assignments) {
    System.debug('Product2 Layout assigned: ' + pl.Layout.Name);
}
if (assignments.isEmpty()) {
    System.debug('NO layout assignment for Product2 on this profile — using org default');
}
