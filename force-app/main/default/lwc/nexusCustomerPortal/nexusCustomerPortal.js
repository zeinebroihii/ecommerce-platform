import { LightningElement, wire, track } from 'lwc';
import getProductsWithStock from '@salesforce/apex/ProductController.getProductsWithStock';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const CART_KEY = 'ecomm_cart';

export default class NexusCustomerPortal extends LightningElement {
    @track activeTab     = 'dashboard';
    @track catalogSearch = '';
    @track caseView      = 'ai';
    @track casePriority  = 'Medium';
    @track cart          = [];
    @track _products     = [];

    @wire(getProductsWithStock, { searchTerm: '', category: '' })
    wiredProducts({ data }) {
        if (data) this._products = data;
    }

    connectedCallback() {
        try {
            const raw = sessionStorage.getItem(CART_KEY);
            if (raw) this.cart = JSON.parse(raw);
        } catch(e) { /* silent */ }
    }

    // ── Sidebar nav tabs ───────────────────────────────────────────────────────
    get navTabs() {
        const tabs = [
            { id: 'dashboard',  label: 'Dashboard',    icon: 'utility:dashboard' },
            { id: 'catalog',    label: 'Catalogue',    icon: 'utility:package' },
            { id: 'cart',       label: 'Mon Panier',   icon: 'utility:cart', badge: this.cartCount, hasBadge: this.hasCartItems },
            { id: 'orders',     label: 'Commandes',    icon: 'utility:list' },
            { id: 'quotations', label: 'Devis',        icon: 'utility:chat' },
            { id: 'profile',    label: 'Profil',       icon: 'utility:user' },
            { id: 'cases',      label: 'Réclamations', icon: 'utility:help' }
        ];
        return tabs.map(t => ({
            ...t,
            cls:         this.activeTab === t.id ? 'ncp-nav-btn ncp-nav-active' : 'ncp-nav-btn',
            iconVariant: this.activeTab === t.id ? 'inverse' : ''
        }));
    }

    // ── Tab visibility ─────────────────────────────────────────────────────────
    get isDashboard()  { return this.activeTab === 'dashboard'; }
    get isCatalog()    { return this.activeTab === 'catalog'; }
    get isCart()       { return this.activeTab === 'cart'; }
    get isOrders()     { return this.activeTab === 'orders'; }
    get isQuotations() { return this.activeTab === 'quotations'; }
    get isProfile()    { return this.activeTab === 'profile'; }
    get isCases()      { return this.activeTab === 'cases'; }

    // ── Cart ───────────────────────────────────────────────────────────────────
    get cartCount()    { return this.cart.length; }
    get hasCartItems() { return this.cart.length > 0; }
    get isCartEmpty()  { return this.cart.length === 0; }
    get cartSubtotal() {
        return this.cart.reduce((s, i) => s + (parseFloat(i.unitPrice) || 0), 0).toFixed(2);
    }
    get cartTax()   { return (parseFloat(this.cartSubtotal) * 0.2).toFixed(2); }
    get cartTotal() { return (parseFloat(this.cartSubtotal) * 1.2).toFixed(2); }
    get cartItems() { return this.cart.map((item, idx) => ({ ...item, idx })); }

    // ── Stock alerts ───────────────────────────────────────────────────────────
    get stockAlerts() {
        return this._products
            .filter(p => p.isOutOfStock || p.quantityAvailable < 10)
            .slice(0, 3)
            .map(p => ({
                ...p,
                stockBarStyle: `width:${Math.min(Math.round((p.quantityAvailable / 10) * 100), 100)}%`,
                stockBarClass: p.isOutOfStock ? 'ncp-stock-bar ncp-bar-rose' : 'ncp-stock-bar ncp-bar-amber',
                badgeClass:    p.isOutOfStock ? 'ncp-stock-badge ncp-badge-rose' : 'ncp-stock-badge ncp-badge-amber',
                statusLabel:   p.isOutOfStock ? 'Rupture' : 'Critique'
            }));
    }
    get hasStockAlerts()  { return this.stockAlerts.length > 0; }
    get noStockAlerts()   { return this.stockAlerts.length === 0; }

    // ── Catalog products ───────────────────────────────────────────────────────
    get catalogProducts() {
        const q = this.catalogSearch.toLowerCase();
        const list = q
            ? this._products.filter(p =>
                (p.name   || '').toLowerCase().includes(q) ||
                (p.family || '').toLowerCase().includes(q))
            : this._products;
        return list.map(p => ({
            ...p,
            stockLabel:     p.isOutOfStock ? 'Rupture' : `${p.quantityAvailable} unités`,
            badgeClass:     p.isOutOfStock ? 'ncp-stock-pill ncp-pill-rose' : 'ncp-stock-pill ncp-pill-emerald',
            showStockBadge: p.isOutOfStock || p.quantityAvailable < 10
        }));
    }

    // ── Case view ──────────────────────────────────────────────────────────────
    get isAiView()     { return this.caseView === 'ai'; }
    get isExpertView() { return this.caseView === 'expert'; }
    get caseTabAI()    { return this.caseView === 'ai'     ? 'ncp-case-tab ncp-case-active' : 'ncp-case-tab'; }
    get caseTabHuman() { return this.caseView === 'expert' ? 'ncp-case-tab ncp-case-active' : 'ncp-case-tab'; }

    // ── Priority ───────────────────────────────────────────────────────────────
    get pLow()      { return this._prioClass('Low'); }
    get pMedium()   { return this._prioClass('Medium'); }
    get pHigh()     { return this._prioClass('High'); }
    get pCritical() { return this._prioClass('Critical'); }
    _prioClass(p)   { return this.casePriority === p ? 'ncp-prio ncp-prio-active' : 'ncp-prio'; }

    // ── Handlers ───────────────────────────────────────────────────────────────
    handleTabChange(e)     { this.activeTab    = e.currentTarget.dataset.id; }
    handleGoToCatalog()    { this.activeTab    = 'catalog'; }
    handleGoToOrders()     { this.activeTab    = 'orders'; }
    handleCaseAI()         { this.caseView     = 'ai'; }
    handleCaseExpert()     { this.caseView     = 'expert'; }
    handleCatalogSearch(e) { this.catalogSearch = e.target.value; }
    handlePriority(e)      { this.casePriority  = e.currentTarget.dataset.priority; }

    handleAddToCart(e) {
        const productId = e.currentTarget.dataset.id;
        const product   = this._products.find(p => p.productId === productId);
        if (!product) return;
        this.cart = [...this.cart, { ...product }];
        this._saveCart();
        this.dispatchEvent(new ShowToastEvent({
            title: 'Panier', message: `${product.name} ajouté au panier.`, variant: 'success'
        }));
    }

    handleRemoveFromCart(e) {
        const idx     = parseInt(e.currentTarget.dataset.idx, 10);
        const updated = [...this.cart];
        updated.splice(idx, 1);
        this.cart = updated;
        this._saveCart();
    }

    _saveCart() {
        try { sessionStorage.setItem(CART_KEY, JSON.stringify(this.cart)); } catch(e) { /* silent */ }
    }
}
