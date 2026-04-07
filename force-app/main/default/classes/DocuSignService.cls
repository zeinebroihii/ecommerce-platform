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
      q.Name.replaceAll('[^A-Za-z0-9_-]', '_') + '_Contrat_Nexus';
    String adminEmail = String.isNotBlank(CFG.Admin_Email__c)
      ? CFG.Admin_Email__c
      : 'zeineb.roihi@talan.com';

    Map<String, Object> envelope = new Map<String, Object>{
      'emailSubject' => 'Contrat B2B Nexus — Signature requise : ' + q.Name,
      'emailBlurb' => 'Bonjour, veuillez consulter et signer le contrat B2B Nexus ci-joint.',
      'documents' => new List<Object>{
        new Map<String, Object>{
          'documentBase64' => docBase64,
          'name' => safeFilename + '.txt',
          'fileExtension' => 'txt',
          'documentId' => '1'
        }
      },
      'recipients' => new Map<String, Object>{
        'signers' => new List<Object>{
          new Map<String, Object>{
            'email' => customerEmail,
            'name' => customerName,
            'recipientId' => '1',
            'routingOrder' => '1'
          },
          new Map<String, Object>{
            'email' => adminEmail,
            'name' => 'Nexus — Talan',
            'recipientId' => '2',
            'routingOrder' => '1'
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

  // ── Build contract as plain-text document ────────────────────────────────────
  @TestVisible
  private static String buildContractDocument(
    TALEXO_Quote__c q,
    String customerName,
    String customerEmail
  ) {
    String today = Date.today().format();
    String expiry = q.ExpirationDate__c != null
      ? q.ExpirationDate__c.format()
      : Date.today().addDays(30).format();
    String total = q.GrandTotal__c != null
      ? String.valueOf(q.GrandTotal__c.setScale(2)) + ' EUR'
      : '0 EUR';
    String discount = q.BulkDiscount__c != null
      ? String.valueOf(q.BulkDiscount__c.setScale(0)) + '%'
      : '0%';
    String payTerms = String.isNotBlank(q.PaymentTerms__c)
      ? q.PaymentTerms__c
      : 'Net 30';
    String accountName = q.Opportunity__r.Account.Name;

    String items = '';
    if (
      q.NexusQuoteLineItems__r != null && !q.NexusQuoteLineItems__r.isEmpty()
    ) {
      for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
        String qty = li.Quantity__c != null
          ? String.valueOf(li.Quantity__c.intValue())
          : '0';
        String unitPrice = li.UnitPrice__c != null
          ? String.valueOf(li.UnitPrice__c.setScale(2))
          : '0.00';
        String netTotal = li.NetTotal__c != null
          ? String.valueOf(li.NetTotal__c.setScale(2))
          : '0.00';
        items +=
          '  * ' +
          li.ProductName__c +
          '  |  Qte: ' +
          qty +
          '  |  Prix unitaire: ' +
          unitPrice +
          ' EUR' +
          '  |  Total: ' +
          netTotal +
          ' EUR\n';
      }
    }

    String doc =
      '==============================================================\n' +
      '          NEXUS - CONTRAT B2B ELECTRONIQUE\n' +
      '==============================================================\n\n' +
      'Reference contrat  : ' +
      q.Name +
      '\n' +
      'Date de creation   : ' +
      today +
      '\n' +
      'Date d\'expiration  : ' +
      expiry +
      '\n' +
      'Duree              : 12 mois\n' +
      'Statut             : En attente de signature electronique\n\n' +
      '--------------------------------------------------------------\n' +
      'PARTIES\n' +
      '--------------------------------------------------------------\n' +
      'Prestataire  : Nexus / Talan\n' +
      '               zeineb.roihi@talan.com\n\n' +
      'Client       : ' +
      accountName +
      '\n' +
      '               ' +
      customerName +
      ' (' +
      customerEmail +
      ')\n\n' +
      '--------------------------------------------------------------\n' +
      'PRESTATIONS\n' +
      '--------------------------------------------------------------\n' +
      items +
      '\n' +
      '--------------------------------------------------------------\n' +
      'CONDITIONS FINANCIERES\n' +
      '--------------------------------------------------------------\n' +
      'Remise appliquee     : ' +
      discount +
      '\n' +
      'Montant total TTC    : ' +
      total +
      '\n' +
      'Conditions paiement  : ' +
      payTerms +
      '\n\n' +
      '--------------------------------------------------------------\n' +
      'CONDITIONS GENERALES\n' +
      '--------------------------------------------------------------\n' +
      'Ce contrat est soumis au droit francais. Le prestataire s\'engage\n' +
      'a fournir les produits et services decrits ci-dessus dans les\n' +
      'delais et conditions convenus. Le client s\'engage a regler les\n' +
      'montants dus selon les conditions de paiement mentionnees.\n\n' +
      'La presente signature electronique est realisee via DocuSign.\n' +
      'Elle constitue un engagement contractuel des deux signataires.\n\n' +
      '--------------------------------------------------------------\n' +
      'SIGNATURES ELECTRONIQUES\n' +
      '--------------------------------------------------------------\n' +
      'Prestataire  : ________________________________  Date : __________\n\n' +
      'Client       : ________________________________  Date : __________\n\n' +
      '==============================================================\n' +
      'Document genere automatiquement par la plateforme Nexus.\n' +
      'Signatures gerees par DocuSign (https://demo.docusign.net)\n' +
      '==============================================================\n';

    return EncodingUtil.base64Encode(Blob.valueOf(doc));
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
