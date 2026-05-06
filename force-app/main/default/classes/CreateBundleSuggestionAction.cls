public without sharing class CreateBundleSuggestionAction {
  public class BundleRequest {
    @InvocableVariable(
      label='Overstocked Product ID'
      description='Salesforce ID of the boosted/overstocked product (from the catalog summary). Starts with 01t.'
      required=true
    )
    public String overstockedProductId;

    @InvocableVariable(
      label='Paired Product ID'
      description='Salesforce ID of the complementary product to bundle with.'
      required=true
    )
    public String pairedProductId;

    @InvocableVariable(
      label='Suggested Discount Percent'
      description='Discount percentage to apply (e.g. 10, 15, 20). Default is 10.'
      required=false
    )
    public Decimal suggestedDiscount;

    @InvocableVariable(
      label='AI Reasoning'
      description='Your explanation of why these two products make a valuable bundle for customers.'
      required=false
    )
    public String aiReason;
  }

  public class BundleResult {
    @InvocableVariable(label='Result')
    public String result;

    @InvocableVariable(label='Suggestion ID')
    public String suggestionId;
  }

  @InvocableMethod(
    label='Create Bundle Suggestion'
    description='Records an AI-recommended product bundle as a BundleSuggestion pending admin review. The admin can promote it to an active Combo Package visible in the customer portal. Avoids duplicate suggestions for the same pair.'
  )
  public static List<BundleResult> createSuggestion(
    List<BundleRequest> requests
  ) {
    List<BundleResult> results = new List<BundleResult>();

    for (BundleRequest req : requests) {
      BundleResult res = new BundleResult();
      try {
        if (
          String.isBlank(req.overstockedProductId) ||
          String.isBlank(req.pairedProductId)
        ) {
          res.result = 'Error: Both product IDs are required.';
          results.add(res);
          continue;
        }

        List<BundleSuggestion__c> existing = [
          SELECT Id
          FROM BundleSuggestion__c
          WHERE
            OverstockedProduct__c = :req.overstockedProductId
            AND PairedProduct__c = :req.pairedProductId
            AND Status__c IN ('Pending', 'Approved', 'Live')
          LIMIT 1
        ];

        if (!existing.isEmpty()) {
          res.result =
            'A suggestion for this product pair already exists (ID: ' +
            existing[0].Id +
            ').';
          res.suggestionId = existing[0].Id;
          results.add(res);
          continue;
        }

        BundleSuggestion__c suggestion = new BundleSuggestion__c(
          OverstockedProduct__c = req.overstockedProductId,
          PairedProduct__c = req.pairedProductId,
          SuggestedDiscount__c = req.suggestedDiscount != null
            ? req.suggestedDiscount
            : 10,
          CoOccurrenceScore__c = 80,
          Status__c = 'Pending',
          Source__c = 'AI-Agent',
          AIReason__c = req.aiReason
        );
        insert suggestion;

        res.result =
          'Bundle suggestion created (ID: ' +
          suggestion.Id +
          '). Pending admin review in Combo Package Manager.';
        res.suggestionId = suggestion.Id;
      } catch (Exception e) {
        res.result = 'Error: ' + e.getMessage();
      }
      results.add(res);
    }

    return results;
  }
}
