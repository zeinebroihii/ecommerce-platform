/**
 * RenewalService
 *
 * Generates a Renewal Opportunity + Quote from a signed TALEXO_Quote__c.
 *
 * Rules enforced:
 *   ✅ Only Recurring line items (Product_Type__c = 'Recurring') are copied
 *   ❌ One-time products (hardware, setup fees) are excluded
 *
 * Called by:
 *   - RenewalScheduler (daily, 60 days before Contract_End_Date)
 *   - Anonymous Apex / manual trigger for testing
 *
 * Renewal Opportunity:
 *   - Name        = 'Renewal — {original opp name}'
 *   - StageName   = 'Prospecting'
 *   - CloseDate   = Contract_End_Date + 30 days (gives sales room to close)
 *   - Is_Renewal__c = true
 *   - Original_Opportunity__c = original opp Id
 *
 * Renewal Quote:
 *   - Is_Renewal__c      = true
 *   - Renewal_Of_Quote__c = original quote Id
 *   - Pricing preserved from original (same list price + discount)
 */
public without sharing class RenewalService {
  public class RenewalResult {
    @AuraEnabled
    public Id renewalOpportunityId;
    @AuraEnabled
    public String renewalOpportunityName;
    @AuraEnabled
    public Id renewalQuoteId;
    @AuraEnabled
    public String renewalQuoteName;
    @AuraEnabled
    public Integer recurringLineCount;
    @AuraEnabled
    public Integer skippedOneTimeCount;
    @AuraEnabled
    public Decimal renewalMRR;
    @AuraEnabled
    public Decimal renewalAnnualValue;
    @AuraEnabled
    public Integer acceptanceProbability;
    @AuraEnabled
    public String aiReason;
  }

  // ── Main entry point ─────────────────────────────────────────────────────

  @AuraEnabled
  public static RenewalResult generateRenewal(Id originalQuoteId) {
    return generate(originalQuoteId);
  }

  // InvocableMethod so a Flow can also call this
  // Returns List<String> (quoteId of renewal) — InvocableMethod doesn't support custom return types
  @InvocableMethod(
    label='Generate Renewal Quote'
    description='Creates a renewal Opportunity and Quote from a signed quote, recurring products only.'
  )
  public static List<String> generateFromFlow(List<Id> quoteIds) {
    List<String> renewalQuoteIds = new List<String>();
    for (Id qId : quoteIds) {
      RenewalResult res = generate(qId);
      renewalQuoteIds.add(res.renewalQuoteId);
    }
    return renewalQuoteIds;
  }

  public static RenewalResult generate(Id originalQuoteId) {
    // 1. Load original quote + opportunity
    TALEXO_Quote__c original = [
      SELECT
        Id,
        Name,
        BulkDiscount__c,
        PaymentTerms__c,
        Contract_Start_Date__c,
        Contract_End_Date__c,
        Status__c,
        Is_Renewal__c,
        Opportunity__c,
        Opportunity__r.Name,
        Opportunity__r.AccountId,
        Opportunity__r.OwnerId,
        Opportunity__r.CloseDate
      FROM TALEXO_Quote__c
      WHERE Id = :originalQuoteId
      LIMIT 1
    ];

    // Guard: don't renew something that's already a renewal or not signed
    if (original.Is_Renewal__c) {
      throw new AuraHandledException(
        'Cannot renew a quote that is already a renewal.'
      );
    }

    // Guard: skip if renewal already exists
    List<TALEXO_Quote__c> existing = [
      SELECT Id
      FROM TALEXO_Quote__c
      WHERE Renewal_Of_Quote__c = :originalQuoteId
      LIMIT 1
    ];
    if (!existing.isEmpty()) {
      throw new AuraHandledException(
        'A renewal quote already exists for this contract.'
      );
    }

    // 2. Load original line items — filter recurring only
    List<NexusQuoteLineItem__c> allLines = [
      SELECT
        Id,
        Product__c,
        ProductName__c,
        ProductFamily__c,
        Product_Type__c,
        Billing_Frequency__c,
        Quantity__c,
        ListPrice__c,
        UnitPrice__c,
        Discount__c,
        NetTotal__c,
        MRR_Contribution__c
      FROM NexusQuoteLineItem__c
      WHERE Quote__c = :originalQuoteId
    ];

    List<NexusQuoteLineItem__c> recurringLines = new List<NexusQuoteLineItem__c>();
    Integer skippedCount = 0;
    for (NexusQuoteLineItem__c li : allLines) {
      if (li.Product_Type__c == 'Recurring') {
        recurringLines.add(li);
      } else {
        skippedCount++;
      }
    }

    if (recurringLines.isEmpty()) {
      throw new AuraHandledException(
        'No recurring products found on this quote — nothing to renew.'
      );
    }

    // 3. Resolve renewal dates
    Date contractEnd = original.Contract_End_Date__c != null
      ? original.Contract_End_Date__c
      : original.Opportunity__r.CloseDate;
    Date renewalClose = contractEnd != null
      ? contractEnd.addDays(30)
      : Date.today().addDays(395); // fallback: ~13 months from now

    // 4. Create Renewal Opportunity
    Opportunity renewalOpp = new Opportunity(
      Name = 'Renewal — ' + original.Opportunity__r.Name,
      AccountId = original.Opportunity__r.AccountId,
      OwnerId = original.Opportunity__r.OwnerId,
      StageName = 'Prospecting',
      CloseDate = renewalClose,
      Is_Renewal__c = true,
      Original_Opportunity__c = original.Opportunity__c
    );
    insert renewalOpp;

    // 5. Compute renewal totals
    Decimal discountPct = original.BulkDiscount__c != null
      ? original.BulkDiscount__c
      : 10;
    Decimal renewalTotal = 0;
    Decimal renewalMRR = 0;
    Decimal renewalAnnual = 0;
    for (NexusQuoteLineItem__c li : recurringLines) {
      renewalTotal += li.NetTotal__c != null ? li.NetTotal__c : 0;
      renewalMRR += li.MRR_Contribution__c != null ? li.MRR_Contribution__c : 0;
      renewalAnnual += li.Billing_Frequency__c == 'Annual'
        ? (li.NetTotal__c != null ? li.NetTotal__c : 0)
        : (li.NetTotal__c != null ? li.NetTotal__c * 12 : 0);
    }

    // 6. Insert Renewal Quote
    TALEXO_Quote__c renewalQuote = new TALEXO_Quote__c(
      Opportunity__c = renewalOpp.Id,
      Renewal_Of_Quote__c = original.Id,
      Is_Renewal__c = true,
      IsPrimary__c = true,
      Status__c = 'Draft',
      NegotiationStatus__c = 'Draft',
      VersionNumber__c = 1,
      BulkDiscount__c = discountPct,
      PaymentTerms__c = original.PaymentTerms__c != null
        ? original.PaymentTerms__c
        : 'Net 30',
      GrandTotal__c = renewalTotal,
      MRR__c = renewalMRR,
      RecurringTotal__c = renewalTotal,
      OneTimeTotal__c = 0,
      Contract_Start_Date__c = contractEnd != null
        ? contractEnd.addDays(1)
        : Date.today(),
      Contract_End_Date__c = contractEnd != null
        ? contractEnd.addYears(1)
        : Date.today().addYears(1),
      ExpirationDate__c = Date.today().addDays(60),
      Description__c = 'Auto-renewal of ' +
        original.Name +
        ' | ' +
        recurringLines.size() +
        ' recurring product(s)' +
        ' | ' +
        skippedCount +
        ' one-time product(s) excluded'
    );
    insert renewalQuote;

    // 7. Copy recurring line items to renewal quote
    List<NexusQuoteLineItem__c> newLines = new List<NexusQuoteLineItem__c>();
    for (NexusQuoteLineItem__c li : recurringLines) {
      newLines.add(
        new NexusQuoteLineItem__c(
          Quote__c = renewalQuote.Id,
          Product__c = li.Product__c,
          ProductName__c = li.ProductName__c,
          ProductFamily__c = li.ProductFamily__c,
          Product_Type__c = li.Product_Type__c,
          Billing_Frequency__c = li.Billing_Frequency__c,
          Quantity__c = li.Quantity__c,
          ListPrice__c = li.ListPrice__c,
          UnitPrice__c = li.UnitPrice__c,
          Discount__c = li.Discount__c,
          NetTotal__c = li.NetTotal__c,
          Is_Prorated__c = false
        )
      );
    }
    insert newLines;

    // 8. Sync opportunity amount
    update new Opportunity(Id = renewalOpp.Id, Amount = renewalTotal);

    // 9. Trigger AI scoring
    QuoteAIScoringAction.ScoreInput inp = new QuoteAIScoringAction.ScoreInput();
    inp.quoteId = renewalQuote.Id;
    QuoteAIScoringAction.scoreQuote(
      new List<QuoteAIScoringAction.ScoreInput>{ inp }
    );

    // 10. Re-read for AI result
    renewalQuote = [
      SELECT Id, Name, AcceptanceProbability__c, AIReason__c
      FROM TALEXO_Quote__c
      WHERE Id = :renewalQuote.Id
      LIMIT 1
    ];

    RenewalResult res = new RenewalResult();
    res.renewalOpportunityId = renewalOpp.Id;
    res.renewalOpportunityName = renewalOpp.Name;
    res.renewalQuoteId = renewalQuote.Id;
    res.renewalQuoteName = renewalQuote.Name;
    res.recurringLineCount = recurringLines.size();
    res.skippedOneTimeCount = skippedCount;
    res.renewalMRR = renewalMRR;
    res.renewalAnnualValue = renewalAnnual;
    res.acceptanceProbability = renewalQuote.AcceptanceProbability__c != null
      ? Integer.valueOf(renewalQuote.AcceptanceProbability__c)
      : 0;
    res.aiReason = renewalQuote.AIReason__c;
    return res;
  }
}
