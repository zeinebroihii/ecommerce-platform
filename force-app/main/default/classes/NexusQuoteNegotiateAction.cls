public without sharing class NexusQuoteNegotiateAction {

  public class Input {
    @InvocableVariable(label='Quote Name' required=false)
    public String quoteName;
    @InvocableVariable(label='Account Id' required=false)
    public String accountId;
    @InvocableVariable(label='Discount Percent' required=false)
    public Decimal discountPercent;
    @InvocableVariable(label='Counter Price' required=false)
    public Decimal counterPrice;
    @InvocableVariable(label='Requested Payment Terms' required=false)
    public String requestedPaymentTerms;
    @InvocableVariable(label='Requested Validity Days' required=false)
    public Integer requestedValidityDays;
    @InvocableVariable(label='Customer Message' required=false)
    public String message;
    @InvocableVariable(label='Action' required=false)
    public String action; // GET | NEGOTIATE | ACCEPT | REJECT | ESCALATE
    @InvocableVariable(label='Quote Id' required=false)
    public String quoteId; // direct ID lookup — highest priority, avoids wrong-quote on multi-deal accounts
  }

  public class Output {
    // Quote details (always returned)
    @InvocableVariable(label='Quote Id')
    public String quoteId;
    @InvocableVariable(label='Quote Name')
    public String quoteName;
    @InvocableVariable(label='Grand Total')
    public Decimal grandTotal;
    @InvocableVariable(label='Payment Terms')
    public String paymentTerms;
    @InvocableVariable(label='Status')
    public String status;
    @InvocableVariable(label='Expiration Date')
    public String expirationDate;
    @InvocableVariable(label='Bulk Discount Percent')
    public Decimal bulkDiscount;
    @InvocableVariable(label='Products Summary')
    public String productsSummary;
    @InvocableVariable(label='Acceptance Probability')
    public Integer acceptanceProbability;
    // Negotiation result
    @InvocableVariable(label='Outcome')
    public String outcome; // SHOWN | ACCEPTED | COUNTERED | REJECTED | ESCALATED | TRADEOFF | ERROR
    @InvocableVariable(label='New Total')
    public Decimal newTotal;
    @InvocableVariable(label='Proposed Payment Terms')
    public String proposedPaymentTerms;
    @InvocableVariable(label='Combo A')
    public String comboA;
    @InvocableVariable(label='Combo B')
    public String comboB;
    @InvocableVariable(label='Response Message')
    public String responseMessage;
  }

  @InvocableMethod(
    label='Negotiate Quote'
    description='Single action for all quote negotiation. Pass quoteName (e.g. QUOTE-0119) and discountPercent (e.g. 14) and requestedPaymentTerms (e.g. Net 60). Call IMMEDIATELY when customer mentions a quote + any discount or terms. When outcome=ESCALATED: relay the responseMessage word-for-word to the customer — do NOT show combo options A or B, do NOT ask the customer to choose between options. The sales team has been notified via Slack and Quote Builder and will respond within 2 business hours. Never reveal floor prices. Use action=GET to show details, ACCEPT to accept, REJECT to reject.'
  )
  public static List<Output> negotiate(List<Input> inputs) {
    List<Output> results = new List<Output>();

    for (Input inp : inputs) {
      Output out = new Output();
      String act = String.isNotBlank(inp.action) ? inp.action.toUpperCase() : 'NEGOTIATE';

      // ── Resolve quote ────────────────────────────────────────────────────────
      TALEXO_Quote__c q = resolveQuote(inp.quoteName, inp.accountId, inp.quoteId);

      if (q == null) {
        out.outcome = 'ERROR';
        out.responseMessage = 'I could not find that quote. Please provide the quote number (e.g. QUOTE-0119).';
        results.add(out);
        continue;
      }

      // Populate base quote details in output
      out.quoteId = q.Id;
      out.quoteName = q.Name;
      out.grandTotal = q.GrandTotal__c;
      out.paymentTerms = q.PaymentTerms__c != null ? q.PaymentTerms__c : 'Net 30';
      out.status = q.Status__c;
      out.expirationDate = q.ExpirationDate__c != null ? q.ExpirationDate__c.format() : null;
      out.bulkDiscount = q.BulkDiscount__c != null ? q.BulkDiscount__c : 0;
      out.acceptanceProbability = q.AcceptanceProbability__c != null
        ? Integer.valueOf(q.AcceptanceProbability__c) : null;

      List<String> parts = new List<String>();
      for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
        parts.add(li.ProductName__c + ' ×' + (li.Quantity__c != null ? Integer.valueOf(li.Quantity__c) : 1)
          + ' — ' + (li.UnitPrice__c != null ? li.UnitPrice__c.setScale(2) + ' €' : ''));
      }
      out.productsSummary = parts.isEmpty() ? 'No line items' : String.join(parts, '\n');

      // ── Route by action ──────────────────────────────────────────────────────
      if (act == 'GET') {
        out.outcome = 'SHOWN';
        out.responseMessage = buildSummary(q, out.productsSummary);
        results.add(out);
        continue;
      }

      if (act == 'ACCEPT') {
        try {
          QuoteController.processQuoteDecision(q.Id, 'Accepted', 'Accepted by customer via AI agent.');
          out.outcome = 'ACCEPTED';
          out.responseMessage = 'Your quote has been accepted. You will receive the contract and DocuSign link shortly.';
        } catch (Exception ex) {
          out.outcome = 'ERROR';
          out.responseMessage = ex.getMessage();
        }
        results.add(out);
        continue;
      }

      if (act == 'REJECT') {
        try {
          QuoteController.processQuoteDecision(q.Id, 'Rejected',
            String.isNotBlank(inp.message) ? inp.message : 'Rejected by customer via AI agent.');
          out.outcome = 'REJECTED';
          out.responseMessage = 'Your quote has been rejected. Please let us know if you would like to start a new negotiation.';
        } catch (Exception ex) {
          out.outcome = 'ERROR';
          out.responseMessage = ex.getMessage();
        }
        results.add(out);
        continue;
      }

      // ── NEGOTIATE (default) ──────────────────────────────────────────────────
      if (q.Status__c != 'Presented') {
        out.outcome = 'ERROR';
        out.responseMessage = 'This quote (status: ' + q.Status__c + ') is not open for negotiation yet. ' +
          'Here are the current details:\n' + buildSummary(q, out.productsSummary);
        results.add(out);
        continue;
      }

      // Calculate counter price
      Decimal price = inp.counterPrice;
      if ((price == null || price <= 0) && inp.discountPercent != null && q.GrandTotal__c != null) {
        price = (q.GrandTotal__c * (1 - inp.discountPercent / 100)).setScale(2);
      }
      if (price == null || price <= 0) {
        // No price given — just show the quote
        out.outcome = 'SHOWN';
        out.responseMessage = buildSummary(q, out.productsSummary) +
          '\n\nWhat discount or terms would you like to request?';
        results.add(out);
        continue;
      }

      try {
        QuoteController.NegotiationResult res = QuoteController.submitMultiTermOffer(
          q.Id, price, inp.requestedPaymentTerms, inp.requestedValidityDays, inp.message
        );
        out.outcome = res.outcome;
        out.newTotal = res.newTotal;
        out.proposedPaymentTerms = res.proposedPaymentTerms;
        out.comboA = res.comboA;
        out.comboB = res.comboB;
        out.responseMessage = res.responseMessage;
      } catch (Exception ex) {
        out.outcome = 'ERROR';
        out.responseMessage = 'An error occurred: ' + ex.getMessage();
      }

      results.add(out);
    }
    return results;
  }

  private static TALEXO_Quote__c resolveQuote(String quoteName, String accountId, String quoteId) {
    List<TALEXO_Quote__c> found = new List<TALEXO_Quote__c>();

    // Priority 1: direct Id — set from hidden prechat field, guaranteed correct quote
    if (String.isNotBlank(quoteId)) {
      try {
        Id qId = Id.valueOf(quoteId);
        found = [
          SELECT Id, Name, Status__c, GrandTotal__c, FloorPrice__c, BulkDiscount__c,
                 PaymentTerms__c, ExpirationDate__c, AcceptanceProbability__c,
                 VersionNumber__c, GeneralTerms__c, Description__c,
                 EscalationComboA__c, EscalationComboB__c, CounterMessage__c,
                 NegotiationRound__c,
                 Opportunity__c, Opportunity__r.AccountId,
                 Opportunity__r.Account.Name,
                 (SELECT ProductName__c, Quantity__c, UnitPrice__c FROM NexusQuoteLineItems__r)
          FROM TALEXO_Quote__c
          WHERE Id = :qId LIMIT 1
        ];
      } catch (Exception ex) {}
    }

    // Priority 2: name search
    if (found.isEmpty() && String.isNotBlank(quoteName)) {
      found = [
        SELECT Id, Name, Status__c, GrandTotal__c, FloorPrice__c, BulkDiscount__c,
               PaymentTerms__c, ExpirationDate__c, AcceptanceProbability__c,
               VersionNumber__c, GeneralTerms__c, Description__c,
               EscalationComboA__c, EscalationComboB__c, CounterMessage__c,
               NegotiationRound__c,
               Opportunity__c, Opportunity__r.AccountId,
               Opportunity__r.Account.Name,
               (SELECT ProductName__c, Quantity__c, UnitPrice__c FROM NexusQuoteLineItems__r)
        FROM TALEXO_Quote__c
        WHERE Name LIKE :('%' + quoteName.trim() + '%')
        ORDER BY CreatedDate DESC LIMIT 1
      ];
    }

    // Priority 3: most recent primary Presented quote for this account
    if (found.isEmpty() && String.isNotBlank(accountId)) {
      try {
        Id accId = Id.valueOf(accountId);
        found = [
          SELECT Id, Name, Status__c, GrandTotal__c, FloorPrice__c, BulkDiscount__c,
                 PaymentTerms__c, ExpirationDate__c, AcceptanceProbability__c,
                 VersionNumber__c, Description__c,
                 EscalationComboA__c, EscalationComboB__c, CounterMessage__c,
                 NegotiationRound__c,
                 Opportunity__c, Opportunity__r.AccountId,
                 Opportunity__r.Account.Name,
                 (SELECT ProductName__c, Quantity__c, UnitPrice__c FROM NexusQuoteLineItems__r)
          FROM TALEXO_Quote__c
          WHERE Opportunity__r.AccountId = :accId
            AND Status__c IN ('Presented','Draft','Requested')
            AND IsPrimary__c = TRUE
          ORDER BY CreatedDate DESC LIMIT 1
        ];
      } catch (Exception ex) {}
    }

    return found.isEmpty() ? null : found[0];
  }

  private static String buildSummary(TALEXO_Quote__c q, String productsSummary) {
    String total = q.GrandTotal__c != null ? q.GrandTotal__c.setScale(2).toPlainString() + ' €' : '—';
    String expiry = q.ExpirationDate__c != null ? q.ExpirationDate__c.format() : 'N/A';
    Integer days = q.ExpirationDate__c != null ? Date.today().daysBetween(q.ExpirationDate__c) : 0;
    String summary = 'Quote: ' + q.Name +
      ' | Status: ' + q.Status__c +
      ' | Total: ' + total +
      ' | Discount: ' + (q.BulkDiscount__c != null ? q.BulkDiscount__c.toPlainString() : '0') + '%' +
      ' | Payment terms: ' + (q.PaymentTerms__c != null ? q.PaymentTerms__c : 'Net 30') +
      ' | Valid until: ' + expiry + ' (' + days + ' days remaining)' +
      '\nProducts:\n' + productsSummary;
    if (String.isNotBlank(q.GeneralTerms__c)) {
      summary += '\n\nGeneral Terms & Conditions:\n' + q.GeneralTerms__c;
    }
    if (String.isNotBlank(q.Description__c)) {
      Integer noteIdx = q.Description__c.indexOf('Customer Note:');
      if (noteIdx >= 0) {
        summary += '\n\nCustomer Note: ' + q.Description__c.substring(noteIdx + 14).trim();
      }
    }
    if (String.isNotBlank(q.CounterMessage__c) && q.CounterMessage__c.startsWith('ESCALATION')) {
      summary += '\n\n[ESCALATED — Requires Admin Decision]';
      summary += '\nEscalation note: ' + q.CounterMessage__c;
      if (String.isNotBlank(q.EscalationComboA__c)) {
        summary += '\nOption A: ' + q.EscalationComboA__c;
      }
      if (String.isNotBlank(q.EscalationComboB__c)) {
        summary += '\nOption B: ' + q.EscalationComboB__c;
      }
      if (q.NegotiationRound__c != null) {
        summary += '\nNegotiation round: ' + Integer.valueOf(q.NegotiationRound__c);
      }
    }
    return summary;
  }
}
