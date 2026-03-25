// Check if there are any DeletedField records or check EntityDefinition
// Also try to insert a TALEXO_Quote__c record directly to see what happens
try {
    TALEXO_Quote__c tq = new TALEXO_Quote__c();
    insert tq;
    System.debug('Inserted test record: ' + tq.Id);

    // Now try to update with Status__c via dynamic DML
    try {
        SObject s = tq;
        s.put('Status__c', 'Draft');
        update s;
        System.debug('Status__c SET OK — field exists!');
    } catch (Exception putEx) {
        System.debug('Status__c PUT failed: ' + putEx.getMessage());
    }

    delete tq;
} catch (Exception insertEx) {
    System.debug('INSERT failed: ' + insertEx.getMessage());
}

// Also: check what the Apex compiler sees for TALEXO_Quote__c
// (if the class compiles with Status__c, the field exists at compile time)
TALEXO_Quote__c testObj = new TALEXO_Quote__c();
System.debug('Created sObject type: ' + testObj.getSObjectType());
System.debug('Can access fields: ' + testObj.getSObjectType().getDescribe().fields.getMap().size());
