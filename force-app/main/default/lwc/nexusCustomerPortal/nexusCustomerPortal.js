import { LightningElement, wire, track } from "lwc";
import getProductsWithStock from "@salesforce/apex/ProductController.getProductsWithStock";
import getCurrentUserProfile from "@salesforce/apex/AuthController.getCurrentUserProfile";
import changeUserPassword from "@salesforce/apex/AuthController.changeUserPassword";
import verifyAndActivateOrder from "@salesforce/apex/StripePaymentController.verifyAndActivateOrder";
import getRecommendations from "@salesforce/apex/RecommendationController.getRecommendations";
import getRecentActivity from "@salesforce/apex/OrderManagementController.getRecentActivity";
import getMyOrders from "@salesforce/apex/OrderManagementController.getMyOrders";
import getAccountQuotes from "@salesforce/apex/QuoteController.getAccountQuotes";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

const BROWSE_KEY = "nexus_browse_history";

const CART_KEY = "ecomm_cart";

// Sub-header items pushed to the navbar when portal is active
// First 7 are visible; rest overflow into MORE dropdown
const PORTAL_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "utility:home", scrollId: "" },
  {
    id: "catalog",
    label: "Catalog",
    icon: "utility:product_workspace",
    scrollId: ""
  },
  {
    id: "favorites",
    label: "Favorites",
    icon: "utility:favorite",
    scrollId: ""
  },
  { id: "orders", label: "Orders", icon: "utility:truck", scrollId: "" },
  { id: "quotations", label: "Quotes", icon: "utility:file", scrollId: "" },
  { id: "cart", label: "My Cart", icon: "utility:cart", scrollId: "" },
  { id: "profile", label: "Profile", icon: "utility:user", scrollId: "" },
  // MORE dropdown
  {
    id: "combo-deals",
    label: "Combo Deals",
    icon: "utility:package",
    scrollId: ""
  },
  { id: "swap", label: "Nexus Swap", icon: "utility:sync", scrollId: "" },
  {
    id: "passport",
    label: "Digital Passport",
    icon: "utility:identity",
    scrollId: ""
  },
  {
    id: "timeline",
    label: "Timeline 360°",
    icon: "utility:date_time",
    scrollId: ""
  },
  { id: "war-room", label: "War Room", icon: "utility:strategy", scrollId: "" },
  { id: "cases", label: "Support", icon: "utility:case", scrollId: "" },
  { id: "settings", label: "Settings", icon: "utility:settings", scrollId: "" }
];

function apexToPortalProduct(p) {
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
    price: p.unitPrice || 0,
    rating: p.rating || 0,
    reviews: p.reviews || 0,
    image: p.imageUrl || "",
    description: p.description || "",
    features,
    isNew: p.isNew || false,
    isPopular: false,
    colors: [],
    status: p.availabilityStatus || (p.isOutOfStock ? "Épuisé" : "En stock"),
    stockLevel: p.quantityAvailable || 0,
    visibilityScore: p.visibilityScore != null ? p.visibilityScore : null,
    stockStatus: p.stockStatus || null
  };
}

export default class NexusCustomerPortal extends LightningElement {
  @track _userProfile = {};
  @track _showPasswordForm = false;
  @track _oldPassword = "";
  @track _newPassword = "";
  @track _confirmPassword = "";
  @track _pwdError = "";
  @track _pwdSuccess = false;
  @track _showOldPwd = false;
  @track _showNewPwd = false;
  @track _showConfirmPwd = false;
  @track activeTab = "dashboard";
  @track _prevTab = "dashboard";
  @track catalogSearch = "";
  @track caseStep = 1;
  @track casePriority = "Medium";
  @track cart = [];
  @track sparksBalance = 1250;
  @track _sparksDiscount = 0; // $ value deducted by Sparks (e.g. 10.00)
  @track _quotationsRefreshKey = 0; // incremented to force nexusQuotationSystem cache bypass
  @track _sparksModalOpen = false;
  @track _kpiOrderCount = null;
  @track _kpiQuoteCount = null;
  @track _kpiTotalSpent = null;
  @track _products = [];

  // detail view state for product overlay
  @track detailProduct = null;

  get isDetailViewOpen() {
    return !!this.detailProduct;
  }

  // ── Catalog state ──────────────────────────────────────────────────────────
  @track selectedFamily = "All";
  @track selectedColor = "All";
  @track favorites = [];
  @track _selectedProductId = null;
  @track _modalActiveColor = null;
  @track _quoteProductId = null;
  @track _quoteStep = "form";
  @track _quoteCompany = "";
  @track _quoteEmail = "";
  @track _quoteQty = "10";
  @track _quoteIndustry = "Technology";
  @track _quoteMessage = "";

  // ── Custom cart toast ──────────────────────────────────────────────────────
  @track _cartToastVisible = false;
  @track _cartToastName = "";
  @track _cartToastPrice = "";
  _cartToastTimer = null;

  // ── Recent Activity ──────────────────────────────────────────────────────────
  @track _activityItems = [];
  @track _activityLoading = true;

  // ── Browse popup (shown when user opens a product detail in catalog) ────────
  @track _browsePopupVisible = false;
  @track _browsePopupProduct = null;
  @track _cartSliderOpen = false;
  _browsePopupTimer = null;
  _cachedRecs = []; // populated by nexusrecloaded event
  _pendingPopupProduct = null; // queued when recs not loaded yet

  @wire(getProductsWithStock, { searchTerm: "", category: "" })
  wiredProducts({ data, error }) {
    if (data) {
      this._products = data.map(apexToPortalProduct);
    } else if (error) {
      console.error(
        "[NexusPortal] getProductsWithStock error:",
        JSON.stringify(error)
      );
    }
  }

