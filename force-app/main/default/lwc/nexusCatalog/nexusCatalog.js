import { LightningElement, wire, track } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import userId from "@salesforce/user/Id";
import EMAIL_FIELD from "@salesforce/schema/User.Email";
import getProductsWithStock from "@salesforce/apex/ProductController.getProductsWithStock";
import requestNotification from "@salesforce/apex/StockNotificationController.requestNotification";

const CATEGORIES = [
  {
    id: "computing",
    name: "Computing",
    iconName: "utility:desktop_and_phone",
    subcategories: [
      { id: "workstations", name: "Workstations" },
      { id: "edge-nodes", name: "Edge Nodes" },
      { id: "quantum", name: "Quantum Computing" }
    ]
  },
  {
    id: "connectivity",
    name: "Connectivity",
    iconName: "utility:connected_apps",
    subcategories: [
      { id: "hubs", name: "Hubs & Gateways" },
      { id: "bridges", name: "Bridges" },
      { id: "wireless", name: "Wireless Modules" }
    ]
  },
  {
    id: "sensors",
    name: "Sensors & Monitoring",
    iconName: "utility:preview",
    subcategories: [
      { id: "environmental", name: "Environmental" },
      { id: "visual", name: "Visual Monitoring" },
      { id: "neural", name: "Neural Sensors" }
    ]
  },
  {
    id: "sustainability",
    name: "Sustainability",
    iconName: "utility:world",
    subcategories: [
      { id: "energy", name: "Energy Monitoring" },
      { id: "carbon", name: "Carbon Tracking" }
    ]
  }
];

// Maps Product2.Family to sidebar category id
const FAMILY_TO_CAT = {
  Computing: "computing",
  Graphics: "computing",
  Storage: "computing",
  "Power Protection": "computing",
  Connectivity: "connectivity",
  Networking: "connectivity",
  "Sensors & Monitoring": "sensors",
  Sustainability: "sustainability"
};

// Normalize any French/English/mixed status from Salesforce to English canonical
function normalizeStatus(raw) {
  const s = (raw || "").toLowerCase();
  if (
    s.includes("épuisé") ||
    s.includes("epuisé") ||
    s.includes("out of stock")
  )
    return "Out of Stock";
  if (s.includes("arrivage") || s.includes("arriving")) return "Arriving Soon";
  if (s.includes("commande") || s.includes("on order")) return "On Order (48h)";
  if (s.includes("stock") || s.includes("en stock") || s.includes("in stock"))
    return "In Stock";
  return raw || "In Stock";
}

function stockBadge(p) {
  const qty = p.stockLevel || 0;
  const status = p.status; // already normalized to English

  if (status === "Arriving Soon") {
    return {
      stockBadgeLabel: "Arriving Soon",
      stockBadgeCls: "nc2-stock-badge nc2-stock-arriving",
      showStockBadge: true,
      isOutOfStock: false
    };
  }
  if (status === "Out of Stock" || qty === 0) {
    return {
      stockBadgeLabel: "Out of Stock",
      stockBadgeCls: "nc2-stock-badge nc2-stock-out",
      showStockBadge: true,
      isOutOfStock: true
    };
  }
  if (status === "On Order (48h)") {
    return {
      stockBadgeLabel: "On Order (48h)",
      stockBadgeCls: "nc2-stock-badge nc2-stock-arriving",
      showStockBadge: true,
      isOutOfStock: false
    };
  }
  if (qty <= 3) {
    return {
      stockBadgeLabel: "Last " + qty + " left",
      stockBadgeCls: "nc2-stock-badge nc2-stock-last",
      showStockBadge: true,
      isOutOfStock: false
    };
  }
  if (qty <= 10) {
    return {
      stockBadgeLabel: "Low Stock",
      stockBadgeCls: "nc2-stock-badge nc2-stock-low",
      showStockBadge: true,
      isOutOfStock: false
    };
  }
  return {
    stockBadgeLabel: "In Stock",
    stockBadgeCls: "nc2-stock-badge nc2-stock-in",
    showStockBadge: false,
    isOutOfStock: false
  };
}

