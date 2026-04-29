public without sharing class WriteQuoteAIScore {
  public class ScoreInput {
    @InvocableVariable(label='Quote ID' required=true)
    public String quoteId;

    @InvocableVariable(label='Acceptance Probability (0-99)' required=true)
    public Integer acceptanceProbability;

    @InvocableVariable(label='AI Reasoning (French)' required=false)
    public String aiReason;
  }

  public class ScoreResult {
    @InvocableVariable(label='Result Message')
    public String message;
  }

  @InvocableMethod(
    label='Write Quote AI Score'
    description='Called by Agentforce to persist the AI-calculated acceptance probability and reasoning to the TALEXO_Quote__c record.'
  )
  public static List<ScoreResult> writeScore(List<ScoreInput> inputs) {
    ScoreResult result = new ScoreResult();
    if (inputs == null || inputs.isEmpty() || String.isBlank(inputs[0].quoteId)) {
      result.message = 'Error: No quote ID provided.';
      return new List<ScoreResult>{ result };
    }

    ScoreInput inp = inputs[0];
    Id qid;
    try {
      qid = Id.valueOf(inp.quoteId);
    } catch (Exception e) {
      result.message = 'Error: Invalid quote ID — ' + inp.quoteId;
      return new List<ScoreResult>{ result };
    }

    Integer prob = inp.acceptanceProbability != null
      ? Math.max(0, Math.min(inp.acceptanceProbability, 99))
      : 0;

    try {
      update new TALEXO_Quote__c(
        Id = qid,
        AcceptanceProbability__c = prob,
        AIReason__c = inp.aiReason
      );
      result.message = 'Score saved: ' + prob + '% — ' +
        (String.isNotBlank(inp.aiReason) ? inp.aiReason : 'No reasoning provided.');
    } catch (Exception e) {
      result.message = 'Error saving score: ' + e.getMessage();
    }

    return new List<ScoreResult>{ result };
  }
}
