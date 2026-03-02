import { LightningElement, api } from 'lwc';

export default class NexusPortalCartItem extends LightningElement {
    @api itemId;
    @api productId;
    @api productName;
    @api productFamily;
    @api productDescription;
    @api imageUrl;
    @api unitPrice;
    @api quantity = 1;

    get hasImage() {
        return !!this.imageUrl;
    }

    get formattedLineTotal() {
        const total = (parseFloat(this.unitPrice) || 0) * (parseInt(this.quantity, 10) || 1);
        return '$' + total.toFixed(2);
    }

    get _payload() {
        return { itemId: this.itemId, productId: this.productId };
    }

    handleRemove() {
        this.dispatchEvent(new CustomEvent('removeitem', { detail: this._payload, bubbles: true }));
    }

    handleDecrement() {
        this.dispatchEvent(new CustomEvent('updateqty', { detail: { itemId: this.itemId, delta: -1 }, bubbles: true }));
    }

    handleIncrement() {
        this.dispatchEvent(new CustomEvent('updateqty', { detail: { itemId: this.itemId, delta: +1 }, bubbles: true }));
    }
}
