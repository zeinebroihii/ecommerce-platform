List<EntityDefinition> types = [SELECT QualifiedApiName, Label FROM EntityDefinition WHERE QualifiedApiName LIKE '%ocu%' LIMIT 20];
for(EntityDefinition e : types) System.debug('MDT: ' + e.QualifiedApiName + ' / ' + e.Label);
