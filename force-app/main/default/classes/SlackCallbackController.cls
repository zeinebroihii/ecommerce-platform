@RestResource(urlMapping='/nexus/slack/callback')
global without sharing class SlackCallbackController {

  @HttpPost
  global static void handleCallback() {
    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;
    res.statusCode = 200; // Always 200 — Slack retries on anything else

    try {
      String rawBody = req.requestBody != null ? req.requestBody.toString() : '';
      System.debug(LoggingLevel.INFO, 'SlackCallback rawBody: ' + rawBody);

      // Resolve payload — Slack sends application/x-www-form-urlencoded: payload=<json>
      String payloadJson;
      if (String.isNotBlank(rawBody) && rawBody.startsWith('payload=')) {
        payloadJson = EncodingUtil.urlDecode(rawBody.substringAfter('payload='), 'UTF-8');
      } else if (req.params != null && req.params.containsKey('payload')) {
        payloadJson = req.params.get('payload');
      } else {
        payloadJson = rawBody;
      }

      if (String.isBlank(payloadJson)) {
        System.debug(LoggingLevel.WARN, 'SlackCallback: empty payload');
        return;
      }

      System.debug(LoggingLevel.INFO, 'SlackCallback payloadJson: ' + payloadJson.left(500));

      Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(payloadJson);
      String responseUrl = (String) payload.get('response_url');

      List<Object> actions = (List<Object>) payload.get('actions');
      if (actions == null || actions.isEmpty()) return;

      Map<String, Object> action = (Map<String, Object>) actions[0];
      String actionId = (String) action.get('action_id');
      String quoteId  = (String) action.get('value');

      System.debug(LoggingLevel.INFO, 'SlackCallback actionId=' + actionId + ' quoteId=' + quoteId);

      if (String.isBlank(quoteId)) return;

      if (actionId == 'approve_recommended') {
        // Callout FIRST (before DML) — update the Slack message immediately
        if (String.isNotBlank(responseUrl)) {
          postToSlack(responseUrl,
            ':white_check_mark: *Approved.* Applying recommended terms — customer will be notified shortly.',
            true
          );
        }
        // DML after callout
        applyRecommendedCombo(quoteId);

      } else if (actionId == 'customize_terms') {
        // This button now has a url= so Slack handles it directly — no callback needed
        // But if it does fire, just acknowledge
        if (String.isNotBlank(responseUrl)) {
          postToSlack(responseUrl, ':pencil: Opening Quote Builder...', false);
        }
      }

    } catch (Exception ex) {
      System.debug(LoggingLevel.ERROR,
        'SlackCallbackController error: ' + ex.getMessage() + '\n' + ex.getStackTraceString());
    }
  }

  // ── Apply the AI-recommended combo (B preferred, fallback A) ─────────────

  private static void applyRecommendedCombo(String quoteId) {
    List<TALEXO_Quote__c> quotes = [
      SELECT Id, EscalationComboA__c, EscalationComboB__c
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];
    if (quotes.isEmpty()) {
      System.debug(LoggingLevel.WARN, 'SlackCallback: quote not found: ' + quoteId);
      return;
    }

    TALEXO_Quote__c q = quotes[0];
    String comboStr = String.isNotBlank(q.EscalationComboB__c)
      ? q.EscalationComboB__c
      : q.EscalationComboA__c;

    System.debug(LoggingLevel.INFO, 'SlackCallback comboStr: ' + comboStr);

    if (String.isBlank(comboStr)) {
      System.debug(LoggingLevel.WARN, 'SlackCallback: no combo data on quote');
      return;
    }

    Map<String, Object> parsed = parseComboString(comboStr);
    System.debug(LoggingLevel.INFO, 'SlackCallback parsed: ' + parsed);

    if (!parsed.containsKey('price')) {
      System.debug(LoggingLevel.WARN, 'SlackCallback: could not parse price from: ' + comboStr);
      return;
    }

    Decimal price    = (Decimal)  parsed.get('price');
    String  terms    = (String)   parsed.get('terms');
    Integer validity = (Integer)  parsed.get('validity');

    NexusQuoteController.applyNegotiatedTermsCore(
      (Id) quoteId,
      price,
      terms    != null ? terms    : 'Net 30',
      validity != null ? validity : 30,
      'Approved by sales team via Slack.'
    );
  }

  // ── Parse "Combo B: 65386.44 € (7.0% discount) | Net 30 | Validity: 30 days" ──

  private static Map<String, Object> parseComboString(String comboStr) {
    Map<String, Object> result = new Map<String, Object>();
    if (String.isBlank(comboStr)) return result;

    Pattern priceP = Pattern.compile('([\\d]+[\\.,]?[\\d]*)\\s*€');
    Matcher pm = priceP.matcher(comboStr);
    if (pm.find()) {
      String raw = pm.group(1).replace(',', '.');
      result.put('price', Decimal.valueOf(raw));
    }

    Pattern termsP = Pattern.compile('Net\\s+(\\d+)');
    Matcher tm = termsP.matcher(comboStr);
    if (tm.find()) result.put('terms', 'Net ' + tm.group(1));

    Pattern validP = Pattern.compile('Validity:\\s*(\\d+)\\s*days');
    Matcher vm = validP.matcher(comboStr);
    if (vm.find()) result.put('validity', Integer.valueOf(vm.group(1)));

    return result;
  }

  // ── HTTP: update Slack message via response_url ───────────────────────────

  private static void postToSlack(String url, String text, Boolean replaceOriginal) {
    HttpRequest req = new HttpRequest();
    req.setEndpoint(url);
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/json');
    req.setBody(JSON.serialize(new Map<String, Object>{
      'text'             => text,
      'replace_original' => replaceOriginal
    }));
    req.setTimeout(5000);
    try {
      HttpResponse r = new Http().send(req);
      System.debug(LoggingLevel.INFO, 'SlackCallback postToSlack response: ' + r.getStatusCode() + ' ' + r.getBody());
    } catch (Exception ex) {
      System.debug(LoggingLevel.WARN, 'SlackCallbackController.postToSlack failed: ' + ex.getMessage());
    }
  }
}
