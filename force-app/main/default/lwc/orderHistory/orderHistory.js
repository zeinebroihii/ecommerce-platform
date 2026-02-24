import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id';
import ACCOUNT_ID_FIELD from '@salesforce/schema/User.AccountId';
import getMyOrders from '@salesforce/apex/OrderTrackingController.getMyOrders';

// The journey an order travels through
const STATUS_STEPS = ['Draft', 'Activated', 'Confirmed', 'Shipped', 'Delivered'];

export default class OrderHistory extends NavigationMixin(LightningElement) {

    userId = Id;
    accountId;

    // Step 1: Get the logged-in user's Account ID
    @wire(getRecord, { recordId: '$userId', fields: [ACCOUNT_ID_FIELD] })
    wiredUser({ data, error }) {
        if (data) {
            this.accountId = getFieldValue(data, ACCOUNT_ID_FIELD);
        }
    }

    // Step 2: Wire auto-fetches orders once accountId is known (reactive $)
    @wire(getMyOrders, { accountId: '$accountId' })
    orders;

    get hasNoOrders() {
        return this.orders.data && this.orders.data.length === 0;
    }

    // Enrich each order with formatted values + status step classes
    get enrichedOrders() {
        if (!this.orders.data) return [];
        return this.orders.data.map(o => ({
            ...o,
            formattedDate:  o.EffectiveDate || 'N/A',
            formattedTotal: o.TotalAmount?.toFixed(2) ?? '0.00',
            statusClass:    this.getStatusBadgeClass(o.Status)
        }));
    }

    // Build the status timeline dots for one order
    get statusSteps() {
        // This getter is not order-specific — it's used for display
        // For a full implementation, this would be per-order
        return STATUS_STEPS.map(s => ({
            label:    s,
            cssClass: 'step'
        }));
    }

    getStatusBadgeClass(status) {
        const map = {
            'Draft':     'status-badge badge-grey',
            'Activated': 'status-badge badge-blue',
            'Confirmed': 'status-badge badge-blue',
            'Shipped':   'status-badge badge-orange',
            'Delivered': 'status-badge badge-green'
        };
        return map[status] || 'status-badge badge-grey';
    }

    handleShop() {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: { name: 'product-catalog' }
        });
    }
}
