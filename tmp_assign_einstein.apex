PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'EinsteinGPTPromptTemplateUser' LIMIT 1];
System.debug('PermSet to assign: ' + ps.Id);

List<String> communityProfiles = new List<String>{
    'Customer Community Plus Login User',
    'Customer Community Plus User',
    'Customer Community Login User',
    'Customer Community User'
};
List<User> portalUsers = [SELECT Id, Name FROM User WHERE Profile.Name IN :communityProfiles AND IsActive = true];
System.debug('Portal users: ' + portalUsers.size());

Set<Id> alreadyAssigned = new Set<Id>();
for (PermissionSetAssignment psa : [SELECT AssigneeId FROM PermissionSetAssignment WHERE PermissionSetId = :ps.Id]) {
    alreadyAssigned.add(psa.AssigneeId);
}

List<PermissionSetAssignment> toInsert = new List<PermissionSetAssignment>();
for (User u : portalUsers) {
    if (!alreadyAssigned.contains(u.Id)) {
        toInsert.add(new PermissionSetAssignment(PermissionSetId = ps.Id, AssigneeId = u.Id));
        System.debug('Assigning to: ' + u.Name);
    } else {
        System.debug('Already has it: ' + u.Name);
    }
}
if (!toInsert.isEmpty()) {
    insert toInsert;
    System.debug('Done — assigned to ' + toInsert.size() + ' users');
} else {
    System.debug('All users already had the permission');
}