  // ── Current user profile getters ──────────────────────────────────────────
  get profileName() {
    return this._userProfile.name || "";
  }
  get profileFirstName() {
    return this._userProfile.firstName || "";
  }
  get profileEmail() {
    return this._userProfile.email || "";
  }
  get profilePhone() {
    return this._userProfile.phone || "";
  }
  get profileAccountName() {
    return this._userProfile.accountName || this._userProfile.name || "";
  }
  get profileStreet() {
    return this._userProfile.street || "";
  }
  get profileCity() {
    return this._userProfile.city || "";
  }
  get profilePostalCode() {
    return this._userProfile.postalCode || "";
  }
  get profileCountry() {
    return this._userProfile.country || "";
  }
  get profileAccountId() {
    return this._userProfile.accountId || "";
  }
  get profileRole() {
    return this._userProfile.profileName || "Customer";
  }
  get profileInitials() {
    const fn = this._userProfile.firstName || "";
    const ln = this._userProfile.lastName || "";
    return (fn.charAt(0) + ln.charAt(0)).toUpperCase() || "U";
  }
  get isB2C() {
    return this._userProfile.customerType === "B2C";
  }
  get isB2B() {
    return this._userProfile.customerType === "B2B";
  }
  get profileTier() {
    return this._userProfile.customerTier || null;
  }
  get hasTierBadge() {
    return !!this._userProfile.customerTier;
  }
  get tierBadgeClass() {
    const t = (this._userProfile.customerTier || "").toLowerCase();
    if (t === "platinum") return "ncp-tier-badge ncp-tier-platinum";
    if (t === "gold") return "ncp-tier-badge ncp-tier-gold";
    return "ncp-tier-badge ncp-tier-standard";
  }
  get tierBadgeIcon() {
    const t = (this._userProfile.customerTier || "").toLowerCase();
    if (t === "platinum") return "★ PLATINUM";
    if (t === "gold") return "★ GOLD";
    return "STANDARD";
  }

  // ── Stock Intelligence stats (computed from loaded products) ─────────────
  get stockBoostedCount() {
    return this._products.filter((p) => p.stockStatus === "Boosted").length;
  }
  get stockBuriedCount() {
    return this._products.filter((p) => p.stockStatus === "Buried").length;
  }
  get stockNormalCount() {
    return this._products.filter((p) => p.stockStatus === "Normal").length;
  }
  get stockVisibleCount() {
    return this.tierFilteredProducts.length;
  }

  // ── Tier-based catalog filter (Phase 2.3 — Boost & Bury override) ─────────
  // Platinum: all products visible (VIP bypass)
  // Gold:     show if VisibilityScore > 20 (or unscored)
  // Standard: show only VisibilityScore > 50 (or unscored)
  get tierFilteredProducts() {
    const tier = (this._userProfile.customerTier || "").toLowerCase();
    if (tier === "platinum") return this._products;
    return this._products.filter((p) => {
      const score = p.visibilityScore;
      if (score == null) return true; // unscored → always visible
      if (tier === "gold") return score > 20;
      return score > 50; // Standard (default)
    });
  }

  // ── Password change getters ────────────────────────────────────────────────
  get showPasswordForm() {
    return this._showPasswordForm;
  }
  get pwdToggleLabel() {
    return this._showPasswordForm ? "Cancel" : "Edit";
  }
  get pwdError() {
    return this._pwdError;
  }
  get pwdSuccess() {
    return this._pwdSuccess;
  }
  get showOldPwd() {
    return this._showOldPwd;
  }
  get showNewPwd() {
    return this._showNewPwd;
  }
  get showConfirmPwd() {
    return this._showConfirmPwd;
  }
  get oldPwdType() {
    return this._showOldPwd ? "text" : "password";
  }
  get newPwdType() {
    return this._showNewPwd ? "text" : "password";
  }
  get confirmPwdType() {
    return this._showConfirmPwd ? "text" : "password";
  }

  // ── Password change handlers ───────────────────────────────────────────────
  handleTogglePasswordForm() {
    this._showPasswordForm = !this._showPasswordForm;
    this._pwdError = "";
    this._pwdSuccess = false;
    this._oldPassword = this._newPassword = this._confirmPassword = "";
    this._showOldPwd = this._showNewPwd = this._showConfirmPwd = false;
  }
  handleOldPwd(e) {
    this._oldPassword = e.target.value;
  }
  handleNewPwd(e) {
    this._newPassword = e.target.value;
  }
  handleConfirmPwd(e) {
    this._confirmPassword = e.target.value;
  }
  handleToggleOldPwd() {
    this._showOldPwd = !this._showOldPwd;
  }
  handleToggleNewPwd() {
    this._showNewPwd = !this._showNewPwd;
  }
  handleToggleConfirmPwd() {
    this._showConfirmPwd = !this._showConfirmPwd;
  }

  handleChangePassword() {
    this._pwdError = "";
    this._pwdSuccess = false;
    if (!this._oldPassword || !this._newPassword || !this._confirmPassword) {
      this._pwdError = "Please fill in all fields.";
      return;
    }
    if (this._newPassword !== this._confirmPassword) {
      this._pwdError = "Passwords do not match.";
      return;
    }
    changeUserPassword({
      newPassword: this._newPassword,
      verifyPassword: this._confirmPassword,
      oldPassword: this._oldPassword
    })
      .then(() => {
        this._showPasswordForm = false;
        this._oldPassword = this._newPassword = this._confirmPassword = "";
        this._showOldPwd = this._showNewPwd = this._showConfirmPwd = false;
        this._pwdSuccess = true;
      })
      .catch((err) => {
        this._pwdError =
          (err && err.body && err.body.message) || "Error changing password.";
      });
  }

