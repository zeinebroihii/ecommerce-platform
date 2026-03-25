// Describe TALEXO_Quote__c fields
Map<String, Schema.SObjectField> flds = Schema.SObjectType.TALEXO_Quote__c.fields.getMap();
List<String> names = new List<String>(flds.keySet());
names.sort();
for (String n : names) {
    System.debug('FIELD: ' + n + ' => ' + flds.get(n).getDescribe().getLabel());
}
