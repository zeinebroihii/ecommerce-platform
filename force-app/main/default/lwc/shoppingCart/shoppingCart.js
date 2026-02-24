import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { subscribe, MessageContext } from 'lightning/messageService';
import { wire } from 'lwc';
import CART_CHANNEL from '@salesforce/messageChannel/CartChannel__c';

const CART_KEY = 'ecomm_cart';

export default class ShoppingCart extends NavigationMixin(LightningElement) {

    @track cartItems = [];
    subscription = null;

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        // Load cart from sessionStorage on mount
        this.loadCart();
        // Subscribe to CartChannel — receives messages from productCatalog
        this.subscription = subscribe(
            this.messageContext,
            CART_CHANNEL,
            (message) => this.handleAddToCart(message)
        );
    }

    // Receives message from productCatalog when customer clicks "Add to Cart"
    handleAddToCart(message) {
        const existing = this.cartItems.find(i => i.productId === message.productId);
        if (existing) {
            // Product already in cart — increase quantity
            this.cartItems = this.cartItems.map(i =>
                i.productId === message.productId
                    ? { ...i, quantity: i.quantity + 1, subtotal: ((i.quantity + 1) * i.unitPrice).toFixed(2) }
                    : i
            );
        } else {
            // New product — add to cart
            this.cartItems = [
                ...this.cartItems,
                {
                    productId:   message.productId,
                    productName: message.productName,
                    unitPrice:   message.unitPrice,
                    quantity:    1,
                    subtotal:    message.unitPrice.toFixed(2)
                }
            ];
        }
        this.saveCart();
    }

    increaseQty(event) {
        const id = event.target.dataset.id;
        this.cartItems = this.cartItems.map(i =>
            i.productId === id
                ? { ...i, quantity: i.quantity + 1, subtotal: ((i.quantity + 1) * i.unitPrice).toFixed(2) }
                : i
        );
        this.saveCart();
    }

    decreaseQty(event) {
        const id = event.target.dataset.id;
        this.cartItems = this.cartItems
            .map(i => i.productId === id
                ? { ...i, quantity: i.quantity - 1, subtotal: ((i.quantity - 1) * i.unitPrice).toFixed(2) }
                : i
            )
            .filter(i => i.quantity > 0); // remove if qty reaches 0
        this.saveCart();
    }

    removeItem(event) {
        const id = event.target.dataset.id;
        this.cartItems = this.cartItems.filter(i => i.productId !== id);
        this.saveCart();
    }

    clearCart() {
        this.cartItems = [];
        this.saveCart();
    }

    handleCheckout() {
        // Save cart to sessionStorage so checkoutPage LWC can read it
        this.saveCart();
        // Navigate to the Checkout page
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: { url: '/shop/s/checkout' }
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    saveCart() {
        sessionStorage.setItem(CART_KEY, JSON.stringify(this.cartItems));
    }

    loadCart() {
        const stored = sessionStorage.getItem(CART_KEY);
        this.cartItems = stored ? JSON.parse(stored) : [];
    }

    get isEmpty() {
        return this.cartItems.length === 0;
    }

    get cartCount() {
        return this.cartItems.reduce((sum, i) => sum + i.quantity, 0);
    }

    get cartTotal() {
        return this.cartItems
            .reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0)
            .toFixed(2);
    }
}
