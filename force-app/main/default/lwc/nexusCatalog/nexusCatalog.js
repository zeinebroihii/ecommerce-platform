import { LightningElement, track } from 'lwc';

const MOCK_PRODUCTS = [
    {
        id: 'pc-1',
        name: 'Nexus Pro-Station G1',
        productCode: 'PC-G1',
        family: 'Computing',
        price: 2499,
        rating: 5.0,
        reviews: 156,
        image: 'https://picsum.photos/seed/pc-black/800/800',
        description: 'The ultimate workstation for high-performance computing. Available in three distinct finishes.',
        features: ['RTX 5090 Ready', '128GB DDR5', 'Liquid Cooled'],
        isNew: true,
        isActive: true,
        stockLevel: 12,
        status: 'In Stock',
        specs: { 'CPU': 'Nexus Quantum X1', 'GPU': 'RTX 5090', 'RAM': '128GB' },
        colors: [
            { name: 'Black', hex: '#000000', image: 'https://picsum.photos/seed/pc-black/800/800' },
            { name: 'White', hex: '#ffffff', image: 'https://picsum.photos/seed/pc-white/800/800' },
            { name: 'Gray',  hex: '#64748b', image: 'https://picsum.photos/seed/pc-gray/800/800' }
        ]
    },
    {
        id: '1',
        name: 'Nexus Core Hub v3',
        productCode: 'NX-100',
        family: 'Central Systems',
        price: 1299,
        rating: 4.9,
        reviews: 128,
        image: 'https://picsum.photos/seed/hub/800/800',
        description: 'The ultimate central intelligence unit for your industrial ecosystem. Powered by Nexus Neural Engine.',
        features: ['AI-Driven Optimization', 'Real-time Analytics', 'Quantum Encryption'],
        isActive: true,
        stockLevel: 45,
        status: 'In Stock',
        specs: { 'Processor': 'Nexus N2 Chip', 'Connectivity': '5G / Wi-Fi 7', 'Power': 'Solar-Ready' },
        colors: [
            { name: 'Titanium', hex: '#475569', image: 'https://picsum.photos/seed/hub/800/800' },
            { name: 'Midnight', hex: '#0f172a', image: 'https://picsum.photos/seed/hub-dark/800/800' }
        ]
    },
    {
        id: '2',
        name: 'Neural Sensor Pack',
        productCode: 'NX-200',
        family: 'Sensors',
        price: 499,
        rating: 4.8,
        reviews: 85,
        image: 'https://picsum.photos/seed/sensor/800/800',
        description: 'High-precision environmental sensors with edge-computing capabilities for instant data processing.',
        features: ['Ultra-low Latency', 'Self-Calibrating', 'IP68 Rated'],
        isPopular: true,
        isActive: true,
        stockLevel: 120,
        status: 'In Stock',
        specs: { 'Accuracy': '±0.01%', 'Range': '500m', 'Battery': '5 Years' }
    },
    {
        id: '3',
        name: 'Quantum Link Bridge',
        productCode: 'NX-300',
        family: 'Connectivity',
        price: 899,
        rating: 5.0,
        reviews: 42,
        image: 'https://picsum.photos/seed/bridge/800/800',
        description: 'Seamlessly bridge your legacy systems with the Nexus ecosystem using our quantum-secure gateway.',
        features: ['Legacy Support', 'Zero-Trust Security', 'Auto-Scaling'],
        isActive: true,
        stockLevel: 15,
        status: 'Low Stock',
        specs: { 'Throughput': '100 Gbps', 'Security': 'AES-512', 'Latency': '<1ms' }
    },
    {
        id: '4',
        name: 'Nexus Vision Pro',
        productCode: 'NX-400',
        family: 'Monitoring',
        price: 1599,
        rating: 4.7,
        reviews: 210,
        image: 'https://picsum.photos/seed/vision/800/800',
        description: 'Advanced visual monitoring system with integrated AI for anomaly detection and predictive maintenance.',
        features: ['8K Resolution', 'Night Vision', 'Object Tracking'],
        isNew: true,
        isActive: true,
        stockLevel: 8,
        status: 'Low Stock',
        specs: { 'Resolution': '8K Ultra HD', 'FOV': '180°', 'AI Engine': 'VisionX' }
    },
    {
        id: '5',
        name: 'Eco-Pulse Monitor',
        productCode: 'NX-500',
        family: 'Sustainability',
        price: 299,
        rating: 4.9,
        reviews: 67,
        image: 'https://picsum.photos/seed/pulse/800/800',
        description: 'Track your carbon footprint and energy efficiency in real-time with the Eco-Pulse ecosystem.',
        features: ['CO2 Tracking', 'Energy Insights', 'Auto-Reporting'],
        isPopular: true,
        isActive: true,
        stockLevel: 200,
        status: 'In Stock',
        specs: { 'Precision': 'High', 'Integration': 'Universal', 'Eco-Score': 'A+' }
    },
    {
        id: '6',
        name: 'Nexus Edge Node',
        productCode: 'NX-600',
        family: 'Computing',
        price: 749,
        rating: 4.6,
        reviews: 54,
        image: 'https://picsum.photos/seed/node/800/800',
        description: 'Decentralized computing nodes for distributed intelligence across your entire network.',
        features: ['Edge AI', 'Dynamic Mesh', 'Hot-Swappable'],
        isActive: true,
        stockLevel: 3,
        status: 'Critical',
        specs: { 'RAM': '32GB', 'Storage': '2TB NVMe', 'OS': 'NexusOS' }
    }
];

