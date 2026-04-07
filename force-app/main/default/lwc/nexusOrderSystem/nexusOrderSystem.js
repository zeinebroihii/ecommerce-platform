import { LightningElement, wire, track } from "lwc";
import getMyOrders from "@salesforce/apex/OrderManagementController.getMyOrders";

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

export default class NexusOrderSystem extends LightningElement {
  @track _selectedOrderId = null;
  @track _showFullMap = false;
  @track _realOrders = [];
  @track _loaded = false;

  @wire(getMyOrders)
  wiredOrders({ data, error }) {
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

  get selectedOrder() {
    if (!this._selectedOrderId) return null;
    const all = [...this._realOrders];
    const o = all.find((r) => r.id === this._selectedOrderId);
    if (!o) return null;
    return {
      ...o,
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

  get showDetailModal() {
    return !!this._selectedOrderId;
  }
  get showFullMap() {
    return this._showFullMap;
  }

  handleOpenDetail(e) {
    this._selectedOrderId = e.currentTarget.dataset.id;
  }
  handleCloseDetail() {
    this._selectedOrderId = null;
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
