List<Stock__c> stocks = [SELECT Id, Product__r.Name FROM Stock__c WHERE Product__c != null LIMIT 1];
if (stocks.isEmpty()) { System.debug('NO_STOCK'); return; }
String stockId = stocks[0].Id;
System.debug('stockId: ' + stockId);

try {
    ConnectApi.EinsteinPromptTemplateGenerationsInput input = new ConnectApi.EinsteinPromptTemplateGenerationsInput();
    input.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
    input.additionalConfig.applicationName = 'PromptBuilderPreview';
    input.isPreview = false;
    Map<String, ConnectApi.WrappedValue> valMap = new Map<String, ConnectApi.WrappedValue>();
    ConnectApi.WrappedValue recordVal = new ConnectApi.WrappedValue();
    recordVal.value = stockId;
    valMap.put('Input:Stock__c', recordVal);
    input.inputParams = valMap;
    ConnectApi.EinsteinPromptTemplateGenerationsRepresentation result =
        ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate('Stock_Reorder_Brief', input);
    System.debug('result null? ' + (result == null));
    if (result != null) {
        System.debug('generations null? ' + (result.generations == null));
        System.debug('generations size: ' + (result.generations != null ? result.generations.size() : -1));
        if (result.generations != null && !result.generations.isEmpty()) {
            System.debug('text: ' + result.generations[0].text);
            System.debug('parameters: ' + result.generations[0]);
        }
        // Check prompt property too
        System.debug('prompt: ' + result.prompt);
    }
} catch (Exception ex) {
    System.debug('ERROR_TYPE: ' + ex.getTypeName());
    System.debug('ERROR_MSG: ' + ex.getMessage());
    System.debug('STACK: ' + ex.getStackTraceString());
}
