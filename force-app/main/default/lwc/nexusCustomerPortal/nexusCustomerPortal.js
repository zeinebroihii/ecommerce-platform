import { LightningElement, wire, track } from 'lwc';
import getProductsWithStock from '@salesforce/apex/ProductController.getProductsWithStock';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const CART_KEY = 'ecomm_cart';

// Sub-header items pushed to the navbar when portal is active
// First 7 are visible; rest overflow into MORE dropdown
const PORTAL_NAV_ITEMS = [
    { id: 'dashboard',  label: 'Dashboard',   icon: 'utility:home',              scrollId: '' },
    { id: 'catalog',    label: 'Catalogue',   icon: 'utility:product_workspace', scrollId: '' },
    { id: 'favorites',  label: 'Favoris',     icon: 'utility:favorite',          scrollId: '' },
    { id: 'orders',     label: 'Commandes',   icon: 'utility:truck',             scrollId: '' },
    { id: 'quotations', label: 'Devis',       icon: 'utility:file',              scrollId: '' },
    { id: 'cart',       label: 'Mon Panier',  icon: 'utility:cart',              scrollId: '' },
    { id: 'profile',    label: 'Profil',      icon: 'utility:user',              scrollId: '' },
    // MORE dropdown
    { id: 'swap',       label: 'Nexus Swap',        icon: 'utility:sync',      scrollId: '' },
    { id: 'passport',   label: 'Passeport Digital', icon: 'utility:identity',  scrollId: '' },
    { id: 'timeline',   label: 'Timeline 360°',     icon: 'utility:date_time', scrollId: '' },
    { id: 'war-room',   label: 'War Room',           icon: 'utility:strategy',  scrollId: '' },
    { id: 'cases',      label: 'Support',           icon: 'utility:case',      scrollId: '' },
    { id: 'settings',   label: 'Paramètres',        icon: 'utility:settings',  scrollId: '' },
];

// ── Catalog mock data (translated from NexusCatalog.tsx) ─────────────────────
const CATALOG_PRODUCTS = [
    {
        id: 'pc-1', name: 'Nexus Pro-Station G1', productCode: 'PC-G1',
        family: 'Computing', price: 2499, rating: 5.0, reviews: 156,
        image: 'https://picsum.photos/seed/pc-black/800/800',
        description: 'The ultimate workstation for high-performance computing. Available in three distinct finishes.',
        features: ['RTX 5090 Ready', '128GB DDR5', 'Liquid Cooled'],
        isNew: true, isPopular: false,
        colors: [
            { name: 'Black', hex: '#000000', image: 'https://picsum.photos/seed/pc-black/800/800' },
            { name: 'White', hex: '#ffffff', image: 'https://picsum.photos/seed/pc-white/800/800' },
            { name: 'Gray',  hex: '#64748b', image: 'https://picsum.photos/seed/pc-gray/800/800' }
        ]
    },
    {
        id: '1', name: 'Nexus Core Hub v3', productCode: 'NX-100',
        family: 'Central Systems', price: 1299, rating: 4.9, reviews: 128,
        image: 'https://picsum.photos/seed/hub/800/800',
        description: 'The ultimate central intelligence unit for your industrial ecosystem. Powered by Nexus Neural Engine.',
        features: ['AI-Driven Optimization', 'Real-time Analytics', 'Quantum Encryption'],
        isNew: false, isPopular: false,
        colors: [
            { name: 'Titanium', hex: '#475569', image: 'https://picsum.photos/seed/hub/800/800' },
            { name: 'Midnight', hex: '#0f172a', image: 'https://picsum.photos/seed/hub-dark/800/800' }
        ]
    },
    {
        id: '2', name: 'Neural Sensor Pack', productCode: 'NX-200',
        family: 'Sensors', price: 499, rating: 4.8, reviews: 85,
        image: 'https://picsum.photos/seed/sensor/800/800',
        description: 'High-precision environmental sensors with edge-computing capabilities for instant data processing.',
        features: ['Ultra-low Latency', 'Self-Calibrating', 'IP68 Rated'],
        isNew: false, isPopular: true, colors: []
    },
    {
        id: '3', name: 'Quantum Link Bridge', productCode: 'NX-300',
        family: 'Connectivity', price: 899, rating: 5.0, reviews: 42,
        image: 'https://picsum.photos/seed/bridge/800/800',
        description: 'Seamlessly bridge your legacy systems with the Nexus ecosystem using our quantum-secure gateway.',
        features: ['Legacy Support', 'Zero-Trust Security', 'Auto-Scaling'],
        isNew: false, isPopular: false, colors: []
    },
    {
        id: '4', name: 'Nexus Vision Pro', productCode: 'NX-400',
        family: 'Monitoring', price: 1599, rating: 4.7, reviews: 210,
        image: 'https://picsum.photos/seed/vision/800/800',
        description: 'Advanced visual monitoring system with integrated AI for anomaly detection and predictive maintenance.',
        features: ['8K Resolution', 'Night Vision', 'Object Tracking'],
        isNew: true, isPopular: false, colors: []
    },
    {
        id: '5', name: 'Eco-Pulse Monitor', productCode: 'NX-500',
        family: 'Sustainability', price: 299, rating: 4.9, reviews: 67,
        image: 'https://picsum.photos/seed/pulse/800/800',
        description: 'Track your carbon footprint and energy efficiency in real-time with the Eco-Pulse ecosystem.',
        features: ['CO2 Tracking', 'Energy Insights', 'Auto-Reporting'],
        isNew: false, isPopular: true, colors: []
    },
    {
        id: '6', name: 'Nexus Edge Node', productCode: 'NX-600',
        family: 'Computing', price: 749, rating: 4.6, reviews: 54,
        image: 'https://picsum.photos/seed/node/800/800',
        description: 'Decentralized computing nodes for distributed intelligence across your entire network.',
        features: ['Edge AI', 'Dynamic Mesh', 'Hot-Swappable'],
        isNew: false, isPopular: false, colors: []
    }
];

