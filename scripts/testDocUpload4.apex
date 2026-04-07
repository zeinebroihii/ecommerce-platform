// testDocUpload4.apex
// We need a temporaryDocumentId. The /sign/api/v2/documents endpoint returns 405.
// Try every possible upload path/method to find where the temp document goes.

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

// ── Try OPTIONS on the documents endpoint ────────────────────────────────────
System.debug('=== OPTIONS /sign/api/v2/documents ===');
HttpRequest rOpt = new HttpRequest();
rOpt.setMethod('OPTIONS');
rOpt.setEndpoint(baseUrl + '/sign/api/v2/documents');
rOpt.setHeader('Authorization', 'Bearer ' + apiKey);
rOpt.setTimeout(10000);
HttpResponse resOpt = h.send(rOpt);
System.debug('OPTIONS → ' + resOpt.getStatusCode() + ' Allow:' + resOpt.getHeader('Allow') + ' body:' + resOpt.getBody().left(200));

// ── POST /sign/api/v2/documents with application/pdf ─────────────────────────
System.debug('=== POST /sign/api/v2/documents (application/pdf binary) ===');
HttpRequest r1 = new HttpRequest();
r1.setMethod('POST');
r1.setEndpoint(baseUrl + '/sign/api/v2/documents');
r1.setHeader('Authorization', 'Bearer ' + apiKey);
r1.setHeader('Content-Type', 'application/pdf');
r1.setHeader('Content-Disposition', 'attachment; filename="contract.pdf"');
r1.setTimeout(15000);
r1.setBodyAsBlob(pdfBlob);
HttpResponse res1 = h.send(r1);
System.debug('POST pdf → ' + res1.getStatusCode() + ': ' + res1.getBody().left(300));

// ── POST /sign/api/v2/temporary-documents ────────────────────────────────────
System.debug('=== POST /sign/api/v2/temporary-documents ===');
HttpRequest r2 = new HttpRequest();
r2.setMethod('POST');
r2.setEndpoint(baseUrl + '/sign/api/v2/temporary-documents');
r2.setHeader('Authorization', 'Bearer ' + apiKey);
r2.setHeader('Content-Type', 'application/pdf');
r2.setTimeout(15000);
r2.setBodyAsBlob(pdfBlob);
HttpResponse res2 = h.send(r2);
System.debug('POST temp-docs → ' + res2.getStatusCode() + ': ' + res2.getBody().left(300));

// ── PUT /sign/api/v2/documents with application/pdf ──────────────────────────
System.debug('=== PUT /sign/api/v2/documents (application/pdf) ===');
HttpRequest r3 = new HttpRequest();
r3.setMethod('PUT');
r3.setEndpoint(baseUrl + '/sign/api/v2/documents');
r3.setHeader('Authorization', 'Bearer ' + apiKey);
r3.setHeader('Content-Type', 'application/pdf');
r3.setHeader('Content-Disposition', 'attachment; filename="contract.pdf"');
r3.setTimeout(15000);
r3.setBodyAsBlob(pdfBlob);
HttpResponse res3 = h.send(r3);
System.debug('PUT pdf → ' + res3.getStatusCode() + ': ' + res3.getBody().left(300));

// ── POST /sign/api/v1/documents ──────────────────────────────────────────────
System.debug('=== POST /sign/api/v1/documents ===');
HttpRequest r4 = new HttpRequest();
r4.setMethod('POST');
r4.setEndpoint(baseUrl + '/sign/api/v1/documents');
r4.setHeader('Authorization', 'Bearer ' + apiKey);
r4.setHeader('Content-Type', 'application/pdf');
r4.setTimeout(15000);
r4.setBodyAsBlob(pdfBlob);
HttpResponse res4 = h.send(r4);
System.debug('v1 POST docs → ' + res4.getStatusCode() + ': ' + res4.getBody().left(300));

// ── POST /sign/api/v2/upload ─────────────────────────────────────────────────
System.debug('=== POST /sign/api/v2/upload ===');
HttpRequest r5 = new HttpRequest();
r5.setMethod('POST');
r5.setEndpoint(baseUrl + '/sign/api/v2/upload');
r5.setHeader('Authorization', 'Bearer ' + apiKey);
r5.setHeader('Content-Type', 'application/pdf');
r5.setTimeout(15000);
r5.setBodyAsBlob(pdfBlob);
HttpResponse res5 = h.send(r5);
System.debug('POST upload → ' + res5.getStatusCode() + ': ' + res5.getBody().left(300));

// ── POST /sign/api/v2/documents as JSON with base64 ──────────────────────────
System.debug('=== POST /sign/api/v2/documents (JSON base64) ===');
HttpRequest r6 = new HttpRequest();
r6.setMethod('POST');
r6.setEndpoint(baseUrl + '/sign/api/v2/documents');
r6.setHeader('Authorization', 'Bearer ' + apiKey);
r6.setHeader('Content-Type', 'application/json');
r6.setTimeout(15000);
r6.setBody('{"filename":"contract.pdf","base64Content":"' + pdfBase64 + '"}');
HttpResponse res6 = h.send(r6);
System.debug('POST docs JSON → ' + res6.getStatusCode() + ': ' + res6.getBody().left(300));

// ── GET /sign/api/v2/documents (just to see if endpoint exists at all) ────────
System.debug('=== GET /sign/api/v2/documents ===');
HttpRequest r7 = new HttpRequest();
r7.setMethod('GET');
r7.setEndpoint(baseUrl + '/sign/api/v2/documents');
r7.setHeader('Authorization', 'Bearer ' + apiKey);
r7.setTimeout(10000);
HttpResponse res7 = h.send(r7);
System.debug('GET docs → ' + res7.getStatusCode() + ': ' + res7.getBody().left(300));
