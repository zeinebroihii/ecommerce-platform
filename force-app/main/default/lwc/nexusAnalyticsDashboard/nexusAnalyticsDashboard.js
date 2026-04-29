import { LightningElement, wire, track } from "lwc";
import getKpiSummary from "@salesforce/apex/AnalyticsDashboardController.getKpiSummary";
import getRevenueByMonth from "@salesforce/apex/AnalyticsDashboardController.getRevenueByMonth";
import getQuotePipeline from "@salesforce/apex/AnalyticsDashboardController.getQuotePipeline";
import getTopProducts from "@salesforce/apex/AnalyticsDashboardController.getTopProducts";
import getTopAccounts from "@salesforce/apex/AnalyticsDashboardController.getTopAccounts";
import getStockHealth from "@salesforce/apex/AnalyticsDashboardController.getStockHealth";
import getLeadKpiSummary from "@salesforce/apex/AnalyticsDashboardController.getLeadKpiSummary";
import getLeadSourceBreakdown from "@salesforce/apex/AnalyticsDashboardController.getLeadSourceBreakdown";
import getAIScoreDistribution from "@salesforce/apex/AnalyticsDashboardController.getAIScoreDistribution";

// SVG donut: circle r=40 → circumference ≈ 251.33
const CIRC = 2 * Math.PI * 40;

function buildDonutSegments(items, valueField, keyField) {
  const total = items.reduce((s, i) => s + (i[valueField] || 0), 0);
  if (total === 0) return [];
  let cum = 0;
  return items
    .filter((i) => (i[valueField] || 0) > 0)
    .map((i) => {
      const pct = i[valueField] / total;
      const dash = Math.max(pct * CIRC - 2, 0.5);
      const rotation = -90 + cum * 360;
      cum += pct;
      return {
        ...i,
        _key: i[keyField],
        pctLabel: Math.round(pct * 100) + "%",
        dasharray: `${dash} ${CIRC}`,
        svgTransform: `rotate(${rotation} 50 50)`,
        dotStyle: `background:${i.color}`
      };
    });
}

function fmt(val) {
  if (val == null || val === 0) return "TND 0";
  if (val >= 1000000) return "TND " + (val / 1000000).toFixed(1) + "M";
  if (val >= 1000) return "TND " + (val / 1000).toFixed(1) + "K";
  return "TND " + Math.round(val).toLocaleString("fr-TN");
}

export default class NexusAnalyticsDashboard extends LightningElement {
  @track _kpi = null;
  @track _revenue = [];
  @track _pipeline = [];
  @track _products = [];
  @track _accounts = [];
  @track _stock = null;
  @track _leadKpi = null;
  @track _leadSources = [];
  @track _aiScores = [];

  // ── Wire calls ───────────────────────────────────────────────────────────
  @wire(getKpiSummary)
  wiredKpi({ data }) {
    if (data) this._kpi = data;
  }
  @wire(getRevenueByMonth)
  wiredRevenue({ data }) {
    if (data) this._revenue = data;
  }
  @wire(getQuotePipeline)
  wiredPipeline({ data }) {
    if (data) this._pipeline = data;
  }
  @wire(getTopProducts)
  wiredProducts({ data }) {
    if (data) this._products = data;
  }
  @wire(getTopAccounts)
  wiredAccounts({ data }) {
    if (data) this._accounts = data;
  }
  @wire(getStockHealth)
  wiredStock({ data }) {
    if (data) this._stock = data;
  }
  @wire(getLeadKpiSummary)
  wiredLeadKpi({ data }) {
    if (data) this._leadKpi = data;
  }
  @wire(getLeadSourceBreakdown)
  wiredLeadSources({ data }) {
    if (data) this._leadSources = data;
  }
  @wire(getAIScoreDistribution)
  wiredAIScores({ data }) {
    if (data) this._aiScores = data;
  }

  // ── Quote KPI getters ────────────────────────────────────────────────────
  get kpiRevenue() {
    return this._kpi ? fmt(this._kpi.totalRevenue) : "—";
  }
  get kpiPipeline() {
    return this._kpi ? fmt(this._kpi.pipelineValue) : "—";
  }
  get kpiWinRate() {
    return this._kpi ? this._kpi.winRate + "%" : "—";
  }
  get kpiAvgDeal() {
    return this._kpi ? fmt(this._kpi.avgDealSize) : "—";
  }
  get kpiActiveQuotes() {
    return this._kpi ? this._kpi.activeQuotes : "—";
  }
  get kpiTotalQuotes() {
    return this._kpi ? this._kpi.totalQuotes : "—";
  }
  get kpiAccepted() {
    return this._kpi ? this._kpi.acceptedCount : "—";
  }

