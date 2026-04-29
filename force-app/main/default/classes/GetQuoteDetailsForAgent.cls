/**
 * GetQuoteDetailsForAgent
 *
 * @InvocableMethod — called BY the Agentforce "Nexus Quote Analyst" agent.
 * Fetches full quote context and returns it as a structured text summary
 * so the agent can reason about acceptance probability.
 */
public without sharing class GetQuoteDetailsForAgent {
  public class QuoteRequest {
    @InvocableVariable(label='Quote ID' required=true)
    public String quoteId;
  }

  public class QuoteDetails {
    @InvocableVariable(label='Quote Summary')
    public String summary;
  }

  @InvocableMethod(
    label='Get Quote Details for AI Scoring'
    description='Retrieves all relevant quote fields and returns a structured text summary for the Nexus Quote Analyst agent to score.'
  )
  public static List<QuoteDetails> getDetails(List<QuoteRequest> requests) {
    QuoteDetails result = new QuoteDetails();
    if (
      requests == null ||
      requests.isEmpty() ||
      String.isBlank(requests[0].quoteId)
    ) {
      result.summary = 'No quote ID provided.';
      return new List<QuoteDetails>{ result };
    }

    Id qid = Id.valueOf(requests[0].quoteId);

    List<TALEXO_Quote__c> quotes = [
      SELECT
        Id,
        Name,
        Status__c,
        NegotiationStatus__c,
        GrandTotal__c,
        BulkDiscount__c,
        PaymentTerms__c,
        ExpirationDate__c,
        VersionNumber__c,
        Opportunity__r.Name,
        Opportunity__r.StageName,
        Opportunity__r.Probability,
        Opportunity__r.Amount,
        Opportunity__r.CloseDate,
        Opportunity__r.Account.Name,
        Opportunity__r.Account.Industry,
        Opportunity__r.Account.AnnualRevenue,
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
      WHERE Id = :qid
      LIMIT 1
    ];

    if (quotes.isEmpty()) {
      result.summary = 'Quote not found for ID: ' + qid;
      return new List<QuoteDetails>{ result };
    }

    TALEXO_Quote__c q = quotes[0];
    Integer daysLeft = q.ExpirationDate__c != null
      ? Date.today().daysBetween(q.ExpirationDate__c)
      : null;

    // Sanitize bulk discount: valid B2B range is 0–50%.
    // Values > 100 are data-entry errors — exclude from scoring entirely.
    // Values 51–100 are also unrealistic; flag but keep.
    Decimal rawDiscount = q.BulkDiscount__c != null ? q.BulkDiscount__c : 0;
    String discountStr;
    if (rawDiscount > 100) {
      discountStr = 'INVALID DATA (raw value: ' + rawDiscount.intValue() +
        '%) — ignore this field entirely when scoring; do not penalise or reward.';
    } else if (rawDiscount > 50) {
      discountStr = rawDiscount.intValue() +
        '% — unusually high, verify before scoring; treat as a moderate incentive only.';
    } else {
      discountStr = rawDiscount.intValue() + '%';
    }

    List<String> lines = new List<String>();
    lines.add('=== Nexus Quote: ' + q.Name + ' ===');
    lines.add('Status: ' + q.Status__c);
    lines.add(
      'Negotiation Status: ' +
      (q.NegotiationStatus__c != null ? q.NegotiationStatus__c : 'Draft')
    );
    lines.add(
      'Grand Total: ' +
      (q.GrandTotal__c != null ? q.GrandTotal__c.setScale(2) + ' EUR' : 'N/A')
    );
    lines.add('Bulk Discount: ' + discountStr);
    lines.add(
      'Payment Terms: ' +
      (q.PaymentTerms__c != null ? q.PaymentTerms__c : 'N/A')
    );
    lines.add(
      'Expiration Date: ' +
      (q.ExpirationDate__c != null ? q.ExpirationDate__c.format() : 'N/A')
    );
    lines.add(
      'Days Until Expiry: ' +
      (daysLeft != null ? String.valueOf(daysLeft) : 'N/A')
    );
    lines.add(
      'Version: v' +
        (q.VersionNumber__c != null ? Integer.valueOf(q.VersionNumber__c) : 1) +
        '.0'
    );

    if (q.Opportunity__r != null) {
      lines.add('--- Opportunity ---');
      lines.add('Opportunity Name: ' + q.Opportunity__r.Name);
      lines.add('Stage: ' + q.Opportunity__r.StageName);
      lines.add(
        'Win Probability: ' +
        (q.Opportunity__r.Probability != null
          ? q.Opportunity__r.Probability.intValue() + '%'
          : 'N/A')
      );
      lines.add(
        'Opportunity Amount: ' +
        (q.Opportunity__r.Amount != null
          ? q.Opportunity__r.Amount.setScale(2) + ' EUR'
          : 'N/A')
      );
      lines.add(
        'Expected Close Date: ' +
        (q.Opportunity__r.CloseDate != null
          ? q.Opportunity__r.CloseDate.format()
          : 'N/A')
      );

      if (q.Opportunity__r.Account != null) {
        lines.add('--- Account ---');
        lines.add('Account Name: ' + q.Opportunity__r.Account.Name);
        lines.add(
          'Industry: ' +
          (q.Opportunity__r.Account.Industry != null
            ? q.Opportunity__r.Account.Industry
            : 'N/A')
        );
        // Annual Revenue below 10 000 EUR is almost certainly test/placeholder
        // data in a dev org — flag it so the agent does not penalise the deal.
        Decimal annRev = q.Opportunity__r.Account.AnnualRevenue;
        String annRevStr;
        if (annRev == null) {
          annRevStr = 'N/A';
        } else if (annRev < 10000) {
          annRevStr = annRev.setScale(0) + ' EUR — LIKELY TEST DATA; treat Annual Revenue as unknown/neutral, do not penalise.';
        } else {
          annRevStr = annRev.setScale(0) + ' EUR';
        }
        lines.add('Annual Revenue: ' + annRevStr);
      }
    }

    if (!q.NexusQuoteLineItems__r.isEmpty()) {
      lines.add('--- Line Items ---');
      for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
        lines.add(
          '• ' +
            li.ProductName__c +
            ' (Qty: ' +
            (li.Quantity__c != null ? Integer.valueOf(li.Quantity__c) : 1) +
            ')' +
            ' — Net: ' +
            (li.NetTotal__c != null
              ? li.NetTotal__c.setScale(2) + ' EUR'
              : 'N/A')
        );
      }
    }

    lines.add('=== END QUOTE ===');
    result.summary = String.join(lines, '\n');
    return new List<QuoteDetails>{ result };
  }
}
