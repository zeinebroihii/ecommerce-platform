import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getMyNotifications from '@salesforce/apex/NotificationController.getMyNotifications';
import markOneRead       from '@salesforce/apex/NotificationController.markOneRead';
import markAllRead       from '@salesforce/apex/NotificationController.markAllRead';

const TYPE_COLORS = {
    Lead:     'nb-type-lead',
    Order:    'nb-type-order',
    Quote:    'nb-type-quote',
    Contract: 'nb-type-contract',
    Payment:  'nb-type-payment'
};

export default class NotificationBell extends NavigationMixin(LightningElement) {

    @track isOpen         = false;
    @track isLoading      = false;
    @track notifications  = [];

    // ── Open / close ─────────────────────────────────────────────────────────
    togglePanel() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) this._load();
    }

    // ── Load notifications ────────────────────────────────────────────────────
    async _load() {
        this.isLoading = true;
        try {
            const raw = await getMyNotifications();
            this.notifications = raw.map(n => ({
                ...n,
                formattedDate: this._fmt(n.CreatedDate),
                itemClass:     'nb-item' + (n.IsRead__c ? '' : ' nb-item-unread'),
                dotClass:      'nb-dot'  + (n.IsRead__c ? ' nb-dot-read' : ' nb-dot-unread'),
                typeBadgeClass: 'nb-type-badge ' + (TYPE_COLORS[n.Type__c] || 'nb-type-lead')
            }));
        } catch(e) {
            // silently fail — bell is a non-critical UI
        } finally {
            this.isLoading = false;
        }
    }

    // ── Click a notification ──────────────────────────────────────────────────
    async handleNotifClick(event) {
        const id  = event.currentTarget.dataset.id;
        const url = event.currentTarget.dataset.url;

        // Mark read
        try { await markOneRead({ notifId: id }); } catch(e) { /* ignore */ }

        // Update local state
        this.notifications = this.notifications.map(n =>
            n.Id === id ? { ...n, IsRead__c: true,
                            itemClass: 'nb-item',
                            dotClass:  'nb-dot nb-dot-read' } : n
        );

        // Navigate if URL provided
        if (url) {
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: { url }
            });
            this.isOpen = false;
        }
    }

    // ── Mark all read ─────────────────────────────────────────────────────────
    async handleMarkAll() {
        try {
            await markAllRead();
            this.notifications = this.notifications.map(n => ({
                ...n, IsRead__c: true,
                itemClass: 'nb-item',
                dotClass:  'nb-dot nb-dot-read'
            }));
        } catch(e) { /* ignore */ }
    }

    // ── Getters ───────────────────────────────────────────────────────────────
    get unreadCount() {
        return this.notifications.filter(n => !n.IsRead__c).length || 0;
    }

    get isEmpty() {
        return !this.isLoading && this.notifications.length === 0;
    }

    get hasNotifications() {
        return !this.isLoading && this.notifications.length > 0;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    _fmt(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const diffMs  = Date.now() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1)   return "À l'instant";
        if (diffMin < 60)  return `Il y a ${diffMin} min`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24)    return `Il y a ${diffH}h`;
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
}
