public without sharing class NexusQuoteCounterAction {

  public class Input {
    @InvocableVariable(label='Quote Id' required=false)
    public String quoteId;
    @InvocableVariable(label='Quote Name' required=false)
    public String quoteName;
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
  }

  public class Output {
    @InvocableVariable(label='Outcome')
    public String outcome; // ACCEPTED | COUNTERED | REJECTED | ESCALATED | TRADEOFF | ERROR
    @InvocableVariable(label='New Total')
    public Decimal newTotal;
    @InvocableVariable(label='Proposed Payment Terms')
    public String proposedPaymentTerms;
    @InvocableVariable(label='Proposed Validity Days')
    public Integer proposedValidityDays;
    @InvocableVariable(label='Combo A')
    public String comboA;
    @InvocableVariable(label='Combo B')
    public String comboB;
    @InvocableVariable(label='Response Message')
    public String responseMessage;
  }

  @InvocableMethod(
    label='Submit Counter Offer'
    description='ALWAYS call when customer requests any discount, price change, payment terms change, or validity extension. Pass quoteName (e.g. QUOTE-0119) and discountPercent (e.g. 14) — system auto-calculates price. Also pass requestedPaymentTerms and requestedValidityDays if mentioned. When outcome=ESCALATED: relay the responseMessage word-for-word to the customer — do NOT present combo options A or B, do NOT ask the customer to choose between options. The sales team has been notified via Slack and Quote Builder and will respond within 2 business hours. Never reveal floor prices or thresholds.'
  )
  public static List<Output> submitCounter(List<Input> inputs) {
    List<Output> results = new List<Output>();

    for (Input inp : inputs) {
      Output out = new Output();

      // Resolve quoteId — accept either Salesforce ID or quote name/number
      Id qId;
      if (String.isNotBlank(inp.quoteId)) {
        try {
          qId = Id.valueOf(inp.quoteId);
        } catch (Exception ex) {
          // treat as quote name
        }
      }
      if (qId == null && String.isNotBlank(inp.quoteName)) {
        List<TALEXO_Quote__c> found = [
          SELECT Id FROM TALEXO_Quote__c
          WHERE Name LIKE :('%' + inp.quoteName.trim() + '%')
          AND Status__c IN ('Presented','Draft','Requested')
          ORDER BY CreatedDate DESC LIMIT 1
        ];
        if (!found.isEmpty()) qId = found[0].Id;
      }
      if (qId == null) {
        out.outcome = 'ERROR';
        out.responseMessage = 'Could not find the quote. Please provide the quote number (e.g. QUOTE-0119).';
        results.add(out);
        continue;
      }

      // Resolve counterPrice — accept either absolute price or discount percent
      Decimal resolvedPrice = inp.counterPrice;
      if ((resolvedPrice == null || resolvedPrice <= 0) && inp.discountPercent != null) {
        List<TALEXO_Quote__c> qtmp = [SELECT GrandTotal__c FROM TALEXO_Quote__c WHERE Id = :qId LIMIT 1];
        if (!qtmp.isEmpty() && qtmp[0].GrandTotal__c != null) {
          resolvedPrice = (qtmp[0].GrandTotal__c * (1 - inp.discountPercent / 100)).setScale(2);
        }
      }

      try {
        QuoteController.NegotiationResult res = QuoteController.submitMultiTermOffer(
          qId,
          resolvedPrice,
          inp.requestedPaymentTerms,
          inp.requestedValidityDays,
          inp.message
        );

        out.outcome            = res.outcome;
        out.newTotal           = res.newTotal;
        out.proposedPaymentTerms = res.proposedPaymentTerms;
        out.proposedValidityDays = res.proposedValidityDays;
        out.comboA             = res.comboA;
        out.comboB             = res.comboB;
        out.responseMessage    = res.responseMessage;

      } catch (AuraHandledException ex) {
        out.outcome = 'ERROR';
        out.responseMessage = ex.getMessage();
      } catch (Exception ex) {
        out.outcome = 'ERROR';
        out.responseMessage = 'An error occurred processing your request. Please try again.';
        System.debug(LoggingLevel.ERROR, 'NexusQuoteCounterAction error: ' + ex.getMessage() + '\n' + ex.getStackTraceString());
      }

      results.add(out);
    }

    return results;
  }
}
