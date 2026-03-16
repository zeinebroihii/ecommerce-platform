import { LightningElement, api, track } from 'lwc';

const MOCK_PRODUCTS = [
    {
        id: 'pc-1', name: 'Nexus Pro-Station G1', productCode: 'PC-G1',
        family: 'Computing', price: 2499, rating: 5.0,
        image: 'https://picsum.photos/seed/pc-black/800/800',
        description: 'The ultimate workstation for high-performance computing. Available in three distinct finishes.',
        features: ['RTX 5090 Ready', '128GB DDR5', 'Liquid Cooled'],
        isNew: true,
        colors: [
            { name: 'Black', hex: '#000000', image: 'https://picsum.photos/seed/pc-black/800/800' },
            { name: 'White', hex: '#ffffff', image: 'https://picsum.photos/seed/pc-white/800/800' },
            { name: 'Gray',  hex: '#64748b', image: 'https://picsum.photos/seed/pc-gray/800/800' }
        ]
    },
    {
        id: '1', name: 'Nexus Core Hub v3', productCode: 'NX-100',
        family: 'Central Systems', price: 1299, rating: 4.9,
        image: 'https://picsum.photos/seed/hub/800/800',
        description: 'The ultimate central intelligence unit for your industrial ecosystem. Powered by Nexus Neural Engine.',
        features: ['AI-Driven Optimization', 'Real-time Analytics', 'Quantum Encryption'],
        colors: [
            { name: 'Titanium', hex: '#475569', image: 'https://picsum.photos/seed/hub/800/800' },
            { name: 'Midnight', hex: '#0f172a', image: 'https://picsum.photos/seed/hub-dark/800/800' }
        ]
    },
    {
        id: '2', name: 'Neural Sensor Pack', productCode: 'NX-200',
        family: 'Sensors', price: 499, rating: 4.8,
        image: 'https://picsum.photos/seed/sensor/800/800',
        description: 'High-precision environmental sensors with edge-computing capabilities for instant data processing.',
        features: ['Ultra-low Latency', 'Self-Calibrating', 'IP68 Rated'],
        isPopular: true
    },
    {
        id: '3', name: 'Quantum Link Bridge', productCode: 'NX-300',
        family: 'Connectivity', price: 899, rating: 5.0,
        image: 'https://picsum.photos/seed/bridge/800/800',
        description: 'Seamlessly bridge your legacy systems with the Nexus ecosystem using our quantum-secure gateway.',
        features: ['Legacy Support', 'Zero-Trust Security', 'Auto-Scaling']
    },
    {
        id: '4', name: 'Nexus Vision Pro', productCode: 'NX-400',
        family: 'Monitoring', price: 1599, rating: 4.7,
        image: 'https://picsum.photos/seed/vision/800/800',
        description: 'Advanced visual monitoring system with integrated AI for anomaly detection and predictive maintenance.',
        features: ['8K Resolution', 'Night Vision', 'Object Tracking'],
        isNew: true
    },
    {
        id: '5', name: 'Eco-Pulse Monitor', productCode: 'NX-500',
        family: 'Sustainability', price: 299, rating: 4.9,
        image: 'https://picsum.photos/seed/pulse/800/800',
        description: 'Track your carbon footprint and energy efficiency in real-time with the Eco-Pulse ecosystem.',
        features: ['CO2 Tracking', 'Energy Insights', 'Auto-Reporting'],
        isPopular: true
    },
    {
        id: '6', name: 'Nexus Edge Node', productCode: 'NX-600',
        family: 'Computing', price: 749, rating: 4.6,
        image: 'https://picsum.photos/seed/node/800/800',
        description: 'Decentralized computing nodes for distributed intelligence across your entire network.',
        features: ['Edge AI', 'Dynamic Mesh', 'Hot-Swappable']
    }
];

export default class NexusLoginView extends LightningElement {

    @api pageWidth    = '100%';
    @api pageMaxWidth = '100%';
    @api pagePadding  = '0';

    @track selectedFamily  = 'All';
    @track selectedProduct = null;
    @track quoteProduct    = null;
    @track favoritedIds    = [];
    @track authOpen        = false;
    @track authMode        = 'login';

    // ── Listen for navbar Login button (document event bridge) ───────────────
    connectedCallback() {
        this._openAuthHandler = (e) => {
            this.authMode = (e.detail && e.detail.mode) || 'login';
            this.authOpen = true;
        };
        document.addEventListener('nexusopenauth', this._openAuthHandler);
    }

    disconnectedCallback() {
        document.removeEventListener('nexusopenauth', this._openAuthHandler);
    }