function apexToProduct(p) {
  let features = [];
  try {
    const specs = p.specs ? JSON.parse(p.specs) : [];
    features = specs.map((s) => s.key + (s.value ? ": " + s.value : ""));
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    /* ignore */
  }

  return {
    id: p.productId,
    name: p.name || "",
    productCode: p.productCode || "",
    family: p.family || "",
    category: FAMILY_TO_CAT[p.family] || (p.family || "").toLowerCase(),
    subcategory: p.subcategory || "",
    brand: p.brand || "",
    price: p.unitPrice || 0,
    rating: p.rating || 0,
    reviews: p.reviews || 0,
    image: p.imageUrl || "",
    description: p.description || "",
    features,
    isNew: p.isNew || false,
    isActive: !p.isOutOfStock,
    stockLevel: p.quantityAvailable || 0,
    status: normalizeStatus(
      p.availabilityStatus || (p.isOutOfStock ? "Out of Stock" : "In Stock")
    ),
    specs: p.specs || ""
  };
}

const ALL_STATUSES = [
  "In Stock",
  "Arriving Soon",
  "Out of Stock",
  "On Order (48h)"
];
const BROWSE_KEY = "nexus_browse_history";
const BROWSE_MAX = 20; // max entries kept

function loadBrowseHistory() {
  try {
    return JSON.parse(sessionStorage.getItem(BROWSE_KEY) || "[]");
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    return [];
  }
}

function saveBrowseEvent(product) {
  const history = loadBrowseHistory();
  // avoid duplicate consecutive views of the same product
  const filtered = history.filter((h) => h.productId !== product.id);
  filtered.unshift({
    productId: product.id,
    name: product.name,
    family: product.family,
    subcategory: product.subcategory,
    brand: product.brand,
    price: product.price,
    viewedAt: Date.now()
  });
  sessionStorage.setItem(
    BROWSE_KEY,
    JSON.stringify(filtered.slice(0, BROWSE_MAX))
  );
}

export default class NexusCatalog extends LightningElement {
  @track _products = [];
  @track selectedCategory = null;
  @track selectedSubcategory = null;
  @track expandedCategories = [];
  @track searchQuery = "";
  @track viewMode = "grid";
  @track priceMax = 200000;
  @track sortBy = "rating";
  @track statusFilter = [];
  @track brandFilter = [];
  @track favoritedIds = [];
  @track detailProduct = null;
  @track showToast = false;
  @track _activeComboSlotId = null;
  @track _notifyProductId = null;
  @track _notifyEmail = "";
  @track _notifySubmitting = false;
  @track _notifyDoneIds = [];
  @track _notifyFlashId = null;
  @track _activeComboSlotCat = null;
  @track sidebarCollapsed = false;
  _toastTimer;
  _onComboSlotActive;

  @wire(getRecord, { recordId: userId, fields: [EMAIL_FIELD] })
  _userRecord;

  get _userEmail() {
    return getFieldValue(this._userRecord.data, EMAIL_FIELD) || "";
  }

  @wire(getProductsWithStock, { searchTerm: "", category: "" })
  wiredProducts({ data, error }) {
    if (data) {
      this._products = data.map(apexToProduct);
    } else if (error) {
      console.error(
        "[NexusCatalog] getProductsWithStock error:",
        JSON.stringify(error)
      );
    }
  }

  // ── Combo builder integration ────────────────────────────────────────────

  connectedCallback() {
    // eslint-disable-next-line @lwc/lwc/no-document-query
    if (!document.getElementById("nexus-poppins")) {
      const link = document.createElement("link");
      link.id = "nexus-poppins";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600;1,700&display=swap";
      document.head.appendChild(link);
    }
    this._onComboSlotActive = (e) => {
      const { slotId, category, catMap } = e.detail || {};
      this._activeComboSlotId = slotId || null;
      this._activeComboSlotCat = category || null;
      // Auto-filter catalog by slot category mapping
      if (slotId && catMap) {
        this.selectedCategory = catMap.cat || null;
        this.selectedSubcategory = catMap.sub || null;
        if (catMap.cat && !this.expandedCategories.includes(catMap.cat)) {
          this.expandedCategories = [...this.expandedCategories, catMap.cat];
        }
      } else if (!slotId) {
        // Slot deactivated — clear combo filters
        this.selectedCategory = null;
        this.selectedSubcategory = null;
      }
    };
    document.addEventListener(
      "nexuscombobuilderslotactive",
      this._onComboSlotActive
    );
  }