export default class NexusCustomerPortal extends LightningElement {
    @track activeTab     = 'dashboard';
    @track catalogSearch = '';
    @track caseStep      = 1;
    @track casePriority  = 'Medium';
    @track cart          = [];
    @track _products     = [];

    // detail view state for product overlay
    @track detailProduct = null;

    get isDetailViewOpen() {
        return !!this.detailProduct;
    }

    // ── Catalog state ──────────────────────────────────────────────────────────
    @track selectedFamily     = 'All';
    @track selectedColor      = 'All';
    @track favorites          = [];
    @track _selectedProductId = null;
    @track _modalActiveColor  = null;
    @track _quoteProductId    = null;
    @track _quoteStep         = 'form';
    @track _quoteCompany      = '';
    @track _quoteEmail        = '';
    @track _quoteQty          = '10';
    @track _quoteIndustry     = 'Technology';
    @track _quoteMessage      = '';

    @wire(getProductsWithStock, { searchTerm: '', category: '' })
    wiredProducts({ data }) {
        if (data) this._products = data;
    }

    connectedCallback() {
        if (!document.querySelector('#nexus-gfonts')) {
            const link = document.createElement('link');
            link.id   = 'nexus-gfonts';
            link.rel  = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap';
            document.head.appendChild(link);
        }
        try {
            const raw = sessionStorage.getItem(CART_KEY);
            if (raw) this.cart = JSON.parse(raw);
        } catch(e) { /* silent */ }

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
        document.addEventListener('nexusnavviewchange', this._onNavViewChange);

        // Tell navbar: we are a portal, here are our tabs
        this._pushNavUpdate();
    }

    disconnectedCallback() {
        document.removeEventListener('nexusnavviewchange', this._onNavViewChange);
    }

    /** Broadcast current portal state to the navbar (sub-header + active tab) */
    _pushNavUpdate() {
        document.dispatchEvent(new CustomEvent('nexusportalnavupdate', {
            detail: { subHeaderItems: PORTAL_NAV_ITEMS, activeView: this.activeTab, isPortal: true }
        }));
    }

