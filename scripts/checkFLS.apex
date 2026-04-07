// Check object permissions and field permissions for the NexusQuoteFields PS
PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'NexusQuoteFields' LIMIT 1];

// Check object-level permissions
List<ObjectPermissions> objPerms = [
    SELECT PermissionsRead, PermissionsEdit, PermissionsCreate
    FROM ObjectPermissions
    WHERE ParentId = :ps.Id AND SobjectType = 'TALEXO_Quote__c'
];
System.debug('Object permissions count: ' + objPerms.size());
if (!objPerms.isEmpty()) {
    System.debug('Read: ' + objPerms[0].PermissionsRead + ' Edit: ' + objPerms[0].PermissionsEdit);
}

// Check field permissions
List<FieldPermissions> fps = [
    SELECT Field, PermissionsRead, PermissionsEdit
    FROM FieldPermissions
    WHERE ParentId = :ps.Id AND SobjectType = 'TALEXO_Quote__c'
];
System.debug('Field permissions count: ' + fps.size());
for (FieldPermissions fp : fps) {
    System.debug('  ' + fp.Field + ' R:' + fp.PermissionsRead + ' E:' + fp.PermissionsEdit);
}
