import { LightningElement, api, wire, track } from "lwc";
import Id from "@salesforce/user/Id";
import getProductsWithStock from "@salesforce/apex/ProductController.getProductsWithStock";

const FALLBACK_IMAGE = "https://picsum.photos/seed/nexus-product/800/800";

const MAIN_CATEGORIES = [
  "Computing",
  "Connectivity",
  "Sensors & Monitoring",
  "Sustainability",
  "Storage",
  "Networking"
];

const PREMIUM_TECH_LIMIT = 8;

/** Map a raw ProductWrapper (Apex) to the shape expected by the page / detail view */
function normalize(p) {
  let features = [];
  try {
    const specs = JSON.parse(p.specs || "[]");
    features = specs.slice(0, 3).map((s) => s.key || String(s));
  } catch {
    /* non-JSON specs — leave empty */
  }

  return {
    id: p.productId,
    name: p.name,
    productCode: p.productCode || "",
    description: p.description || "",
    family: p.family || "",
    price: p.unitPrice || 0,
    rating: p.rating || 0,
    image: p.imageUrl || FALLBACK_IMAGE,
    features,
    isNew: p.isNew,
    isOutOfStock: p.isOutOfStock,
    colors: [] // Future: populate from Colors__c relationship on Product2
  };
}

export default class NexusLoginView extends LightningElement {
  @api pageWidth = "100%";
  @api pageMaxWidth = "100%";
  @api pagePadding = "0";

  @track selectedFamily = "All";
  @track selectedProduct = null;
  @track quoteProduct = null;
  @track favoritedIds = [];
  @track authOpen = false;
  @track authMode = "login";

  @wire(getProductsWithStock, { searchTerm: "", category: "" })
  wiredProducts;

  // ── Auto-redirect authenticated users to the portal ──────────────────────
  connectedCallback() {
    if (Id) {
      window.location.replace("/ss/s/customportal");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "setpwd") {
      this.authMode = "change-password";
      this.authOpen = true;
    }
    this._openAuthHandler = (e) => {
      this.authMode = (e.detail && e.detail.mode) || "login";
      this.authOpen = true;
    };
    document.addEventListener("nexusopenauth", this._openAuthHandler);
  }

  disconnectedCallback() {
    document.removeEventListener("nexusopenauth", this._openAuthHandler);
  }

  get pageStyle() {
    return `width:${this.pageWidth};max-width:${this.pageMaxWidth};padding:${this.pagePadding};margin:0 auto;box-sizing:border-box;`;
  }

  get _products() {
    return (this.wiredProducts.data || []).map(normalize);
  }

  get isLoadingProducts() {
    return !this.wiredProducts.data && !this.wiredProducts.error;
  }

  get familyFilters() {
    return ["All", ...MAIN_CATEGORIES].map((f) => ({
      family: f,
      label: f,
      cls:
        f === this.selectedFamily
          ? "nlv-family-pill nlv-family-pill--active"
          : "nlv-family-pill"
    }));
  }

  get filteredProducts() {
    const list =
      this.selectedFamily === "All"
        ? this._products
        : this._products.filter((p) => p.family === this.selectedFamily);
    return list.slice(0, PREMIUM_TECH_LIMIT).map((p) => {
      const isFav = this.favoritedIds.includes(p.id);
      return {
        ...p,
        priceFormatted: `${(p.price || 0).toLocaleString("fr-FR")} €`,
        favCls: isFav
          ? "nlv-pcard2-heart nlv-pcard2-heart--active"
          : "nlv-pcard2-heart",
        favFill: isFav ? "currentColor" : "none"
      };
    });
  }

  get hasProducts() {
    return this.filteredProducts.length > 0;
  }

  get isQuoteFormOpen() {
    return !!this.quoteProduct;
  }

  get favoritedProducts() {
    return this._products.filter((p) => this.favoritedIds.includes(p.id));
  }

  get allProducts() {
    return this._products;
  }

  /* ── Hero scroll ── */
  handleScrollProducts() {
    const el = this.template.querySelector('[id="products-section"]');
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  /* ── Filters ── */
  handleFamilyFilter(event) {
    this.selectedFamily = event.currentTarget.dataset.family;
  }

  /* ── Card interactions ── */
  handleProductClick(event) {
    event.stopPropagation();
    const id = event.currentTarget.dataset.id;
    this.selectedProduct = this._products.find((p) => p.id === id) || null;
  }

  handleToggleFavorite(event) {
    event.stopPropagation();
    this._toggleFav(event.currentTarget.dataset.id);
  }

  handleAddToCart(event) {
    event.stopPropagation();
    this.authMode = "signup-select";
    this.authOpen = true;
  }

  handleQuoteRequest() {
    this.selectedProduct = null;
    this.authMode = "signup-select";
    this.authOpen = true;
  }

  /* ── Modal ── */
  handleModalClose() {
    this.selectedProduct = null;
  }

  handleDetailViewProduct(event) {
    const product = event.detail && event.detail.product;
    if (product) this.selectedProduct = product;
  }

  handleDetailRequireAuth(event) {
    this.selectedProduct = null;
    this.authMode = (event.detail && event.detail.mode) || "signup-select";
    this.authOpen = true;
  }

  handleDetailQuoteRequest() {
    this.selectedProduct = null;
    this.authMode = "signup-select";
    this.authOpen = true;
  }

  handleModalAddToCart() {
    this.selectedProduct = null;
    this.authMode = "signup-select";
    this.authOpen = true;
  }

  handleModalToggleFavorite(event) {
    const product = event.detail && event.detail.product;
    if (product) this._toggleFav(product.id);
  }

  /* ── Deals section ── */
  handleDealsAddToCart() {
    this.authMode = "signup-select";
    this.authOpen = true;
  }

  handleDealsViewDetails(event) {
    const raw = event.detail && event.detail.product;
    if (!raw) return;
    // Normalize the ProductWrapper shape to match what nexusProductDetailView expects
    this.selectedProduct = normalize(raw);
  }

  /* ── Quote form ── */
  handleQuoteFormClose() {
    this.quoteProduct = null;
  }

  /* ── Auth ── */
  handleB2BLogin() {
    this.authMode = "login";
    this.authOpen = true;
  }
  handleB2BRegister() {
    this.authMode = "signup-b2b";
    this.authOpen = true;
  }
  handleB2CLogin() {
    this.authMode = "login";
    this.authOpen = true;
  }
  handleB2CRegister() {
    this.authMode = "signup-b2c";
    this.authOpen = true;
  }
  handleAuthClose() {
    this.authOpen = false;
  }

  /* ── Helpers ── */
  _toggleFav(id) {
    if (this.favoritedIds.includes(id)) {
      this.favoritedIds = this.favoritedIds.filter((f) => f !== id);
    } else {
      this.favoritedIds = [...this.favoritedIds, id];
    }
    if (this.selectedProduct && this.selectedProduct.id === id) {
      this.selectedProduct = { ...this.selectedProduct };
    }
  }
}