export default class NexusCatalog extends LightningElement {

    @track selectedFamily = 'All';
    @track selectedColor  = 'All';
    @track searchQuery    = '';
    @track favoritedIds   = [];
    @track showToast      = false;

    // Full-page detail view
    @track detailProduct  = null;

    // Quote form
    @track quoteProduct   = null;
    _quoteData = {};
    _toastTimer;

    /* ─────────────────────────────────────
       DERIVED: filter pills
    ───────────────────────────────────── */
    get familyFilters() {
        const families = ['All', ...Array.from(new Set(MOCK_PRODUCTS.map(p => p.family)))];
        return families.map(f => ({
            value: f,
            label: f,
            cls: this.selectedFamily === f ? 'nc-pill nc-pill--active' : 'nc-pill'
        }));
    }

    get colorFilters() {
        const colors = ['All', ...Array.from(new Set(
            MOCK_PRODUCTS.flatMap(p => (p.colors || []).map(c => c.name))
        ))];
        return colors.map(c => ({
            value: c,
            label: c,
            cls: this.selectedColor === c ? 'nc-pill nc-pill--active' : 'nc-pill'
        }));
    }

    /* ─────────────────────────────────────
       DERIVED: filtered products
    ───────────────────────────────────── */
    get filteredProducts() {
        const q = this.searchQuery.toLowerCase();
        return MOCK_PRODUCTS
            .filter(p => {
                const matchFamily = this.selectedFamily === 'All' || p.family === this.selectedFamily;
                const matchSearch = !q
                    || p.name.toLowerCase().includes(q)
                    || p.description.toLowerCase().includes(q);
                const matchColor = this.selectedColor === 'All'
                    || (p.colors || []).some(c => c.name === this.selectedColor);
                return matchFamily && matchSearch && matchColor;
            })
            .map(p => this._enrichProduct(p, this.selectedColor));
    }

    get hasProducts()      { return this.filteredProducts.length > 0; }
    get isDetailViewOpen() { return !!this.detailProduct; }
    get isQuoteFormOpen()  { return !!this.quoteProduct; }

    /* ─────────────────────────────────────
       HANDLERS: filter bar
    ───────────────────────────────────── */
    handleFamilyChange(event) {
        this.selectedFamily = event.currentTarget.dataset.value;
    }

    handleColorChange(event) {
        this.selectedColor = event.currentTarget.dataset.value;
    }

    handleSearch(event) {
        this.searchQuery = event.target.value;
    }

