import { LightningElement, wire, track, api } from "lwc";
import { getRecord } from "lightning/uiRecordApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import userId from "@salesforce/user/Id";
import USER_ACCOUNT_FIELD from "@salesforce/schema/User.AccountId";
import getAccountQuotes from "@salesforce/apex/QuoteController.getAccountQuotes";
import processQuoteDecision from "@salesforce/apex/QuoteController.processQuoteDecision";
import requestQuote from "@salesforce/apex/QuoteController.requestQuote";
import getSignedContractBase64 from "@salesforce/apex/QuoteController.getSignedContractBase64";
import submitCounterOffer from "@salesforce/apex/QuoteController.submitCounterOffer";
import getQuoteSettings from "@salesforce/apex/NexusQuoteController.getQuoteSettings";
import postCustomerMessage from "@salesforce/apex/NexusQuoteController.postCustomerMessage";

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

export default class NexusQuotationSystem extends LightningElement {
  // ── Salesforce data ────────────────────────────────────────────────────────
  @track accountId;
  @track _quotes = [];
  @track _sfDataLoaded = false;

  // ── Quote settings (CMT — fallback when no per-quote terms stored) ────────
  @track _quoteSettings = null;

  @wire(getQuoteSettings)
  wiredSettings({ data }) {
    if (data) this._quoteSettings = data;
  }

  // Per-quote T&Cs: prefer what was set in the builder and stored on the record;
  // fall back to the CMT global default only when the quote has none.
  get generalTerms() {
    const q = this.selectedQuote;
    if (q && q.generalTerms) return q.generalTerms;
    return this._quoteSettings ? this._quoteSettings.generalTerms : null;
  }
  get hasGeneralTerms() {
    return !!this.generalTerms;
  }
  get signatureDeadlineLabel() {
    const q = this.selectedQuote;
    const days =
      q && q.signatureDeadlineDays != null
        ? q.signatureDeadlineDays
        : this._quoteSettings
          ? this._quoteSettings.signatureDeadlineDays
          : 14;
    return days ? days + " days after contract is sent" : null;
  }

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
  @track _isDeciding = false;

  // ── Testimonial popup (shown after acceptance) ────────────────────────────
  @track _showTestimonialForm = false;
  @track _testimonialQuoteId = null;
  @track _testimonialQuoteName = "";

  // ── Reject state ──────────────────────────────────────────────────────────
  @track _showRejectForm = false;
  @track _rejectReason = "";

  // ── Counter-offer state ───────────────────────────────────────────────────
  @track _showCounterForm = false;
  @track _counterPrice = "";
  @track _counterMessage = "";
  @track _counterSubmitting = false;

  // ── Unread message tracking ───────────────────────────────────────────────
  @track _seenCounts = {}; // quoteId → message count when Messages tab last opened
  @track _floatingNotif = null; // { quoteId, quoteName } when new sales msg arrives
  _prevMsgCounts = {}; // quoteId → count on last wire result (not reactive)
  _msgPollTimer = null; // interval handle for real-time message polling

  // ── New quote request form ─────────────────────────────────────────────────
  @track _showNewForm = false;
  @track _formStep = "form";
  @track _formCompany = "";
  @track _formEmail = "";
  @track _formQty = "10";
  @track _formMessage = "";
  @track _formSubmitting = false;

  // ── Public API: refresh trigger from parent ────────────────────────────────
  @api
  set refreshTrigger(val) {
    if (val > 0) this._loadQuotes();
  }
  get refreshTrigger() {
    return this._refreshTrigger || 0;
  }

  // ── Wires ─────────────────────────────────────────────────────────────────
  @wire(getRecord, { recordId: userId, fields: [USER_ACCOUNT_FIELD] })
  wiredUser({ data }) {
    if (data) {
      this.accountId = data.fields.AccountId.value;
      this._loadQuotes();
    }
  }

  disconnectedCallback() {
    this._stopMsgPoll();
  }

