import { LightningElement, api, track } from "lwc";
import submitTestimonial from "@salesforce/apex/TestimonialController.submitTestimonial";

export default class NexusTestimonialForm extends LightningElement {
  @api quoteId = null;

  @track _rating = 0;
  @track _hovered = 0;
  @track message = "";
  @track msgError = "";
  @track error = "";
  @track loading = false;
  @track submitted = false;

  // ── Star list ──────────────────────────────────────────────────────────────

  get starList() {
    return [1, 2, 3, 4, 5].map((v) => {
      const active = v <= (this._hovered || this._rating);
      return {
        value: v,
        cls: active ? "ntf-star ntf-star--active" : "ntf-star",
        ariaLabel: v + (v === 1 ? " star" : " stars")
      };
    });
  }

  // ── Computed ───────────────────────────────────────────────────────────────

  get charCount() {
    return this.message.length;
  }

  get textareaClass() {
    return this.msgError ? "ntf-textarea ntf-textarea--error" : "ntf-textarea";
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  handleStarHover(e) {
    this._hovered = parseInt(e.currentTarget.dataset.value, 10);
  }

  handleStarLeave() {
    this._hovered = 0;
  }

  handleStarClick(e) {
    this._rating = parseInt(e.currentTarget.dataset.value, 10);
    this._hovered = 0;
  }

  handleMessageChange(e) {
    this.message = e.target.value;
    if (this.message.trim().length > 0) {
      this.msgError = "";
    }
  }

  handleBackdropClick() {
    this.handleClose();
  }

  handleClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  async handleSubmit() {
    if (this._rating === 0) {
      this.error = "Please select a rating before submitting.";
      return;
    }
    if (!this.message.trim()) {
      this.msgError = "A message is required.";
      return;
    }
    this.error = "";
    this.msgError = "";
    this.loading = true;

    try {
      await submitTestimonial({
        quoteId: this.quoteId,
        rating: this._rating,
        message: this.message.trim(),
        role: ""
      });
      this.submitted = true;
      this.dispatchEvent(new CustomEvent("submitted"));
    } catch (err) {
      const msg =
        err?.body?.message ||
        err?.message ||
        "An error occurred. Please try again.";
      this.error = msg;
    } finally {
      this.loading = false;
    }
  }
}
