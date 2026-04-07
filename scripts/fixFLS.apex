PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'NexusQuoteFields' LIMIT 1];

// Add object-level permissions (required for field permissions to take effect)
List<ObjectPermissions> existing = [
    SELECT Id FROM ObjectPermissions
    WHERE ParentId = :ps.Id AND SobjectType = 'TALEXO_Quote__c' LIMIT 1
];

if (existing.isEmpty()) {
    insert new ObjectPermissions(
        ParentId = ps.Id,
        SobjectType = 'TALEXO_Quote__c',
        PermissionsRead = true,
        PermissionsCreate = true,
        PermissionsEdit = true,
        PermissionsDelete = false,
        PermissionsViewAllRecords = true,
        PermissionsModifyAllRecords = false
    );
    System.debug('SUCCESS: Object permissions added for TALEXO_Quote__c');
} else {
    update new ObjectPermissions(
        Id = existing[0].Id,
        PermissionsRead = true,
        PermissionsCreate = true,
        PermissionsEdit = true,
        PermissionsViewAllRecords = true
    );
    System.debug('SUCCESS: Object permissions updated for TALEXO_Quote__c');
}
