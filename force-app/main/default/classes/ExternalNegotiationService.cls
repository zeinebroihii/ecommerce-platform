/**
 * ExternalNegotiationService
 *
 * Submits a finalized Salesforce quote to the external negotiation platform
 * (Option A — external versioning, sync-back via webhook).
 *
 * Setup required:
 *   1. Create a Named Credential:  Setup → Named Credentials → New
 *      Name: NexusNegotiationPlatform
 *      URL:  https://your-negotiation-platform.com
 *      Auth: Custom Header (Authorization: Bearer <token>)
 *
 *   2. Add the endpoint to Remote Site Settings.
 *
 *   3. The external platform must call POST /services/apexrest/NexusNegotiation
 *      to sync back final status (handled by QuoteWebhookHandler).
 *
 * CPQ Integration Point: If Salesforce CPQ is installed, call
 *   SBQQ.QuoteDocumentAPI.create() here to attach a PDF before submission.
 */
public without sharing class ExternalNegotiationService {
  private static final String NAMED_CRED = 'callout:NexusNegotiationPlatform';
  private static final String API_PATH = '/api/v1/quotes';

  // ── Payload structures ────────────────────────────────────────────────────

  public class SubmissionPayload {
    public String salesforceQuoteId;
    public String salesforceOrgId;
    public String quoteName;
    public String accountName;
    public Decimal totalAmount;
    public Decimal discountPercent;
    public String paymentTerms;
    public String expirationDate;
    public String salesRepEmail;
    public String callbackUrl;
    public Integer versionNumber;
    public List<LinePayload> lineItems;
  }

  public class LinePayload {
    public String productName;
    public String productFamily;
    public Integer quantity;
    public Decimal listPrice;
    public Decimal discountPercent;
    public Decimal unitPrice;
    public Decimal netTotal;
  }

  public class PlatformResponse {
    public String externalId;
    public String status;
    public String negotiationUrl;
    public String message;
  }

  // ── Main method — called by nexusQuoteBuilder "Submit Quote" button ───────

  @AuraEnabled
  public static String submitToNegotiationPlatform(Id quoteId) {
    // Load quote with all related data
    TALEXO_Quote__c q = [
      SELECT
        Id,
        Name,
        GrandTotal__c,
        BulkDiscount__c,
        PaymentTerms__c,
        ExpirationDate__c,
        NegotiationStatus__c,
        VersionNumber__c,
        Opportunity__r.Account.Name,
        Opportunity__r.Owner.Email,
        (
          SELECT
            ProductName__c,
            ProductFamily__c,
            Quantity__c,
            ListPrice__c,
            UnitPrice__c,
            Discount__c,
            NetTotal__c
          FROM NexusQuoteLineItems__r
        )
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];

    // Build payload
    SubmissionPayload payload = new SubmissionPayload();
    payload.salesforceQuoteId = String.valueOf(quoteId);
    payload.salesforceOrgId = UserInfo.getOrganizationId();
    payload.quoteName = q.Name;
    payload.accountName = q.Opportunity__r?.Account?.Name;
    payload.totalAmount = q.GrandTotal__c;
    payload.discountPercent = q.BulkDiscount__c;
    payload.paymentTerms = q.PaymentTerms__c;
    payload.expirationDate = q.ExpirationDate__c?.format();
    payload.salesRepEmail = q.Opportunity__r?.Owner?.Email;
    payload.versionNumber = q.VersionNumber__c != null
      ? Integer.valueOf(q.VersionNumber__c)
      : 1;
    payload.callbackUrl =
      URL.getOrgDomainUrl().toExternalForm() +
      '/services/apexrest/NexusNegotiation';

    payload.lineItems = new List<LinePayload>();
    for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
      LinePayload lp = new LinePayload();
      lp.productName = li.ProductName__c;
      lp.productFamily = li.ProductFamily__c;
      lp.quantity = li.Quantity__c != null
        ? Integer.valueOf(li.Quantity__c)
        : 1;
      lp.listPrice = li.ListPrice__c;
      lp.discountPercent = li.Discount__c;
      lp.unitPrice = li.UnitPrice__c;
      lp.netTotal = li.NetTotal__c;
      payload.lineItems.add(lp);
    }

    // HTTP POST
    HttpRequest req = new HttpRequest();
    req.setEndpoint(NAMED_CRED + API_PATH);
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/json');
    req.setHeader('Accept', 'application/json');
    req.setBody(JSON.serialize(payload));
    req.setTimeout(20000);

    HttpResponse res = new Http().send(req);

    if (res.getStatusCode() == 200 || res.getStatusCode() == 201) {
      PlatformResponse pr = (PlatformResponse) JSON.deserialize(
        res.getBody(),
        PlatformResponse.class
      );

      // Update Quote — store external ID, mark submitted
      update new TALEXO_Quote__c(
        Id = quoteId,
        ExternalNegotiationId__c = pr.externalId,
        NegotiationStatus__c = 'Submitted',
        Status__c = 'Sent',
        SubmittedAt__c = Datetime.now()
      );

      return pr.negotiationUrl; // returned to LWC for "Open in Platform" button
    }

    throw new AuraHandledException(
      'Negotiation platform error [' +
        res.getStatusCode() +
        ']: ' +
        res.getBody()
    );
  }

  // ── Retrieve current negotiation status from external platform ────────────

  @AuraEnabled
  public static String getNegotiationStatus(Id quoteId) {
    TALEXO_Quote__c q = [
      SELECT ExternalNegotiationId__c
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];
    if (String.isBlank(q.ExternalNegotiationId__c)) {
      return 'NOT_SUBMITTED';
    }

    HttpRequest req = new HttpRequest();
    req.setEndpoint(
      NAMED_CRED + API_PATH + '/' + q.ExternalNegotiationId__c + '/status'
    );
    req.setMethod('GET');
    req.setHeader('Accept', 'application/json');
    req.setTimeout(10000);

    HttpResponse res = new Http().send(req);
    return res.getStatusCode() == 200 ? res.getBody() : 'ERROR';
  }
}
