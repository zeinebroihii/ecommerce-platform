/**
 * DocuSignPollQueueable
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs every 2 minutes (via DocuSignPollJob) to check DocuSign envelope status.
 * When an envelope is completed:
 *   - All callouts happen FIRST (token + status check + PDF download)
 *   - All DML happens AFTER (quote, opp, contract, file attachment, emails)
 * No @future chaining — everything in one Queueable transaction.
 */
public class DocuSignPollQueueable implements Queueable, Database.AllowsCallouts {
  public void execute(QueueableContext ctx) {
    // Pick up:
    //  a) Quotes not yet finalized (Status not Signed/Rejected/Declined)
    //  b) Recently-signed quotes where the PDF attach failed (no ContentDocumentLink)
    // A quote is considered "fully done" only when its Opportunity ALSO has the
    // signed PDF (not just the Quote record). This ensures the queueable retries
    // any quote whose Opportunity link was previously missed.
    List<TALEXO_Quote__c> recentSigned = [
      SELECT Id, Opportunity__c
      FROM TALEXO_Quote__c
      WHERE
        DvelopEnvelopeId__c != NULL
        AND Status__c = 'Signed'
        AND LastModifiedDate >= :DateTime.now().addDays(-30)
    ];

    Map<Id, Id> quoteToOpp = new Map<Id, Id>();
    Set<Id> oppIds = new Set<Id>();
    Set<Id> quotesWithNoOpp = new Set<Id>();
    for (TALEXO_Quote__c sq : recentSigned) {
      if (sq.Opportunity__c != null) {
        quoteToOpp.put(sq.Id, sq.Opportunity__c);
        oppIds.add(sq.Opportunity__c);
      } else {
        quotesWithNoOpp.add(sq.Id);
      }
    }

    // Opportunities that already have the signed PDF
    Set<Id> oppsWithPdf = new Set<Id>();
    if (!oppIds.isEmpty()) {
      for (ContentDocumentLink cdl : [
        SELECT LinkedEntityId
        FROM ContentDocumentLink
        WHERE
          LinkedEntityId IN :oppIds
          AND ContentDocument.Title LIKE '%_Signed_Contract%'
      ]) {
        oppsWithPdf.add(cdl.LinkedEntityId);
      }
    }

    // For quotes with no Opportunity, fall back to checking the Quote itself
    Set<Id> quotesWithPdf = new Set<Id>();
    if (!quotesWithNoOpp.isEmpty()) {
      for (ContentDocumentLink cdl : [
        SELECT LinkedEntityId
        FROM ContentDocumentLink
        WHERE
          LinkedEntityId IN :quotesWithNoOpp
          AND ContentDocument.Title LIKE '%_Signed_Contract%'
      ]) {
        quotesWithPdf.add(cdl.LinkedEntityId);
      }
    }
    // Add quotes whose Opportunity already has the PDF
    for (Id qId : quoteToOpp.keySet()) {
      if (oppsWithPdf.contains(quoteToOpp.get(qId))) {
        quotesWithPdf.add(qId);
      }
    }

    System.debug(
      '[DocuSignPoll] Fully linked quotes (skip): ' + quotesWithPdf.size()
    );

    List<TALEXO_Quote__c> pending = [
      SELECT
        Id,
        Name,
        DvelopEnvelopeId__c,
        Status__c,
        GrandTotal__c,
        PaymentTerms__c,
        BulkDiscount__c,
        Opportunity__c,
        Opportunity__r.AccountId,
        Opportunity__r.Account.Name,
        Opportunity__r.OwnerId,
        Opportunity__r.Owner.Email,
        (
          SELECT ProductName__c, Quantity__c, UnitPrice__c, NetTotal__c
          FROM NexusQuoteLineItems__r
        )
      FROM TALEXO_Quote__c
      WHERE
        DvelopEnvelopeId__c != NULL
        AND Status__c NOT IN ('Rejected', 'Declined')
        AND (Status__c NOT IN ('Signed')
        OR (Status__c = 'Signed'
        AND Id NOT IN :quotesWithPdf
        AND LastModifiedDate >= :DateTime.now().addDays(-30)))
      LIMIT 5
    ];
    System.debug('[DocuSignPoll] Pending quotes to check: ' + pending.size());
    if (pending.isEmpty())
      return;

    DocuSignConfig_mdt__mdt cfg;
    try {
      cfg = [
        SELECT
          Account_Id__c,
          Base_Uri__c,
          Integration_Key__c,
          User_Id__c,
          Private_Key__c
        FROM DocuSignConfig_mdt__mdt
        WHERE DeveloperName = 'Default'
        LIMIT 1
      ];
    } catch (Exception e) {
      return;
    }

    // ── PHASE 1: ALL CALLOUTS ─────────────────────────────────────────────────
    String token = buildToken(cfg);
    if (String.isBlank(token)) {
      System.debug('[DocuSignPoll] Could not obtain token — aborting.');
      return;
    }

    // Check status for each pending envelope, download PDF if completed
    Map<Id, Blob> completedPdfs = new Map<Id, Blob>(); // quoteId → signed PDF
    for (TALEXO_Quote__c q : pending) {
      try {
        String status = checkEnvelopeStatus(token, cfg, q.DvelopEnvelopeId__c);
        System.debug(
          '[DocuSignPoll] Envelope ' + q.DvelopEnvelopeId__c + ' → ' + status
        );
        if ('completed'.equalsIgnoreCase(status)) {
          Blob pdf = downloadPdf(token, cfg, q.DvelopEnvelopeId__c);
          completedPdfs.put(q.Id, pdf); // pdf may be null if download failed; we still finalize
        }
      } catch (Exception e) {
        System.debug(
          '[DocuSignPoll] Error checking ' +
            q.DvelopEnvelopeId__c +
            ': ' +
            e.getMessage()
        );
      }
    }

    if (completedPdfs.isEmpty())
      return;

    // ── PHASE 2: ALL DML (no more callouts below this line) ───────────────────
    Date contractStart = Date.today();
    Date contractEnd = Date.today().addYears(1);
    List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

    for (TALEXO_Quote__c q : pending) {
      if (!completedPdfs.containsKey(q.Id))
        continue;
      try {
        finalize(
          q,
          completedPdfs.get(q.Id),
          contractStart,
          contractEnd,
          emails
        );
      } catch (Exception e) {
        System.debug(
          '[DocuSignPoll] Finalize error for ' + q.Name + ': ' + e.getMessage()
        );
      }
    }

    if (!emails.isEmpty()) {
      try {
        Messaging.sendEmail(emails);
      } catch (Exception e) {
        System.debug('[DocuSignPoll] Email error: ' + e.getMessage());
      }
    }
  }

