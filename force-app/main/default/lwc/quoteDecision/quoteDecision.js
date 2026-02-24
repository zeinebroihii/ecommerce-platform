import { LightningElement, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id';
import ACCOUNT_ID_FIELD from '@salesforce/schema/User.AccountId';
import getAccountQuotes    from '@salesforce/apex/QuoteController.getAccountQuotes';
import processQuoteDecision from '@salesforce/apex/QuoteController.processQuoteDecision';

const STATUS_LABELS = {
    'Draft':        'Brouillon',
    'Needs Review': 'En attente',
    'In Review':    'En révision',
    'Presented':    'En attente de décision',
    'Accepted':     'Accepté',
    'Rejected':     'Refusé'
};

const STATUS_BADGE = {
    'Draft':        'qd-badge qd-badge-draft',
    'Needs Review': 'qd-badge qd-badge-review',
    'In Review':    'qd-badge qd-badge-review',
    'Presented':    'qd-badge qd-badge-pending',
    'Accepted':     'qd-badge qd-badge-accepted',
    'Rejected':     'qd-badge qd-badge-rejected'
};

export default class QuoteDecision extends LightningElement {

    userId = Id;
    @track accountId;
    @track quotes       = [];
    @track isLoading    = true;
    @track showRejectModal = false;
    @track rejectReason = '';
    @track pendingQuoteId;
    @track isSubmitting = false;
    @track toastMsg;
    @track toastClass = 'qd-toast';

    @wire(getRecord, { recordId: '$userId', fields: [ACCOUNT_ID_FIELD] })
    wiredUser({ data }) {
        if (data) this.accountId = getFieldValue(data, ACCOUNT_ID_FIELD);
    }

    @wire(getAccountQuotes, { accountId: '$accountId' })
    wiredQuotes({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.quotes = data.map(q => ({
                ...q,
                statusLabel:     STATUS_LABELS[q.status] || q.status,
                statusBadgeClass: STATUS_BADGE[q.status]  || 'qd-badge qd-badge-draft',
                cardClass: 'qd-card' + (q.canDecide ? ' qd-card-pending' : '')
                                     + (q.isAccepted ? ' qd-card-accepted' : '')
                                     + (q.isRejected ? ' qd-card-rejected' : '')
            }));
        }
        if (error) this._toast('Erreur lors du chargement des devis.', 'error');
    }

    // ── Accept ────────────────────────────────────────────────────────────────
    async handleAccept(event) {
        const quoteId = event.target.dataset.id;
        this.isSubmitting = true;
        try {
            await processQuoteDecision({ quoteId, decision: 'Accepted', reason: '' });
            this._patchQuote(quoteId, 'Accepted');
            this._toast('Devis accepté ! Votre contrat est en cours de préparation.', 'success');
        } catch(e) {
            this._toast('Erreur : ' + (e.body?.message || e.message), 'error');
        } finally {
            this.isSubmitting = false;
        }
    }

    // ── Reject modal ──────────────────────────────────────────────────────────
    handleRejectOpen(event) {
        this.pendingQuoteId = event.target.dataset.id;
        this.rejectReason   = '';
        this.showRejectModal = true;
    }

    handleReasonChange(event) {
        this.rejectReason = event.detail.value;
    }

    handleModalClose() { this.showRejectModal = false; }
    stopProp(event)    { event.stopPropagation(); }

    async handleRejectConfirm() {
        this.isSubmitting = true;
        try {
            await processQuoteDecision({
                quoteId:  this.pendingQuoteId,
                decision: 'Rejected',
                reason:   this.rejectReason
            });
            this._patchQuote(this.pendingQuoteId, 'Rejected');
            this.showRejectModal = false;
            this._toast('Votre refus a été enregistré. Notre équipe vous contactera.', 'info');
        } catch(e) {
            this._toast('Erreur : ' + (e.body?.message || e.message), 'error');
        } finally {
            this.isSubmitting = false;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    _patchQuote(quoteId, newStatus) {
        this.quotes = this.quotes.map(q => {
            if (q.quoteId !== quoteId) return q;
            return {
                ...q,
                status:          newStatus,
                statusLabel:     STATUS_LABELS[newStatus],
                statusBadgeClass: STATUS_BADGE[newStatus],
                canDecide:       false,
                isAccepted:      newStatus === 'Accepted',
                isRejected:      newStatus === 'Rejected',
                cardClass: 'qd-card'
                    + (newStatus === 'Accepted' ? ' qd-card-accepted' : '')
                    + (newStatus === 'Rejected' ? ' qd-card-rejected' : '')
            };
        });
    }

    _toast(msg, type) {
        this.toastMsg   = msg;
        this.toastClass = 'qd-toast qd-toast-' + type;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => { this.toastMsg = null; }, 4000);
    }

    get isEmpty()    { return !this.isLoading && this.quotes.length === 0; }
    get hasQuotes()  { return !this.isLoading && this.quotes.length > 0; }
}
