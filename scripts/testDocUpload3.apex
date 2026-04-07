// testDocUpload3.apex
// Focus: POST /sign/api/v2/envelopes/{id}/documents — try correct body formats
// Test D showed the endpoint exists, just wrong body format

String baseUrl = 'https://talan.d-velop.cloud';
String apiKey = [SELECT ApiKey__c FROM DvelopConfig__mdt WHERE DeveloperName = 'Default' LIMIT 1].ApiKey__c;
Http h = new Http();

String pdfStr =
    '%PDF-1.4\n' +
    '1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n' +
    '2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n' +
    '3 0 obj\n<<\n/Type /Page\n/MediaBox [0 0 612 792]\n/Parent 2 0 R\n>>\nendobj\n' +
    'xref\n0 4\n' +
    '0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n' +
    'trailer\n<</Size 4/Root 1 0 R>>\nstartxref\n186\n%%EOF\n';
Blob pdfBlob = Blob.valueOf(pdfStr);
String pdfBase64 = EncodingUtil.base64Encode(pdfBlob);

// Helper: create a fresh envelope
HttpRequest rEnv = new HttpRequest();
rEnv.setMethod('POST');
rEnv.setEndpoint(baseUrl + '/sign/api/v2/envelopes');
rEnv.setHeader('Authorization', 'Bearer ' + apiKey);
rEnv.setHeader('Content-Type', 'application/json');
rEnv.setTimeout(15000);
rEnv.setBody('{"name":"TEST-DOC-FORMAT","signingOrder":false}');
HttpResponse resEnv = h.send(rEnv);
System.debug('Envelope created → ' + resEnv.getStatusCode() + ': ' + resEnv.getBody().left(100));
String envId = (String)((Map<String,Object>)JSON.deserializeUntyped(resEnv.getBody())).get('id');
System.debug('envId=' + envId);

// ── FORMAT 1: {"documents": [{filename, base64Content}]} ─────────────────────
System.debug('=== FORMAT 1: documents array with base64Content ===');
String body1 = '{"documents":[{"filename":"contract.pdf","base64Content":"' + pdfBase64 + '"}]}';
HttpRequest r1 = new HttpRequest();
r1.setMethod('POST');
r1.setEndpoint(baseUrl + '/sign/api/v2/envelopes/' + envId + '/documents');
r1.setHeader('Authorization', 'Bearer ' + apiKey);
r1.setHeader('Content-Type', 'application/json');
r1.setTimeout(15000);
r1.setBody(body1);
HttpResponse res1 = h.send(r1);
System.debug('F1 → ' + res1.getStatusCode() + ': ' + res1.getBody().left(400));
if (res1.getStatusCode() >= 200 && res1.getStatusCode() < 300) {
    System.debug('*** FORMAT 1 SUCCESS ***');
}

// ── FORMAT 2: {"documents": [{filename, content}]} ───────────────────────────
System.debug('=== FORMAT 2: documents array with content ===');
String body2 = '{"documents":[{"filename":"contract.pdf","content":"' + pdfBase64 + '"}]}';
HttpRequest r2 = new HttpRequest();
r2.setMethod('POST');
r2.setEndpoint(baseUrl + '/sign/api/v2/envelopes/' + envId + '/documents');
r2.setHeader('Authorization', 'Bearer ' + apiKey);
r2.setHeader('Content-Type', 'application/json');
r2.setTimeout(15000);
r2.setBody(body2);
HttpResponse res2 = h.send(r2);
System.debug('F2 → ' + res2.getStatusCode() + ': ' + res2.getBody().left(400));
if (res2.getStatusCode() >= 200 && res2.getStatusCode() < 300) {
    System.debug('*** FORMAT 2 SUCCESS ***');
}

// ── FORMAT 3: [{filename, base64Content}] (array at root) ────────────────────
System.debug('=== FORMAT 3: root array ===');
String body3 = '[{"filename":"contract.pdf","base64Content":"' + pdfBase64 + '"}]';
HttpRequest r3 = new HttpRequest();
r3.setMethod('POST');
r3.setEndpoint(baseUrl + '/sign/api/v2/envelopes/' + envId + '/documents');
r3.setHeader('Authorization', 'Bearer ' + apiKey);
r3.setHeader('Content-Type', 'application/json');
r3.setTimeout(15000);
r3.setBody(body3);
HttpResponse res3 = h.send(r3);
System.debug('F3 → ' + res3.getStatusCode() + ': ' + res3.getBody().left(400));
if (res3.getStatusCode() >= 200 && res3.getStatusCode() < 300) {
    System.debug('*** FORMAT 3 SUCCESS ***');
}

// ── FORMAT 4: {"documents": [{name, data}]} ──────────────────────────────────
System.debug('=== FORMAT 4: name + data fields ===');
String body4 = '{"documents":[{"name":"contract.pdf","data":"' + pdfBase64 + '"}]}';
HttpRequest r4 = new HttpRequest();
r4.setMethod('POST');
r4.setEndpoint(baseUrl + '/sign/api/v2/envelopes/' + envId + '/documents');
r4.setHeader('Authorization', 'Bearer ' + apiKey);
r4.setHeader('Content-Type', 'application/json');
r4.setTimeout(15000);
r4.setBody(body4);
HttpResponse res4 = h.send(r4);
System.debug('F4 → ' + res4.getStatusCode() + ': ' + res4.getBody().left(400));
if (res4.getStatusCode() >= 200 && res4.getStatusCode() < 300) {
    System.debug('*** FORMAT 4 SUCCESS ***');
}

// ── FORMAT 5: {"documents": [{filename, fileContent}]} ───────────────────────
System.debug('=== FORMAT 5: fileContent field ===');
String body5 = '{"documents":[{"filename":"contract.pdf","fileContent":"' + pdfBase64 + '"}]}';
HttpRequest r5 = new HttpRequest();
r5.setMethod('POST');
r5.setEndpoint(baseUrl + '/sign/api/v2/envelopes/' + envId + '/documents');
r5.setHeader('Authorization', 'Bearer ' + apiKey);
r5.setHeader('Content-Type', 'application/json');
r5.setTimeout(15000);
r5.setBody(body5);
HttpResponse res5 = h.send(r5);
System.debug('F5 → ' + res5.getStatusCode() + ': ' + res5.getBody().left(400));
if (res5.getStatusCode() >= 200 && res5.getStatusCode() < 300) {
    System.debug('*** FORMAT 5 SUCCESS ***');
}

// ── FORMAT 6: PUT /sign/api/v2/envelopes/{id}/documents (no doc id) ──────────
System.debug('=== FORMAT 6: PUT to /envelopes/{id}/documents (binary) ===');
HttpRequest r6 = new HttpRequest();
r6.setMethod('PUT');
r6.setEndpoint(baseUrl + '/sign/api/v2/envelopes/' + envId + '/documents');
r6.setHeader('Authorization', 'Bearer ' + apiKey);
r6.setHeader('Content-Type', 'application/octet-stream');
r6.setHeader('Content-Disposition', 'attachment; filename="contract.pdf"');
r6.setTimeout(15000);
r6.setBodyAsBlob(pdfBlob);
HttpResponse res6 = h.send(r6);
System.debug('F6 → ' + res6.getStatusCode() + ': ' + res6.getBody().left(400));
if (res6.getStatusCode() >= 200 && res6.getStatusCode() < 300) {
    System.debug('*** FORMAT 6 SUCCESS ***');
}