  _loadQuotes() {
    if (!this.accountId) return;
    getAccountQuotes({ accountId: this.accountId })
      .then((data) => {
        this._sfDataLoaded = true;
        data.forEach((q) => {
          if (!q.messageThread) return;
          let msgs;
          try {
            msgs = JSON.parse(q.messageThread);
          } catch {
            return;
          }
          const prev = this._prevMsgCounts[q.quoteId] || 0;
          const curr = msgs.length;
          if (prev > 0 && curr > prev) {
            const newest = msgs[curr - 1];
            if (
              newest &&
              newest.sender === "sales" &&
              this._selectedQuoteId !== q.quoteId
            ) {
              this._floatingNotif = { quoteId: q.quoteId, quoteName: q.name };
            }
          }
          this._prevMsgCounts[q.quoteId] = curr;
        });
        this._quotes = data;
        // If messages tab is open, sync _messages from server (picks up new sales replies)
        if (this._modalTab === "messages" && this._selectedQuoteId) {
          const q = data.find((r) => r.quoteId === this._selectedQuoteId);
          if (q) {
            const serverMsgs = this._parseThread(q.messageThread);
            // Keep any optimistic messages not yet confirmed by the server
            const serverIds = new Set(serverMsgs.map((m) => m.id));
            const optimistics = this._messages.filter(
              (m) => m.id.startsWith("opt-") && !serverIds.has(m.id)
            );
            this._messages = [...serverMsgs, ...optimistics];
          }
        }
      })
      .catch(() => {
        this._sfDataLoaded = true;
        this._quotes = [];
      });
  }

  get isLoading() {
    return !this._sfDataLoaded;
  }

  // Show nothing while loading — mocks only appear after load if no real data
  get activeQuotes() {
    return this._sfDataLoaded ? this._quotes : [];
  }

  // ── Computed: filter options ───────────────────────────────────────────────
  get filterOptions() {
    const labels = {
      All: "ALL",
      Presented: "PRESENTED",
      Signed: "SIGNED",
      Accepted: "ACCEPTED",
      Rejected: "REJECTED"
    };
    return ["All", "Presented", "Signed", "Accepted", "Rejected"].map((f) => ({
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

    return allQuotes
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
          probWidth: "width:" + prob + "%",
          hasUnreadMsg: this._salesUnreadFor(q.quoteId) > 0
        };
      });
  }

  get isEmpty() {
    return this._sfDataLoaded && this.filteredQuotes.length === 0;
  }
  get hasQuotes() {
    return this.filteredQuotes.length > 0;
  }

  // ── Unread message helpers ─────────────────────────────────────────────────
  _salesUnreadFor(quoteId) {
    const q = this.activeQuotes.find((r) => r.quoteId === quoteId);
    if (!q || !q.messageThread) return 0;
    const msgs = this._parseThread(q.messageThread);
    let lastCustIdx = -1;
    msgs.forEach((m, i) => {
      if (m.sender === "customer" || m.sender === "user") lastCustIdx = i;
    });
    return msgs.slice(lastCustIdx + 1).filter((m) => m.sender === "sales")
      .length;
  }

