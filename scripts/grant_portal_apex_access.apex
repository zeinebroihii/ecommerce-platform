// Get existing permission set
List<PermissionSet> ps = [SELECT Id FROM PermissionSet WHERE Name = 'NexusPortalAccess' LIMIT 1];
Id psId = ps[0].Id;
System.debug('PermissionSet: ' + psId);

// Debug: show actual UserType for portal emails
List<User> allPortal = [SELECT Id, Name, Email, UserType, Profile.Name, Profile.UserLicense.Name
    FROM User WHERE IsActive = true
    AND Email IN ('zeineb.roihi@esprit.tn','zeineb.roihi@esprit.tnn','zeineb.roihi@talann.com','zinouba@gmail.com','zeinoub@gmail.com')];
for (User u : allPortal) {
    System.debug('USER: ' + u.Name + ' | Email: ' + u.Email + ' | Type: ' + u.UserType + ' | Profile: ' + u.Profile.Name + ' | License: ' + u.Profile.UserLicense.Name);
}

// Assign to users whose license supports Apex class access (skip Guest/HighVolume)
Set<Id> already = new Map<Id, PermissionSetAssignment>(
    [SELECT AssigneeId FROM PermissionSetAssignment WHERE PermissionSetId = :psId AND AssigneeId IN :allPortal]
).keySet();
List<PermissionSetAssignment> assigns = new List<PermissionSetAssignment>();
for (User u : allPortal) {
    if (!already.contains(u.Id)) {
        try {
            assigns.add(new PermissionSetAssignment(PermissionSetId = psId, AssigneeId = u.Id));
        } catch(Exception e) { System.debug('Skip ' + u.Name + ': ' + e.getMessage()); }
    } else {
        System.debug('Already assigned: ' + u.Name);
    }
}
if (!assigns.isEmpty()) {
    Database.SaveResult[] results = Database.insert(assigns, false);
    for (Integer i = 0; i < results.size(); i++) {
        if (results[i].isSuccess()) { System.debug('Assigned: ' + allPortal[i].Name); }
        else { System.debug('FAILED ' + allPortal[i].Name + ': ' + results[i].getErrors()[0].getMessage()); }
    }
}
