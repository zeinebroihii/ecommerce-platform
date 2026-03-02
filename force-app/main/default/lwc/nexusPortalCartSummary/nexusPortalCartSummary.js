import { LightningElement, api } from 'lwc';

export default class NexusPortalCartSummary extends LightningElement {
    @api subtotal  = 0;
    @api itemCount = 0;

    get formattedSubtotal() {
        return '$' + (parseFloat(this.subtotal) || 0).toFixed(2);
    }

    handlePlaceOrder() {
        this.dispatchEvent(new CustomEvent('placeorder', { bubbles: true }));
    }

    handleRequestQuote() {
        this.dispatchEvent(new CustomEvent('requestquote', { bubbles: true }));
    }
}
