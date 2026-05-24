/**
 * DocuSignService
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends a dual-party DocuSign envelope for Nexus B2B contracts:
 *   1. Builds JWT and exchanges for DocuSign access token (JWT Grant)
 *   2. Creates envelope with contract document + both signers in ONE API call
 *   3. Both parties immediately receive a DocuSign signing email
 *
 * Called from NexusQuoteController.generateAndSendContract() via @future.
 * Config: DocuSignConfig__mdt record "Default".
 * ─────────────────────────────────────────────────────────────────────────────
 */
public class DocuSignService {
  // ── Load config from Custom Metadata ────────────────────────────────────────
  private static DocuSignConfig_mdt__mdt CFG {
    get {
      if (CFG == null) {
        List<DocuSignConfig_mdt__mdt> rows = [
          SELECT
            Integration_Key__c,
            User_Id__c,
            Account_Id__c,
            Base_Uri__c,
            Private_Key__c,
            Admin_Email__c
          FROM DocuSignConfig_mdt__mdt
          WHERE DeveloperName = 'Default'
          LIMIT 1
        ];
        CFG = rows.isEmpty() ? new DocuSignConfig_mdt__mdt() : rows[0];
      }
      return CFG;
    }
    set;
  }

  // ── Public entry point ────────────────────────────────────────────────────────
  @future(callout=true)
  public static void initiateContractSigning(Id quoteId) {
    TALEXO_Quote__c q = [
      SELECT
        Id,
        Name,
        GrandTotal__c,
        BulkDiscount__c,
        PaymentTerms__c,
        ExpirationDate__c,
        Description__c,
        CreatedById,
        Opportunity__r.AccountId,
        Opportunity__r.Account.Name,
        (
          SELECT ProductName__c, Quantity__c, UnitPrice__c, NetTotal__c
          FROM NexusQuoteLineItems__r
        )
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];

    // Resolve AccountId from Opportunity relationship or quote creator
    Id accountId = q.Opportunity__r.AccountId;
    if (accountId == null && q.CreatedById != null) {
      List<User> creators = [
        SELECT AccountId
        FROM User
        WHERE Id = :q.CreatedById AND AccountId != NULL
        LIMIT 1
      ];
      if (!creators.isEmpty())
        accountId = creators[0].AccountId;
    }
    if (accountId == null) {
      List<User> anyPortal = [
        SELECT AccountId
        FROM User
        WHERE
          UserType = 'PowerCustomerSuccess'
          AND IsActive = TRUE
          AND AccountId != NULL
        LIMIT 1
      ];
      if (!anyPortal.isEmpty())
        accountId = anyPortal[0].AccountId;
    }
    if (accountId == null) {
      System.debug(
        '[DocuSign] Cannot resolve AccountId for quote ' +
          quoteId +
          ' — skipping'
      );
      return;
    }

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
    if (custUsers.isEmpty()) {
      System.debug(
        '[DocuSign] No portal user for account ' + accountId + ' — skipping'
      );
      return;
    }

    String customerEmail = custUsers[0].Email;
    String customerName = custUsers[0].FirstName + ' ' + custUsers[0].LastName;

    try {
      String token = getAccessToken();
      String envelopeId = sendEnvelope(q, customerEmail, customerName, token);
      if (String.isNotBlank(envelopeId)) {
        update new TALEXO_Quote__c(
          Id = quoteId,
          DvelopEnvelopeId__c = envelopeId
        );
        System.debug(
          '[DocuSign] Envelope sent — id=' + envelopeId + ' | quote=' + q.Name
        );
      }
    } catch (Exception ex) {
      System.debug(
        '[DocuSign] Error: ' + ex.getMessage() + '\n' + ex.getStackTraceString()
      );
    }
  }