    // ── Sidebar nav tabs (3 category groups) ──────────────────────────────────
    _mapTabs(tabs) {
        return tabs.map(t => ({
            ...t,
            cls:         this.activeTab === t.id ? 'ncp-nav-btn ncp-nav-active' : 'ncp-nav-btn',
            iconVariant: this.activeTab === t.id ? 'inverse' : '',
            chevronCls:  this.activeTab === t.id ? 'ncp-chevron ncp-chevron-active' : 'ncp-chevron'
        }));
    }

    get mainNavTabs() {
        return this._mapTabs([
            { id: 'dashboard',  label: 'Dashboard',              icon: 'utility:home',      hasBadge: false },
            { id: 'catalog',    label: 'Catalogue',              icon: 'utility:product_workspace', hasBadge: false },
            { id: 'favorites',  label: 'Mes Favoris',            icon: 'utility:favorite',  hasBadge: false },
            { id: 'orders',     label: 'Commandes & Livraisons', icon: 'utility:truck',     hasBadge: false },
            { id: 'quotations', label: 'Devis & Contrats',       icon: 'utility:file',      hasBadge: false },
            { id: 'cart',       label: 'Mon Panier',             icon: 'utility:cart',      hasBadge: this.hasCartItems, badge: this.cartCount },
        ]);
    }

    get toolsNavTabs() {
        return this._mapTabs([
            { id: 'swap',     label: 'Nexus Swap',        icon: 'utility:sync',      hasBadge: false },
            { id: 'passport', label: 'Passeport Digital', icon: 'utility:identity',  hasBadge: false },
            { id: 'timeline', label: 'Timeline 360°',     icon: 'utility:date_time', hasBadge: false },
            { id: 'war-room', label: 'War Room',          icon: 'utility:strategy',  hasBadge: false },
        ]);
    }

    get accountNavTabs() {
        return this._mapTabs([
            { id: 'profile',  label: 'Profil',     icon: 'utility:user',     hasBadge: false },
            { id: 'cases',    label: 'Support',    icon: 'utility:case',     hasBadge: false },
            { id: 'settings', label: 'Paramètres', icon: 'utility:settings', hasBadge: false },
        ]);
    }

    // ── Tab visibility ─────────────────────────────────────────────────────────
    get isDashboard()  { return this.activeTab === 'dashboard'; }
    get isCatalog()    { return this.activeTab === 'catalog'; }
    get isFavorites()  { return this.activeTab === 'favorites'; }
    get isCart()       { return this.activeTab === 'cart'; }
    get isOrders()     { return this.activeTab === 'orders'; }
    get isQuotations() { return this.activeTab === 'quotations'; }
    get isSwap()       { return this.activeTab === 'swap'; }
    get isPassport()   { return this.activeTab === 'passport'; }
    get isTimeline()   { return this.activeTab === 'timeline'; }
    get isWarRoom()    { return this.activeTab === 'war-room'; }
    get isProfile()    { return this.activeTab === 'profile'; }
    get isCases()      { return this.activeTab === 'cases'; }
    get isSettings()   { return this.activeTab === 'settings'; }

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

    // ── Catalog — Family & Color filter chips ──────────────────────────────────
    get catalogFamilies() {
        const sel = this.selectedFamily || 'All';
        const families = ['All', ...new Set(CATALOG_PRODUCTS.map(p => p.family))];
        return families.map(f => ({
            id: f, label: f,
            cls: sel === f ? 'ncat-chip ncat-chip-active' : 'ncat-chip'
        }));
    }

    get catalogColors() {
        const sel  = this.selectedColor || 'All';
        const cols = ['All', ...new Set(CATALOG_PRODUCTS.flatMap(p => (p.colors || []).map(c => c.name)))];
        return cols.map(c => ({
            id: c, label: c,
            cls: sel === c ? 'ncat-chip ncat-chip-active' : 'ncat-chip'
        }));
    }

