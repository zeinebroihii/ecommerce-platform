PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'NexusProductFields' LIMIT 1];
User u = [SELECT Id FROM User WHERE Username = 'zeineb.roihi.c4d9e01c2cc0@agentforce.com' LIMIT 1];
try {
    insert new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = ps.Id);
    System.debug('SUCCESS: Assigned NexusProductFields to user');
} catch (DmlException e) {
    System.debug('Already assigned or error: ' + e.getMessage());
}
