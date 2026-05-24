import { LightningElement, wire, track } from "lwc";
import { CurrentPageReference } from "lightning/navigation";
import getTrackingByToken from "@salesforce/apex/LiveTrackingController.getTrackingByToken";
import getActiveDeliveries from "@salesforce/apex/LiveTrackingController.getActiveDeliveries";

export default class NexusLiveTracker extends LightningElement {
  @track _token = null;
  @track _data = null;
  @track _others = [];
  @track _viewedToken = null; // null = viewing own order
  @track _loading = true;
  @track _notFound = false;
  _pollTimer = null;

  // ── Read token from URL query param (?token=xxx) ──────────────────────────
  @wire(CurrentPageReference)
  handlePageRef(ref) {
    if (ref && ref.state && ref.state.token) {
      this._token = ref.state.token;
      this._loadTracking();
      this._startPoll();
    } else {
      this._loading = false;
      this._notFound = true;
    }
  }

  disconnectedCallback() {
    this._stopPoll();
  }

  // ── Computed state getters ─────────────────────────────────────────────────

  get isLoading() {
    return this._loading;
  }
  get isInvalid() {
    return !this._loading && this._notFound;
  }
  get hasData() {
    return !this._loading && !this._notFound && this._data != null;
  }

  get viewedData() {
    if (this._viewedToken) {
      const pin = this._others.find(
        (o) => o.trackingToken === this._viewedToken
      );
      if (pin)
        return {
          lat: pin.lat,
          lng: pin.lng,
          orderNumber: pin.orderNumber,
          isLive: true
        };
    }
    return this._data;
  }

  get isLive() {
    return this.viewedData && this.viewedData.isLive;
  }
  get isDelivered() {
    return this._data && this._data.status === "Delivered";
  }
  get hasPosition() {
    return !!(this.viewedData && this.viewedData.lat && this.viewedData.lng);
  }
  get orderNumber() {
    return this.viewedData ? this.viewedData.orderNumber : "—";
  }
  get isViewingOther() {
    return this._viewedToken !== null;
  }

  get etaLabel() {
    if (this._viewedToken) return null;
    if (!this._data || this._data.etaMinutes == null) return "Calculating...";
    if (this._data.etaMinutes <= 1) return "< 1 min";
    return this._data.etaMinutes + " min";
  }
  get riderAddress() {
    if (this._viewedToken) return null;
    return this._data && this._data.riderAddress
      ? this._data.riderAddress
      : null;
  }
  get showEtaRow() {
    return !this.isViewingOther && !this.isDelivered;
  }

  get mapMarkers() {
    if (!this.hasPosition) return [];
    return [
      {
        location: {
          Latitude: this.viewedData.lat,
          Longitude: this.viewedData.lng
        },
        title: this.viewedData.orderNumber,
        description: this._viewedToken
          ? "Other delivery"
          : "ETA: " + this.etaLabel
      }
    ];
  }

  get otherDeliveries() {
    return this._others
      .filter((o) => o.trackingToken !== this._token)
      .map((o) => ({
        trackingToken: o.trackingToken,
        orderNumber: o.orderNumber,
        shortNum: "#" + (o.orderNumber || "").replace(/^0+/, ""),
        isSelected: o.trackingToken === this._viewedToken,
        cardClass:
          o.trackingToken === this._viewedToken
            ? "nlt-pin-card nlt-pin-card--active"
            : "nlt-pin-card"
      }));
  }
  get hasOthers() {
    return this.otherDeliveries.length > 0;
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  selectOther(event) {
    const t = event.currentTarget.dataset.token;
    this._viewedToken = this._viewedToken === t ? null : t;
  }

  backToMyOrder() {
    this._viewedToken = null;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  _loadTracking() {
    getTrackingByToken({ token: this._token })
      .then((data) => {
        if (data) {
          this._data = data;
          this._notFound = false;
          if (data.status === "Delivered") this._stopPoll();
        } else {
          this._notFound = true;
          this._stopPoll();
        }
      })
      .catch(() => {
        this._notFound = true;
        this._stopPoll();
      })
      .finally(() => {
        this._loading = false;
      });

    getActiveDeliveries()
      .then((pins) => {
        this._others = pins || [];
      })
      .catch(() => {});
  }

  _startPoll() {
    if (this._pollTimer) return;
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._pollTimer = setInterval(() => {
      if (this._token) this._loadTracking();
    }, 10000);
  }

  _stopPoll() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }
}
