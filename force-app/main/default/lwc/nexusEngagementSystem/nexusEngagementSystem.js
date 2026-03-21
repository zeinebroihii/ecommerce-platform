import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const ACTIVITIES = [
    { id: '001', title: 'Nexus Industrial Sensor X1 Order',    time: '2 hours ago',     client: 'TechFlow Inc',     status: 'Delivered',  type: 'success'   },
    { id: '002', title: 'Quote Update QT-2024',                time: '5 hours ago',     client: 'Global Logistics', status: 'En transit', type: 'primary'   },
    { id: '003', title: 'New support message',                 time: 'Yesterday',       client: 'Nexus Support',    status: 'Replied',    type: 'primary'   },
    { id: '004', title: 'Paiement reçu INV-452',               time: 'Hier',            client: 'Finance Dept',     status: 'Complété',   type: 'success'   },
    { id: '005', title: 'Predictive maintenance alert',         time: '2 days ago',      client: 'Active #452',      status: 'Urgent',     type: 'warning'   },
];

const BADGE_CLASSES = {
    success:   'nes-badge nes-badge-success',
    primary:   'nes-badge nes-badge-primary',
    warning:   'nes-badge nes-badge-warning',
    secondary: 'nes-badge nes-badge-secondary',
};

export default class NexusEngagementSystem extends LightningElement {

    @track isHistoryOpen = false;
    @track selectedOffer = null;

    // ── Derived lists ──────────────────────────────────────────────────────────
    get activities() {
        return ACTIVITIES.map(a => ({
            ...a,
            badgeCls: BADGE_CLASSES[a.type] || BADGE_CLASSES.secondary,
        }));
    }

    get hasOffer() { return !!this.selectedOffer; }

    // ── CSS class getters ──────────────────────────────────────────────────────
    get historyOverlayCls() {
        return this.isHistoryOpen ? 'nes-overlay nes-overlay-visible' : 'nes-overlay';
    }
    get historyPanelCls() {
        return this.isHistoryOpen ? 'nes-panel nes-panel-open' : 'nes-panel';
    }
    get offerOverlayCls() {
        return this.hasOffer ? 'nes-overlay nes-overlay-visible' : 'nes-overlay';
    }
    get offerPanelCls() {
        return this.hasOffer ? 'nes-panel nes-offer-panel nes-panel-open' : 'nes-panel nes-offer-panel';
    }

    // ── Public API (called by parent via template.querySelector) ───────────────
    @api openHistory() {
        this.isHistoryOpen = true;
    }

    @api openOffer(offerData) {
        this.selectedOffer = {
            ...offerData,
            reasonFull: offerData.reason +
                ". Ce produit a été sélectionné par notre algorithme prédictif car il complète parfaitement vos actifs et vos habitudes d'utilisation actuels.",
        };
    }

    // ── Handlers ───────────────────────────────────────────────────────────────
    handleCloseHistory() { this.isHistoryOpen = false; }
    handleCloseOffer()   { this.selectedOffer = null; }

    handleAddToCart() {
        const offer = this.selectedOffer;
        this.selectedOffer = null;
        // Notify parent to add the item to the shared cart
        this.dispatchEvent(new CustomEvent('addtocart', { detail: { offer } }));
        this.dispatchEvent(new ShowToastEvent({
            title:   'Cart',
            message: `${offer.name} added to cart.`,
            variant: 'success',
        }));
    }
}