    // ── Catalog — Filtered product list ────────────────────────────────────────
    get filteredCatalogProducts() {
        const q      = (this.catalogSearch || '').toLowerCase();
        const fam    = this.selectedFamily || 'All';
        const col    = this.selectedColor  || 'All';
        const favIds = new Set(this.favorites.map(f => f.id));

        return CATALOG_PRODUCTS
            .filter(p => {
                const mFam    = fam === 'All' || p.family === fam;
                const mSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
                const mColor  = col === 'All' || (p.colors || []).some(c => c.name === col);
                return mFam && mSearch && mColor;
            })
            .map(p => {
                const matchedColor = (p.colors || []).find(c => c.name === col);
                const displayImage = (col !== 'All' && matchedColor) ? matchedColor.image : p.image;
                const isFav        = favIds.has(p.id);
                return {
                    ...p,
                    displayImage,
                    isFav,
                    favBtnCls:    isFav ? 'ncat-fav-btn ncat-fav-active' : 'ncat-fav-btn',
                    priceDisplay: p.price.toLocaleString('fr-FR') + ' $'
                };
            });
    }

    // ── Catalog — Favorites tab ────────────────────────────────────────────────
    get favoriteCatalogProducts() {
        const favIds = new Set(this.favorites.map(f => f.id));
        return CATALOG_PRODUCTS
            .filter(p => favIds.has(p.id))
            .map(p => ({
                ...p,
                displayImage: p.image,
                isFav:        true,
                favBtnCls:    'ncat-fav-btn ncat-fav-active',
                priceDisplay: p.price.toLocaleString('fr-FR') + ' $'
            }));
    }
    get hasFavoriteCatalogProducts() { return this.favoriteCatalogProducts.length > 0; }
    get noFavoriteCatalogProducts()  { return this.favoriteCatalogProducts.length === 0; }

    // ── Product Detail Modal ───────────────────────────────────────────────────
    get selectedProduct() {
        if (!this._selectedProductId) return null;
        const p = CATALOG_PRODUCTS.find(pr => pr.id === this._selectedProductId);
        if (!p) return null;

        const colors          = p.colors || [];
        const activeColorName = this._modalActiveColor || (colors[0] ? colors[0].name : null);
        const activeColorObj  = colors.find(c => c.name === activeColorName) || colors[0];
        const displayImage    = activeColorObj ? activeColorObj.image : p.image;
        const isFav           = this.favorites.some(f => f.id === p.id);

        return {
            ...p,
            displayImage,
            isFav,
            favLabel:  isFav ? 'Favorited' : 'Favorite',
            favBtnCls: isFav ? 'ncat-modal-fav ncat-modal-fav-active' : 'ncat-modal-fav',
            hasColors: colors.length > 0,
            colorDots: colors.map(c => ({
                key:      c.name,
                name:     c.name,
                hex:      c.hex,
                dotCls:   c.name === activeColorName
                    ? 'ncat-color-dot ncat-color-dot-active'
                    : 'ncat-color-dot',
                dotStyle: 'background-color:' + c.hex + ';'
            })),
            priceDisplay: p.price.toLocaleString('fr-FR') + ' $'
        };
    }
    get showProductModal() { return !!this._selectedProductId; }

    // ── B2B Quote Modal ────────────────────────────────────────────────────────
    get quoteProduct() {
        if (!this._quoteProductId) return null;
        return CATALOG_PRODUCTS.find(p => p.id === this._quoteProductId) || null;
    }
    get showQuoteModal() { return !!this._quoteProductId; }
    get isQuoteForm()    { return this._quoteStep === 'form'; }
    get isQuoteSuccess() { return this._quoteStep === 'success'; }

    // ── Cases 2-step ───────────────────────────────────────────────────────────
    get isCaseStep1()  { return this.caseStep === 1; }
    get isCaseStep2()  { return this.caseStep === 2; }
    get caseStepDot1() { return this.caseStep >= 1 ? 'ncp-step-dot ncp-step-active' : 'ncp-step-dot'; }
    get caseStepDot2() { return this.caseStep >= 2 ? 'ncp-step-dot ncp-step-active ncp-step-wide' : 'ncp-step-dot'; }

