import { LightningElement, wire, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAdminQuotes    from '@salesforce/apex/DashboardController.getAdminQuotes';
import updateQuoteStatus from '@salesforce/apex/DashboardController.updateQuoteStatus';
import sendQuoteToCustomer from '@salesforce/apex/QuoteController.sendQuoteToCustomer';

const STATUS_CSS = {
    Draft     : 'qs-chip qs-draft',
    Sent      : 'qs-chip qs-sent',
    Presented : 'qs-chip qs-presented',
    Accepted  : 'qs-chip qs-accepted',
    Rejected  : 'qs-chip qs-rejected'
};
const STATUS_LABELS = {
    All       : 'Tous',
    Draft     : 'Brouillon',
    Sent      : 'Envoyé',
    Presented : 'En attente',
    Accepted  : 'Accepté',
    Rejected  : 'Rejeté'
};

export default class AdminQuoteManager extends LightningElement {

    @track statusFilter = 'All';
    @track loading      = false;

    // send modal
    @track showSendModal  = false;
    @track sendQuoteId    = '';
    @track sendQuoteName  = '';
    @track sendEmail      = '';
    @track sendBcc        = '';
    @track sendSubject    = '';
    @track sendNote       = '';
    @track sending        = false;

    _wiredResult;
    @track quotes = [];

    @wire(getAdminQuotes, { statusFilter: '$statusFilter' })
    wiredQuotes(result) {
        this._wiredResult = result;
        const { data, error } = result;
        if (data) {
            this.quotes = data.map(q => ({
                ...q,
                statusCls : STATUS_CSS[q.status] || 'qs-chip',
                rowCls    : q.isAccepted ? 'qrow qrow-accepted' : q.isRejected ? 'qrow qrow-rejected' : 'qrow',
                oppUrl    : q.opportunityId ? `/lightning/r/Opportunity/${q.opportunityId}/view` : '#'
            }));
            this.loading = false;
        }
        if (error) { this.loading = false; }
    }

    // ── computed ───────────────────────────────────────────────────────────────
    get hasQuotes() { return this.quotes.length > 0; }
    get totalCount() { return this.quotes.length; }
    get emptyLabel() {
        return this.statusFilter === 'All' ? '' : `au statut "${STATUS_LABELS[this.statusFilter]}"`;
    }

    get filterOptions() {
        const counts = {};
        this.quotes.forEach(q => { counts[q.status] = (counts[q.status] || 0) + 1; });
        return ['All','Draft','Sent','Presented','Accepted','Rejected'].map(v => ({
            value : v,
            label : STATUS_LABELS[v],
            count : v !== 'All' ? (counts[v] || null) : null,
            cls   : 'filter-btn' + (this.statusFilter === v ? ' filter-active' : '')
        }));
    }

    // ── filter ─────────────────────────────────────────────────────────────────
    handleFilter(evt) {
        this.loading = true;
        this.statusFilter = evt.currentTarget.dataset.value;
    }

    // ── send modal ─────────────────────────────────────────────────────────────
    handleOpenSendModal(evt) {
        this.sendQuoteId   = evt.currentTarget.dataset.id;
        this.sendQuoteName = evt.currentTarget.dataset.name;
        this.sendSubject   = `Devis TALCORE – ${this.sendQuoteName}`;
        this.sendEmail     = '';
        this.sendBcc       = '';
        this.sendNote      = '';
        this.showSendModal = true;
    }

    handleCloseSend() { this.showSendModal = false; }

    handleSendField(evt) { this[evt.currentTarget.dataset.field] = evt.target.value; }

    async handleSend() {
        if (!this.sendEmail) {
            this._toast('Email requis', 'Veuillez saisir un email destinataire.', 'error');
            return;
        }
        this.sending = true;
        try {
            await sendQuoteToCustomer({
                quoteId      : this.sendQuoteId,
                recipientEmail : this.sendEmail,
                emailSubject   : this.sendSubject,
                bodyNote       : this.sendNote,
                bccEmail       : this.sendBcc
            });
            this._toast('Devis envoyé', `Email envoyé à ${this.sendEmail}`, 'success');
            this.showSendModal = false;
            refreshApex(this._wiredResult);
        } catch (e) {
            this._toast('Erreur', e.body?.message || "Échec d'envoi.", 'error');
        } finally {
            this.sending = false;
        }
    }

    // ── status actions ─────────────────────────────────────────────────────────
    async handleAccept(evt) {
        await this._setStatus(evt.currentTarget.dataset.id, 'Accepted');
    }

    async handleReject(evt) {
        await this._setStatus(evt.currentTarget.dataset.id, 'Rejected');
    }

    async _setStatus(id, status) {
        try {
            await updateQuoteStatus({ quoteId: id, newStatus: status });
            this._toast('Statut mis à jour', `Devis marqué ${status}.`, 'success');
            refreshApex(this._wiredResult);
        } catch (e) {
            this._toast('Erreur', e.body?.message || 'Échec mise à jour.', 'error');
        }
    }

    _toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
