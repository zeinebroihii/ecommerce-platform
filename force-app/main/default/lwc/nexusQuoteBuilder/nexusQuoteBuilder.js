import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import getProducts from "@salesforce/apex/NexusQuoteController.getProducts";
import getStockForProducts from "@salesforce/apex/StockIntelligenceController.getStockForProducts";
import createQuote from "@salesforce/apex/NexusQuoteController.createQuote";
import getOpportunityQuotes from "@salesforce/apex/NexusQuoteController.getOpportunityQuotes";
import getAllQuotes from "@salesforce/apex/NexusQuoteController.getAllQuotes";
import getQuoteRequests from "@salesforce/apex/NexusQuoteController.getQuoteRequests";
import sendToCustomer from "@salesforce/apex/NexusQuoteController.sendToCustomer";
import quickSendFromRequest from "@salesforce/apex/NexusQuoteController.quickSendFromRequest";
import createVersionFromEdits from "@salesforce/apex/NexusQuoteController.createVersionFromEdits";
import convertToOrder from "@salesforce/apex/NexusQuoteController.convertToOrder";
import generateAndSendContract from "@salesforce/apex/NexusQuoteController.generateAndSendContract";
import manualFinalize from "@salesforce/apex/DocuSignWebhookController.manualFinalize";

// ── Constants ─────────────────────────────────────────────────────────────────
const BULK_DISCOUNT = 10; // 10 % applied to all B2B bulk quotes
const PAYMENT_TERMS = "Net 30";
const VALIDITY_DAYS = 30;

const NEG_STATUS_MAP = {
  Draft: "nqb-neg-badge nqb-neg-draft",
  Submitted: "nqb-neg-badge nqb-neg-sent",
  "In Negotiation": "nqb-neg-badge nqb-neg-neg",
  "Counter Received": "nqb-neg-badge nqb-neg-counter",
  Final: "nqb-neg-badge nqb-neg-final"
};

const STATUS_ACCENT = "#0f172a";

export default class NexusQuoteBuilder extends LightningElement {
  // Opportunity record page context
  @api recordId; // Opportunity Id when placed on record page

  // ── Quote list state ──────────────────────────────────────────────────────
  @track _quotes = [];
  @track _quotesResult;
  @track _quotesLoading = false;

  // ── Product search ────────────────────────────────────────────────────────
  @track _products = [];
  @track _productSearch = "";
  @track _productLoading = false;

  // ── Cart (selected products) ──────────────────────────────────────────────
  @track _cart = []; // [{product, quantity}]
  @track _stockMap = {}; // productId → { available, riskLevel }

  // ── Requests (customer-submitted) ────────────────────────────────────────
  @track _requests = [];
  @track _requestsLoading = false;
  @track _requestOppId = null; // set when building from a request
  @track _quickSendingId = null;
  @track _editFloorPrice = "";
  _autoRefreshTimer = null;

  // ── Filter state ──────────────────────────────────────────────────────────
  @track _filterSearch = "";
  @track _filterStatus = "All";
  @track _reqSearch = "";

  // ── UI state ──────────────────────────────────────────────────────────────
  @track _view = "list"; // 'list' | 'requests' | 'builder' | 'generated' | 'detail' | 'editVersion'
  @track _generating = false;
  @track _sending = false;
  @track _converting = false;
  @track _generatingContract = false;

  // ── Edit-version state (CPQ inline revision) ──────────────────────────────
  @track _editingQuoteId = null;
  @track _editLineItems = [];
  @track _editDiscount = 10;
  @track _editPaymentTerms = "Net 30";
  @track _editExpiration = "";
  @track _savingVersion = false;

  // ── Generated quote result ─────────────────────────────────────────────────
  @track _generated = null; // QuoteGenerationService.GenerateResult

  // ── Selected quote for detail view ─────────────────────────────────────────
  @track _selectedQuote = null;

  // ── Wire: load quotes ─────────────────────────────────────────────────────
  @wire(getOpportunityQuotes, { opportunityId: "$recordId" })
  wiredOppQuotes(result) {
    this._quotesResult = result;
    if (result.data) {
      this._quotes = this._enrichQuotes(result.data);
    }
    if (result.error) {
      this._quotes = [];
    }
  }

