import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id';
import ACCOUNT_ID_FIELD from '@salesforce/schema/User.AccountId';
import placeOrderFromLwc from '@salesforce/apex/OrderService.placeOrderFromLwc';

const CART_KEY = 'ecomm_cart';

export default class CheckoutPage extends NavigationMixin(LightningElement) {

    userId = Id;

    @track accountId;
    @track cartItems  = [];
    @track step       = 'form'; // 'form' | 'confirmed' | 'error'
    @track isLoading  = false;
    @track orderId;
    @track errorMessage;

    // Form fields
    @track firstName = '';
    @track lastName  = '';
    @track street    = '';
    @track city      = '';
    @track state     = '';
    @track zip       = '';
    @track country   = 'United Kingdom';

    // ── Wire ──────────────────────────────────────────────────────────────────
    @wire(getRecord, { recordId: '$userId', fields: [ACCOUNT_ID_FIELD] })
    wiredUser({ data }) {
        if (data) this.accountId = getFieldValue(data, ACCOUNT_ID_FIELD);
    }

    connectedCallback() {
        const stored = sessionStorage.getItem(CART_KEY);
        const raw    = stored ? JSON.parse(stored) : [];
        // Ensure each item has a subtotal for display
        this.cartItems = raw.map(i => ({
            ...i,
            subtotal: ((i.unitPrice ?? 0) * i.quantity).toFixed(2)
        }));
    }

    // ── Getters ───────────────────────────────────────────────────────────────
    get hasCart()    { return this.cartItems.length > 0; }
    get isForm()     { return this.step === 'form'; }
    get isConfirmed(){ return this.step === 'confirmed'; }
    get isError()    { return this.step === 'error'; }

    get cartTotal() {
        return this.cartItems
            .reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.quantity, 0)
            .toFixed(2);
    }

    // ── Handlers ──────────────────────────────────────────────────────────────
    handleField(event) {
        this[event.target.name] = event.target.value;
    }

    handlePlaceOrder() {
        // Trigger native input validation
        const allValid = [...this.template.querySelectorAll('lightning-input')]
            .reduce((valid, el) => el.reportValidity() && valid, true);
        if (!allValid) return;

        this.isLoading = true;

        const cartPayload = JSON.stringify(
            this.cartItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
        );

        placeOrderFromLwc({
            accountId:     this.accountId,
            cartItemsJson: cartPayload,
            street:        this.street,
            city:          this.city,
            state:         this.state,
            zipCode:       this.zip,
            country:       this.country
        })
        .then(newOrderId => {
            sessionStorage.removeItem(CART_KEY);
            this.orderId = newOrderId;
            this.step    = 'confirmed';
        })
        .catch(err => {
            this.errorMessage = err?.body?.message ?? 'Something went wrong. Please try again.';
            this.step = 'error';
        })
        .finally(() => {
            this.isLoading = false;
        });
    }

    handleRetry() {
        this.step         = 'form';
        this.errorMessage = null;
    }

    handleViewOrders() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: { url: '/shop/s/' }
        });
    }

    handleBackToShop() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: { url: '/shop/s/' }
        });
    }
}
