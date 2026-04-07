// Simulate DocuSign webhook for DEVIS-0022 to create Contract + attach signed PDF
TALEXO_Quote__c q = [SELECT Id, Name, DvelopEnvelopeId__c, Status__c FROM TALEXO_Quote__c WHERE Name = 'DEVIS-0022' LIMIT 1];
System.debug('Quote: ' + q.Name + ' | Status: ' + q.Status__c + ' | EnvelopeId: ' + q.DvelopEnvelopeId__c);

// Reset status so finalizeByEnvelopeId doesn't skip it
update new TALEXO_Quote__c(Id = q.Id, Status__c = 'Accepted');

// Simulate the webhook payload and call handler directly
RestRequest req = new RestRequest();
RestResponse res = new RestResponse();
req.requestBody = Blob.valueOf(
    '{"event":"envelope-completed","data":{"envelopeId":"' + q.DvelopEnvelopeId__c +
    '","envelopeSummary":{"status":"completed"}}}'
);
req.httpMethod = 'POST';
RestContext.request = req;
RestContext.response = res;
DocuSignWebhookController.handleCallback();
System.debug('Response: ' + res.statusCode + ' | ' + res.responseBody.toString());
