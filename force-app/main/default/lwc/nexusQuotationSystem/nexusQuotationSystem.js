import { LightningElement, wire, track } from "lwc";
import { getRecord } from "lightning/uiRecordApi";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import userId from "@salesforce/user/Id";
import USER_ACCOUNT_FIELD from "@salesforce/schema/User.AccountId";
import getAccountQuotes from "@salesforce/apex/QuoteController.getAccountQuotes";
import processQuoteDecision from "@salesforce/apex/QuoteController.processQuoteDecision";
import requestQuote from "@salesforce/apex/QuoteController.requestQuote";
import finalizeContractSign from "@salesforce/apex/NexusQuoteController.finalizeContractSign";

// ── Status maps ──────────────────────────────────────────────────────────────
const PROB_MAP = {
  Draft: 20,
  Sent: 40,
  Presented: 65,
  Negotiation: 75,
  Accepted: 90,
  Signed: 100,
  Rejected: 0
};
const BADGE_MAP = {
  Draft: "nqs-badge nqs-badge-secondary",
  Sent: "nqs-badge nqs-badge-warning",
  Presented: "nqs-badge nqs-badge-primary",
  Negotiation: "nqs-badge nqs-badge-primary",
  Accepted: "nqs-badge nqs-badge-success",
  Signed: "nqs-badge nqs-badge-success",
  Rejected: "nqs-badge nqs-badge-danger"
};
const MODAL_BADGE_MAP = {
  Draft: "nqs-modal-badge nqs-modal-badge-secondary",
  Sent: "nqs-modal-badge nqs-modal-badge-warning",
  Presented: "nqs-modal-badge nqs-modal-badge-primary",
  Negotiation: "nqs-modal-badge nqs-modal-badge-primary",
  Accepted: "nqs-modal-badge nqs-modal-badge-success",
  Signed: "nqs-modal-badge nqs-modal-badge-success",
  Rejected: "nqs-modal-badge nqs-modal-badge-danger"
};

// ── Mock quotes (shown when no Salesforce data) ───────────────────────────────
const MOCK_QUOTES = [
  {
    quoteId: "MOCK-001",
    name: "QT-2024-001",
    status: "Accepted",
    grandTotal: 12500,
    formattedTotal: "$12,500",
    expirationDate: "10 MARS 2024",
    opportunityName: "Nexus Enterprise Deal",
    description:
      "Enterprise infrastructure upgrade including core systems and cloud synchronization.",
    probability: 98,
    canDecide: false,
    isAccepted: true,
    isRejected: false,
    isMock: true,
    date: "March 10, 2024",
    currentVersion: 2,
    contractStatus: "Pending Signature",
    versions: [
      {
        version: 1,
        date: "March 01, 2024",
        total: 13800,
        status: "Sent",
        products: [
          {
            product: {
              id: "p1",
              name: "Nexus Core Pro",
              family: "Hardware",
              price: 8500,
              image: "https://picsum.photos/seed/core/400/400"
            },
            quantity: 1
          },
          {
            product: {
              id: "p2",
              name: "Cloud Sync Module",
              family: "Software",
              price: 5300,
              image: "https://picsum.photos/seed/cloud/400/400"
            },
            quantity: 1
          }
        ]
      },
      {
        version: 2,
        date: "March 05, 2024",
        total: 12500,
        status: "Negotiation",
        products: [
          {
            product: {
              id: "p1",
              name: "Nexus Core Pro",
              family: "Hardware",
              price: 8500,
              image: "https://picsum.photos/seed/core/400/400"
            },
            quantity: 1
          },
          {
            product: {
              id: "p2",
              name: "Cloud Sync Module",
              family: "Software",
              price: 4000,
              image: "https://picsum.photos/seed/cloud/400/400"
            },
            quantity: 1
          }
        ]
      }
    ],
    messages: [
      {
        id: "m1",
        sender: "rep",
        text: "Bonjour ! J'ai mis à jour le devis avec la remise volume de 10% demandée.",
        time: "10:30"
      },
      {
        id: "m2",
        sender: "user",
        text: "Thank you Sarah. Could you also review the maintenance terms?",
        time: "11:15"
      }
    ]
  },
  {
    quoteId: "MOCK-002",
    name: "QT-2024-002",
    status: "Negotiation",
    grandTotal: 8900,
    formattedTotal: "$8,900",
    expirationDate: "MARCH 15, 2024",
    opportunityName: "Edge Computing Project",
    description:
      "Nœuds de calcul distribué pour intelligence en périphérie de réseau.",
    probability: 72,
    canDecide: true,
    isAccepted: false,
    isRejected: false,
    isMock: true,
    date: "March 15, 2024",
    currentVersion: 1,
    contractStatus: null,
    versions: [
      {
        version: 1,
        date: "Feb 28, 2024",
        total: 4200,
        status: "Accepted",
        products: [
          {
            product: {
              id: "p3",
              name: "Edge Node v2",
              family: "Hardware",
              price: 2100,
              image: "https://picsum.photos/seed/edge/400/400"
            },
            quantity: 2
          }
        ]
      }
    ],
    messages: []
  }
];

