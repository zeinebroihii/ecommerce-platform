import { LightningElement, track, wire } from 'lwc';
import getOrders from '@salesforce/apex/OrderManagementController.getOrders';

const FILTERS = [
    { id: 'all',       label: 'Toutes'    },
    { id: 'Activated', label: 'Livrées'   },
    { id: 'Draft',     label: 'En cours'  },
];

export default class NexusPortalOrders extends LightningElement {

    @track activeFilter = 'all';
    @track searchTerm   = '';
    @track showDetailModal  = false;
    @track selectedOrder    = {};

    // ── wire ────────────────────────────────────────────────────────
    @wire(getOrders)
    wiredOrders;

    // ── getters ─────────────────────────────────────────────────────
    get orders() {
        return (this.wiredOrders && this.wiredOrders.data) ? this.wiredOrders.data : [];
    }

    get filteredOrders() {
        let list = this.orders;
        if (this.activeFilter !== 'all') {
            list = list.filter(o => o.status === this.activeFilter);
        }
        if (this.searchTerm) {
            const q = this.searchTerm.toLowerCase();
            list = list.filter(o =>
                (o.orderNumber || '').toLowerCase().includes(q) ||
                (o.account || '').toLowerCase().includes(q)
            );
        }
        return list;
    }

    get hasOrders() {
        return this.filteredOrders.length > 0;
    }

    get orderCountLabel() {
        const n = this.filteredOrders.length;
        return n === 1 ? '1 commande' : `${n} commandes`;
    }

    get filterTabs() {
        return FILTERS.map(f => ({
            ...f,
            btnClass: 'npos-filter-btn' +
                (this.activeFilter === f.id ? ' npos-filter-btn--active' : '')
        }));
    }

    get selectedStatusBadge() {
        const s = (this.selectedOrder.status || '').toLowerCase();
        if (s === 'activated') return 'npos-badge npos-badge--green';
        if (s === 'draft')     return 'npos-badge npos-badge--amber';
        return 'npos-badge npos-badge--slate';
    }

    get orderTimeline() {
        const status = (this.selectedOrder.status || '').toLowerCase();
        const steps = [
            { label: 'Commande passée',     date: this.selectedOrder.orderDate || '-' },
            { label: 'Paiement confirmé',   date: '-'   },
            { label: 'En préparation',      date: '-'   },
            { label: 'Livré',               date: status === 'activated' ? 'Livré' : '-' },
        ];
        const activatedIndex = status === 'activated' ? 3 : status === 'draft' ? 0 : 0;
        return steps.map((s, i) => ({
            ...s,
            dotClass: 'npos-dot' + (i <= activatedIndex ? ' npos-dot--done' : '')
        }));
    }

    // ── handlers ────────────────────────────────────────────────────
    handleFilterChange(evt) {
        this.activeFilter = evt.currentTarget.dataset.id;
    }

    handleSearch(evt) {
        this.searchTerm = evt.target.value;
    }

    handleViewDetails(evt) {
        const { orderId } = evt.detail;
        const order = this.orders.find(o => o.orderId === orderId);
        if (order) {
            this.selectedOrder   = order;
            this.showDetailModal = true;
        }
    }

    handleCloseModal() {
        this.showDetailModal = false;
        this.selectedOrder   = {};
    }

    stopPropagation(evt) {
        evt.stopPropagation();
    }
}