  // ── Finalizes one completed quote: DML + file attach + email prep ─────────────
  private void finalize(
    TALEXO_Quote__c q,
    Blob pdfBlob,
    Date contractStart,
    Date contractEnd,
    List<Messaging.SingleEmailMessage> emails
  ) {
    // 1. Mark quote Signed (skip if already Signed — webhook may have done it)
    if (q.Status__c != 'Signed') {
      update new TALEXO_Quote__c(
        Id = q.Id,
        Status__c = 'Signed',
        NegotiationStatus__c = 'Final',
        DocuSign_Status__c = 'Completed',
        Contract_Start_Date__c = contractStart,
        Contract_End_Date__c = contractEnd
      );
    }

    // 2. Close opportunity (safe to re-run — idempotent)
    if (q.Opportunity__c != null) {
      try {
        update new Opportunity(Id = q.Opportunity__c, StageName = 'Closed Won');
      } catch (Exception e) {
        System.debug('[DocuSignPoll] Opp update: ' + e.getMessage());
      }
    }

    // 3. Get or create Contract — isolated so failure never blocks PDF attachment
    Id accountId = q.Opportunity__r.AccountId;
    Id contractId = null;
    String contractRef = 'CTR-' + q.Id.to15().right(6).toUpperCase();
    try {
      if (accountId != null) {
        List<Contract> existingC = [
          SELECT Id
          FROM Contract
          WHERE AccountId = :accountId AND StartDate = :contractStart
          LIMIT 1
        ];
        Contract c;
        if (!existingC.isEmpty()) {
          c = existingC[0];
        } else {
          c = new Contract(
            AccountId = accountId,
            Status = 'Draft',
            StartDate = contractStart,
            ContractTerm = 12,
            Description = 'Nexus B2B Contract — ' + q.Name,
            OwnerId = q.Opportunity__r.OwnerId
          );
          insert c;
          try {
            update new Contract(Id = c.Id, Status = 'Activated');
          } catch (Exception e) {
            System.debug(
              '[DocuSignPoll] Contract activation: ' + e.getMessage()
            );
          }
        }
        contractId = c.Id;
        contractRef = 'CTR-' + String.valueOf(c.Id).right(6).toUpperCase();
      } else {
        System.debug(
          '[DocuSignPoll] No AccountId on opportunity — skipping Contract creation.'
        );
      }
    } catch (Exception e) {
      System.debug(
        '[DocuSignPoll] Contract creation failed (PDF will still attach): ' +
        e.getMessage()
      );
    }

    String signedAt = DateTime.now().format('dd/MM/yyyy HH:mm') + ' UTC';

    // 4. Chatter post
    if (q.Opportunity__c != null) {
      try {
        insert new FeedItem(
          ParentId = q.Opportunity__c,
          Body = '✅ Contract ' +
            q.Name +
            ' signed via DocuSign.\n' +
            'Opportunity moved to Closed Won. Contract ref: ' +
            contractRef +
            '.'
        );
      } catch (Exception e) {
        System.debug('[DocuSignPoll] Chatter: ' + e.getMessage());
      }
    }

    // 5. Attach signed PDF — always runs regardless of contract creation outcome
    if (pdfBlob != null) {
      String filename =
        q.Name.replaceAll('[^A-Za-z0-9_-]', '_') + '_Signed_Contract.pdf';
      ContentVersion cv = new ContentVersion(
        Title = filename,
        PathOnClient = filename,
        VersionData = pdfBlob,
        IsMajorVersion = true
      );
      insert cv;
      cv = [
        SELECT ContentDocumentId
        FROM ContentVersion
        WHERE Id = :cv.Id
        LIMIT 1
      ];

      // Link to every available record individually so one failure doesn't block others
      if (contractId != null) {
        try {
          insert new ContentDocumentLink(
            ContentDocumentId = cv.ContentDocumentId,
            LinkedEntityId = contractId,
            ShareType = 'V',
            Visibility = 'AllUsers'
          );
        } catch (Exception e) {
          System.debug('[DocuSignPoll] Contract link: ' + e.getMessage());
        }
      }
      if (accountId != null) {
        try {
          insert new ContentDocumentLink(
            ContentDocumentId = cv.ContentDocumentId,
            LinkedEntityId = accountId,
            ShareType = 'V',
            Visibility = 'AllUsers'
          );
        } catch (Exception e) {
          System.debug('[DocuSignPoll] Account link: ' + e.getMessage());
        }
      }
      try {
        insert new ContentDocumentLink(
          ContentDocumentId = cv.ContentDocumentId,
          LinkedEntityId = q.Id,
          ShareType = 'V',
          Visibility = 'AllUsers'
        );
      } catch (Exception e) {
        System.debug('[DocuSignPoll] Quote link: ' + e.getMessage());
      }
      if (q.Opportunity__c != null) {
        try {
          insert new ContentDocumentLink(
            ContentDocumentId = cv.ContentDocumentId,
            LinkedEntityId = q.Opportunity__c,
            ShareType = 'V',
            Visibility = 'AllUsers'
          );
        } catch (Exception e) {
          System.debug('[DocuSignPoll] Opp link: ' + e.getMessage());
        }
      }

      System.debug(
        '[DocuSignPoll] PDF attached: ' +
          filename +
          ' → Quote + Opportunity' +
          (accountId != null ? ' + Account' : '') +
          (contractId != null ? ' + Contract' : '')
      );
    } else {
      System.debug(
        '[DocuSignPoll] PDF blob was null for ' +
          q.Name +
          ' — file not attached.'
      );
    }

    // 6. Build notification email for owner
    if (String.isNotBlank(q.Opportunity__r.Owner.Email)) {
      Messaging.SingleEmailMessage notif = new Messaging.SingleEmailMessage();
      notif.setToAddresses(new List<String>{ q.Opportunity__r.Owner.Email });
      notif.setSubject(
        '[Nexus] Contract signed — ' + q.Opportunity__r.Account.Name
      );
      notif.setSenderDisplayName('Nexus CRM');
      notif.setHtmlBody(
        '<p>Contract <strong>' +
          q.Name +
          '</strong> has been signed via DocuSign.</p>' +
          '<p>Reference: <strong>' +
          contractRef +
          '</strong> | Signed: ' +
          signedAt +
          '</p>' +
          '<p>The opportunity is now <strong>Closed Won</strong>. The signed PDF is attached in Salesforce.</p>' +
          '<p>— Nexus CRM</p>'
      );
      emails.add(notif);
    }

    // 7. Build invoice email for customer portal user
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
    if (!custUsers.isEmpty()) {
      emails.add(buildInvoiceEmail(custUsers[0], q, contractRef, signedAt));
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  private String checkEnvelopeStatus(
    String token,
    DocuSignConfig_mdt__mdt cfg,
    String envelopeId
  ) {
    HttpRequest req = new HttpRequest();
    req.setMethod('GET');
    req.setEndpoint(
      cfg.Base_Uri__c +
        '/restapi/v2.1/accounts/' +
        cfg.Account_Id__c +
        '/envelopes/' +
        envelopeId
    );
    req.setHeader('Authorization', 'Bearer ' + token);
    req.setTimeout(15000);
    HttpResponse res = new Http().send(req);
    if (res.getStatusCode() != 200)
      return null;
    return (String) ((Map<String, Object>) JSON.deserializeUntyped(
        res.getBody()
      ))
      .get('status');
  }

  private Blob downloadPdf(
    String token,
    DocuSignConfig_mdt__mdt cfg,
    String envelopeId
  ) {
    // documents/combined always returns a merged PDF regardless of original format
    HttpRequest req = new HttpRequest();
    req.setMethod('GET');
    req.setEndpoint(
      cfg.Base_Uri__c +
        '/restapi/v2.1/accounts/' +
        cfg.Account_Id__c +
        '/envelopes/' +
        envelopeId +
        '/documents/combined'
    );
    req.setHeader('Authorization', 'Bearer ' + token);
    req.setHeader('Accept', 'application/pdf');
    req.setTimeout(30000);
    HttpResponse res = new Http().send(req);
    System.debug(
      '[DocuSignPoll] PDF download HTTP ' +
        res.getStatusCode() +
        ' content-type=' +
        res.getHeader('Content-Type')
    );
    return res.getStatusCode() == 200 ? res.getBodyAsBlob() : null;
  }

  private String buildToken(DocuSignConfig_mdt__mdt cfg) {
    try {
      String header = b64url(Blob.valueOf('{"alg":"RS256","typ":"JWT"}'));
      Long iat = DateTime.now().getTime() / 1000;
      String claims = b64url(
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
      Blob pk = EncodingUtil.base64Decode(
        cfg.Private_Key__c
          .replace('-----BEGIN RSA PRIVATE KEY-----', '')
          .replace('-----END RSA PRIVATE KEY-----', '')
          .replace('-----BEGIN PRIVATE KEY-----', '')
          .replace('-----END PRIVATE KEY-----', '')
          .replaceAll('\\s+', '')
      );
      String jwt =
        input +
        '.' +
        b64url(Crypto.sign('RSA-SHA256', Blob.valueOf(input), pk));
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
    } catch (Exception e) {
      System.debug('[DocuSignPoll] Token error: ' + e.getMessage());
      return null;
    }
  }

  private String b64url(Blob b) {
    return EncodingUtil.base64Encode(b)
      .replace('+', '-')
      .replace('/', '_')
      .replace('=', '');
  }

  private Messaging.SingleEmailMessage buildInvoiceEmail(
    User u,
    TALEXO_Quote__c q,
    String contractRef,
    String signedAt
  ) {
    String rows = '';
    if (q.NexusQuoteLineItems__r != null) {
      for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
        rows +=
          '<tr style="border-bottom:1px solid #eee">' +
          '<td style="padding:7px 10px">' +
          (li.ProductName__c != null ? li.ProductName__c : '') +
          '</td>' +
          '<td style="padding:7px 10px;text-align:center">' +
          (li.Quantity__c != null ? li.Quantity__c.intValue() : 0) +
          '</td>' +
          '<td style="padding:7px 10px;text-align:right">' +
          (li.UnitPrice__c != null ? li.UnitPrice__c.setScale(2) : 0) +
          ' €</td>' +
          '<td style="padding:7px 10px;text-align:right;font-weight:600">' +
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
    m.setToAddresses(new List<String>{ u.Email });
    m.setSubject('[Nexus] Contract signed — ' + contractRef);
    m.setSenderDisplayName('Nexus B2B Platform');
    m.setHtmlBody(
      '<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">' +
        '<div style="max-width:620px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden">' +
        '<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:28px;text-align:center">' +
        '<h1 style="color:#fff;margin:0;letter-spacing:3px">NEXUS</h1>' +
        '<p style="color:#a0aec0;margin:6px 0 0">B2B Contract — Electronically signed via DocuSign</p></div>' +
        '<div style="padding:28px">' +
        '<p>Hello <strong>' +
        u.FirstName +
        ' ' +
        u.LastName +
        '</strong>,</p>' +
        '<p>Your contract has been signed by both parties. The signed PDF is attached to your account in Salesforce.</p>' +
        '<div style="background:#f7fafc;border-radius:7px;padding:14px;margin:16px 0">' +
        '<p><strong>Contract ref:</strong> ' +
        contractRef +
        '</p>' +
        '<p><strong>Quote:</strong> ' +
        q.Name +
        '</p>' +
        '<p><strong>Signed on:</strong> ' +
        signedAt +
        '</p></div>' +
        '<table style="width:100%;border-collapse:collapse;margin:10px 0">' +
        '<thead><tr style="background:#1a1a2e;color:#fff">' +
        '<th style="padding:8px 10px;text-align:left">Product</th>' +
        '<th style="padding:8px 10px;text-align:center">Qty</th>' +
        '<th style="padding:8px 10px;text-align:right">Unit price</th>' +
        '<th style="padding:8px 10px;text-align:right">Total</th></tr></thead>' +
        '<tbody>' +
        rows +
        '</tbody></table>' +
        '<div style="background:#edf2f7;border-radius:7px;padding:14px;margin:14px 0">' +
        '<p><strong>Discount:</strong> ' +
        discount +
        '</p>' +
        '<p style="font-size:16px"><strong>Total (VAT incl.): ' +
        total +
        '</strong></p>' +
        '<p><strong>Payment:</strong> ' +
        terms +
        '</p></div>' +
        '<p style="color:#718096;font-size:11px;border-top:1px solid #e2e8f0;padding-top:14px">' +
        'Electronic signature via DocuSign — legally binding per eIDAS.</p>' +
        '</div></div></body>'
    );
    return m;
  }
}