export default class NexusQuotationSystem extends LightningElement {
  // ── Salesforce data ────────────────────────────────────────────────────────
  @track accountId;
  @track _quotes = [];
  @track _quotesWireResult;
  @track _sfDataLoaded = false;

  // ── List state ────────────────────────────────────────────────────────────
  @track filter = "All";

  // ── Detail modal state ────────────────────────────────────────────────────
  @track _selectedQuoteId = null;
  @track _modalTab = "details";
  @track _messages = [];
  @track _messageInput = "";
  @track _msgCounter = 0;
  @track _expandedVersion = null;

  // ── Accept/Sign state ─────────────────────────────────────────────────────
  @track _isSigning = false;
  @track _isContractSigning = false; // true = signing formal contract; false = accepting quote
  @track _signature = "";
  @track _isDeciding = false;

  // ── Reject state ──────────────────────────────────────────────────────────
  @track _showRejectForm = false;
  @track _rejectReason = "";

  // ── New quote request form ─────────────────────────────────────────────────
  @track _showNewForm = false;
  @track _formStep = "form";
  @track _formCompany = "";
  @track _formEmail = "";
  @track _formQty = "10";
  @track _formMessage = "";
  @track _formSubmitting = false;

  // ── Wires ─────────────────────────────────────────────────────────────────
  @wire(getRecord, { recordId: userId, fields: [USER_ACCOUNT_FIELD] })
  wiredUser({ data }) {
    if (data) this.accountId = data.fields.AccountId.value;
  }

  @wire(getAccountQuotes, { accountId: "$accountId" })
  wiredQuotes(result) {
    this._quotesWireResult = result;
    if (result.data) {
      this._sfDataLoaded = true;
      this._quotes = result.data.length > 0 ? result.data : MOCK_QUOTES;
    }
    if (result.error) {
      this._sfDataLoaded = true;
      this._quotes = MOCK_QUOTES;
    }
  }

  // Fallback: if wire never fires (e.g. no accountId), use mocks
  get activeQuotes() {
    return this._sfDataLoaded ? this._quotes : MOCK_QUOTES;
  }

  // ── Computed: filter options ───────────────────────────────────────────────
  get filterOptions() {
    const labels = {
      All: "ALL",
      Accepted: "ACCEPTED",
      Sent: "SENT",
      Draft: "DRAFT"
    };
    return ["All", "Accepted", "Sent", "Draft"].map((f) => ({
      id: f,
      label: labels[f],
      cls:
        this.filter === f
          ? "nqs-filter-btn nqs-filter-active"
          : "nqs-filter-btn"
    }));
  }

