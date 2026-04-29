public without sharing class NexusQuoteGetAction {

  public class Input {
    @InvocableVariable(label='Account Id' required=false)
    public String accountId;
    @InvocableVariable(label='Quote Name' required=false)
    public String quoteName;
  }

  public class Output {
    @InvocableVariable(label='Found')
    public Boolean found;
    @InvocableVariable(label='Quote Id')
    public String quoteId;
    @InvocableVariable(label='Quote Name')
    public String quoteName;
    @InvocableVariable(label='Grand Total')
    public Decimal grandTotal;
    @InvocableVariable(label='Expiration Date')
    public String expirationDate;
    @InvocableVariable(label='Payment Terms')
    public String paymentTerms;
    @InvocableVariable(label='Status')
    public String status;
    @InvocableVariable(label='Bulk Discount Percent')
    public Decimal bulkDiscount;
    @InvocableVariable(label='Floor Price')
    public Decimal floorPrice;
    @InvocableVariable(label='Negotiation Round')
    public Integer negotiationRound;
    @InvocableVariable(label='Can Counter')
    public Boolean canCounter;
    @InvocableVariable(label='AI Reason')
    public String aiReason;
    @InvocableVariable(label='Products Summary')
    public String productsSummary;
    @InvocableVariable(label='Full Summary')
    public String summary;
  }

  @InvocableMethod(
    label='Get Customer Quote'
    description='Retrieves the active presented quote for a customer account. Use this to check quote details before discussing terms.'
  )
  public static List<Output> getQuote(List<Input> inputs) {
    List<Output> results = new List<Output>();

    for (Input inp : inputs) {
      Output out = new Output();
      out.found = false;

      boolean hasAccount = String.isNotBlank(inp.accountId);
      boolean hasName = String.isNotBlank(inp.quoteName);

      if (!hasAccount && !hasName) {
        out.summary = 'Please provide your quote number (e.g. QUOTE-0116) or I can look it up automatically.';
        results.add(out);
        continue;
      }

      List<TALEXO_Quote__c> quotes;

      if (hasName) {
        // Look up directly by quote name/number
        String nameSearch = '%' + inp.quoteName.trim() + '%';
        quotes = [
          SELECT
            Id, Name, Status__c, GrandTotal__c, ExpirationDate__c,
            PaymentTerms__c, BulkDiscount__c, FloorPrice__c,
            NegotiationRound__c, AIReason__c, NegotiationStatus__c,
            (SELECT ProductName__c, Quantity__c, UnitPrice__c FROM NexusQuoteLineItems__r)
          FROM TALEXO_Quote__c
          WHERE Name LIKE :nameSearch
          ORDER BY CreatedDate DESC
          LIMIT 1
        ];
      } else {
        Id accId;
        try {
          accId = Id.valueOf(inp.accountId);
        } catch (Exception ex) {
          out.summary = 'Invalid account ID format.';
          results.add(out);
          continue;
        }
        quotes = [
          SELECT
            Id, Name, Status__c, GrandTotal__c, ExpirationDate__c,
            PaymentTerms__c, BulkDiscount__c, FloorPrice__c,
            NegotiationRound__c, AIReason__c, NegotiationStatus__c,
            (SELECT ProductName__c, Quantity__c, UnitPrice__c FROM NexusQuoteLineItems__r)
          FROM TALEXO_Quote__c
          WHERE
            Opportunity__r.AccountId = :accId
            AND Status__c IN ('Presented', 'Draft', 'Requested')
            AND IsPrimary__c = TRUE
          ORDER BY CreatedDate DESC
          LIMIT 1
        ];
      }

      if (quotes.isEmpty()) {
        out.summary = 'No active quote found for your account at this time.';
        results.add(out);
        continue;
      }

      TALEXO_Quote__c q = quotes[0];
      out.found = true;
      out.quoteId = q.Id;
      out.quoteName = q.Name;
      out.grandTotal = q.GrandTotal__c;
      out.expirationDate = q.ExpirationDate__c != null
        ? q.ExpirationDate__c.format()
        : null;
      out.paymentTerms = q.PaymentTerms__c != null
        ? q.PaymentTerms__c
        : 'Net 30';
      out.status = q.Status__c;
      out.bulkDiscount = q.BulkDiscount__c != null ? q.BulkDiscount__c : 0;
      out.floorPrice = q.FloorPrice__c;
      out.negotiationRound = q.NegotiationRound__c != null
        ? Integer.valueOf(q.NegotiationRound__c)
        : 0;
      out.canCounter = (q.Status__c == 'Presented');
      out.aiReason = q.AIReason__c;

      List<String> itemParts = new List<String>();
      for (NexusQuoteLineItem__c li : q.NexusQuoteLineItems__r) {
        Integer qty = li.Quantity__c != null
          ? Integer.valueOf(li.Quantity__c)
          : 1;
        itemParts.add(li.ProductName__c + ' ×' + qty);
      }
      out.productsSummary = itemParts.isEmpty()
        ? 'No line items'
        : String.join(itemParts, ', ');

      String totalStr = q.GrandTotal__c != null
        ? q.GrandTotal__c.setScale(2).toPlainString() + ' €'
        : '—';
      String expiryStr = out.expirationDate != null
        ? out.expirationDate
        : 'N/A';

      out.summary =
        'Quote: ' + q.Name +
        ' | Total: ' + totalStr +
        ' | Payment terms: ' + out.paymentTerms +
        ' | Valid until: ' + expiryStr +
        ' | Volume discount: ' + out.bulkDiscount.toPlainString() + '%' +
        ' | Products: ' + out.productsSummary +
        ' | Status: ' + q.Status__c +
        (out.negotiationRound > 0
          ? ' | Negotiation round: ' + out.negotiationRound
          : '');

      results.add(out);
    }

    return results;
  }
}
