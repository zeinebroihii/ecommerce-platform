/**
 * DvelopSignService
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the full d.velop electronic-signature flow for Nexus B2B contracts:
 *   1. Creates a d.velop signing envelope
 *   2. Adds both parties simultaneously (customer = guest, admin = idp)
 *   3. Generates the contract document and attaches it
 *   4. Starts the envelope → both parties receive a d.velop signing email
 *
 * Called from NexusQuoteController.generateAndSendContract() via @future so
 * the DML transaction is already committed before the HTTP callouts begin.
 *
 * Config: DvelopConfig__mdt record "Default" (deployed with the package).
 * Remote Site: DvelopSign.remoteSite-meta.xml (https://talan.d-velop.cloud)
 * ─────────────────────────────────────────────────────────────────────────────
 */
public class DvelopSignService {
  // ── Load config from Custom Metadata ────────────────────────────────────────
  private static DvelopConfig__mdt CFG {
    get {
      if (CFG == null) {
        List<DvelopConfig__mdt> rows = [
          SELECT BaseUrl__c, ApiKey__c, AdminEmail__c
          FROM DvelopConfig__mdt
          WHERE DeveloperName = 'Default'
          LIMIT 1
        ];
        CFG = rows.isEmpty() ? new DvelopConfig__mdt() : rows[0];
      }
      return CFG;
    }
    set;
  }

  // ── Public entry point ────────────────────────────────────────────────────────
  /**
   * Initiates the d.velop dual-party signing flow asynchronously.
   * Must be called AFTER DML is committed (outside any open transaction).
   */
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

