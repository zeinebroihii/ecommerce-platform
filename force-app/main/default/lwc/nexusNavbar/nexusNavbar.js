import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue }            from 'lightning/uiRecordApi';
import Id                                       from '@salesforce/user/Id';
import ACCOUNT_ID_FIELD                         from '@salesforce/schema/User.AccountId';
import FIRSTNAME_FIELD                          from '@salesforce/schema/User.FirstName';
import LASTNAME_FIELD                           from '@salesforce/schema/User.LastName';

const HOME_URL   = '/ss/s/';
const PORTAL_URL = '/ss/s/';
const LOGIN_URL  = '/ss/s/login';
const CART_URL   = '/ss/s/panier';

const DEFAULT_NAV_ITEMS = [
    { id: 'home',           label: 'Home',           icon: '',                      scrollId: ''               },
    { id: 'products',       label: 'Products',       icon: 'utility:product',       scrollId: 'products-section' },
    { id: 'about',          label: 'About',          icon: '',                      scrollId: 'about-section'  },
    { id: 'journey',        label: 'Journey',        icon: '',                      scrollId: 'journey-section'},
    { id: 'faq',            label: 'FAQ',            icon: '',                      scrollId: 'faq-section'    },
    // MORE dropdown items
    { id: 'advanced-tools', label: 'Advanced Tools', icon: 'utility:settings',      scrollId: ''               },
    { id: 'account',        label: 'Account',        icon: 'utility:user',          scrollId: ''               },
    { id: 'support',        label: 'Support',        icon: 'utility:help',          scrollId: ''               },
];

// visible items before overflow into MORE dropdown
const VISIBLE_COUNT_LANDING = 5;
const VISIBLE_COUNT_PORTAL  = 7;

export default class NexusNavbar extends LightningElement {

    @api homeUrl        = HOME_URL;
    @api portalUrl      = PORTAL_URL;
    @api loginUrl       = LOGIN_URL;
    @api cartUrl        = CART_URL;
    @api devisUrl       = '/ss/s/demande-devis'; // kept for EB backwards-compat
    @api cartCount      = 0;
    @api activeView     = 'home';
    /** Static override from Experience Builder. Ignored when portal syncs dynamically. */
    @api subHeaderItems;

    @track mobileOpen      = false;
    @track isMoreMenuOpen  = false;
    @track _accountId      = null;
    @track _userWireLoaded = false;
    @track _userExists     = false;
    /** Set by portal via nexusportalnavupdate document event */
    @track _dynItems       = null;
    @track _dynActiveView  = null;
    @track _dynIsPortal    = false;
    @track _subBarHidden   = false;

    userId = Id;

    @wire(getRecord, { recordId: '$userId', fields: [ACCOUNT_ID_FIELD, FIRSTNAME_FIELD, LASTNAME_FIELD] })
    wiredUser({ data }) {
        this._userWireLoaded = true;
        if (data) {
            this._userExists = true;
            this._accountId  = getFieldValue(data, ACCOUNT_ID_FIELD);
        }
    }

    connectedCallback() {
        this._onPortalNavUpdate = (e) => {
            const { subHeaderItems, activeView, isPortal } = e.detail || {};
            if (subHeaderItems) {
                this._dynItems    = subHeaderItems.map(i => ({ ...i, scrollId: i.scrollId || '', icon: i.icon || '' }));
            }
            if (activeView !== undefined) this._dynActiveView = activeView;
            if (isPortal    !== undefined) this._dynIsPortal  = isPortal;
        };
        document.addEventListener('nexusportalnavupdate', this._onPortalNavUpdate);

        this._onDetailOpen  = () => { this._subBarHidden = true;  };
        this._onDetailClose = () => { this._subBarHidden = false; };
        document.addEventListener('nexusproductdetailopen',  this._onDetailOpen);
        document.addEventListener('nexusproductdetailclose', this._onDetailClose);
    }

