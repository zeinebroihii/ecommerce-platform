ApexClass cls = [SELECT Id FROM ApexClass WHERE Name = 'TestimonialController' LIMIT 1];
List<Profile> guestProfiles = [SELECT Id, Name FROM Profile WHERE UserType = 'Guest'];
List<SetupEntityAccess> toInsert = new List<SetupEntityAccess>();
for (Profile p : guestProfiles) {
    List<PermissionSet> ps = [SELECT Id FROM PermissionSet WHERE ProfileId = :p.Id AND IsOwnedByProfile = true LIMIT 1];
    if (ps.isEmpty()) continue;
    List<SetupEntityAccess> existing = [SELECT Id FROM SetupEntityAccess WHERE SetupEntityId = :cls.Id AND ParentId = :ps[0].Id LIMIT 1];
    if (existing.isEmpty()) {
        toInsert.add(new SetupEntityAccess(SetupEntityId = cls.Id, ParentId = ps[0].Id));
        System.debug('Granting: ' + p.Name);
    } else {
        System.debug('Already granted: ' + p.Name);
    }
}
if (!toInsert.isEmpty()) insert toInsert;
System.debug('Done. Newly granted to ' + toInsert.size() + ' profiles.');
