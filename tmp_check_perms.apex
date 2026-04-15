// Check what Einstein/GenAI permissions exist and which ones community users need
// Find available user permissions related to Einstein/AI
List<PermissionSet> aiPerms = [
    SELECT Id, Name, Label
    FROM PermissionSet
    WHERE (Name LIKE '%Einstein%' OR Name LIKE '%GenAI%' OR Name LIKE '%Generative%' OR Name LIKE '%Prompt%' OR Name LIKE '%AIUser%')
    AND IsOwnedByProfile = false
    LIMIT 20
];
for (PermissionSet ps : aiPerms) {
    System.debug('PermSet: ' + ps.Name + ' | ' + ps.Label);
}

// Check which ones our test portal user already has
User portalUser = [SELECT Id, Name FROM User WHERE Profile.Name IN ('Customer Community Plus Login User','Customer Community Plus User') AND IsActive = true AND AccountId != null LIMIT 1];
System.debug('Portal user: ' + portalUser.Name);

List<PermissionSetAssignment> assignments = [
    SELECT PermissionSet.Name, PermissionSet.Label
    FROM PermissionSetAssignment
    WHERE AssigneeId = :portalUser.Id
];
for (PermissionSetAssignment a : assignments) {
    System.debug('Has perm set: ' + a.PermissionSet.Name + ' | ' + a.PermissionSet.Label);
}
