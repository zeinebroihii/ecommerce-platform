// Try PromptTemplatePermSet instead — separate license pool
PermissionSet ps = [SELECT Id, Name FROM PermissionSet WHERE Name = 'PromptTemplatePermSet' LIMIT 1];
System.debug('PermSet: ' + ps.Name + ' ' + ps.Id);

// Check license usage
List<PermissionSetAssignment> existing = [SELECT Id, AssigneeId FROM PermissionSetAssignment WHERE PermissionSetId = :ps.Id];
System.debug('Currently assigned to: ' + existing.size() + ' users');

// Try to assign to ONE portal user first to see if licenses are available
User portalUser = [SELECT Id, Name FROM User WHERE Profile.Name IN ('Customer Community Plus Login User','Customer Community Plus User') AND IsActive = true AND AccountId != null LIMIT 1];
System.debug('Target user: ' + portalUser.Name);

// Check if already assigned
Boolean alreadyHas = false;
for (PermissionSetAssignment a : existing) {
    if (a.AssigneeId == portalUser.Id) { alreadyHas = true; break; }
}

if (!alreadyHas) {
    try {
        insert new PermissionSetAssignment(PermissionSetId = ps.Id, AssigneeId = portalUser.Id);
        System.debug('SUCCESS — assigned PromptTemplatePermSet to ' + portalUser.Name);
    } catch (Exception ex) {
        System.debug('FAILED: ' + ex.getMessage());
    }
} else {
    System.debug('Already assigned');
}
