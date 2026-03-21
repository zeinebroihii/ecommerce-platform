import { LightningElement, wire, track } from "lwc";
import getMyOrders from "@salesforce/apex/OrderManagementController.getMyOrders";

const MOCK_ORDERS = [
  {
    id: "ORD-2024-001",
    date: "Today",
    total: 4500,
    formattedTotal: "$4,500",
    status: "In Transit",
    progress: 65,
    eta: "Tomorrow, 14:00",
    location: "Sorting Center – Paris South",
    items: 3,
    trackingNumber: "NX-99281-772",
    carrier: "Nexus Express Logistics",
    shippingAddress: "128 Innovation Blvd, Tech City, 75001 Paris",
    history: [
      {
        status: "In Transit",
        location: "Paris South Hub",
        time: "10:30 AM",
        description: "Package is being sorted for final delivery."
      },
      {
        status: "Shipped",
        location: "Lyon Distribution Center",
        time: "Yesterday, 04:15 PM",
        description: "Package has left the main warehouse."
      },
      {
        status: "Processing",
        location: "Warehouse Alpha",
        time: "Yesterday, 09:00 AM",
        description: "Order picked and packed."
      }
    ],
    products: [
      {
        id: "p1",
        name: "Nexus Core Pro",
        quantity: 1,
        price: 2500,
        image: "https://picsum.photos/seed/core/400/400"
      },
      {
        id: "p2",
        name: "Edge Sensor X1",
        quantity: 2,
        price: 1000,
        image: "https://picsum.photos/seed/sensor/400/400"
      }
    ]
  },
  {
    id: "ORD-2023-098",
    date: "March 12, 2024",
    total: 12800,
    formattedTotal: "$12,800",
    status: "Delivered",
    progress: 100,
    eta: "Delivered March 14",
    location: "Your Address",
    items: 12,
    trackingNumber: "NX-88102-115",
    carrier: "Nexus Global Freight",
    shippingAddress: "128 Innovation Blvd, Tech City, 75001 Paris",
    history: [
      {
        status: "Delivered",
        location: "Your Address",
        time: "Mar 14, 02:30 PM",
        description: "Package delivered and signed by M. Ross."
      },
      {
        status: "Out for Delivery",
        location: "Paris Central",
        time: "Mar 14, 08:00 AM",
        description: "Package is with the local courier."
      },
      {
        status: "Arrived at Hub",
        location: "Paris South Hub",
        time: "Mar 13, 11:45 PM",
        description: "Package arrived at local sorting facility."
      }
    ],
    products: [
      {
        id: "p3",
        name: "Industrial Gateway v2",
        quantity: 4,
        price: 3200,
        image: "https://picsum.photos/seed/gateway/400/400"
      }
    ]
  }
];

const STATUS_MAP = {
  Draft: { label: "Processing", progress: 20 },
  Activated: { label: "Processing", progress: 30 },
  Shipped: { label: "In Transit", progress: 65 },
  Delivered: { label: "Delivered", progress: 100 },
  Cancelled: { label: "Cancelled", progress: 0 }
};

function mapSfOrder(o) {
  const s = STATUS_MAP[o.status] || {
    label: o.status || "Processing",
    progress: 25
  };
  return {
    id: o.orderNumber,
    _sfId: o.orderId,
    date: o.orderDate || "—",
    total: o.totalAmount || 0,
    formattedTotal: o.formattedTotal || o.totalAmount + " €",
    status: s.label,
    progress: s.progress,
    eta: s.label === "Delivered" ? "Delivered" : "Being processed",
    location: o.shippingAddress || "—",
    items: o.itemCount || 0,
    trackingNumber: o.orderNumber,
    carrier: "Nexus Express Logistics",
    shippingAddress: o.shippingAddress || "—",
    formattedShipping: o.formattedShipping || "—",
    hasSparksDiscount: o.hasSparksDiscount || false,
    formattedSparksDiscount: o.formattedSparksDiscount || null,
    isReal: true,
    history: [
      {
        status: s.label,
        location: o.shippingAddress || "—",
        time: o.orderDate || "—",
        description: "Order placed and payment confirmed."
      }
    ],
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

  @wire(getMyOrders)
  wiredOrders({ data, error }) {
    if (data) this._realOrders = data.map(mapSfOrder);
    if (error)
      console.error(
        "[NexusOrderSystem] getMyOrders error:",
        JSON.stringify(error)
      );
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
    // Real orders first (pinned at top), then mocks
    return [...this._realOrders, ...MOCK_ORDERS].map((o) => this._decorate(o));
  }

  get selectedOrder() {
    if (!this._selectedOrderId) return null;
    const all = [...this._realOrders, ...MOCK_ORDERS];
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
    this.dispatchEvent(
      new CustomEvent("toast", {
        detail: {
          title: "Invoice",
          message: "Generating invoice PDF...",
          variant: "info"
        }
      })
    );
  }
}
