import { LightningElement, track, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

const BADGE_CLASSES = {
  success: "nes-badge nes-badge-success",
  primary: "nes-badge nes-badge-primary",
  warning: "nes-badge nes-badge-warning",
  danger: "nes-badge nes-badge-warning",
  secondary: "nes-badge nes-badge-secondary"
};

function activityBadgeType(item) {
  const s = (item.status || "").toLowerCase();
  if (
    s === "livrée" ||
    s === "delivered" ||
    s === "accepted" ||
    s === "activée"
  )
    return "success";
  if (s === "annulée" || s === "cancelled" || s === "rejected")
    return "warning";
  if (s === "brouillon" || s === "draft") return "secondary";
  return "primary";
}

export default class NexusEngagementSystem extends LightningElement {
  @track isHistoryOpen = false;
  @track selectedOffer = null;

  /** Real activity items passed from the portal (orders + quotes). */
  @api activityItems;

  // ── Derived lists ──────────────────────────────────────────────────────────
  get activities() {
    const items = this.activityItems;
    if (items && items.length) {
      return items.map((a, i) => ({
        id: a.itemId || String(i + 1),
        title: a.title,
        time: a.dateLabel || "",
        client: a.subtitle || "",
        status: a.status || "",
        badgeCls:
          BADGE_CLASSES[activityBadgeType(a)] || BADGE_CLASSES.secondary,
        icon: a.icon || "utility:activity",
        rawType: a.type || ""
      }));
    }
    return [];
  }

  get hasActivities() {
    return this.activities.length > 0;
  }
  get hasNoActivities() {
    return !this.hasActivities;
  }

  get hasOffer() {
    return !!this.selectedOffer;
  }

  // ── CSS class getters ──────────────────────────────────────────────────────
  get historyOverlayCls() {
    return this.isHistoryOpen
      ? "nes-overlay nes-overlay-visible"
      : "nes-overlay";
  }
  get historyPanelCls() {
    return this.isHistoryOpen ? "nes-panel nes-panel-open" : "nes-panel";
  }
  get offerOverlayCls() {
    return this.hasOffer ? "nes-overlay nes-overlay-visible" : "nes-overlay";
  }
  get offerPanelCls() {
    return this.hasOffer
      ? "nes-panel nes-offer-panel nes-panel-open"
      : "nes-panel nes-offer-panel";
  }

  // ── Public API (called by parent via template.querySelector) ───────────────
  @api openHistory() {
    this.isHistoryOpen = true;
  }

  @api closeHistory() {
    this.isHistoryOpen = false;
  }

  @api openOffer(offerData) {
    this.selectedOffer = {
      ...offerData,
      reasonFull:
        offerData.reason +
        ". Ce produit a été sélectionné par notre algorithme prédictif car il complète parfaitement vos actifs et vos habitudes d'utilisation actuels."
    };
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  handleCloseHistory() {
    this.isHistoryOpen = false;
  }
  handleCloseOffer() {
    this.selectedOffer = null;
  }

  handleActivityRowClick(event) {
    const type = event.currentTarget.dataset.type;
    this.isHistoryOpen = false;
    this.dispatchEvent(
      new CustomEvent("activityclick", {
        detail: { type },
        bubbles: true,
        composed: true
      })
    );
  }

  handleAddToCart() {
    const offer = this.selectedOffer;
    this.selectedOffer = null;
    // Notify parent to add the item to the shared cart
    this.dispatchEvent(new CustomEvent("addtocart", { detail: { offer } }));
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Cart",
        message: `${offer.name} added to cart.`,
        variant: "success"
      })
    );
  }
}
