/**
 * ContractAmendmentService
 *
 * Handles amendments to active (Signed) quotes.
 * Given an original quote + contract dates + line item changes,
 * this service:
 *   1. Calculates the proration factor = remaining days / total contract days
 *   2. Creates a new amendment TALEXO_Quote__c linked to the original
 *   3. Inserts NexusQuoteLineItem__c records with prorated pricing
 *   4. Triggers AI scoring on the new amendment quote
 *
 * Proration example:
 *   Contract: 2026-01-01 → 2026-12-31  (365 days total)
 *   Amendment on: 2026-07-01            (184 days remaining)
 *   Proration factor: 184 / 365 = 0.504
 *   Product at $1,200/yr → prorated charge = $1,200 * 0.504 = $604.80
 */
public without sharing class ContractAmendmentService {
  // ── Request / Response wrappers ───────────────────────────────────────────

  public class AmendLineItemRequest {
    @AuraEnabled
    public Id product2Id;
    @AuraEnabled
    public String productName;
    @AuraEnabled
    public String productFamily;
    @AuraEnabled
    public String productType; // 'One-time' | 'Recurring'
    @AuraEnabled
    public String billingFrequency; // 'Monthly' | 'Annual' | 'N/A'
    @AuraEnabled
    public Integer quantity;
    @AuraEnabled
    public Decimal listPrice;
  }

  public class AmendRequest {
    @AuraEnabled
    public Id originalQuoteId;
    @AuraEnabled
    public String contractStartDate; // ISO yyyy-MM-dd
    @AuraEnabled
    public String contractEndDate; // ISO yyyy-MM-dd
    @AuraEnabled
    public List<AmendLineItemRequest> lineItems;
    @AuraEnabled
    public Decimal bulkDiscount; // optional override
  }

  public class AmendResult {
    @AuraEnabled
    public Id amendmentQuoteId;
    @AuraEnabled
    public String amendmentQuoteName;
    @AuraEnabled
    public Decimal proratedGrandTotal;
    @AuraEnabled
    public Decimal fullValueGrandTotal;
    @AuraEnabled
    public Decimal prorationFactor;
    @AuraEnabled
    public Integer remainingDays;
    @AuraEnabled
    public Integer totalContractDays;
    @AuraEnabled
    public Integer acceptanceProbability;
    @AuraEnabled
    public String aiReason;
  }

  // ── Main entry point ─────────────────────────────────────────────────────

  @AuraEnabled
  public static AmendResult amendQuote(String requestJSON) {
    AmendRequest req = (AmendRequest) JSON.deserialize(
      requestJSON,
      AmendRequest.class
    );
    return amend(req);
  }

  public static AmendResult amend(AmendRequest req) {
    // 1. Validate
    if (req.originalQuoteId == null) {
      throw new AuraHandledException('originalQuoteId is required.');
    }
    if (String.isBlank(req.contractEndDate)) {
      throw new AuraHandledException('contractEndDate is required.');
    }
    if (req.lineItems == null || req.lineItems.isEmpty()) {
      throw new AuraHandledException('At least one line item is required.');
    }

    // 2. Load original quote
    TALEXO_Quote__c original = [
      SELECT
        Id,
        Name,
        Opportunity__c,
        BulkDiscount__c,
        Contract_Start_Date__c,
        Contract_End_Date__c,
        PaymentTerms__c,
        Status__c
      FROM TALEXO_Quote__c
      WHERE Id = :req.originalQuoteId
      LIMIT 1
    ];

    // 3. Resolve contract dates
    Date startDate = String.isNotBlank(req.contractStartDate)
      ? Date.valueOf(req.contractStartDate)
      : (original.Contract_Start_Date__c != null
          ? original.Contract_Start_Date__c
          : Date.today().addYears(-1));

    Date endDate = Date.valueOf(req.contractEndDate);

    if (endDate <= Date.today()) {
      throw new AuraHandledException(
        'Contract end date must be in the future.'
      );
    }

    // 4. Calculate proration
    Integer totalDays = startDate.daysBetween(endDate);
    Integer remainingDays = Date.today().daysBetween(endDate);
    if (totalDays <= 0)
      totalDays = 365;
    Decimal prorationFactor = (Decimal) remainingDays / (Decimal) totalDays;
    prorationFactor = prorationFactor.setScale(4, RoundingMode.HALF_UP);

    // 5. Compute pricing with proration applied
    Decimal discountPct = req.bulkDiscount != null
      ? req.bulkDiscount
      : (original.BulkDiscount__c != null ? original.BulkDiscount__c : 10);

    Decimal fullTotal = 0;
    Decimal proratedTotal = 0;

    for (AmendLineItemRequest li : req.lineItems) {
      Decimal lineGross =
        (li.listPrice != null ? li.listPrice : 0) *
        (li.quantity != null ? li.quantity : 1);
      Decimal lineNet = lineGross * (1 - discountPct / 100);
      fullTotal += lineNet;
      // Only Recurring lines are prorated — one-time charges are full price
      if (li.productType == 'Recurring') {
        proratedTotal += lineNet * prorationFactor;
      } else {
        proratedTotal += lineNet;
      }
    }

    // 6. Demote original quote's IsPrimary flag
    update new TALEXO_Quote__c(Id = original.Id, IsPrimary__c = false);

    // 7. Insert amendment quote
    TALEXO_Quote__c amendment = new TALEXO_Quote__c(
      Opportunity__c = original.Opportunity__c,
      Original_Quote__c = original.Id,
      Is_Amendment__c = true,
      IsPrimary__c = true,
      Status__c = 'Draft',
      NegotiationStatus__c = 'Draft',
      VersionNumber__c = 1,
      BulkDiscount__c = discountPct,
      PaymentTerms__c = original.PaymentTerms__c != null
        ? original.PaymentTerms__c
        : 'Net 30',
      GrandTotal__c = proratedTotal,
      Contract_Start_Date__c = startDate,
      Contract_End_Date__c = endDate,
      ExpirationDate__c = Date.today().addDays(30),
      Description__c = 'Amendment of ' +
        original.Name +
        ' | Proration factor: ' +
        (prorationFactor * 100).setScale(1) +
        '%' +
        ' (' +
        remainingDays +
        ' of ' +
        totalDays +
        ' days remaining)'
    );
    insert amendment;

    // 8. Insert prorated line items
    List<NexusQuoteLineItem__c> lineItems = new List<NexusQuoteLineItem__c>();
    for (AmendLineItemRequest li : req.lineItems) {
      Decimal lp = li.listPrice != null ? li.listPrice : 0;
      Integer qty = li.quantity != null ? li.quantity : 1;
      Decimal unitNet = lp * (1 - discountPct / 100);
      Decimal netTotal = unitNet * qty;
      Boolean isRecurring = li.productType == 'Recurring';
      Decimal proratedNet = isRecurring ? netTotal * prorationFactor : netTotal;
      String pType = String.isNotBlank(li.productType)
        ? li.productType
        : 'One-time';
      String bFreq = String.isNotBlank(li.billingFrequency)
        ? li.billingFrequency
        : 'N/A';

      lineItems.add(
        new NexusQuoteLineItem__c(
          Quote__c = amendment.Id,
          Product__c = li.product2Id,
          ProductName__c = li.productName,
          ProductFamily__c = li.productFamily,
          Quantity__c = qty,
          ListPrice__c = lp,
          UnitPrice__c = unitNet,
          Discount__c = discountPct,
          NetTotal__c = netTotal,
          Product_Type__c = pType,
          Billing_Frequency__c = bFreq,
          Is_Prorated__c = isRecurring,
          Prorated_Net_Total__c = proratedNet
        )
      );
    }
    insert lineItems;

    // 9. Sync grand total
    update new TALEXO_Quote__c(
      Id = amendment.Id,
      GrandTotal__c = proratedTotal
    );

    // 10. Trigger AI scoring
    QuoteAIScoringAction.ScoreInput inp = new QuoteAIScoringAction.ScoreInput();
    inp.quoteId = amendment.Id;
    QuoteAIScoringAction.scoreQuote(
      new List<QuoteAIScoringAction.ScoreInput>{ inp }
    );

    // 11. Re-read for AI result
    amendment = [
      SELECT Id, Name, GrandTotal__c, AcceptanceProbability__c, AIReason__c
      FROM TALEXO_Quote__c
      WHERE Id = :amendment.Id
      LIMIT 1
    ];

    AmendResult res = new AmendResult();
    res.amendmentQuoteId = amendment.Id;
    res.amendmentQuoteName = amendment.Name;
    res.proratedGrandTotal = proratedTotal;
    res.fullValueGrandTotal = fullTotal;
    res.prorationFactor = prorationFactor;
    res.remainingDays = remainingDays;
    res.totalContractDays = totalDays;
    res.acceptanceProbability = amendment.AcceptanceProbability__c != null
      ? Integer.valueOf(amendment.AcceptanceProbability__c)
      : 0;
    res.aiReason = amendment.AIReason__c;
    return res;
  }
}
