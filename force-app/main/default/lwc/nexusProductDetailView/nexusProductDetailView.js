import { LightningElement, api, track } from 'lwc';
import userId from '@salesforce/user/Id';

export default class NexusProductDetailView extends LightningElement {

    @api favorites   = [];
    @api allProducts = [];

    @track _product         = null;
    @track activeColorIndex = 0;
    @track activeTab        = 'specs';
    @track showStickyNav    = false;
    @track showQuoteForm       = false;
    @track showClientTypeModal = false;
    @track showReviewForm      = false;
    @track _quoteData          = {};
    @track _reviewData      = {};
    @track _reviewRating    = 5;

    /* ── Public product setter ── */
    @api
    get product() { return this._product; }
    set product(value) {
        this._product         = value;
        this.activeColorIndex = 0;
        this.activeTab        = 'specs';
        this.showStickyNav       = false;
        this.showQuoteForm       = false;
        this.showClientTypeModal = false;
        this.showReviewForm      = false;
        this._scrollToTop        = true;
    }

    renderedCallback() {
        if (this._scrollToTop) {
            this._scrollToTop = false;
            const wrap = this.template.querySelector('.npdv-wrap');
            if (wrap) wrap.scrollTop = 0;
        }
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
       DERIVED: similar products
    ───────────────────────────────────── */
    get similarProducts() {
        if (!this._product || !this.allProducts || this.allProducts.length === 0) {
            return [1, 2, 3, 4].map(i => ({
                id:    `sim-${i}`,
                name:  `Nexus Variant ${i}`,
                price: '$1,299',
                image: `https://picsum.photos/seed/tech${i}/400/400`
            }));
        }
        return this.allProducts
            .filter(p => p.id !== this._product.id)
            .slice(0, 4)
            .map(p => ({
                id:    p.id,
                name:  p.name,
                price: `$${p.price}`,
                image: p.image
            }));
    }

    /* ─────────────────────────────────────
       DERIVED: review star selector
    ───────────────────────────────────── */
    get reviewStars() {
        return [1, 2, 3, 4, 5].map(v => ({
            val: v,
            cls: v <= this._reviewRating
                ? 'npdv-rstar npdv-rstar--on'
                : 'npdv-rstar'
        }));
    }

    /* ─────────────────────────────────────
       DERIVED: tab classes
    ───────────────────────────────────── */
    get tab1Cls() { return this._tabCls('specs'); }
    get tab2Cls() { return this._tabCls('reviews'); }
    get tab3Cls() { return this._tabCls('similar'); }
    get tab4Cls() { return this._tabCls('warranty'); }

    _tabCls(id) {
        return this.activeTab === id
            ? 'npdv-tab npdv-tab--active'
            : 'npdv-tab';
    }

    /* ─────────────────────────────────────
       AUTH HELPER
    ───────────────────────────────────── */
    get isAuthenticated() {
        return !!userId;
    }

    _requireAuth(mode = 'login') {
        this.dispatchEvent(new CustomEvent('requireauth', {
            detail: { mode },
            bubbles: true,
            composed: true
        }));
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

        const sections = ['specs', 'reviews', 'similar', 'warranty'];
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
        if (!this.isAuthenticated) {
            this._requireAuth('signup-select');
            return;
        }
        this.dispatchEvent(new CustomEvent('togglefavorite', {
            detail: { product: this._product }, bubbles: true, composed: true
        }));
    }

    handleAddToCart() {
        if (!this.isAuthenticated) {
            this._requireAuth('signup-select');
            return;
        }
        this.dispatchEvent(new CustomEvent('addtocart', {
            detail: { product: this._product }, bubbles: true, composed: true
        }));
    }

    /* ── Client type selection (B2B / B2C) ── */
    handleQuoteTypeOpen() {
        this.showClientTypeModal = true;
    }

    handleClientTypeClose() {
        this.showClientTypeModal = false;
    }

    handleClientTypeBackdropClick(event) {
        if (event.target === event.currentTarget) {
            this.showClientTypeModal = false;
        }
    }

    handleClientTypeModalClick(event) {
        event.stopPropagation();
    }

    handleClientTypeSelect(event) {
        const clientType = event.currentTarget.dataset.type;
        this.showClientTypeModal = false;
        this.dispatchEvent(new CustomEvent('quoterequest', {
            detail: { product: this._product, clientType },
            bubbles: true,
            composed: true
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

    /* ── Review handlers ── */
    handleWriteReview() {
        if (!this.isAuthenticated) {
            this._requireAuth();
            return;
        }
        this._reviewData   = {};
        this._reviewRating = 5;
        this.showReviewForm = true;
    }

    handleReviewClose() {
        this.showReviewForm = false;
    }

    handleReviewBackdropClick(event) {
        if (event.target === event.currentTarget) {
            this.showReviewForm = false;
        }
    }

    handleReviewModalClick(event) {
        event.stopPropagation();
    }

    handleReviewStar(event) {
        this._reviewRating = parseInt(event.currentTarget.dataset.val, 10);
    }

    handleReviewField(event) {
        const field = event.currentTarget.dataset.field;
        this._reviewData[field] = event.target.value;
    }

    handleReviewSubmit() {
        console.log('Review Submitted:', { rating: this._reviewRating, ...this._reviewData });
        this.showReviewForm = false;
    }

    /* ── Similar Products ── */
    handleSimilarProductClick(event) {
        const id = event.currentTarget.dataset.id;
        const product = (this.allProducts || []).find(p => p.id === id);
        if (product) {
            this.dispatchEvent(new CustomEvent('viewproduct', {
                detail: { product }, bubbles: true, composed: true
            }));
        }
    }
}