    get pageStyle() {
        return `width:${this.pageWidth};max-width:${this.pageMaxWidth};padding:${this.pagePadding};margin:0 auto;box-sizing:border-box;`;
    }

    get familyFilters() {
        const families = ['All', ...new Set(MOCK_PRODUCTS.map(p => p.family))];
        return families.map(f => ({
            family: f, label: f,
            cls: f === this.selectedFamily ? 'nlv-family-pill nlv-family-pill--active' : 'nlv-family-pill'
        }));
    }

    get filteredProducts() {
        const list = this.selectedFamily === 'All'
            ? MOCK_PRODUCTS
            : MOCK_PRODUCTS.filter(p => p.family === this.selectedFamily);
        return list.map(p => {
            const isFav = this.favoritedIds.includes(p.id);
            return {
                ...p,
                priceFormatted: `$${p.price}`,
                favCls:  isFav ? 'nlv-pcard2-heart nlv-pcard2-heart--active' : 'nlv-pcard2-heart',
                favFill: isFav ? 'currentColor' : 'none'
            };
        });
    }

    get hasProducts()         { return this.filteredProducts.length > 0; }
    get isQuoteFormOpen()     { return !!this.quoteProduct; }
    get favoritedProducts()   { return MOCK_PRODUCTS.filter(p => this.favoritedIds.includes(p.id)); }
    get allProducts()         { return MOCK_PRODUCTS; }
    get isSelectedFavorited() {
        return this.selectedProduct ? this.favoritedIds.includes(this.selectedProduct.id) : false;
    }

    /* ── Hero scroll ── */
    handleScrollProducts() {
        const el = this.template.querySelector('[id="products-section"]');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    /* ── Filters ── */
    handleFamilyFilter(event) {
        this.selectedFamily = event.currentTarget.dataset.family;
    }

    /* ── Card interactions ── */
    handleProductClick(event) {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        this.selectedProduct = MOCK_PRODUCTS.find(p => p.id === id) || null;
    }

    handleToggleFavorite(event) {
        event.stopPropagation();
        this._toggleFav(event.currentTarget.dataset.id);
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const product = MOCK_PRODUCTS.find(p => p.id === event.currentTarget.dataset.id);
        if (product) this._addToCart(product);
    }

    handleQuoteRequest(event) {
        const product = (event.detail && event.detail.product)
            ? event.detail.product
            : MOCK_PRODUCTS.find(p => p.id === event.currentTarget.dataset.id);
        if (product) {
            this.selectedProduct = null;
            this.quoteProduct = product;
        }
    }

    /* ── Modal ── */
    handleModalClose()  { this.selectedProduct = null; }

    handleDetailViewProduct(event) {
        const product = event.detail && event.detail.product;
        if (product) this.selectedProduct = product;
    }

    handleDetailRequireAuth(event) {
        this.selectedProduct = null;
        this.authMode = (event.detail && event.detail.mode) || 'signup-select';
        this.authOpen = true;
    }

    handleDetailQuoteRequest(event) {
        this.selectedProduct = null;
        this.authMode = 'signup-select';
        this.authOpen = true;
    }

    handleModalAddToCart(event) {
        const product = event.detail && event.detail.product;
        if (product) this._addToCart(product);
        this.selectedProduct = null;
    }

    handleModalToggleFavorite(event) {
        const product = event.detail && event.detail.product;
        if (product) this._toggleFav(product.id);
    }

    /* ── Deals section ── */
    handleDealsAddToCart() {
        this.authMode = 'signup-select';
        this.authOpen = true;
    }

    handleDealsViewDetails(event) {
        const product = event.detail && event.detail.product;
        if (product) this.selectedProduct = product;
    }

    /* ── Quote form ── */
    handleQuoteFormClose() { this.quoteProduct = null; }

    /* ── Auth ── opens modal directly on this page */
    handleB2BLogin()    { this.authMode = 'login';         this.authOpen = true; }
    handleB2BRegister() { this.authMode = 'signup-select'; this.authOpen = true; }
    handleB2CLogin()    { this.authMode = 'login';         this.authOpen = true; }
    handleB2CRegister() { this.authMode = 'signup-select'; this.authOpen = true; }
    handleAuthClose()   { this.authOpen = false; }

    /* ── Helpers ── */
    _toggleFav(id) {
        if (this.favoritedIds.includes(id)) {
            this.favoritedIds = this.favoritedIds.filter(f => f !== id);
        } else {
            this.favoritedIds = [...this.favoritedIds, id];
        }
        if (this.selectedProduct && this.selectedProduct.id === id) {
            this.selectedProduct = { ...this.selectedProduct };
        }
    }

    _addToCart(product) {
        this.dispatchEvent(new CustomEvent('addtocart', { detail: { product } }));
    }
}
