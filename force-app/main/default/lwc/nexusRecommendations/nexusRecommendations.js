import { LightningElement, track } from "lwc";
import getRecommendations from "@salesforce/apex/RecommendationController.getRecommendations";

const CART_KEY = "ecomm_cart";
const BROWSE_KEY = "nexus_browse_history";

const TYPE_CONFIG = {
  "Cross-Sell": {
    icon: "utility:connected_apps",
    cls: "nrec-type-badge nrec-type-cross"
  },
  "Up-Sell": { icon: "utility:arrowup", cls: "nrec-type-badge nrec-type-up" },
  Similar: {
    icon: "utility:product_workspace",
    cls: "nrec-type-badge nrec-type-sim"
  }
};

function formatPrice(price) {
  if (price == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(price);
}

function enrichRec(rec) {
  const typeCfg = TYPE_CONFIG[rec.recType] || TYPE_CONFIG.Similar;
  const rating = rec.rating || 0;
  return {
    ...rec,
    priceFormatted: formatPrice(rec.price),
    ratingDisplay: rating.toFixed(1),
    typeBadgeClass: typeCfg.cls,
    typeIcon: typeCfg.icon,
    scoreBarStyle: `width:${Math.min(rec.score, 100)}%`,
    stars: [1, 2, 3, 4, 5].map((n) => ({
      n,
      cls: n <= Math.round(rating) ? "nrec-star nrec-star--on" : "nrec-star"
    }))
  };
}

export default class NexusRecommendations extends LightningElement {
  @track _recs = [];
  @track isLoading = false;
  @track hasError = false;

  connectedCallback() {
    this._load();
  }

  // ── Public refresh (called by parent when cart changes) ───────────────────

  refreshRecommendations() {
    this._load();
  }

  // ── Data load ─────────────────────────────────────────────────────────────

  _load() {
    this.isLoading = true;
    this.hasError = false;

    const cartJson = sessionStorage.getItem(CART_KEY) || "[]";
    const browseJson = sessionStorage.getItem(BROWSE_KEY) || "[]";

    getRecommendations({ cartJson, browseJson })
      .then((data) => {
        this._recs = (data || []).map(enrichRec);
        this.isLoading = false;
        // Notify navbar (badge count) and portal (browse popup)
        document.dispatchEvent(
          new CustomEvent("nexusrecloaded", {
            detail: {
              count: this._recs.length,
              topRec:
                this._recs.length > 0
                  ? {
                      productId: this._recs[0].productId,
                      productName: this._recs[0].productName,
                      imageUrl: this._recs[0].imageUrl,
                      priceFormatted: this._recs[0].priceFormatted,
                      reason: this._recs[0].reason,
                      productFamily: this._recs[0].productFamily,
                      recType: this._recs[0].recType
                    }
                  : null,
              recs: this._recs.map((r) => ({
                productId: r.productId,
                productName: r.productName,
                imageUrl: r.imageUrl,
                priceFormatted: r.priceFormatted,
                reason: r.reason,
                productFamily: r.productFamily,
                recType: r.recType
              }))
            }
          })
        );
      })
      .catch((err) => {
        console.error("[NexusRecommendations] error:", err);
        this.hasError = true;
        this.isLoading = false;
      });
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get recommendations() {
    return this._recs;
  }

  get hasRecommendations() {
    return !this.isLoading && !this.hasError && this._recs.length > 0;
  }

  get isEmpty() {
    return !this.isLoading && !this.hasError && this._recs.length === 0;
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  handleRefresh() {
    this._load();
  }

  handleViewProduct(event) {
    const id = event.currentTarget.dataset.id;
    const rec = this._recs.find((r) => r.productId === id);
    if (!rec) return;
    this.dispatchEvent(
      new CustomEvent("viewproduct", {
        detail: { productId: rec.productId },
        bubbles: true,
        composed: true
      })
    );
  }

  handleViewOffer(event) {
    const btn = event.currentTarget;
    this.dispatchEvent(
      new CustomEvent("viewoffer", {
        detail: {
          id: btn.dataset.id,
          name: btn.dataset.name,
          category: btn.dataset.category,
          price: btn.dataset.price,
          image: btn.dataset.image,
          reason: btn.dataset.reason
        },
        bubbles: true,
        composed: true
      })
    );
  }

  handleAddToCart(event) {
    const id = event.currentTarget.dataset.id;
    const rec = this._recs.find((r) => r.productId === id);
    if (!rec) return;
    this.dispatchEvent(
      new CustomEvent("addtocart", {
        detail: {
          product: {
            id: rec.productId,
            name: rec.productName,
            family: rec.productFamily,
            price: rec.price,
            image: rec.imageUrl,
            unitPrice: rec.price
          }
        },
        bubbles: true,
        composed: true
      })
    );
  }

  handleImgError(event) {
    event.target.src = "https://via.placeholder.com/300x200?text=Nexus+Product";
  }
}
