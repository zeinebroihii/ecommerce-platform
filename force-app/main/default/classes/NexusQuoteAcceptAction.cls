public without sharing class NexusQuoteAcceptAction {

  public class Input {
    @InvocableVariable(label='Quote Id' required=true)
    public String quoteId;
  }

  public class Output {
    @InvocableVariable(label='Success')
    public Boolean success;
    @InvocableVariable(label='Response Message')
    public String responseMessage;
  }

  @InvocableMethod(
    label='Accept Quote'
    description='Customer accepts the presented quote. Triggers contract preparation and DocuSign. Use only when customer explicitly confirms acceptance.'
  )
  public static List<Output> acceptQuote(List<Input> inputs) {
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
        QuoteController.processQuoteDecision(qId, 'Accepted', '');
        out.success = true;
        out.responseMessage =
          'Your acceptance has been recorded. Our team is preparing your contract — ' +
          'you will receive it by email and it will appear in your portal for e-signature. ' +
          'Thank you for choosing Nexus!';
      } catch (AuraHandledException ex) {
        out.success = false;
        out.responseMessage = ex.getMessage();
      } catch (Exception ex) {
        out.success = false;
        out.responseMessage = 'Unable to record your acceptance. Please try again or contact our team.';
      }

      results.add(out);
    }

    return results;
  }
}
