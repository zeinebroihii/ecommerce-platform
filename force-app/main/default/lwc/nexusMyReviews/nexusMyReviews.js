import { LightningElement, wire, track } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getEligibleQuotes from "@salesforce/apex/TestimonialController.getEligibleQuotes";
import getMyTestimonials from "@salesforce/apex/TestimonialController.getMyTestimonials";

const STATUS_LABELS = {
  Pending: "Pending",
  Approved: "Published",
  Rejected: "Not published"
};
const STATUS_CLS = {
  Pending: "nmr-status nmr-status--pending",
  Approved: "nmr-status nmr-status--approved",
  Rejected: "nmr-status nmr-status--rejected"
};
const AVATAR_CLS = {
  emerald: "nmr-avatar nmr-avatar--emerald",
  indigo: "nmr-avatar nmr-avatar--indigo",
  rose: "nmr-avatar nmr-avatar--rose",
  amber: "nmr-avatar nmr-avatar--amber"
};

export default class NexusMyReviews extends LightningElement {
  @track _formOpen = false;
  @track _activeQuoteId = null;
  @track _activeQuoteName = "";

  // ── Wired data (keep raw result for refreshApex) ──────────────────────────

  _eligibleWire;
  @wire(getEligibleQuotes)
  wiredEligible(result) {
    this._eligibleWire = result;
  }

  _myWire;
  @wire(getMyTestimonials)
  wiredMy(result) {
    this._myWire = result;
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get loading() {
    const eReady =
      this._eligibleWire &&
      (this._eligibleWire.data || this._eligibleWire.error);
    const mReady = this._myWire && (this._myWire.data || this._myWire.error);
    return !eReady || !mReady;
  }

  get eligibleQuotes() {
    return (this._eligibleWire && this._eligibleWire.data) || [];
  }

  get hasEligible() {
    return this.eligibleQuotes.length > 0;
  }

  get eligibleCount() {
    return this.eligibleQuotes.length;
  }

  get myReviews() {
    const raw = (this._myWire && this._myWire.data) || [];
    return raw.map((r) => ({
      ...r,
      stars: [1, 2, 3, 4, 5].map((v) => ({
        key: String(v),
        cls: v <= r.rating ? "nmr-star nmr-star--on" : "nmr-star nmr-star--off"
      })),
      statusLabel: STATUS_LABELS[r.status] || r.status,
      statusCls: STATUS_CLS[r.status] || "nmr-status nmr-status--pending",
      avatarCls: AVATAR_CLS[r.avatarColor] || "nmr-avatar nmr-avatar--emerald"
    }));
  }

  get hasMyReviews() {
    return this.myReviews.length > 0;
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  handleOpenForm(e) {
    this._activeQuoteId = e.currentTarget.dataset.id;
    this._activeQuoteName = e.currentTarget.dataset.name;
    this._formOpen = true;
  }

  handleFormClose() {
    this._formOpen = false;
    this._activeQuoteId = null;
    this._activeQuoteName = "";
  }

  handleFormSubmitted() {
    this._formOpen = false;
    this._activeQuoteId = null;
    this._activeQuoteName = "";
    // Properly bust the cacheable wire cache
    refreshApex(this._eligibleWire);
    refreshApex(this._myWire);
  }
}
