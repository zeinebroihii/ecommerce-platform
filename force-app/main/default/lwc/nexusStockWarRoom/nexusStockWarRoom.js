import { LightningElement, track, wire } from "lwc";
import getStockRiskProducts from "@salesforce/apex/StockIntelligenceController.getStockRiskProducts";
import getStockSummary from "@salesforce/apex/StockIntelligenceController.getStockSummary";
import getRelatedQuotes from "@salesforce/apex/StockIntelligenceController.getRelatedQuotes";
import generateReorderBrief from "@salesforce/apex/StockIntelligenceController.generateReorderBrief";
import generateDemandForecast from "@salesforce/apex/StockIntelligenceController.generateDemandForecast";
import runEngine from "@salesforce/apex/StockVelocityEngine.run";

const FILTERS = ["All", "Critical", "At Risk", "Healthy", "Overstock"];

function formatCurrency(val) {
  if (!val) return "—";
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    maximumFractionDigits: 0
  }).format(val);
}

export default class NexusStockWarRoom extends LightningElement {
  @track _items = [];
  @track _summary = {
    critical: 0,
    atRisk: 0,
    healthy: 0,
    overstock: 0,
    total: 0
  };
  @track isLoading = true;
  @track isRunning = false;
  @track activeFilter = "All";
  @track categoryFilter = "All";
  @track subcategoryFilter = "All";
  @track searchTerm = "";
  @track _expandedIds = {};
  @track reorderModal = null;
  @track quotesPanel = null;
  @track briefModal = null;
  @track forecastModal = null;
  @track toast = null;

  // ── Wire calls ─────────────────────────────────────────────────────────────

  @wire(getStockRiskProducts)
  wiredStock({ data, error }) {
    this.isLoading = false;
    if (data) this._items = data;
    else if (error)
      this._showToast("error", "utility:error", "Failed to load stock data");
  }

  @wire(getStockSummary)
  wiredSummary({ data }) {
    if (data) this._summary = data;
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get summary() {
    return this._summary;
  }

  get runBtnLabel() {
    return this.isRunning ? "Running..." : "Run Engine";
  }

  get filterOptions() {
    return FILTERS.map((f) => ({
      value: f,
      label: f,
      cls:
        this.activeFilter === f
          ? "nswr-filter-btn nswr-filter-active"
          : "nswr-filter-btn"
    }));
  }

  get categoryOptions() {
    const families = [
      ...new Set(this._items.map((i) => i.productFamily).filter(Boolean))
    ].sort();
    return [
      { label: "All Categories", value: "All" },
      ...families.map((f) => ({ label: f, value: f }))
    ];
  }

  get subcategoryOptions() {
    const base =
      this.categoryFilter !== "All"
        ? this._items.filter((i) => i.productFamily === this.categoryFilter)
        : this._items;
    const subs = [
      ...new Set(base.map((i) => i.subcategory).filter(Boolean))
    ].sort();
    return [
      { label: "All Subcategories", value: "All" },
      ...subs.map((s) => ({ label: s, value: s }))
    ];
  }

  get filteredItems() {
    let items = this._items;
    if (this.activeFilter !== "All") {
      items = items.filter((i) => i.riskLevel === this.activeFilter);
    }
    if (this.categoryFilter !== "All") {
      items = items.filter((i) => i.productFamily === this.categoryFilter);
    }
    if (this.subcategoryFilter !== "All") {
      items = items.filter((i) => i.subcategory === this.subcategoryFilter);
    }
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      items = items.filter(
        (i) =>
          (i.productName || "").toLowerCase().includes(q) ||
          (i.productFamily || "").toLowerCase().includes(q) ||
          (i.subcategory || "").toLowerCase().includes(q)
      );
    }
    return items.map((i) => this._enrichItem(i));
  }

  get hasItems() {
    return !this.isLoading && this.filteredItems.length > 0;
  }

  get isEmpty() {
    return !this.isLoading && this._items.length === 0;
  }

  // ── Item enrichment ────────────────────────────────────────────────────────