  connectedCallback() {
    // Load current user profile imperatively (not @wire) so it runs
    // in the real authenticated session context, not cached guest context
    getCurrentUserProfile()
      .then((data) => {
        if (data) {
          this._userProfile = data;
          this._pushNavUpdate();
          this._loadKpis(data.accountId);
        }
      })
      .catch((err) =>
        console.error(
          "[NexusPortal] getUserProfile error:",
          JSON.stringify(err)
        )
      );

    // ── Stripe payment return detection ───────────────────────────────────
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment_success") === "1") {
        const oid = params.get("oid");
        const sid = params.get("sid");
        if (oid && sid) {
          // Clean the URL immediately so a refresh doesn't re-trigger
          // eslint-disable-next-line no-restricted-globals
          history.replaceState({}, "", window.location.pathname);
          verifyAndActivateOrder({ sessionId: sid, orderId: oid })
            .then(() => {
              // Clear cart
              this.cart = [];
              this._saveCart();
              // Show success toast
              this.dispatchEvent(
                new ShowToastEvent({
                  title: "Paiement confirmé !",
                  message: "Votre commande a bien été enregistrée.",
                  variant: "success"
                })
              );
              // Navigate to orders
              this.activeTab = "orders";
              this._pushNavUpdate();
            })
            .catch((err) => {
              console.error(
                "[NexusPortal] Payment verification error:",
                JSON.stringify(err)
              );
              this.dispatchEvent(
                new ShowToastEvent({
                  title: "Erreur de paiement",
                  message:
                    (err && err.body && err.body.message) ||
                    "Impossible de vérifier le paiement.",
                  variant: "error"
                })
              );
            });
        }
      } else if (params.get("payment_cancelled") === "1") {
        // eslint-disable-next-line no-restricted-globals
        history.replaceState({}, "", window.location.pathname);
        this.activeTab = "cart";
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Paiement annulé",
            message: "Votre panier est toujours disponible.",
            variant: "warning"
          })
        );
      }
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      /* silent — URLSearchParams not always available */
    }

    // eslint-disable-next-line @lwc/lwc/no-document-query
    if (!document.querySelector("#nexus-gfonts")) {
      const link = document.createElement("link");
      link.id = "nexus-gfonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600;1,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
    try {
      const raw = sessionStorage.getItem(CART_KEY);
      if (raw) this.cart = JSON.parse(raw);
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      /* silent */
    }

    // ── Navbar sync ──────────────────────────────────────────────────────
    // Listen for navbar sub-tab clicks (nexusnavviewchange dispatched by nexusNavbar)
    this._onNavViewChange = (e) => {
      const { viewId } = e.detail || {};
      if (viewId) {
        this.activeTab = viewId;
        // No need to call _pushNavUpdate here; navbar already updated
        // its own highlight optimistically
      }
    };
    document.addEventListener("nexusnavviewchange", this._onNavViewChange);

    // Listen for combo builder "Add All to Cart"
    this._onComboAddAllCart = (e) => {
      const products = (e.detail && e.detail.products) || [];
      products.forEach((product) => {
        if (product)
          this._pushToCart({ ...product, price: product.price || 0 });
      });
      if (products.length) {
        this._showCartToast({
          name: `${products.length} product(s) added to cart`,
          price: null
        });
      }
    };
    document.addEventListener(
      "nexuscomboaddalltocart",
      this._onComboAddAllCart
    );

    // Navigate to catalog when a combo slot is being filled
    this._onComboNavToCatalog = () => {
      this._prevTab = this.activeTab;
      this.activeTab = "catalog";
      this._pushNavUpdate();
    };
    document.addEventListener(
      "nexuscombonavtocatalog",
      this._onComboNavToCatalog
    );

    // Track cart slider open/close to suppress browse popup
    this._onCartRevealPortal = () => {
      this._cartSliderOpen = true;
    };
    this._onCartClosePortal = () => {
      this._cartSliderOpen = false;
    };
    document.addEventListener("nexuscartreveal", this._onCartRevealPortal);
    document.addEventListener("nexuscartclose", this._onCartClosePortal);

    // Cache loaded recommendations for the browse popup
    this._onRecLoaded = (e) => {
      const detail = e.detail || {};
      this._cachedRecs = detail.recs || [];
      // If user already viewed a product before recs loaded, show popup now
      if (this._pendingPopupProduct && this._cachedRecs.length) {
        this._triggerBrowsePopup(this._pendingPopupProduct);
        this._pendingPopupProduct = null;
      }
    };
    document.addEventListener("nexusrecloaded", this._onRecLoaded);

    // Eagerly load recommendations so the popup + navbar badge work on any tab
    this._loadRecsEagerly();

    // Load real recent activity data
    this._loadRecentActivity();

    // Show browse popup when user opens a product detail in the catalog
    this._onProductDetailOpen = (e) => {
      const detail = (e && e.detail) || {};
      if (!this._cachedRecs.length) {
        // Recs not loaded yet — queue it, will fire when _onRecLoaded completes
        this._pendingPopupProduct = detail;
        return;
      }
      this._triggerBrowsePopup(detail);
    };
    document.addEventListener(
      "nexusproductdetailopen",
      this._onProductDetailOpen
    );

    // Open product detail overlay from navbar notification bell
    this._onOpenProductDetail = (e) => {
      const productId = e.detail && e.detail.productId;
      this._openProductDetailById(productId);
    };
    document.addEventListener(
      "nexusopenproductdetail",
      this._onOpenProductDetail
    );

    // Tell navbar: we are a portal, here are our tabs
    this._pushNavUpdate();
  }

  disconnectedCallback() {
    document.removeEventListener("nexusnavviewchange", this._onNavViewChange);
    document.removeEventListener(
      "nexuscomboaddalltocart",
      this._onComboAddAllCart
    );
    document.removeEventListener(
      "nexuscombonavtocatalog",
      this._onComboNavToCatalog
    );
    document.removeEventListener("nexuscartreveal", this._onCartRevealPortal);
    document.removeEventListener("nexuscartclose", this._onCartClosePortal);
    document.removeEventListener("nexusrecloaded", this._onRecLoaded);
    document.removeEventListener(
      "nexusproductdetailopen",
      this._onProductDetailOpen
    );
    document.removeEventListener(
      "nexusopenproductdetail",
      this._onOpenProductDetail
    );
    if (this._browsePopupTimer) clearTimeout(this._browsePopupTimer);
  }

  /** Fetch real recent activity (orders + quotes) from Apex */
  _loadRecentActivity() {
    this._activityLoading = true;
    getRecentActivity()
      .then((data) => {
        this._activityItems = (data || []).map((a, i) => ({
          ...a,
          key: (a.itemId || i) + String(i),
          pillClass: this._activityPillClass(a)
        }));
        this._activityLoading = false;
        document.dispatchEvent(
          new CustomEvent("nexusactivityloaded", {
            detail: { items: this._activityItems, isB2B: this.isB2B }
          })
        );
      })
      .catch(() => {
        this._activityLoading = false;
      });
  }

  _activityPillClass(a) {
    if (a.type === "Order") {
      const s = (a.status || "").toLowerCase();
      if (s === "livrée" || s === "delivered")
        return "ncp-status-pill ncp-pill-success";
      if (s === "annulée" || s === "cancelled")
        return "ncp-status-pill ncp-pill-danger";
      return "ncp-status-pill ncp-pill-primary";
    }
    // Quote
    const s = (a.status || "").toLowerCase();
    if (s === "accepted") return "ncp-status-pill ncp-pill-success";
    if (s === "rejected") return "ncp-status-pill ncp-pill-danger";
    if (s === "draft") return "ncp-status-pill ncp-pill-warning";
    return "ncp-status-pill ncp-pill-primary";
  }

  get recentActivityItems() {
    return this._activityItems;
  }
  get dashboardActivityItems() {
    return this._activityItems.slice(0, 3);
  }
  get hasActivityItems() {
    return this._activityItems.length > 0;
  }
  get isActivityLoading() {
    return this._activityLoading;
  }
  get isActivityEmpty() {
    return !this._activityLoading && this._activityItems.length === 0;
  }

  /** Load recommendations eagerly so popup + navbar badge work on any tab */
  _loadRecsEagerly() {
    const cartJson = sessionStorage.getItem(CART_KEY) || "[]";
    const browseJson = sessionStorage.getItem(BROWSE_KEY) || "[]";
    getRecommendations({ cartJson, browseJson })
      .then((data) => {
        if (!data || !data.length) return;
        this._cachedRecs = data.map((r) => ({
          productId: r.productId,
          productName: r.productName,
          imageUrl: r.imageUrl,
          priceFormatted:
            r.price != null
              ? new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0
                }).format(r.price)
              : "—",
          reason: r.reason,
          productFamily: r.productFamily,
          recType: r.recType
        }));
        document.dispatchEvent(
          new CustomEvent("nexusrecloaded", {
            detail: { count: this._cachedRecs.length, recs: this._cachedRecs }
          })
        );
        // Show proactive popup on any page after a short delay (once per 30 min)
        this._maybeShowProactivePopup();
      })
      .catch(() => {
        /* silent — badge stays 0 if recs fail */
      });
  }

  /**
   * Show the recommendation popup proactively — on any page, once per 30 min.
   * Picks the top rec and displays the floating card after 2 seconds.
   */
  _maybeShowProactivePopup() {
    if (!this._cachedRecs.length) return;
    const POPUP_KEY = "nexus_rec_popup_ts";
    const THIRTY_MIN = 30 * 60 * 1000;
    try {
      const last = parseInt(sessionStorage.getItem(POPUP_KEY) || "0", 10);
      if (Date.now() - last < THIRTY_MIN) return; // already shown recently
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      /* sessionStorage not available */
    }
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      if (!this._cachedRecs.length) return;
      const pick = this._cachedRecs[0];
      this._browsePopupProduct = pick;
      this._browsePopupVisible = true;
      if (this._browsePopupTimer) clearTimeout(this._browsePopupTimer);
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      this._browsePopupTimer = setTimeout(() => {
        this._browsePopupVisible = false;
      }, 7000);
      try {
        sessionStorage.setItem("nexus_rec_popup_ts", String(Date.now()));
      } catch {
        /* ignore */
      }
    }, 2500);
  }

  /** Broadcast current portal state to the navbar (sub-header + active tab) */
  _pushNavUpdate() {
    const navItems = this.isB2C
      ? PORTAL_NAV_ITEMS.filter((i) => i.id !== "quotations")
      : PORTAL_NAV_ITEMS;
    document.dispatchEvent(
      new CustomEvent("nexusportalnavupdate", {
        detail: {
          subHeaderItems: navItems,
          activeView: this.activeTab,
          isPortal: true,
          isB2B: this.isB2B
        }
      })
    );
  }

  // ── Sidebar nav tabs (3 category groups) ──────────────────────────────────
  _mapTabs(tabs) {
    return tabs.map((t) => ({
      ...t,
      cls:
        this.activeTab === t.id ? "ncp-nav-btn ncp-nav-active" : "ncp-nav-btn",
      iconVariant: this.activeTab === t.id ? "inverse" : "",
      chevronCls:
        this.activeTab === t.id
          ? "ncp-chevron ncp-chevron-active"
          : "ncp-chevron"
    }));
  }

  get mainNavTabs() {
    return this._mapTabs([
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "utility:home",
        hasBadge: false
      },
      {
        id: "catalog",
        label: "Catalog",
        icon: "utility:product_workspace",
        hasBadge: false
      },
      {
        id: "favorites",
        label: "My Favorites",
        icon: "utility:favorite",
        hasBadge: false
      },
      {
        id: "orders",
        label: "Orders & Deliveries",
        icon: "utility:truck",
        hasBadge: false
      },
      ...(this.isB2B
        ? [
            {
              id: "quotations",
              label: "Quotes & Contracts",
              icon: "utility:file",
              hasBadge: false
            }
          ]
        : []),
      {
        id: "cart",
        label: "My Cart",
        icon: "utility:cart",
        hasBadge: this.hasCartItems,
        badge: this.cartCount
      },
      {
        id: "combo-deals",
        label: "Combo Deals",
        icon: "utility:package",
        hasBadge: false
      }
    ]);
  }

  get toolsNavTabs() {
    return this._mapTabs([
      // Swap and Digital Passport: B2C only (hidden for B2B)
      ...(this.isB2B
        ? []
        : [
            {
              id: "swap",
              label: "Nexus Swap",
              icon: "utility:sync",
              hasBadge: false
            },
            {
              id: "passport",
              label: "Digital Passport",
              icon: "utility:identity",
              hasBadge: false
            }
          ]),
      {
        id: "war-room",
        label: "War Room",
        icon: "utility:strategy",
        hasBadge: false
      }
    ]);
  }

  get accountNavTabs() {
    return this._mapTabs([
      {
        id: "profile",
        label: "Profile",
        icon: "utility:user",
        hasBadge: false
      },
      { id: "cases", label: "Support", icon: "utility:case", hasBadge: false },
      {
        id: "my-reviews",
        label: "My Reviews",
        icon: "utility:rating",
        hasBadge: false
      }
    ]);
  }

  // ── Tab visibility ─────────────────────────────────────────────────────────
  get isDashboard() {
    return this.activeTab === "dashboard";
  }
  get isCatalog() {
    return this.activeTab === "catalog";
  }
  get isCatalogOrCheckout() {
    return this.activeTab === "catalog" || this.activeTab === "checkout";
  }
  get isComboDeals() {
    return this.activeTab === "combo-deals";
  }
  get isFavorites() {
    return this.activeTab === "favorites";
  }
  get isCart() {
    return this.activeTab === "cart";
  }
  get isCheckout() {
    return this.activeTab === "checkout";
  }
  get isOrders() {
    return this.activeTab === "orders";
  }
  get isQuotations() {
    return this.activeTab === "quotations";
  }
  get isSwap() {
    return this.activeTab === "swap";
  }
  get isPassport() {
    return this.activeTab === "passport";
  }
  get isTimeline() {
    return this.activeTab === "timeline";
  }
  get isWarRoom() {
    return this.activeTab === "war-room";
  }
  get isProfile() {
    return this.activeTab === "profile";
  }
  get isCases() {
    return this.activeTab === "cases";
  }
  get isSettings() {
    return this.activeTab === "settings";
  }
  get isMyReviews() {
    return this.activeTab === "my-reviews";
  }

  // ── Cart ───────────────────────────────────────────────────────────────────
  get cartCount() {
    return this.cart.length;
  }
  get hasCartItems() {
    return this.cart.length > 0;
  }
  get isCartEmpty() {
    return this.cart.length === 0;
  }
  get cartSubtotal() {
    return this.cart
      .reduce((s, i) => s + (parseFloat(i.unitPrice) || 0), 0)
      .toFixed(2);
  }
  get cartTax() {
    return (parseFloat(this.cartSubtotal) * 0.2).toFixed(2);
  }
  get cartTotal() {
    return (parseFloat(this.cartSubtotal) * 1.2).toFixed(2);
  }
  get cartItems() {
    return this.cart.map((item, idx) => ({ ...item, idx }));
  }

  // ── Catalog — Family & Color filter chips ──────────────────────────────────
  get catalogFamilies() {
    const sel = this.selectedFamily || "All";
    const families = ["All", ...new Set(this._products.map((p) => p.family))];
    return families.map((f) => ({
      id: f,
      label: f,
      cls: sel === f ? "ncat-chip ncat-chip-active" : "ncat-chip"
    }));
  }

  get catalogColors() {
    const sel = this.selectedColor || "All";
    const cols = [
      "All",
      ...new Set(
        this._products.flatMap((p) => (p.colors || []).map((c) => c.name))
      )
    ];
    return cols.map((c) => ({
      id: c,
      label: c,
      cls: sel === c ? "ncat-chip ncat-chip-active" : "ncat-chip"
    }));
  }

  // ── Catalog — Filtered product list ────────────────────────────────────────
  get filteredCatalogProducts() {
    const q = (this.catalogSearch || "").toLowerCase();
    const fam = this.selectedFamily || "All";
    const col = this.selectedColor || "All";
    const favIds = new Set(this.favorites.map((f) => f.id));

    return this._products
      .filter((p) => {
        const mFam = fam === "All" || p.family === fam;
        const mSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q);
        const mColor =
          col === "All" || (p.colors || []).some((c) => c.name === col);
        return mFam && mSearch && mColor;
      })
      .map((p) => {
        const matchedColor = (p.colors || []).find((c) => c.name === col);
        const displayImage =
          col !== "All" && matchedColor ? matchedColor.image : p.image;
        const isFav = favIds.has(p.id);
        return {
          ...p,
          displayImage,
          isFav,
          favBtnCls: isFav ? "ncat-fav-btn ncat-fav-active" : "ncat-fav-btn",
          priceDisplay: p.price.toLocaleString("fr-FR") + " $"
        };
      });
  }

  // ── Catalog — Favorites tab ────────────────────────────────────────────────
  get favoriteCatalogProducts() {
    const favIds = new Set(this.favorites.map((f) => f.id));
    return this._products
      .filter((p) => favIds.has(p.id))
      .map((p) => ({
        ...p,
        displayImage: p.image,
        isFav: true,
        favBtnCls: "ncat-fav-btn ncat-fav-active",
        priceDisplay: p.price.toLocaleString("fr-FR") + " $"
      }));
  }
  get hasFavoriteCatalogProducts() {
    return this.favoriteCatalogProducts.length > 0;
  }
  get noFavoriteCatalogProducts() {
    return this.favoriteCatalogProducts.length === 0;
  }

  // ── Product Detail Modal ───────────────────────────────────────────────────
  get selectedProduct() {
    if (!this._selectedProductId) return null;
    const p = this._products.find((pr) => pr.id === this._selectedProductId);
    if (!p) return null;

    const colors = p.colors || [];
    const activeColorName =
      this._modalActiveColor || (colors[0] ? colors[0].name : null);
    const activeColorObj =
      colors.find((c) => c.name === activeColorName) || colors[0];
    const displayImage = activeColorObj ? activeColorObj.image : p.image;
    const isFav = this.favorites.some((f) => f.id === p.id);

    return {
      ...p,
      displayImage,
      isFav,
      favLabel: isFav ? "Favorited" : "Favorite",
      favBtnCls: isFav
        ? "ncat-modal-fav ncat-modal-fav-active"
        : "ncat-modal-fav",
      hasColors: colors.length > 0,
      colorDots: colors.map((c) => ({
        key: c.name,
        name: c.name,
        hex: c.hex,
        dotCls:
          c.name === activeColorName
            ? "ncat-color-dot ncat-color-dot-active"
            : "ncat-color-dot",
        dotStyle: "background-color:" + c.hex + ";"
      })),
      priceDisplay: p.price.toLocaleString("fr-FR") + " $"
    };
  }
  get showProductModal() {
    return !!this._selectedProductId;
  }

  // ── B2B Quote Modal ────────────────────────────────────────────────────────
  get quoteProduct() {
    if (!this._quoteProductId) return null;
    return this._products.find((p) => p.id === this._quoteProductId) || null;
  }
  get showQuoteModal() {
    return !!this._quoteProductId;
  }
  get isQuoteForm() {
    return this._quoteStep === "form";
  }
  get isQuoteSuccess() {
    return this._quoteStep === "success";
  }

  // ── Cases 2-step ───────────────────────────────────────────────────────────
  get isCaseStep1() {
    return this.caseStep === 1;
  }
  get isCaseStep2() {
    return this.caseStep === 2;
  }
  get caseStepDot1() {
    return this.caseStep >= 1 ? "ncp-step-dot ncp-step-active" : "ncp-step-dot";
  }
  get caseStepDot2() {
    return this.caseStep >= 2
      ? "ncp-step-dot ncp-step-active ncp-step-wide"
      : "ncp-step-dot";
  }

  // ── Priority ───────────────────────────────────────────────────────────────
  get pLow() {
    return this._prioClass("Low");
  }
  get pMedium() {
    return this._prioClass("Medium");
  }
  get pHigh() {
    return this._prioClass("High");
  }
  get pCritical() {
    return this._prioClass("Critical");
  }
  _prioClass(p) {
    return this.casePriority === p ? "ncp-prio ncp-prio-active" : "ncp-prio";
  }

  // ── Handlers — Nav ────────────────────────────────────────────────────────
  handleTabChange(e) {
    this.activeTab = e.currentTarget.dataset.id;
    this._pushNavUpdate();
  }
  handleCatalogBack() {
    this.activeTab = this._prevTab || "dashboard";
    this._pushNavUpdate();
  }

  handleGoToCatalog() {
    this._prevTab = this.activeTab;
    this.activeTab = "catalog";
    this._pushNavUpdate();
  }
  handleGoToOrders() {
    this.activeTab = "orders";
    this._pushNavUpdate();
  }
  handleGoToInsights() {
    this.activeTab = "cases";
    this._pushNavUpdate();
  }
  handleGoToTimeline() {
    this.activeTab = "timeline";
    this._pushNavUpdate();
  }
  handleCasesTab() {
    this.activeTab = "cases";
    this._pushNavUpdate();
  }
  handleSettingsTab() {
    this.activeTab = "settings";
    this._pushNavUpdate();
  }

  // ── Handlers — Engagement System (drawers) ────────────────────────────────
  handleViewAllActivity() {
    const engSys = this.template.querySelector("c-nexus-engagement-system");
    if (engSys) engSys.openHistory();
  }

  handleEngagementActivityClick(e) {
    const type = e.detail && e.detail.type;
    const engSys = this.template.querySelector("c-nexus-engagement-system");
    if (engSys) engSys.closeHistory();
    if (type === "Quote") {
      this.activeTab = "quotations";
    } else {
      this.activeTab = "orders";
    }
    this._pushNavUpdate();
  }

  handleActivityRowClick(event) {
    const type = event.currentTarget.dataset.type;
    if (type === "Quote") {
      this.activeTab = "quotations";
    } else {
      this.activeTab = "orders";
    }
    this._pushNavUpdate();
  }

  handleViewOffer(e) {
    const btn = e.currentTarget;
    this.template.querySelector("c-nexus-engagement-system").openOffer({
      id: btn.dataset.id,
      name: btn.dataset.name,
      category: btn.dataset.category,
      price: btn.dataset.price,
      image: btn.dataset.image,
      reason: btn.dataset.reason
    });
  }

  handleViewOfferFromRec(e) {
    const id = (e.detail && e.detail.id) || null;
    if (!id) return;
    this._selectedProductId = id;
    const p = this._products.find((pr) => pr.id === id);
    this._modalActiveColor =
      p && p.colors && p.colors[0] ? p.colors[0].name : null;
  }

  handleViewProductFromRec(e) {
    this._openProductDetailById((e.detail && e.detail.productId) || null);
  }

  /** Open the product detail overlay by productId — works from any tab */
  _openProductDetailById(productId) {
    if (!productId) return;
    const product = this._products.find(
      (p) => p.id === productId || p.productId === productId
    );
    if (!product) return;
    // The detail overlay lives inside the dashboard template — always switch
    if (this.activeTab !== "dashboard") {
      this.activeTab = "dashboard";
      this._pushNavUpdate();
    }
    this.detailProduct = product;
  }

  handleEngagementAddToCart(e) {
    const offer = e.detail.offer;
    if (!offer) return;
    this.cart = [
      ...this.cart,
      {
        id: offer.id,
        name: offer.name,
        productId: offer.id,
        unitPrice: offer.price,
        imageUrl: offer.image,
        family: offer.category
      }
    ];
    this._saveCart();
  }

  // ── Handlers — Catalog filters ────────────────────────────────────────────
  handleCatalogSearch(e) {
    this.catalogSearch = e.target.value;
  }
  handleCatalogFamilyFilter(e) {
    this.selectedFamily = e.currentTarget.dataset.id;
  }
  handleCatalogColorFilter(e) {
    this.selectedColor = e.currentTarget.dataset.id;
  }

  // ── Handlers — Product detail modal ───────────────────────────────────────
  handleOpenProductDetail(e) {
    const id = e.currentTarget.dataset.id;
    this._selectedProductId = id;
    const p = this._products.find((pr) => pr.id === id);
    this._modalActiveColor =
      p && p.colors && p.colors[0] ? p.colors[0].name : null;
  }
  handleCloseProductDetail() {
    this._selectedProductId = null;
    this._modalActiveColor = null;
  }
  handleStopPropagation(e) {
    e.stopPropagation();
  }
  handleModalColorSelect(e) {
    this._modalActiveColor = e.currentTarget.dataset.color;
  }

  // ── Handlers — Favorites ──────────────────────────────────────────────────
  handleToggleFavorite(e) {
    this._toggleFavoriteById(e.currentTarget.dataset.id);
  }
  handleToggleFavoriteFromModal(e) {
    this._toggleFavoriteById(e.currentTarget.dataset.id);
  }
  _toggleFavoriteById(id) {
    const product = this._products.find((p) => p.id === id);
    if (!product) return;
    if (this.favorites.some((f) => f.id === id)) {
      this.favorites = this.favorites.filter((f) => f.id !== id);
    } else {
      this.favorites = [...this.favorites, product];
    }
  }

  handleAddToCartFromModal() {
    const product = this._products.find(
      (p) => p.id === this._selectedProductId
    );
    if (!product) return;
    this._pushToCart(product);
    this._selectedProductId = null;
    this._modalActiveColor = null;
    this._showCartToast(product);
  }

  // ── Handlers — Top Deals section ─────────────────────────────────────────
  handleDealsAddToCartPortal(event) {
    const product = event.detail && event.detail.product;
    if (!product) return;
    this._pushToCart({ ...product, price: product.salePrice });
    this._showCartToast(product);
  }

  handleDealsViewDetailsPortal(event) {
    // when a deal's arrow/button is clicked, open the detail overlay
    const product = event.detail && event.detail.product;
    if (product) {
      // set detail product; keep current tab intact so user stays where they were
      this.detailProduct = product;
    }
  }

  // catalog component events
  handleAddToCartFromCatalog(event) {
    const product = event.detail && event.detail.product;
    if (!product) return;
    this._pushToCart({ ...product, price: product.price || product.salePrice });
    this._showCartToast(product);
    document.dispatchEvent(new CustomEvent("nexuscartreveal"));
  }

  // ── Order payment events ──────────────────────────────────────────────────
  handlePayStripeEvent() {
    this.activeTab = "checkout";
    this._pushNavUpdate();
  }

  // ── Cart slider events ────────────────────────────────────────────────────
  handleCartSliderCheckout() {
    this.activeTab = "checkout";
  }

  handleCartSliderQuote() {
    this.activeTab = "quotations";
  }

  handleCartSliderViewFull() {
    this.activeTab = "cart";
  }

  handleCartSliderChange(event) {
    const items = event.detail && event.detail.items;
    if (Array.isArray(items)) {
      this.cart = items;
      this._saveCart();
    }
  }

  // ── Browse popup helper ───────────────────────────────────────────────────
  _triggerBrowsePopup(detail) {
    const viewedId = detail.productId;
    const viewedFamily = detail.productFamily;
    // Prefer a product from a different family (cross-sell); fall back to any other
    let pick = this._cachedRecs.find(
      (r) => r.productId !== viewedId && r.productFamily !== viewedFamily
    );
    if (!pick) pick = this._cachedRecs.find((r) => r.productId !== viewedId);
    if (!pick && this._cachedRecs.length) pick = this._cachedRecs[0];
    if (!pick) return;
    this._browsePopupProduct = pick;
    this._browsePopupVisible = true;
    if (this._browsePopupTimer) clearTimeout(this._browsePopupTimer);
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._browsePopupTimer = setTimeout(() => {
      this._browsePopupVisible = false;
    }, 6000);
  }

  // ── Browse popup getters & handlers ─────────────────────────────────────────
  get browsePopupVisible() {
    return this._browsePopupVisible && !this._cartSliderOpen;
  }

  get browsePopupProduct() {
    return this._browsePopupProduct;
  }

  handleDismissBrowsePopup() {
    this._browsePopupVisible = false;
    if (this._browsePopupTimer) {
      clearTimeout(this._browsePopupTimer);
      this._browsePopupTimer = null;
    }
  }

  handleBrowsePopupViewOffer() {
    if (!this._browsePopupProduct) return;
    this._browsePopupVisible = false;
    if (this._browsePopupTimer) {
      clearTimeout(this._browsePopupTimer);
      this._browsePopupTimer = null;
    }
    const popup = this._browsePopupProduct;
    // Try to find the full product from the loaded catalog
    let product = this._products.find(
      (p) => p.id === popup.productId || p.productId === popup.productId
    );
    // Fall back to building from popup data so it never silently fails
    if (!product) {
      product = {
        id: popup.productId,
        name: popup.productName,
        image: popup.imageUrl,
        price: popup.price || 0,
        family: popup.productFamily || "",
        description: popup.reason || "",
        features: [],
        rating: 0,
        reviews: 0
      };
    }
    // The overlay lives inside the dashboard template — always switch
    if (this.activeTab !== "dashboard") {
      this.activeTab = "dashboard";
      this._pushNavUpdate();
    }
    this.detailProduct = product;
  }

  handleAddToCartFromRec(event) {
    const product = event.detail && event.detail.product;
    if (!product) return;
    this._pushToCart({ ...product, price: product.price || product.unitPrice });
    this._showCartToast(product);
  }

  handleToggleFavoriteFromCatalog(event) {
    const product = event.detail && event.detail.product;
    if (!product) return;
    if (this.favorites.some((f) => f.id === product.id)) {
      this.favorites = this.favorites.filter((f) => f.id !== product.id);
    } else {
      this.favorites = [...this.favorites, product];
    }
  }

  handleRemoveFavorite(event) {
    const id = event.detail && event.detail.id;
    if (id) this.favorites = this.favorites.filter((f) => f.id !== id);
  }

  _pushToCart(product) {
    const existing = this.cart.find((i) => i.productId === product.id);
    if (existing) {
      this.cart = this.cart.map((i) => {
        if (i.productId === product.id)
          return { ...i, quantity: i.quantity + 1 };
        return i;
      });
    } else {
      this.cart = [
        ...this.cart,
        {
          ...product,
          itemId: product.id + "_" + Date.now(),
          productId: product.id,
          unitPrice: product.price,
          imageUrl: product.image,
          quantity: 1
        }
      ];
    }
    this._saveCart();
  }

  // ── Handlers — Quote modal ────────────────────────────────────────────────
  _resetQuoteForm() {
    this._quoteStep = "form";
    this._quoteCompany = "";
    this._quoteEmail = "";
    this._quoteQty = "10";
    this._quoteIndustry = "Technology";
    this._quoteMessage = "";
  }
  handleOpenQuoteForm(e) {
    this._quoteProductId = e.currentTarget.dataset.id;
    this._resetQuoteForm();
  }
  handleOpenQuoteFromModal() {
    this._quoteProductId = this._selectedProductId;
    this._selectedProductId = null;
    this._modalActiveColor = null;
    this._resetQuoteForm();
  }
  handleCloseQuoteModal() {
    this._quoteProductId = null;
    this._quoteStep = "form";
  }
  handleQuoteCompany(e) {
    this._quoteCompany = e.target.value;
  }
  handleQuoteEmail(e) {
    this._quoteEmail = e.target.value;
  }
  handleQuoteQty(e) {
    this._quoteQty = e.target.value;
  }
  handleQuoteIndustry(e) {
    this._quoteIndustry = e.target.value;
  }
  handleQuoteMessage(e) {
    this._quoteMessage = e.target.value;
  }
  handleQuoteSubmit() {
    this._quoteStep = "success";
  }

  // ── Handlers — Cases ──────────────────────────────────────────────────────
  handlePriority(e) {
    this.casePriority = e.currentTarget.dataset.priority;
  }
  handleNextCaseStep() {
    this.caseStep = 2;
  }
  handlePrevCaseStep() {
    this.caseStep = 1;
  }

  // ── Handlers — Cart (nexusPortalCart child events) ────────────────────────
  handleNavigateFromCart(e) {
    const { tab, appliedSparks, quoteId, quoteName } = e.detail || {};
    this.activeTab = tab;
    if (appliedSparks > 0) {
      this.sparksBalance = Math.max(0, this.sparksBalance - appliedSparks);
      this._sparksDiscount = appliedSparks / 100; // convert points → $
    } else {
      this._sparksDiscount = 0;
    }
    // After a cart quote submission navigating to quotations, force a cache bypass
    if (tab === "quotations") {
      this._quotationsRefreshKey = (this._quotationsRefreshKey || 0) + 1;
      if (quoteId) {
        this._openNegotiationChat(quoteId, quoteName);
      }
    }
    this._pushNavUpdate();
  }

  handleOpenNegotiationChat() {
    this._openNegotiationChat(null, null);
  }

  _openNegotiationChat(quoteId, quoteName) {
    // Delay lets the tab/modal transition finish before triggering chat
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      // Try modern MIAW bootstrap API first
      try {
        const bs = window.embeddedservice_bootstrap;
        if (bs && bs.utilAPI) {
          try {
            if (bs.prechatAPI) {
              const fields = {};
              if (this.profileAccountId)
                fields.AccountId = this.profileAccountId;
              if (quoteId) fields.QuoteId = quoteId;
              if (quoteName) fields.QuoteName = quoteName;
              if (Object.keys(fields).length > 0) {
                bs.prechatAPI.setHiddenPrechatFields(fields);
              }
            }
          } catch {
            /* prechatAPI not available on this deployment */
          }
          bs.utilAPI.launchChat();
          return;
        }
      } catch {
        /* fall through to DOM fallback */
      }

      // Fallback: classic Embedded Service Chat — click the help button
      try {
        /* eslint-disable @lwc/lwc/no-document-query */
        const btn =
          document.querySelector(".embeddedServiceHelpButton button") ||
          document.querySelector('[class*="helpButton"] button') ||
          document.querySelector("button.startButton");
        /* eslint-enable @lwc/lwc/no-document-query */
        if (btn) btn.click();
      } catch (e2) {
        console.error("Chat launch error:", e2);
      }
    }, 500);
  }

  get sparksDiscount() {
    return this._sparksDiscount;
  }

  get sparksFormattedValue() {
    return "$" + ((parseInt(this.sparksBalance, 10) || 0) / 100).toFixed(2);
  }

  // ── KPI helpers ───────────────────────────────────────────────────────────

  _loadKpis(accountId) {
    getMyOrders()
      .then((orders) => {
        const list = orders || [];
        this._kpiOrderCount = list.filter(
          (o) =>
            o.status === "Activated" ||
            o.status === "Draft" ||
            o.status === "Processing"
        ).length;
        this._kpiTotalSpent = list.reduce(
          (sum, o) => sum + (o.totalAmount || 0),
          0
        );
      })
      .catch(() => {
        this._kpiOrderCount = 0;
        this._kpiTotalSpent = 0;
      });

    if (accountId) {
      getAccountQuotes({ accountId })
        .then((quotes) => {
          this._kpiQuoteCount = (quotes || []).filter(
            (q) => q.status !== "Accepted" && q.status !== "Rejected"
          ).length;
        })
        .catch(() => {
          this._kpiQuoteCount = 0;
        });
    } else {
      this._kpiQuoteCount = 0;
    }
  }

  get kpiOrderCount() {
    return this._kpiOrderCount === null ? "—" : this._kpiOrderCount;
  }
  get kpiQuoteCount() {
    return this._kpiQuoteCount === null ? "—" : this._kpiQuoteCount;
  }
  get kpiFavCount() {
    return this.favorites.length;
  }
  get kpiTotalSpent() {
    if (this._kpiTotalSpent === null) return "—";
    return (
      "$" +
      this._kpiTotalSpent.toLocaleString("en-US", { maximumFractionDigits: 0 })
    );
  }

  handleKpiOrders() {
    this.activeTab = "orders";
    this._pushNavUpdate();
  }
  handleKpiQuotes() {
    this.activeTab = "quotations";
    this._pushNavUpdate();
  }
  handleKpiFavorites() {
    this.activeTab = "favorites";
    this._pushNavUpdate();
  }
  handleKpiSpent() {
    this.activeTab = "orders";
    this._pushNavUpdate();
  }

  handleSparksIgnite() {
    this._sparksModalOpen = true;
  }
  handleSparksClose() {
    this._sparksModalOpen = false;
  }
  handleSparksOverlayClick() {
    this._sparksModalOpen = false;
  }
  handleSparksModalStopProp(e) {
    e.stopPropagation();
  }

  // ── Handlers — product detail overlay ─────────────────────────────────────
  handleDetailClose() {
    this.detailProduct = null;
  }

  handleDetailAddToCart(event) {
    const product = event.detail && event.detail.product;
    if (product) {
      this._pushToCart({
        ...product,
        price: product.price || product.salePrice
      });
      this.detailProduct = null;
      this._showCartToast(product);
    }
  }

  handleDetailToggleFavorite(event) {
    const product = event.detail && event.detail.product;
    if (product) {
      this._toggleFavoriteById(product.id);
    }
  }

  handleCartChanged(e) {
    // Keep sidebar badge in sync when nexusPortalCart removes/updates items
    this.cart = e.detail.cart || [];
  }

  _showCartToast(product) {
    if (this._cartToastTimer) clearTimeout(this._cartToastTimer);
    this._cartToastName = product.name || "";
    this._cartToastPrice =
      product.price != null ? `$${Number(product.price).toLocaleString()}` : "";
    this._cartToastVisible = true;
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this._cartToastTimer = setTimeout(() => {
      this._cartToastVisible = false;
    }, 2000);
  }

  handleCartToastClose() {
    this._cartToastVisible = false;
    if (this._cartToastTimer) clearTimeout(this._cartToastTimer);
  }

  _saveCart() {
    try {
      sessionStorage.setItem(CART_KEY, JSON.stringify(this.cart));
      document.dispatchEvent(
        new CustomEvent("nexuscartupdate", {
          detail: { count: this.cart.length, items: this.cart }
        })
      );
    } catch {
      /* silent */
    }
  }
}
