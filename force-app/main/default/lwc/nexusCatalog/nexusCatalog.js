import { LightningElement, track } from 'lwc';

const CATEGORIES = [
    {
        id: 'computing', name: 'Computing', iconName: 'utility:cpu_spec',
        subcategories: [
            { id: 'workstations', name: 'Workstations' },
            { id: 'edge-nodes',   name: 'Edge Nodes'   },
            { id: 'quantum',      name: 'Quantum Computing' }
        ]
    },
    {
        id: 'connectivity', name: 'Connectivity', iconName: 'utility:connected_apps',
        subcategories: [
            { id: 'hubs',     name: 'Hubs & Gateways' },
            { id: 'bridges',  name: 'Bridges'          },
            { id: 'wireless', name: 'Wireless Modules' }
        ]
    },
    {
        id: 'sensors', name: 'Sensors & Monitoring', iconName: 'utility:preview',
        subcategories: [
            { id: 'environmental', name: 'Environmental'    },
            { id: 'visual',        name: 'Visual Monitoring'},
            { id: 'neural',        name: 'Neural Sensors'   }
        ]
    },
    {
        id: 'sustainability', name: 'Sustainability', iconName: 'utility:world',
        subcategories: [
            { id: 'energy', name: 'Energy Monitoring' },
            { id: 'carbon', name: 'Carbon Tracking'   }
        ]
    }
];

const MOCK_PRODUCTS = [
    {
        id: 'ups-1',
        name: 'CyberPower CP1500PFCLCD PFC Sinewave UPS Systems',
        productCode: 'CP1500PFCLCD',
        family: 'Power Protection',
        category: 'computing',
        subcategory: 'workstations',
        brand: 'CyberPower',
        price: 299,
        rating: 4.8,
        reviews: 748,
        image: 'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=600&h=600&fit=crop',
        description: 'A rock-solid performer — can keep a gaming rig up even under full load.',
        features: ['1500VA / 1000W', 'Pure Sinewave', 'LCD Display'],
        isNew: false,
        isActive: true,
        stockLevel: 12,
        status: 'En stock'
    },
    {
        id: 'gpu-1',
        name: 'NVIDIA RTX PRO 6000 Blackwell Workstation Edition Graphic Card',
        productCode: 'RTX-6000-BW',
        family: 'Graphics',
        category: 'computing',
        subcategory: 'workstations',
        brand: 'NVIDIA',
        price: 13559,
        rating: 5.0,
        reviews: 9,
        image: 'https://images.unsplash.com/photo-1587831991378-5cb1e2756591?w=600&h=600&fit=crop',
        description: 'Good packaging from Newegg. Obviously it performs quite well.',
        features: ['Blackwell Architecture', '48GB GDDR7', 'ECC Memory'],
        isNew: true,
        isActive: true,
        stockLevel: 5,
        status: 'En stock'
    },
    {
        id: 'nas-1',
        name: 'Synology 2-bay DiskStation DS725+ (Diskless)',
        productCode: 'DS725+',
        family: 'Storage',
        category: 'computing',
        subcategory: 'edge-nodes',
        brand: 'Synology',
        price: 759,
        rating: 4.9,
        reviews: 3,
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=600&fit=crop',
        description: 'As of DSM 7.3 you can now use any name brand drive again. No issues with old Seagate Red drives.',
        features: ['Dual Core CPU', 'NVMe Support', '2.5GbE Port'],
        isActive: true,
        stockLevel: 8,
        status: 'En stock'
    },
    {
        id: 'gpu-2',
        name: 'PNY NVIDIA RTX PRO 6000 Blackwell Max-Q 96GB GDDR7 with ECC AI',
        productCode: 'RTX-6000-96G',
        family: 'Graphics',
        category: 'computing',
        subcategory: 'workstations',
        brand: 'PNY',
        price: 13424,
        rating: 5.0,
        reviews: 1,
        image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=600&fit=crop',
        description: '96GB of VRAM and energy efficient. Perfect for large scale AI training and simulations.',
        features: ['96GB VRAM', 'ECC Support', 'AI Optimized'],
        isNew: true,
        isActive: true,
        stockLevel: 2,
        status: 'En arrivage'
    },
    {
        id: 'nas-2',
        name: 'Synology 8-bay DiskStation DS1825+ (Diskless)',
        productCode: 'DS1825+',
        family: 'Storage',
        category: 'computing',
        subcategory: 'edge-nodes',
        brand: 'Synology',
        price: 1299,
        rating: 4.8,
        reviews: 4,
        image: 'https://images.unsplash.com/photo-1600267185393-e158a98703de?w=600&h=600&fit=crop',
        description: 'High-capacity storage solution for business environments. Scalable and reliable.',
        features: ['8-Bay', 'Expandable', 'DSM OS'],
        isActive: true,
        stockLevel: 3,
        status: 'En stock'
    },
    {
        id: 'switch-1',
        name: 'TP-Link TL-SG108-M2 | 8 Port Multi-Gigabit Unmanaged Network Switch',
        productCode: 'TL-SG108-M2',
        family: 'Networking',
        category: 'connectivity',
        subcategory: 'hubs',
        brand: 'TP-Link',
        price: 199,
        rating: 4.7,
        reviews: 5,
        image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&h=600&fit=crop',
        description: 'Plug and play, no configuration required. Fanless and quiet.',
        features: ['2.5G Ports', 'Fanless', 'Metal Casing'],
        isActive: true,
        stockLevel: 45,
        status: 'En stock'
    }
];

