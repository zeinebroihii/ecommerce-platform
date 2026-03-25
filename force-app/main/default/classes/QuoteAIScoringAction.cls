/**
 * QuoteAIScoringAction
 *
 * @InvocableMethod — called by the NexusQuoteAIScoring Flow on every Quote create/update.
 * Also called directly by QuoteGenerationService after quote creation.
 * Mirrors the LeadScoringWriter pattern already in this org.
 *
 * Scoring model (0-99 scale, mirrors 88% example from spec):
 *   Base 50  +  discount applied  +  Net 30 terms  +  Opp probability  +
 *   expiry buffer  +  account revenue signal  +  industry signal  -  large deal penalty
 *
 * For Agentforce / Einstein Prompt Builder integration: deploy the
 * "Nexus Quote Analyst" agent in Agentforce Studio and point its
 * InvocableMethod input to quoteId. The agent writes back via
 * LeadAIAnalysisUpdater-style action.
 */
public class QuoteAIScoringAction {
  public class ScoreInput {
    @InvocableVariable(required=true label='Quote ID')
    public Id quoteId;
  }

  @InvocableMethod(
    label='Score Quote with Nexus AI'
    description='Calculates acceptance probability (0-99) and writes to AcceptanceProbability__c + AIReason__c.'
    callout=false
  )
  public static void scoreQuote(List<ScoreInput> inputs) {
    Set<Id> quoteIds = new Set<Id>();
    for (ScoreInput inp : inputs) {
      if (inp.quoteId != null)
        quoteIds.add(inp.quoteId);
    }
    if (quoteIds.isEmpty())
      return;

    List<TALEXO_Quote__c> quotes = [
      SELECT
        Id,
        GrandTotal__c,
        BulkDiscount__c,
        PaymentTerms__c,
        ExpirationDate__c,
        VersionNumber__c,
        NegotiationStatus__c,
        Opportunity__r.Account.Industry,
        Opportunity__r.Account.AnnualRevenue,
        Opportunity__r.CloseDate,
        Opportunity__r.StageName,
        Opportunity__r.Probability,
        Opportunity__r.Amount
      FROM TALEXO_Quote__c
      WHERE Id IN :quoteIds
    ];

    List<TALEXO_Quote__c> toUpdate = new List<TALEXO_Quote__c>();
    for (TALEXO_Quote__c q : quotes) {
      Integer score = calculateScore(q);
      String reason = buildReason(q, score);
      toUpdate.add(
        new TALEXO_Quote__c(
          Id = q.Id,
          AcceptanceProbability__c = score,
          AIReason__c = reason
        )
      );
    }
    update toUpdate;
  }

  // ── Scoring engine ────────────────────────────────────────────────────────

  private static Integer calculateScore(TALEXO_Quote__c q) {
    Integer score = 50; // baseline

    // +15 : 10% (or greater) bulk discount applied — strong buying incentive
    if (q.BulkDiscount__c != null && q.BulkDiscount__c >= 10)
      score += 15;

    // +8  : Net 30 payment terms — most attractive standard term
    if (q.PaymentTerms__c == 'Net 30')
      score += 8;

    // +up to 10 : carry 10% of Opportunity probability into score
    if (q.Opportunity__r != null && q.Opportunity__r.Probability != null) {
      score += (q.Opportunity__r.Probability * 0.10).intValue();
    }

    // +8 / -10 : quote validity window
    if (q.ExpirationDate__c != null) {
      Integer daysLeft = Date.today().daysBetween(q.ExpirationDate__c);
      if (daysLeft > 15)
        score += 8;
      if (daysLeft < 5)
        score -= 10;
    }

    // +8 : high-revenue account — proven buying power
    if (
      q.Opportunity__r?.Account?.AnnualRevenue != null &&
      q.Opportunity__r.Account.AnnualRevenue > 5000000
    ) {
      score += 8;
    }

    // +5 : Tech / Finance — fast decision cycles
    String ind = q.Opportunity__r?.Account?.Industry;
    if (ind == 'Technology' || ind == 'Finance')
      score += 5;

    // -5 : Very large deal (> €50k) — needs more internal approvals
    if (q.GrandTotal__c != null && q.GrandTotal__c > 50000)
      score -= 5;

    // +3 : Quote is already in negotiation (customer engaged)
    if (
      q.NegotiationStatus__c == 'In Negotiation' ||
      q.NegotiationStatus__c == 'Counter Received'
    ) {
      score += 3;
    }

    return Math.max(0, Math.min(score, 99));
  }

  private static String buildReason(TALEXO_Quote__c q, Integer score) {
    List<String> factors = new List<String>();

    if (q.BulkDiscount__c != null && q.BulkDiscount__c >= 10) {
      factors.add(
        q.BulkDiscount__c.intValue() +
        '% bulk discount applied (strong incentive)'
      );
    }
    if (q.PaymentTerms__c == 'Net 30') {
      factors.add('Net 30 payment terms improve cashflow appeal');
    }
    if (
      q.ExpirationDate__c != null &&
      Date.today().daysBetween(q.ExpirationDate__c) > 15
    ) {
      factors.add('Ample validity window reduces customer pressure');
    }
    if (
      q.Opportunity__r?.Account?.AnnualRevenue != null &&
      q.Opportunity__r.Account.AnnualRevenue > 5000000
    ) {
      factors.add('High-revenue account — strong B2B buying power');
    }
    if (
      q.Opportunity__r?.Probability != null &&
      q.Opportunity__r.Probability > 60
    ) {
      factors.add('Opportunity win probability > 60%');
    }
    if (
      q.NegotiationStatus__c == 'In Negotiation' ||
      q.NegotiationStatus__c == 'Counter Received'
    ) {
      factors.add('Customer actively engaged in negotiation');
    }

    String verdict = score >= 80
      ? 'High probability of acceptance — recommend proceeding.'
      : score >= 60
          ? 'Moderate probability — monitor engagement and follow up.'
          : 'Lower probability — consider adding incentives or adjusting scope.';

    String reasoning = verdict;
    if (!factors.isEmpty()) {
      reasoning += ' Key factors: ' + String.join(factors, '; ') + '.';
    }
    return reasoning;
  }
}