  // ── Computed: quote list (one card per opportunity — primary/latest version) ─
  get filteredQuotes() {
    const allQuotes = this.activeQuotes;

    // Deduplicate by opportunity: keep primary, or highest versionNumber
    const seenOpps = new Map();
    allQuotes.forEach((q) => {
      // Mock data has no opportunityId; use opportunityName as fallback, else quoteId
      const oppKey = q.opportunityId || q.opportunityName || q.quoteId;
      if (!seenOpps.has(oppKey)) {
        seenOpps.set(oppKey, q);
      } else {
        const existing = seenOpps.get(oppKey);
        const qVer = q.versionNumber || 1;
        const exVer = existing.versionNumber || 1;
        // Prefer the primary flag; on tie prefer higher version
        if (
          (q.isPrimary && !existing.isPrimary) ||
          (!existing.isPrimary && qVer > exVer)
        ) {
          seenOpps.set(oppKey, q);
        }
      }
    });

    return [...seenOpps.values()]
      .filter((q) => this.filter === "All" || q.status === this.filter)
      .map((q) => {
        const agentforceProb =
          q.acceptanceProbability != null ? q.acceptanceProbability : null;
        const prob =
          agentforceProb != null
            ? agentforceProb
            : q.probability || PROB_MAP[q.status] || 20;
        const probColorCls =
          prob >= 80
            ? "nqs-prob-high"
            : prob >= 60
              ? "nqs-prob-mid"
              : "nqs-prob-low";
        return {
          ...q,
          probability: prob,
          hasAgentforceScore: agentforceProb != null,
          probLabel: agentforceProb != null ? "AGENTFORCE AI" : "PROBABILITY",
          probColorCls,
          badgeCls: BADGE_MAP[q.status] || "nqs-badge nqs-badge-secondary",
          displayTotal: q.formattedTotal || "—",
          displayDate: q.expirationDate || "—",
          probWidth: "width:" + prob + "%"
        };
      });
  }

  get isEmpty() {
    return this.filteredQuotes.length === 0;
  }
  get hasQuotes() {
    return this.filteredQuotes.length > 0;
  }

  // ── Computed: selected quote ───────────────────────────────────────────────
  get selectedQuote() {
    if (!this._selectedQuoteId) return null;
    const q = this.activeQuotes.find(
      (r) => r.quoteId === this._selectedQuoteId
    );
    if (!q) return null;
    // Use real AI score from SF when available, otherwise fall back to status map
    const sfProb =
      q.acceptanceProbability != null ? q.acceptanceProbability : null;
    const prob =
      sfProb != null ? sfProb : q.probability || PROB_MAP[q.status] || 20;
    const gross = q.grandTotal || 0;
    const disc = q.bulkDiscount != null ? q.bulkDiscount : 10;
    const probColorCls =
      prob >= 80
        ? "nqs-ai-bar nqs-ai-bar-high"
        : prob >= 60
          ? "nqs-ai-bar nqs-ai-bar-mid"
          : "nqs-ai-bar nqs-ai-bar-low";
    return {
      ...q,
      probability: prob,
      hasAgentforceScore: sfProb != null,
      aiReason: q.aiReason || null,
      probStyle: "width:" + prob + "%",
      probColorCls,
      displayTotal: q.formattedTotal || "—",
      displayDate: q.expirationDate || "—",
      discountAmount: (gross * (disc / 100)).toFixed(2) + " €",
      discountedTotal: (gross * (1 - disc / 100)).toFixed(2) + " €",
      badgeCls:
        MODAL_BADGE_MAP[q.status] ||
        "nqs-modal-badge nqs-modal-badge-secondary",
      versionLabel: q.versionNumber
        ? "v" + q.versionNumber + ".0"
        : q.currentVersion
          ? "v" + q.currentVersion + ".0"
          : "v1.0",
      versionCount: q.versions ? q.versions.length : 0
    };
  }

  get showDetailModal() {
    return !!this._selectedQuoteId;
  }
  get showSigningModal() {
    return this._isSigning;
  }
  get showRejectForm() {
    return this._showRejectForm;
  }
  get isContractSigning() {
    return this._isContractSigning;
  }

