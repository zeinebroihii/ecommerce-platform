import { LightningElement, wire, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import getMyOrders from "@salesforce/apex/OrderManagementController.getMyOrders";
import getEscrowStatus from "@salesforce/apex/EscrowBridgeController.getEscrowStatus";
import confirmReceiptFromBuyer from "@salesforce/apex/EscrowBridgeController.confirmReceiptFromBuyer";
import raiseDisputeFromBuyer from "@salesforce/apex/EscrowBridgeController.raiseDisputeFromBuyer";
import fundEscrowForOrder from "@salesforce/apex/EscrowBridgeController.fundEscrowForOrder";

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

  // Step always present: Processing
  const stepProcessing = {
    status: "Processing",
    location: addr,
    time: orderDate || "—",
    description: "Order placed and payment confirmed."
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
    // Payment method: 'Stripe' | 'USDC_Escrow' | 'Cash' | null (pending choice)
    paymentMethod: o.paymentMethod || null,
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
  _countdownInterval = null;
  _processingTimer = null;
  _wiredOrdersResult;

  @wire(getMyOrders)
  wiredOrders(result) {
    this._wiredOrdersResult = result;
    const { data, error } = result;
    if (data) {
      this._realOrders = data.map(mapSfOrder);
      this._loaded = true;
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

  get escrowPayIsProcessing() {
    return this._escrowPayStep === "processing";
  }

  get escrowPayIsSuccess() {
    return this._escrowPayStep === "success";
  }

  get escrowPayIsError() {
    return this._escrowPayStep === "error";
  }

  get processingStep1Done() {
    return this._processingStep > 1;
  }

  get processingStep2Active() {
    return this._processingStep === 2;
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
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
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

  get selectedOrder() {
    if (!this._selectedOrderId) return null;
    const o = this._realOrders.find((r) => r.id === this._selectedOrderId);
    if (!o) return null;
    return {
      ...o,
      isEscrowOrder: o.paymentMethod === "USDC_Escrow",
      isPendingPayment: !o.paymentMethod && o.status === "Processing",
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
      })
      .catch((err) => {
        console.error("[NexusOrderSystem] getEscrowStatus error:", err);
      })
      .finally(() => {
        this._escrowLoading = false;
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
        this._loadEscrowStatus(this._selectedOrderId);
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
    this._escrowActionLoading = true;
    raiseDisputeFromBuyer({ orderNumber: this._selectedOrderId })
      .then(() => {
        this._dispatchToast(
          "Dispute raised",
          "Payment has been frozen. Our team will review your case.",
          "warning"
        );
        this._loadEscrowStatus(this._selectedOrderId);
      })
      .catch((err) => {
        this._dispatchToast(
          "Error",
          err?.body?.message || "Could not raise dispute.",
          "error"
        );
      })
      .finally(() => {
        this._escrowActionLoading = false;
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
    this._showEscrowPayModal = true;
  }

  handleConfirmEscrowPay() {
    if (!this._selectedOrderId) return;
    this._escrowPayStep = "processing";
    this._processingStep = 1;
    this._fundingLoading = true;
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._processingTimer = setTimeout(() => {
      if (this._escrowPayStep === "processing") {
        this._processingStep = 2;
      }
    }, 3000);
    fundEscrowForOrder({ orderNumber: this._selectedOrderId })
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
          this._escrowPayError =
            (result && result.error) || "Could not lock funds.";
          this._escrowPayStep = "error";
        }
      })
      .catch((err) => {
        if (this._processingTimer) {
          clearTimeout(this._processingTimer);
          this._processingTimer = null;
        }
        this._escrowPayError =
          (err && err.body && err.body.message) ||
          "Could not process escrow payment.";
        this._escrowPayStep = "error";
      })
      .finally(() => {
        this._fundingLoading = false;
      });
  }

  handleRetryEscrowPay() {
    this._escrowPayStep = "review";
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
