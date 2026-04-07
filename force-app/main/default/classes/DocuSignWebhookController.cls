/**
 * DocuSignWebhookController
 * ─────────────────────────────────────────────────────────────────────────────
 * Called by DocuSign Connect when an envelope is completed.
 * On completion:
 *   1. Sets Quote → Signed, Opportunity → Closed Won
 *   2. Creates a Salesforce Contract record
 *   3. Downloads signed PDF from DocuSign and attaches to Contract
 *   4. Links attachment to Account (visible in Experience Cloud)
 *   5. Sends invoice email to customer + notification to owner
 *
 * Endpoint: POST /services/apexrest/docusign/webhook
 * ─────────────────────────────────────────────────────────────────────────────
 */
@RestResource(urlMapping='/docusign/webhook')
global class DocuSignWebhookController {
  @HttpPost
  global static void handleCallback() {
    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;

    try {
      String body = req.requestBody != null ? req.requestBody.toString() : '';
      System.debug('[DocuSignWebhook] Received: ' + body.left(500));

      if (String.isBlank(body)) {
        res.statusCode = 400;
        res.responseBody = Blob.valueOf('{"error":"empty body"}');
        return;
      }

      Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(
        body
      );

      String envelopeId = null;
      String status = null;
      String eventType = (String) payload.get('event');
      Map<String, Object> data = (Map<String, Object>) payload.get('data');
      if (data != null) {
        envelopeId = (String) data.get('envelopeId');
        Map<String, Object> summary = (Map<String, Object>) data.get(
          'envelopeSummary'
        );
        if (summary != null)
          status = (String) summary.get('status');
      }
      if (String.isBlank(envelopeId))
        envelopeId = (String) payload.get('envelopeId');
      if (String.isBlank(status) && String.isNotBlank(eventType))
        status = eventType.replace('envelope-', '');

      System.debug(
        '[DocuSignWebhook] envelopeId=' + envelopeId + ' status=' + status
      );

      if (String.isBlank(envelopeId)) {
        res.statusCode = 400;
        res.responseBody = Blob.valueOf('{"error":"missing envelopeId"}');
        return;
      }

      if ('completed'.equalsIgnoreCase(status)) {
        finalizeByEnvelopeId(envelopeId);
      }

      res.statusCode = 200;
      res.responseBody = Blob.valueOf('{"ok":true}');
    } catch (Exception ex) {
      System.debug(
        '[DocuSignWebhook] Error: ' +
          ex.getMessage() +
          '\n' +
          ex.getStackTraceString()
      );
      res.statusCode = 500;
      res.responseBody = Blob.valueOf(
        '{"error":"' + ex.getMessage().replace('"', '\\"') + '"}'
      );
    }
  }

  // ── Step 1: DML-only finalization (no callouts here) ─────────────────────────
  private static void finalizeByEnvelopeId(String envelopeId) {
    List<TALEXO_Quote__c> quotes = [
      SELECT
        Id,
        Name,
        Status__c,
        GrandTotal__c,
        PaymentTerms__c,
        BulkDiscount__c,
        ExpirationDate__c,
        Description__c,
        Opportunity__c,
        Opportunity__r.AccountId,
        Opportunity__r.Account.Name,
        Opportunity__r.OwnerId,
        Opportunity__r.Owner.Email
      FROM TALEXO_Quote__c
      WHERE DvelopEnvelopeId__c = :envelopeId
      LIMIT 1
    ];

    if (quotes.isEmpty()) {
      System.debug('[DocuSignWebhook] No quote for envelopeId=' + envelopeId);
      return;
    }

    TALEXO_Quote__c q = quotes[0];
    if (q.Status__c == 'Signed') {
      System.debug('[DocuSignWebhook] Already Signed — skipping.');
      return;
    }

    // ── Update quote + opportunity ─────────────────────────────────────────────
    update new TALEXO_Quote__c(
      Id = q.Id,
      Status__c = 'Signed',
      NegotiationStatus__c = 'Final'
    );
    update new Opportunity(Id = q.Opportunity__c, StageName = 'Closed Won');

    // ── Create Contract record ─────────────────────────────────────────────────
    Contract c = new Contract(
      AccountId = q.Opportunity__r.AccountId,
      Status = 'Draft',
      StartDate = Date.today(),
      ContractTerm = 12,
      Description = 'Contrat B2B Nexus — ' +
        q.Name +
        '\n' +
        'Montant : ' +
        (q.GrandTotal__c != null
          ? String.valueOf(q.GrandTotal__c.setScale(2))
          : '0') +
        ' EUR\n' +
        'Conditions paiement : ' +
        (String.isNotBlank(q.PaymentTerms__c) ? q.PaymentTerms__c : 'Net 30'),
      OwnerId = q.Opportunity__r.OwnerId
    );
    insert c;

    // Activate contract
    update new Contract(Id = c.Id, Status = 'Activated');

    String contractRef = 'CTR-' + String.valueOf(c.Id).right(6).toUpperCase();
    String signedAt = DateTime.now().format('dd/MM/yyyy HH:mm') + ' UTC';

    System.debug(
      '[DocuSignWebhook] Contract created: ' + c.Id + ' | ' + contractRef
    );

    // ── Step 2: Download signed PDF + send emails (requires callout → @future) ──
    postSignAsync(
      q.Id,
      c.Id,
      q.Opportunity__r.AccountId,
      envelopeId,
      contractRef,
      signedAt,
      q.Opportunity__r.Owner.Email,
      q.Opportunity__r.Account.Name,
      q.Name
    );
  }

  // ── Step 2: Download signed PDF from DocuSign + attach + send emails ──────────
  @future(callout=true)
  private static void postSignAsync(
    Id quoteId,
    Id contractId,
    Id accountId,
    String envelopeId,
    String contractRef,
    String signedAt,
    String ownerEmail,
    String accountName,
    String quoteName
  ) {
    try {
      // ── Get DocuSign access token ──────────────────────────────────────────
      String token = getDocuSignToken();
      if (String.isBlank(token)) {
        System.debug(
          '[DocuSignWebhook] Could not get DocuSign token — skipping PDF attach'
        );
      } else {
        // ── Download signed PDF ──────────────────────────────────────────────
        DocuSignConfig_mdt__mdt cfg = [
          SELECT Account_Id__c, Base_Uri__c
          FROM DocuSignConfig_mdt__mdt
          WHERE DeveloperName = 'Default'
          LIMIT 1
        ];
        HttpRequest dlReq = new HttpRequest();
        dlReq.setMethod('GET');
        dlReq.setEndpoint(
          cfg.Base_Uri__c +
            '/restapi/v2.1/accounts/' +
            cfg.Account_Id__c +
            '/envelopes/' +
            envelopeId +
            '/documents/combined'
        );
        dlReq.setHeader('Authorization', 'Bearer ' + token);
        dlReq.setTimeout(30000);
        HttpResponse dlRes = new Http().send(dlReq);
        System.debug(
          '[DocuSignWebhook] PDF download → ' + dlRes.getStatusCode()
        );

        if (dlRes.getStatusCode() == 200) {
          Blob pdfBlob = dlRes.getBodyAsBlob();
          String filename =
            quoteName.replaceAll('[^A-Za-z0-9_-]', '_') + '_Contrat_Signe.pdf';

          // ── Save as ContentVersion ────────────────────────────────────────
          ContentVersion cv = new ContentVersion(
            Title = filename,
            PathOnClient = filename,
            VersionData = pdfBlob,
            IsMajorVersion = true
          );
          insert cv;
          cv = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id];

          // ── Link to Contract ──────────────────────────────────────────────
          insert new ContentDocumentLink(
            ContentDocumentId = cv.ContentDocumentId,
            LinkedEntityId = contractId,
            ShareType = 'V',
            Visibility = 'AllUsers'
          );

          // ── Link to Account (visible in Experience Cloud) ─────────────────
          insert new ContentDocumentLink(
            ContentDocumentId = cv.ContentDocumentId,
            LinkedEntityId = accountId,
            ShareType = 'V',
            Visibility = 'AllUsers'
          );

          System.debug(
            '[DocuSignWebhook] Signed PDF attached to Contract + Account.'
          );
        }
      }
    } catch (Exception ex) {
      System.debug('[DocuSignWebhook] PDF attach error: ' + ex.getMessage());
    }

    // ── Send emails regardless of PDF success ────────────────────────────────
    List<User> custUsers = [
      SELECT Email, FirstName, LastName
      FROM User
      WHERE
        AccountId = :accountId
        AND IsActive = TRUE
        AND UserType IN (
          'PowerCustomerSuccess',
          'CspLitePortal',
          'PowerPartner'
        )
      LIMIT 1
    ];

    List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

    if (!custUsers.isEmpty()) {
      emails.add(
        buildInvoiceEmail(
          custUsers[0].Email,
          custUsers[0].FirstName + ' ' + custUsers[0].LastName,
          contractRef,
          signedAt,
          quoteId
        )
      );
    }

    if (String.isNotBlank(ownerEmail)) {
      Messaging.SingleEmailMessage notif = new Messaging.SingleEmailMessage();
      notif.setToAddresses(new List<String>{ ownerEmail });
      notif.setSubject('[Nexus] Contrat signé — ' + accountName);
      notif.setSenderDisplayName('Nexus CRM');
      notif.setHtmlBody(
        '<p>Le contrat <strong>' +
          quoteName +
          '</strong> a été signé via DocuSign.</p>' +
          '<p>Référence : <strong>' +
          contractRef +
          '</strong> | Signé le : ' +
          signedAt +
          '</p>' +
          '<p>L\'opportunité est <strong>Closed Won</strong>. Le contrat est activé dans Salesforce.</p>' +
          '<p>— Nexus CRM</p>'
      );
      emails.add(notif);
    }

    if (!emails.isEmpty())
      Messaging.sendEmail(emails);
  }

  // ── DocuSign JWT token helper ─────────────────────────────────────────────────
  private static String getDocuSignToken() {
    try {
      DocuSignConfig_mdt__mdt cfg = [
        SELECT Integration_Key__c, User_Id__c, Private_Key__c
        FROM DocuSignConfig_mdt__mdt
        WHERE DeveloperName = 'Default'
        LIMIT 1
      ];

      String header = base64Url(Blob.valueOf('{"alg":"RS256","typ":"JWT"}'));
      Long iat = DateTime.now().getTime() / 1000;
      String claims = base64Url(
        Blob.valueOf(
          '{"iss":"' +
            cfg.Integration_Key__c +
            '",' +
            '"sub":"' +
            cfg.User_Id__c +
            '",' +
            '"aud":"account-d.docusign.com",' +
            '"iat":' +
            iat +
            ',"exp":' +
            (iat + 3600) +
            ',' +
            '"scope":"signature impersonation"}'
        )
      );
      String input = header + '.' + claims;
      Blob pk = pkBlob(cfg.Private_Key__c);
      String jwt =
        input +
        '.' +
        base64Url(Crypto.sign('RSA-SHA256', Blob.valueOf(input), pk));

      HttpRequest r = new HttpRequest();
      r.setMethod('POST');
      r.setEndpoint('https://account-d.docusign.com/oauth/token');
      r.setHeader('Content-Type', 'application/x-www-form-urlencoded');
      r.setTimeout(20000);
      r.setBody(
        'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' +
        jwt
      );
      HttpResponse res = new Http().send(r);
      if (res.getStatusCode() != 200)
        return null;
      return (String) ((Map<String, Object>) JSON.deserializeUntyped(
          res.getBody()
        ))
        .get('access_token');
    } catch (Exception ex) {
      System.debug('[DocuSignWebhook] Token error: ' + ex.getMessage());
      return null;
    }
  }

  private static String base64Url(Blob b) {
    return EncodingUtil.base64Encode(b)
      .replace('+', '-')
      .replace('/', '_')
      .replace('=', '');
  }

  private static Blob pkBlob(String pem) {
    return EncodingUtil.base64Decode(
      pem.replace('-----BEGIN RSA PRIVATE KEY-----', '')
        .replace('-----END RSA PRIVATE KEY-----', '')
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replaceAll('\\s+', '')
    );
  }

  // ── Invoice email ─────────────────────────────────────────────────────────────
  private static Messaging.SingleEmailMessage buildInvoiceEmail(
    String toEmail,
    String toName,
    String contractRef,
    String signedAt,
    Id quoteId
  ) {
    TALEXO_Quote__c q = [
      SELECT
        Name,
        GrandTotal__c,
        PaymentTerms__c,
        BulkDiscount__c,
        (
          SELECT ProductName__c, Quantity__c, UnitPrice__c, NetTotal__c
          FROM NexusQuoteLineItems__r
        )
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];

    String rows = '';
    if (q.NexusQuoteLineItems__r != null) {
      for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
        rows +=
          '<tr style="border-bottom:1px solid #eee;">' +
          '<td style="padding:6px 8px;">' +
          li.ProductName__c +
          '</td>' +
          '<td style="padding:6px 8px;text-align:center;">' +
          (li.Quantity__c != null ? li.Quantity__c.intValue() : 0) +
          '</td>' +
          '<td style="padding:6px 8px;text-align:right;">' +
          (li.UnitPrice__c != null ? li.UnitPrice__c.setScale(2) : 0) +
          ' €</td>' +
          '<td style="padding:6px 8px;text-align:right;">' +
          (li.NetTotal__c != null ? li.NetTotal__c.setScale(2) : 0) +
          ' €</td>' +
          '</tr>';
      }
    }

    String total = q.GrandTotal__c != null
      ? q.GrandTotal__c.setScale(2) + ' €'
      : '0 €';
    String discount = q.BulkDiscount__c != null
      ? q.BulkDiscount__c.setScale(0) + '%'
      : '0%';
    String terms = String.isNotBlank(q.PaymentTerms__c)
      ? q.PaymentTerms__c
      : 'Net 30';

    Messaging.SingleEmailMessage m = new Messaging.SingleEmailMessage();
    m.setToAddresses(new List<String>{ toEmail });
    m.setSubject('[Nexus] Contrat signé — Facture ' + contractRef);
    m.setSenderDisplayName('Nexus B2B Platform');
    m.setHtmlBody(
      '<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">' +
        '<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">' +
        '<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px;text-align:center;">' +
        '<h1 style="color:#fff;margin:0;">NEXUS</h1>' +
        '<p style="color:#a0aec0;margin:8px 0 0;">Contrat B2B — Signé électroniquement via DocuSign</p></div>' +
        '<div style="padding:32px;">' +
        '<p>Bonjour <strong>' +
        toName +
        '</strong>,</p>' +
        '<p>Votre contrat a été signé par les deux parties. Le PDF signé est disponible dans votre espace client.</p>' +
        '<div style="background:#f7fafc;border-radius:8px;padding:16px;margin:20px 0;">' +
        '<p><strong>Réf. contrat :</strong> ' +
        contractRef +
        '</p>' +
        '<p><strong>Devis :</strong> ' +
        q.Name +
        '</p>' +
        '<p><strong>Signé le :</strong> ' +
        signedAt +
        '</p></div>' +
        '<table style="width:100%;border-collapse:collapse;margin:12px 0;">' +
        '<thead><tr style="background:#1a1a2e;color:#fff;">' +
        '<th style="padding:8px;text-align:left;">Produit</th>' +
        '<th style="padding:8px;text-align:center;">Qté</th>' +
        '<th style="padding:8px;text-align:right;">Prix unit.</th>' +
        '<th style="padding:8px;text-align:right;">Total</th></tr></thead>' +
        '<tbody>' +
        rows +
        '</tbody></table>' +
        '<div style="background:#edf2f7;border-radius:8px;padding:16px;margin:16px 0;">' +
        '<p><strong>Remise :</strong> ' +
        discount +
        '</p>' +
        '<p style="font-size:18px;"><strong>Total TTC : ' +
        total +
        '</strong></p>' +
        '<p><strong>Paiement :</strong> ' +
        terms +
        '</p></div>' +
        '<p style="color:#718096;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px;">' +
        'Signature électronique via DocuSign.</p>' +
        '</div></div></body>'
    );
    return m;
  }
}
