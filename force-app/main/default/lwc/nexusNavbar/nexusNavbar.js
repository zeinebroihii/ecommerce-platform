import { LightningElement, api, wire, track } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import Id from "@salesforce/user/Id";
import ACCOUNT_ID_FIELD from "@salesforce/schema/User.AccountId";
import FIRSTNAME_FIELD from "@salesforce/schema/User.FirstName";
import LASTNAME_FIELD from "@salesforce/schema/User.LastName";

let _poppinsLoaded = false;

const HOME_URL = "/ss/s/";
const PORTAL_URL = "/ss/s/customportal";
const LOGIN_URL = "/ss/s/login";
const CART_URL = "/ss/s/panier";

const DEFAULT_NAV_ITEMS = [
  { id: "home", label: "Home", icon: "", scrollId: "" },
  {
    id: "products",
    label: "Products",
    icon: "utility:product",
    scrollId: "products-section"
  },
  { id: "about", label: "About", icon: "", scrollId: "about-section" },
  { id: "journey", label: "Journey", icon: "", scrollId: "journey-section" },
  { id: "faq", label: "FAQ", icon: "", scrollId: "faq-section" },
  // MORE dropdown items
  {
    id: "advanced-tools",
    label: "Advanced Tools",
    icon: "utility:settings",
    scrollId: ""
  },
  { id: "account", label: "Account", icon: "utility:user", scrollId: "" },
  { id: "support", label: "Support", icon: "utility:help", scrollId: "" }
];

// visible items before overflow into MORE dropdown
const VISIBLE_COUNT_LANDING = 5;
const VISIBLE_COUNT_PORTAL = 7;

export default class NexusNavbar extends LightningElement {
  @api homeUrl = HOME_URL;
  @api portalUrl = PORTAL_URL;
  @api loginUrl = LOGIN_URL;
  @api cartUrl = CART_URL;
  @api devisUrl = "/ss/s/demande-devis"; // kept for EB backwards-compat
  @api cartCount = 0;
  @track _liveCartCount = 0;
  @api activeView = "home";
  /** Static override from Experience Builder. Ignored when portal syncs dynamically. */
  @api subHeaderItems;

  @track mobileOpen = false;
  @track isMoreMenuOpen = false;
  @track _accountId = null;
  @track _userWireLoaded = false;
  @track _userExists = false;
  /** Set by portal via nexusportalnavupdate document event */
  @track _dynItems = null;
  @track _dynActiveView = null;
  @track _dynIsPortal = false;
  @track _subBarHidden = false;
  @track _recCount = 0;
  @track _recItems = [];
  @track _orderItems = [];
  @track _quoteItems = [];
  @track _cartAbandoned = [];
  @track _isB2B = false;
  @track _notifOpen = false;
  @track _notifExpanded = false;

  userId = Id;

  @wire(getRecord, {
    recordId: "$userId",
    fields: [ACCOUNT_ID_FIELD, FIRSTNAME_FIELD, LASTNAME_FIELD]
  })
  wiredUser({ data }) {
    this._userWireLoaded = true;
    if (data) {
      this._userExists = true;
      this._accountId = getFieldValue(data, ACCOUNT_ID_FIELD);
    }
  }