  // ── JWT Grant: exchange RSA-signed JWT for access token ──────────────────────
  private static String getAccessToken() {
    String integrationKey = CFG.Integration_Key__c;
    String userId = CFG.User_Id__c;

    // Build JWT
    String header = base64UrlEncode(
      Blob.valueOf('{"alg":"RS256","typ":"JWT"}')
    );
    Long iat = DateTime.now().getTime() / 1000;
    Long exp = iat + 3600;
    String claimsJson =
      '{"iss":"' +
      integrationKey +
      '",' +
      '"sub":"' +
      userId +
      '",' +
      '"aud":"account-d.docusign.com",' +
      '"iat":' +
      iat +
      ',' +
      '"exp":' +
      exp +
      ',' +
      '"scope":"signature impersonation"}';
    String claims = base64UrlEncode(Blob.valueOf(claimsJson));

    String signingInput = header + '.' + claims;
    Blob privateKey = getPrivateKeyBlob(CFG.Private_Key__c);
    Blob signature = Crypto.sign(
      'RSA-SHA256',
      Blob.valueOf(signingInput),
      privateKey
    );
    String jwt = signingInput + '.' + base64UrlEncode(signature);

    // Exchange JWT for access token
    HttpRequest req = new HttpRequest();
    req.setMethod('POST');
    req.setEndpoint('https://account-d.docusign.com/oauth/token');
    req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
    req.setTimeout(30000);
    req.setBody(
      'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer' +
        '&assertion=' +
        jwt
    );

    HttpResponse res = new Http().send(req);
    System.debug(
      '[DocuSign] Auth → ' +
        res.getStatusCode() +
        ': ' +
        res.getBody().left(200)
    );

    if (res.getStatusCode() != 200) {
      throw new CalloutException(
        '[DocuSign] Auth failed — HTTP ' +
          res.getStatusCode() +
          ': ' +
          res.getBody()
      );
    }

    return (String) ((Map<String, Object>) JSON.deserializeUntyped(
        res.getBody()
      ))
      .get('access_token');
  }

  // ── Create + send envelope in one API call ───────────────────────────────────
  private static String sendEnvelope(
    TALEXO_Quote__c q,
    String customerEmail,
    String customerName,
    String accessToken
  ) {
    String docBase64 = buildContractDocument(q, customerName, customerEmail);
    String safeFilename =
      q.Name.replaceAll('[^A-Za-z0-9_-]', '_') +
      '_Contrat_Nexus_' +
      Date.today().format().replaceAll('/', '-');
    String adminEmail = String.isNotBlank(CFG.Admin_Email__c)
      ? CFG.Admin_Email__c
      : 'zeineb.roihi@talan.com';

    // Anchor tab definitions — match the /sig1/ and /date1/ markers
    // embedded in buildContractDocument. DocuSign places the signature
    // field automatically wherever the anchor string appears in the doc.
    Map<String, Object> customerTabs = new Map<String, Object>{
      'signHereTabs' => new List<Object>{
        new Map<String, Object>{
          'anchorString' => '/sig1/',
          'anchorUnits' => 'pixels',
          'anchorXOffset' => '0',
          'anchorYOffset' => '0'
        }
      },
      'dateSignedTabs' => new List<Object>{
        new Map<String, Object>{
          'anchorString' => '/date1/',
          'anchorUnits' => 'pixels',
          'anchorXOffset' => '0',
          'anchorYOffset' => '0'
        }
      }
    };

    Map<String, Object> envelope = new Map<String, Object>{
      'emailSubject' => 'Nexus B2B Contract — Signature Required: ' + q.Name,
      'emailBlurb' => 'Hello, please review and sign the attached Nexus B2B contract.',
      'documents' => new List<Object>{
        new Map<String, Object>{
          'documentBase64' => docBase64,
          'name' => safeFilename + '.html',
          'fileExtension' => 'html',
          'documentId' => '1'
        }
      },
      'recipients' => new Map<String, Object>{
        // Customer only — Nexus signs internally, not via DocuSign
        'signers' => new List<Object>{
          new Map<String, Object>{
            'email' => customerEmail,
            'name' => customerName,
            'recipientId' => '1',
            'routingOrder' => '1',
            'tabs' => customerTabs
          }
        }
      },
      'status' => 'sent'
    };

    HttpRequest req = new HttpRequest();
    req.setMethod('POST');
    req.setEndpoint(
      CFG.Base_Uri__c +
        '/restapi/v2.1/accounts/' +
        CFG.Account_Id__c +
        '/envelopes'
    );
    req.setHeader('Authorization', 'Bearer ' + accessToken);
    req.setHeader('Content-Type', 'application/json');
    req.setTimeout(30000);
    req.setBody(JSON.serialize(envelope));

    HttpResponse res = new Http().send(req);
    System.debug(
      '[DocuSign] Send envelope → ' +
        res.getStatusCode() +
        ': ' +
        res.getBody().left(300)
    );

    if (res.getStatusCode() < 200 || res.getStatusCode() >= 300) {
      throw new CalloutException(
        '[DocuSign] Send envelope failed — HTTP ' +
          res.getStatusCode() +
          ': ' +
          res.getBody()
      );
    }

    Map<String, Object> envResp = (Map<String, Object>) JSON.deserializeUntyped(
      res.getBody()
    );
    return (String) envResp.get('envelopeId');
  }

