import { LightningElement, api, track } from "lwc";

export default class NexusPortalCartSummary extends LightningElement {
  @api subtotal = 0;
  @api itemCount = 0;
  @api sparksBalance = 0;
  @api isB2C = false;

  @track appliedSparks = 0;
  @track sparksInput = "";
  @track showError = false;

  // ── raw values ──────────────────────────────────────────────────
  get _sub() {
    return parseFloat(this.subtotal) || 0;
  }
  get _balance() {
    return parseInt(this.sparksBalance, 10) || 0;
  }
  get _inputNum() {
    return this.sparksInput === "" ? 0 : parseInt(this.sparksInput, 10) || 0;
  }

  // ── sparks maths ────────────────────────────────────────────────
  get sparksValue() {
    return this.appliedSparks / 100;
  }
  get _maxRedeemable() {
    return Math.min(this._balance, Math.floor(this._sub * 100));
  }

  // ── boolean flags ───────────────────────────────────────────────
  get hasSparks() {
    return this._balance > 0 && this._sub > 0;
  }
  get sparksApplied() {
    return this.appliedSparks > 0;
  }
  get isOverBalance() {
    return this._inputNum > this._balance;
  }
  get applyDisabled() {
    return this._inputNum <= 0 || this.isOverBalance;
  }
  get isFreeShipping() {
    return this._sub > 5000;
  }

  // ── formatted values ────────────────────────────────────────────
  get formattedSubtotal() {
    return "$" + this._sub.toFixed(0);
  }
  get formattedSparksDisc() {
    return "-$" + this.sparksValue.toFixed(2);
  }
  get formattedTotal() {
    const total = Math.max(0, this._sub - this.sparksValue);
    return "$" + total.toFixed(0);
  }

  get maxRedeemableLabel() {
    return this._maxRedeemable;
  }
  get appliedLabel() {
    return this.appliedSparks + " Sparks";
  }
  get inputClass() {
    return this.showError
      ? "npcs-sparks-input npcs-sparks-input--error"
      : "npcs-sparks-input";
  }

  // ── Sparks handlers ─────────────────────────────────────────────
  handleSparksInput(e) {
    const val = e.target.value;
    this.sparksInput = val === "" ? "" : parseInt(val, 10) || "";
    this.showError =
      typeof this.sparksInput === "number" && this.sparksInput > this._balance;
  }

  handleApplySparks() {
    if (this.applyDisabled) return;
    this.appliedSparks = Math.min(this._inputNum, Math.floor(this._sub * 100));
    this.showError = false;
  }

  handleRemoveSparks() {
    this.appliedSparks = 0;
    this.sparksInput = "";
    this.showError = false;
  }

  handleApplyMax() {
    const max = this._maxRedeemable;
    this.appliedSparks = max;
    this.sparksInput = max;
    this.showError = false;
  }

  // ── Action buttons ──────────────────────────────────────────────
  handlePlaceOrder() {
    this.dispatchEvent(
      new CustomEvent("placeorder", {
        bubbles: true,
        detail: { appliedSparks: this.appliedSparks }
      })
    );
  }

  handleRequestQuote() {
    this.dispatchEvent(new CustomEvent("requestquote", { bubbles: true }));
  }
}
