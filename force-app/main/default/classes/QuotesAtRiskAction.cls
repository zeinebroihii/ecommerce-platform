public without sharing class QuotesAtRiskAction {
  public class Input {
    @InvocableVariable(
      description='Optional: filter by account name or partial account name.'
    )
    public String accountFilter;
  }

  public class Output {
    @InvocableVariable(
      description='Formatted list of open quotes at risk due to insufficient stock.'
    )
    public String report;
    @InvocableVariable(description='Number of quotes at risk.')
    public Integer quotesAtRiskCount;
    @InvocableVariable(description='Total value of quotes at risk in dollars.')
    public Decimal totalValueAtRisk;
  }

  @InvocableMethod(
    label='Get Quotes At Risk Due To Stock'
    description='Identifies all open quotes where the committed product quantities exceed the effective available stock. Returns the quote name, account, product, committed vs available units, and deal value. Use when a user asks which deals could be blocked by stock issues, which quotes are at risk, or how stock shortages affect the sales pipeline.'
  )
  public static List<Output> getQuotesAtRisk(List<Input> inputs) {
    String accountFilter = (inputs != null && !inputs.isEmpty())
      ? inputs[0].accountFilter
      : null;

    // Get all open quote line items with product stock info
    List<NexusQuoteLineItem__c> lineItems = [
      SELECT
        Quote__c,
        Quote__r.Name,
        Quote__r.Status__c,
        Quote__r.GrandTotal__c,
        Quote__r.Opportunity__r.Account.Name,
        Product__c,
        Product__r.Name,
        Quantity__c
      FROM NexusQuoteLineItem__c
      WHERE
        Product__c != NULL
        AND Quote__r.Status__c NOT IN (
          'Accepted',
          'Rejected',
          'Signed',
          'Expired'
        )
        AND Quantity__c > 0
      ORDER BY Quote__r.GrandTotal__c DESC NULLS LAST
      LIMIT 200
    ];

    if (lineItems.isEmpty()) {
      Output out = new Output();
      out.report = 'No open quotes with product commitments found.';
      out.quotesAtRiskCount = 0;
      out.totalValueAtRisk = 0;
      return new List<Output>{ out };
    }

    // Get effective stock per product
    Set<Id> productIds = new Set<Id>();
    for (NexusQuoteLineItem__c li : lineItems)
      productIds.add(li.Product__c);

    Map<Id, Stock__c> stockByProduct = new Map<Id, Stock__c>();
    for (Stock__c s : [
      SELECT Product__c, Quantity_Available__c, Risk_Level__c, Days_Remaining__c
      FROM Stock__c
      WHERE Product__c IN :productIds
    ]) {
      stockByProduct.put(s.Product__c, s);
    }

    // Aggregate committed units per product
    Map<Id, Decimal> committedByProduct = new Map<Id, Decimal>();
    for (NexusQuoteLineItem__c li : lineItems) {
      Decimal current = committedByProduct.get(li.Product__c) ?? 0;
      committedByProduct.put(li.Product__c, current + (li.Quantity__c ?? 0));
    }

    // Find quotes where committed > effective stock
    Set<Id> atRiskQuoteIds = new Set<Id>();
    for (NexusQuoteLineItem__c li : lineItems) {
      Stock__c s = stockByProduct.get(li.Product__c);
      if (s == null)
        continue;
      Decimal stock = s.Quantity_Available__c ?? 0;
      Decimal totalCommitted = committedByProduct.get(li.Product__c) ?? 0;
      Decimal effective = Math.max(
        0,
        stock - totalCommitted + (li.Quantity__c ?? 0)
      );
      if (li.Quantity__c > effective) {
        atRiskQuoteIds.add(li.Quote__c);
      }
    }

    List<String> lines = new List<String>();
    Set<Id> seen = new Set<Id>();
    Decimal totalValue = 0;

    for (NexusQuoteLineItem__c li : lineItems) {
      if (!atRiskQuoteIds.contains(li.Quote__c))
        continue;
      if (seen.contains(li.Quote__c))
        continue;

      String account = li.Quote__r.Opportunity__r?.Account?.Name ??
        'Unknown Account';
      if (
        String.isNotBlank(accountFilter) &&
        !account.toLowerCase().contains(accountFilter.toLowerCase())
      )
        continue;

      seen.add(li.Quote__c);
      Decimal val = li.Quote__r.GrandTotal__c ?? 0;
      totalValue += val;

      Stock__c s = stockByProduct.get(li.Product__c);
      String stockNote = s != null
        ? Integer.valueOf(s.Quantity_Available__c ?? 0) +
          ' units, ' +
          s.Risk_Level__c
        : 'no stock record';

      lines.add(
        '• ' +
          li.Quote__r.Name +
          ' (' +
          account +
          ')' +
          ' — ' +
          li.Product__r.Name +
          ': needs ' +
          Integer.valueOf(li.Quantity__c) +
          ' units | stock: ' +
          stockNote +
          ' | deal value: $' +
          val.setScale(0).toPlainString()
      );
    }

    Output out = new Output();
    out.quotesAtRiskCount = seen.size();
    out.totalValueAtRisk = totalValue;

    if (lines.isEmpty()) {
      out.report =
        'No open quotes are currently at risk from stock shortages.' +
        (String.isNotBlank(accountFilter)
          ? ' (filtered by account: ' + accountFilter + ')'
          : '');
    } else {
      out.report =
        'QUOTES AT RISK — STOCK INSUFFICIENT\n' +
        '────────────────────────────────────\n' +
        seen.size() +
        ' quote(s) at risk | Total value: $' +
        totalValue.setScale(0).toPlainString() +
        '\n\n' +
        String.join(lines, '\n');
    }
    return new List<Output>{ out };
  }
}
