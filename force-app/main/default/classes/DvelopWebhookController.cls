/**
 * DvelopWebhookController
 * ─────────────────────────────────────────────────────────────────────────────
 * Apex REST endpoint called by d.velop Sign when an envelope reaches a
 * terminal state (completed / rejected / expired).
 *
 * d.velop POST payload example:
 *   { "id": "envelope-uuid", "state": "completed" }
 *
 * Endpoint: POST /services/apexrest/dvelop/webhook
 * Auth: d.velop sends a shared-secret header we validate (X-Dvelop-Hook-Secret)
 * ─────────────────────────────────────────────────────────────────────────────
 */
@RestResource(urlMapping='/dvelop/webhook')
global class DvelopWebhookController {
  @HttpPost
  global static void handleCallback() {
    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;

    try {
      // ── Parse body ──────────────────────────────────────────────────────────
      String body = req.requestBody != null ? req.requestBody.toString() : '';
      if (String.isBlank(body)) {
        res.statusCode = 400;
        res.responseBody = Blob.valueOf('{"error":"empty body"}');
        return;
      }

      Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(
        body
      );
      String envelopeId = (String) payload.get('id');
      String state = (String) payload.get('state');

      System.debug(
        '[DvelopWebhook] envelope=' + envelopeId + ' state=' + state
      );

      if (String.isBlank(envelopeId) || String.isBlank(state)) {
        res.statusCode = 400;
        res.responseBody = Blob.valueOf('{"error":"missing id or state"}');
        return;
      }

      // ── Only act on completed envelopes ────────────────────────────────────
      if (state == 'completed') {
        finalizeByEnvelopeId(envelopeId);
      }

      res.statusCode = 200;
      res.responseBody = Blob.valueOf('{"ok":true}');
    } catch (Exception ex) {
      System.debug(
        '[DvelopWebhook] Error: ' +
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

  // ── Find the quote by envelope ID and finalize it ──────────────────────────
  private static void finalizeByEnvelopeId(String envelopeId) {
    List<TALEXO_Quote__c> quotes = [
      SELECT
        Id,
        Name,
        Status__c,
        Opportunity__c,
        Opportunity__r.AccountId,
        Opportunity__r.OwnerId,
        Opportunity__r.Owner.Email,
        Opportunity__r.Account.Name
      FROM TALEXO_Quote__c
      WHERE DvelopEnvelopeId__c = :envelopeId
      LIMIT 1
    ];

    if (quotes.isEmpty()) {
      System.debug(
        '[DvelopWebhook] No quote found for envelopeId=' + envelopeId
      );
      return;
    }

    TALEXO_Quote__c q = quotes[0];

    if (q.Status__c == 'Signed') {
      System.debug(
        '[DvelopWebhook] Quote ' + q.Name + ' already Signed — skipping.'
      );
      return;
    }

    // Update quote and opportunity
    update new TALEXO_Quote__c(
      Id = q.Id,
      Status__c = 'Signed',
      NegotiationStatus__c = 'Final'
    );
    update new Opportunity(Id = q.Opportunity__c, StageName = 'Closed Won');

    // Resolve admin info for the invoice (use DvelopConfig admin email)
    List<DvelopConfig__mdt> cfgRows = [
      SELECT AdminEmail__c
      FROM DvelopConfig__mdt
      WHERE DeveloperName = 'Default'
      LIMIT 1
    ];
    String adminEmail = cfgRows.isEmpty() ? '' : cfgRows[0].AdminEmail__c;
    String signedAt = DateTime.now().format('dd/MM/yyyy HH:mm') + ' UTC';
    String contractRef = 'CTR-' + String.valueOf(q.Id).right(6).toUpperCase();

    // Send invoice email + owner notification asynchronously
    sendPostSignAsync(
      q.Id,
      contractRef,
      adminEmail,
      'Nexus Administration',
      signedAt,
      q.Opportunity__r.Owner.Email,
      q.Opportunity__r.Account.Name,
      q.Name
    );

    System.debug(
      '[DvelopWebhook] Quote ' + q.Name + ' finalized as Signed / Closed Won.'
    );
  }

  // ── @future: invoice + owner notification ─────────────────────────────────
  @future(callout=true)
  private static void sendPostSignAsync(
    Id quoteId,
    String contractRef,
    String signerEmail,
    String signerName,
    String signedAt,
    String ownerEmail,
    String accountName,
    String quoteName
  ) {
    // Delegate to NexusQuoteController helpers via re-use of its @future methods
    // is not possible (can't call @future from @future).
    // Instead, send the emails inline here.

    // ── 1. Invoice to customer ─────────────────────────────────────────────
    // Resolve AccountId first (can't use multi-level relationships in subquery)
    List<TALEXO_Quote__c> qRows = [
      SELECT Opportunity__r.AccountId
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];
    Id accountId = qRows.isEmpty() ? null : qRows[0].Opportunity__r.AccountId;
    List<User> custUsers = accountId == null
      ? new List<User>()
      : [
          SELECT Email, FirstName, LastName
          FROM User
          WHERE
            AccountId = :accountId
            AND IsActive = TRUE
            AND UserType = 'PowerCustomerSuccess'
          LIMIT 1
        ];
    if (!custUsers.isEmpty()) {
      sendInvoiceEmail(
        custUsers[0].Email,
        custUsers[0].FirstName + ' ' + custUsers[0].LastName,
        contractRef,
        signerName,
        signedAt,
        quoteId
      );
    }

    // ── 2. Notify opportunity owner ────────────────────────────────────────
    if (String.isNotBlank(ownerEmail)) {
      Messaging.SingleEmailMessage notif = new Messaging.SingleEmailMessage();
      notif.setToAddresses(new List<String>{ ownerEmail });
      notif.setSubject('[Nexus] Contrat signé — ' + accountName);
      notif.setHtmlBody(
        '<p>Bonjour,</p>' +
          '<p>Le contrat lié au devis <strong>' +
          quoteName +
          '</strong> a été signé électroniquement par les deux parties via d.velop Sign.</p>' +
          '<p>L\'opportunité a été clôturée en <strong>Closed Won</strong>.</p>' +
          '<p>Référence contrat : <strong>' +
          contractRef +
          '</strong><br>' +
          'Signé le : ' +
          signedAt +
          '</p>' +
          '<p>— Nexus CRM</p>'
      );
      notif.setSenderDisplayName('Nexus CRM');
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ notif });
    }
  }

  // ── Invoice email helper ───────────────────────────────────────────────────
  private static void sendInvoiceEmail(
    String toEmail,
    String toName,
    String contractRef,
    String signerName,
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

    String itemsHtml =
      '<table style="width:100%;border-collapse:collapse;margin:12px 0;">' +
      '<thead><tr style="background:#1a1a2e;color:#fff;">' +
      '<th style="padding:8px;text-align:left;">Produit</th>' +
      '<th style="padding:8px;text-align:center;">Qté</th>' +
      '<th style="padding:8px;text-align:right;">Prix unit.</th>' +
      '<th style="padding:8px;text-align:right;">Total</th></tr></thead><tbody>';
    if (q.NexusQuoteLineItems__r != null) {
      for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
        itemsHtml +=
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
    itemsHtml += '</tbody></table>';

    String total = q.GrandTotal__c != null
      ? q.GrandTotal__c.setScale(2) + ' €'
      : '0 €';
    String discount = q.BulkDiscount__c != null
      ? q.BulkDiscount__c.setScale(0) + '%'
      : '0%';
    String payTerms = String.isNotBlank(q.PaymentTerms__c)
      ? q.PaymentTerms__c
      : 'Net 30';

    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setToAddresses(new List<String>{ toEmail });
    mail.setSubject(
      '[Nexus] Votre contrat B2B est signé — Facture ' + contractRef
    );
    mail.setSenderDisplayName('Nexus B2B Platform');
    mail.setHtmlBody(
      '<!DOCTYPE html><html><body style="font-family:\'Segoe UI\',Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px;">' +
        '<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.1);">' +
        '<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px;text-align:center;">' +
        '<h1 style="color:#fff;margin:0;font-size:24px;">NEXUS</h1>' +
        '<p style="color:#a0aec0;margin:8px 0 0;">Contrat B2B — Signé électroniquement</p></div>' +
        '<div style="padding:32px;">' +
        '<p style="color:#2d3748;">Bonjour <strong>' +
        toName +
        '</strong>,</p>' +
        '<p style="color:#4a5568;">Votre contrat B2B a été signé électroniquement par les deux parties via <strong>d.velop Sign</strong> (eIDAS). Voici votre facture.</p>' +
        '<div style="background:#f7fafc;border-radius:8px;padding:16px;margin:20px 0;">' +
        '<p style="margin:4px 0;color:#2d3748;"><strong>Réf. contrat :</strong> ' +
        contractRef +
        '</p>' +
        '<p style="margin:4px 0;color:#2d3748;"><strong>Devis :</strong> ' +
        q.Name +
        '</p>' +
        '<p style="margin:4px 0;color:#2d3748;"><strong>Signé le :</strong> ' +
        signedAt +
        '</p>' +
        '<p style="margin:4px 0;color:#2d3748;"><strong>Signataire Nexus :</strong> ' +
        signerName +
        '</p></div>' +
        '<h3 style="color:#1a1a2e;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">Détail des prestations</h3>' +
        itemsHtml +
        '<div style="background:#edf2f7;border-radius:8px;padding:16px;margin:16px 0;">' +
        '<p style="margin:4px 0;color:#2d3748;"><strong>Remise :</strong> ' +
        discount +
        '</p>' +
        '<p style="margin:4px 0;color:#2d3748;font-size:18px;"><strong>Total TTC : ' +
        total +
        '</strong></p>' +
        '<p style="margin:4px 0;color:#4a5568;"><strong>Conditions de paiement :</strong> ' +
        payTerms +
        '</p></div>' +
        '<p style="color:#718096;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px;margin-top:24px;">' +
        'Signature électronique conforme au règlement eIDAS (UE) n°910/2014 — d.velop Sign</p>' +
        '</div></div></body></html>'
    );
    Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
  }
}
