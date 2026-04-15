PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'NexusPortalProducts' LIMIT 1];

// Assign to all guest users (covers all Experience Cloud sites)
List<User> guests = [SELECT Id, Name FROM User WHERE IsActive = true AND UserType = 'Guest'];
List<PermissionSetAssignment> toInsert = new List<PermissionSetAssignment>();

Set<Id> alreadyAssigned = new Set<Id>();
for(PermissionSetAssignment existing : [SELECT AssigneeId FROM PermissionSetAssignment WHERE PermissionSetId = :ps.Id AND Assignee.UserType = 'Guest']) {
    alreadyAssigned.add(existing.AssigneeId);
}

for(User u : guests) {
    if(!alreadyAssigned.contains(u.Id)) {
        toInsert.add(new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = ps.Id));
        System.debug('Assigning to: ' + u.Name);
    } else {
        System.debug('Already assigned: ' + u.Name);
    }
}
if(!toInsert.isEmpty()) insert toInsert;
System.debug('Done. Assigned to ' + toInsert.size() + ' guest user(s).');