const ALL_STATUSES = ['En stock', 'En arrivage', 'Epuisé', 'Sur commande 48h'];

export default class NexusCatalog extends LightningElement {

    @track selectedCategory    = null;
    @track selectedSubcategory = null;
    @track expandedCategories  = [];
    @track searchQuery         = '';
    @track viewMode            = 'grid';
    @track priceMax            = 20000;
    @track sortBy              = 'rating';
    @track statusFilter        = [];
    @track brandFilter         = [];
    @track favoritedIds        = [];
    @track detailProduct       = null;
    @track showToast           = false;
    _toastTimer;

    // ── Sidebar: categories ──────────────────────────────────────────────────

    get categoriesEnriched() {
        return CATEGORIES.map(cat => ({
            ...cat,
            isExpanded : this.expandedCategories.includes(cat.id),
            isSelected : this.selectedCategory === cat.id,
            btnClass   : this.selectedCategory === cat.id
                ? 'nc2-cat-btn nc2-cat-btn--active'
                : 'nc2-cat-btn',
            iconWrapClass: this.selectedCategory === cat.id
                ? 'nc2-cat-icon nc2-cat-icon--active'
                : 'nc2-cat-icon',
            subcategories: cat.subcategories.map(sub => ({
                ...sub,
                isSelected: this.selectedSubcategory === sub.id,
                btnClass  : this.selectedSubcategory === sub.id
                    ? 'nc2-sub-btn nc2-sub-btn--active'
                    : 'nc2-sub-btn',
                dotClass  : this.selectedSubcategory === sub.id
                    ? 'nc2-sub-dot nc2-sub-dot--active'
                    : 'nc2-sub-dot'
            }))
        }));
    }

    get allBtnClass() {
        return !this.selectedCategory ? 'nc2-cat-btn nc2-cat-btn--active' : 'nc2-cat-btn';
    }

    // ── Sidebar: availability filter ────────────────────────────────────────

    get availabilityItems() {
        return ALL_STATUSES.map(status => ({
            status,
            isChecked : this.statusFilter.includes(status),
            count     : MOCK_PRODUCTS.filter(p => p.status === status).length,
            checkClass: this.statusFilter.includes(status)
                ? 'nc2-check nc2-check--active'
                : 'nc2-check',
            labelClass: this.statusFilter.includes(status)
                ? 'nc2-filter-label-text nc2-filter-label-text--active'
                : 'nc2-filter-label-text'
        }));
    }

    get hasStatusFilters() { return this.statusFilter.length > 0; }

    // ── Sidebar: brand filter ────────────────────────────────────────────────

    get brandItems() {
        const brands = [...new Set(MOCK_PRODUCTS.map(p => p.brand).filter(Boolean))];
        return brands.map(brand => ({
            brand,
            isChecked : this.brandFilter.includes(brand),
            count     : MOCK_PRODUCTS.filter(p => p.brand === brand).length,
            checkClass: this.brandFilter.includes(brand)
                ? 'nc2-check nc2-check--active'
                : 'nc2-check',
            labelClass: this.brandFilter.includes(brand)
                ? 'nc2-filter-label-text nc2-filter-label-text--active'
                : 'nc2-filter-label-text'
        }));
    }

    get hasBrandFilters() { return this.brandFilter.length > 0; }

    // ── Main panel: derived ──────────────────────────────────────────────────