    // Resolve customer portal user
    List<User> custUsers = [
      SELECT Email, FirstName, LastName
      FROM User
      WHERE
        AccountId = :q.Opportunity__r.AccountId
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
        '[DvelopSign] No portal user for account ' +
          q.Opportunity__r.AccountId +
          ' — skipping e-sign'
      );
      return;
    }

    String customerEmail = custUsers[0].Email;
    String customerName = custUsers[0].FirstName + ' ' + custUsers[0].LastName;
    String adminEmail = CFG.AdminEmail__c;

    try {
      String envelopeId = runSigningFlow(
        q,
        customerEmail,
        customerName,
        adminEmail
      );
      if (String.isNotBlank(envelopeId)) {
        update new TALEXO_Quote__c(
          Id = quoteId,
          DvelopEnvelopeId__c = envelopeId
        );
        System.debug(
          '[DvelopSign] Envelope started — id=' +
            envelopeId +
            ' | quote=' +
            q.Name
        );
      }
    } catch (Exception ex) {
      System.debug(
        '[DvelopSign] Error: ' +
          ex.getMessage() +
          '\n' +
          ex.getStackTraceString()
      );
    }
  }

  // ── Internal orchestration ────────────────────────────────────────────────────
  private static String runSigningFlow(
    TALEXO_Quote__c q,
    String customerEmail,
    String customerName,
    String adminEmail
  ) {
    Http h = new Http();
    String baseUrl = CFG.BaseUrl__c;
    String apiKey = CFG.ApiKey__c;

    // ── 1. Create envelope ────────────────────────────────────────────────────
    String envelopeName = q.Name + ' — Contrat B2B Nexus';
    Map<String, Object> envBody = new Map<String, Object>{
      'name' => envelopeName,
      'signingOrder' => false
    };

    HttpRequest req1 = buildRequest(
      'POST',
      baseUrl + '/sign/api/v2/envelopes',
      apiKey,
      JSON.serialize(envBody)
    );
    HttpResponse res1 = h.send(req1);
    assertOk(res1, 'create envelope');

    Map<String, Object> envResp = (Map<String, Object>) JSON.deserializeUntyped(
      res1.getBody()
    );
    String envelopeId = (String) envResp.get('id');

    // ── 2. Add customer (external guest signer) ───────────────────────────────
    addParticipant(h, baseUrl, apiKey, envelopeId, customerEmail, 'guest');

    // ── 3. Add admin (internal IDP signer) ────────────────────────────────────
    addParticipant(h, baseUrl, apiKey, envelopeId, adminEmail, 'idp');

    // ── 4. Generate contract document + upload to envelope ────────────────────
    String docBase64 = buildContractDocument(q, customerName, customerEmail);
    String safeFilename =
      q.Name.replaceAll('[^A-Za-z0-9_-]', '_') + '_Contrat_Nexus.txt';
    addDocument(h, baseUrl, apiKey, envelopeId, docBase64, safeFilename);

    // ── 5. Start envelope (sends simultaneous signing emails) ─────────────────
    HttpRequest reqStart = buildRequest(
      'POST',
      baseUrl + '/sign/api/v2/envelopes/' + envelopeId + '/start',
      apiKey,
      '{}'
    );
    HttpResponse resStart = h.send(reqStart);
    System.debug(
      '[DvelopSign] Start envelope HTTP ' +
        resStart.getStatusCode() +
        ': ' +
        resStart.getBody()
    );

    return envelopeId;
  }

  // ── Add a signer ──────────────────────────────────────────────────────────────
  private static void addParticipant(
    Http h,
    String baseUrl,
    String apiKey,
    String envelopeId,
    String email,
    String type
  ) {
    Map<String, Object> body = new Map<String, Object>{
      'participants' => new List<Object>{
        new Map<String, Object>{
          'user' => new Map<String, Object>{ 'email' => email, 'type' => type }
        }
      }
    };
    HttpRequest req = buildRequest(
      'POST',
      baseUrl + '/sign/api/v2/envelopes/' + envelopeId + '/participants',
      apiKey,
      JSON.serialize(body)
    );
    HttpResponse res = h.send(req);
    System.debug(
      '[DvelopSign] addParticipant ' +
        email +
        ' (' +
        type +
        ') → HTTP ' +
        res.getStatusCode()
    );
  }

  // ── Upload document (two-step: upload → get temporaryDocumentId → attach) ────
  private static void addDocument(
    Http h,
    String baseUrl,
    String apiKey,
    String envelopeId,
    String docBase64,
    String filename
  ) {
    // Step 1: Upload raw file bytes → receive temporaryDocumentId
    Blob docBlob = EncodingUtil.base64Decode(docBase64);
    HttpRequest reqUpload = new HttpRequest();
    reqUpload.setMethod('PUT');
    reqUpload.setEndpoint(baseUrl + '/sign/api/v2/documents');
    reqUpload.setHeader('Authorization', 'Bearer ' + apiKey);
    reqUpload.setHeader('Content-Type', 'application/octet-stream');
    reqUpload.setHeader(
      'Content-Disposition',
      'attachment; filename="' + filename + '"'
    );
    reqUpload.setTimeout(30000);
    reqUpload.setBodyAsBlob(docBlob);
    HttpResponse resUpload = h.send(reqUpload);
    System.debug(
      '[DvelopSign] uploadDocument → HTTP ' +
        resUpload.getStatusCode() +
        ': ' +
        resUpload.getBody()
    );

    if (resUpload.getStatusCode() < 200 || resUpload.getStatusCode() >= 300) {
      System.debug(
        '[DvelopSign] Document upload failed — envelope will start without a document'
      );
      return;
    }

    // Step 2: Parse temporaryDocumentId from response
    Map<String, Object> uploadResp = (Map<String, Object>) JSON.deserializeUntyped(
      resUpload.getBody()
    );
    String tempDocId = (String) uploadResp.get('id');
    if (String.isBlank(tempDocId)) {
      // some versions return temporaryDocumentId key
      tempDocId = (String) uploadResp.get('temporaryDocumentId');
    }
    if (String.isBlank(tempDocId)) {
      System.debug(
        '[DvelopSign] No temporaryDocumentId in upload response — skipping attach'
      );
      return;
    }
    System.debug('[DvelopSign] temporaryDocumentId=' + tempDocId);

    // Step 3: Attach document to envelope using temporaryDocumentId
    Map<String, Object> body = new Map<String, Object>{
      'documents' => new List<Object>{
        new Map<String, Object>{
          'temporaryDocumentId' => tempDocId,
          'filename' => filename
        }
      }
    };
    HttpRequest reqAttach = buildRequest(
      'POST',
      baseUrl + '/sign/api/v2/envelopes/' + envelopeId + '/documents',
      apiKey,
      JSON.serialize(body)
    );
    HttpResponse resAttach = h.send(reqAttach);
    System.debug(
      '[DvelopSign] attachDocument → HTTP ' +
        resAttach.getStatusCode() +
        ': ' +
        resAttach.getBody()
    );
  }

  // ── Build contract text document ──────────────────────────────────────────────
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

    // Line items
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
          '  |  Qté: ' +
          qty +
          '  |  Prix unitaire: ' +
          unitPrice +
          ' EUR  |  Total: ' +
          netTotal +
          ' EUR\n';
      }
    }

    String doc =
      '╔══════════════════════════════════════════════════════════════╗\n' +
      '║               NEXUS — CONTRAT B2B ÉLECTRONIQUE               ║\n' +
      '╚══════════════════════════════════════════════════════════════╝\n\n' +
      'Référence contrat  : ' +
      q.Name +
      '\n' +
      'Date de création   : ' +
      today +
      '\n' +
      'Date d\'expiration  : ' +
      expiry +
      '\n' +
      'Durée              : 12 mois\n' +
      'Statut             : En attente de signature électronique\n\n' +
      '──────────────────────────────────────────────────────────────\n' +
      'PARTIES\n' +
      '──────────────────────────────────────────────────────────────\n' +
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
      '──────────────────────────────────────────────────────────────\n' +
      'PRESTATIONS\n' +
      '──────────────────────────────────────────────────────────────\n' +
      items +
      '\n' +
      '──────────────────────────────────────────────────────────────\n' +
      'CONDITIONS FINANCIÈRES\n' +
      '──────────────────────────────────────────────────────────────\n' +
      'Remise appliquée     : ' +
      discount +
      '\n' +
      'Montant total TTC    : ' +
      total +
      '\n' +
      'Conditions paiement  : ' +
      payTerms +
      '\n\n' +
      '──────────────────────────────────────────────────────────────\n' +
      'CONDITIONS GÉNÉRALES\n' +
      '──────────────────────────────────────────────────────────────\n' +
      'Ce contrat est soumis au droit français. Le prestataire s\'engage\n' +
      'à fournir les produits et services décrits ci-dessus dans les\n' +
      'délais et conditions convenus. Le client s\'engage à régler les\n' +
      'montants dus selon les conditions de paiement mentionnées.\n\n' +
      'La présente signature électronique est réalisée conformément au\n' +
      'règlement eIDAS (UE) n°910/2014. Elle a pleine valeur légale et\n' +
      'constitue un engagement contractuel irrévocable de la part des\n' +
      'deux signataires.\n\n' +
      '──────────────────────────────────────────────────────────────\n' +
      'SIGNATURES ÉLECTRONIQUES\n' +
      '──────────────────────────────────────────────────────────────\n' +
      'Prestataire  : ________________________________  Date : __________\n\n' +
      'Client       : ________________________________  Date : __________\n\n' +
      '──────────────────────────────────────────────────────────────\n' +
      'Document généré automatiquement par la plateforme Nexus.\n' +
      'Signatures gérées par d.velop Sign (https://talan.d-velop.cloud)\n' +
      '══════════════════════════════════════════════════════════════\n';

    return EncodingUtil.base64Encode(Blob.valueOf(doc));
  }

  // ── HTTP helpers ──────────────────────────────────────────────────────────────
  private static HttpRequest buildRequest(
    String method,
    String endpoint,
    String apiKey,
    String body
  ) {
    HttpRequest req = new HttpRequest();
    req.setMethod(method);
    req.setEndpoint(endpoint);
    req.setHeader('Authorization', 'Bearer ' + apiKey);
    req.setHeader('Content-Type', 'application/json');
    req.setHeader('Accept', 'application/json');
    req.setTimeout(30000);
    if (String.isNotBlank(body))
      req.setBody(body);
    return req;
  }

  private static void assertOk(HttpResponse res, String context) {
    Integer code = res.getStatusCode();
    if (code < 200 || code >= 300) {
      throw new CalloutException(
        '[DvelopSign] ' +
          context +
          ' failed — HTTP ' +
          code +
          ': ' +
          res.getBody()
      );
    }
  }
}