  // Show "Sign Contract" only after admin has sent the formal contract (NegotiationStatus = 'Final')
  get showSignFinalContract() {
    const q = this.selectedQuote;
    return q && q.status === "Accepted" && q.negotiationStatus === "Final";
  }

  // Show "Contract sent — awaiting your signature" banner when waiting for customer
  get showContractPendingBanner() {
    const q = this.selectedQuote;
    return q && q.status === "Accepted" && q.negotiationStatus !== "Final";
  }

  // ── Computed: modal tabs ───────────────────────────────────────────────────
  get isDetailsTab() {
    return this._modalTab === "details";
  }
  get isMessagesTab() {
    return this._modalTab === "messages";
  }
  get isHistoryTab() {
    return this._modalTab === "history";
  }

  get tabDetailsCls() {
    return this._modalTab === "details"
      ? "nqs-mtab nqs-mtab-active"
      : "nqs-mtab";
  }
  get tabMessagesCls() {
    return this._modalTab === "messages"
      ? "nqs-mtab nqs-mtab-active"
      : "nqs-mtab";
  }
  get tabHistoryCls() {
    return this._modalTab === "history"
      ? "nqs-mtab nqs-mtab-active"
      : "nqs-mtab";
  }

  get tabDetailsVariant() {
    return this._modalTab === "details" ? "inverse" : "";
  }
  get tabMessagesVariant() {
    return this._modalTab === "messages" ? "inverse" : "";
  }
  get tabHistoryVariant() {
    return this._modalTab === "history" ? "inverse" : "";
  }

  // ── Computed: product table ────────────────────────────────────────────────
  get selectedQuoteCurrentVersion() {
    const q = this.selectedQuote;
    if (!q || !q.versions || !q.versions.length) return null;
    return (
      q.versions.find((v) => v.version === q.currentVersion) ||
      q.versions[q.versions.length - 1]
    );
  }

  get selectedQuoteProducts() {
    const q = this.selectedQuote;
    if (!q) return [];

    // Real Salesforce data — use lineItems from QuoteController wrapper
    if (!q.isMock && q.lineItems && q.lineItems.length > 0) {
      return q.lineItems.map((li, i) => ({
        key: String(i),
        productName: li.productName || "—",
        productFamily: li.productFamily || "—",
        productImage: null,
        quantity: li.quantity,
        unitPrice: this._fmtCurrency(li.unitPrice || li.listPrice),
        totalPrice: this._fmtCurrency(li.netTotal)
      }));
    }

    // Mock data fallback — use versions structure
    const v = this.selectedQuoteCurrentVersion;
    if (!v || !v.products) return [];
    return v.products.map((item, i) => ({
      key: item.product.id || String(i),
      productName: item.product.name,
      productFamily: item.product.family,
      productImage: item.product.image,
      quantity: item.quantity,
      unitPrice: "$" + item.product.price.toLocaleString("fr-FR"),
      totalPrice:
        "$" + (item.product.price * item.quantity).toLocaleString("fr-FR")
    }));
  }

