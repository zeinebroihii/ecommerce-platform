import { LightningElement, api, wire } from 'lwc';
import getOrderDetail from '@salesforce/apex/OrderManagementController.getOrderDetail';

export default class NexusOrderDetails extends LightningElement {
    @api orderId;
    @api orderNumber;
    @api account;
    @api orderDate;
    @api formattedTotal;
    @api status;
    @api itemCount;

    _detail;

    @wire(getOrderDetail, { orderId: '$orderId' })
    wiredDetail({ data }) {
        if (data) this._detail = data;
    }

    get lineItems() {
        return this._detail ? this._detail.lineItems : [];
    }

    get hasLineItems() {
        return this.lineItems.length > 0;
    }

    get shippingAddress() {
        return this._detail ? this._detail.shippingAddress : '—';
    }

    get itemCountLabel() {
        const n = this._detail ? this._detail.itemCount : (this.itemCount || 0);
        return n + ' Item' + (n === 1 ? '' : 's');
    }

    get statusBadgeClass() {
        const s = this.status;
        return 'nod-badge ' + (
            s === 'Activated' ? 'nod-badge--green' :
            s === 'Draft'     ? 'nod-badge--blue'  :
                                'nod-badge--amber'
        );
    }

    get timeline() {
        const isActivated = this.status === 'Activated';
        const isDraft     = this.status === 'Draft';
        const steps = [
            { label: 'Order Placed',      date: this.orderDate, done: true },
            { label: 'Payment Confirmed', date: this.orderDate, done: !isDraft },
            { label: 'Processing',        date: this.orderDate, done: isActivated },
            { label: 'Activated',         date: this.orderDate, done: isActivated },
        ];
        return steps.map(s => ({
            label:   s.label,
            date:    s.date,
            done:    s.done,
            dotClass: 'nod-step-dot ' + (s.done ? 'nod-step-dot--done' : 'nod-step-dot--pending'),
        }));
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleTrack() {
        this.dispatchEvent(new CustomEvent('track', { detail: { orderId: this.orderId } }));
    }
}
