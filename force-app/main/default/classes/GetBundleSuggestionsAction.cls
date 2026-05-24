public without sharing class GetBundleSuggestionsAction {
  public class Input {
    @InvocableVariable(
      description='Filter by status: Pending, Approved, or All. Default is Pending.'
    )
    public String statusFilter;
  }

  public class Output {
    @InvocableVariable(
      description='Formatted summary of pending bundle suggestions ready for admin review, including bundle name, discount, score, and AI reasoning for each.'
    )
    public String suggestionsSummary;
    @InvocableVariable(description='Total number of suggestions found.')
    public Integer totalCount;
  }

  @InvocableMethod(
    label='Get Pending Bundle Suggestions'
    description='Returns all pending or approved bundle suggestions waiting for admin review in the Combo Package Manager. Use this when the admin asks to review, list, or check existing bundle suggestions.'
  )
  public static List<Output> getSuggestions(List<Input> inputs) {
    String statusFilter = (inputs != null &&
      !inputs.isEmpty() &&
      inputs[0].statusFilter != null)
      ? inputs[0].statusFilter
      : 'Pending';

    List<String> statuses = statusFilter == 'All'
      ? new List<String>{ 'Pending', 'Approved' }
      : new List<String>{ statusFilter };

    List<BundleSuggestion__c> recs = [
      SELECT
        Id,
        Status__c,
        SuggestedDiscount__c,
        CoOccurrenceScore__c,
        Source__c,
        AIReason__c,
        OverstockedProduct__r.Name,
        OverstockedProduct__r.Family,
        PairedProduct__c,
        PairedProduct__r.Name,
        PairedProduct__r.Family
      FROM BundleSuggestion__c
      WHERE Status__c IN :statuses
      ORDER BY CoOccurrenceScore__c DESC
      LIMIT 20
    ];

    Output out = new Output();
    out.totalCount = recs.size();

    if (recs.isEmpty()) {
      out.suggestionsSummary =
        'No ' +
        statusFilter.toLowerCase() +
        ' bundle suggestions found.';
      return new List<Output>{ out };
    }

    List<String> lines = new List<String>();
    lines.add('PENDING BUNDLE SUGGESTIONS (' + recs.size() + ' total)');
    lines.add('');

    Integer i = 1;
    for (BundleSuggestion__c s : recs) {
      String p1 = s.OverstockedProduct__r != null
        ? s.OverstockedProduct__r.Name
        : 'Unknown';
      String p2 = s.PairedProduct__r != null
        ? s.PairedProduct__r.Name
        : 'Unknown';
      String discount = s.SuggestedDiscount__c != null
        ? s.SuggestedDiscount__c.setScale(0).toPlainString() + '%'
        : '10%';
      String score = s.CoOccurrenceScore__c != null
        ? s.CoOccurrenceScore__c.setScale(1).toPlainString()
        : 'N/A';
      String source = s.Source__c != null ? s.Source__c : 'Auto';

      lines.add(i + '. ' + p1 + ' + ' + p2);
      lines.add(
        '   Discount: ' +
          discount +
          ' | Score: ' +
          score +
          ' | Source: ' +
          source +
          ' | Status: ' +
          s.Status__c
      );
      if (String.isNotBlank(s.AIReason__c)) {
        lines.add('   Reason: ' + s.AIReason__c);
      }
      lines.add('');
      i++;
    }

    lines.add(
      'The admin can promote or dismiss these in the Combo Package Manager.'
    );
    out.suggestionsSummary = String.join(lines, '\n');
    return new List<Output>{ out };
  }
}
