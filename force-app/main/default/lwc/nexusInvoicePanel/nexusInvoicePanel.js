import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getOrderDetail    from '@salesforce/apex/OrderManagementController.getOrderDetail';
import generateInvoice   from '@salesforce/apex/OrderManagementController.generateInvoice';

export default class NexusInvoicePanel extends LightningElement {
    @api orderId;
    @api orderNumber;
    @api account;
    @api orderDate;
    @api formattedTotal;
    @api status;

    @track isGenerating = false;
    _detail;

    @wire(getOrderDetail, { orderId: '$orderId' })
    wiredDetail({ data }) {
        if (data) this._detail = data;
    }

    // ── Computed ──────────────────────────────────────────────────────────────

    get invoiceRef() {
        if (!this.orderNumber) return '—';
        const parts = this.orderNumber.split('-');
        return parts[parts.length - 1] || this.orderNumber;
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

    get totalAmount() {
        return this._detail ? (this._detail.totalAmount || 0) : 0;
    }

    get formattedTax() {
        return (this.totalAmount * 0.2).toFixed(2) + ' €';
    }

    get formattedGrandTotal() {
        return (this.totalAmount * 1.2).toFixed(2) + ' €';
    }

    // ── Actions ───────────────────────────────────────────────────────────────

    async handleDownload() {
        if (this.isGenerating) return;
        this.isGenerating = true;
        try {
            await generateInvoice({ orderId: this.orderId });
            this.dispatchEvent(new ShowToastEvent({
                title:   'Invoice Generated',
                message: 'Invoice PDF has been generated and emailed to the customer.',
                variant: 'success',
            }));
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({
                title:   'Error',
                message: e.body ? e.body.message : 'Could not generate invoice.',
                variant: 'error',
            }));
        } finally {
            this.isGenerating = false;
        }
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }
}
