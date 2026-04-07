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
String pdfBase64 = EncodingUtil.base64Encode(Blob.valueOf(pdfStr));

// Try eIDAS signature levels + other known d.velop levels
List<String> levels = new List<String>{ 'SES','AES','QES','ses','aes','qes','BASIC','electronic','low','0','1','2' };
for (String lvl : levels) {
    Map<String,Object> body = new Map<String,Object>{
        'name' => 'TEST',
        'documentFilenames' => new List<String>{ 'contract.pdf' },
        'documentFiles' => new List<String>{ pdfBase64 },
        'signerEmails' => new List<String>{ 'arbiahamdana296@gmail.com' },
        'integrityLevel' => lvl
    };
    HttpRequest r = new HttpRequest();
    r.setMethod('POST');
    r.setEndpoint(baseUrl + '/sign/api/private/process-studio-actions/send-envelope');
    r.setHeader('Authorization', 'Bearer ' + apiKey);
    r.setHeader('Content-Type', 'application/json');
    r.setTimeout(10000);
    r.setBody(JSON.serialize(body));
    HttpResponse res = h.send(r);
    Integer code = res.getStatusCode();
    String body2 = res.getBody();
    System.debug(lvl + ' → ' + code + ': ' + body2.left(200));
    if (code == 200 || code == 201 || code == 202) {
        System.debug('*** SUCCESS with integrityLevel=' + lvl + ' ***');
    }
}
