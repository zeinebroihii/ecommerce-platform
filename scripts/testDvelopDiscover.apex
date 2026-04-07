// testDvelopDiscover.apex
// Probes d.velop tenant to discover available endpoints and config

String baseUrl = 'https://talan.d-velop.cloud';
String apiKey = [SELECT ApiKey__c FROM DvelopConfig__mdt WHERE DeveloperName = 'Default' LIMIT 1].ApiKey__c;
Http h = new Http();

// ── 1. Tenant info / sign config ─────────────────────────────────────────────
List<String> probeUrls = new List<String>{
    baseUrl + '/sign/api/v2/tenant',
    baseUrl + '/sign/api/v2/config',
    baseUrl + '/sign/api/v2/settings',
    baseUrl + '/sign/api/v2/integrity-levels',
    baseUrl + '/sign/api/v2/tsps',
    baseUrl + '/sign/api/private/process-studio-actions',
    baseUrl + '/sign/api/v1/envelope-templates'
};

for (String url : probeUrls) {
    HttpRequest r = new HttpRequest();
    r.setMethod('GET');
    r.setEndpoint(url);
    r.setHeader('Authorization', 'Bearer ' + apiKey);
    r.setHeader('Accept', 'application/json');
    r.setTimeout(10000);
    HttpResponse res = h.send(r);
    System.debug('GET ' + url.replace(baseUrl,'') + ' → ' + res.getStatusCode() + ': ' + res.getBody().left(250));
}

// ── 2. Check what process-studio-actions are available ───────────────────────
HttpRequest r2 = new HttpRequest();
r2.setMethod('GET');
r2.setEndpoint(baseUrl + '/sign/api/private/process-studio-actions/send-envelope');
r2.setHeader('Authorization', 'Bearer ' + apiKey);
r2.setHeader('Accept', 'application/json');
r2.setTimeout(10000);
HttpResponse res2 = h.send(r2);
System.debug('GET send-envelope action → ' + res2.getStatusCode() + ': ' + res2.getBody().left(250));
