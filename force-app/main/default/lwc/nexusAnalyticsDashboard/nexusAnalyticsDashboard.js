import { LightningElement, wire, track } from "lwc";
import getKpiSummary from "@salesforce/apex/AnalyticsDashboardController.getKpiSummary";
import getRevenueByMonth from "@salesforce/apex/AnalyticsDashboardController.getRevenueByMonth";
import getQuotePipeline from "@salesforce/apex/AnalyticsDashboardController.getQuotePipeline";
import getTopProducts from "@salesforce/apex/AnalyticsDashboardController.getTopProducts";
import getTopAccounts from "@salesforce/apex/AnalyticsDashboardController.getTopAccounts";
import getStockHealth from "@salesforce/apex/AnalyticsDashboardController.getStockHealth";

function fmt(val) {
  if (val == null || val === 0) return "TND 0";
  if (val >= 1000000) return "TND " + (val / 1000000).toFixed(1) + "M";
  if (val >= 1000) return "TND " + (val / 1000).toFixed(1) + "K";
  return "TND " + Math.round(val).toLocaleString("fr-TN");
}

const STAGE_ORDER = ["Draft", "Sent", "Negotiating", "Accepted", "Rejected"];

export default class NexusAnalyticsDashboard extends LightningElement {
  @track _kpi = null;
  @track _revenue = [];
  @track _pipeline = [];
  @track _products = [];
  @track _accounts = [];
  @track _stock = null;

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

  // ── KPI getters ─────────────────────────────────────────────────────────────
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

  // ── Stock health banner ──────────────────────────────────────────────────────
  get hasStockAlert() {
    return this._stock && (this._stock.critical > 0 || this._stock.atRisk > 0);
  }
  get stockAlertMsg() {
    if (!this._stock) return "";
    const parts = [];
    if (this._stock.critical > 0)
      parts.push(this._stock.critical + " critical");
    if (this._stock.atRisk > 0) parts.push(this._stock.atRisk + " at-risk");
    return (
      parts.join(" · ") +
      " stock items — " +
      fmt(this._stock.pipelineAtRisk) +
      " pipeline at risk"
    );
  }

  // ── Revenue chart ────────────────────────────────────────────────────────────
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

  // ── Pipeline funnel ──────────────────────────────────────────────────────────
  get hasPipeline() {
    return this._pipeline.length > 0;
  }
  get pipelineChartData() {
    if (!this._pipeline.length) return [];
    const maxVal = Math.max(...this._pipeline.map((p) => p.value), 1);
    return this._pipeline.map((p) => ({
      ...p,
      pct: Math.max(Math.round((p.value / maxVal) * 100), 2),
      barStyle:
        "width:" +
        Math.max(Math.round((p.value / maxVal) * 100), 2) +
        "%;background:" +
        p.color,
      valueLabel: fmt(p.value),
      stageOrder: STAGE_ORDER.indexOf(p.status)
    }));
  }

  // ── Top products ─────────────────────────────────────────────────────────────
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

  // ── Top accounts ─────────────────────────────────────────────────────────────
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