  connectedCallback() {
    if (!this.recordId) {
      this._loadAllQuotes();
      this._loadRequests();
    }
    this._loadProducts("");
  }

  _loadAllQuotes() {
    getAllQuotes()
      .then((data) => {
        this._quotes = this._enrichQuotes(data);
      })
      .catch(() => {});
  }

  _loadRequests() {
    this._requestsLoading = true;
    getQuoteRequests()
      .then((data) => {
        this._requestsLoading = false;
        this._requests = (data || []).map((r) => ({
          ...r,
          negBadgeCls: "nqb-neg-badge nqb-neg-requested",
          lineItems: r.lineItems || [],
          hasVolumeDiscount: r.volumeDiscountApplied === true,
          needsApproval: r.approvalStatus === "Pending Approval",
          hasCounterOffer:
            r.customerCounterPrice != null && r.customerCounterPrice > 0,
          counterOfferLabel:
            r.customerCounterPrice != null
              ? r.customerCounterPrice.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR"
                })
              : null
        }));
      })
      .catch((err) => {
        this._requestsLoading = false;
        this._toast(
          "Error loading requests",
          err?.body?.message ||
            err?.message ||
            "Unable to load quote requests.",
          "error"
        );
      });
  }

  _enrichQuotes(data) {
    return (data || []).map((q) => {
      const prob =
        q.acceptanceProbability != null ? q.acceptanceProbability : 0;
      const s = q.status || "";
      return {
        ...q,
        probStyle: "width:" + prob + "%",
        probColorCls:
          prob >= 80 ? "prob-high" : prob >= 60 ? "prob-mid" : "prob-low",
        negBadgeCls:
          NEG_STATUS_MAP[q.negotiationStatus] || "nqb-neg-badge nqb-neg-draft",
        versionLabel: "v" + (q.versionNumber || 1) + ".0",
        accentStyle: "background:" + STATUS_ACCENT,
        isAccepted: s === "Accepted",
        isRejected: s === "Rejected",
        isSigned: s === "Signed",
        statusBadgeCls:
          s === "Accepted" || s === "Signed"
            ? "nqb-status-badge nqb-status-accepted"
            : s === "Rejected"
              ? "nqb-status-badge nqb-status-rejected"
              : s === "Presented"
                ? "nqb-status-badge nqb-status-presented"
                : "nqb-status-badge nqb-status-draft",
        // DocuSign / Amendment / Renewal
        dsStatus: q.docuSignStatus || null,
        hasDsStatus: q.docuSignStatus && q.docuSignStatus !== "Not Sent",
        dsStatusBadgeCls:
          q.docuSignStatus === "Completed"
            ? "nqb-status-badge nqb-status-accepted"
            : q.docuSignStatus === "Declined" || q.docuSignStatus === "Voided"
              ? "nqb-status-badge nqb-status-rejected"
              : q.docuSignStatus === "Sent" || q.docuSignStatus === "Delivered"
                ? "nqb-status-badge nqb-status-presented"
                : "nqb-status-badge nqb-status-draft",
        isAmendment: q.isAmendment === true,
        isRenewal: q.isRenewal === true,
        hasMrr: q.mrr != null && q.mrr > 0,
        formattedMrr:
          q.mrr != null
            ? q.mrr.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR"
              })
            : null,
        formattedOneTime:
          q.oneTimeTotal != null
            ? q.oneTimeTotal.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR"
              })
            : null,
        formattedRecurring:
          q.recurringTotal != null
            ? q.recurringTotal.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR"
              })
            : null,
        // Negotiation enrichment
        hasVolumeDiscount: q.volumeDiscountApplied === true,
        needsApproval: q.approvalStatus === "Pending Approval",
        isManagerApproved: q.approvalStatus === "Approved",
        hasCounterOffer:
          q.customerCounterPrice != null && q.customerCounterPrice > 0,
        counterOfferLabel:
          q.customerCounterPrice != null
            ? q.customerCounterPrice.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR"
              })
            : null
      };
    });
  }

  // ── Product search ────────────────────────────────────────────────────────
  _loadProducts(term) {
    this._productLoading = true;
    getProducts({ searchTerm: term })
      .then((data) => {
        this._productLoading = false;
        this._products = (data || []).map((p) => ({
          ...p,
          inCart: this._cart.some((c) => c.product.productId === p.productId),
          addLabel: this._cart.some((c) => c.product.productId === p.productId)
            ? "✓ Added"
            : "+ Add"
        }));
      })
      .catch(() => {
        this._productLoading = false;
      });
  }

  handleProductSearch(e) {
    this._productSearch = e.target.value;
    this._loadProducts(this._productSearch);
  }

  // ── Cart operations ───────────────────────────────────────────────────────
  handleAddProduct(e) {
    const pid = e.currentTarget.dataset.id;
    const prod = this._products.find((p) => p.productId === pid);
    if (!prod) return;
    const existing = this._cart.find((c) => c.product.productId === pid);
    if (existing) {
      existing.quantity++;
      this._cart = [...this._cart];
    } else {
      this._cart = [...this._cart, { product: prod, quantity: 1 }];
    }
    this._refreshProductAddLabels();
    this._checkStock();
  }

  handleQtyChange(e) {
    const pid = e.currentTarget.dataset.id;
    const action = e.currentTarget.dataset.action;
    this._cart = this._cart.map((c) => {
      if (c.product.productId !== pid) return c;
      let qty = c.quantity;
      if (action === "inc") qty = qty + 1;
      else if (action === "dec") qty = qty - 1;
      else qty = parseInt(e.target.value, 10);
      return { ...c, quantity: qty > 0 ? qty : 1 };
    });
  }

  handleRemoveFromCart(e) {
    const pid = e.currentTarget.dataset.id;
    this._cart = this._cart.filter((c) => c.product.productId !== pid);
    this._refreshProductAddLabels();
  }

  _refreshProductAddLabels() {
    this._products = this._products.map((p) => ({
      ...p,
      inCart: this._cart.some((c) => c.product.productId === p.productId),
      addLabel: this._cart.some((c) => c.product.productId === p.productId)
        ? "✓ Added"
        : "+ Add"
    }));
  }

  // ── Computed: pricing preview ─────────────────────────────────────────────
  get subtotal() {
    return this._cart.reduce(
      (s, c) => s + (c.product.price || 0) * c.quantity,
      0
    );
  }

  get discountAmount() {
    return this.subtotal * (BULK_DISCOUNT / 100);
  }

  get grandTotal() {
    return this.subtotal - this.discountAmount;
  }

  get formattedSubtotal() {
    return this._fmt(this.subtotal);
  }
  get formattedDiscountAmount() {
    return this._fmt(this.discountAmount);
  }
  get formattedGrandTotal() {
    return this._fmt(this.grandTotal);
  }
  get paymentTermsLabel() {
    return PAYMENT_TERMS;
  }
  get bulkDiscountLabel() {
    return BULK_DISCOUNT + "%";
  }

  get cartItems() {
    return this._cart.map((c, i) => {
      const stock = this._stockMap[c.product.productId];
      const available = stock ? stock.available : null;
      const insufficient = available !== null && available < c.quantity;
      const lowStock = available !== null && available <= 10 && !insufficient;
      return {
        key: c.product.productId || String(i),
        productId: c.product.productId,
        productName: c.product.name,
        productFamily: c.product.family,
        productType: c.product.productType || null,
        billingFrequency: c.product.billingFrequency || null,
        isRecurring: c.product.productType === "Recurring",
        imageUrl: c.product.imageUrl,
        quantity: c.quantity,
        listPrice: this._fmt(c.product.price || 0),
        lineTotal: this._fmt((c.product.price || 0) * c.quantity),
        netLineTotal: this._fmt((c.product.price || 0) * c.quantity),
        stockAvailable: available,
        hasStockWarning: insufficient,
        hasStockAlert: lowStock,
        stockWarningMsg: insufficient
          ? `⚠️ Only ${available} in stock — requested ${c.quantity}`
          : lowStock
            ? `Low stock: ${available} units remaining`
            : null
      };
    });
  }

  get hasStockWarnings() {
    return this.cartItems.some((c) => c.hasStockWarning);
  }

  _checkStock() {
    const ids = this._cart.map((c) => c.product.productId).filter(Boolean);
    if (!ids.length) return;
    getStockForProducts({ productIds: ids })
      .then((checks) => {
        const map = {};
        checks.forEach((sc) => {
          map[sc.productId] = sc;
        });
        this._stockMap = map;
      })
      .catch(() => {
        /* silent — stock check is non-blocking */
      });
  }

  get hasCartItems() {
    return this._cart.length > 0;
  }
  get cartEmpty() {
    return this._cart.length === 0;
  }
  get cartCount() {
    return this._cart.length;
  }
  get canGenerate() {
    return this._cart.length > 0 && !this._generating;
  }
  get generateLabel() {
    return this._generating ? "Generating..." : "Generate Quote";
  }

  // ── View state ────────────────────────────────────────────────────────────
  get isListView() {
    return this._view === "list";
  }
  get isRequestsView() {
    return this._view === "requests";
  }
  get isBuilderView() {
    return this._view === "builder";
  }
  get isGeneratedView() {
    return this._view === "generated";
  }
  get isDetailView() {
    return this._view === "detail";
  }
  get isEditVersionView() {
    return this._view === "editVersion";
  }

  // One card per opportunity: primary or latest version wins
  get quotes() {
    const seenOpps = new Map();
    this._quotes.forEach((q) => {
      const key = q.opportunityId || q.opportunityName || q.quoteId;
      if (!seenOpps.has(key)) {
        seenOpps.set(key, q);
      } else {
        const ex = seenOpps.get(key);
        if (
          (q.isPrimary && !ex.isPrimary) ||
          (!ex.isPrimary && (q.versionNumber || 1) > (ex.versionNumber || 1))
        ) {
          seenOpps.set(key, q);
        }
      }
    });
    let list = [...seenOpps.values()];

    // Apply status filter
    if (this._filterStatus && this._filterStatus !== "All") {
      list = list.filter((q) => q.status === this._filterStatus);
    }

    // Apply search filter
    const term = (this._filterSearch || "").toLowerCase().trim();
    if (term) {
      list = list.filter(
        (q) =>
          (q.name || "").toLowerCase().includes(term) ||
          (q.accountName || "").toLowerCase().includes(term) ||
          (q.opportunityName || "").toLowerCase().includes(term)
      );
    }

    return list;
  }
  get hasQuotes() {
    return this.quotes.length > 0;
  }
  get noQuotes() {
    return this._quotes.length === 0;
  }
  get noResults() {
    return this._quotes.length > 0 && this.quotes.length === 0;
  }

  get filterStatusOptions() {
    return ["All", "Draft", "Presented", "Accepted", "Signed", "Rejected"].map(
      (s) => ({
        label: s,
        value: s,
        active: s === this._filterStatus,
        pillCls:
          s === this._filterStatus
            ? "qb-filter-pill qb-filter-pill-active"
            : "qb-filter-pill"
      })
    );
  }
  get filterSearch() {
    return this._filterSearch;
  }
  get activeFilterStatus() {
    return this._filterStatus;
  }
  get filteredCount() {
    return this.quotes.length;
  }
  get totalCount() {
    const seenOpps = new Map();
    this._quotes.forEach((q) => {
      const key = q.opportunityId || q.opportunityName || q.quoteId;
      if (!seenOpps.has(key)) seenOpps.set(key, q);
    });
    return seenOpps.size;
  }

  handleFilterSearch(e) {
    this._filterSearch = e.target.value;
  }
  handleFilterStatus(e) {
    this._filterStatus = e.currentTarget.dataset.status;
  }
  handleClearFilters() {
    this._filterSearch = "";
    this._filterStatus = "All";
  }
  get products() {
    return this._products;
  }
  get hasProducts() {
    return this._products.length > 0;
  }
  get generated() {
    return this._generated;
  }
  get selectedQuote() {
    return this._selectedQuote;
  }

  // Requests — priority sorted: counter-offers first, then new requests by value desc
  get requests() {
    const term = (this._reqSearch || "").toLowerCase().trim();
    const sendingId = this._quickSendingId;
    const respondId = this._counterRespondId;
    const now = Date.now();

    const all = this._requests
      .map((r) => {
        const hasCounter =
          r.customerCounterPrice != null && r.customerCounterPrice > 0;
        const ageMs = r.requestedAt
          ? now - new Date(r.requestedAt).getTime()
          : 0;
        const ageHours = Math.floor(ageMs / 3600000);
        const ageLabel =
          ageHours < 1
            ? "< 1h"
            : ageHours < 24
              ? ageHours + "h"
              : Math.floor(ageHours / 24) + "j";
        const round = r.negotiationRound || 0;
        const roundsLeft =
          r.roundsRemaining != null ? r.roundsRemaining : 3 - round;
        return {
          ...r,
          isQuickSending: r.quoteId === sendingId,
          showCounterForm: r.quoteId === respondId,
          hasCounter,
          ageLabel,
          priorityScore: hasCounter
            ? 1000 + (r.grandTotal || 0)
            : r.grandTotal || 0,
          roundLabel: round > 0 ? "Round " + round + "/3" : null,
          roundsLeft,
          roundsLeftLabel:
            roundsLeft === 0
              ? "Limit reached"
              : roundsLeft + " round(s) remaining",
          isFinalOffer: r.isFinalOffer === true,
          counterBadgeCls:
            "qb-req-priority-badge" +
            (hasCounter ? " qb-req-priority-counter" : " qb-req-priority-new")
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);

    if (!term) return all;
    return all.filter((r) => {
      const name = (r.name || "").toLowerCase();
      const account = (r.accountName || "").toLowerCase();
      return name.includes(term) || account.includes(term);
    });
  }
  get hasRequests() {
    return this.requests.length > 0;
  }
  get noRequests() {
    return !this._requestsLoading && this.requests.length === 0;
  }
  get noRequestResults() {
    return this._requests.length > 0 && this.requests.length === 0;
  }
  get reqFilteredCount() {
    return this.requests.length;
  }
  get reqTotalCount() {
    return this._requests.length;
  }
  get reqSearch() {
    return this._reqSearch;
  }
  get requestCount() {
    return this._requests.length;
  }
  get requestsLoading() {
    return this._requestsLoading;
  }
  handleReqSearch(e) {
    this._reqSearch = e.target.value;
  }
  handleClearReqSearch() {
    this._reqSearch = "";
  }
  get requestBadgeCls() {
    return this._requests.length > 0
      ? "nqb-req-badge nqb-req-badge-alert"
      : "nqb-req-badge";
  }
  get sendingLabel() {
    return this._sending ? "Sending..." : "Send to Client";
  }
  get sending() {
    return this._sending;
  }
  get converting() {
    return this._converting;
  }
  get convertLabel() {
    return this._converting ? "Converting..." : "Convert to Order";
  }
  get generatingContract() {
    return this._generatingContract;
  }
  get generateContractLabel() {
    return this._generatingContract
      ? "Generating..."
      : "Generate & Send Contract";
  }
  get canConvertToOrder() {
    return (
      !!this._selectedQuote &&
      (this._selectedQuote.status === "Accepted" ||
        this._selectedQuote.isAccepted)
    );
  }
  get canGenerateContract() {
    return this.canConvertToOrder;
  }
  // Hide floor price / send / revise for accepted, rejected, and signed quotes
  get canShowQuoteActions() {
    if (!this._selectedQuote) return false;
    return (
      !this._selectedQuote.isAccepted &&
      !this._selectedQuote.isRejected &&
      !this._selectedQuote.isSigned
    );
  }

  // Edit-version getters
  get editLineItems() {
    return this._editLineItems;
  }
  get editDiscount() {
    return this._editDiscount;
  }
  get editPaymentTerms() {
    return this._editPaymentTerms;
  }
  get isPaymentNet30() {
    return this._editPaymentTerms === "Net 30";
  }
  get isPaymentNet45() {
    return this._editPaymentTerms === "Net 45";
  }
  get isPaymentNet60() {
    return this._editPaymentTerms === "Net 60";
  }
  get isPaymentNet90() {
    return this._editPaymentTerms === "Net 90";
  }
  get isPaymentImmediate() {
    return this._editPaymentTerms === "Immediate";
  }
  get editExpiration() {
    return this._editExpiration;
  }
  get savingVersion() {
    return this._savingVersion;
  }
  get saveVersionLabel() {
    return this._savingVersion ? "Saving..." : "Save as New Version";
  }
  get editGrandTotal() {
    return this._editLineItems.reduce((s, li) => s + (li.netTotal || 0), 0);
  }
  get editGrandTotalFormatted() {
    return this._fmt(this.editGrandTotal);
  }

  // ── AI probability display for generated quote ────────────────────────────
  get aiProbStyle() {
    if (!this._generated) return "width:0%";
    return "width:" + (this._generated.acceptanceProbability || 0) + "%";
  }
  get aiProbColorCls() {
    const p = this._generated?.acceptanceProbability || 0;
    return p >= 80 ? "prob-high" : p >= 60 ? "prob-mid" : "prob-low";
  }
  get aiProbLabel() {
    return (this._generated?.acceptanceProbability || 0) + "%";
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  handleOpenBuilder() {
    this._cart = [];
    this._generated = null;
    this._requestOppId = null;
    this._view = "builder";
    this._loadProducts("");
  }

  handleOpenRequests() {
    this._view = "requests";
    this._loadRequests();
    // Auto-refresh every 30s while admin is on the Requests view
    this._stopAutoRefresh();
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._autoRefreshTimer = setInterval(() => {
      if (this._view === "requests" && !this._requestsLoading) {
        this._loadRequests();
      }
    }, 30000);
  }

  handleRefreshRequests() {
    this._loadRequests();
  }

  _stopAutoRefresh() {
    if (this._autoRefreshTimer) {
      clearInterval(this._autoRefreshTimer);
      this._autoRefreshTimer = null;
    }
  }

  disconnectedCallback() {
    this._stopAutoRefresh();
  }

  handleBackToList() {
    this._stopAutoRefresh();
    this._view = "list";
    this._generated = null;
    this._selectedQuote = null;
    this._requestOppId = null;
    if (this.recordId) {
      refreshApex(this._quotesResult);
    } else {
      this._loadAllQuotes();
    }
  }

  // One-click: approve the request and send the official quote to the customer
  handleQuickSend(e) {
    const quoteId = e.currentTarget.dataset.id;
    this._quickSendingId = quoteId;
    quickSendFromRequest({ requestedQuoteId: quoteId })
      .then((result) => {
        this._quickSendingId = null;
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Quote Sent ✓",
            message:
              "Quote " +
              result.quoteName +
              " sent to " +
              result.recipientEmail +
              " — the customer will receive a real-time notification.",
            variant: "success",
            mode: "sticky"
          })
        );
        // Remove the sent request from the list immediately
        this._requests = this._requests.filter((r) => r.quoteId !== quoteId);
        // Refresh all-quotes list so it appears there too
        this._loadAllQuotes();
      })
      .catch((err) => {
        this._quickSendingId = null;
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: err.body
              ? err.body.message
              : "An unexpected error occurred.",
            variant: "error"
          })
        );
      });
  }

  // ── Floor price input (set by admin when sending quote) ──────────────────
  handleFloorPriceChange(e) {
    this._editFloorPrice = e.target.value;
  }
  get editFloorPrice() {
    return this._editFloorPrice;
  }

  handleOpenDetail(e) {
    const qid = e.currentTarget.dataset.id;
    this._selectedQuote = this._quotes.find((q) => q.quoteId === qid) || null;
    this._view = "detail";
  }

  // Build an official quote pre-populated from a customer request
  handleBuildFromRequest(e) {
    const rid = e.currentTarget.dataset.id;
    const req = this._requests.find((r) => r.quoteId === rid);
    if (!req) return;

    // Pre-populate cart from the request's line items
    this._cart = (req.lineItems || []).map((li) => ({
      product: {
        productId: null,
        name: li.productName,
        family: li.productFamily || "",
        price: li.listPrice || 0,
        imageUrl: null
      },
      quantity: li.quantity || 1
    }));
    this._requestOppId = req.opportunityId;
    this._generated = null;
    this._view = "builder";
    this._loadProducts("");
  }

  // ── Quote generation ──────────────────────────────────────────────────────
  handleGenerateQuote() {
    if (!this.canGenerate) return;

    const opportunityId = this.recordId || this._requestOppId || null;
    if (!opportunityId) {
      this._toast(
        "No Opportunity Selected",
        "Open this from an Opportunity record page, or build a quote from a customer request.",
        "warning"
      );
      return;
    }

    this._generating = true;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + VALIDITY_DAYS);
    const expiryStr = expiry.toISOString().split("T")[0];

    const request = {
      opportunityId,
      bulkDiscount: BULK_DISCOUNT,
      paymentTerms: PAYMENT_TERMS,
      expirationDate: expiryStr,
      lineItems: this._cart.map((c) => ({
        product2Id: c.product.productId,
        productName: c.product.name,
        productFamily: c.product.family,
        quantity: c.quantity,
        listPrice: c.product.price || 0
      }))
    };

    createQuote({ requestJSON: JSON.stringify(request) })
      .then((result) => {
        this._generating = false;
        this._generated = result;
        this._view = "generated";
        this._toast(
          "Quote Generated!",
          "Quote " +
            result.quoteName +
            " created with " +
            result.acceptanceProbability +
            "% AI acceptance probability.",
          "success"
        );
      })
      .catch((err) => {
        this._generating = false;
        this._toast(
          "Error",
          err.body?.message || "Failed to generate quote.",
          "error"
        );
      });
  }

  get productLoading() {
    return this._productLoading;
  }

  // ── Send official quote to customer portal ────────────────────────────────
  handleSendToCustomer(e) {
    const qid =
      e.currentTarget.dataset.id ||
      (this._generated ? this._generated.quoteId : null);
    if (!qid) return;
    this._sending = true;
    const floorPrice = parseFloat(this._editFloorPrice) || null;
    sendToCustomer({ quoteId: qid, floorPrice })
      .then(() => {
        this._sending = false;
        this._editFloorPrice = "";
        this._toast(
          "Quote Sent!",
          "The customer can now view and accept the quote in their portal.",
          "success"
        );
        this._loadAllQuotes();
        this._loadRequests();
      })
      .catch((err) => {
        this._sending = false;
        this._toast("Error", err.body?.message || "Send failed.", "error");
      });
  }

  // ── Scenario 5: Open inline CPQ editor to create a revised version ────────
  handleOpenEditVersion(e) {
    const qid = e.currentTarget.dataset.id;
    const q =
      this._selectedQuote || this._quotes.find((r) => r.quoteId === qid);
    if (!q) return;

    // Pre-populate edit state from the current quote's line items
    this._editingQuoteId = qid;
    this._editLineItems = (q.lineItems || []).map((li, i) => ({
      key: li.lineItemId || String(i),
      lineItemId: li.lineItemId || null,
      productName: li.productName || "",
      productFamily: li.productFamily || "",
      quantity: li.quantity || 1,
      listPrice: li.listPrice || 0,
      unitPrice: li.unitPrice || li.listPrice || 0,
      discount: li.discount || 0,
      netTotal: li.netTotal || 0
    }));
    this._editDiscount = q.bulkDiscount != null ? q.bulkDiscount : 10;
    this._editPaymentTerms = q.paymentTerms || "Net 30";
    const exp = new Date();
    exp.setDate(exp.getDate() + 30);
    this._editExpiration = exp.toISOString().split("T")[0];
    this._view = "editVersion";
  }

  // Edit-version inline handlers
  handleEditLineQty(e) {
    const key = e.currentTarget.dataset.key;
    const val = parseInt(e.target.value, 10) || 1;
    this._editLineItems = this._editLineItems.map((li) => {
      if (li.key !== key) return li;
      return {
        ...li,
        quantity: val,
        netTotal: parseFloat((li.unitPrice * val).toFixed(2))
      };
    });
  }

  handleEditLinePrice(e) {
    const key = e.currentTarget.dataset.key;
    const lp = parseFloat(e.target.value) || 0;
    this._editLineItems = this._editLineItems.map((li) => {
      if (li.key !== key) return li;
      const disc = li.discount || 0;
      const unit = parseFloat((lp * (1 - disc / 100)).toFixed(2));
      return {
        ...li,
        listPrice: lp,
        unitPrice: unit,
        netTotal: parseFloat((unit * li.quantity).toFixed(2))
      };
    });
  }

  handleEditLineDiscount(e) {
    const key = e.currentTarget.dataset.key;
    const disc = parseFloat(e.target.value) || 0;
    this._editLineItems = this._editLineItems.map((li) => {
      if (li.key !== key) return li;
      const unit = parseFloat((li.listPrice * (1 - disc / 100)).toFixed(2));
      return {
        ...li,
        discount: disc,
        unitPrice: unit,
        netTotal: parseFloat((unit * li.quantity).toFixed(2))
      };
    });
  }

  handleEditDiscount(e) {
    this._editDiscount = parseFloat(e.target.value) || 0;
  }
  handleEditPaymentTerms(e) {
    this._editPaymentTerms = e.target.value;
  }
  handleEditExpiration(e) {
    this._editExpiration = e.target.value;
  }

  handleSaveVersion() {
    if (!this._editingQuoteId) return;
    this._savingVersion = true;
    const edits = {
      bulkDiscount: this._editDiscount,
      paymentTerms: this._editPaymentTerms,
      expirationDate: this._editExpiration,
      lineItems: this._editLineItems.map((li) => ({
        lineItemId: li.lineItemId || null,
        productName: li.productName,
        productFamily: li.productFamily,
        quantity: li.quantity,
        listPrice: li.listPrice,
        unitPrice: li.unitPrice,
        discount: li.discount,
        netTotal: li.netTotal
      }))
    };
    createVersionFromEdits({
      sourceQuoteId: this._editingQuoteId,
      editsJSON: JSON.stringify(edits)
    })
      .then((newQ) => {
        this._savingVersion = false;
        this._toast(
          "New Version Created!",
          newQ.name +
            " (v" +
            newQ.versionNumber +
            ") created with your changes. Send it to the customer.",
          "success"
        );
        this.handleBackToList();
      })
      .catch((err) => {
        this._savingVersion = false;
        this._toast(
          "Error",
          err.body?.message || "Unable to create version.",
          "error"
        );
      });
  }

  // ── Scenario 7a: Convert accepted quote to Order (simple purchase) ────────
  handleConvertToOrder(e) {
    const qid = e.currentTarget.dataset.id;
    this._converting = true;
    convertToOrder({ quoteId: qid })
      .then(() => {
        this._converting = false;
        this._toast(
          "Order Created!",
          "The quote has been converted to a Salesforce Order. Opportunity is now Closed Won.",
          "success"
        );
        this.handleBackToList();
      })
      .catch((err) => {
        this._converting = false;
        this._toast(
          "Error",
          err.body?.message || "Conversion failed.",
          "error"
        );
      });
  }

  // ── Scenario 2: Generate formal contract + send to customer for e-signature ─
  handleGenerateAndSendContract(e) {
    const qid = e.currentTarget.dataset.id;
    this._generatingContract = true;
    generateAndSendContract({ quoteId: qid })
      .then(() => {
        this._generatingContract = false;
        this._toast(
          "Contract Sent!",
          "The B2B contract has been created and sent via DocuSign. The customer must now sign it.",
          "success"
        );
        this.handleBackToList();
      })
      .catch((err) => {
        this._generatingContract = false;
        this._toast(
          "Error",
          err.body?.message || "Contract generation failed.",
          "error"
        );
      });
  }

  // ── Manual finalize (when DocuSign Connect not wired) ────────────────────────
  @track _finalizing = false;
  get canManualFinalize() {
    if (!this._selectedQuote) return false;
    const ds = this._selectedQuote.dsStatus;
    // Show when DocuSign shows Completed but Salesforce not yet updated,
    // OR when already Signed (re-sync Opp + PDF attachment).
    return (
      ds === "Sent" ||
      ds === "Delivered" ||
      ds === "Completed" ||
      this._selectedQuote.isSigned
    );
  }
  get manualFinalizeLabel() {
    if (this._finalizing) return "Syncing...";
    return this._selectedQuote?.isSigned
      ? "Re-sync (Opp + PDF)"
      : "Mark as Signed";
  }
  handleManualFinalize() {
    if (!this._selectedQuote) return;
    this._finalizing = true;
    manualFinalize({ quoteId: this._selectedQuote.quoteId })
      .then(() => {
        this._finalizing = false;
        this._toast(
          "Contract Synced!",
          "Opportunity is now Closed Won. The signed PDF will be attached shortly.",
          "success"
        );
        this.handleBackToList();
      })
      .catch((err) => {
        this._finalizing = false;
        this._toast(
          "Error",
          err.body?.message || "Finalization failed.",
          "error"
        );
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  _fmt(val) {
    return (val || 0).toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2
    });
  }

  _toast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }
}
