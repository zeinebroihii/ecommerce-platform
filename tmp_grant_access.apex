// Grant SupportChatController Apex access to community portal users
String classId = '01pg50000053EDFAA2'; // SupportChatController

// Upsert permission set
PermissionSet ps;
List<PermissionSet> existing = [SELECT Id FROM PermissionSet WHERE Name = 'NexusChatApexAccess' LIMIT 1];
if (existing.isEmpty()) {
    ps = new PermissionSet(Name = 'NexusChatApexAccess', Label = 'Nexus Chat Apex Access');
    insert ps;
    System.debug('Created permission set: ' + ps.Id);
} else {
    ps = existing[0];
    System.debug('Using existing permission set: ' + ps.Id);
}

// Add class access if not already there
List<SetupEntityAccess> existingAccess = [SELECT Id FROM SetupEntityAccess WHERE ParentId = :ps.Id AND SetupEntityId = :classId LIMIT 1];
if (existingAccess.isEmpty()) {
    SetupEntityAccess sea = new SetupEntityAccess();
    sea.ParentId = ps.Id;
    sea.SetupEntityId = classId;
    insert sea;
    System.debug('Granted class access');
} else {
    System.debug('Class access already granted');
}

// Assign to all active community users
List<String> communityProfiles = new List<String>{
    'Customer Community Plus Login User',
    'Customer Community Plus User',
    'Customer Community Login User',
    'Customer Community User'
};
List<User> portalUsers = [SELECT Id, Name FROM User WHERE Profile.Name IN :communityProfiles AND IsActive = true];
System.debug('Portal users found: ' + portalUsers.size());

List<PermissionSetAssignment> toInsert = new List<PermissionSetAssignment>();
Set<Id> alreadyAssigned = new Set<Id>();
for (PermissionSetAssignment psa : [SELECT AssigneeId FROM PermissionSetAssignment WHERE PermissionSetId = :ps.Id]) {
    alreadyAssigned.add(psa.AssigneeId);
}

for (User u : portalUsers) {
    if (!alreadyAssigned.contains(u.Id)) {
        toInsert.add(new PermissionSetAssignment(PermissionSetId = ps.Id, AssigneeId = u.Id));
        System.debug('Will assign to: ' + u.Name);
    } else {
        System.debug('Already assigned to: ' + u.Name);
    }
}
if (!toInsert.isEmpty()) {
    insert toInsert;
    System.debug('Assigned to ' + toInsert.size() + ' users');
}
System.debug('Done.');
