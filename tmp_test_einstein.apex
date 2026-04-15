// Test Einstein call for SupportChatController directly
try {
    ConnectApi.EinsteinPromptTemplateGenerationsInput tInput =
        new ConnectApi.EinsteinPromptTemplateGenerationsInput();
    tInput.isPreview = false;
    tInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
    tInput.additionalConfig.applicationName = 'PromptTemplateGenerationsInvocable';

    Map<String, ConnectApi.WrappedValue> vals = new Map<String, ConnectApi.WrappedValue>();
    ConnectApi.WrappedValue wv = new ConnectApi.WrappedValue();
    wv.value = 'You are Nexus AI. Customer asks: Am I a VIP customer? Context: They have 6 orders and 20 quotes with total value over 700k. Respond in 2 sentences.';
    vals.put('Input:Prompt', wv);
    tInput.inputParams = vals;

    ConnectApi.EinsteinPromptTemplateGenerationsRepresentation resp =
        ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
            'Nexus_Customer_Support_Chat', tInput
        );

    if (resp != null && resp.generations != null && !resp.generations.isEmpty()) {
        System.debug('SUCCESS: ' + resp.generations[0].text);
    } else {
        System.debug('EMPTY response');
    }
} catch (Exception ex) {
    System.debug('ERROR type: ' + ex.getTypeName());
    System.debug('ERROR msg:  ' + ex.getMessage());
}