  connectedCallback() {
    // Sync cart count from sessionStorage on load
    this._syncCartCount();
    this._onCartUpdate = (e) => {
      this._liveCartCount =
        e.detail && e.detail.count != null
          ? e.detail.count
          : this._readCartStorage();
    };
    document.addEventListener("nexuscartupdate", this._onCartUpdate);

    if (!_poppinsLoaded) {
      _poppinsLoaded = true;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600;1,700&display=swap";
      document.head.appendChild(link);
    }
    this._onPortalNavUpdate = (e) => {
      const { subHeaderItems, activeView, isPortal, isB2B } = e.detail || {};
      if (subHeaderItems) {
        this._dynItems = subHeaderItems.map((i) => ({
          ...i,
          scrollId: i.scrollId || "",
          icon: i.icon || ""
        }));
      }
      if (activeView !== undefined) this._dynActiveView = activeView;
      if (isPortal !== undefined) this._dynIsPortal = isPortal;
      if (isB2B !== undefined) this._isB2B = isB2B;
    };
    document.addEventListener("nexusportalnavupdate", this._onPortalNavUpdate);

    this._onDetailOpen = () => {
      this._subBarHidden = true;
    };
    this._onDetailClose = () => {
      this._subBarHidden = false;
    };
    document.addEventListener("nexusproductdetailopen", this._onDetailOpen);
    document.addEventListener("nexusproductdetailclose", this._onDetailClose);

    this._onRecLoaded = (e) => {
      const d = e.detail || {};
      this._recCount = d.count || 0;
      this._recItems = (d.recs || [])
        .slice(0, 4)
        .map((r, i) => ({ ...r, key: "rec" + r.productId + i }));
    };
    document.addEventListener("nexusrecloaded", this._onRecLoaded);

    this._onActivityLoaded = (e) => {
      const d = e.detail || {};
      const items = d.items || [];
      this._isB2B = d.isB2B || false;
      this._orderItems = items
        .filter((a) => a.type === "Order")
        .slice(0, 3)
        .map((a, i) => ({ ...a, key: "ord" + (a.itemId || i) }));
      this._quoteItems = items
        .filter((a) => a.type === "Quote")
        .slice(0, 3)
        .map((a, i) => ({ ...a, key: "qt" + (a.itemId || i) }));
    };
    document.addEventListener("nexusactivityloaded", this._onActivityLoaded);

    // Check cart abandonment (items added > 3 days ago)
    this._checkCartAbandonment();
    // Re-check whenever the notification panel is about to open
    this._cartCheckInterval = null;

    this._onDocClick = (e) => {
      if (this._notifOpen) {
        const path = e.composedPath ? e.composedPath() : [];
        if (!path.some((el) => el === this.template.host)) {
          this._notifOpen = false;
          this._notifExpanded = false;
        }
      }
    };
    document.addEventListener("click", this._onDocClick);
  }

  disconnectedCallback() {
    document.removeEventListener(
      "nexusportalnavupdate",
      this._onPortalNavUpdate
    );
    document.removeEventListener("nexusproductdetailopen", this._onDetailOpen);
    document.removeEventListener(
      "nexusproductdetailclose",
      this._onDetailClose
    );
    document.removeEventListener("nexusrecloaded", this._onRecLoaded);
    document.removeEventListener("nexusactivityloaded", this._onActivityLoaded);
    document.removeEventListener("nexuscartupdate", this._onCartUpdate);
    document.removeEventListener("click", this._onDocClick);
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  get isAuthenticated() {
    if (!this.userId || !this._userWireLoaded) return false;
    return this._userExists;
  }

  get effectiveCartCount() {
    return this._liveCartCount || this.cartCount;
  }
  get hasCartItems() {
    return this.effectiveCartCount > 0;
  }

  _readCartStorage() {
    try {
      const raw = sessionStorage.getItem("ecomm_cart");
      const items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) ? items.length : 0;
    } catch {
      return 0;
    }
  }
  _syncCartCount() {
    this._liveCartCount = this._readCartStorage();
  }
  get notifOpen() {
    return this._notifOpen;
  }
  get notifExpanded() {
    return this._notifExpanded;
  }
  get notifExpandLabel() {
    return this._notifExpanded ? "Show less ▲" : "Show more ▼";
  }
  get hasMoreToShow() {
    return (
      this._recItems.length > 2 ||
      this._orderItems.length > 1 ||
      this._quoteItems.length > 1
    );
  }