  _fmtCurrency(val) {
    if (val == null) return "—";
    return Number(val).toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2
    });
  }

  get selectedQuoteHasProducts() {
    return this.selectedQuoteProducts.length > 0;
  }

  // ── Computed: version history ──────────────────────────────────────────────
  get selectedQuoteVersions() {
    const q = this.selectedQuote;
    if (!q) return [];

    // ── Real Salesforce data: derive versions from all quotes with same opportunity
    if (!q.isMock && (q.opportunityId || q.opportunityName)) {
      const oppKey = q.opportunityId || q.opportunityName;
      const all = this.activeQuotes
        .filter((r) => (r.opportunityId || r.opportunityName) === oppKey)
        .sort((a, b) => (b.versionNumber || 1) - (a.versionNumber || 1));
      if (all.length <= 1) return [];
      return all.map((r) => {
        const isCurrent = r.quoteId === this._selectedQuoteId;
        return {
          key: r.quoteId,
          quoteId: r.quoteId,
          isSfVersion: true,
          version: r.versionNumber || 1,
          versionLabel: "v" + (r.versionNumber || 1) + ".0",
          date: r.expirationDate || "—",
          displayTotal: r.formattedTotal || "—",
          status: r.status,
          isCurrentVersion: isCurrent,
          iconCls: isCurrent ? "nqs-vh-icon nqs-vh-icon-active" : "nqs-vh-icon"
        };
      });
    }

    // ── Mock data: use embedded versions array
    if (!q.versions || !q.versions.length) return [];
    return [...q.versions].reverse().map((v) => ({
      key: String(v.version),
      quoteId: null,
      isSfVersion: false,
      version: v.version,
      versionLabel: "v" + v.version + ".0",
      date: v.date,
      displayTotal: "$" + v.total.toLocaleString("fr-FR"),
      status: v.status,
      isCurrentVersion: v.version === q.currentVersion,
      iconCls:
        v.version === q.currentVersion
          ? "nqs-vh-icon nqs-vh-icon-active"
          : "nqs-vh-icon",
      isExpanded: this._expandedVersion === v.version,
      expandBtnLabel:
        this._expandedVersion === v.version ? "▲ Masquer" : "▼ Détails",
      expandProducts: (v.products || []).map((p, i) => ({
        key: p.product.id || String(i),
        productName: p.product.name + " ×" + p.quantity,
        lineTotal: "$" + (p.product.price * p.quantity).toLocaleString("fr-FR")
      }))
    }));
  }

  get selectedQuoteHasVersions() {
    return this.selectedQuoteVersions.length > 0;
  }

  // ── Computed: messages ─────────────────────────────────────────────────────
  get hasMessages() {
    return this._messages.length > 0;
  }
  get formattedMessages() {
    return this._messages.map((m) => ({
      ...m,
      rowCls:
        m.sender === "user" ? "nqs-msg-row nqs-msg-row-user" : "nqs-msg-row",
      bubbleCls:
        m.sender === "user"
          ? "nqs-bubble nqs-bubble-user"
          : "nqs-bubble nqs-bubble-rep",
      timeCls:
        m.sender === "user" ? "nqs-msg-time nqs-msg-time-user" : "nqs-msg-time",
      avatarCls:
        m.sender === "user"
          ? "nqs-avatar nqs-avatar-user"
          : "nqs-avatar nqs-avatar-rep",
      avatarInitial: m.sender === "user" ? "M" : "S"
    }));
  }

  // ── Computed: misc ─────────────────────────────────────────────────────────
  get signDisabled() {
    return !this._signature.trim() || this._isDeciding;
  }
  get decideDisabled() {
    return this._isDeciding;
  }
  get formCompany() {
    return this._formCompany;
  }
  get formEmail() {
    return this._formEmail;
  }
  get formQty() {
    return this._formQty;
  }
  get formMessage() {
    return this._formMessage;
  }
  get formSubmitting() {
    return this._formSubmitting;
  }
  get formSubmitLabel() {
    return this._formSubmitting ? "Envoi en cours..." : "Soumettre la Demande";
  }
  get messageInput() {
    return this._messageInput;
  }
  get signature() {
    return this._signature;
  }
  get rejectReason() {
    return this._rejectReason;
  }
  get showNewForm() {
    return this._showNewForm;
  }
  get isFormStep() {
    return this._formStep === "form";
  }
  get isSuccessStep() {
    return this._formStep === "success";
  }

  // ── Handlers: filter ──────────────────────────────────────────────────────
  handleFilterChange(e) {
    this.filter = e.currentTarget.dataset.id;
  }

  // ── Handlers: detail modal ────────────────────────────────────────────────
  handleOpenDetail(e) {
    const id = e.currentTarget.dataset.id;
    this._selectedQuoteId = id;
    this._modalTab = "details";
    this._isSigning = false;
    this._signature = "";
    this._showRejectForm = false;
    this._rejectReason = "";
    this._expandedVersion = null;
    // Seed messages from quote data (mock initial conversation)
    const q = this.activeQuotes.find((r) => r.quoteId === id);
    this._messages =
      q && q.messages
        ? q.messages.map((m, i) => ({ ...m, id: m.id || String(i) }))
        : [];
    this._msgCounter = this._messages.length;
    this._messageInput = "";
  }
  handleCloseDetail() {
    this._selectedQuoteId = null;
  }
  handleStopProp(e) {
    e.stopPropagation();
  }

  // ── Handlers: modal tabs ──────────────────────────────────────────────────
  handleTabDetails() {
    this._modalTab = "details";
  }
  handleTabMessages() {
    this._modalTab = "messages";
  }
  handleTabHistory() {
    this._modalTab = "history";
  }

  // ── Handlers: version toggle (mock) / view version (SF) ──────────────────
  handleToggleVersion(e) {
    const v = parseInt(e.currentTarget.dataset.version, 10);
    this._expandedVersion = this._expandedVersion === v ? null : v;
  }

  // Switch the modal to show a different version's details
  handleViewVersion(e) {
    const qid = e.currentTarget.dataset.id;
    if (!qid) return;
    this._selectedQuoteId = qid;
    this._modalTab = "details";
    this._isSigning = false;
    this._showRejectForm = false;
    this._signature = "";
  }

  // ── Handlers: messages ────────────────────────────────────────────────────
  handleMessageInput(e) {
    this._messageInput = e.target.value;
  }
  handleMessageKeydown(e) {
    if (e.key === "Enter") this._sendMessage();
  }
  handleSendMessage() {
    this._sendMessage();
  }

  _sendMessage() {
    const txt = this._messageInput.trim();
    if (!txt) return;
    this._messages = [
      ...this._messages,
      {
        id: String(++this._msgCounter),
        sender: "user",
        text: txt,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit"
        })
      }
    ];
    this._messageInput = "";
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      this._messages = [
        ...this._messages,
        {
          id: String(++this._msgCounter),
          sender: "rep",
          text: "Thank you for your message. Our sales team will get back to you shortly.",
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
          })
        }
      ];
    }, 1500);
  }

  // ── Handlers: PDF ─────────────────────────────────────────────────────────
  handleDownloadPDF() {
    this._toast("PDF", "Génération du PDF en cours...", "info");
  }
  handleDownloadPDFCard(e) {
    e.stopPropagation();
    this._toast("PDF", "Génération du PDF en cours...", "info");
  }

  // ── Handlers: accept / sign ───────────────────────────────────────────────

  // Quote acceptance (status: Presented → Accepted)
  handleAcceptQuote() {
    this._isContractSigning = false;
    this._isSigning = true;
  }

  // Final contract signing (status: Accepted + negotiationStatus: Final → Signed)
  handleSignFinalContract() {
    this._isContractSigning = true;
    this._isSigning = true;
  }

  handleSignatureInput(e) {
    this._signature = e.target.value;
  }

  handleCancelSign() {
    this._isSigning = false;
    this._isContractSigning = false;
    this._signature = "";
  }

  handleConfirmSign() {
    if (this._isMock(this._selectedQuoteId)) {
      this._updateMockStatus(this._selectedQuoteId, "Signed");
      this._isSigning = false;
      this._isContractSigning = false;
      this._signature = "";
      this._selectedQuoteId = null;
      this._toast(
        "Contrat Signé ✓",
        "Votre signature a été enregistrée.",
        "success"
      );
      return;
    }

    this._isDeciding = true;

    if (this._isContractSigning) {
      // Customer signs the formal B2B contract → closes deal + sends invoice
      finalizeContractSign({ quoteId: this._selectedQuoteId })
        .then(() => {
          this._isSigning = false;
          this._isContractSigning = false;
          this._signature = "";
          return refreshApex(this._quotesWireResult);
        })
        .then(() => {
          this._isDeciding = false;
          this._selectedQuoteId = null;
          this._toast(
            "Contrat Signé ✓",
            "Votre contrat B2B est signé. La facture vous a été envoyée par email.",
            "success"
          );
        })
        .catch((err) => {
          this._isDeciding = false;
          this._toast(
            "Erreur",
            err.body?.message || "Une erreur est survenue.",
            "error"
          );
        });
    } else {
      // Customer accepts the quote (Presented → Accepted)
      processQuoteDecision({
        quoteId: this._selectedQuoteId,
        decision: "Accepted",
        reason: ""
      })
        .then(() => {
          this._isSigning = false;
          this._signature = "";
          return refreshApex(this._quotesWireResult);
        })
        .then(() => {
          this._isDeciding = false;
          this._selectedQuoteId = null;
          this._toast(
            "Devis Accepté ✓",
            "Votre acceptation a été enregistrée. Notre équipe va vous préparer le contrat.",
            "success"
          );
        })
        .catch((err) => {
          this._isDeciding = false;
          this._toast(
            "Erreur",
            err.body?.message || "Une erreur est survenue.",
            "error"
          );
        });
    }
  }

  // ── Handlers: reject ──────────────────────────────────────────────────────
  handleShowRejectForm() {
    this._showRejectForm = true;
  }
  handleRejectReason(e) {
    this._rejectReason = e.target.value;
  }
  handleCancelReject() {
    this._showRejectForm = false;
    this._rejectReason = "";
  }

  handleConfirmReject() {
    if (this._isMock(this._selectedQuoteId)) {
      this._updateMockStatus(this._selectedQuoteId, "Rejected");
      this._showRejectForm = false;
      this._rejectReason = "";
      this._selectedQuoteId = null;
      this._toast("Quote Rejected", "Your decision has been recorded.", "info");
      return;
    }
    this._isDeciding = true;
    processQuoteDecision({
      quoteId: this._selectedQuoteId,
      decision: "Rejected",
      reason: this._rejectReason
    })
      .then(() => {
        this._showRejectForm = false;
        this._rejectReason = "";
        return refreshApex(this._quotesWireResult);
      })
      .then(() => {
        this._isDeciding = false;
        this._selectedQuoteId = null;
        this._toast(
          "Quote Rejected",
          "Your decision has been recorded.",
          "info"
        );
      })
      .catch((err) => {
        this._isDeciding = false;
        this._toast(
          "Error",
          err.body?.message || "An error occurred.",
          "error"
        );
      });
  }

  // ── Handlers: new quote form ───────────────────────────────────────────────
  handleOpenNewForm() {
    this._showNewForm = true;
    this._formStep = "form";
  }
  handleCloseNewForm() {
    this._showNewForm = false;
    this._formStep = "form";
    this._formCompany = "";
    this._formEmail = "";
    this._formQty = "10";
    this._formMessage = "";
    this._formSubmitting = false;
  }
  handleFormCompany(e) {
    this._formCompany = e.target.value;
  }
  handleFormEmail(e) {
    this._formEmail = e.target.value;
  }
  handleFormQty(e) {
    this._formQty = e.target.value;
  }
  handleFormMessage(e) {
    this._formMessage = e.target.value;
  }

  handleFormSubmit(e) {
    e.preventDefault();
    this._formSubmitting = true;
    requestQuote({
      companyName: this._formCompany,
      email: this._formEmail,
      qty: this._formQty,
      message: this._formMessage
    })
      .then(() => {
        this._formSubmitting = false;
        this._formStep = "success";
      })
      .catch((err) => {
        this._formSubmitting = false;
        this._toast(
          "Error",
          err.body?.message || "An error occurred.",
          "error"
        );
      });
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  _isMock(id) {
    return id && String(id).startsWith("MOCK-");
  }

  _updateMockStatus(id, newStatus) {
    this._quotes = this.activeQuotes.map((q) => {
      if (q.quoteId === id) {
        return {
          ...q,
          status: newStatus,
          canDecide: false,
          isAccepted: newStatus === "Signed" || newStatus === "Accepted",
          isRejected: newStatus === "Rejected"
        };
      }
      return q;
    });
    this._sfDataLoaded = true;
  }

  _toast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }
}
