import { LightningElement, api, track } from "lwc";
import { CloseActionScreenEvent } from "lightning/actions";
import { getRecordNotifyChange } from "lightning/uiRecordApi";
import getDispatchInfo from "@salesforce/apex/LiveTrackingController.getDispatchInfo";
import startDelivery from "@salesforce/apex/LiveTrackingController.startDelivery";
import syncTrackerDeviceId from "@salesforce/apex/LiveTrackingController.syncTrackerDeviceId";

export default class NexusDispatchAction extends LightningElement {
  @api
  get recordId() {
    return this._recordId;
  }
  set recordId(value) {
    this._recordId = value;
    if (value && !this._infoLoaded) {
      this._infoLoaded = true;
      this._loadInfo();
    }
  }
  _recordId = null;
  _infoLoaded = false;

  @track _state = "loading"; // loading | ready | success | error
  @track _orderNumber = "";
  @track _orderStatus = "";
  @track _riders = [];
  @track _buyerPhone = "";
  @track _selectedRiderId = null;
  @track _selectedDeviceId = null;
  @track _dispatching = false;
  @track _trackingUrl = null;
  @track _errorMsg = null;

  // Tracker sync (for Shipped orders)
  @track _currentDeviceId = "";
  @track _newDeviceId = "";
  @track _syncing = false;
  @track _syncSuccess = false;

  _loadInfo() {
    getDispatchInfo({ orderId: this._recordId })
      .then((info) => {
        this._orderNumber = info.orderNumber;
        this._orderStatus = info.orderStatus;
        this._riders = info.riders || [];
        this._buyerPhone = info.buyerPhone || "";
        this._currentDeviceId = info.riderDeviceId || "";
        this._newDeviceId = info.riderDeviceId || "";
        this._state = "ready";
      })
      .catch((err) => {
        this._errorMsg = err?.body?.message || "Failed to load order info.";
        this._state = "error";
      });
  }

  // ── State getters ──────────────────────────────────────────────────────────
  get isLoading() {
    return this._state === "loading";
  }
  get isReady() {
    return this._state === "ready";
  }
  get isSuccess() {
    return this._state === "success";
  }
  get hasError() {
    return this._state === "error";
  }

  // ── Status getters ─────────────────────────────────────────────────────────
  get isActivated() {
    return this._orderStatus === "Activated";
  }
  get isShipped() {
    return this._orderStatus === "Shipped";
  }
  get cannotDispatch() {
    return !this.isActivated && !this.isShipped;
  }

  // ── Data getters ───────────────────────────────────────────────────────────
  get riders() {
    return this._riders;
  }
  get hasRiders() {
    return this._riders.length > 0;
  }
  get orderNumber() {
    return this._orderNumber;
  }
  get orderStatus() {
    return this._orderStatus;
  }
  get buyerPhone() {
    return this._buyerPhone;
  }
  get trackingUrl() {
    return this._trackingUrl;
  }
  get errorMsg() {
    return this._errorMsg;
  }
  get dispatching() {
    return this._dispatching;
  }
  get currentDeviceId() {
    return this._currentDeviceId || "(not set)";
  }
  get newDeviceId() {
    return this._newDeviceId;
  }
  get syncing() {
    return this._syncing;
  }
  get syncSuccess() {
    return this._syncSuccess;
  }

  get dispatchDisabled() {
    return (
      !this._selectedDeviceId ||
      !this._buyerPhone.trim() ||
      this._dispatching ||
      !this.hasRiders
    );
  }

  get syncDisabled() {
    return !this._newDeviceId.trim() || this._syncing || this._syncSuccess;
  }

  get statusBadgeCls() {
    if (this._orderStatus === "Activated") return "nda-badge nda-badge-green";
    if (this._orderStatus === "Shipped") return "nda-badge nda-badge-blue";
    return "nda-badge";
  }

  // ── Dispatch handlers ──────────────────────────────────────────────────────
  handleRiderChange(e) {
    const selectedId = e.target.value;
    this._selectedRiderId = selectedId;
    const rider = this._riders.find((r) => r.id === selectedId);
    this._selectedDeviceId = rider ? rider.deviceId : null;
  }

  handlePhoneChange(e) {
    this._buyerPhone = e.target.value;
  }

  handleDispatch() {
    if (this.dispatchDisabled) return;
    this._dispatching = true;
    startDelivery({
      orderId: this.recordId,
      riderDeviceId: this._selectedDeviceId,
      buyerWhatsapp: this._buyerPhone.trim(),
      destLat: null,
      destLng: null
    })
      .then((url) => {
        this._trackingUrl = url;
        this._state = "success";
        getRecordNotifyChange([{ recordId: this.recordId }]);
      })
      .catch((err) => {
        this._errorMsg =
          err?.body?.message || "Dispatch failed. Please try again.";
        this._state = "error";
      })
      .finally(() => {
        this._dispatching = false;
      });
  }

  // ── Sync tracker handlers (Shipped orders) ─────────────────────────────────
  handleNewDeviceIdChange(e) {
    this._newDeviceId = e.target.value;
  }

  handleSyncTracker() {
    if (this.syncDisabled) return;
    this._syncing = true;
    syncTrackerDeviceId({
      orderId: this.recordId,
      traccarDeviceId: this._newDeviceId.trim()
    })
      .then(() => {
        this._syncSuccess = true;
        this._currentDeviceId = this._newDeviceId.trim();
        getRecordNotifyChange([{ recordId: this.recordId }]);
      })
      .catch((err) => {
        this._errorMsg = err?.body?.message || "Sync failed. Please try again.";
        this._state = "error";
      })
      .finally(() => {
        this._syncing = false;
      });
  }

  handleCopyUrl() {
    if (this._trackingUrl) {
      navigator.clipboard.writeText(this._trackingUrl).catch(() => {});
    }
  }

  handleClose() {
    this.dispatchEvent(new CloseActionScreenEvent());
  }
}
