import { LightningElement, track, wire } from 'lwc';
import getProductsWithStock from '@salesforce/apex/ProductController.getProductsWithStock';

const CART_KEY = 'ecomm_cart';

const CATEGORIES = [
    { id: '',           label: 'Tous'       },
    { id: 'Hardware',   label: 'Hardware'   },
    { id: 'Networking', label: 'Networking' },
    { id: 'IoT',        label: 'IoT'        },
];

export default class NexusPortalCatalog extends LightningElement {

    @track wireCategory = '';
    @track wireSearch   = '';
    @track showToast    = false;
    @track toastName    = '';

    // ── wire ─────────────────────────────────────────────────────
    @wire(getProductsWithStock, { searchTerm: '$wireSearch', category: '$wireCategory' })
    wiredProducts;

    // ── getters ──────────────────────────────────────────────────
    get products() {
        return (this.wiredProducts && this.wiredProducts.data)
            ? this.wiredProducts.data
            : [];
    }

    get hasProducts() {
        return this.products.length > 0;
    }

    get categoryTabs() {
        return CATEGORIES.map(c => ({
            ...c,
            btnClass: 'npcal-cat-btn' +
                (this.wireCategory === c.id ? ' npcal-cat-btn--active' : '')
        }));
    }

    // ── handlers ─────────────────────────────────────────────────
    handleCategoryChange(evt) {
        this.wireCategory = evt.currentTarget.dataset.id;
    }

    handleSearch(evt) {
        this.wireSearch = evt.target.value;
    }

    handleResetFilters() {
        this.wireCategory = '';
        this.wireSearch   = '';
        const input = this.template.querySelector('.npcal-search');
        if (input) input.value = '';
    }

    handleAddToCart(evt) {
        const { productId, productName, productDescription, imageUrl, unitPrice } = evt.detail;

        let cart = [];
        try {
            const raw = sessionStorage.getItem(CART_KEY);
            cart = raw ? JSON.parse(raw) : [];
        } catch (e) { /* ignore */ }

        const existing = cart.find(i => i.productId === productId);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                itemId:      productId + '_' + Date.now(),
                productId,
                name:        productName,
                description: productDescription,
                imageUrl,
                unitPrice,
                quantity:    1
            });
        }

        try { sessionStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* quota */ }

        // Show toast
        this.toastName = productName;
        this.showToast = true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => { this.showToast = false; }, 3000);
    }

    handleViewDetails(evt) {
        // Bubble up so parent portal can handle navigation
        this.dispatchEvent(new CustomEvent('viewproduct', {
            bubbles: true,
            detail: { productId: evt.detail.productId }
        }));
    }

    handleGoCart() {
        this.showToast = false;
        this.dispatchEvent(new CustomEvent('navigate', {
            bubbles: true,
            detail: { tab: 'cart' }
        }));
    }
}
