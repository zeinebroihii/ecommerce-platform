// Use EntityDefinition/FieldDefinition via tooling-style SOQL
// (not available in regular Apex, but let's try alternative)

// Check the Org's Schema for TALEXO_Quote__c using Metadata SOQL
// We'll also try the PermissionSet approach to see which fields are accessible

// Alternative: try all possible field name variations
List<String> candidates = new List<String>{
    'Status__c', 'status__c', 'Grand_Total__c', 'GrandTotal__c',
    'Negotiation_Status__c', 'NegotiationStatus__c',
    'Opportunity__c', 'Expiration_Date__c', 'ExpirationDate__c'
};

Schema.SObjectType sot = Schema.getGlobalDescribe().get('TALEXO_Quote__c');
Schema.DescribeSObjectResult dsr = sot.getDescribe(SObjectDescribeOptions.DEFERRED);
Map<String, Schema.SObjectField> fm = dsr.fields.getMap();

System.debug('Field count with DEFERRED: ' + fm.size());
for (String c : candidates) {
    System.debug('Has ' + c + ': ' + fm.containsKey(c));
}

// List all fields including standard
for (String fn : fm.keySet()) {
    System.debug('FIELD: ' + fn);
}
