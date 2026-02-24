import { LightningElement, wire, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { publish, MessageContext } from 'lightning/messageService';
import CART_CHANNEL from '@salesforce/messageChannel/CartChannel__c';
import getProducts from '@salesforce/apex/ProductController.getProductsWithStock';
import userId from '@salesforce/user/Id';

const CART_KEY = 'ecomm_cart';

export default class ProductCatalog extends NavigationMixin(LightningElement) {

    // Set this in Experience Builder to your login page URL
    @api loginUrl = '/shop/s/login';

    @track searchTerm      = '';
    @track selectedCategory = '';
    @track addedProductId   = null; // for "✓ Added" visual feedback

    @wire(MessageContext)
    messageContext;

    @wire(getProducts, { searchTerm: '$searchTerm', category: '$selectedCategory' })
    products;

    // ── Getters ──────────────────────────────────────────────────────────────

    get isGuest() {
        return !userId;
    }

    get categoryOptions() {
        return [
            { label: 'All',         value: '' },
            { label: 'Computers',   value: 'Computers' },
            { label: 'Accessories', value: 'Accessories' },
            { label: 'Networking',  value: 'Networking' }
        ];
    }

    get filteredProducts() {
        if (!this.products.data) return [];
        return this.products.data.map(p => {
            const qty = p.quantityAvailable ?? 0;
            return {
                ...p,
                Id:              p.productId,
                Name:            p.name,
                Description:     p.description,
                Family:          p.family,
                unitPrice:       p.unitPrice ?? 0,
                imageUrl:        p.imageUrl || null,
                stockStatus:     this._stockStatus(qty),
                stockBadgeClass: this._stockBadgeClass(qty),
                isOutOfStock:    p.isOutOfStock ?? true,
                isJustAdded:     p.productId === this.addedProductId
            };
        });
    }

    // ── Handlers ─────────────────────────────────────────────────────────────

    handleSearch(event) {
        this.searchTerm = event.target.value;
    }

    handleCategoryChange(event) {
        this.selectedCategory = event.detail.value;
    }

    handleAddToCart(event) {
        const productId = event.target.dataset.productId;
        const product   = this.filteredProducts.find(p => p.Id === productId);
        if (!product) return;

        // ── Guest: redirect to login ─────────────────────────────────────────
        if (this.isGuest) {
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: { url: this.loginUrl }
            });
            return;
        }

        // ── Logged-in: write directly to sessionStorage (works cross-page) ──
        const stored    = sessionStorage.getItem(CART_KEY);
        const cartItems = stored ? JSON.parse(stored) : [];
        const idx       = cartItems.findIndex(i => i.productId === productId);

        if (idx > -1) {
            cartItems[idx].quantity += 1;
            cartItems[idx].subtotal  = (cartItems[idx].quantity * cartItems[idx].unitPrice).toFixed(2);
        } else {
            cartItems.push({
                productId:   product.Id,
                productName: product.Name,
                unitPrice:   product.unitPrice,
                quantity:    1,
                subtotal:    product.unitPrice.toFixed(2)
            });
        }
        sessionStorage.setItem(CART_KEY, JSON.stringify(cartItems));

        // Also publish to CartChannel (if shoppingCart is on the same page)
        publish(this.messageContext, CART_CHANNEL, {
            productId:   product.Id,
            productName: product.Name,
            unitPrice:   product.unitPrice,
            quantity:    1
        });

        // Visual "✓ Added!" feedback for 1.5 s
        this.addedProductId = productId;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => { this.addedProductId = null; }, 1500);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    _stockStatus(qty) {
        if (qty === 0) return 'Out of Stock';
        if (qty < 10)  return 'Low Stock';
        return 'In Stock';
    }

    _stockBadgeClass(qty) {
        if (qty === 0) return 'badge badge-red';
        if (qty < 10)  return 'badge badge-orange';
        return 'badge badge-green';
    }
}