  // Collapsed: 2 recs, 1 order, 1 quote. Expanded: all
  get notifRecItems() {
    return this._notifExpanded ? this._recItems : this._recItems.slice(0, 2);
  }
  get hasNotifRecs() {
    return this._recItems.length > 0;
  }
  get notifOrderItems() {
    return this._notifExpanded
      ? this._orderItems
      : this._orderItems.slice(0, 1);
  }
  get hasOrderItems() {
    return this._orderItems.length > 0;
  }
  get notifQuoteItems() {
    return this._notifExpanded
      ? this._quoteItems
      : this._quoteItems.slice(0, 1);
  }
  get hasQuoteItems() {
    return this._quoteItems.length > 0 && this._isB2B;
  }
  get cartAbandonedItems() {
    return this._cartAbandoned;
  }
  get hasCartAbandoned() {
    return this._cartAbandoned.length > 0;
  }
  get cartAbandonedCount() {
    return this._cartAbandoned.length;
  }
  get recCount() {
    return this._recCount + this._cartAbandoned.length;
  }
  get hasRecItems() {
    return this.recCount > 0;
  }
  get notifTotalLabel() {
    return String(this.recCount);
  }
  get isPortalMode() {
    return this._dynIsPortal;
  }
  get isSubBarVisible() {
    return !this._subBarHidden && !this.isPortalMode;
  }

  get _items() {
    if (this._dynItems && this._dynItems.length) return this._dynItems;
    if (this.subHeaderItems && this.subHeaderItems.length) {
      return this.subHeaderItems.map((i) => ({
        ...i,
        scrollId: i.scrollId || "",
        icon: i.icon || ""
      }));
    }
    return DEFAULT_NAV_ITEMS;
  }

  get _visibleCount() {
    return this._dynIsPortal ? VISIBLE_COUNT_PORTAL : VISIBLE_COUNT_LANDING;
  }

  get _activeViewResolved() {
    return this._dynActiveView !== null ? this._dynActiveView : this.activeView;
  }

  get visibleNavItems() {
    const active = this._activeViewResolved;
    return this._items.slice(0, this._visibleCount).map((item) => ({
      ...item,
      cssClass:
        item.id === active ? "nn-sub-link nn-sub-link-active" : "nn-sub-link"
    }));
  }

  get moreNavItems() {
    return this._items.slice(this._visibleCount);
  }

  get hasMoreItems() {
    return this._dynIsPortal && this._items.length > this._visibleCount;
  }

