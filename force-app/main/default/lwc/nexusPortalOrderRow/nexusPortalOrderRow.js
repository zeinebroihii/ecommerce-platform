import { LightningElement, api } from 'lwc';

export default class NexusPortalOrderRow extends LightningElement {
    @api orderId       = '';
    @api orderNumber   = '';
    @api orderDate     = '';
    @api formattedTotal = '';
    @api status        = '';

    get statusBadgeClass() {
        const s = (this.status || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // green  → Activated / Livré / Livré / Delivered / Shipped
        if (s === 'activated' || s === 'livre' || s === 'delivered' || s === 'shipped') {
            return 'npor-badge npor-badge--green';
        }
        // amber  → Draft / En cours / Processing / Pending
        if (s === 'draft' || s === 'en cours' || s === 'processing' || s === 'pending') {
            return 'npor-badge npor-badge--amber';
        }
        // red    → Cancelled / Annulé
        if (s === 'cancelled' || s === 'annule' || s === 'canceled') {
            return 'npor-badge npor-badge--red';
        }
        return 'npor-badge npor-badge--slate';
    }

    handleDetails() {
        this.dispatchEvent(new CustomEvent('viewdetails', {
            bubbles: true,
            detail: { orderId: this.orderId }
        }));
    }
}
