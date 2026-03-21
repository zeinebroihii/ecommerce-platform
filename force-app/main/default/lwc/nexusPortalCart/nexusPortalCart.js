import { LightningElement, api, track } from 'lwc';

const CART_KEY = 'ecomm_cart';

export default class NexusPortalCart extends LightningElement {

    @api sparksBalance = 1250;
    @track cartItems = [];
    @track showQuoteModal      = false;
    @track isGeneratingQuote   = false;
    @track showQuoteResult     = false;
    @track quoteDiscount       = 0;
    @track quoteProbability    = 0;

    // ── lifecycle ──────────────────────────────────────────────────
    connectedCallback() {
        this._loadCart();
    }

    // ── getters ────────────────────────────────────────────────────
    get hasItems() {
        return this.cartItems.length > 0;
    }

    get itemCount() {
        return this.cartItems.reduce((sum, i) => sum + i.quantity, 0);
    }

    get itemCountLabel() {
        const n = this.itemCount;
        return n === 1 ? '1 Item' : `${n} Items`;
    }

    get subtotal() {
        return this.cartItems
            .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
            .toFixed(2);
    }

    get quoteDiscountLabel() {
        return this.quoteDiscount + '%';
    }

    // ── private helpers ────────────────────────────────────────────
    _loadCart() {
        try {
            const raw = sessionStorage.getItem(CART_KEY);
            this.cartItems = raw ? JSON.parse(raw) : [];
        } catch (e) {
            this.cartItems = [];
        }
    }

    _saveCart() {
        try {
            sessionStorage.setItem(CART_KEY, JSON.stringify(this.cartItems));
        } catch (e) { /* quota */ }
        // Notify parent so the sidebar badge stays in sync
        this.dispatchEvent(new CustomEvent('cartchanged', {
            bubbles: true,
            detail: { cart: this.cartItems }
        }));
    }

    // ── item events ────────────────────────────────────────────────
    handleRemoveItem(evt) {
        const { itemId } = evt.detail;
        this.cartItems = this.cartItems.filter(i => i.itemId !== itemId);
        this._saveCart();
    }

    handleUpdateQty(evt) {
        const { itemId, delta } = evt.detail;
        this.cartItems = this.cartItems.map(i => {
            if (i.itemId !== itemId) return i;
            const newQty = Math.max(1, i.quantity + delta);
            return { ...i, quantity: newQty };
        });
        this._saveCart();
    }

    // ── summary events ─────────────────────────────────────────────
    handlePlaceOrder(e) {
        const appliedSparks = (e && e.detail && e.detail.appliedSparks) || 0;
        this.dispatchEvent(new CustomEvent('navigate', {
            bubbles: true,
            detail: { tab: 'orders', appliedSparks }
        }));
    }

    handleRequestQuote() {
        this.showQuoteModal    = true;
        this.isGeneratingQuote = true;
        this.showQuoteResult   = false;

        // Simulate Salesforce Flow / quote generation (3 s)
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            this.isGeneratingQuote = false;
            this.showQuoteResult   = true;
            this.quoteDiscount     = Math.floor(Math.random() * 10) + 5;   // 5–14 %
            this.quoteProbability  = Math.floor(Math.random() * 25) + 70;  // 70–94 %

            // Clear the cart once the quote is generated
            this.cartItems = [];
            this._saveCart();
        }, 3000);
    }

    handleCloseModal() {
        this.showQuoteModal    = false;
        this.isGeneratingQuote = false;
        this.showQuoteResult   = false;
    }

    handleGoCatalog() {
        this.dispatchEvent(new CustomEvent('navigate', {
            bubbles: true,
            detail: { tab: 'catalog' }
        }));
    }
}
