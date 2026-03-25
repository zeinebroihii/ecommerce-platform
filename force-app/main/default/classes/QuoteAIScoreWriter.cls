/**
 * QuoteAIScoreWriter
 *
 * @InvocableMethod — called BY the Agentforce "Nexus Quote Analyst" agent
 * after it has analysed the quote and determined an acceptance probability.
 *
 * Mirrors the LeadAIAnalysisUpdater pattern used for Lead AI scoring.
 * The agent calls GetQuoteDetailsForAgent first, reasons about the B2B factors,
 * then calls this action to persist the result.
 */
public without sharing class QuoteAIScoreWriter {
  public class ScoreRequest {
    @InvocableVariable(label='Quote ID' required=true)
    public String quoteId;

    @InvocableVariable(label='Acceptance Probability (0-99)' required=true)
    public Integer acceptanceProbability;

    @InvocableVariable(label='AI Reasoning (French)')
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
  public static List<ScoreResult> writeScore(List<ScoreRequest> requests) {
    ScoreResult res = new ScoreResult();
    if (
      requests == null ||
      requests.isEmpty() ||
      String.isBlank(requests[0].quoteId)
    ) {
      res.message = 'No request provided.';
      return new List<ScoreResult>{ res };
    }

    ScoreRequest req = requests[0];
    Integer prob = req.acceptanceProbability != null
      ? Math.max(0, Math.min(req.acceptanceProbability, 99))
      : null;

    // Sanitize AI reason — strip third-party product recommendations
    String cleanReason = req.aiReason;
    if (String.isNotBlank(cleanReason)) {
      // Remove any sentence mentioning third-party tools (S-Docs, Conga, etc.)
      cleanReason = cleanReason.replaceAll(
          '(?i)[^.!?]*(?:s-docs|sdocs|conga|docusign|pandadoc|adobe sign|docgen)[^.!?]*[.!?]?',
          ''
        )
        .trim();
      if (String.isBlank(cleanReason))
        cleanReason = req.aiReason; // fallback to original if over-filtered
    }

    TALEXO_Quote__c q = new TALEXO_Quote__c(Id = Id.valueOf(req.quoteId));
    if (prob != null)
      q.AcceptanceProbability__c = prob;
    if (String.isNotBlank(cleanReason))
      q.AIReason__c = cleanReason;
    update q;

    res.message =
      'Score IA enregistré : ' +
      (prob != null ? prob + '%' : 'N/A') +
      '.';
    return new List<ScoreResult>{ res };
  }
}
