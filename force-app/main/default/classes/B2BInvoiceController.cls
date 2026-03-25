public without sharing class B2BInvoiceController {
  public TALEXO_Quote__c quote { get; private set; }
  public List<NexusQuoteLineItem__c> lineItems { get; private set; }
  public String accountName { get; private set; }
  public String invoiceRef { get; private set; }
  public String invoiceDate { get; private set; }
  public String signerName { get; private set; }
  public String signerEmail { get; private set; }
  public String signedAt { get; private set; }
  public Decimal subtotal { get; private set; }
  public Decimal discount { get; private set; }
  public Decimal grandTotal { get; private set; }
  public String paymentTerms { get; private set; }

  public B2BInvoiceController() {
    Id quoteId = ApexPages.currentPage().getParameters().get('quoteId');
    if (quoteId == null) {
      quote = new TALEXO_Quote__c();
      lineItems = new List<NexusQuoteLineItem__c>();
      return;
    }

    quote = [
      SELECT
        Id,
        Name,
        GrandTotal__c,
        BulkDiscount__c,
        PaymentTerms__c,
        ExpirationDate__c,
        SubmittedAt__c,
        Opportunity__r.Account.Name,
        Opportunity__r.Account.BillingStreet,
        Opportunity__r.Account.BillingCity,
        Opportunity__r.Account.BillingCountry
      FROM TALEXO_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];

    lineItems = [
      SELECT
        ProductName__c,
        ProductFamily__c,
        Quantity__c,
        UnitPrice__c,
        Discount__c,
        NetTotal__c
      FROM NexusQuoteLineItem__c
      WHERE Quote__c = :quoteId
    ];

    accountName = quote.Opportunity__r.Account.Name;
    invoiceRef = 'CTR-' + String.valueOf(quoteId).right(6).toUpperCase();
    invoiceDate = Date.today().format();
    paymentTerms = quote.PaymentTerms__c != null
      ? quote.PaymentTerms__c
      : 'Net 30';
    discount = quote.BulkDiscount__c != null ? quote.BulkDiscount__c : 0;
    grandTotal = quote.GrandTotal__c != null ? quote.GrandTotal__c : 0;

    subtotal = 0;
    for (NexusQuoteLineItem__c li : lineItems) {
      subtotal += (li.NetTotal__c != null ? li.NetTotal__c : 0);
    }

    // Signer info from URL params (set by sendB2BInvoiceAsync)
    signerName = ApexPages.currentPage().getParameters().get('signerName');
    signerEmail = ApexPages.currentPage().getParameters().get('signerEmail');
    signedAt = ApexPages.currentPage().getParameters().get('signedAt');
    if (String.isBlank(signedAt))
      signedAt = DateTime.now().format('dd/MM/yyyy HH:mm') + ' UTC';
  }
}
