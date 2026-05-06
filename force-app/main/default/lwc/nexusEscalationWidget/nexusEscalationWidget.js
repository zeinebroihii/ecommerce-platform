import { LightningElement, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getEscalatedQuotes from "@salesforce/apex/NexusQuoteController.getEscalatedQuotes";
import applyNegotiatedTerms from "@salesforce/apex/NexusQuoteController.applyNegotiatedTerms";
import getOpenConversations from "@salesforce/apex/NexusQuoteController.getOpenConversations";
import postSalesReply from "@salesforce/apex/NexusQuoteController.postSalesReply";

// ── Helpers ────────────────────────────────────────────────────────────────

function parseCombo(str) {
  if (!str) return null;
  try {
    const priceMatch = str.match(/([\d,.]+)\s*€/);
    const termsMatch = str.match(/\|\s*(Net \d+)\s*\|/);
    const validityMatch = str.match(/Validity:\s*(\d+)/);
    const discountMatch = str.match(/\(([\d.]+)%/);
    return {
      price: priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : null,
      terms: termsMatch ? termsMatch[1] : "Net 30",
      validity: validityMatch ? parseInt(validityMatch[1], 10) : 30,
      discount: discountMatch ? parseFloat(discountMatch[1]) : null
    };
  } catch {
    return null;
  }
}

function fmtEur(val) {
  if (val == null) return "—";
  return (
    val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " €"
  );
}

function ageLabel(createdAt) {
  if (!createdAt) return "";
  const ms = Date.now() - new Date(createdAt).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return "< 1h ago";
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

function buildSummary(esc) {
  const parts = [];
  if (esc.escalationNote) parts.push(esc.escalationNote);
  if (esc.requestedPaymentTerms)
    parts.push("Requested " + esc.requestedPaymentTerms);
  if (esc.customerCounterPrice)
    parts.push("Counter: " + fmtEur(esc.customerCounterPrice));
  return parts.join(" · ") || "Customer escalated this deal for review.";
}

function buildPreviewMessage(esc, comboData, salesNote) {
  if (!comboData) return "";
  const name = esc.accountName || "there";
  let msg =
    "Hi " +
    name +
    " team, I've reviewed your request. We can offer " +
    fmtEur(comboData.price) +
    " with " +
    comboData.terms +
    " payment terms, valid for " +
    comboData.validity +
    " days.";
  if (salesNote && salesNote.trim()) msg += " " + salesNote.trim();
  return msg;
}

// expandedIds and approvingIds are plain objects {quoteId: true} — NOT Set
function enrichEscalation(q, expandedIds, customData, approvingIds) {
  const comboAData = parseCombo(q.escalationComboA);
  const comboBData = parseCombo(q.escalationComboB);

  let aiRecommendation = null;
  let aiRecommendationReason = null;
  if (comboAData && comboBData) {
    if (comboBData.price <= comboAData.price) {
      // B is the trade-off: better price in exchange for faster terms
      aiRecommendation = "B";
      const saving = comboAData.price - comboBData.price;
      const savingFmt =
        saving > 0 ? fmtEur(saving) + " extra savings" : "best available price";
      aiRecommendationReason =
        "Trade-off: " +
        savingFmt +
        " if customer upgrades to " +
        comboBData.terms +
        " — higher close probability";
    } else {
      // A is floor, B costs more because customer's terms are too slow for extra discount
      aiRecommendation = "A";
      const extraCost = comboBData.price - comboAData.price;
      aiRecommendationReason =
        "Revenue protection: floor price at " +
        comboAData.terms +
        " — B costs " +
        fmtEur(extraCost) +
        " more due to slow-payment penalty";
    }
  } else if (comboAData) {
    aiRecommendation = "A";
    aiRecommendationReason = "Single option — accept or customize terms";
  }

  const isHighRisk =
    (q.counterMessage || "").includes("High-value") ||
    (q.counterMessage || "").includes("Net 90") ||
    (q.counterMessage || "").includes("Deep discount");
  const riskLabel = isHighRisk ? "HIGH RISK" : "MEDIUM RISK";
  const riskBadgeCls = isHighRisk
    ? "ew-risk-badge ew-risk-high"
    : "ew-risk-badge ew-risk-medium";

  const cust = customData[q.quoteId] || {};
  const customPrice = cust.price || "";
  const customTerms = cust.terms || "Net 30";
  const customValidity = cust.validity || 30;

  // Build the base message first, then use it as the textarea default if untouched
  const bestCombo = aiRecommendation === "B" ? comboBData : comboAData;
  const baseMessage = buildPreviewMessage(
    { accountName: q.accountName },
    bestCombo,
    ""
  );
  const salesNote = cust.note !== undefined ? cust.note : baseMessage;

  const escalationNote = q.counterMessage
    ? String(q.counterMessage).replace(/^ESCALATION \[.*?\]:\s*/, "")
    : null;

  return {
    quoteId: q.quoteId,
    name: q.name,
    accountName: q.accountName || "",
    opportunityName: q.opportunityName || "",
    ageLabel: ageLabel(q.requestedAt),
    riskLabel,
    riskBadgeCls,
    escalationNote,
    summaryText: buildSummary({
      escalationNote,
      requestedPaymentTerms: q.requestedPaymentTerms,
      customerCounterPrice: q.customerCounterPrice
    }),
    requestedTermsLabel: q.requestedPaymentTerms || null,
    formattedCounter: q.customerCounterPrice
      ? "Counter: " + fmtEur(q.customerCounterPrice)
      : null,
    lineItems: q.lineItems || [],
    comboAData,
    comboBData,
    hasComboA: !!comboAData,
    hasComboB: !!comboBData,
    aiRecommendation,
    aiRecommendationReason,
    isAiA: aiRecommendation === "A",
    isAiB: aiRecommendation === "B",
    comboAPriceLabel: comboAData ? fmtEur(comboAData.price) : null,
    comboBPriceLabel: comboBData ? fmtEur(comboBData.price) : null,
    comboACardCls:
      aiRecommendation === "A" ? "ew-combo-card ew-combo-ai" : "ew-combo-card",
    comboBCardCls:
      aiRecommendation === "B" ? "ew-combo-card ew-combo-ai" : "ew-combo-card",
    salesNote,
    showCustom: !!cust.showCustom,
    customPrice,
    customTerms,
    customValidity,
    customTermsNet30: customTerms === "Net 30",
    customTermsNet45: customTerms === "Net 45",
    customTermsNet60: customTerms === "Net 60",
    customTermsNet90: customTerms === "Net 90",
    expanded: !!expandedIds[q.quoteId],
    expandIcon: expandedIds[q.quoteId]
      ? "utility:chevronup"
      : "utility:chevrondown",
    approving: !!approvingIds[q.quoteId]
  };
}

// ── Conversation helpers ───────────────────────────────────────────────────

function parseThread(threadJson) {
  if (!threadJson) return [];
  try {
    return JSON.parse(threadJson).map((m) => ({
      id: m.id || m.time,
      sender: m.sender,
      text: m.text,
      timeLabel: m.time
        ? new Date(m.time).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
          })
        : "",
      rowCls:
        m.sender === "sales"
          ? "ew-msg-row ew-msg-row-sales"
          : "ew-msg-row ew-msg-row-customer",
      bubbleCls:
        m.sender === "sales"
          ? "ew-bubble ew-bubble-sales"
          : "ew-bubble ew-bubble-customer"
    }));
  } catch {
    return [];
  }
}

function enrichConversation(q, expandedIds, replyData, sendingIds) {
  const messages = parseThread(q.messageThread);
  const lastMsg = messages.length ? messages[messages.length - 1] : null;
  const lastPreview = lastMsg
    ? lastMsg.text.length > 55
      ? lastMsg.text.slice(0, 55) + "…"
      : lastMsg.text
    : "";
  const awaitingReply = lastMsg && lastMsg.sender === "customer";
  const rd = replyData[q.quoteId] || {};
  const dealSummary = [
    q.grandTotal ? fmtEur(q.grandTotal) : null,
    q.paymentTerms || null
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    quoteId: q.quoteId,
    accountName: q.accountName || "",
    quoteName: q.name,
    dealSummary,
    lastPreview,
    messages,
    awaitingReply,
    convDotCls: awaitingReply ? "ew-conv-dot ew-conv-dot-pulse" : "ew-conv-dot",
    replyText: rd.text !== undefined ? rd.text : "",
    sending: !!sendingIds[q.quoteId],
    expanded: !!expandedIds[q.quoteId],
    expandIcon: expandedIds[q.quoteId]
      ? "utility:chevronup"
      : "utility:chevrondown"
  };
}

// ── Component ──────────────────────────────────────────────────────────────

export default class NexusEscalationWidget extends LightningElement {
  @track _raw = [];
  @track _loading = false;
  @track _trayOpen = true;
  @track _expandedIds = {}; // { quoteId: true }
  @track _approvingIds = {}; // { quoteId: true }
  @track _customData = {}; // quoteId → {price, terms, validity, note, showCustom}

  @track _convRaw = [];
  @track _convExpandedIds = {};
  @track _convSendingIds = {};
  @track _convReplyData = {}; // quoteId → { text }
  @track _convFilter = "all"; // 'all' | 'awaiting'

  _refreshTimer = null;

  connectedCallback() {
    this._load();
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._refreshTimer = setInterval(() => this._load(), 30000);
  }

  disconnectedCallback() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
  }

  _load() {
    this._loading = true;
    Promise.all([getEscalatedQuotes(), getOpenConversations()])
      .then(([escData, convData]) => {
        this._loading = false;
        this._raw = escData || [];
        this._convRaw = convData || [];
        if (this._raw.length === 1) {
          this._expandedIds = { [this._raw[0].quoteId]: true };
        }
        if (this._convRaw.length === 1) {
          this._convExpandedIds = { [this._convRaw[0].quoteId]: true };
        }
      })
      .catch(() => {
        this._loading = false;
      });
  }

  get escalations() {
    return this._raw.map((q) =>
      enrichEscalation(
        q,
        this._expandedIds,
        this._customData,
        this._approvingIds
      )
    );
  }

  get hasEscalations() {
    return this._raw.length > 0;
  }

  get escalationCount() {
    return this._raw.length;
  }

  get trayOpen() {
    return this._trayOpen;
  }

  get trayToggleIcon() {
    return this._trayOpen ? "utility:chevronup" : "utility:chevrondown";
  }

  handleToggleTray() {
    this._trayOpen = !this._trayOpen;
  }

  handleToggleItem(e) {
    const id = e.currentTarget.dataset.id;
    if (this._expandedIds[id]) {
      const next = { ...this._expandedIds };
      delete next[id];
      this._expandedIds = next;
    } else {
      this._expandedIds = { ...this._expandedIds, [id]: true };
    }
  }

  handleSalesNoteChange(e) {
    const id = e.currentTarget.dataset.id;
    const val = e.target.value;
    this._customData = {
      ...this._customData,
      [id]: { ...(this._customData[id] || {}), note: val }
    };
  }

  handleToggleCustom(e) {
    const id = e.currentTarget.dataset.id;
    const prev = this._customData[id] || {};
    this._customData = {
      ...this._customData,
      [id]: { ...prev, showCustom: !prev.showCustom }
    };
  }

  handleCustomFieldChange(e) {
    const id = e.currentTarget.dataset.id;
    const field = e.currentTarget.dataset.field;
    const val =
      field === "validity"
        ? parseInt(e.target.value, 10) || 30
        : e.target.value;
    this._customData = {
      ...this._customData,
      [id]: { ...(this._customData[id] || {}), [field]: val }
    };
  }

  // ── Conversations ──────────────────────────────────────────────────────────

  get conversations() {
    const all = this._convRaw.map((q) =>
      enrichConversation(
        q,
        this._convExpandedIds,
        this._convReplyData,
        this._convSendingIds
      )
    );
    return this._convFilter === "awaiting"
      ? all.filter((c) => c.awaitingReply)
      : all;
  }

  get hasConversations() {
    return this._convRaw.length > 0;
  }

  get conversationCount() {
    return this._convRaw.length;
  }

  get allFilterCls() {
    return this._convFilter === "all"
      ? "ew-conv-filter-btn ew-conv-filter-active"
      : "ew-conv-filter-btn";
  }

  get awaitingFilterCls() {
    return this._convFilter === "awaiting"
      ? "ew-conv-filter-btn ew-conv-filter-active"
      : "ew-conv-filter-btn";
  }

  handleConvFilter(e) {
    this._convFilter = e.currentTarget.dataset.filter;
  }

  handleToggleConv(e) {
    const id = e.currentTarget.dataset.id;
    if (this._convExpandedIds[id]) {
      const next = { ...this._convExpandedIds };
      delete next[id];
      this._convExpandedIds = next;
    } else {
      this._convExpandedIds = { ...this._convExpandedIds, [id]: true };
    }
  }

  handleConvReplyChange(e) {
    const id = e.currentTarget.dataset.id;
    const val = e.target.value;
    this._convReplyData = {
      ...this._convReplyData,
      [id]: { text: val }
    };
  }

  handleSendReply(e) {
    const quoteId = e.currentTarget.dataset.id;
    const text = (this._convReplyData[quoteId] || {}).text || "";
    if (!text.trim()) return;

    this._convSendingIds = { ...this._convSendingIds, [quoteId]: true };

    postSalesReply({ quoteId, messageText: text })
      .then(() => {
        this._convReplyData = {
          ...this._convReplyData,
          [quoteId]: { text: "" }
        };
        const textarea = this.template.querySelector(
          `textarea[data-id="${quoteId}"]`
        );
        if (textarea) textarea.value = "";
        const s = { ...this._convSendingIds };
        delete s[quoteId];
        this._convSendingIds = s;
        this._load();
      })
      .catch((err) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: err.body ? err.body.message : "Could not send reply.",
            variant: "error"
          })
        );
        const s = { ...this._convSendingIds };
        delete s[quoteId];
        this._convSendingIds = s;
      });
  }

  handleApproveCombo(e) {
    const quoteId = e.currentTarget.dataset.id;
    const combo = e.currentTarget.dataset.combo;
    const esc = this._raw.find((q) => q.quoteId === quoteId);
    if (!esc) return;

    let price, terms, validity;
    const enriched = enrichEscalation(
      esc,
      this._expandedIds,
      this._customData,
      this._approvingIds
    );

    if (combo === "A" && enriched.comboAData) {
      price = enriched.comboAData.price;
      terms = enriched.comboAData.terms;
      validity = enriched.comboAData.validity;
    } else if (combo === "B" && enriched.comboBData) {
      price = enriched.comboBData.price;
      terms = enriched.comboBData.terms;
      validity = enriched.comboBData.validity;
    } else if (combo === "custom") {
      const cust = this._customData[quoteId] || {};
      price = parseFloat(cust.price) || 0;
      terms = cust.terms || "Net 30";
      validity = parseInt(cust.validity, 10) || 30;
    }

    if (!price || price <= 0) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Invalid",
          message: "Please enter a valid price.",
          variant: "warning"
        })
      );
      return;
    }

    const salesNote = enriched.salesNote || "";

    this._approvingIds = { ...this._approvingIds, [quoteId]: true };

    applyNegotiatedTerms({
      quoteId,
      approvedPrice: price,
      approvedPaymentTerms: terms,
      approvedValidityDays: validity,
      salesNote
    })
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Approved",
            message:
              "Terms applied and message sent to " +
              (esc.accountName || "customer") +
              ".",
            variant: "success"
          })
        );
        const a = { ...this._approvingIds };
        delete a[quoteId];
        this._approvingIds = a;
        // Remove from list immediately, reload in background
        this._raw = this._raw.filter((q) => q.quoteId !== quoteId);
        this._load();
        // Notify parent Quote Builder to reload the main quote list
        this.dispatchEvent(
          new CustomEvent("approvecomplete", { bubbles: true, composed: true })
        );
      })
      .catch((err) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: err.body ? err.body.message : "Could not apply terms.",
            variant: "error"
          })
        );
        const a = { ...this._approvingIds };
        delete a[quoteId];
        this._approvingIds = a;
      });
  }
}
