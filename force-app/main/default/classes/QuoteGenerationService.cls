/**
 * QuoteGenerationService
 *
 * Core service for auto-generating B2B quotes from an Opportunity.
 * Applies a 10% bulk discount, sets Net 30 payment terms, creates
 * NexusQuoteLineItem__c records, triggers AI scoring, and enforces
 * the "one Primary Quote per Opportunity" rule.
 *
 * CPQ Note: This service mirrors Salesforce CPQ's quote generation
 * flow (Product Selection → Discount Rules → Quote Line Groups).
 * When CPQ (SBQQ) is installed, replace the SOQL + DML blocks with
 * calls to SBQQ.QuoteAPI.calculate() and SBQQ.QuoteDocumentAPI.
 */
public without sharing class QuoteGenerationService {
  // ── Request / Response wrappers ───────────────────────────────────────────

  public class LineItemRequest {
    @AuraEnabled
    public Id product2Id;
    @AuraEnabled
    public String productName;
    @AuraEnabled
    public String productFamily;
    @AuraEnabled
    public Integer quantity;
    @AuraEnabled
    public Decimal listPrice;
    @AuraEnabled
    public String productType; // 'One-time' | 'Recurring'
    @AuraEnabled
    public String billingFrequency; // 'Monthly' | 'Annual' | 'N/A'
  }

  public class GenerateRequest {
    @AuraEnabled
    public Id opportunityId;
    @AuraEnabled
    public List<LineItemRequest> lineItems;
    @AuraEnabled
    public Decimal bulkDiscount; // default 10
    @AuraEnabled
    public String paymentTerms; // default 'Net 30'
    @AuraEnabled
    public String expirationDate; // ISO date string yyyy-MM-dd
  }

  public class GenerateResult {
    @AuraEnabled
    public Id quoteId;
    @AuraEnabled
    public String quoteName;
    @AuraEnabled
    public Decimal subtotal;
    @AuraEnabled
    public Decimal discountAmount;
    @AuraEnabled
    public Decimal grandTotal;
    @AuraEnabled
    public Integer acceptanceProbability;
    @AuraEnabled
    public String aiReason;
    @AuraEnabled
    public String paymentTerms;
    @AuraEnabled
    public Decimal bulkDiscount;
    @AuraEnabled
    public Decimal mrr;
    @AuraEnabled
    public Decimal oneTimeTotal;
    @AuraEnabled
    public Decimal recurringTotal;
  }

  // ── Main entry point ──────────────────────────────────────────────────────

  @AuraEnabled
  public static GenerateResult generateQuote(String requestJSON) {
    GenerateRequest req = (GenerateRequest) JSON.deserialize(
      requestJSON,
      GenerateRequest.class
    );
    return generate(req);
  }

  public static GenerateResult generate(GenerateRequest req) {
    // 1. Validate opportunity
    if (req.opportunityId == null) {
      throw new AuraHandledException('opportunityId is required.');
    }
    if (req.lineItems == null || req.lineItems.isEmpty()) {
      throw new AuraHandledException('At least one line item is required.');
    }

    Opportunity opp = [
      SELECT
        Id,
        Name,
        AccountId,
        Account.Name,
        Account.Industry,
        Account.AnnualRevenue,
        OwnerId,
        CloseDate,
        Amount,
        StageName,
        Probability
      FROM Opportunity
      WHERE Id = :req.opportunityId
      LIMIT 1
    ];

    // 2. Enforce one Primary Quote per Opportunity
    List<TALEXO_Quote__c> existingPrimary = [
      SELECT Id
      FROM TALEXO_Quote__c
      WHERE Opportunity__c = :req.opportunityId AND IsPrimary__c = TRUE
    ];
    if (!existingPrimary.isEmpty()) {
      for (TALEXO_Quote__c old : existingPrimary) {
        old.IsPrimary__c = false;
      }
      update existingPrimary;
    }

    // 3. Compute pricing (split by charge type)
    Decimal discountPct = req.bulkDiscount != null ? req.bulkDiscount : 10;
    Decimal subtotal = 0;
    Decimal oneTimeSubtotal = 0;
    Decimal recurringSubtotal = 0;
    for (LineItemRequest li : req.lineItems) {
      Decimal lineTotal =
        (li.listPrice != null ? li.listPrice : 0) *
        (li.quantity != null ? li.quantity : 1);
      subtotal += lineTotal;
      if (li.productType == 'Recurring') {
        recurringSubtotal += lineTotal;
      } else {
        oneTimeSubtotal += lineTotal;
      }
    }
    Decimal discountAmt = subtotal * (discountPct / 100);
    Decimal grandTotal = subtotal - discountAmt;
    // Net totals after discount (proportional split)
    Decimal oneTimeTotal = oneTimeSubtotal * (1 - discountPct / 100);
    Decimal recurringTotal = recurringSubtotal * (1 - discountPct / 100);
    // MRR: Recurring-Monthly = net total; Recurring-Annual = net total / 12
    Decimal mrr = 0;
    for (LineItemRequest li : req.lineItems) {
      if (li.productType == 'Recurring') {
        Decimal lineNet =
          (li.listPrice != null ? li.listPrice : 0) *
          (li.quantity != null ? li.quantity : 1) *
          (1 - discountPct / 100);
        mrr += (li.billingFrequency == 'Annual') ? lineNet / 12 : lineNet;
      }
    }

    // 4. Resolve expiry date
    Date expiry;
    if (String.isNotBlank(req.expirationDate)) {
      expiry = Date.valueOf(req.expirationDate);
    } else {
      expiry = Date.today().addDays(30);
    }

    // 5. Insert Quote (Name is AutoNumber DEVIS-{0000} — set by Salesforce automatically)
    String terms = String.isNotBlank(req.paymentTerms)
      ? req.paymentTerms
      : 'Net 30';
    TALEXO_Quote__c q = new TALEXO_Quote__c(
      Opportunity__c = req.opportunityId,
      Status__c = 'Draft',
      GrandTotal__c = grandTotal,
      ExpirationDate__c = expiry,
      PaymentTerms__c = terms,
      BulkDiscount__c = discountPct,
      IsPrimary__c = true,
      VersionNumber__c = 1,
      NegotiationStatus__c = 'Draft',
      MRR__c = mrr,
      OneTimeTotal__c = oneTimeTotal,
      RecurringTotal__c = recurringTotal,
      Description__c = 'B2B quote for ' +
        opp.Account.Name +
        ' — ' +
        req.lineItems.size() +
        ' product(s)' +
        ' | ' +
        discountPct +
        '% bulk discount' +
        ' | Payment: ' +
        terms
    );
    insert q;

    // 7. Insert Line Items
    List<NexusQuoteLineItem__c> lineItems = new List<NexusQuoteLineItem__c>();
    for (LineItemRequest li : req.lineItems) {
      Decimal lp = li.listPrice != null ? li.listPrice : 0;
      Decimal unitNet = lp * (1 - discountPct / 100);
      Integer qty = li.quantity != null ? li.quantity : 1;

      String pType = String.isNotBlank(li.productType)
        ? li.productType
        : 'One-time';
      String bFreq = String.isNotBlank(li.billingFrequency)
        ? li.billingFrequency
        : 'N/A';
      lineItems.add(
        new NexusQuoteLineItem__c(
          Quote__c = q.Id,
          Product__c = li.product2Id,
          ProductName__c = li.productName,
          ProductFamily__c = li.productFamily,
          Quantity__c = qty,
          ListPrice__c = lp,
          UnitPrice__c = unitNet,
          Discount__c = discountPct,
          NetTotal__c = unitNet * qty,
          Product_Type__c = pType,
          Billing_Frequency__c = bFreq
        )
      );
    }
    insert lineItems;

    // 8. Sync Quote grand total (cross-check)
    update new TALEXO_Quote__c(Id = q.Id, GrandTotal__c = grandTotal);

    // 9. Also sync Opportunity Amount with primary quote total
    update new Opportunity(Id = req.opportunityId, Amount = grandTotal);

    // 10. Trigger AI scoring (synchronous — same pattern as LeadScoringWriter)
    QuoteAIScoringAction.ScoreInput inp = new QuoteAIScoringAction.ScoreInput();
    inp.quoteId = q.Id;
    QuoteAIScoringAction.scoreQuote(
      new List<QuoteAIScoringAction.ScoreInput>{ inp }
    );

    // 11. Re-read to get AI score
    q = [
      SELECT
        Id,
        Name,
        GrandTotal__c,
        AcceptanceProbability__c,
        AIReason__c,
        PaymentTerms__c,
        BulkDiscount__c
      FROM TALEXO_Quote__c
      WHERE Id = :q.Id
      LIMIT 1
    ];

    GenerateResult result = new GenerateResult();
    result.quoteId = q.Id;
    result.quoteName = q.Name;
    result.subtotal = subtotal;
    result.discountAmount = discountAmt;
    result.grandTotal = grandTotal;
    result.paymentTerms = q.PaymentTerms__c;
    result.bulkDiscount = q.BulkDiscount__c;
    result.acceptanceProbability = q.AcceptanceProbability__c != null
      ? Integer.valueOf(q.AcceptanceProbability__c)
      : 0;
    result.aiReason = q.AIReason__c;
    result.mrr = mrr;
    result.oneTimeTotal = oneTimeTotal;
    result.recurringTotal = recurringTotal;
    return result;
  }
}
