import { LightningElement, api } from 'lwc';

export default class NexusPortalCartSummary extends LightningElement {
    @api subtotal  = 0;
    @api itemCount = 0;

    get _sub()             { return parseFloat(this.subtotal) || 0; }
    get formattedSubtotal(){ return '$' + this._sub.toFixed(0); }

    // Free shipping above $5 000
    get isFreeShipping()   { return this._sub > 5000; }

    // Total = subtotal (VAT already included — matches screenshot)
    get formattedTotal()   { return '$' + this._sub.toFixed(0); }

    handlePlaceOrder() {
        this.dispatchEvent(new CustomEvent('placeorder', { bubbles: true }));
    }

    handleRequestQuote() {
        this.dispatchEvent(new CustomEvent('requestquote', { bubbles: true }));
    }
}
