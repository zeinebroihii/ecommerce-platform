import { LightningElement, api, track } from "lwc";
import { CloseActionScreenEvent } from "lightning/actions";
import { getRecordNotifyChange } from "lightning/uiRecordApi";
import getDispatchInfo from "@salesforce/apex/LiveTrackingController.getDispatchInfo";
import confirmDelivery from "@salesforce/apex/LiveTrackingController.confirmDelivery";

export default class NexusMarkDelivered extends LightningElement {
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

  @track _state = "loading"; // loading | ready | already | success | error
  @track _orderNumber = "";
  @track _orderStatus = "";
  @track _buyerPhone = "";
  @track _confirming = false;
  @track _errorMsg = null;

  _loadInfo() {
    getDispatchInfo({ orderId: this._recordId })
      .then((info) => {
        this._orderNumber = info.orderNumber;
        this._orderStatus = info.orderStatus;
        this._buyerPhone = info.buyerPhone || "";
        this._state = info.orderStatus === "Delivered" ? "already" : "ready";
      })
      .catch((err) => {
        this._errorMsg = err?.body?.message || "Failed to load order info.";
        this._state = "error";
      });
  }

  get isLoading() {
    return this._state === "loading";
  }
  get isReady() {
    return this._state === "ready";
  }
  get isAlready() {
    return this._state === "already";
  }
  get isSuccess() {
    return this._state === "success";
  }
  get hasError() {
    return this._state === "error";
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
  get confirming() {
    return this._confirming;
  }
  get confirmDisabled() {
    return this._confirming;
  }
  get errorMsg() {
    return this._errorMsg;
  }
  get hasBuyerPhone() {
    return !!this._buyerPhone.trim();
  }

  get statusBadgeCls() {
    const s = this._orderStatus;
    if (s === "Delivered" || s === "Completed")
      return "nmd-badge nmd-badge-green";
    if (s === "Shipped") return "nmd-badge nmd-badge-blue";
    if (s === "Activated") return "nmd-badge nmd-badge-indigo";
    return "nmd-badge";
  }

  handleConfirm() {
    if (this._confirming) return;
    this._confirming = true;
    confirmDelivery({ orderId: this._recordId })
      .then(() => {
        this._state = "success";
        getRecordNotifyChange([{ recordId: this._recordId }]);
      })
      .catch((err) => {
        this._errorMsg =
          err?.body?.message || "Failed to mark order as delivered.";
        this._state = "error";
      })
      .finally(() => {
        this._confirming = false;
      });
  }

  handleClose() {
    this.dispatchEvent(new CloseActionScreenEvent());
  }
}
