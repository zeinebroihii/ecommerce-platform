PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'NexusStockIntelligence' LIMIT 1];
User u = [SELECT Id FROM User WHERE Profile.Name = 'System Administrator' AND IsActive = true ORDER BY CreatedDate ASC LIMIT 1];
insert new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = ps.Id);
System.debug('Assigned NexusStockIntelligence to: ' + u.Id);