    disconnectedCallback() {
        document.removeEventListener('nexusportalnavupdate',  this._onPortalNavUpdate);
        document.removeEventListener('nexusproductdetailopen',  this._onDetailOpen);
        document.removeEventListener('nexusproductdetailclose', this._onDetailClose);
    }

    // ── Computed ──────────────────────────────────────────────────────────────

    get isAuthenticated() {
        return true; // TODO: restore real auth check before go-live
        // if (!this.userId || !this._userWireLoaded) return false;
        // return this._userExists;
    }

    get hasCartItems()   { return this.cartCount > 0;   }
    get isPortalMode()   { return this._dynIsPortal;    }
    get isSubBarVisible(){ return !this._subBarHidden;  }

    get _items() {
        if (this._dynItems && this._dynItems.length) return this._dynItems;
        if (this.subHeaderItems && this.subHeaderItems.length) {
            return this.subHeaderItems.map(i => ({ ...i, scrollId: i.scrollId || '', icon: i.icon || '' }));
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
        return this._items.slice(0, this._visibleCount).map(item => ({
            ...item,
            cssClass: item.id === active ? 'nn-sub-link nn-sub-link-active' : 'nn-sub-link'
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

    goHome()   { window.location.href = this.homeUrl; }
    goPortal() {
        if (this._dynIsPortal) {
            this._dynActiveView = 'dashboard';
            document.dispatchEvent(new CustomEvent('nexusnavviewchange', { detail: { viewId: 'dashboard' } }));
        } else {
            window.location.href = this.portalUrl;
        }
    }
    handleNotifications() {
        if (this._dynIsPortal) {
            this._dynActiveView = 'dashboard';
            document.dispatchEvent(new CustomEvent('nexusnavviewchange', { detail: { viewId: 'dashboard' } }));
        } else {
            window.location.href = this.portalUrl;
        }
    }
    goCart() {
        if (this._dynIsPortal) {
            this._dynActiveView = 'cart';
            document.dispatchEvent(new CustomEvent('nexusnavviewchange', { detail: { viewId: 'cart' } }));
        } else {
            window.location.href = this.cartUrl;
        }
    }

    goLogin() {
        document.dispatchEvent(new CustomEvent('nexusopenauth', {
            detail: { mode: 'login' }
        }));
        this.mobileOpen = false;
    }

    handleLogout() {
        sessionStorage.removeItem('ecomm_cart');
        sessionStorage.removeItem('pending_devis');
        window.location.href = '/secur/logout.jsp?retURL=' + encodeURIComponent(this.homeUrl);
    }

    toggleMobile() { this.mobileOpen = !this.mobileOpen; }

    toggleMoreMenu(event) {
        event.stopPropagation();
        this.isMoreMenuOpen = !this.isMoreMenuOpen;
    }

    handleSubNavClick(event) {
        const id       = event.currentTarget.dataset.id;
        const scrollId = event.currentTarget.dataset.scroll;
        this.mobileOpen    = false;
        this.isMoreMenuOpen = false;

        if (scrollId) {
            const el = document.getElementById(scrollId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.location.href = this.homeUrl + '#' + scrollId;
            }
            return;
        }

        if (id === 'home') {
            this.goHome();
            return;
        }

        // Optimistically highlight
        this._dynActiveView = id;

        // Notify portal + any parent listener
        document.dispatchEvent(new CustomEvent('nexusnavviewchange', { detail: { viewId: id } }));
        this.dispatchEvent(new CustomEvent('viewchange', {
            detail: { viewId: id }, bubbles: true, composed: true
        }));
    }

    // Portal right-action buttons
    handleNexusBiz() {
        this._dynActiveView = 'quotations';
        document.dispatchEvent(new CustomEvent('nexusnavviewchange', { detail: { viewId: 'quotations' } }));
    }

    handleQuote() {
        this._dynActiveView = 'quotations';
        document.dispatchEvent(new CustomEvent('nexusnavviewchange', { detail: { viewId: 'quotations' } }));
    }
}