  disconnectedCallback() {
    document.removeEventListener(
      "nexuscombobuilderslotactive",
      this._onComboSlotActive
    );
  }

  get hasActiveComboSlot() {
    return !!this._activeComboSlotId;
  }

  handleRevealComboBuilder() {
    document.dispatchEvent(new CustomEvent("nexuscomboreveal"));
  }

  handleAddToCombo(event) {
    event.stopPropagation();
    const id = event.currentTarget.dataset.id;
    const product = this._products.find((p) => p.id === id);
    if (product && this._activeComboSlotId) {
      document.dispatchEvent(
        new CustomEvent("nexuscomboaddproduct", {
          detail: {
            slotId: this._activeComboSlotId,
            product: {
              id: product.id,
              name: product.name,
              image: product.image,
              price: product.price,
              category: this._activeComboSlotCat || product.category
            }
          }
        })
      );
    }
  }

  // ── Sidebar: categories ──────────────────────────────────────────────────

  get categoriesEnriched() {
    return CATEGORIES.map((cat) => ({
      ...cat,
      isExpanded: this.expandedCategories.includes(cat.id),
      isSelected: this.selectedCategory === cat.id,
      btnClass:
        this.selectedCategory === cat.id
          ? "nc2-cat-btn nc2-cat-btn--active"
          : "nc2-cat-btn",
      iconWrapClass:
        this.selectedCategory === cat.id
          ? "nc2-cat-icon nc2-cat-icon--active"
          : "nc2-cat-icon",
      subcategories: cat.subcategories.map((sub) => ({
        ...sub,
        isSelected: this.selectedSubcategory === sub.id,
        btnClass:
          this.selectedSubcategory === sub.id
            ? "nc2-sub-btn nc2-sub-btn--active"
            : "nc2-sub-btn",
        dotClass:
          this.selectedSubcategory === sub.id
            ? "nc2-sub-dot nc2-sub-dot--active"
            : "nc2-sub-dot"
      }))
    }));
  }

  get allBtnClass() {
    return !this.selectedCategory
      ? "nc2-cat-btn nc2-cat-btn--active"
      : "nc2-cat-btn";
  }

  // ── Sidebar: availability filter ────────────────────────────────────────

  get availabilityItems() {
    return ALL_STATUSES.map((status) => ({
      status,
      isChecked: this.statusFilter.includes(status),
      count: this._products.filter((p) => p.status === status).length,
      checkClass: this.statusFilter.includes(status)
        ? "nc2-check nc2-check--active"
        : "nc2-check",
      labelClass: this.statusFilter.includes(status)
        ? "nc2-filter-label-text nc2-filter-label-text--active"
        : "nc2-filter-label-text"
    }));
  }

  get hasStatusFilters() {
    return this.statusFilter.length > 0;
  }

  // ── Sidebar: brand filter ────────────────────────────────────────────────

  get brandItems() {
    const brands = [
      ...new Set(this._products.map((p) => p.brand).filter(Boolean))
    ];
    return brands.map((brand) => ({
      brand,
      isChecked: this.brandFilter.includes(brand),
      count: this._products.filter((p) => p.brand === brand).length,
      checkClass: this.brandFilter.includes(brand)
        ? "nc2-check nc2-check--active"
        : "nc2-check",
      labelClass: this.brandFilter.includes(brand)
        ? "nc2-filter-label-text nc2-filter-label-text--active"
        : "nc2-filter-label-text"
    }));
  }

  get hasBrandFilters() {
    return this.brandFilter.length > 0;
  }

  // ── Main panel: derived ──────────────────────────────────────────────────

