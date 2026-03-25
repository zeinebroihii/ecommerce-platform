// Check what custom fields actually exist on TALEXO_Quote__c
Map<String, Schema.SObjectField> flds = Schema.getGlobalDescribe()
    .get('TALEXO_Quote__c').getDescribe().fields.getMap();
System.debug('Total fields on TALEXO_Quote__c: ' + flds.size());
List<String> customFields = new List<String>();
for (String fn : flds.keySet()) {
    if (fn.endsWith('__c')) customFields.add(fn);
}
customFields.sort();
for (String fn : customFields) {
    System.debug('CUSTOM FIELD: ' + fn + ' => ' + flds.get(fn).getDescribe().getLabel());
}

// Also check NexusQuoteLineItem__c
Map<String, Schema.SObjectField> flds2 = Schema.getGlobalDescribe()
    .get('NexusQuoteLineItem__c').getDescribe().fields.getMap();
List<String> cf2 = new List<String>();
for (String fn : flds2.keySet()) {
    if (fn.endsWith('__c')) cf2.add(fn);
}
cf2.sort();
System.debug('=== NexusQuoteLineItem__c custom fields ===');
for (String fn : cf2) {
    System.debug('LI FIELD: ' + fn + ' => ' + flds2.get(fn).getDescribe().getLabel());
}

// Check valid Opportunity stages
System.debug('=== VALID OPP STAGES ===');
for (Schema.PicklistEntry pe : Opportunity.StageName.getDescribe().getPicklistValues()) {
    if (pe.isActive()) System.debug('STAGE: ' + pe.getValue());
}

// Basic query with only standard fields
List<TALEXO_Quote__c> recs = [SELECT Id, Name, CreatedDate FROM TALEXO_Quote__c ORDER BY CreatedDate DESC LIMIT 5];
System.debug('Quote records (Id+Name only): ' + recs.size());
for (TALEXO_Quote__c r : recs) System.debug('Q: ' + r.Id + ' | ' + r.Name + ' | ' + r.CreatedDate);
