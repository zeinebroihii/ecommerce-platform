import { LightningElement, wire, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import getMyPassports from "@salesforce/apex/SwapController.getMyPassports";
import getPassportHistory from "@salesforce/apex/SwapController.getPassportHistory";
import getProductDetailsForPassport from "@salesforce/apex/SwapController.getProductDetailsForPassport";
import createListing from "@salesforce/apex/SwapController.createListing";

export default class NexusDigitalPassport extends LightningElement {
  @track selectedPassportId = null;
  @track _history = [];
  @track _historyLoading = false;

  // List-for-swap form
  @track _showListForm = false;
  @track _listCondition = "Mint";
  @track _listCategory = "Hardware";
  @track _listDescription = "";
  @track _listSubmitting = false;

  // Scan modal
  @track _showScanModal = false;
  @track _scanDetails = null;
  @track _scanLoading = false;

  _wiredPassports;

  @wire(getMyPassports)
  wiredPassports(result) {
    this._wiredPassports = result;
  }

  // ── Passport list ────────────────────────────────────────────────────────────

  get isLoading() {
    return !!(
      this._wiredPassports &&
      !this._wiredPassports.data &&
      !this._wiredPassports.error
    );
  }

  get isEmpty() {
    return !this.isLoading && this.assetItems.length === 0;
  }

  get assetItems() {
    const data = (this._wiredPassports && this._wiredPassports.data) || [];
    return data.map((pp) => {
      const isSelected = pp.Id === this.selectedPassportId;
      return {
        id: pp.Id,
        name: pp.Product_Name__c || pp.Name,
        serial: pp.Name,
        status: pp.Status__c || "Active",
        condition: pp.Condition__c || "—",
        purchase: pp.Purchase_Date__c ? this._fmt(pp.Purchase_Date__c) : "—",
        owner: pp.Current_Owner__r ? pp.Current_Owner__r.Name : "—",
        isTransferred: pp.Status__c === "Transferred",
        cls: isSelected
          ? "ndp-asset-card ndp-asset-card--selected"
          : "ndp-asset-card",
        chevronCls: isSelected
          ? "ndp-chevron ndp-chevron--selected"
          : "ndp-chevron"
      };
    });
  }

  // ── Selected passport ────────────────────────────────────────────────────────

  get hasSelected() {
    return !!this.selectedPassportId;
  }

  get _sel() {
    const data = (this._wiredPassports && this._wiredPassports.data) || [];
    return data.find((pp) => pp.Id === this.selectedPassportId) || null;
  }

  get selectedName() {
    return this._sel ? this._sel.Product_Name__c || this._sel.Name : "";
  }
  get selectedSerial() {
    return this._sel ? this._sel.Name : "";
  }
  get selectedCondition() {
    return this._sel ? this._sel.Condition__c || "—" : "—";
  }
  get selectedPurchase() {
    return this._sel && this._sel.Purchase_Date__c
      ? this._fmt(this._sel.Purchase_Date__c)
      : "—";
  }
  get selectedStatus() {
    return this._sel ? this._sel.Status__c || "Active" : "—";
  }
  get selectedOwner() {
    return this._sel && this._sel.Current_Owner__r
      ? this._sel.Current_Owner__r.Name
      : "—";
  }
  get selectedOrigOwner() {
    return this._sel && this._sel.Original_Owner__r
      ? this._sel.Original_Owner__r.Name
      : "—";
  }

  get historyItems() {
    return this._history.map((ev, i) => ({
      key: "ev-" + i,
      from: ev.From_Owner_Name__c || "—",
      to: ev.To_Owner_Name__c || "—",
      type: ev.Transfer_Type__c || "—",
      date: ev.Transfer_Date__c ? this._fmt(ev.Transfer_Date__c) : "—",
      condition: ev.Condition_At_Transfer__c || "—",
      isPurchase: ev.Transfer_Type__c === "Purchase",
      isSwap: ev.Transfer_Type__c === "Swap"
    }));
  }

  get isHistoryLoading() {
    return this._historyLoading;
  }
  get hasHistory() {
    return this._history.length > 0;
  }

  // ── List-for-swap form ───────────────────────────────────────────────────────

  get showListForm() {
    return this._showListForm;
  }
  get isListSubmitting() {
    return this._listSubmitting;
  }
  get listSubmitLabel() {
    return this._listSubmitting ? "Listing…" : "List Now";
  }

  get conditionOptions() {
    return [
      { label: "Mint", value: "Mint" },
      { label: "Good", value: "Good" },
      { label: "Fair", value: "Fair" },
      { label: "Poor", value: "Poor" },
      { label: "For Parts", value: "For Parts" }
    ];
  }

  get categoryOptions() {
    return [
      { label: "Hardware", value: "Hardware" },
      { label: "Networking", value: "Networking" },
      { label: "IoT", value: "IoT" },
      { label: "Software", value: "Software" },
      { label: "Other", value: "Other" }
    ];
  }

  // ── Scan modal ───────────────────────────────────────────────────────────────

  get showScanModal() {
    return this._showScanModal;
  }
  get isScanLoading() {
    return this._scanLoading;
  }
  get scanProductDescription() {
    return this._scanDetails && this._scanDetails.description
      ? this._scanDetails.description
      : "—";
  }
  get scanProductFamily() {
    return this._scanDetails && this._scanDetails.family
      ? this._scanDetails.family
      : "—";
  }
  get scanProductCode() {
    return this._scanDetails && this._scanDetails.productCode
      ? this._scanDetails.productCode
      : "—";
  }
  get scanProductBrand() {
    return this._scanDetails && this._scanDetails.brand
      ? this._scanDetails.brand
      : "—";
  }
  get scanProductCategory() {
    return this._scanDetails && this._scanDetails.category
      ? this._scanDetails.category
      : "—";
  }
  get scanProductSpecs() {
    return this._scanDetails && this._scanDetails.specs
      ? this._scanDetails.specs
      : "—";
  }
  get scanProductPrice() {
    if (!this._scanDetails || !this._scanDetails.price) return "—";
    return parseFloat(this._scanDetails.price).toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    });
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────

  handleSelectAsset(event) {
    const id = event.currentTarget.dataset.id;
    this.selectedPassportId = id;
    this._history = [];
    this._historyLoading = true;
    this._showListForm = false;
    this._showScanModal = false;
    getPassportHistory({ passportId: id })
      .then((events) => {
        this._history = events || [];
        this._historyLoading = false;
      })
      .catch(() => {
        this._historyLoading = false;
      });
  }

  // List-for-swap
  handleListForSwap() {
    this._listCondition = this._sel ? this._sel.Condition__c || "Mint" : "Mint";
    this._listCategory = "Hardware";
    this._listDescription = "";
    this._showListForm = true;
    // Pre-fetch product details for imageUrl if not already loaded
    if (!this._scanDetails && this.selectedPassportId) {
      getProductDetailsForPassport({ passportId: this.selectedPassportId })
        .then((data) => {
          this._scanDetails = data;
        })
        .catch(() => {});
    }
  }

  handleListFormClose() {
    this._showListForm = false;
  }

  handleListConditionChange(event) {
    this._listCondition = event.target.value;
  }
  handleListCategoryChange(event) {
    this._listCategory = event.target.value;
  }
  handleListDescriptionChange(event) {
    this._listDescription = event.target.value;
  }

  handleListSubmit() {
    if (!this._sel || this._listSubmitting) return;
    this._listSubmitting = true;
    const productName = this._sel.Product_Name__c || this._sel.Name;
    createListing({
      productName,
      condition: this._listCondition,
      category: this._listCategory,
      description: this._listDescription,
      co2Saved: 0,
      imageUrl:
        this._scanDetails && this._scanDetails.imageUrl
          ? this._scanDetails.imageUrl
          : ""
    })
      .then(() => {
        this._listSubmitting = false;
        this._showListForm = false;
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Listed!",
            message:
              productName + " is now live on the Nexus Swap marketplace.",
            variant: "success"
          })
        );
      })
      .catch((err) => {
        this._listSubmitting = false;
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message:
              (err.body && err.body.message) || "Could not create listing.",
            variant: "error"
          })
        );
      });
  }

  // Scan QR
  handleScanQr() {
    if (!this.selectedPassportId) return;
    this._showScanModal = true;
    this._scanLoading = true;
    this._scanDetails = null;
    getProductDetailsForPassport({ passportId: this.selectedPassportId })
      .then((data) => {
        this._scanDetails = data;
        this._scanLoading = false;
      })
      .catch(() => {
        this._scanLoading = false;
      });
  }

  handleScanModalClose() {
    this._showScanModal = false;
    this._scanDetails = null;
  }

  // Stop click inside any modal from bubbling to the overlay (which closes it)
  handleModalInnerClick(event) {
    event.stopPropagation();
  }

  // Refresh passport list from server (clears wire cache)
  handleRefresh() {
    refreshApex(this._wiredPassports);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  _fmt(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  }
}