  get filteredProducts() {
    const q = this.searchQuery.toLowerCase();
    return this._products
      .filter((p) => {
        if (this.selectedCategory && p.category !== this.selectedCategory)
          return false;
        if (
          this.selectedSubcategory &&
          p.subcategory !== this.selectedSubcategory
        )
          return false;
        if (
          q &&
          !p.name.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q) &&
          !p.productCode.toLowerCase().includes(q)
        )
          return false;
        if (p.price > this.priceMax) return false;
        if (
          this.statusFilter.length > 0 &&
          !this.statusFilter.includes(p.status)
        )
          return false;
        if (this.brandFilter.length > 0 && !this.brandFilter.includes(p.brand))
          return false;
        return true;
      })
      .sort((a, b) => {
        if (this.sortBy === "price-asc") return a.price - b.price;
        if (this.sortBy === "price-desc") return b.price - a.price;
        return (b.rating || 0) - (a.rating || 0);
      })
      .map((p, idx) => {
        const isFav = this.favoritedIds.includes(p.id);
        return {
          ...p,
          indexNum: idx + 1,
          priceFormatted: "$" + p.price.toLocaleString(),
          isFav,
          favBtnClass: isFav
            ? "nc2-card-fav nc2-card-fav--active"
            : "nc2-card-fav",
          cardClass: "nc2-product-card",
          ...stockBadge(p),
          addBtnCls: stockBadge(p).isOutOfStock
            ? "nc2-card-add nc2-card-add--oos"
            : "nc2-card-add",
          showNotifyForm: this._notifyProductId === p.id,
          notifyDone: this._notifyDoneIds.includes(p.id),
          notifyFlash: this._notifyFlashId === p.id,
          stars: [1, 2, 3, 4, 5].map((n) => ({
            n,
            cls:
              n <= Math.floor(p.rating || 0)
                ? "nc2-star nc2-star--filled"
                : "nc2-star"
          }))
        };
      });
  }

  get hasProducts() {
    return this.filteredProducts.length > 0;
  }
  get filteredCount() {
    return this.filteredProducts.length;
  }
  get isGridMode() {
    return this.viewMode === "grid";
  }
  get gridClass() {
    return this.viewMode === "grid"
      ? "nc2-grid nc2-grid--grid"
      : "nc2-grid nc2-grid--list";
  }
  get gridBtnClass() {
    return this.viewMode === "grid"
      ? "nc2-view-btn nc2-view-btn--active"
      : "nc2-view-btn";
  }
  get listBtnClass() {
    return this.viewMode === "list"
      ? "nc2-view-btn nc2-view-btn--active"
      : "nc2-view-btn";
  }

  // ── Sidebar collapse ─────────────────────────────────────────────────────

  get layoutClass() {
    return this.sidebarCollapsed ? "nc2-layout nc2-layout--full" : "nc2-layout";
  }
  get sidebarClass() {
    return this.sidebarCollapsed
      ? "nc2-sidebar nc2-sidebar--hidden"
      : "nc2-sidebar";
  }

  get notifySubmitLabel() {
    return this._notifySubmitting ? "Sending…" : "Confirm";
  }

  handleToggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  handleBack() {
    this.dispatchEvent(
      new CustomEvent("catalogback", { bubbles: true, composed: true })
    );
  }

  // ── Notify Me ────────────────────────────────────────────────────────────

  handleNotifyOpen(event) {
    event.stopPropagation();
    this._notifyProductId = event.currentTarget.dataset.id;
    this._notifyEmail = this._userEmail;
  }

  handleNotifyCancel(event) {
    event.stopPropagation();
    this._notifyProductId = null;
  }

  handleNotifyPanelClick(event) {
    event.stopPropagation();
  }

  handleNotifyEmailChange(event) {
    this._notifyEmail = event.target.value;
  }

  handleNotifySubmit(event) {
    event.stopPropagation();
    const productId = this._notifyProductId;
    const product = this._products.find((p) => p.id === productId);
    const productName = product ? product.name : "";
    const email = this._notifyEmail.trim();
    if (!email || !email.includes("@")) return;

    // Close instantly — optimistic
    this._notifyProductId = null;
    this._notifyDoneIds = [...this._notifyDoneIds, productId];
    this._notifyFlashId = productId;
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      this._notifyFlashId = null;
    }, 2000);

    // Fire & forget — send email + create Task in background
    requestNotification({ productId, productName, customerEmail: email }).catch(
      () => {}
    );
  }

  // ── Active filter pills ──────────────────────────────────────────────────

  get hasActiveFilters() {
    return !!(
      this.selectedCategory ||
      this.selectedSubcategory ||
      this.searchQuery ||
      this.statusFilter.length ||
      this.brandFilter.length ||
      this.priceMax < 200000
    );
  }

  get activeFilterPills() {
    const pills = [];
    if (this.selectedCategory) {
      const cat = CATEGORIES.find((c) => c.id === this.selectedCategory);
      pills.push({
        id: "cat",
        label: cat ? cat.name : this.selectedCategory,
        filterType: "category",
        value: this.selectedCategory
      });
    }
    if (this.selectedSubcategory) {
      const cat = CATEGORIES.find((c) => c.id === this.selectedCategory);
      const sub =
        cat && cat.subcategories.find((s) => s.id === this.selectedSubcategory);
      pills.push({
        id: "sub",
        label: sub ? sub.name : this.selectedSubcategory,
        filterType: "subcategory",
        value: this.selectedSubcategory
      });
    }
    if (this.searchQuery) {
      pills.push({
        id: "search",
        label: "Search: " + this.searchQuery,
        filterType: "search",
        value: ""
      });
    }
    this.statusFilter.forEach((s) =>
      pills.push({
        id: "status-" + s,
        label: s,
        filterType: "status",
        value: s
      })
    );
    this.brandFilter.forEach((b) =>
      pills.push({ id: "brand-" + b, label: b, filterType: "brand", value: b })
    );
    return pills;
  }

  // ── Breadcrumb ───────────────────────────────────────────────────────────

  get breadcrumbCategory() {
    if (!this.selectedCategory) return null;
    return CATEGORIES.find((c) => c.id === this.selectedCategory) || null;
  }

  get breadcrumbSubcategory() {
    if (!this.selectedSubcategory || !this.breadcrumbCategory) return null;
    return (
      this.breadcrumbCategory.subcategories.find(
        (s) => s.id === this.selectedSubcategory
      ) || null
    );
  }

  get showBreadcrumbCategory() {
    return !!this.selectedCategory;
  }
  get showBreadcrumbSubcategory() {
    return !!this.selectedSubcategory;
  }
  get breadcrumbAllClass() {
    return this.selectedCategory
      ? "nc2-bc-item"
      : "nc2-bc-item nc2-bc-item--active";
  }

  get isDetailViewOpen() {
    return !!this.detailProduct;
  }
  get allProductsList() {
    return this._products;
  }

  // ── Handlers: sidebar ────────────────────────────────────────────────────

  handleSelectAll() {
    this.selectedCategory = null;
    this.selectedSubcategory = null;
  }

  handleToggleCategory(event) {
    const id = event.currentTarget.dataset.id;
    this.selectedCategory = id;
    this.selectedSubcategory = null;
    this.expandedCategories = this.expandedCategories.includes(id)
      ? this.expandedCategories.filter((c) => c !== id)
      : [...this.expandedCategories, id];
  }

  handleSelectSubcategory(event) {
    this.selectedCategory = event.currentTarget.dataset.category;
    this.selectedSubcategory = event.currentTarget.dataset.sub;
  }

  handleToggleStatus(event) {
    const s = event.currentTarget.dataset.status;
    this.statusFilter = this.statusFilter.includes(s)
      ? this.statusFilter.filter((x) => x !== s)
      : [...this.statusFilter, s];
  }

  handleClearStatus() {
    this.statusFilter = [];
  }

  handleToggleBrand(event) {
    const b = event.currentTarget.dataset.brand;
    this.brandFilter = this.brandFilter.includes(b)
      ? this.brandFilter.filter((x) => x !== b)
      : [...this.brandFilter, b];
  }

  handleClearBrand() {
    this.brandFilter = [];
  }

  handlePriceChange(event) {
    this.priceMax = parseInt(event.target.value, 10);
  }

  handleResetFilters() {
    this.selectedCategory = null;
    this.selectedSubcategory = null;
    this.searchQuery = "";
    this.priceMax = 200000;
    this.statusFilter = [];
    this.brandFilter = [];
  }

  // ── Handlers: toolbar ────────────────────────────────────────────────────

  handleSearch(event) {
    this.searchQuery = event.target.value;
  }
  handleSortChange(event) {
    this.sortBy = event.target.value;
  }
  handleViewGrid() {
    this.viewMode = "grid";
  }
  handleViewList() {
    this.viewMode = "list";
  }

  // ── Handlers: filter pills ───────────────────────────────────────────────

  handleRemoveFilter(event) {
    const type = event.currentTarget.dataset.type;
    const value = event.currentTarget.dataset.value;
    if (type === "category") {
      this.selectedCategory = null;
      this.selectedSubcategory = null;
    }
    if (type === "subcategory") {
      this.selectedSubcategory = null;
    }
    if (type === "search") {
      this.searchQuery = "";
    }
    if (type === "status") {
      this.statusFilter = this.statusFilter.filter((s) => s !== value);
    }
    if (type === "brand") {
      this.brandFilter = this.brandFilter.filter((b) => b !== value);
    }
  }

  handleClearAllFilters() {
    this.handleResetFilters();
  }

  // ── Handlers: product cards ──────────────────────────────────────────────

  handleViewProduct(event) {
    const id = event.currentTarget.dataset.id;
    this.detailProduct = this._products.find((p) => p.id === id) || null;
    if (this.detailProduct) {
      saveBrowseEvent(this.detailProduct);
      document.dispatchEvent(
        new CustomEvent("nexusproductdetailopen", {
          detail: {
            productId: this.detailProduct.id,
            productName: this.detailProduct.name,
            productFamily: this.detailProduct.family
          }
        })
      );
    }
  }

  handleToggleFavorite(event) {
    const id = event.currentTarget.dataset.id;
    event.stopPropagation();
    this.favoritedIds = this.favoritedIds.includes(id)
      ? this.favoritedIds.filter((fid) => fid !== id)
      : [...this.favoritedIds, id];
    const product = this._products.find((p) => p.id === id);
    if (product) {
      this.dispatchEvent(
        new CustomEvent("togglefavorite", {
          detail: { product },
          bubbles: true,
          composed: true
        })
      );
    }
  }

  handleAddToCart(event) {
    event.stopPropagation();
    const id = event.currentTarget.dataset.id;
    const product = this._products.find((p) => p.id === id);
    if (product) {
      this.dispatchEvent(
        new CustomEvent("addtocart", {
          detail: { product },
          bubbles: true,
          composed: true
        })
      );
      this._showToast();
    }
  }

  handleDetailClose() {
    this.detailProduct = null;
    document.dispatchEvent(new CustomEvent("nexusproductdetailclose"));
  }

  handleSimilarProductView(event) {
    const product = event.detail && event.detail.product;
    if (product) {
      this.detailProduct = null;
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      setTimeout(() => {
        this.detailProduct = product;
        document.dispatchEvent(
          new CustomEvent("nexusproductdetailopen", {
            detail: {
              productId: product.id,
              productName: product.name,
              productFamily: product.family
            }
          })
        );
      }, 0);
    }
  }
  handleDetailAddToCart(event) {
    if (event.detail && event.detail.product) this._showToast();
  }
  handleDetailToggleFavorite(event) {
    if (event.detail && event.detail.product) {
      const id = event.detail.product.id;
      this.favoritedIds = this.favoritedIds.includes(id)
        ? this.favoritedIds.filter((fid) => fid !== id)
        : [...this.favoritedIds, id];
      this.dispatchEvent(
        new CustomEvent("togglefavorite", {
          detail: { product: event.detail.product },
          bubbles: true,
          composed: true
        })
      );
    }
  }

  _showToast() {
    this.showToast = true;
    clearTimeout(this._toastTimer);
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._toastTimer = setTimeout(() => {
      this.showToast = false;
    }, 2500);
  }
}
