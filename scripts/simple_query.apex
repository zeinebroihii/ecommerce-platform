// Dynamic SOQL to bypass compile-time check
try {
    List<SObject> recs = Database.query('SELECT Id, Status__c FROM TALEXO_Quote__c LIMIT 3');
    System.debug('Status__c EXISTS - records: ' + recs.size());
    for (SObject r : recs) System.debug('  status: ' + r.get('Status__c'));
} catch (System.QueryException qe) {
    System.debug('FIELD DOES NOT EXIST: ' + qe.getMessage());
} catch (Exception ex) {
    System.debug('OTHER ERROR: ' + ex.getMessage());
}

// Also try GrandTotal__c
try {
    List<SObject> recs2 = Database.query('SELECT Id, GrandTotal__c FROM TALEXO_Quote__c LIMIT 1');
    System.debug('GrandTotal__c EXISTS');
} catch (Exception ex2) {
    System.debug('GrandTotal__c NOT FOUND: ' + ex2.getMessage());
}

// Check field count via tooling
Integer fc = Schema.getGlobalDescribe().get('TALEXO_Quote__c').getDescribe().fields.getMap().size();
System.debug('Field count (may be stale schema cache): ' + fc);

// Force fresh describe
List<Schema.DescribeSObjectResult> results = Schema.describeSObjects(new List<String>{'TALEXO_Quote__c'});
System.debug('Fresh describe field count: ' + results[0].fields.getMap().size());
List<String> cf = new List<String>();
for (String fn : results[0].fields.getMap().keySet()) {
    if (fn.endsWith('__c')) cf.add(fn);
}
cf.sort();
System.debug('Custom fields found: ' + cf);
