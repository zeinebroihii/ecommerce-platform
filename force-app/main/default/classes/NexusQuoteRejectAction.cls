public without sharing class NexusQuoteRejectAction {

  public class Input {
    @InvocableVariable(label='Quote Id' required=true)
    public String quoteId;
    @InvocableVariable(label='Reason')
    public String reason;
  }

  public class Output {
    @InvocableVariable(label='Success')
    public Boolean success;
    @InvocableVariable(label='Response Message')
    public String responseMessage;
  }

  @InvocableMethod(
    label='Reject Quote'
    description='Customer rejects the quote. Records the rejection reason. Use only when customer explicitly confirms they do not want to proceed.'
  )
  public static List<Output> rejectQuote(List<Input> inputs) {
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
        QuoteController.processQuoteDecision(
          qId,
          'Rejected',
          String.isNotBlank(inp.reason) ? inp.reason : ''
        );
        out.success = true;
        out.responseMessage =
          'Your decision has been recorded. We\'re sorry this offer did not meet your needs. ' +
          'Our sales team will reach out to understand how we can better serve you. ' +
          'You can always request a new quote from your portal.';
      } catch (AuraHandledException ex) {
        out.success = false;
        out.responseMessage = ex.getMessage();
      } catch (Exception ex) {
        out.success = false;
        out.responseMessage = 'Unable to record your rejection. Please try again or contact our team.';
      }

      results.add(out);
    }

    return results;
  }
}
