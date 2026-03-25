// Find all custom objects containing 'Quote' or 'TALEXO'
Map<String, Schema.SObjectType> allObjects = Schema.getGlobalDescribe();
for (String name : allObjects.keySet()) {
    if (name.containsIgnoreCase('quote') || name.containsIgnoreCase('talexo') || name.containsIgnoreCase('nexus')) {
        System.debug('OBJECT: ' + name);
    }
}
