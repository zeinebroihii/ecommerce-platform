import { LightningElement, api } from 'lwc';

export default class NexusOrderRow extends LightningElement {
    @api orderId;
    @api orderNumber;
    @api account;
    @api orderDate;
    @api formattedTotal;
    @api status;
    @api itemCount;

    get orderShort() {
        if (!this.orderNumber) return '—';
        const parts = this.orderNumber.split('-');
        return parts[parts.length - 1] || this.orderNumber;
    }

    get itemCountLabel() {
        const n = this.itemCount || 0;
        return n + ' Item' + (n === 1 ? '' : 's');
    }

    get statusDotClass() {
        const s = this.status;
        return 'nor-dot ' + (
            s === 'Activated' ? 'nor-dot--green' :
            s === 'Draft'     ? 'nor-dot--blue'  :
                                'nor-dot--amber'
        );
    }

    get statusTextClass() {
        const s = this.status;
        return 'nor-status-text ' + (
            s === 'Activated' ? 'nor-status-text--green' :
            s === 'Draft'     ? 'nor-status-text--blue'  :
                                'nor-status-text--amber'
        );
    }

    get _payload() {
        return {
            orderId:        this.orderId,
            orderNumber:    this.orderNumber,
            account:        this.account,
            orderDate:      this.orderDate,
            formattedTotal: this.formattedTotal,
            status:         this.status,
            itemCount:      this.itemCount,
        };
    }

    handleDetails() {
        this.dispatchEvent(new CustomEvent('detailsclick', { detail: this._payload, bubbles: true }));
    }

    handleInvoice() {
        this.dispatchEvent(new CustomEvent('invoiceclick', { detail: this._payload, bubbles: true }));
    }
}