  // ── Build contract as HTML document (renders as PDF in DocuSign) ─────────────
  @TestVisible
  public static String buildContractDocument(
    TALEXO_Quote__c q,
    String customerName,
    String customerEmail
  ) {
    String today = Date.today().format();
    String expiry = q.ExpirationDate__c != null
      ? q.ExpirationDate__c.format()
      : Date.today().addDays(30).format();
    String total = q.GrandTotal__c != null
      ? q.GrandTotal__c.setScale(2).toPlainString() + ' EUR'
      : '0.00 EUR';
    String discount = q.BulkDiscount__c != null
      ? q.BulkDiscount__c.setScale(0).toPlainString() + '%'
      : '0%';
    String payTerms = String.isNotBlank(q.PaymentTerms__c)
      ? q.PaymentTerms__c
      : 'Net 30';
    String generalTerms =
      'This contract is governed by applicable commercial law. ' +
      'The service provider undertakes to deliver the products and services described within agreed timelines. ' +
      'The client undertakes to settle all amounts per the payment terms above. ' +
      'This electronic signature via DocuSign constitutes a legally binding commitment per eIDAS regulations.';
    String sigDeadline = '14 days after sending';
    String accountName = q.Opportunity__r?.Account?.Name != null
      ? q.Opportunity__r.Account.Name
      : customerName;

    // ── Load signature + stamp images from Static Resources ───────────────────
    String stampImgTag = '';
    String eSignImgTag = '';
    try {
      List<StaticResource> stampRes = [
        SELECT Body
        FROM StaticResource
        WHERE Name = 'nexusStamp'
        LIMIT 1
      ];
      if (!stampRes.isEmpty()) {
        String b64 = EncodingUtil.base64Encode(stampRes[0].Body);
        stampImgTag =
          '<img src="data:image/png;base64,' +
          b64 +
          '" width="115" height="115" style="display:block" alt="Nexus Stamp"/>';
      }
    } catch (Exception ex) {
      System.debug('[DocuSign] Stamp: ' + ex.getMessage());
    }
    try {
      List<StaticResource> sigRes = [
        SELECT Body
        FROM StaticResource
        WHERE Name = 'nexusSignature'
        LIMIT 1
      ];
      if (!sigRes.isEmpty()) {
        String b64 = EncodingUtil.base64Encode(sigRes[0].Body);
        eSignImgTag =
          '<img src="data:image/png;base64,' +
          b64 +
          '" style="max-width:190px;max-height:80px;display:block" alt="Nexus Signature"/>';
      }
    } catch (Exception ex) {
      System.debug('[DocuSign] Sig: ' + ex.getMessage());
    }

    // Fallback SVG stamp
    if (String.isBlank(stampImgTag)) {
      stampImgTag =
        '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 200 200">' +
        '<circle cx="100" cy="100" r="96" fill="none" stroke="#3b65b5" stroke-width="3"/>' +
        '<circle cx="100" cy="100" r="70" fill="none" stroke="#3b65b5" stroke-width="1.5"/>' +
        '<text x="100" y="107" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="#3b65b5">Nexus</text>' +
        '<text x="100" y="128" text-anchor="middle" font-family="Arial" font-size="13" fill="#3b65b5">IT Products</text>' +
        '</svg>';
    }
    if (String.isBlank(eSignImgTag)) {
      eSignImgTag =
        '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 200 70">' +
        '<path d="M10,50 C30,10 50,60 70,35 C90,10 100,55 120,30 C140,8 155,45 180,25"' +
        ' fill="none" stroke="#1e3a8a" stroke-width="2.5" stroke-linecap="round"/>' +
        '</svg>';
    }

    // Build products rows
    String rows = '';
    if (
      q.NexusQuoteLineItems__r != null && !q.NexusQuoteLineItems__r.isEmpty()
    ) {
      Boolean even = false;
      for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
        String bg = even ? ' style="background:#f8fafc"' : '';
        String qty = li.Quantity__c != null
          ? String.valueOf(li.Quantity__c.intValue())
          : '1';
        String up = li.UnitPrice__c != null
          ? li.UnitPrice__c.setScale(2).toPlainString() + ' EUR'
          : '0.00 EUR';
        String net = li.NetTotal__c != null
          ? li.NetTotal__c.setScale(2).toPlainString() + ' EUR'
          : '0.00 EUR';
        rows +=
          '<tr' +
          bg +
          '>' +
          '<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">' +
          (li.ProductName__c != null ? li.ProductName__c : '') +
          '</td>' +
          '<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">' +
          qty +
          '</td>' +
          '<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">' +
          up +
          '</td>' +
          '<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">' +
          net +
          '</td>' +
          '</tr>';
        even = !even;
      }
    } else {
      rows = '<tr><td colspan="4" style="padding:10px;text-align:center;color:#94a3b8">No products</td></tr>';
    }

