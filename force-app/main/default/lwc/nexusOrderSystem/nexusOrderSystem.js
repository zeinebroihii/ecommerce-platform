import { LightningElement, wire, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import getMyOrders from "@salesforce/apex/OrderManagementController.getMyOrders";
import getEscrowStatus from "@salesforce/apex/EscrowBridgeController.getEscrowStatus";
import confirmReceiptFromBuyer from "@salesforce/apex/EscrowBridgeController.confirmReceiptFromBuyer";
import fundEscrowForOrder from "@salesforce/apex/EscrowBridgeController.fundEscrowForOrder";
import raiseDisputeWithReason from "@salesforce/apex/EscrowDisputeController.raiseDisputeWithReason";
import getLivePosition from "@salesforce/apex/LiveTrackingController.getLivePosition";
import buyerConfirmReceipt from "@salesforce/apex/LiveTrackingController.buyerConfirmReceipt";

const STATUS_MAP = {
  Draft: { label: "Processing", progress: 20 },
  Activated: { label: "Processing", progress: 30 },
  Shipped: { label: "In Transit", progress: 65 },
  Delivered: { label: "Delivered", progress: 100 },
  Completed: { label: "Delivered", progress: 100 },
  Cancelled: { label: "Cancelled", progress: 0 }
};

function buildTrackingHistory(
  o,
  statusLabel,
  orderDate,
  shippedDate,
  deliveredDate
) {
  const addr = o.shippingAddress || "—";
  const city = addr !== "—" ? addr : "Distribution Center";

  let processingDesc;
  if (o.paymentMethod === "Stripe") {
    processingDesc = "Order placed and payment confirmed via Stripe.";
  } else if (o.paymentMethod === "USDC_Escrow") {
    processingDesc = "Order placed. USDC secured in escrow on Polygon.";
  } else {
    processingDesc = "Order placed, payment pending.";
  }

  // Step always present: Processing
  const stepProcessing = {
    status: "Processing",
    location: addr,
    time: orderDate || "—",
    description: processingDesc
  };

  if (statusLabel === "Processing" || statusLabel === "Cancelled") {
    return [stepProcessing];
  }

  const stepShipped = {
    status: "In Transit",
    location: city,
    time: shippedDate || "—",
    description: "Package shipped and in transit to your location."
  };

  if (statusLabel === "In Transit") {
    return [stepShipped, stepProcessing];
  }

  // Delivered / Completed
  const stepOutForDelivery = {
    status: "Out for Delivery",
    location: city,
    time: deliveredDate || "—",
    description: "Package is with the local courier."
  };
  const stepDelivered = {
    status: "Delivered",
    location: addr,
    time: deliveredDate || "—",
    description: "Package delivered and signed for."
  };

  return [stepDelivered, stepOutForDelivery, stepShipped, stepProcessing];
}

function mapSfOrder(o) {
  const s = STATUS_MAP[o.status] || {
    label: o.status || "Processing",
    progress: 25
  };
  const history = buildTrackingHistory(
    o,
    s.label,
    o.orderDate || null,
    o.shippedDate || null,
    o.deliveredDate || null
  );
  return {
    id: o.orderNumber,
    _sfId: o.orderId,
    _rawStatus: o.status,
    date: o.orderDate || "—",
    total: o.totalAmount || 0,
    formattedTotal: o.formattedTotal || o.totalAmount + " €",
    status: s.label,
    progress: s.progress,
    eta:
      s.label === "Delivered"
        ? "Delivered"
        : s.label === "In Transit"
          ? o.shippedDate || "In Transit"
          : "Processing",
    location: o.shippingAddress || "—",
    items: o.itemCount || 0,
    trackingNumber: o.orderNumber,
    carrier: "Nexus Express Logistics",
    shippingAddress: o.shippingAddress || "—",
    formattedShipping: o.formattedShipping || "—",
    hasSparksDiscount: o.hasSparksDiscount || false,
    formattedSparksDiscount: o.formattedSparksDiscount || null,
    paymentMethod: o.paymentMethod || null,
    paymentDeadline: o.paymentDeadline || null,
    liveLat: o.liveLat != null ? o.liveLat : null,
    liveLng: o.liveLng != null ? o.liveLng : null,
    liveEta: o.liveEta != null ? o.liveEta : null,
    trackingToken: o.trackingToken || null,
    isReal: true,
    history,
    products: (o.lineItems || []).map((li, idx) => ({
      id: "li_" + idx,
      name: li.productName || "—",
      quantity: li.quantity || 1,
      price: li.unitPrice || 0,
      lineTotal: li.formattedTotal || "—",
      image: li.imageUrl || ""
    }))
  };
}

// ── Escrow state constants (must match Solidity enum order) ──────────────────
const ESCROW_STATE = {
  NONE: 0,
  FUNDED: 1,
  DELIVERED: 2,
  DISPUTED: 3,
  FROZEN: 4,
  RELEASED: 5,
  REFUNDED: 6
};

const ESCROW_STATE_LABELS = {
  0: "Not Funded",
  1: "Payment Secured",
  2: "Delivered — Awaiting Release",
  3: "Under Dispute",
  4: "Payment Frozen",
  5: "Payment Released",
  6: "Refunded"
};

export default class NexusOrderSystem extends LightningElement {
  @track _selectedOrderId = null;
  @track _showFullMap = false;
  @track _realOrders = [];
  @track _loaded = false;
  @track _escrowData = null;
  @track _escrowLoading = false;
  @track _escrowActionLoading = false;
  @track _fundingLoading = false;
  @track _showEscrowPayModal = false;
  @track _escrowPayStep = "review";
  @track _escrowPayTxHash = null;
  @track _escrowPayError = null;
  @track _processingStep = 1;
  @track _buyerWalletAddress = "";
  @track _escrowAlreadyFunded = false;
  @track _showDisputeModal = false;
  @track _disputeReason = "";
  @track _disputeSubmitting = false;
  @track _disputeSuccess = false;
  @track _disputeCaseNumber = null;
  @track _receiptConfirming = false;
  @track _receiptConfirmed = false;
  _countdownInterval = null;
  _processingTimer = null;
  _wiredOrdersResult;
  _escrowPollTimer = null;

  // ── Live tracking ──────────────────────────────────────────────────────────
  @track _livePos = null; // TrackingData from LiveTrackingController
  _liveTrackPollTimer = null;
  _liveTrackSfOrderId = null;

  @wire(getMyOrders)
  wiredOrders(result) {
    this._wiredOrdersResult = result;
    const { data, error } = result;
    if (data) {
      this._realOrders = data.map(mapSfOrder);
      this._loaded = true;
      // Start live-tracking poll for the first In Transit order
      const active = this._realOrders.find(
        (o) => o.status === "In Transit" && o._sfId
      );
      if (active) {
        this._startLiveTracking(active._sfId);
      } else {
        this._stopLiveTracking();
      }
    }
    if (error) {
      console.error(
        "[NexusOrderSystem] getMyOrders error:",
        JSON.stringify(error)
      );
      this._loaded = true;
    }
  }

  get isLoading() {
    return !this._loaded;
  }
  get hasOrders() {
    return this._loaded && this._realOrders.length > 0;
  }
  get isEmpty() {
    return this._loaded && this._realOrders.length === 0;
  }

  // ── Live tracking getters ──────────────────────────────────────────────────

  get hasLiveTracking() {
    return !!(this._livePos && this._livePos.isLive);
  }

  get liveMapMarkers() {
    if (!this._livePos) return [];
    return [
      {
        location: {
          Latitude: this._livePos.lat,
          Longitude: this._livePos.lng
        },
        title: "Rider en route",
        description: "Mise à jour en direct · " + this.liveEtaLabel
      }
    ];
  }

  get liveEtaLabel() {
    if (!this._livePos || this._livePos.etaMinutes == null)
      return "Calcul en cours...";
    if (this._livePos.etaMinutes <= 1) return "< 1 min";
    return this._livePos.etaMinutes + " min";
  }

  get liveOrderId() {
    return this._livePos ? this._livePos.orderNumber : "—";
  }

  get liveRiderAddress() {
    return this._livePos && this._livePos.riderAddress
      ? this._livePos.riderAddress
      : null;
  }

  _decorate(o) {
    const isDelivered = o.status === "Delivered";
    const isCancelled = o.status === "Cancelled";
    return {
      ...o,
      progressStyle: "width:" + o.progress + "%",
      dotCls:
        "nos-status-dot " +
        (isDelivered
          ? "nos-dot-emerald"
          : isCancelled
            ? "nos-dot-rose"
            : "nos-dot-amber"),
      barCls:
        "nos-progress-bar " +
        (isDelivered ? "nos-bar-emerald" : "nos-bar-indigo")
    };
  }

  get orders() {
    return this._realOrders.map((o) => this._decorate(o));
  }

  get showDetailModal() {
    return !!this._selectedOrderId;
  }
  get showFullMap() {
    return this._showFullMap;
  }

  // ── Escrow computed getters ────────────────────────────────────────────────

  get escrowState() {
    return this._escrowData ? Number(this._escrowData.state) : -1;
  }

  get escrowStateLabel() {
    return ESCROW_STATE_LABELS[this.escrowState] ?? "—";
  }

  get escrowBadgeClass() {
    const s = this.escrowState;
    if (s === ESCROW_STATE.FUNDED)
      return "nos-escrow-badge nos-escrow-badge-funded";
    if (s === ESCROW_STATE.DELIVERED)
      return "nos-escrow-badge nos-escrow-badge-delivered";
    if (s === ESCROW_STATE.DISPUTED)
      return "nos-escrow-badge nos-escrow-badge-disputed";
    if (s === ESCROW_STATE.FROZEN)
      return "nos-escrow-badge nos-escrow-badge-frozen";
    if (s === ESCROW_STATE.RELEASED)
      return "nos-escrow-badge nos-escrow-badge-released";
    if (s === ESCROW_STATE.REFUNDED)
      return "nos-escrow-badge nos-escrow-badge-refunded";
    return "nos-escrow-badge";
  }

  // Shows countdown timer when delivery confirmed and safety delay is running
  get escrowCountdownLabel() {
    if (this.escrowState !== ESCROW_STATE.DELIVERED) return null;
    const secs = Number(this._escrowData?.secondsUntilRelease || 0);
    if (secs <= 0) return "Release ready";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  // Buyer can confirm receipt when state is DELIVERED
  get canConfirmReceipt() {
    return (
      this.escrowState === ESCROW_STATE.DELIVERED && !this._escrowActionLoading
    );
  }

  // Buyer can raise a dispute when FUNDED or DELIVERED
  get canDispute() {
    const s = this.escrowState;
    return (
      (s === ESCROW_STATE.FUNDED || s === ESCROW_STATE.DELIVERED) &&
      !this._escrowActionLoading
    );
  }

  get escrowActionLoading() {
    return this._escrowActionLoading;
  }

  get fundingLoading() {
    return this._fundingLoading;
  }

  get usdcBtnLabel() {
    return this._fundingLoading ? "Locking Funds..." : "Pay with USDC";
  }

  // ── Escrow pay modal getters ───────────────────────────────────────────────

  get showEscrowPayModal() {
    return this._showEscrowPayModal;
  }

  get escrowPayIsReview() {
    return this._escrowPayStep === "review";
  }

  get escrowPayIsWallet() {
    return this._escrowPayStep === "wallet";
  }

  get escrowPayIsProcessing() {
    return this._escrowPayStep === "processing";
  }

  get escrowPayIsSuccess() {
    return this._escrowPayStep === "success";
  }

  get escrowPayIsError() {
    return this._escrowPayStep === "error";
  }

  get isWalletAddressValid() {
    return /^0x[0-9a-fA-F]{40}$/.test(this._buyerWalletAddress);
  }

  get walletContinueDisabled() {
    return !this.isWalletAddressValid;
  }

  get buyerWalletAddress() {
    return this._buyerWalletAddress;
  }

  get processingStep1Done() {
    return this._processingStep > 1;
  }

  get processingStep2Active() {
    return this._processingStep === 2;
  }

  get escrowAlreadyFunded() {
    return this._escrowAlreadyFunded;
  }

  get escrowPayTxHash() {
    return this._escrowPayTxHash;
  }

  get escrowPayTxShort() {
    return this._escrowPayTxHash
      ? this._escrowPayTxHash.slice(0, 18) + "..."
      : "";
  }

  get escrowPayPolygonscanUrl() {
    return this._escrowPayTxHash
      ? "https://amoy.polygonscan.com/tx/" + this._escrowPayTxHash
      : "#";
  }

  get escrowPayError() {
    return this._escrowPayError;
  }

  get escrowPayOrderAmount() {
    if (!this._selectedOrderId) return "—";
    const o = this._realOrders.find((r) => r.id === this._selectedOrderId);
    return o ? o.formattedTotal : "—";
  }

  get escrowPayOrderId() {
    return this._selectedOrderId || "—";
  }

  get escrowPayDeadline() {
    if (this._selectedOrderId) {
      const o = this._realOrders.find((r) => r.id === this._selectedOrderId);
      if (o && o.paymentDeadline) return o.paymentDeadline;
    }
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  // ── Dispute modal getters ──────────────────────────────────────────────────

  get showDisputeModal() {
    return this._showDisputeModal;
  }
  get disputeReason() {
    return this._disputeReason;
  }
  get disputeSubmitting() {
    return this._disputeSubmitting;
  }
  get disputeSuccess() {
    return this._disputeSuccess;
  }
  get disputeCaseNumber() {
    return this._disputeCaseNumber;
  }
  get disputeSubmitDisabled() {
    return this._disputeReason.trim().length < 10 || this._disputeSubmitting;
  }
  get disputeSubmitLabel() {
    return this._disputeSubmitting
      ? "Freezing Payment..."
      : "Submit & Freeze Payment";
  }

  // Status banners for terminal / blocked states
  get escrowStatusBanner() {
    const s = this.escrowState;
    if (s === ESCROW_STATE.FROZEN)
      return "Payment frozen — under review by our team";
    if (s === ESCROW_STATE.DISPUTED) return "Dispute raised — payment blocked";
    if (s === ESCROW_STATE.RELEASED) return "Payment released to seller";
    if (s === ESCROW_STATE.REFUNDED) return "Refund issued to your account";
    return null;
  }

  get escrowBannerClass() {
    const s = this.escrowState;
    if (s === ESCROW_STATE.FROZEN || s === ESCROW_STATE.DISPUTED)
      return "nos-escrow-banner nos-escrow-banner-warn";
    if (s === ESCROW_STATE.RELEASED)
      return "nos-escrow-banner nos-escrow-banner-success";
    if (s === ESCROW_STATE.REFUNDED)
      return "nos-escrow-banner nos-escrow-banner-info";
    return "nos-escrow-banner";
  }

  get escrowBannerIcon() {
    const s = this.escrowState;
    if (s === ESCROW_STATE.FROZEN || s === ESCROW_STATE.DISPUTED)
      return "utility:lock";
    if (s === ESCROW_STATE.RELEASED) return "utility:success";
    return "utility:info";
  }

  // ── Updated selectedOrder getter with escrow + payment props ──────────────

  get receiptConfirming() {
    return this._receiptConfirming;
  }
  get receiptConfirmed() {
    return this._receiptConfirmed;
  }

  get selectedOrder() {
    if (!this._selectedOrderId) return null;
    const o = this._realOrders.find((r) => r.id === this._selectedOrderId);
    if (!o) return null;
    return {
      ...o,
      isEscrowOrder: o.paymentMethod === "USDC_Escrow",
      isConfirmableDelivery:
        o._rawStatus === "Delivered" && o.paymentMethod !== "USDC_Escrow",
      isPendingPayment: !o.paymentMethod && o.status === "Processing",
      showDownloadInvoice: o.paymentMethod === "Stripe",
      hasPaymentDeadline: !!o.paymentDeadline,
      paymentDeadline: o.paymentDeadline || null,
      history: o.history.map((ev, i) => ({
        ...ev,
        isFirst: i === 0,
        dotCls: i === 0 ? "nos-evt-dot nos-evt-dot-active" : "nos-evt-dot",
        statusCls:
          i === 0
            ? "nos-event-status nos-event-status-active"
            : "nos-event-status"
      })),
      products: o.products.map((p) => ({
        ...p,
        lineTotal:
          p.lineTotal ||
          "$" + ((p.price || 0) * (p.quantity || 1)).toLocaleString()
      }))
    };
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  handleOpenDetail(e) {
    this._selectedOrderId = e.currentTarget.dataset.id;
    this._escrowData = null;
    this._receiptConfirming = false;
    this._receiptConfirmed = false;
    const order = this._realOrders.find((r) => r.id === this._selectedOrderId);
    if (order?.paymentMethod === "USDC_Escrow") {
      this._loadEscrowStatus(this._selectedOrderId);
    }
  }

  _loadEscrowStatus(orderNumber) {
    this._escrowLoading = true;
    getEscrowStatus({ orderNumber })
      .then((data) => {
        this._escrowData = data;
        const state = Number(data?.state ?? -1);
        if (state === ESCROW_STATE.DISPUTED || state === ESCROW_STATE.FROZEN) {
          this._startEscrowPoll(orderNumber);
        } else {
          this._stopEscrowPoll();
        }
      })
      .catch((err) => {
        console.error("[NexusOrderSystem] getEscrowStatus error:", err);
      })
      .finally(() => {
        this._escrowLoading = false;
      });
  }

  _startEscrowPoll(orderNumber) {
    if (this._escrowPollTimer) return;
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._escrowPollTimer = setInterval(() => {
      getEscrowStatus({ orderNumber })
        .then((data) => {
          this._escrowData = data;
          const state = Number(data?.state ?? -1);
          if (
            state !== ESCROW_STATE.DISPUTED &&
            state !== ESCROW_STATE.FROZEN
          ) {
            this._stopEscrowPoll();
            refreshApex(this._wiredOrdersResult);
          }
        })
        .catch(() => {});
    }, 10000);
  }

  _stopEscrowPoll() {
    if (this._escrowPollTimer) {
      clearInterval(this._escrowPollTimer);
      this._escrowPollTimer = null;
    }
  }

  connectedCallback() {
    // Wire cache can be stale when order status changes externally (e.g. via dispatch).
    // Force a server refresh after the wire's initial cached result fires.
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      if (this._wiredOrdersResult) {
        refreshApex(this._wiredOrdersResult);
      }
    }, 800);
  }

  disconnectedCallback() {
    this._stopEscrowPoll();
    this._stopLiveTracking();
  }

  // ── Live tracking private methods ──────────────────────────────────────────

  _startLiveTracking(sfOrderId) {
    if (this._liveTrackSfOrderId === sfOrderId && this._liveTrackPollTimer)
      return;
    this._stopLiveTracking();
    this._liveTrackSfOrderId = sfOrderId;
    this._fetchLivePosition();
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._liveTrackPollTimer = setInterval(() => {
      this._fetchLivePosition();
    }, 10000);
  }

  _stopLiveTracking() {
    if (this._liveTrackPollTimer) {
      clearInterval(this._liveTrackPollTimer);
      this._liveTrackPollTimer = null;
    }
    this._liveTrackSfOrderId = null;
  }

  _fetchLivePosition() {
    if (!this._liveTrackSfOrderId) return;
    getLivePosition({ orderId: this._liveTrackSfOrderId })
      .then((data) => {
        if (data) {
          this._livePos = data;
          if (!data.isLive) {
            this._stopLiveTracking();
          }
        }
      })
      .catch((err) => {
        console.error("[NexusOrderSystem] live-track poll error:", err);
      });
  }

  handleConfirmReceipt() {
    if (!this._selectedOrderId) return;
    this._escrowActionLoading = true;
    confirmReceiptFromBuyer({ orderNumber: this._selectedOrderId })
      .then(() => {
        this._dispatchToast(
          "Payment released",
          "Funds will be transferred to the seller shortly.",
          "success"
        );
        // Optimistically show RELEASED — bridge tx is async so don't re-query
        this._escrowData = { ...(this._escrowData || {}), state: 5 };
        this._stopEscrowPoll();
        refreshApex(this._wiredOrdersResult);
      })
      .catch((err) => {
        this._dispatchToast(
          "Error",
          err?.body?.message || "Could not process confirmation.",
          "error"
        );
      })
      .finally(() => {
        this._escrowActionLoading = false;
      });
  }

  handleRaiseDispute() {
    if (!this._selectedOrderId) return;
    this._disputeReason = "";
    this._disputeSuccess = false;
    this._disputeCaseNumber = null;
    this._showDisputeModal = true;
  }

  handleDisputeReasonChange(e) {
    this._disputeReason = e.target.value;
  }

  handleSubmitDispute() {
    if (this._disputeReason.trim().length < 10 || this._disputeSubmitting)
      return;
    this._disputeSubmitting = true;
    raiseDisputeWithReason({
      orderNumber: this._selectedOrderId,
      reason: this._disputeReason.trim()
    })
      .then((result) => {
        if (result && result.success) {
          this._disputeSuccess = true;
          this._disputeCaseNumber = result.caseNumber;
          refreshApex(this._wiredOrdersResult).then(() => {
            this._loadEscrowStatus(this._selectedOrderId);
          });
        } else {
          this._dispatchToast(
            "Error",
            result?.error || "Could not file dispute.",
            "error"
          );
        }
      })
      .catch((err) => {
        this._dispatchToast(
          "Error",
          err?.body?.message || "Could not file dispute.",
          "error"
        );
      })
      .finally(() => {
        this._disputeSubmitting = false;
      });
  }

  handleCancelDispute() {
    this._showDisputeModal = false;
    this._disputeReason = "";
    this._disputeSuccess = false;
    this._disputeCaseNumber = null;
    if (this._disputeSuccess) this.handleCloseDetail();
  }

  handleConfirmReceiptStripe() {
    if (
      this._receiptConfirming ||
      this._receiptConfirmed ||
      !this._selectedOrderId
    )
      return;
    this._receiptConfirming = true;
    buyerConfirmReceipt({ orderNumber: this._selectedOrderId })
      .then(() => {
        this._receiptConfirmed = true;
        refreshApex(this._wiredOrdersResult);
      })
      .catch((err) => {
        this._dispatchToast(
          "Error",
          err?.body?.message || "Could not confirm receipt.",
          "error"
        );
      })
      .finally(() => {
        this._receiptConfirming = false;
      });
  }

  handlePayStripe() {
    this.dispatchEvent(
      new CustomEvent("paystripe", {
        detail: { orderId: this._selectedOrderId },
        bubbles: true
      })
    );
  }

  handlePayUsdc() {
    if (!this._selectedOrderId || this._showEscrowPayModal) return;
    this._escrowPayStep = "review";
    this._escrowPayTxHash = null;
    this._escrowPayError = null;
    this._processingStep = 1;
    this._buyerWalletAddress = "";
    this._escrowAlreadyFunded = false;
    this._showEscrowPayModal = true;
  }

  handleReviewNext() {
    this._escrowPayStep = "wallet";
  }

  handleWalletAddressChange(e) {
    this._buyerWalletAddress = e.target.value.trim();
  }

  handleConfirmEscrowPay() {
    if (!this._selectedOrderId || !this.isWalletAddressValid) return;
    this._escrowPayStep = "processing";
    this._processingStep = 1;
    this._fundingLoading = true;
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._processingTimer = setTimeout(() => {
      if (this._escrowPayStep === "processing") {
        this._processingStep = 2;
      }
    }, 3000);
    fundEscrowForOrder({
      orderNumber: this._selectedOrderId,
      buyerWallet: this._buyerWalletAddress
    })
      .then((result) => {
        if (this._processingTimer) {
          clearTimeout(this._processingTimer);
          this._processingTimer = null;
        }
        if (result && result.success) {
          this._escrowPayTxHash = result.txHash || null;
          this._escrowPayStep = "success";
          refreshApex(this._wiredOrdersResult).then(() => {
            this._loadEscrowStatus(this._selectedOrderId);
          });
        } else {
          const errMsg = (result && result.error) || "Could not lock funds.";
          if (errMsg.toLowerCase().includes("already funded")) {
            this._escrowAlreadyFunded = true;
            this._escrowPayStep = "success";
            refreshApex(this._wiredOrdersResult).then(() => {
              this._loadEscrowStatus(this._selectedOrderId);
            });
          } else {
            this._escrowPayError = errMsg;
            this._escrowPayStep = "error";
          }
        }
      })
      .catch((err) => {
        if (this._processingTimer) {
          clearTimeout(this._processingTimer);
          this._processingTimer = null;
        }
        const errMsg =
          (err && err.body && err.body.message) ||
          "Could not process escrow payment.";
        if (errMsg.toLowerCase().includes("already funded")) {
          this._escrowAlreadyFunded = true;
          this._escrowPayStep = "success";
          refreshApex(this._wiredOrdersResult).then(() => {
            this._loadEscrowStatus(this._selectedOrderId);
          });
        } else {
          this._escrowPayError = errMsg;
          this._escrowPayStep = "error";
        }
      })
      .finally(() => {
        this._fundingLoading = false;
      });
  }

  handleRetryEscrowPay() {
    this._escrowPayStep = "wallet";
    this._escrowPayError = null;
    this._processingStep = 1;
  }

  handleCancelEscrowPay() {
    if (this._processingTimer) {
      clearTimeout(this._processingTimer);
      this._processingTimer = null;
    }
    this._showEscrowPayModal = false;
    this._escrowPayStep = "review";
    this._escrowPayTxHash = null;
    this._escrowPayError = null;
    this._buyerWalletAddress = "";
    this._escrowAlreadyFunded = false;
    this._fundingLoading = false;
  }

  handleCloseEscrowModal() {
    this._showEscrowPayModal = false;
    this._escrowPayStep = "review";
    this._escrowPayTxHash = null;
    this._escrowPayError = null;
  }

  _dispatchToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }

  handleCloseDetail() {
    this._selectedOrderId = null;
    this._escrowData = null;
    this._stopEscrowPoll();
  }
  handleStopProp(e) {
    e.stopPropagation();
  }
  handleOpenFullMap() {
    this._showFullMap = true;
  }
  handleCloseFullMap() {
    this._showFullMap = false;
  }
  handleDownloadInvoice() {
    const orderId = this.selectedOrder?._sfId;
    if (!orderId) return;
    // Derive the Salesforce org hostname from the Experience Cloud site hostname
    // e.g. orgname.develop.my.site.com → orgname.develop.my.salesforce.com
    const sfHost = window.location.hostname.replace(
      ".my.site.com",
      ".my.salesforce.com"
    );
    const url = "https://" + sfHost + "/apex/InvoiceTemplate?id=" + orderId;
    window.open(url, "_blank");
  }
}
