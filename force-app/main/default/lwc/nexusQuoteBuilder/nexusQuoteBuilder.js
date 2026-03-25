import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import getProducts from "@salesforce/apex/NexusQuoteController.getProducts";
import createQuote from "@salesforce/apex/NexusQuoteController.createQuote";
import getOpportunityQuotes from "@salesforce/apex/NexusQuoteController.getOpportunityQuotes";
import getAllQuotes from "@salesforce/apex/NexusQuoteController.getAllQuotes";
import getQuoteRequests from "@salesforce/apex/NexusQuoteController.getQuoteRequests";
import sendToCustomer from "@salesforce/apex/NexusQuoteController.sendToCustomer";
import createVersionFromEdits from "@salesforce/apex/NexusQuoteController.createVersionFromEdits";
import convertToOrder from "@salesforce/apex/NexusQuoteController.convertToOrder";
import generateAndSendContract from "@salesforce/apex/NexusQuoteController.generateAndSendContract";

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

  // ── Requests (customer-submitted) ────────────────────────────────────────
  @track _requests = [];
  @track _requestsLoading = false;
  @track _requestOppId = null; // set when building from a request

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
          lineItems: r.lineItems || []
        }));
      })
      .catch(() => {
        this._requestsLoading = false;
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
                : "nqb-status-badge nqb-status-draft"
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
  }

  handleQtyChange(e) {
    const pid = e.currentTarget.dataset.id;
    const qty = parseInt(e.target.value, 10);
    this._cart = this._cart.map((c) => {
      if (c.product.productId === pid) {
        return { ...c, quantity: qty > 0 ? qty : 1 };
      }
      return c;
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
    return this._cart.map((c, i) => ({
      key: c.product.productId || String(i),
      productId: c.product.productId,
      productName: c.product.name,
      productFamily: c.product.family,
      imageUrl: c.product.imageUrl,
      quantity: c.quantity,
      listPrice: this._fmt(c.product.price || 0),
      lineTotal: this._fmt((c.product.price || 0) * c.quantity),
      netLineTotal: this._fmt(
        (c.product.price || 0) * c.quantity * (1 - BULK_DISCOUNT / 100)
      )
    }));
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
    return [...seenOpps.values()];
  }
  get hasQuotes() {
    return this.quotes.length > 0;
  }
  get noQuotes() {
    return this.quotes.length === 0;
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

  // Requests
  get requests() {
    return this._requests;
  }
  get hasRequests() {
    return this._requests.length > 0;
  }
  get noRequests() {
    return this._requests.length === 0;
  }
  get requestCount() {
    return this._requests.length;
  }
  get requestsLoading() {
    return this._requestsLoading;
  }
  get requestBadgeCls() {
    return this._requests.length > 0
      ? "nqb-req-badge nqb-req-badge-alert"
      : "nqb-req-badge";
  }
  get sendingLabel() {
    return this._sending ? "Envoi..." : "Envoyer au Client";
  }
  get sending() {
    return this._sending;
  }
  get converting() {
    return this._converting;
  }
  get convertLabel() {
    return this._converting ? "Conversion..." : "→ Convertir en Commande";
  }
  get generatingContract() {
    return this._generatingContract;
  }
  get generateContractLabel() {
    return this._generatingContract
      ? "Génération..."
      : "📋 Générer & Envoyer Contrat";
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
  get editExpiration() {
    return this._editExpiration;
  }
  get savingVersion() {
    return this._savingVersion;
  }
  get saveVersionLabel() {
    return this._savingVersion
      ? "Enregistrement..."
      : "Enregistrer comme nouvelle version";
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
  }

  handleBackToList() {
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
    this._generating = true;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + VALIDITY_DAYS);
    const expiryStr = expiry.toISOString().split("T")[0];

    const request = {
      opportunityId: this.recordId || this._requestOppId || null,
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
    sendToCustomer({ quoteId: qid })
      .then(() => {
        this._sending = false;
        this._toast(
          "Devis envoyé !",
          "Le client peut maintenant voir et accepter le devis dans son portail.",
          "success"
        );
        this._loadAllQuotes();
        this._loadRequests();
      })
      .catch((err) => {
        this._sending = false;
        this._toast("Erreur", err.body?.message || "Envoi échoué.", "error");
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
          "Nouvelle version créée !",
          newQ.name +
            " (v" +
            newQ.versionNumber +
            ") créée avec vos modifications. Envoyez-la au client.",
          "success"
        );
        this.handleBackToList();
      })
      .catch((err) => {
        this._savingVersion = false;
        this._toast(
          "Erreur",
          err.body?.message || "Impossible de créer la version.",
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
          "Commande créée !",
          "Le devis a été converti en Commande Salesforce. L'opportunité est passée en Closed Won.",
          "success"
        );
        this.handleBackToList();
      })
      .catch((err) => {
        this._converting = false;
        this._toast(
          "Erreur",
          err.body?.message || "Conversion échouée.",
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
          "Contrat envoyé au client !",
          "Le contrat B2B a été créé et envoyé par email. Le client doit maintenant le signer dans son portail.",
          "success"
        );
        this.handleBackToList();
      })
      .catch((err) => {
        this._generatingContract = false;
        this._toast(
          "Erreur",
          err.body?.message || "Génération du contrat échouée.",
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
