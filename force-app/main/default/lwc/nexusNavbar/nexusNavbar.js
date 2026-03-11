import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue }            from 'lightning/uiRecordApi';
import Id                                       from '@salesforce/user/Id';
import ACCOUNT_ID_FIELD                         from '@salesforce/schema/User.AccountId';
import FIRSTNAME_FIELD                          from '@salesforce/schema/User.FirstName';
import LASTNAME_FIELD                           from '@salesforce/schema/User.LastName';

// ── Site-relative URLs (override via Experience Builder properties) ──────────
const HOME_URL   = '/ss/s/';
const PORTAL_URL = '/ss/s/';
const LOGIN_URL  = '/ss/s/login';
const DEVIS_URL  = '/ss/s/demande-devis';
const CART_URL   = '/ss/s/panier';
const ADMIN_URL  = '/lightning/app/NexusAdmin';

export default class NexusNavbar extends LightningElement {

    // Public props — can be set in Experience Builder
    @api homeUrl   = HOME_URL;
    @api portalUrl = PORTAL_URL;
    @api loginUrl  = LOGIN_URL;
    @api devisUrl  = DEVIS_URL;
    @api cartUrl   = CART_URL;
    @api adminUrl  = ADMIN_URL;
    @api cartCount = 0;

    @track mobileOpen      = false;
    @track _firstName      = '';
    @track _accountId      = null;
    @track _userWireLoaded = false;

    userId = Id;

    @wire(getRecord, { recordId: '$userId', fields: [ACCOUNT_ID_FIELD, FIRSTNAME_FIELD, LASTNAME_FIELD] })
    wiredUser({ data }) {
        this._userWireLoaded = true;
        if (data) {
            this._accountId = getFieldValue(data, ACCOUNT_ID_FIELD);
            this._firstName = getFieldValue(data, FIRSTNAME_FIELD) || '';
        }
    }

    // ── Computed ─────────────────────────────────────────────────────────────

    get isAuthenticated() {
        if (!this.userId || !this._userWireLoaded) return false;
        return !!this._accountId;
    }

    get userLabel() {
        return this._firstName || 'Mon compte';
    }

    get hasCartItems() {
        return this.cartCount > 0;
    }

    // ── Navigation ───────────────────────────────────────────────────────────

    goHome()   { window.location.href = this.homeUrl;   }
    goPortal() { window.location.href = this.portalUrl; }
    goDevis()  { window.location.href = this.devisUrl;  }
    goCart()   { window.location.href = this.cartUrl;   }
    goAdmin()  { window.location.href = this.adminUrl;  }

    /**
     * Login button — fires a document-level event so the page-body component
     * (nexusLoginView) can open the auth modal there.
     * We cannot embed the modal inside the navbar because backdrop-filter +
     * position:sticky create a new stacking context that breaks position:fixed.
     */
    goLogin() {
        document.dispatchEvent(new CustomEvent('nexusopenauth', {
            detail: { mode: 'login' }
        }));
        this.mobileOpen = false;
    }

    // ── Scroll helpers ────────────────────────────────────────────────────────
    scrollToProducts() { this._scrollTo('products-section'); }
    scrollToAbout()    { this._scrollTo('about-section');    }
    scrollToJourney()  { this._scrollTo('journey-section');  }
    scrollToFaq()      { this._scrollTo('faq-section');      }

    _scrollTo(id) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.mobileOpen = false;
    }

    handleLogout() {
        sessionStorage.removeItem('ecomm_cart');
        sessionStorage.removeItem('pending_devis');
        window.location.href = '/secur/logout.jsp?retURL=' + encodeURIComponent(this.homeUrl);
    }

    toggleMobile() {
        this.mobileOpen = !this.mobileOpen;
    }
}