  // ── Lead KPI getters ─────────────────────────────────────────────────────
  get leadKpiTotal() {
    return this._leadKpi ? this._leadKpi.totalLeads : "—";
  }
  get leadKpiConverted() {
    return this._leadKpi ? this._leadKpi.convertedLeads : "—";
  }
  get leadKpiConversionRate() {
    return this._leadKpi ? this._leadKpi.conversionRate + "%" : "—";
  }
  get leadKpiAvgScore() {
    return this._leadKpi ? this._leadKpi.avgAIScore + "/100" : "—";
  }
  get leadKpiPending() {
    return this._leadKpi ? this._leadKpi.pendingDecision : "—";
  }

  // ── Stock banner ─────────────────────────────────────────────────────────
  get hasStockAlert() {
    return this._stock && (this._stock.critical > 0 || this._stock.atRisk > 0);
  }
  get stockAlertMsg() {
    if (!this._stock) return "";
    const parts = [];
    if (this._stock.critical > 0)
      parts.push(this._stock.critical + " critiques");
    if (this._stock.atRisk > 0)
      parts.push(this._stock.atRisk + " à risque");
    return (
      parts.join(" · ") +
      " — " +
      fmt(this._stock.pipelineAtRisk) +
      " pipeline à risque"
    );
  }

  // ── Revenue bar chart ────────────────────────────────────────────────────
  get hasRevenue() {
    return this._revenue.length > 0;
  }
  get revenueChartData() {
    if (!this._revenue.length) return [];
    const max = Math.max(...this._revenue.map((r) => r.revenue), 1);
    return this._revenue.map((r) => ({
      ...r,
      barStyle:
        "height:" + Math.max(Math.round((r.revenue / max) * 100), 2) + "%",
      revenueLabel: fmt(r.revenue)
    }));
  }

  // ── Pipeline donut (SVG) ─────────────────────────────────────────────────
  get pipelineDonutSegments() {
    return buildDonutSegments(this._pipeline, "quoteCount", "status");
  }
  get hasPipelineDonut() {
    return this.pipelineDonutSegments.length > 0;
  }
  get totalQuotesCount() {
    return this._pipeline.reduce((s, p) => s + (p.quoteCount || 0), 0);
  }

  // ── Lead source donut (SVG) ──────────────────────────────────────────────
  get leadSourceDonutSegments() {
    return buildDonutSegments(this._leadSources, "leadCount", "source");
  }
  get hasLeadSources() {
    return this.leadSourceDonutSegments.length > 0;
  }
  get totalLeadSourceCount() {
    return this._leadSources.reduce((s, l) => s + (l.leadCount || 0), 0);
  }

  // ── AI Score distribution bars ───────────────────────────────────────────
  get hasAIScores() {
    return this._aiScores.length > 0 && this._aiScores.some((b) => b.cnt > 0);
  }
  get aiScoreChartData() {
    if (!this._aiScores.length) return [];
    const max = Math.max(...this._aiScores.map((b) => b.cnt), 1);
    return this._aiScores.map((b) => ({
      ...b,
      barStyle:
        "width:" +
        Math.max(Math.round((b.cnt / max) * 100), 2) +
        "%;background:" +
        b.color
    }));
  }

  // ── Top products ─────────────────────────────────────────────────────────
  get hasProducts() {
    return this._products.length > 0;
  }
  get topProductsData() {
    if (!this._products.length) return [];
    const max = Math.max(...this._products.map((p) => p.dealCount), 1);
    return this._products.map((p, i) => ({
      ...p,
      rank: i + 1,
      barStyle: "width:" + Math.round((p.dealCount / max) * 100) + "%"
    }));
  }

  // ── Top accounts ─────────────────────────────────────────────────────────
  get hasAccounts() {
    return this._accounts.length > 0;
  }
  get topAccountsData() {
    if (!this._accounts.length) return [];
    const max = Math.max(...this._accounts.map((a) => a.totalValue), 1);
    return this._accounts.map((a, i) => ({
      ...a,
      rank: i + 1,
      totalLabel: fmt(a.totalValue),
      avgLabel: fmt(a.avgDeal),
      barStyle: "width:" + Math.round((a.totalValue / max) * 100) + "%"
    }));
  }
}
