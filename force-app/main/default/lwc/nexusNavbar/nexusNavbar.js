import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue }            from 'lightning/uiRecordApi';
import Id                                       from '@salesforce/user/Id';
import ACCOUNT_ID_FIELD                         from '@salesforce/schema/User.AccountId';
import FIRSTNAME_FIELD                          from '@salesforce/schema/User.FirstName';
import LASTNAME_FIELD                           from '@salesforce/schema/User.LastName';

// ── Site-relative URLs (override via Experience Builder properties) ──────────
const HOME_URL   = '/shop/s/';
const PORTAL_URL = '/shop/s/';
const LOGIN_URL  = '/shop/s/login';
const DEVIS_URL  = '/shop/s/demande-devis';
const CART_URL   = '/shop/s/panier';

export default class NexusNavbar extends LightningElement {

    // Public props — can be set in Experience Builder
    @api homeUrl   = HOME_URL;
    @api portalUrl = PORTAL_URL;
    @api loginUrl  = LOGIN_URL;
    @api devisUrl  = DEVIS_URL;
    @api cartUrl   = CART_URL;
    @api cartCount = 0;

    @track mobileOpen    = false;
    @track _firstName    = '';
    @track _accountId    = null;
    @track _userWireLoaded = false;

    userId = Id;

    @wire(getRecord, { recordId: '$userId', fields: [ACCOUNT_ID_FIELD, FIRSTNAME_FIELD, LASTNAME_FIELD] })
    wiredUser({ data, error }) {
        this._userWireLoaded = true;
        if (data) {
            this._accountId = getFieldValue(data, ACCOUNT_ID_FIELD);
            this._firstName = getFieldValue(data, FIRSTNAME_FIELD) || '';
        }
    }

    // ── Computed ─────────────────────────────────────────────────────────────

    get isAuthenticated() {
        // Guest: no userId; internal SF users have no AccountId
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
    goLogin()  { window.location.href = this.loginUrl;  }
    goDevis()  { window.location.href = this.devisUrl;  }
    goCart()   { window.location.href = this.cartUrl;   }

    handleLogout() {
        sessionStorage.removeItem('ecomm_cart');
        sessionStorage.removeItem('pending_devis');
        window.location.href = '/secur/logout.jsp?retURL=' + encodeURIComponent(this.homeUrl);
    }

    toggleMobile() {
        this.mobileOpen = !this.mobileOpen;
    }
}
