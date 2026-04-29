/**
 * EinsteinLeadAnalysisController
 *
 * Calls the Nexus_Lead_Analysis Einstein Prompt Builder template to
 * generate a deep B2B lead analysis and saves the result to AIReason__c.
 *
 * Prompt Template API name : Nexus_Lead_Analysis
 * Input param key          : Input:LeadData (single formatted string)
 */
public with sharing class EinsteinLeadAnalysisController {

    private static final String TEMPLATE_API = 'Nexus_Lead_Analysis';

    @AuraEnabled(cacheable=false)
    public static String analyzeLeadWithEinstein(String leadId) {
        // 1. Read all relevant fields
        Lead l = [
            SELECT Id, Company, Industry, NumberOfEmployees,
                   Intent__c, Website, Email, Status,
                   AIScore__c, AIReason__c
            FROM Lead
            WHERE Id = :leadId
            LIMIT 1
        ];

        // 2. Build a structured data string to pass as the single input
        String leadData =
            'Entreprise: '            + blankOr(l.Company)            + '\n' +
            'Secteur: '               + blankOr(l.Industry)           + '\n' +
            'Effectif: '              + empLabel(l.NumberOfEmployees)  + '\n' +
            'Intention déclarée: '    + blankOr(l.Intent__c)          + '\n' +
            'Site web: '              + blankOr(l.Website)            + '\n' +
            'Email: '                 + blankOr(l.Email)              + '\n' +
            'Statut lead: '           + blankOr(l.Status)             + '\n' +
            'Score initial (règles): '+ scoreLabel(l.AIScore__c);

        // 3. Build Prompt Builder input
        ConnectApi.EinsteinPromptTemplateGenerationsInput promptInput =
            new ConnectApi.EinsteinPromptTemplateGenerationsInput();
        promptInput.isPreview = false;
        promptInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
        promptInput.additionalConfig.applicationName = 'PromptTemplateGenerationsInvocable';

        Map<String, ConnectApi.WrappedValue> valueMap = new Map<String, ConnectApi.WrappedValue>();
        valueMap.put('Input:Lead_Data', wrapString(leadData));
        promptInput.inputParams = valueMap;

        // 4. Call Einstein LLM
        ConnectApi.EinsteinPromptTemplateGenerationsRepresentation response =
            ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
                TEMPLATE_API,
                promptInput
            );

        if (response == null
            || response.generations == null
            || response.generations.isEmpty()) {
            throw new AuraHandledException('Einstein n\'a retourné aucune réponse. Vérifiez que le template Nexus_Lead_Analysis est publié.');
        }

        String analysisText = response.generations[0].text;

        // 5. Persist to AIReason__c so the result survives page refresh
        l.AIReason__c = analysisText;
        update l;

        return analysisText;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static String blankOr(String val) {
        return String.isNotBlank(val) ? val : 'Non renseigné';
    }

    private static String empLabel(Integer n) {
        if (n == null)   return 'Non renseigné';
        if (n >= 1000)   return n + ' employés (Grand groupe)';
        if (n >= 200)    return n + ' employés (ETI)';
        if (n >= 50)     return n + ' employés (PME)';
        if (n >= 10)     return n + ' employés (Petite entreprise)';
        return n + ' employés (Micro-entreprise)';
    }

    private static String scoreLabel(Decimal score) {
        if (score == null) return 'Non calculé';
        Integer s = score.intValue();
        if (s >= 80) return s + '/100 (Haute intention)';
        if (s >= 60) return s + '/100 (Intention modérée)';
        return s + '/100 (Score faible)';
    }

    private static ConnectApi.WrappedValue wrapString(String val) {
        ConnectApi.WrappedValue wv = new ConnectApi.WrappedValue();
        wv.value = val != null ? val : '';
        return wv;
    }
}