    /* ─────────────────────────────────────
       HANDLERS: hero buttons
    ───────────────────────────────────── */
    handleNewArrivals() {
        this.selectedFamily = 'All';
        this.searchQuery    = '';
        this.selectedColor  = 'All';
    }

    handleViewSpecs() { /* no-op */ }

    /* ─────────────────────────────────────
       HANDLERS: c-nexus-card events
    ───────────────────────────────────── */

    // Called by onviewdetails from c-nexus-card — opens full-page detail view
    handleViewProduct(event) {
        const id = event.detail && event.detail.product
            ? event.detail.product.id
            : event.currentTarget && event.currentTarget.dataset.id;
        const product = MOCK_PRODUCTS.find(p => p.id === id) || null;
        if (product) {
            this.detailProduct = product;
        }
    }

    // Called by ontogglefavorite from c-nexus-card
    handleToggleFavorite(event) {
        const id = event.detail && event.detail.product
            ? event.detail.product.id
            : event.currentTarget.dataset.id;
        this._toggleFav(id);
    }

    // Called by onaddtocart from c-nexus-card
    handleAddToCart(event) {
        const product = event.detail && event.detail.product
            ? event.detail.product
            : MOCK_PRODUCTS.find(p => p.id === event.currentTarget.dataset.id);
        if (product) this._dispatchCart(product);
    }

    /* ─────────────────────────────────────
       HANDLERS: c-nexus-product-detail-view events
    ───────────────────────────────────── */
    handleDetailClose() {
        this.detailProduct = null;
    }

    handleDetailAddToCart(event) {
        const product = event.detail && event.detail.product;
        if (product) this._dispatchCart(product);
    }

    handleDetailToggleFavorite(event) {
        const product = event.detail && event.detail.product;
        if (product) this._toggleFav(product.id);
    }

    /* ─────────────────────────────────────
       HANDLERS: quote form (from catalog grid)
    ───────────────────────────────────── */
    handleQuoteRequest(event) {
        const id = event.detail && event.detail.product
            ? event.detail.product.id
            : event.currentTarget.dataset.id;
        const product = MOCK_PRODUCTS.find(p => p.id === id);
        if (product) {
            this.detailProduct = null;
            this.quoteProduct  = product;
            this._quoteData    = {};
        }
    }

    handleQuoteBackdropClick(event) {
        if (event.target === event.currentTarget) {
            this.quoteProduct = null;
        }
    }

    handleModalContentClick(event) {
        event.stopPropagation();
    }

    handleQuoteFieldChange(event) {
        const field = event.currentTarget.dataset.field;
        this._quoteData[field] = event.target.value;
    }

    handleQuoteSubmit() {
        console.log('Quote Request Submitted:', this._quoteData);
        this.quoteProduct = null;
        this._showToast();
    }

    handleQuoteFormClose() {
        this.quoteProduct = null;
    }

    /* ─────────────────────────────────────
       HELPERS
    ───────────────────────────────────── */
    _enrichProduct(p, colorFilter) {
        const isFav = this.favoritedIds.includes(p.id);

        const matchedColor = colorFilter !== 'All'
            ? (p.colors || []).find(c => c.name === colorFilter)
            : null;
        const displayImage = matchedColor
            ? matchedColor.image
            : (p.colors && p.colors.length > 0 ? p.colors[0].image : p.image);

        return {
            ...p,
            displayImage,
            priceFormatted: '$' + p.price.toLocaleString(),
            isFav,
            favCls:  isFav ? 'nc-fav-btn nc-fav-btn--active' : 'nc-fav-btn',
            favFill: isFav ? 'currentColor' : 'none'
        };
    }

    _toggleFav(id) {
        this.favoritedIds = this.favoritedIds.includes(id)
            ? this.favoritedIds.filter(fid => fid !== id)
            : [...this.favoritedIds, id];
    }

    _dispatchCart(product) {
        this.dispatchEvent(new CustomEvent('addtocart', {
            detail: { product }, bubbles: true, composed: true
        }));
        this._showToast();
    }

    _showToast() {
        this.showToast = true;
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => { this.showToast = false; }, 2500);
    }
}