  get selectedQuoteUnread() {
    if (!this._selectedQuoteId) return 0;
    const raw = this._salesUnreadFor(this._selectedQuoteId);
    const seen = this._seenCounts[this._selectedQuoteId] || 0;
    return Math.max(0, raw - seen);
  }
  get hasUnreadMessages() {
    return this.selectedQuoteUnread > 0;
  }
  get unreadBadgeLabel() {
    const u = this.selectedQuoteUnread;
    return u > 9 ? "9+" : String(u);
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
      versionCount: q.versions ? q.versions.length : 0,
      // ── New negotiation fields
      isExpired: q.isExpired || false,
      daysUntilExpiry: q.daysUntilExpiry,
      expiryWarning:
        q.daysUntilExpiry != null &&
        q.daysUntilExpiry >= 0 &&
        q.daysUntilExpiry <= 7,
      expiryLabel:
        q.daysUntilExpiry != null && q.daysUntilExpiry >= 0
          ? q.daysUntilExpiry === 0
            ? "Expires today"
            : "Expires in " + q.daysUntilExpiry + "d"
          : null,
      canCounter: q.canCounter || false,
      canDecide: q.canDecide || false,
      isFinalOffer: false,
      negotiationRound: q.negotiationRound || 0,
      roundsRemaining: 0,
      floorPrice: q.floorPrice || null,
      customerCounterPrice: q.customerCounterPrice
        ? parseFloat(q.customerCounterPrice).toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR"
          })
        : null,
      counterMessage: q.counterMessage || null,
      approvalStatus: q.approvalStatus || "Not Required",
      needsApproval: q.approvalStatus === "Pending Approval",
      isApproved: q.approvalStatus === "Approved",
      volumeDiscountApplied: q.volumeDiscountApplied || false,
      paymentTerms: q.paymentTerms || "Net 30",
      // ── Per-quote terms set in builder ───────────────────────────────────
      generalTerms: q.generalTerms || null,
      signatureDeadlineDays: q.signatureDeadlineDays || null,
      // ── One-time vs recurring split ──────────────────────────────────────
      hasOneTime: q.oneTimeTotal != null && q.oneTimeTotal > 0,
      hasRecurring: q.recurringTotal != null && q.recurringTotal > 0,
      formattedOneTime:
        q.oneTimeTotal != null ? this._fmtCurrency(q.oneTimeTotal) : null,
      formattedRecurring:
        q.recurringTotal != null ? this._fmtCurrency(q.recurringTotal) : null,
      formattedMrr: q.mrr != null ? this._fmtCurrency(q.mrr) : null,
      hasMrr: q.mrr != null && q.mrr > 0
    };
  }

  get showDetailModal() {
    return !!this._selectedQuoteId;
  }
  get showRejectForm() {
    return this._showRejectForm;
  }
  get showCounterForm() {
    return this._showCounterForm;
  }
  // No longer used (auto-engine replaced manual final offer)
  get showFinalOfferDecision() {
    return false;
  }

  // Contract sent via DocuSign — both parties received signing email
  get showSignFinalContract() {
    const q = this.selectedQuote;
    return q && q.status === "Accepted" && q.negotiationStatus === "Final";
  }

  // Accepted but contract not yet dispatched
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
      return q.lineItems.map((li, i) => {
        const isRecurring = li.chargeType === "Recurring";
        return {
          key: String(i),
          productName: li.productName || "—",
          productFamily: li.productFamily || "—",
          productImage: li.imageUrl || null,
          hasImage: !!li.imageUrl,
          quantity: li.quantity,
          unitPrice: this._fmtCurrency(li.unitPrice || li.listPrice),
          totalPrice: this._fmtCurrency(li.netTotal),
          chargeType: li.chargeType || "One-time",
          billingFrequency: li.billingFrequency || "N/A",
          isRecurring,
          chargeTypeBadgeCls: isRecurring
            ? "nqs-charge-badge nqs-charge-recurring"
            : "nqs-charge-badge nqs-charge-onetime",
          billingLabel:
            isRecurring && li.billingFrequency && li.billingFrequency !== "N/A"
              ? li.billingFrequency
              : null
        };
      });
    }

    // Mock data fallback — use versions structure
    const v = this.selectedQuoteCurrentVersion;
    if (!v || !v.products) return [];
    return v.products.map((item, i) => ({
      key: item.product.id || String(i),
      productName: item.product.name,
      productFamily: item.product.family,
      productImage: item.product.image || null,
      hasImage: !!item.product.image,
      quantity: item.quantity,
      unitPrice: this._fmtCurrency(item.product.price),
      totalPrice: this._fmtCurrency(item.product.price * item.quantity)
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
    return this._messages.map((m) => {
      const isCustomer = m.sender === "customer" || m.sender === "user";
      return {
        ...m,
        rowCls: isCustomer ? "nqs-msg-row nqs-msg-row-user" : "nqs-msg-row",
        bubbleCls: isCustomer
          ? "nqs-bubble nqs-bubble-user"
          : "nqs-bubble nqs-bubble-rep",
        timeCls: isCustomer ? "nqs-msg-time nqs-msg-time-user" : "nqs-msg-time",
        avatarCls: isCustomer
          ? "nqs-avatar nqs-avatar-user"
          : "nqs-avatar nqs-avatar-rep",
        avatarInitial: isCustomer ? "C" : "S"
      };
    });
  }

  // ── Computed: misc ─────────────────────────────────────────────────────────
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
    return this._formSubmitting ? "Submitting..." : "Submit Request";
  }
  get messageInput() {
    return this._messageInput;
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
    this._showRejectForm = false;
    this._rejectReason = "";
    this._expandedVersion = null;

    // Seed messages from the persisted thread JSON on the quote
    const q = this.activeQuotes.find((r) => r.quoteId === id);
    this._messages = this._parseThread(q ? q.messageThread : null);
    this._msgCounter = this._messages.length;
    this._messageInput = "";
  }
  handleCloseDetail() {
    this._selectedQuoteId = null;
    this._stopMsgPoll();
  }
  handleStopProp(e) {
    e.stopPropagation();
  }

  // ── Handlers: modal tabs ──────────────────────────────────────────────────
  handleTabDetails() {
    this._modalTab = "details";
    this._stopMsgPoll();
  }
  handleTabMessages() {
    this._modalTab = "messages";
    const unread = this._salesUnreadFor(this._selectedQuoteId);
    this._seenCounts = { ...this._seenCounts, [this._selectedQuoteId]: unread };
    if (
      this._floatingNotif &&
      this._floatingNotif.quoteId === this._selectedQuoteId
    ) {
      this._floatingNotif = null;
    }
    // Start polling so new admin messages appear without a page refresh
    this._stopMsgPoll();
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._msgPollTimer = setInterval(() => this._loadQuotes(), 8000);
  }
  handleTabHistory() {
    this._modalTab = "history";
    this._stopMsgPoll();
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
    this._showRejectForm = false;
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

  handleNotifView(e) {
    const id = e.currentTarget.dataset.id;
    const q = this.activeQuotes.find((r) => r.quoteId === id);
    if (!q) return;
    this._selectedQuoteId = id;
    this._messages = this._parseThread(q.messageThread);
    this._msgCounter = this._messages.length;
    this._modalTab = "messages";
    const unread = this._salesUnreadFor(id);
    this._seenCounts = { ...this._seenCounts, [id]: unread };
    this._floatingNotif = null;
  }

  handleNotifDismiss() {
    this._floatingNotif = null;
  }

  _parseThread(threadJson) {
    if (!threadJson) return [];
    try {
      const parsed = JSON.parse(threadJson);
      return Array.isArray(parsed)
        ? parsed.map((m, i) => ({
            ...m,
            id: m.id || String(i),
            time: m.time
              ? new Date(m.time).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit"
                })
              : ""
          }))
        : [];
    } catch {
      return [];
    }
  }

  _stopMsgPoll() {
    if (this._msgPollTimer) {
      clearInterval(this._msgPollTimer);
      this._msgPollTimer = null;
    }
  }

  _sendMessage() {
    const txt = this._messageInput.trim();
    if (!txt || !this._selectedQuoteId) return;

    const optimistic = {
      id: "opt-" + String(++this._msgCounter),
      sender: "customer",
      text: txt,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
      })
    };
    this._messages = [...this._messages, optimistic];
    this._messageInput = "";
    const inputEl = this.template.querySelector(".nqs-msg-input");
    if (inputEl) inputEl.value = "";

    postCustomerMessage({
      quoteId: this._selectedQuoteId,
      messageText: txt
    }).catch(() => {
      // Remove optimistic message on failure
      this._messages = this._messages.filter((m) => m.id !== optimistic.id);
      this._toast(
        "Message Failed",
        "Could not send your message. Please try again.",
        "error"
      );
    });
  }

  // ── Handlers: PDF ─────────────────────────────────────────────────────────
  handleDownloadPDF() {
    const q = this.selectedQuote;
    this._downloadSignedPDF(q && q.quoteId);
  }
  handleDownloadPDFCard(e) {
    e.stopPropagation();
    const quoteId = e.currentTarget.dataset.id;
    this._downloadSignedPDF(quoteId);
  }
  _downloadSignedPDF(quoteId) {
    if (!quoteId) return;
    this._toast("PDF", "Retrieving signed contract...", "info");
    getSignedContractBase64({ quoteId })
      .then((result) => {
        if (!result || !result.base64) {
          this._toast(
            "PDF",
            "No signed contract available for this quote.",
            "warning"
          );
          return;
        }
        // Decode base64 → Uint8Array → Blob → download
        const binary = atob(result.base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || "Signed_Contract.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error("PDF download error", err);
        this._toast("PDF", "Unable to download the contract.", "error");
      });
  }

  // ── Handlers: accept / sign ───────────────────────────────────────────────

  // Quote acceptance — direct, no overlay
  handleAcceptQuote() {
    if (this._isMock(this._selectedQuoteId)) {
      this._updateMockStatus(this._selectedQuoteId, "Accepted");
      this._selectedQuoteId = null;
      this._toast(
        "Quote Accepted ✓",
        "Your acceptance has been recorded.",
        "success"
      );
      return;
    }
    this._isDeciding = true;
    processQuoteDecision({
      quoteId: this._selectedQuoteId,
      decision: "Accepted",
      reason: ""
    })
      .then(() => {
        this._loadQuotes();
      })
      .then(() => {
        this._isDeciding = false;
        const acceptedId = this._selectedQuoteId;
        const acceptedName = this.selectedQuote ? this.selectedQuote.name : "";
        this._selectedQuoteId = null;
        this._toast(
          "Quote Accepted ✓",
          "Your acceptance has been recorded. Our team will prepare your contract.",
          "success"
        );
        // Show testimonial popup after a brief delay so the toast is seen first
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
          this._testimonialQuoteId = acceptedId;
          this._testimonialQuoteName = acceptedName;
          this._showTestimonialForm = true;
        }, 1200);
      })
      .catch((err) => {
        this._isDeciding = false;
        this._toast(
          "Error",
          err.body?.message || "An unexpected error occurred.",
          "error"
        );
      });
  }

  // ── Handlers: testimonial popup ───────────────────────────────────────────
  handleTestimonialClose() {
    this._showTestimonialForm = false;
    this._testimonialQuoteId = null;
    this._testimonialQuoteName = "";
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
        this._loadQuotes();
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

  // ── Handlers: counter-offer ───────────────────────────────────────────────
  handleShowCounterForm() {
    this._showCounterForm = true;
    this._counterPrice = "";
    this._counterMessage = "";
  }
  handleCancelCounter() {
    this._showCounterForm = false;
  }
  handleCounterPriceInput(e) {
    this._counterPrice = e.target.value;
  }
  handleCounterMessageInput(e) {
    this._counterMessage = e.target.value;
  }
  handleSubmitCounter() {
    const price = parseFloat(this._counterPrice);
    if (!price || price <= 0) {
      this._toast(
        "Invalid Amount",
        "Please enter a valid counter-offer price.",
        "error"
      );
      return;
    }
    this._counterSubmitting = true;
    submitCounterOffer({
      quoteId: this._selectedQuoteId,
      counterPrice: price,
      message: this._counterMessage
    })
      .then((outcome) => {
        this._counterSubmitting = false;
        this._showCounterForm = false;
        if (outcome === "ACCEPTED") {
          this._toast(
            "Counter Offer Automatically Accepted",
            "Your price has been accepted. The contract is being prepared.",
            "success"
          );
        } else if (outcome === "COUNTERED") {
          this._toast(
            "New Proposal Received",
            "Our system calculated an intermediate price. Check your updated quote.",
            "info"
          );
        } else {
          this._toast(
            "Counter Offer Rejected",
            "Your price is too far from the minimum threshold. You can accept the quote or contact our team.",
            "warning"
          );
        }
        this._loadQuotes();
      })
      .catch((err) => {
        this._counterSubmitting = false;
        this._toast(
          "Error",
          err.body?.message || "An unexpected error occurred.",
          "error"
        );
      });
  }
  get counterSubmitLabel() {
    return this._counterSubmitting ? "Submitting…" : "Submit Counter Offer";
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
        this._loadQuotes();
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