    // ── Priority ───────────────────────────────────────────────────────────────
    get pLow()      { return this._prioClass('Low'); }
    get pMedium()   { return this._prioClass('Medium'); }
    get pHigh()     { return this._prioClass('High'); }
    get pCritical() { return this._prioClass('Critical'); }
    _prioClass(p)   { return this.casePriority === p ? 'ncp-prio ncp-prio-active' : 'ncp-prio'; }

    // ── Handlers — Nav ────────────────────────────────────────────────────────
    handleTabChange(e)    { this.activeTab = e.currentTarget.dataset.id; this._pushNavUpdate(); }
    handleGoToCatalog()   { this.activeTab = 'catalog';  this._pushNavUpdate(); }
    handleGoToOrders()    { this.activeTab = 'orders';   this._pushNavUpdate(); }
    handleGoToInsights()  { this.activeTab = 'cases';    this._pushNavUpdate(); }
    handleGoToTimeline()  { this.activeTab = 'timeline'; this._pushNavUpdate(); }
    handleCasesTab()      { this.activeTab = 'cases';    this._pushNavUpdate(); }
    handleSettingsTab()   { this.activeTab = 'settings'; this._pushNavUpdate(); }

    // ── Handlers — Engagement System (drawers) ────────────────────────────────
    handleViewAllActivity() {
        this.template.querySelector('c-nexus-engagement-system').openHistory();
    }

    handleViewOffer(e) {
        const btn = e.currentTarget;
        this.template.querySelector('c-nexus-engagement-system').openOffer({
            id:       btn.dataset.id,
            name:     btn.dataset.name,
            category: btn.dataset.category,
            price:    btn.dataset.price,
            image:    btn.dataset.image,
            reason:   btn.dataset.reason,
        });
    }

    handleEngagementAddToCart(e) {
        const offer = e.detail.offer;
        if (!offer) return;
        this.cart = [...this.cart, {
            id:        offer.id,
            name:      offer.name,
            productId: offer.id,
            unitPrice: offer.price,
            imageUrl:  offer.image,
            family:    offer.category,
        }];
        this._saveCart();
    }

    // ── Handlers — Catalog filters ────────────────────────────────────────────
    handleCatalogSearch(e)       { this.catalogSearch  = e.target.value; }
    handleCatalogFamilyFilter(e) { this.selectedFamily = e.currentTarget.dataset.id; }
    handleCatalogColorFilter(e)  { this.selectedColor  = e.currentTarget.dataset.id; }

    // ── Handlers — Product detail modal ───────────────────────────────────────
    handleOpenProductDetail(e) {
        const id = e.currentTarget.dataset.id;
        this._selectedProductId = id;
        const p = CATALOG_PRODUCTS.find(pr => pr.id === id);
        this._modalActiveColor = (p && p.colors && p.colors[0]) ? p.colors[0].name : null;
    }
    handleCloseProductDetail() {
        this._selectedProductId = null;
        this._modalActiveColor  = null;
    }
    handleStopPropagation(e) { e.stopPropagation(); }
    handleModalColorSelect(e) { this._modalActiveColor = e.currentTarget.dataset.color; }

    // ── Handlers — Favorites ──────────────────────────────────────────────────
    handleToggleFavorite(e)          { this._toggleFavoriteById(e.currentTarget.dataset.id); }
    handleToggleFavoriteFromModal(e) { this._toggleFavoriteById(e.currentTarget.dataset.id); }
    _toggleFavoriteById(id) {
        const product = CATALOG_PRODUCTS.find(p => p.id === id);
        if (!product) return;
        if (this.favorites.some(f => f.id === id)) {
            this.favorites = this.favorites.filter(f => f.id !== id);
        } else {
            this.favorites = [...this.favorites, product];
        }
    }

