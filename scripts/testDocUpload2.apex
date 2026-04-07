// testDocUpload2.apex
// Tests:
//   A) send-envelope with NO integrityLevel (omit field entirely)
//   B) send-envelope with integrityLevel = null / empty
//   C) v2 PUT /envelopes/{id}/documents/{uuid} direct attach
//   D) v2 POST /envelopes/{id}/documents with base64 body

String baseUrl = 'https://talan.d-velop.cloud';
String apiKey = [SELECT ApiKey__c FROM DvelopConfig__mdt WHERE DeveloperName = 'Default' LIMIT 1].ApiKey__c;
Http h = new Http();

// Minimal valid PDF (base64)
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

// ── TEST A: send-envelope WITHOUT integrityLevel ─────────────────────────────
System.debug('=== TEST A: send-envelope, no integrityLevel ===');
Map<String,Object> bodyA = new Map<String,Object>{
    'name' => 'TEST-A',
    'documentFilenames' => new List<String>{ 'contract.pdf' },
    'documentFiles' => new List<String>{ pdfBase64 },
    'signerEmails' => new List<String>{ 'arbiahamdana296@gmail.com' }
};
HttpRequest rA = new HttpRequest();
rA.setMethod('POST');
rA.setEndpoint(baseUrl + '/sign/api/private/process-studio-actions/send-envelope');
rA.setHeader('Authorization', 'Bearer ' + apiKey);
rA.setHeader('Content-Type', 'application/json');
rA.setTimeout(15000);
rA.setBody(JSON.serialize(bodyA));
HttpResponse resA = h.send(rA);
System.debug('A → ' + resA.getStatusCode() + ': ' + resA.getBody().left(300));

// ── TEST B: send-envelope with integrityLevel = '' (empty) ───────────────────
System.debug('=== TEST B: send-envelope, integrityLevel empty string ===');
Map<String,Object> bodyB = new Map<String,Object>{
    'name' => 'TEST-B',
    'documentFilenames' => new List<String>{ 'contract.pdf' },
    'documentFiles' => new List<String>{ pdfBase64 },
    'signerEmails' => new List<String>{ 'arbiahamdana296@gmail.com' },
    'integrityLevel' => ''
};
HttpRequest rB = new HttpRequest();
rB.setMethod('POST');
rB.setEndpoint(baseUrl + '/sign/api/private/process-studio-actions/send-envelope');
rB.setHeader('Authorization', 'Bearer ' + apiKey);
rB.setHeader('Content-Type', 'application/json');
rB.setTimeout(15000);
rB.setBody(JSON.serialize(bodyB));
HttpResponse resB = h.send(rB);
System.debug('B → ' + resB.getStatusCode() + ': ' + resB.getBody().left(300));

// ── TEST C: v2 create envelope, then PUT binary doc to envelope doc slot ──────
System.debug('=== TEST C: v2 create envelope + PUT /envelopes/{id}/documents/{uuid} ===');
HttpRequest rC1 = new HttpRequest();
rC1.setMethod('POST');
rC1.setEndpoint(baseUrl + '/sign/api/v2/envelopes');
rC1.setHeader('Authorization', 'Bearer ' + apiKey);
rC1.setHeader('Content-Type', 'application/json');
rC1.setTimeout(15000);
rC1.setBody('{"name":"TEST-C","signingOrder":false}');
HttpResponse resC1 = h.send(rC1);
System.debug('C1 create envelope → ' + resC1.getStatusCode() + ': ' + resC1.getBody().left(200));

if (resC1.getStatusCode() >= 200 && resC1.getStatusCode() < 300) {
    Map<String,Object> envC = (Map<String,Object>) JSON.deserializeUntyped(resC1.getBody());
    String envId = (String) envC.get('id');
    // Try PUT /envelopes/{id}/documents/{uuid} with raw bytes
    String docUuid = EncodingUtil.convertToHex(Crypto.generateAesKey(128)).substring(0,32);
    String formattedUuid = docUuid.substring(0,8)+'-'+docUuid.substring(8,12)+'-'+docUuid.substring(12,16)+'-'+docUuid.substring(16,20)+'-'+docUuid.substring(20);
    HttpRequest rC2 = new HttpRequest();
    rC2.setMethod('PUT');
    rC2.setEndpoint(baseUrl + '/sign/api/v2/envelopes/' + envId + '/documents/' + formattedUuid);
    rC2.setHeader('Authorization', 'Bearer ' + apiKey);
    rC2.setHeader('Content-Type', 'application/octet-stream');
    rC2.setHeader('Content-Disposition', 'attachment; filename="contract.pdf"');
    rC2.setTimeout(15000);
    rC2.setBodyAsBlob(pdfBlob);
    HttpResponse resC2 = h.send(rC2);
    System.debug('C2 PUT doc to envelope → ' + resC2.getStatusCode() + ': ' + resC2.getBody().left(300));

    // Cleanup: no need to start envelope for this test
}

// ── TEST D: v2 POST /envelopes/{id}/documents with {filename, base64Content} ─
System.debug('=== TEST D: v2 create envelope + POST /envelopes/{id}/documents (base64 body) ===');
HttpRequest rD1 = new HttpRequest();
rD1.setMethod('POST');
rD1.setEndpoint(baseUrl + '/sign/api/v2/envelopes');
rD1.setHeader('Authorization', 'Bearer ' + apiKey);
rD1.setHeader('Content-Type', 'application/json');
rD1.setTimeout(15000);
rD1.setBody('{"name":"TEST-D","signingOrder":false}');
HttpResponse resD1 = h.send(rD1);
System.debug('D1 create envelope → ' + resD1.getStatusCode() + ': ' + resD1.getBody().left(200));

if (resD1.getStatusCode() >= 200 && resD1.getStatusCode() < 300) {
    Map<String,Object> envD = (Map<String,Object>) JSON.deserializeUntyped(resD1.getBody());
    String envId = (String) envD.get('id');
    // POST with JSON body containing base64 content
    Map<String,Object> docBody = new Map<String,Object>{
        'filename' => 'contract.pdf',
        'base64Content' => pdfBase64
    };
    HttpRequest rD2 = new HttpRequest();
    rD2.setMethod('POST');
    rD2.setEndpoint(baseUrl + '/sign/api/v2/envelopes/' + envId + '/documents');
    rD2.setHeader('Authorization', 'Bearer ' + apiKey);
    rD2.setHeader('Content-Type', 'application/json');
    rD2.setTimeout(15000);
    rD2.setBody(JSON.serialize(docBody));
    HttpResponse resD2 = h.send(rD2);
    System.debug('D2 POST doc (base64 body) → ' + resD2.getStatusCode() + ': ' + resD2.getBody().left(300));
}