    get filteredProducts() {
        const q = this.searchQuery.toLowerCase();
        return MOCK_PRODUCTS
            .filter(p => {
                if (this.selectedCategory    && p.category    !== this.selectedCategory)    return false;
                if (this.selectedSubcategory && p.subcategory !== this.selectedSubcategory) return false;
                if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.productCode.toLowerCase().includes(q)) return false;
                if (p.price > this.priceMax) return false;
                if (this.statusFilter.length > 0 && !this.statusFilter.includes(p.status)) return false;
                if (this.brandFilter.length  > 0 && !this.brandFilter.includes(p.brand))  return false;
                return true;
            })
            .sort((a, b) => {
                if (this.sortBy === 'price-asc')  return a.price - b.price;
                if (this.sortBy === 'price-desc') return b.price - a.price;
                return (b.rating || 0) - (a.rating || 0);
            })
            .map((p, idx) => {
                const isFav = this.favoritedIds.includes(p.id);
                return {
                    ...p,
                    indexNum      : idx + 1,
                    priceFormatted: '$' + p.price.toLocaleString(),
                    isFav,
                    favBtnClass   : isFav ? 'nc2-card-fav nc2-card-fav--active' : 'nc2-card-fav',
                    cardClass     : 'nc2-product-card',
                    stars         : [1,2,3,4,5].map(n => ({
                        n,
                        cls: n <= Math.floor(p.rating || 0) ? 'nc2-star nc2-star--filled' : 'nc2-star'
                    }))
                };
            });
    }

    get hasProducts()      { return this.filteredProducts.length > 0; }
    get filteredCount()    { return this.filteredProducts.length;       }
    get isGridMode()       { return this.viewMode === 'grid';           }
    get gridClass()        { return this.viewMode === 'grid' ? 'nc2-grid nc2-grid--grid' : 'nc2-grid nc2-grid--list'; }
    get gridBtnClass()     { return this.viewMode === 'grid' ? 'nc2-view-btn nc2-view-btn--active' : 'nc2-view-btn'; }
    get listBtnClass()     { return this.viewMode === 'list' ? 'nc2-view-btn nc2-view-btn--active' : 'nc2-view-btn'; }

    // ── Active filter pills ──────────────────────────────────────────────────

    get hasActiveFilters() {
        return !!(this.selectedCategory || this.selectedSubcategory || this.searchQuery ||
                  this.statusFilter.length || this.brandFilter.length || this.priceMax < 20000);
    }

    get activeFilterPills() {
        const pills = [];
        if (this.selectedCategory) {
            const cat = CATEGORIES.find(c => c.id === this.selectedCategory);
            pills.push({ id: 'cat', label: cat ? cat.name : this.selectedCategory, filterType: 'category', value: this.selectedCategory });
        }
        if (this.selectedSubcategory) {
            const cat = CATEGORIES.find(c => c.id === this.selectedCategory);
            const sub = cat && cat.subcategories.find(s => s.id === this.selectedSubcategory);
            pills.push({ id: 'sub', label: sub ? sub.name : this.selectedSubcategory, filterType: 'subcategory', value: this.selectedSubcategory });
        }
        if (this.searchQuery) {
            pills.push({ id: 'search', label: 'Search: ' + this.searchQuery, filterType: 'search', value: '' });
        }
        this.statusFilter.forEach(s => pills.push({ id: 'status-' + s, label: s, filterType: 'status', value: s }));
        this.brandFilter.forEach(b  => pills.push({ id: 'brand-'  + b, label: b, filterType: 'brand',  value: b }));
        return pills;
    }

    // ── Breadcrumb ───────────────────────────────────────────────────────────

    get breadcrumbCategory() {
        if (!this.selectedCategory) return null;
        return CATEGORIES.find(c => c.id === this.selectedCategory) || null;
    }

    get breadcrumbSubcategory() {
        if (!this.selectedSubcategory || !this.breadcrumbCategory) return null;
        return this.breadcrumbCategory.subcategories.find(s => s.id === this.selectedSubcategory) || null;
    }

    get showBreadcrumbCategory()    { return !!this.selectedCategory;    }
    get showBreadcrumbSubcategory() { return !!this.selectedSubcategory; }
    get breadcrumbAllClass()  { return this.selectedCategory ? 'nc2-bc-item' : 'nc2-bc-item nc2-bc-item--active'; }

    get isDetailViewOpen()  { return !!this.detailProduct; }
    get allProductsList()   { return MOCK_PRODUCTS; }

    // ── Handlers: sidebar ────────────────────────────────────────────────────

    handleSelectAll() {
        this.selectedCategory    = null;
        this.selectedSubcategory = null;
    }

    handleToggleCategory(event) {
        const id = event.currentTarget.dataset.id;
        this.selectedCategory    = id;
        this.selectedSubcategory = null;
        this.expandedCategories  = this.expandedCategories.includes(id)
            ? this.expandedCategories.filter(c => c !== id)
            : [...this.expandedCategories, id];
    }

    handleSelectSubcategory(event) {
        this.selectedCategory    = event.currentTarget.dataset.category;
        this.selectedSubcategory = event.currentTarget.dataset.sub;
    }

    handleToggleStatus(event) {
        const s = event.currentTarget.dataset.status;
        this.statusFilter = this.statusFilter.includes(s)
            ? this.statusFilter.filter(x => x !== s)
            : [...this.statusFilter, s];
    }

    handleClearStatus() { this.statusFilter = []; }

    handleToggleBrand(event) {
        const b = event.currentTarget.dataset.brand;
        this.brandFilter = this.brandFilter.includes(b)
            ? this.brandFilter.filter(x => x !== b)
            : [...this.brandFilter, b];
    }

    handleClearBrand() { this.brandFilter = []; }

    handlePriceChange(event) {
        this.priceMax = parseInt(event.target.value, 10);
    }

    handleResetFilters() {
        this.selectedCategory    = null;
        this.selectedSubcategory = null;
        this.searchQuery         = '';
        this.priceMax            = 20000;
        this.statusFilter        = [];
        this.brandFilter         = [];
    }

    // ── Handlers: toolbar ────────────────────────────────────────────────────

    handleSearch(event)     { this.searchQuery = event.target.value; }
    handleSortChange(event) { this.sortBy = event.target.value;       }
    handleViewGrid()        { this.viewMode = 'grid'; }
    handleViewList()        { this.viewMode = 'list'; }

    // ── Handlers: filter pills ───────────────────────────────────────────────

    handleRemoveFilter(event) {
        const type  = event.currentTarget.dataset.type;
        const value = event.currentTarget.dataset.value;
        if (type === 'category')    { this.selectedCategory = null; this.selectedSubcategory = null; }
        if (type === 'subcategory') { this.selectedSubcategory = null; }
        if (type === 'search')      { this.searchQuery = ''; }
        if (type === 'status')      { this.statusFilter = this.statusFilter.filter(s => s !== value); }
        if (type === 'brand')       { this.brandFilter  = this.brandFilter.filter(b => b !== value);  }
    }

    handleClearAllFilters() { this.handleResetFilters(); }

    // ── Handlers: product cards ──────────────────────────────────────────────

    handleViewProduct(event) {
        const id = event.currentTarget.dataset.id;
        this.detailProduct = MOCK_PRODUCTS.find(p => p.id === id) || null;
        if (this.detailProduct) document.dispatchEvent(new CustomEvent('nexusproductdetailopen'));
    }

    handleToggleFavorite(event) {
        const id = event.currentTarget.dataset.id;
        event.stopPropagation();
        this.favoritedIds = this.favoritedIds.includes(id)
            ? this.favoritedIds.filter(fid => fid !== id)
            : [...this.favoritedIds, id];
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        const product = MOCK_PRODUCTS.find(p => p.id === id);
        if (product) {
            this.dispatchEvent(new CustomEvent('addtocart', { detail: { product }, bubbles: true, composed: true }));
            this._showToast();
        }
    }

    handleDetailClose()  {
        this.detailProduct = null;
        document.dispatchEvent(new CustomEvent('nexusproductdetailclose'));
    }

    handleSimilarProductView(event) {
        const product = event.detail && event.detail.product;
        if (product) {
            this.detailProduct = null;
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setTimeout(() => {
                this.detailProduct = product;
                document.dispatchEvent(new CustomEvent('nexusproductdetailopen'));
            }, 0);
        }
    }
    handleDetailAddToCart(event)  {
        if (event.detail && event.detail.product) this._showToast();
    }
    handleDetailToggleFavorite(event) {
        if (event.detail && event.detail.product) {
            const id = event.detail.product.id;
            this.favoritedIds = this.favoritedIds.includes(id)
                ? this.favoritedIds.filter(fid => fid !== id)
                : [...this.favoritedIds, id];
        }
    }

    _showToast() {
        this.showToast = true;
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => { this.showToast = false; }, 2500);
    }
}
