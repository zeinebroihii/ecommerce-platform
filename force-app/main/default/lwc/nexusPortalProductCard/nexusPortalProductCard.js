import { LightningElement, api } from 'lwc';

export default class NexusPortalProductCard extends LightningElement {
    @api productId          = '';
    @api productName        = '';
    @api productDescription = '';
    @api productFamily      = '';
    @api imageUrl           = '';
    @api unitPrice          = 0;
    @api quantityAvailable  = 0;
    @api isOutOfStock       = false;

    // ── computed ────────────────────────────────────────────────
    get hasImage() {
        return !!(this.imageUrl && this.imageUrl.trim());
    }

    get isPremium() {
        return parseFloat(this.unitPrice || 0) > 1000;
    }

    get stockStatusLabel() {
        if (this.isOutOfStock)                             return 'Épuisé';
        if (parseFloat(this.quantityAvailable || 0) < 5)  return 'Stock bas';
        return 'En stock';
    }

    get stockBadgeClass() {
        if (this.isOutOfStock)                             return 'nppc-stock-badge nppc-stock--red';
        if (parseFloat(this.quantityAvailable || 0) < 5)  return 'nppc-stock-badge nppc-stock--amber';
        return 'nppc-stock-badge nppc-stock--green';
    }

    get formattedPrice() {
        const n = parseFloat(this.unitPrice || 0);
        return '$' + n.toLocaleString('fr-FR');
    }

    // ── handlers ────────────────────────────────────────────────
    handleAddToCart() {
        this.dispatchEvent(new CustomEvent('addtocart', {
            bubbles: true,
            detail: {
                productId:          this.productId,
                productName:        this.productName,
                productDescription: this.productDescription,
                imageUrl:           this.imageUrl,
                unitPrice:          parseFloat(this.unitPrice || 0),
            }
        }));
    }

    handleViewDetails() {
        this.dispatchEvent(new CustomEvent('viewdetails', {
            bubbles: true,
            detail: { productId: this.productId }
        }));
    }
}
