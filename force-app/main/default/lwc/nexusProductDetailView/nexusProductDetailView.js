import { LightningElement, api, track } from 'lwc';
import isGuest from '@salesforce/user/isGuest';
import getProductReviews       from '@salesforce/apex/ProductReviewController.getProductReviews';
import checkPurchaseEligibility from '@salesforce/apex/ProductReviewController.checkPurchaseEligibility';
import submitProductReview      from '@salesforce/apex/ProductReviewController.submitProductReview';

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
    @track _reviewData         = {};
    @track _reviewRating       = 5;

    // ── Dynamic review state ──
    @track _reviews        = [];
    @track _reviewStats    = null;
    @track _eligibility    = { canReview: false, alreadyReviewed: false };
    @track _reviewsLoading = false;
    @track _submitLoading  = false;
    @track _submitError    = null;

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
        // Reset review state and load fresh data
        this._reviews        = [];
        this._reviewStats    = null;
        this._eligibility    = { canReview: false, alreadyReviewed: false };
        this._submitError    = null;
        if (value && value.id) {
            this._loadReviewData(value.id);
        }
    }

    renderedCallback() {
        if (this._scrollToTop) {
            this._scrollToTop = false;
            const wrap = this.template.querySelector('.npdv-wrap');
            if (wrap) wrap.scrollTop = 0;
        }
    }

    /* ── Load reviews + eligibility ── */
    _loadReviewData(productId) {
        this._reviewsLoading = true;

        const reviewsPromise = getProductReviews({ productId })
            .then(result => {
                this._reviews     = result.reviews || [];
                this._reviewStats = result.stats;
            })
            .catch(() => {
                this._reviews     = [];
                this._reviewStats = null;
            });

        let eligPromise = Promise.resolve();
        if (!isGuest) {
            eligPromise = checkPurchaseEligibility({ productId })
                .then(res => { this._eligibility = res; })
                .catch(err => {
                    console.error('[ProductReview] eligibility check failed:', err?.body?.message || err);
                    this._eligibility = { canReview: false, alreadyReviewed: false };
                });
        }

        Promise.all([reviewsPromise, eligPromise])
            .finally(() => { this._reviewsLoading = false; });
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
    get productPrice() {
        if (!this._product) return '0';
        const p = this._product.price ?? this._product.salePrice ?? 0;
        return p.toLocaleString('fr-FR');
    }

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
        const specs = this._product.specs;
        // If specs is a pipe-separated string (e.g. "GPU: ... | CPU: ..."), parse it
        if (typeof specs === 'string') {
            return specs.split('|').map(entry => {
                const colonIdx = entry.indexOf(':');
                if (colonIdx === -1) return { key: entry.trim(), value: '' };
                return {
                    key:   entry.slice(0, colonIdx).trim(),
                    value: entry.slice(colonIdx + 1).trim()
                };
            }).filter(e => e.key);
        }
        return Object.entries(specs).map(([key, value]) => ({ key, value }));
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
       DERIVED: review star selector (form)
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
       DERIVED: dynamic review display
    ───────────────────────────────────── */
    get hasReviews() {
        return this._reviews && this._reviews.length > 0;
    }

    get reviewCountLabel() {
        const c = this._reviewStats ? this._reviewStats.totalCount : 0;
        return `(${c} Review${c !== 1 ? 's' : ''})`;
    }

    get formattedAvgRating() {
        if (!this._reviewStats || this._reviewStats.totalCount === 0) return '—';
        return this._reviewStats.formattedRating || '—';
    }

    get reviewScoreSubLabel() {
        if (!this._reviewStats || this._reviewStats.totalCount === 0) {
            return 'No reviews yet';
        }
        return `Based on ${this._reviewStats.totalCount} review${this._reviewStats.totalCount !== 1 ? 's' : ''}`;
    }

    get verifiedPercentLabel() {
        if (!this._reviewStats || this._reviewStats.totalCount === 0) return null;
        return `${this._reviewStats.verifiedPercent}% of reviewers bought this product`;
    }

    get hasVerifiedInfo() {
        return !!(this._reviewStats && this._reviewStats.totalCount > 0);
    }

    // Stars for the score card (score section)
    get scoreStars() {
        const avg = (this._reviewStats && this._reviewStats.totalCount > 0)
            ? this._reviewStats.averageRating
            : 0;
        const rounded = Math.round(avg);
        return [1, 2, 3, 4, 5].map(v => ({
            val: v,
            cls: v <= rounded ? 'npdv-star npdv-star--on' : 'npdv-star npdv-star--off'
        }));
    }

    // Stars for the sidebar header
    get sidebarStars() {
        return this.scoreStars;
    }

    /* ─────────────────────────────────────
       DERIVED: review eligibility
    ───────────────────────────────────── */
    get isAuthenticated() { return !isGuest; }

    get canWriteReview() {
        return !isGuest
            && this._eligibility
            && this._eligibility.canReview
            && !this._eligibility.alreadyReviewed;
    }

    get showPurchaseRequiredMsg() {
        // Authenticated user who has NOT purchased this product
        return !isGuest
            && !this._reviewsLoading
            && this._eligibility
            && !this._eligibility.canReview;
    }

    get showAlreadyReviewedMsg() {
        return !isGuest
            && !this._reviewsLoading
            && this._eligibility
            && this._eligibility.alreadyReviewed;
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
    handleQuoteTypeOpen() { this.showClientTypeModal = true; }
    handleClientTypeClose() { this.showClientTypeModal = false; }

    handleClientTypeBackdropClick(event) {
        if (event.target === event.currentTarget) this.showClientTypeModal = false;
    }
    handleClientTypeModalClick(event) { event.stopPropagation(); }

    handleClientTypeSelect(event) {
        const clientType = event.currentTarget.dataset.type;
        this.showClientTypeModal = false;
        this.dispatchEvent(new CustomEvent('quoterequest', {
            detail: { product: this._product, clientType },
            bubbles: true,
            composed: true
        }));
    }

    handleQuoteRequest() { this._quoteData = {}; this.showQuoteForm = true; }
    handleQuoteClose()   { this.showQuoteForm = false; }

    handleQuoteBackdropClick(event) {
        if (event.target === event.currentTarget) this.showQuoteForm = false;
    }
    handleQuoteModalClick(event) { event.stopPropagation(); }

    handleQuoteField(event) {
        this._quoteData[event.currentTarget.dataset.field] = event.target.value;
    }

    handleQuoteSubmit() {
        this.showQuoteForm = false;
    }

    /* ── Review handlers ── */
    handleWriteReview() {
        if (!this.isAuthenticated) {
            this._requireAuth();
            return;
        }
        if (!this.canWriteReview) return;
        this._reviewData   = { title: '', body: '' };
        this._reviewRating = 5;
        this._submitError  = null;
        this.showReviewForm = true;
    }

    handleReviewClose() { this.showReviewForm = false; }

    handleReviewBackdropClick(event) {
        if (event.target === event.currentTarget) this.showReviewForm = false;
    }
    handleReviewModalClick(event) { event.stopPropagation(); }

    handleReviewStar(event) {
        this._reviewRating = parseInt(event.currentTarget.dataset.val, 10);
    }

    handleReviewField(event) {
        const field = event.currentTarget.dataset.field;
        this._reviewData = { ...this._reviewData, [field]: event.target.value };
    }

    handleReviewSubmit() {
        if (!this._reviewData.body || !this._reviewData.body.trim()) {
            this._submitError = 'Please write your review before submitting.';
            return;
        }
        this._submitLoading = true;
        this._submitError   = null;

        submitProductReview({
            productId: this._product.id,
            rating:    this._reviewRating,
            title:     this._reviewData.title || '',
            body:      this._reviewData.body
        })
        .then(() => {
            this.showReviewForm    = false;
            this._submitLoading    = false;
            // Mark as reviewed; can no longer write again
            this._eligibility      = { canReview: true, alreadyReviewed: true };
            // Reload reviews to show the new one
            this._loadReviewData(this._product.id);
        })
        .catch(err => {
            this._submitLoading = false;
            this._submitError   = (err && err.body && err.body.message)
                ? err.body.message
                : 'An error occurred. Please try again.';
        });
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