    // >_ NEXUS terminal logo
    String nexusLogo =
      '<table cellpadding="0" cellspacing="0" style="display:inline-table;background:#0f172a;border-radius:8px"><tr>' +
      '<td style="padding:7px 8px 7px 14px;font-family:monospace;color:#22c55e;font-size:16px;font-weight:700;line-height:1">&gt;_</td>' +
      '<td style="padding:7px 14px 7px 4px;color:#fff;font-size:15px;font-weight:900;letter-spacing:3px;font-family:Arial,sans-serif;line-height:1">NEXUS</td>' +
      '</tr></table>';

    // Hidden anchor spans — invisible to human eye, DocuSign uses them for widget placement
    // CRITICAL: each anchor must be in its own isolated container so it doesn't overlap with visible text
    String sig1Anchor = '<span style="display:block;position:absolute;top:4px;left:4px;font-size:1px;line-height:1px;color:rgba(255,255,255,0.01)">/sig1/</span>';
    String date1Anchor = '<span style="display:block;position:absolute;top:4px;left:4px;font-size:1px;line-height:1px;color:rgba(255,255,255,0.01)">/date1/</span>';

    String html =
      '<!DOCTYPE html><html><head><meta charset="UTF-8"/>' +
      '<style>' +
      'body{font-family:Arial,Helvetica,sans-serif;font-size:12pt;color:#1e293b;margin:30px 36px;line-height:1.55;width:auto}' +
      'h1{font-size:15pt;letter-spacing:2px;text-transform:uppercase;color:#0f172a;margin:0 0 4px}' +
      '.header-sub{color:#64748b;font-size:10pt;margin-bottom:0}' +
      '.divider{border:none;border-top:2.5px solid #1e293b;margin:14px 0}' +
      '.section-title{font-size:9.5pt;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;' +
      '  color:#475569;border-bottom:1.5px solid #e2e8f0;padding-bottom:4px;margin:18px 0 10px}' +
      'table{border-collapse:collapse}' +
      'table.full{width:100%}' +
      '.party-role{font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px}' +
      '.party-name{font-size:12pt;font-weight:700;color:#0f172a;margin-bottom:3px}' +
      '.party-sub{font-size:10pt;color:#64748b}' +
      '.totals-label{padding:6px 14px;font-size:11pt;color:#475569}' +
      '.totals-value{padding:6px 14px;font-size:11pt;text-align:right}' +
      '.totals-grand{padding:8px 14px;font-size:13pt;font-weight:700;color:#0f172a}' +
      '.sig-col-title{font-size:9.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0f172a;margin-bottom:14px}' +
      '.sig-date-label{font-size:9pt;color:#64748b;margin-bottom:6px;margin-top:10px}' +
      '.footer{text-align:center;font-size:8.5pt;color:#94a3b8;margin-top:18px;border-top:1px solid #e2e8f0;padding-top:8px}' +
      '</style></head><body>' +
      // ── HEADER ───────────────────────────────────────────────────────────────────
      '<table class="full" cellpadding="0" cellspacing="0"><tr>' +
      '<td style="width:160px;vertical-align:middle">' +
      nexusLogo +
      '</td>' +
      '<td style="text-align:center;vertical-align:middle"><h1>Electronic B2B Contract</h1>' +
      '<div class="header-sub">Ref: <strong>' +
      q.Name +
      '</strong> &nbsp;|&nbsp; Date: ' +
      today +
      ' &nbsp;|&nbsp; Valid until: ' +
      expiry +
      '</div></td>' +
      '<td style="width:120px;text-align:right;vertical-align:middle">' +
      '<span style="font-size:9pt;font-weight:700;color:#fff;background:#4f46e5;border-radius:5px;padding:4px 12px;letter-spacing:1px">B2B CONTRACT</span>' +
      '</td></tr></table>' +
      '<hr class="divider"/>' +
      // ── PARTIES ──────────────────────────────────────────────────────────────────
      '<table class="full" cellpadding="0" cellspacing="0"><tr>' +
      '<td style="width:50%;vertical-align:top;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 18px">' +
      '<div class="party-role">Service Provider</div>' +
      '<div class="party-name">Nexus IT Products</div>' +
      '<div class="party-sub">mynexus.com</div>' +
      '<div class="party-sub">zeineb.roihi@talan.com</div>' +
      '</td>' +
      '<td style="width:10px"></td>' +
      '<td style="width:50%;vertical-align:top;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 18px">' +
      '<div class="party-role">Client</div>' +
      '<div class="party-name">' +
      accountName +
      '</div>' +
      '<div class="party-sub">' +
      customerName +
      '</div>' +
      '</td>' +
      '</tr></table>' +
      // ── PRODUCTS ─────────────────────────────────────────────────────────────────
      '<div class="section-title">Products &amp; Services</div>' +
      '<table class="full" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden">' +
      '<tr style="background:#0f172a">' +
      '<th style="padding:9px 12px;color:#fff;text-align:left;font-size:10.5pt;font-weight:700">Product / Service</th>' +
      '<th style="padding:9px 12px;color:#fff;text-align:center;font-size:10.5pt;width:60px">Qty</th>' +
      '<th style="padding:9px 12px;color:#fff;text-align:right;font-size:10.5pt;width:130px">Unit Price</th>' +
      '<th style="padding:9px 12px;color:#fff;text-align:right;font-size:10.5pt;width:140px">Line Total</th>' +
      '</tr>' +
      rows +
      '</table>' +
      // ── TOTALS ───────────────────────────────────────────────────────────────────
      '<table class="full" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;margin-top:12px">' +
      '<tr><td class="totals-label">Volume Discount Applied</td><td class="totals-value">' +
      discount +
      '</td></tr>' +
      '<tr><td class="totals-label">Payment Terms</td><td class="totals-value">' +
      payTerms +
      '</td></tr>' +
      '<tr><td class="totals-label">Signature Deadline</td><td class="totals-value">' +
      sigDeadline +
      '</td></tr>' +
      '<tr><td class="totals-label">Contract Duration</td><td class="totals-value">12 months</td></tr>' +
      '<tr style="border-top:2px solid #94a3b8"><td class="totals-grand">TOTAL AMOUNT (VAT INCL.)</td><td class="totals-grand" style="text-align:right">' +
      total +
      '</td></tr>' +
      '</table>' +
      // ── TERMS ────────────────────────────────────────────────────────────────────
      '<div style="font-size:9.5pt;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:5px;padding:10px 16px;margin:14px 0;line-height:1.6">' +
      '<strong>General Terms &amp; Conditions:</strong> ' +
      generalTerms.replace('\n', '<br/>') +
      '</div>' +
      // ── SIGNATURES ───────────────────────────────────────────────────────────────
      '<div class="section-title">Electronic Signatures</div>' +
      '<table class="full" cellpadding="0" cellspacing="0"><tr>' +
      // Left col — Nexus (stamp + handwritten signature)
      '<td style="width:49%;vertical-align:top;border:1px solid #cbd5e1;border-radius:8px;padding:16px 18px">' +
      '<div class="sig-col-title">Service Provider — Nexus</div>' +
      '<table cellpadding="0" cellspacing="0"><tr>' +
      '<td style="vertical-align:middle;padding-right:12px">' +
      stampImgTag +
      '</td>' +
      '<td style="vertical-align:middle">' +
      eSignImgTag +
      '</td>' +
      '</tr></table>' +
      '<div class="sig-date-label">Signed on: ' +
      today +
      '</div>' +
      '</td>' +
      '<td style="width:2%"></td>' +
      // Right col — Client (DocuSign anchor, clean — NO account name in this column to avoid widget overlap)
      '<td style="width:49%;vertical-align:top;border:1px solid #cbd5e1;border-radius:8px;padding:16px 18px">' +
      '<div class="sig-col-title">Client</div>' +
      // Blank 70px zone — anchor at the TOP. DocuSign "Sign Here" widget fills this space below the anchor.
      '<div style="position:relative;height:70px;margin-bottom:8px">' +
      sig1Anchor +
      '</div>' +
      // Signature underline
      '<div style="border-bottom:1.5px solid #334155;margin-bottom:10px"></div>' +
      // Date section — label above, then anchor for date widget
      '<div class="sig-date-label">Signed on:</div>' +
      '<div style="position:relative;height:24px">' +
      date1Anchor +
      '</div>' +
      '</td>' +
      '</tr></table>' +
      // ── FOOTER ───────────────────────────────────────────────────────────────────
      '<div class="footer">Auto-generated by Nexus B2B Platform &nbsp;·&nbsp; Electronic signatures via DocuSign &nbsp;·&nbsp; ' +
      today +
      '</div>' +
      '</body></html>';

    return EncodingUtil.base64Encode(Blob.valueOf(html));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  private static String base64UrlEncode(Blob input) {
    return EncodingUtil.base64Encode(input)
      .replace('+', '-')
      .replace('/', '_')
      .replace('=', '');
  }

  private static Blob getPrivateKeyBlob(String pemKey) {
    String stripped = pemKey
      .replace('-----BEGIN RSA PRIVATE KEY-----', '')
      .replace('-----END RSA PRIVATE KEY-----', '')
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replaceAll('\\s+', '');
    return EncodingUtil.base64Decode(stripped);
  }
}
