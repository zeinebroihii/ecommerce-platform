import { LightningElement, api, track } from 'lwc';

export default class NexusProductDetailView extends LightningElement {

    @api favorites = [];

    @track _product         = null;
    @track activeColorIndex = 0;
    @track activeTab        = 'overview';
    @track showStickyNav    = false;
    @track showQuoteForm    = false;
    @track _quoteData       = {};

    /* ── Public product setter ── */
    @api
    get product() { return this._product; }
    set product(value) {
        this._product = value;
        this.activeColorIndex = 0;
        this.activeTab        = 'overview';
        this.showStickyNav    = false;
        this.showQuoteForm    = false;
    }

    /* ─────────────────────────────────────
       DERIVED: product fields
    ───────────────────────────────────── */
    get productName()        { return this._product ? this._product.name        : ''; }
    get productCode()        { return this._product ? this._product.productCode  : ''; }
    get productCategory()    { return (this._product && this._product.category)    ? this._product.category    : 'Products'; }
    get productSubcategory() { return (this._product && this._product.subcategory) ? this._product.subcategory : 'Details'; }
    get productBrand()       { return (this._product && this._product.brand)       ? this._product.brand       : 'Nexus'; }
    get productWarranty()    { return (this._product && this._product.warranty)    ? this._product.warranty    : '3 Years Limited'; }
    get productDescription() { return this._product ? this._product.description  : ''; }
    get productPrice()       { return this._product ? this._product.price.toLocaleString() : '0'; }

    /* ─────────────────────────────────────
       DERIVED: image / colors
    ───────────────────────────────────── */
    get hasColors() {
        return !!(this._product && this._product.colors && this._product.colors.length > 0);
    }

    get currentImage() {
        if (!this._product) return '';
        if (this.hasColors) {
            const col = this._product.colors[this.activeColorIndex];
            return col ? col.image : this._product.image;
        }
        return this._product.image;
    }

    get colorThumbs() {
        if (!this.hasColors) return [];
        return this._product.colors.map((c, idx) => ({
            hex:      c.hex,
            name:     c.name,
            image:    c.image,
            idx,
            thumbCls: idx === this.activeColorIndex
                ? 'npdv-thumb npdv-thumb--active'
                : 'npdv-thumb'
        }));
    }

    /* ─────────────────────────────────────
       DERIVED: favorite
    ───────────────────────────────────── */
    get isFavorited() {
        if (!this._product || !this.favorites) return false;
        return this.favorites.some(f => f.id === this._product.id);
    }
    get favBtnCls() {
        return this.isFavorited
            ? 'npdv-fav-btn npdv-fav-btn--active'
            : 'npdv-fav-btn';
    }
    get favFill() { return this.isFavorited ? 'currentColor' : 'none'; }

    /* ─────────────────────────────────────
       DERIVED: features
    ───────────────────────────────────── */
    get featureCards() {
        if (!this._product) return [];
        const feats = (this._product.features && this._product.features.length > 0)
            ? this._product.features
            : ['AI-Driven Performance', 'Quantum Encryption', 'Real-time Telemetry'];
        return feats.map(f => ({ label: f }));
    }

    /* ─────────────────────────────────────
       DERIVED: specs
    ───────────────────────────────────── */
    get specEntries() {
        if (!this._product || !this._product.specs) return [];
        return Object.entries(this._product.specs).map(([key, value]) => ({ key, value }));
    }

    /* ─────────────────────────────────────
       DERIVED: similar products (static)
    ───────────────────────────────────── */
    get similarProducts() {
        return [1, 2, 3, 4].map(i => ({
            id:    `sim-${i}`,
            name:  `Nexus Variant ${i}`,
            price: '$1,299.99',
            image: `https://picsum.photos/seed/tech${i}/400/400`
        }));
    }

    /* ─────────────────────────────────────
       DERIVED: tab classes
    ───────────────────────────────────── */
    get tab1Cls() { return this._tabCls('overview'); }
    get tab2Cls() { return this._tabCls('specs'); }
    get tab3Cls() { return this._tabCls('reviews'); }
    get tab4Cls() { return this._tabCls('compare'); }
    get tab5Cls() { return this._tabCls('warranty'); }

    _tabCls(id) {
        return this.activeTab === id
            ? 'npdv-tab npdv-tab--active'
            : 'npdv-tab';
    }

    /* ─────────────────────────────────────
       HANDLERS
    ───────────────────────────────────── */
    handleClose() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    handleScroll(event) {
        const scrollTop = event.currentTarget.scrollTop;
        this.showStickyNav = scrollTop > 50;

        // Determine active tab by which section is in view
        const sections = ['overview', 'specs', 'reviews', 'compare', 'warranty'];
        for (let i = sections.length - 1; i >= 0; i--) {
            const el = this.template.querySelector(`#section-${sections[i]}`);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top <= 200) {
                    this.activeTab = sections[i];
                    break;
                }
            }
        }
    }

    handleTabClick(event) {
        const tab = event.currentTarget.dataset.tab;
        this.activeTab = tab;
        const el = this.template.querySelector(`#section-${tab}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    handleColorSelect(event) {
        this.activeColorIndex = parseInt(event.currentTarget.dataset.idx, 10);
    }

    handleToggleFavorite() {
        this.dispatchEvent(new CustomEvent('togglefavorite', {
            detail: { product: this._product }, bubbles: true, composed: true
        }));
    }

    handleAddToCart() {
        this.dispatchEvent(new CustomEvent('addtocart', {
            detail: { product: this._product }, bubbles: true, composed: true
        }));
    }

    handleQuoteRequest() {
        this._quoteData    = {};
        this.showQuoteForm = true;
    }

    handleQuoteClose() {
        this.showQuoteForm = false;
    }

    handleQuoteBackdropClick(event) {
        if (event.target === event.currentTarget) {
            this.showQuoteForm = false;
        }
    }

    handleQuoteModalClick(event) {
        event.stopPropagation();
    }

    handleQuoteField(event) {
        const field = event.currentTarget.dataset.field;
        this._quoteData[field] = event.target.value;
    }

    handleQuoteSubmit() {
        console.log('Quote Request Submitted:', this._quoteData);
        this.showQuoteForm = false;
    }
}