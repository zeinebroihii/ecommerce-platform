Map<String, Schema.SObjectField> fields = Schema.SObjectType.NewsletterSubscriber__c.fields.getMap();
List<String> customFields = new List<String>();
for (String fname : fields.keySet()) {
    if (fname.endsWith('__c')) customFields.add(fname);
}
System.debug('Custom fields: ' + customFields);
