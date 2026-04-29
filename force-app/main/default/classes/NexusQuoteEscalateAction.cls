public without sharing class NexusQuoteEscalateAction {

  public class Input {
    @InvocableVariable(label='Quote Id' required=true)
    public String quoteId;
    @InvocableVariable(
      label='Customer Request'
      description='Summary of what the customer needs that is beyond AI authority (e.g. custom SLA, payment terms outside standard, discount above 15%)'
    )
    public String customerRequest;
  }

  public class Output {
    @InvocableVariable(label='Success')
    public Boolean success;
    @InvocableVariable(label='Response Message')
    public String responseMessage;
  }

  @InvocableMethod(
    label='Escalate to Human Sales Rep'
    description='Escalates negotiation to a human sales rep when customer request is outside AI authority (deal > 100k, custom terms, discount > 15%, custom SLA). Saves context to the quote record so admin sees the full picture.'
  )
  public static List<Output> escalate(List<Input> inputs) {
    List<Output> results = new List<Output>();

    for (Input inp : inputs) {
      Output out = new Output();

      if (String.isBlank(inp.quoteId)) {
        out.success = false;
        out.responseMessage = 'No quote reference provided.';
        results.add(out);
        continue;
      }

      Id qId;
      try {
        qId = Id.valueOf(inp.quoteId);
      } catch (Exception ex) {
        out.success = false;
        out.responseMessage = 'Invalid quote reference.';
        results.add(out);
        continue;
      }

      try {
        TALEXO_Quote__c q = [
          SELECT
            Id,
            Name,
            GrandTotal__c,
            NegotiationRound__c,
            CustomerCounterPrice__c,
            Opportunity__r.Account.Name,
            Opportunity__r.AccountId
          FROM TALEXO_Quote__c
          WHERE Id = :qId
          LIMIT 1
        ];

        String accName = q.Opportunity__r?.Account?.Name != null
          ? q.Opportunity__r.Account.Name
          : 'Unknown account';
        String request = String.isNotBlank(inp.customerRequest)
          ? inp.customerRequest
          : 'Customer requested human assistance';
        Integer round = q.NegotiationRound__c != null
          ? Integer.valueOf(q.NegotiationRound__c)
          : 0;

        // Save escalation context on the quote record so admin sees it immediately
        String escalationNote =
          'ESCALATION [' + DateTime.now().format('dd/MM/yyyy HH:mm') + ']: ' +
          request;
        update new TALEXO_Quote__c(
          Id = qId,
          CounterMessage__c = escalationNote
        );

        // Push detailed bell notification to admin
        String bellTitle = 'Escalation Required: ' + accName;
        String bellBody =
          accName + ' needs a human rep — ' + request +
          ' | Quote: ' + q.Name +
          ' | Total: ' + (q.GrandTotal__c != null
            ? q.GrandTotal__c.setScale(2).toPlainString() + ' €'
            : '—') +
          ' | Negotiation round: ' + round;

        NotificationController.pushAdminBell(bellTitle, bellBody, qId);

        out.success = true;
        out.responseMessage =
          'I\'ve connected you with our sales team. A representative will review your request and respond within 2 business hours. ' +
          'You will receive a notification in your portal when they reply. ' +
          'Your current quote remains valid in the meantime.';

      } catch (Exception ex) {
        out.success = false;
        out.responseMessage =
          'Unable to reach our sales team right now. Please try again or email us directly at support@nexus-commerce.com.';
        System.debug(
          LoggingLevel.ERROR,
          'NexusQuoteEscalateAction error: ' + ex.getMessage()
        );
      }

      results.add(out);
    }

    return results;
  }
}