  get allNavItems() {
    return this._items;
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  goHome() {
    window.location.href = this.homeUrl;
  }
  goPortal() {
    if (this._dynIsPortal) {
      this._dynActiveView = "dashboard";
      document.dispatchEvent(
        new CustomEvent("nexusnavviewchange", {
          detail: { viewId: "dashboard" }
        })
      );
    } else {
      window.location.href = this.portalUrl;
    }
  }
  _checkCartAbandonment() {
    try {
      const raw = sessionStorage.getItem("ecomm_cart");
      if (!raw) {
        this._cartAbandoned = [];
        return;
      }
      const cart = JSON.parse(raw);
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      this._cartAbandoned = cart
        .filter((item) => {
          // itemId format: productId_timestamp
          const parts = (item.itemId || "").split("_");
          const ts = parseInt(parts[parts.length - 1], 10);
          return !isNaN(ts) && ts < threeDaysAgo;
        })
        .map((item, i) => ({
          ...item,
          key: "cart" + (item.productId || i)
        }));
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      this._cartAbandoned = [];
    }
  }

  handleNotifications(event) {
    event.stopPropagation();
    this._checkCartAbandonment();
    this._notifExpanded = false; // always start collapsed
    this._notifOpen = !this._notifOpen;
  }

  handleNotifToggleExpand(event) {
    event.stopPropagation();
    this._notifExpanded = !this._notifExpanded;
  }

  handleNotifViewAll() {
    this._notifOpen = false;
    if (this._dynIsPortal) {
      this._dynActiveView = "dashboard";
      document.dispatchEvent(
        new CustomEvent("nexusnavviewchange", {
          detail: { viewId: "dashboard" }
        })
      );
    } else {
      window.location.href = this.portalUrl;
    }
  }

  handleNotifRecClick(event) {
    const productId = event.currentTarget.dataset.id;
    this._notifOpen = false;
    // Navigate to portal if not already there
    if (!this._dynIsPortal) {
      window.location.href = this.portalUrl;
      return;
    }
    // Switch to dashboard and open product detail overlay
    this._dynActiveView = "dashboard";
    document.dispatchEvent(
      new CustomEvent("nexusnavviewchange", { detail: { viewId: "dashboard" } })
    );
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      document.dispatchEvent(
        new CustomEvent("nexusopenproductdetail", { detail: { productId } })
      );
    }, 80);
  }

  handleNotifOrderClick() {
    this._notifOpen = false;
    if (this._dynIsPortal) {
      this._dynActiveView = "orders";
      document.dispatchEvent(
        new CustomEvent("nexusnavviewchange", { detail: { viewId: "orders" } })
      );
    } else {
      window.location.href = this.portalUrl;
    }
  }

  handleNotifQuoteClick() {
    this._notifOpen = false;
    if (this._dynIsPortal) {
      this._dynActiveView = "quotations";
      document.dispatchEvent(
        new CustomEvent("nexusnavviewchange", {
          detail: { viewId: "quotations" }
        })
      );
    } else {
      window.location.href = this.portalUrl;
    }
  }

  handleNotifCartClick() {
    this._notifOpen = false;
    if (this._dynIsPortal) {
      this._dynActiveView = "cart";
      document.dispatchEvent(
        new CustomEvent("nexusnavviewchange", { detail: { viewId: "cart" } })
      );
    } else {
      window.location.href = this.cartUrl;
    }
  }
  goCart() {
    if (this._dynIsPortal) {
      this._dynActiveView = "cart";
      document.dispatchEvent(
        new CustomEvent("nexusnavviewchange", { detail: { viewId: "cart" } })
      );
    } else {
      window.location.href = this.cartUrl;
    }
  }

  goLogin() {
    document.dispatchEvent(
      new CustomEvent("nexusopenauth", {
        detail: { mode: "login" }
      })
    );
    this.mobileOpen = false;
  }

  handleLogout() {
    sessionStorage.removeItem("ecomm_cart");
    sessionStorage.removeItem("pending_devis");
    window.location.href = window.location.origin + "/ss/secur/logout.jsp";
  }

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  toggleMoreMenu(event) {
    event.stopPropagation();
    this.isMoreMenuOpen = !this.isMoreMenuOpen;
  }

  handleSubNavClick(event) {
    const id = event.currentTarget.dataset.id;
    const scrollId = event.currentTarget.dataset.scroll;
    this.mobileOpen = false;
    this.isMoreMenuOpen = false;

    if (scrollId) {
      // eslint-disable-next-line @lwc/lwc/no-document-query
      const el = document.getElementById(scrollId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.location.href = this.homeUrl + "#" + scrollId;
      }
      return;
    }

    if (id === "home") {
      this.goHome();
      return;
    }

    // Optimistically highlight
    this._dynActiveView = id;

    // Notify portal + any parent listener
    document.dispatchEvent(
      new CustomEvent("nexusnavviewchange", { detail: { viewId: id } })
    );
    this.dispatchEvent(
      new CustomEvent("viewchange", {
        detail: { viewId: id },
        bubbles: true,
        composed: true
      })
    );
  }

  // Portal right-action buttons
  handleNexusBiz() {
    this._dynActiveView = "quotations";
    document.dispatchEvent(
      new CustomEvent("nexusnavviewchange", {
        detail: { viewId: "quotations" }
      })
    );
  }

  handleQuote() {
    this._dynActiveView = "quotations";
    document.dispatchEvent(
      new CustomEvent("nexusnavviewchange", {
        detail: { viewId: "quotations" }
      })
    );
  }
}
