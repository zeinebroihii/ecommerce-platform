public without sharing class AnalyticsDashboardController {
  // ── KPI Summary ───────────────────────────────────────────────────────────
  public class KpiSummary {
    @AuraEnabled
    public Decimal totalRevenue;
    @AuraEnabled
    public Decimal pipelineValue;
    @AuraEnabled
    public Integer totalQuotes;
    @AuraEnabled
    public Integer activeQuotes;
    @AuraEnabled
    public Decimal winRate;
    @AuraEnabled
    public Decimal avgDealSize;
    @AuraEnabled
    public Integer acceptedCount;
  }

  @AuraEnabled(cacheable=true)
  public static KpiSummary getKpiSummary() {
    KpiSummary k = new KpiSummary();
    k.totalRevenue = 0;
    k.pipelineValue = 0;
    k.totalQuotes = 0;
    k.activeQuotes = 0;
    k.winRate = 0;
    k.avgDealSize = 0;
    k.acceptedCount = 0;
    Integer accepted = 0;
    Integer rejected = 0;
    Decimal acceptedTotal = 0;

    for (AggregateResult ar : [
      SELECT Status__c s, COUNT(Id) cnt, SUM(GrandTotal__c) tot
      FROM TALEXO_Quote__c
      GROUP BY Status__c
    ]) {
      String status = (String) ar.get('s');
      Integer cnt = Integer.valueOf(ar.get('cnt'));
      Decimal tot = (Decimal) (ar.get('tot') ?? 0);
      k.totalQuotes += cnt;
      if (status == 'Accepted') {
        k.totalRevenue = tot;
        accepted = cnt;
        acceptedTotal = tot;
      } else if (status == 'Rejected') {
        rejected = cnt;
      } else {
        k.pipelineValue += tot;
        k.activeQuotes += cnt;
      }
    }
    k.acceptedCount = accepted;
    Integer denom = accepted + rejected;
    k.winRate = denom > 0 ? ((Decimal) accepted / denom * 100).setScale(1) : 0;
    k.avgDealSize = accepted > 0 ? (acceptedTotal / accepted).setScale(0) : 0;
    return k;
  }

  // ── Revenue by Month (last 6 months, accepted quotes) ─────────────────────
  public class MonthRevenue {
    @AuraEnabled
    public String month;
    @AuraEnabled
    public Decimal revenue;
    @AuraEnabled
    public Integer quoteCount;
  }

  @AuraEnabled(cacheable=true)
  public static List<MonthRevenue> getRevenueByMonth() {
    List<MonthRevenue> result = new List<MonthRevenue>();
    Date start = Date.today().addMonths(-5).toStartOfMonth();
    for (AggregateResult ar : [
      SELECT
        CALENDAR_MONTH(CreatedDate) m,
        CALENDAR_YEAR(CreatedDate) y,
        SUM(GrandTotal__c) tot,
        COUNT(Id) cnt
      FROM TALEXO_Quote__c
      WHERE Status__c = 'Accepted' AND CreatedDate >= :start
      GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)
      ORDER BY CALENDAR_YEAR(CreatedDate) ASC, CALENDAR_MONTH(CreatedDate) ASC
    ]) {
      MonthRevenue mr = new MonthRevenue();
      mr.month = monthLabel(Integer.valueOf(ar.get('m')));
      mr.revenue = (Decimal) (ar.get('tot') ?? 0);
      mr.quoteCount = Integer.valueOf(ar.get('cnt'));
      result.add(mr);
    }
    return result;
  }

  // ── Quote Pipeline by Status ──────────────────────────────────────────────
  public class PipelineStage {
    @AuraEnabled
    public String status;
    @AuraEnabled
    public Integer quoteCount;
    @AuraEnabled
    public Decimal value;
    @AuraEnabled
    public String color;
  }

  @AuraEnabled(cacheable=true)
  public static List<PipelineStage> getQuotePipeline() {
    Map<String, String> colorMap = new Map<String, String>{
      'Draft' => '#94a3b8',
      'Sent' => '#3b82f6',
      'Negotiating' => '#f59e0b',
      'Accepted' => '#10b981',
      'Rejected' => '#ef4444'
    };
    Map<String, PipelineStage> stageMap = new Map<String, PipelineStage>();
    for (AggregateResult ar : [
      SELECT Status__c s, COUNT(Id) cnt, SUM(GrandTotal__c) tot
      FROM TALEXO_Quote__c
      GROUP BY Status__c
    ]) {
      String status = (String) ar.get('s') ?? 'Unknown';
      PipelineStage ps = new PipelineStage();
      ps.status = status;
      ps.quoteCount = Integer.valueOf(ar.get('cnt'));
      ps.value = (Decimal) (ar.get('tot') ?? 0);
      ps.color = colorMap.get(status) ?? '#64748b';
      stageMap.put(status, ps);
    }
    List<PipelineStage> result = new List<PipelineStage>();
    for (
      String s : new List<String>{
        'Draft',
        'Sent',
        'Negotiating',
        'Accepted',
        'Rejected'
      }
    ) {
      if (stageMap.containsKey(s))
        result.add(stageMap.get(s));
    }
    return result;
  }

  // ── Top 5 Products by deal count (accepted line items) ────────────────────
  public class TopProduct {
    @AuraEnabled
    public String productId;
    @AuraEnabled
    public String productName;
    @AuraEnabled
    public String productFamily;
    @AuraEnabled
    public Integer dealCount;
    @AuraEnabled
    public Integer unitsSold;
  }

  @AuraEnabled(cacheable=true)
  public static List<TopProduct> getTopProducts() {
    List<TopProduct> result = new List<TopProduct>();
    for (AggregateResult ar : [
      SELECT
        Product__c pid,
        Product__r.Name pname,
        Product__r.Family pfam,
        COUNT(Id) cnt,
        SUM(Quantity__c) qty
      FROM NexusQuoteLineItem__c
      WHERE Quote__r.Status__c = 'Accepted'
      GROUP BY Product__c, Product__r.Name, Product__r.Family
      ORDER BY COUNT(Id) DESC NULLS LAST
      LIMIT 5
    ]) {
      TopProduct tp = new TopProduct();
      tp.productId = (String) ar.get('pid');
      tp.productName = (String) ar.get('pname');
      tp.productFamily = (String) ar.get('pfam');
      tp.dealCount = Integer.valueOf(ar.get('cnt'));
      tp.unitsSold = ar.get('qty') != null ? Integer.valueOf(ar.get('qty')) : 0;
      result.add(tp);
    }
    return result;
  }

  // ── Top 5 Accounts by accepted quote value ────────────────────────────────
  public class TopAccount {
    @AuraEnabled
    public String accountName;
    @AuraEnabled
    public Decimal totalValue;
    @AuraEnabled
    public Integer quoteCount;
    @AuraEnabled
    public Decimal avgDeal;
  }

  @AuraEnabled(cacheable=true)
  public static List<TopAccount> getTopAccounts() {
    List<TopAccount> result = new List<TopAccount>();
    for (AggregateResult ar : [
      SELECT
        Opportunity__r.Account.Name aname,
        SUM(GrandTotal__c) tot,
        COUNT(Id) cnt
      FROM TALEXO_Quote__c
      WHERE Status__c = 'Accepted' AND Opportunity__c != NULL
      GROUP BY Opportunity__r.Account.Name
      ORDER BY SUM(GrandTotal__c) DESC NULLS LAST
      LIMIT 5
    ]) {
      TopAccount ta = new TopAccount();
      ta.accountName = (String) ar.get('aname');
      ta.totalValue = (Decimal) (ar.get('tot') ?? 0);
      ta.quoteCount = Integer.valueOf(ar.get('cnt'));
      ta.avgDeal = ta.quoteCount > 0
        ? (ta.totalValue / ta.quoteCount).setScale(0)
        : 0;
      result.add(ta);
    }
    return result;
  }

  // ── Stock health summary (for risk banner) ────────────────────────────────
  public class StockHealthSummary {
    @AuraEnabled
    public Integer critical;
    @AuraEnabled
    public Integer atRisk;
    @AuraEnabled
    public Integer total;
    @AuraEnabled
    public Decimal pipelineAtRisk; // value of quotes on critical products
  }

  @AuraEnabled(cacheable=true)
  public static StockHealthSummary getStockHealth() {
    StockHealthSummary sh = new StockHealthSummary();
    sh.critical = 0;
    sh.atRisk = 0;
    sh.total = 0;
    sh.pipelineAtRisk = 0;
    for (AggregateResult ar : [
      SELECT Risk_Level__c lvl, COUNT(Id) cnt
      FROM Stock__c
      WHERE Product__c != NULL
      GROUP BY Risk_Level__c
    ]) {
      String lvl = (String) ar.get('lvl');
      Integer cnt = Integer.valueOf(ar.get('cnt'));
      sh.total += cnt;
      if (lvl == 'Critical')
        sh.critical += cnt;
      if (lvl == 'At Risk')
        sh.atRisk += cnt;
    }
    // Pipeline value at risk: quotes referencing critical/at-risk stock products
    Set<Id> atRiskProducts = new Set<Id>();
    for (Stock__c s : [
      SELECT Product__c
      FROM Stock__c
      WHERE Risk_Level__c IN ('Critical', 'At Risk') AND Product__c != NULL
    ]) {
      atRiskProducts.add(s.Product__c);
    }
    if (!atRiskProducts.isEmpty()) {
      for (AggregateResult ar : [
        SELECT SUM(Quote__r.GrandTotal__c) tot
        FROM NexusQuoteLineItem__c
        WHERE
          Product__c IN :atRiskProducts
          AND Quote__r.Status__c IN ('Draft', 'Sent', 'Negotiating')
      ]) {
        sh.pipelineAtRisk = (Decimal) (ar.get('tot') ?? 0);
      }
    }
    return sh;
  }

  private static String monthLabel(Integer m) {
    List<String> months = new List<String>{
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    };
    return (m >= 1 && m <= 12) ? months[m - 1] : 'N/A';
  }
}
