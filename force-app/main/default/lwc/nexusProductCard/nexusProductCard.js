import { LightningElement, api } from 'lwc';

/**
 * nexusProductCard — single product card for the Stock Optimization board.
 *
 * @api: productId, productName, family, price, formattedPrice,
 *       stock, capacity, status ('Critical'|'Overstock'|'Optimal'), imageUrl
 *
 * Fires: refresh { productId }
 */
export default class NexusProductCard extends LightningElement {
    @api productId     = '';
    @api productName   = '';
    @api family        = '';
    @api price         = 0;
    @api formattedPrice = '0 €';
    @api stock         = 0;
    @api capacity      = 100;
    @api status        = 'Optimal';
    @api imageUrl      = '';

    get hasImage() { return !!this.imageUrl; }

    get statusBadgeClass() {
        if (this.status === 'Critical')  return 'npc-status-badge npc-status-badge--red';
        if (this.status === 'Overstock') return 'npc-status-badge npc-status-badge--amber';
        return 'npc-status-badge npc-status-badge--green';
    }

    get stockBarClass() {
        if (this.status === 'Critical')  return 'npc-bar npc-bar--red';
        if (this.status === 'Overstock') return 'npc-bar npc-bar--amber';
        return 'npc-bar npc-bar--green';
    }

    get stockCountClass() {
        return this.stock < 20 ? 'npc-stock-count npc-stock-count--low' : 'npc-stock-count npc-stock-count--ok';
    }

    get barStyle() {
        const pct = this.capacity > 0
            ? Math.min(Math.round((this.stock / this.capacity) * 100), 100)
            : 0;
        return `width: ${pct}%`;
    }

    handleRefresh() {
        this.dispatchEvent(new CustomEvent('refresh', {
            detail: { productId: this.productId }, bubbles: true
        }));
    }
}
