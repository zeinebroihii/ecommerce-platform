import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getOrders from '@salesforce/apex/OrderManagementController.getOrders';

const FILTERS = ['All', 'Activated', 'Draft'];

export default class NexusOrderBoard extends NavigationMixin(LightningElement) {
    @track _orders      = [];
    @track activeFilter = 'All';
    @track searchTerm   = '';
    @track selectedOrder = null;
    @track showDetails   = false;
    @track showInvoice   = false;

    @wire(getOrders)
    wiredOrders({ data }) {
        if (data) this._orders = data;
    }

    // ── Filters ────────────────────────────────────────────────────────────────

    get filterOptions() {
        return FILTERS.map(f => ({
            label:    f,
            btnClass: 'nob-filter-btn' + (this.activeFilter === f ? ' nob-filter-btn--active' : ''),
        }));
    }

    get filteredOrders() {
        const term = (this.searchTerm || '').toLowerCase();
        return this._orders.filter(o => {
            const matchFilter = this.activeFilter === 'All' || o.status === this.activeFilter;
            const matchSearch = !term
                || (o.orderNumber && o.orderNumber.toLowerCase().includes(term))
                || (o.account     && o.account.toLowerCase().includes(term));
            return matchFilter && matchSearch;
        });
    }

    get hasOrders() {
        return this.filteredOrders.length > 0;
    }

    get orderCountLabel() {
        return this.filteredOrders.length + ' Order' + (this.filteredOrders.length === 1 ? '' : 's');
    }

    // ── Handlers ───────────────────────────────────────────────────────────────

    handleFilterClick(e) {
        this.activeFilter = e.target.dataset.filter;
    }

    handleSearchInput(e) {
        this.searchTerm = e.target.value;
    }

    handleDetailsClick(e) {
        this.selectedOrder = e.detail;
        this.showInvoice   = false;
        this.showDetails   = true;
    }

    handleInvoiceClick(e) {
        this.selectedOrder = e.detail;
        this.showDetails   = false;
        this.showInvoice   = true;
    }

    handleCloseDetails() {
        this.showDetails   = false;
        this.selectedOrder = null;
    }

    handleCloseInvoice() {
        this.showInvoice   = false;
        this.selectedOrder = null;
    }

    handleNewOrder() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: { objectApiName: 'Order', actionName: 'new' },
        });
    }
}