    // ── Handlers — Add to cart (catalog & modal) ──────────────────────────────
    handleAddToCartFromCatalog(e) {
        const id      = e.currentTarget.dataset.id;
        const product = CATALOG_PRODUCTS.find(p => p.id === id);
        if (!product) return;
        this._pushToCart(product);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Panier', message: `${product.name} ajouté au panier.`, variant: 'success'
        }));
    }

    handleAddToCartFromModal() {
        const product = CATALOG_PRODUCTS.find(p => p.id === this._selectedProductId);
        if (!product) return;
        this._pushToCart(product);
        this._selectedProductId = null;
        this._modalActiveColor  = null;
        this.dispatchEvent(new ShowToastEvent({
            title: 'Panier', message: `${product.name} ajouté au panier.`, variant: 'success'
        }));
    }

    // ── Handlers — Top Deals section ─────────────────────────────────────────
    handleDealsAddToCartPortal(event) {
        const product = event.detail && event.detail.product;
        if (!product) return;
        this._pushToCart({ ...product, price: product.salePrice });
        this.dispatchEvent(new ShowToastEvent({
            title: 'Panier', message: `${product.name} ajouté au panier.`, variant: 'success'
        }));
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
        this.dispatchEvent(new ShowToastEvent({
            title: 'Panier', message: `${product.name} ajouté au panier.`, variant: 'success'
        }));
    }

    handleToggleFavoriteFromCatalog(event) {
        const product = event.detail && event.detail.product;
        if (product) {
            this._toggleFavoriteById(product.id);
        }
    }

    _pushToCart(product) {
        const existing = this.cart.find(i => i.productId === product.id);
        if (existing) {
            this.cart = this.cart.map(i =>
                i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
            );
        } else {
            this.cart = [...this.cart, {
                ...product,
                itemId:    product.id + '_' + Date.now(),
                productId: product.id,
                unitPrice: product.price,
                imageUrl:  product.image,
                quantity:  1
            }];
        }
        this._saveCart();
    }

    // ── Handlers — Quote modal ────────────────────────────────────────────────
    _resetQuoteForm() {
        this._quoteStep     = 'form';
        this._quoteCompany  = '';
        this._quoteEmail    = '';
        this._quoteQty      = '10';
        this._quoteIndustry = 'Technology';
        this._quoteMessage  = '';
    }
    handleOpenQuoteForm(e) {
        this._quoteProductId = e.currentTarget.dataset.id;
        this._resetQuoteForm();
    }
    handleOpenQuoteFromModal() {
        this._quoteProductId    = this._selectedProductId;
        this._selectedProductId = null;
        this._modalActiveColor  = null;
        this._resetQuoteForm();
    }
    handleCloseQuoteModal()  { this._quoteProductId = null; this._quoteStep = 'form'; }
    handleQuoteCompany(e)    { this._quoteCompany  = e.target.value; }
    handleQuoteEmail(e)      { this._quoteEmail    = e.target.value; }
    handleQuoteQty(e)        { this._quoteQty      = e.target.value; }
    handleQuoteIndustry(e)   { this._quoteIndustry = e.target.value; }
    handleQuoteMessage(e)    { this._quoteMessage  = e.target.value; }
    handleQuoteSubmit()      { this._quoteStep = 'success'; }

    // ── Handlers — Cases ──────────────────────────────────────────────────────
    handlePriority(e)    { this.casePriority = e.currentTarget.dataset.priority; }
    handleNextCaseStep() { this.caseStep = 2; }
    handlePrevCaseStep() { this.caseStep = 1; }

    // ── Handlers — Cart (nexusPortalCart child events) ────────────────────────
    handleNavigateFromCart(e) {
        this.activeTab = e.detail.tab;
        this._pushNavUpdate();
    }

    // ── Handlers — product detail overlay ─────────────────────────────────────
    handleDetailClose() {
        this.detailProduct = null;
    }

    handleDetailAddToCart(event) {
        const product = event.detail && event.detail.product;
        if (product) {
            this._pushToCart({ ...product, price: product.price || product.salePrice });
            this.detailProduct = null;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Panier', message: `${product.name} ajouté au panier.`, variant: 'success'
            }));
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

    _saveCart() {
        try { sessionStorage.setItem(CART_KEY, JSON.stringify(this.cart)); } catch(e) { /* silent */ }
    }
}
