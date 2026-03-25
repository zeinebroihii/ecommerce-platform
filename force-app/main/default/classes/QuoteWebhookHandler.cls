/**
 * QuoteWebhookHandler
 *
 * REST endpoint that receives sync-back callbacks from the external
 * negotiation platform (Option A).
 *
 * Endpoint: POST  /services/apexrest/NexusNegotiation
 *
 * Expected JSON body:
 * {
 *   "salesforceQuoteId": "a0X...",
 *   "externalId":        "ext-uuid-xyz",
 *   "status":            "Accepted" | "Rejected" | "InNegotiation" | "Counter",
 *   "finalPrice":        12500.00,
 *   "newVersionNumber":  2,
 *   "rejectionReason":   "Price too high",
 *   "counterProposal":   "Offer €11,200 with extended support"
 * }
 *
 * Decision logic:
 *   Accepted      → Quote.Status = Accepted, Opp.Stage = Contract In Progress
 *   Rejected      → Quote.Status = Rejected, Opp.Stage = Closed Lost
 *                   → Email sales rep + customer portal notification
 *                   → If customer wants to renegotiate: submit new version
 *   InNegotiation → Update version number, keep monitoring
 *   Counter       → NegotiationStatus = Counter Received, email sales rep
 */
@RestResource(urlMapping='/NexusNegotiation/*')
global without sharing class QuoteWebhookHandler {
  public class NegotiationCallback {
    public String salesforceQuoteId;
    public String externalId;
    public String status;
    public Decimal finalPrice;
    public Integer newVersionNumber;
    public String rejectionReason;
    public String counterProposal;
  }

  @HttpPost
  global static void handleCallback() {
    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;
    res.addHeader('Content-Type', 'application/json');

    try {
      String body = req.requestBody != null ? req.requestBody.toString() : '';
      if (String.isBlank(body)) {
        res.statusCode = 400;
        res.responseBody = Blob.valueOf('{"error":"Empty request body"}');
        return;
      }

      NegotiationCallback cb = (NegotiationCallback) JSON.deserialize(
        body,
        NegotiationCallback.class
      );

      if (String.isBlank(cb.salesforceQuoteId)) {
        res.statusCode = 400;
        res.responseBody = Blob.valueOf(
          '{"error":"Missing salesforceQuoteId"}'
        );
        return;
      }

      TALEXO_Quote__c q = [
        SELECT
          Id,
          Name,
          Status__c,
          NegotiationStatus__c,
          VersionNumber__c,
          Opportunity__c,
          Opportunity__r.AccountId,
          Opportunity__r.OwnerId,
          Opportunity__r.Owner.Email,
          Opportunity__r.Account.Name
        FROM TALEXO_Quote__c
        WHERE Id = :cb.salesforceQuoteId
        LIMIT 1
      ];

      String oppStage;
      String salesRepSubject;
      String salesRepBody;
      String accName = q.Opportunity__r?.Account?.Name;

      // ── Route by status ───────────────────────────────────────────────
      if (cb.status == 'Accepted') {
        q.Status__c = 'Accepted';
        q.NegotiationStatus__c = 'Final';
        q.FinalNegotiatedPrice__c = cb.finalPrice;
        oppStage = 'Contract In Progress';
        salesRepSubject = 'Nexus — Quote ACCEPTED: ' + q.Name;
        salesRepBody =
          accName +
          ' has ACCEPTED quote ' +
          q.Name +
          '.\nFinal negotiated price: ' +
          (cb.finalPrice != null ? cb.finalPrice.setScale(2) + ' €' : 'TBD') +
          '\n\nNext step: prepare contract in Salesforce.';
      } else if (cb.status == 'Rejected') {
        q.Status__c = 'Rejected';
        q.NegotiationStatus__c = 'Final';
        oppStage = 'Closed Lost';
        salesRepSubject = 'Nexus — Quote REJECTED: ' + q.Name;
        salesRepBody =
          accName +
          ' has REJECTED quote ' +
          q.Name +
          '.' +
          (String.isNotBlank(cb.rejectionReason)
            ? '\nReason: ' + cb.rejectionReason
            : '') +
          '\n\nConsider reaching out to offer a revised quote or renegotiate.';
      } else if (cb.status == 'InNegotiation') {
        q.NegotiationStatus__c = 'In Negotiation';
        if (cb.newVersionNumber != null) {
          q.VersionNumber__c = cb.newVersionNumber;
        }
        if (cb.finalPrice != null) {
          q.FinalNegotiatedPrice__c = cb.finalPrice;
        }
        salesRepSubject = 'Nexus — Negotiation Update: ' + q.Name;
        salesRepBody =
          'Quote ' +
          q.Name +
          ' is now in active negotiation' +
          ' (v' +
          (q.VersionNumber__c != null
            ? Integer.valueOf(q.VersionNumber__c)
            : 1) +
          ').' +
          '\nAccount: ' +
          accName;
      } else if (cb.status == 'Counter') {
        q.NegotiationStatus__c = 'Counter Received';
        if (cb.newVersionNumber != null)
          q.VersionNumber__c = cb.newVersionNumber;
        if (cb.finalPrice != null)
          q.FinalNegotiatedPrice__c = cb.finalPrice;
        salesRepSubject = 'Nexus — Counter Proposal Received: ' + q.Name;
        salesRepBody =
          accName +
          ' has submitted a counter-proposal on quote ' +
          q.Name +
          '.' +
          (String.isNotBlank(cb.counterProposal)
            ? '\nCounter offer: ' + cb.counterProposal
            : '') +
          (cb.finalPrice != null
            ? '\nProposed price: ' + cb.finalPrice.setScale(2) + ' €'
            : '') +
          '\n\nReview and respond in Salesforce or the negotiation platform.';
      }

      update q;

      if (String.isNotBlank(oppStage)) {
        update new Opportunity(Id = q.Opportunity__c, StageName = oppStage);
      }

      // Notify sales rep by email
      if (
        String.isNotBlank(salesRepSubject) &&
        String.isNotBlank(q.Opportunity__r?.Owner?.Email)
      ) {
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new List<String>{ q.Opportunity__r.Owner.Email });
        mail.setSubject(salesRepSubject);
        mail.setPlainTextBody(salesRepBody + '\n\nNexus Commerce Platform');
        mail.setSaveAsActivity(false);
        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
      }

      // Push portal notification to customer if Accepted or Rejected
      if (cb.status == 'Accepted' || cb.status == 'Rejected') {
        List<User> custUsers = [
          SELECT Id
          FROM User
          WHERE
            AccountId = :q.Opportunity__r.AccountId
            AND IsActive = TRUE
            AND UserType = 'PowerCustomerSuccess'
          LIMIT 1
        ];
        if (!custUsers.isEmpty()) {
          String notifTitle = cb.status == 'Accepted'
            ? 'Quote Accepted — Contract in Progress'
            : 'Quote Update — ' + q.Name;
          String notifMsg = cb.status == 'Accepted'
            ? 'Your quote ' +
              q.Name +
              ' has been finalized. Contract preparation begins now.'
            : 'Your quote ' +
              q.Name +
              ' has been closed. Contact your sales rep for next steps.';
          NotificationController.push(
            custUsers[0].Id,
            notifTitle,
            notifMsg,
            'Quote',
            '/ss/s/mes-offres'
          );
        }
      }

      res.statusCode = 200;
      res.responseBody = Blob.valueOf(
        '{"success":true,"status":"' + cb.status + '"}'
      );
    } catch (Exception ex) {
      res.statusCode = 500;
      res.responseBody = Blob.valueOf(
        '{"error":"' + ex.getMessage().replace('"', '\\"') + '"}'
      );
    }
  }

  // ── GET: health check / status poll ──────────────────────────────────────
  @HttpGet
  global static void healthCheck() {
    RestContext.response.statusCode = 200;
    RestContext.response.responseBody = Blob.valueOf(
      '{"status":"ok","service":"NexusNegotiationWebhook","ts":"' +
        Datetime.now().format('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'') +
        '"}'
    );
  }
}
