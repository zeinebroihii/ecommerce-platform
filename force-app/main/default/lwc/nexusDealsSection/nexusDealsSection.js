import { LightningElement, wire } from "lwc";
import getProductsWithStock from "@salesforce/apex/ProductController.getProductsWithStock";

const DEALS_LIMIT = 4;
const FALLBACK_IMAGE = "https://picsum.photos/seed/nexus-deal/800/800";

export default class NexusDealsSection extends LightningElement {
  @wire(getProductsWithStock, { searchTerm: "", category: "" })
  wiredProducts;

  get isLoading() {
    return !this.wiredProducts.data && !this.wiredProducts.error;
  }

  get hasError() {
    return !!this.wiredProducts.error;
  }

  get deals() {
    if (!this.wiredProducts.data) return [];

    return this.wiredProducts.data.slice(0, DEALS_LIMIT).map((p) => {
      // ── Features ─────────────────────────────────────────────────────
      // Populated from Specs__c JSON today.
      // Future: replace with DealFeatures__c (Text/LongText on Product2)
      let features = [];
      try {
        const specs = JSON.parse(p.specs || "[]");
        features = specs.slice(0, 3).map((s) => s.key || String(s));
      } catch {
        /* specs not valid JSON — leave empty */
      }

      // ── Discount ──────────────────────────────────────────────────────
      // Future: map from DiscountPercent__c (Number field on Product2)
      const discount = p.discountPercent || 0;

      // ── Badge ─────────────────────────────────────────────────────────
      // Future: map from Badge__c (Text field on Product2, e.g. "Flash Sale")
      const badge = p.badge || (p.isNew ? "New" : p.family || "");

      const originalPrice = p.unitPrice || 0;
      const salePrice =
        discount > 0
          ? Math.round(originalPrice * (1 - discount / 100))
          : originalPrice;
      const saving = originalPrice - salePrice;

      return {
        id: p.productId,
        name: p.name,
        description: p.description || "",
        family: p.family || "",
        brand: p.brand || "", // Future: shown in card footer
        productCode: p.productCode || "", // Future: shown as SKU
        rating: p.rating || 0, // Future: star display
        reviews: p.reviews || 0, // Future: review count
        isOutOfStock: p.isOutOfStock,
        imageUrl: p.imageUrl || FALLBACK_IMAGE,
        discount,
        hasDiscount: discount > 0,
        badge,
        hasBadge: !!badge,
        features,
        hasFeatures: features.length > 0,
        originalPriceFormatted: originalPrice.toLocaleString("fr-FR"),
        salePriceFormatted: salePrice.toLocaleString("fr-FR"),
        savingFormatted: saving.toLocaleString("fr-FR")
      };
    });
  }

  get isEmpty() {
    return !this.isLoading && !this.hasError && this.deals.length === 0;
  }

  handleAddToCart(event) {
    event.stopPropagation();
    const id = event.currentTarget.dataset.id;
    const raw = (this.wiredProducts.data || []).find((p) => p.productId === id);
    if (raw) {
      this.dispatchEvent(
        new CustomEvent("addtocart", {
          bubbles: true,
          composed: true,
          detail: { product: raw }
        })
      );
    }
  }

  handleViewDetails(event) {
    event.stopPropagation();
    const id = event.currentTarget.dataset.id;
    const raw = (this.wiredProducts.data || []).find((p) => p.productId === id);
    if (raw) {
      this.dispatchEvent(
        new CustomEvent("viewdetails", {
          bubbles: true,
          composed: true,
          detail: { product: raw }
        })
      );
    }
  }
}