  _enrichItem(i) {
    const risk = i.riskLevel || "Healthy";
    const days = i.daysRemaining;
    const expanded = !!this._expandedIds[i.stockId];

    const rowCls =
      risk === "Critical"
        ? "nswr-row nswr-row-critical"
        : risk === "At Risk"
          ? "nswr-row nswr-row-atrisk"
          : risk === "Overstock"
            ? "nswr-row nswr-row-overstock"
            : "nswr-row";

    const riskDot =
      risk === "Critical"
        ? "nswr-dot nswr-dot-critical"
        : risk === "At Risk"
          ? "nswr-dot nswr-dot-atrisk"
          : risk === "Overstock"
            ? "nswr-dot nswr-dot-overstock"
            : "nswr-dot nswr-dot-healthy";

    const daysBadgeCls =
      risk === "Critical"
        ? "nswr-days-badge nswr-days-critical"
        : risk === "At Risk"
          ? "nswr-days-badge nswr-days-atrisk"
          : risk === "Overstock"
            ? "nswr-days-badge nswr-days-overstock"
            : "nswr-days-badge nswr-days-healthy";

    const daysLabel =
      days == null || days >= 999
        ? "No sales"
        : days === 0
          ? "OUT"
          : days + " days";

    const velocityLabel =
      i.dailyVelocity > 0
        ? (Number.isInteger(i.dailyVelocity)
            ? i.dailyVelocity
            : parseFloat(i.dailyVelocity.toFixed(1))) + " / day"
        : "No sales";

    const coverDays =
      risk === "Critical"
        ? 90
        : risk === "At Risk"
          ? 60
          : risk === "Overstock"
            ? 0
            : 30;
    const velocity = i.dailyVelocity || 0;
    const threshold = i.reorderThreshold || 10;
    const suggestedReorder =
      risk === "Overstock"
        ? 0
        : velocity === 0
          ? Math.round(threshold * 2)
          : Math.max(Math.round(velocity * coverDays), threshold);

    const aiSummaryShort = i.aiSummary
      ? i.aiSummary.substring(0, 80) + (i.aiSummary.length > 80 ? "..." : "")
      : null;

    return {
      ...i,
      rowCls,
      riskDot,
      daysBadgeCls,
      daysLabel,
      velocityLabel,
      suggestedReorder,
      coverDays,
      needsReorder: risk === "Critical" || risk === "At Risk",
      isOverstock: risk === "Overstock",
      isHealthy: risk === "Healthy",
      hasQuotes: i.relatedQuoteCount > 0,
      quoteValueLabel: formatCurrency(i.relatedQuoteValue),
      aiSummaryShort,
      aiExpanded: expanded,
      aiExpandLabel: expanded ? "▲ Less" : "▼ More"
    };
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  handleRefresh() {
    this.isLoading = true;
    this._expandedIds = {};
    getStockRiskProducts().then((data) => {
      this._items = data;
      this.isLoading = false;
    });
    getStockSummary().then((data) => {
      if (data) this._summary = data;
    });
  }

  handleRunEngine() {
    this.isRunning = true;
    runEngine()
      .then(() => {
        this._showToast(
          "success",
          "utility:check",
          "Engine ran successfully — stock data updated"
        );
        this.handleRefresh();
      })
      .catch(() => {
        this._showToast("error", "utility:error", "Engine run failed");
      })
      .finally(() => {
        this.isRunning = false;
      });
  }

  handleFilterClick(event) {
    this.activeFilter = event.currentTarget.dataset.value;
  }
  handleFilterCritical() {
    this.activeFilter = "Critical";
  }
  handleFilterAtRisk() {
    this.activeFilter = "At Risk";
  }
  handleFilterHealthy() {
    this.activeFilter = "Healthy";
  }
  handleFilterOverstock() {
    this.activeFilter = "Overstock";
  }

  handleSearch(event) {
    this.searchTerm = event.target.value;
  }

  handleCategoryFilter(event) {
    this.categoryFilter = event.target.value;
    this.subcategoryFilter = "All";
  }

  handleSubcategoryFilter(event) {
    this.subcategoryFilter = event.target.value;
  }

  handleToggleAI(event) {
    const id = event.currentTarget.dataset.id;
    this._expandedIds = { ...this._expandedIds, [id]: !this._expandedIds[id] };
  }

  handleReorder(event) {
    const { id, name, qty, cover } = event.currentTarget.dataset;
    this.reorderModal = {
      stockId: id,
      productName: name,
      qty: parseInt(qty, 10) || 10,
      coverDays: parseInt(cover, 10) || 45
    };
  }

  handleQtyChange(event) {
    this.reorderModal = {
      ...this.reorderModal,
      qty: parseInt(event.target.value, 10) || 1
    };
  }

  handleConfirmReorder() {
    this._showToast(
      "success",
      "utility:check",
      `Reorder of ${this.reorderModal.qty} units confirmed for ${this.reorderModal.productName}`
    );
    this.reorderModal = null;
  }

  handlePromo(event) {
    const id = event.currentTarget.dataset.id;
    this._showToast(
      "success",
      "utility:discount",
      `Promotion triggered for product ${id}`
    );
  }

  handleViewQuotes(event) {
    const productId = event.currentTarget.dataset.id;
    const productName =
      this._items.find((i) => i.productId === productId)?.productName || "";
    this.quotesPanel = { productId, productName, quotes: [], isLoading: true };
    getRelatedQuotes({ productId })
      .then((quotes) => {
        this.quotesPanel = {
          ...this.quotesPanel,
          isLoading: false,
          quotes: quotes.map((q) => ({
            ...q,
            totalLabel: formatCurrency(q.grandTotal)
          }))
        };
      })
      .catch(() => {
        this.quotesPanel = { ...this.quotesPanel, isLoading: false };
      });
  }

  handleGenerateBrief(event) {
    const stockId = event.currentTarget.dataset.id;
    const productName = event.currentTarget.dataset.name;
    this.briefModal = { stockId, productName, isLoading: true, text: null };
    generateReorderBrief({ stockId })
      .then((text) => {
        this.briefModal = { ...this.briefModal, isLoading: false, text };
      })
      .catch(() => {
        this.briefModal = {
          ...this.briefModal,
          isLoading: false,
          text: "⚠️ Could not generate brief. Check Prompt Builder setup or org limits."
        };
      });
  }

  handleCloseBrief() {
    this.briefModal = null;
  }

  handleGenerateForecast(event) {
    const stockId = event.currentTarget.dataset.id;
    const productName = event.currentTarget.dataset.name;
    this.forecastModal = { stockId, productName, isLoading: true };
    generateDemandForecast({ stockId })
      .then((json) => {
        let d;
        try {
          d = JSON.parse(json);
        } catch {
          d = {
            aiText: json,
            stockLevel: 0,
            demand30: 0,
            demand90: 0,
            daysRemaining: -1,
            adjustedDays: -1,
            quotedUnits: 0,
            openQuotes: 0,
            velocity: 0,
            risk: "Unknown",
            stockoutDate: "N/A",
            threshold: 10
          };
        }
        const maxVal = Math.max(d.stockLevel, d.demand90, d.quotedUnits, 1);
        const pct = (v) =>
          `width:${Math.min(Math.round((v / maxVal) * 100), 100)}%`;
        const riskCls =
          d.risk === "Critical"
            ? "nswr-fm-badge nswr-fm-badge-critical"
            : d.risk === "At Risk"
              ? "nswr-fm-badge nswr-fm-badge-atrisk"
              : d.risk === "Overstock"
                ? "nswr-fm-badge nswr-fm-badge-overstock"
                : "nswr-fm-badge nswr-fm-badge-healthy";
        this.forecastModal = {
          ...this.forecastModal,
          isLoading: false,
          aiText: d.aiText,
          stockLevel: d.stockLevel,
          demand30: d.demand30,
          demand90: d.demand90,
          daysLabel: d.daysRemaining >= 0 ? d.daysRemaining + "d" : "N/A",
          adjustedDaysLabel:
            d.adjustedDays >= 0 ? d.adjustedDays + " days" : "N/A",
          quotedUnits: d.quotedUnits,
          openQuotes: d.openQuotes,
          velocityLabel: d.velocity > 0 ? d.velocity + " / day" : "No sales",
          risk: d.risk,
          riskCls,
          stockoutDate: d.stockoutDate,
          threshold: d.threshold,
          hasQuotes: d.openQuotes > 0,
          stockBarStyle: pct(d.stockLevel),
          demand30BarStyle: pct(d.demand30),
          demand90BarStyle: pct(d.demand90),
          quotedBarStyle: pct(d.quotedUnits)
        };
      })
      .catch(() => {
        this.forecastModal = {
          ...this.forecastModal,
          isLoading: false,
          aiText: "⚠️ Could not generate forecast.",
          hasQuotes: false
        };
      });
  }

  handleCloseForecast() {
    this.forecastModal = null;
  }

  handleCloseModal() {
    this.reorderModal = null;
  }
  handleCloseQuotes() {
    this.quotesPanel = null;
  }
  stopProp(event) {
    event.stopPropagation();
  }

  _showToast(type, icon, message) {
    const cls =
      type === "success"
        ? "nswr-toast nswr-toast-success"
        : type === "error"
          ? "nswr-toast nswr-toast-error"
          : "nswr-toast nswr-toast-info";
    this.toast = { cls, icon, message };
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    window.setTimeout(() => {
      this.toast = null;
    }, 4000);
  }
}
