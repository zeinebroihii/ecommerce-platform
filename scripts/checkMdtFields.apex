Map<String, Schema.SObjectField> fields = Schema.getGlobalDescribe().get('DocuSignConfig_mdt__mdt').getDescribe().fields.getMap();
for(String f : fields.keySet()) System.debug('FIELD: ' + f);
