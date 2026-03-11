import { LightningElement, wire, track } from 'lwc';
import { getRecord }    from 'lightning/uiRecordApi';
import { refreshApex }  from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import userId           from '@salesforce/user/Id';
import USER_ACCOUNT_FIELD from '@salesforce/schema/User.AccountId';
import getAccountQuotes   from '@salesforce/apex/QuoteController.getAccountQuotes';
import processQuoteDecision from '@salesforce/apex/QuoteController.processQuoteDecision';
import requestQuote       from '@salesforce/apex/QuoteController.requestQuote';

// ── Status maps ──────────────────────────────────────────────────────────────
const PROB_MAP = {
    Draft: 20, Sent: 40, Presented: 65, Negotiation: 75, Accepted: 90, Signed: 100, Rejected: 0
};
const BADGE_MAP = {
    Draft:       'nqs-badge nqs-badge-secondary',
    Sent:        'nqs-badge nqs-badge-warning',
    Presented:   'nqs-badge nqs-badge-primary',
    Negotiation: 'nqs-badge nqs-badge-primary',
    Accepted:    'nqs-badge nqs-badge-success',
    Signed:      'nqs-badge nqs-badge-success',
    Rejected:    'nqs-badge nqs-badge-danger'
};
const MODAL_BADGE_MAP = {
    Draft:       'nqs-modal-badge nqs-modal-badge-secondary',
    Sent:        'nqs-modal-badge nqs-modal-badge-warning',
    Presented:   'nqs-modal-badge nqs-modal-badge-primary',
    Negotiation: 'nqs-modal-badge nqs-modal-badge-primary',
    Accepted:    'nqs-modal-badge nqs-modal-badge-success',
    Signed:      'nqs-modal-badge nqs-modal-badge-success',
    Rejected:    'nqs-modal-badge nqs-modal-badge-danger'
};

// ── Mock quotes (shown when no Salesforce data) ───────────────────────────────
const MOCK_QUOTES = [
    {
        quoteId: 'MOCK-001',
        name: 'QT-2024-001',
        status: 'Accepted',
        grandTotal: 12500,
        formattedTotal: '$12,500',
        expirationDate: '10 MARS 2024',
        opportunityName: 'Nexus Enterprise Deal',
        description: 'Enterprise infrastructure upgrade including core systems and cloud synchronization.',
        probability: 98,
        canDecide: false,
        isAccepted: true,
        isRejected: false,
        isMock: true,
        date: 'March 10, 2024',
        currentVersion: 2,
        contractStatus: 'Pending Signature',
        versions: [
            {
                version: 1,
                date: 'March 01, 2024',
                total: 13800,
                status: 'Sent',
                products: [
                    { product: { id: 'p1', name: 'Nexus Core Pro', family: 'Hardware', price: 8500, image: 'https://picsum.photos/seed/core/400/400' }, quantity: 1 },
                    { product: { id: 'p2', name: 'Cloud Sync Module', family: 'Software', price: 5300, image: 'https://picsum.photos/seed/cloud/400/400' }, quantity: 1 }
                ]
            },
            {
                version: 2,
                date: 'March 05, 2024',
                total: 12500,
                status: 'Negotiation',
                products: [
                    { product: { id: 'p1', name: 'Nexus Core Pro', family: 'Hardware', price: 8500, image: 'https://picsum.photos/seed/core/400/400' }, quantity: 1 },
                    { product: { id: 'p2', name: 'Cloud Sync Module', family: 'Software', price: 4000, image: 'https://picsum.photos/seed/cloud/400/400' }, quantity: 1 }
                ]
            }
        ],
        messages: [
            { id: 'm1', sender: 'rep', text: 'Bonjour ! J\'ai mis à jour le devis avec la remise volume de 10% demandée.', time: '10:30' },
            { id: 'm2', sender: 'user', text: 'Merci Sarah. Pouvez-vous aussi revoir les conditions de maintenance ?', time: '11:15' }
        ]
    },
    {
        quoteId: 'MOCK-002',
        name: 'QT-2024-002',
        status: 'Negotiation',
        grandTotal: 8900,
        formattedTotal: '$8,900',
        expirationDate: 'MARCH 15, 2024',
        opportunityName: 'Edge Computing Project',
        description: 'Nœuds de calcul distribué pour intelligence en périphérie de réseau.',
        probability: 72,
        canDecide: true,
        isAccepted: false,
        isRejected: false,
        isMock: true,
        date: 'March 15, 2024',
        currentVersion: 1,
        contractStatus: null,
        versions: [
            {
                version: 1,
                date: 'Feb 28, 2024',
                total: 4200,
                status: 'Accepted',
                products: [
                    { product: { id: 'p3', name: 'Edge Node v2', family: 'Hardware', price: 2100, image: 'https://picsum.photos/seed/edge/400/400' }, quantity: 2 }
                ]
            }
        ],
        messages: []
    }
];

export default class NexusQuotationSystem extends LightningElement {
    // ── Salesforce data ────────────────────────────────────────────────────────
    @track accountId;
    @track _quotes            = [];
    @track _quotesWireResult;
    @track _sfDataLoaded      = false;

    // ── List state ────────────────────────────────────────────────────────────
    @track filter = 'All';

    // ── Detail modal state ────────────────────────────────────────────────────
    @track _selectedQuoteId   = null;
    @track _modalTab          = 'details';
    @track _messages          = [];
    @track _messageInput      = '';
    @track _msgCounter        = 0;
    @track _expandedVersion   = null;

    // ── Accept/Sign state ─────────────────────────────────────────────────────
    @track _isSigning         = false;
    @track _signature         = '';
    @track _isDeciding        = false;

    // ── Reject state ──────────────────────────────────────────────────────────
    @track _showRejectForm    = false;
    @track _rejectReason      = '';

    // ── New quote request form ─────────────────────────────────────────────────
    @track _showNewForm       = false;
    @track _formStep          = 'form';
    @track _formCompany       = '';
    @track _formEmail         = '';
    @track _formQty           = '10';
    @track _formMessage       = '';
    @track _formSubmitting    = false;

    // ── Wires ─────────────────────────────────────────────────────────────────
    @wire(getRecord, { recordId: userId, fields: [USER_ACCOUNT_FIELD] })
    wiredUser({ data }) {
        if (data) this.accountId = data.fields.AccountId.value;
    }

    @wire(getAccountQuotes, { accountId: '$accountId' })
    wiredQuotes(result) {
        this._quotesWireResult = result;
        if (result.data) {
            this._sfDataLoaded = true;
            this._quotes = result.data.length > 0 ? result.data : MOCK_QUOTES;
        }
        if (result.error) {
            this._sfDataLoaded = true;
            this._quotes = MOCK_QUOTES;
        }
    }

    // Fallback: if wire never fires (e.g. no accountId), use mocks
    get activeQuotes() {
        return this._sfDataLoaded ? this._quotes : MOCK_QUOTES;
    }

    // ── Computed: filter options ───────────────────────────────────────────────
    get filterOptions() {
        const labels = {
            All: 'ALL', Accepted: 'ACCEPTED',
            Sent: 'SENT', Draft: 'DRAFT'
        };
        return ['All', 'Accepted', 'Sent', 'Draft'].map(f => ({
            id:    f,
            label: labels[f],
            cls:   this.filter === f ? 'nqs-filter-btn nqs-filter-active' : 'nqs-filter-btn'
        }));
    }

    // ── Computed: quote list ───────────────────────────────────────────────────
    get filteredQuotes() {
        return this.activeQuotes
            .filter(q => this.filter === 'All' || q.status === this.filter)
            .map(q => {
                const prob = q.probability || PROB_MAP[q.status] || 20;
                return {
                    ...q,
                    probability:  prob,
                    badgeCls:     BADGE_MAP[q.status] || 'nqs-badge nqs-badge-secondary',
                    displayTotal: q.formattedTotal || '—',
                    displayDate:  q.expirationDate  || '—',
                    probWidth:    'width:' + prob + '%'
                };
            });
    }

    get isEmpty()   { return this.filteredQuotes.length === 0; }
    get hasQuotes() { return this.filteredQuotes.length > 0;   }

    // ── Computed: selected quote ───────────────────────────────────────────────
    get selectedQuote() {
        if (!this._selectedQuoteId) return null;
        const q = this.activeQuotes.find(r => r.quoteId === this._selectedQuoteId);
        if (!q) return null;
        const prob = q.probability || PROB_MAP[q.status] || 20;
        const gross = q.grandTotal || 0;
        return {
            ...q,
            probability:     prob,
            probStyle:       'width:' + prob + '%',
            displayTotal:    q.formattedTotal || '—',
            displayDate:     q.expirationDate || '—',
            discountAmount:  (gross * 0.1).toFixed(2) + ' €',
            discountedTotal: (gross * 0.9).toFixed(2) + ' €',
            badgeCls:        MODAL_BADGE_MAP[q.status] || 'nqs-modal-badge nqs-modal-badge-secondary',
            versionLabel:    q.currentVersion ? 'v' + q.currentVersion + '.0' : 'v1.0',
            versionCount:    q.versions ? q.versions.length : 0
        };
    }

    get showDetailModal()  { return !!this._selectedQuoteId; }
    get showSigningModal() { return this._isSigning; }
    get showRejectForm()   { return this._showRejectForm; }
    get showSignContract() {
        const q = this.selectedQuote;
        return q && (q.status === 'Accepted' || q.isAccepted) && q.contractStatus !== 'Signed';
    }

    // ── Computed: modal tabs ───────────────────────────────────────────────────
    get isDetailsTab()  { return this._modalTab === 'details';  }
    get isMessagesTab() { return this._modalTab === 'messages'; }
    get isHistoryTab()  { return this._modalTab === 'history';  }

    get tabDetailsCls()  { return this._modalTab === 'details'  ? 'nqs-mtab nqs-mtab-active' : 'nqs-mtab'; }
    get tabMessagesCls() { return this._modalTab === 'messages' ? 'nqs-mtab nqs-mtab-active' : 'nqs-mtab'; }
    get tabHistoryCls()  { return this._modalTab === 'history'  ? 'nqs-mtab nqs-mtab-active' : 'nqs-mtab'; }

    get tabDetailsVariant()  { return this._modalTab === 'details'  ? 'inverse' : ''; }
    get tabMessagesVariant() { return this._modalTab === 'messages' ? 'inverse' : ''; }
    get tabHistoryVariant()  { return this._modalTab === 'history'  ? 'inverse' : ''; }

    // ── Computed: product table (current version) ──────────────────────────────
    get selectedQuoteCurrentVersion() {
        const q = this.selectedQuote;
        if (!q || !q.versions || !q.versions.length) return null;
        return q.versions.find(v => v.version === q.currentVersion) || q.versions[q.versions.length - 1];
    }

    get selectedQuoteProducts() {
        const v = this.selectedQuoteCurrentVersion;
        if (!v || !v.products) return [];
        return v.products.map((item, i) => ({
            key:           item.product.id || String(i),
            productName:   item.product.name,
            productFamily: item.product.family,
            productImage:  item.product.image,
            quantity:      item.quantity,
            unitPrice:     '$' + item.product.price.toLocaleString('fr-FR'),
            totalPrice:    '$' + (item.product.price * item.quantity).toLocaleString('fr-FR')
        }));
    }

    get selectedQuoteHasProducts() { return this.selectedQuoteProducts.length > 0; }

    // ── Computed: version history ──────────────────────────────────────────────
    get selectedQuoteVersions() {
        const q = this.selectedQuote;
        if (!q || !q.versions || !q.versions.length) return [];
        return [...q.versions].reverse().map(v => ({
            key:              String(v.version),
            version:          v.version,
            versionLabel:     'v' + v.version + '.0',
            date:             v.date,
            displayTotal:     '$' + v.total.toLocaleString('fr-FR'),
            isCurrentVersion: v.version === q.currentVersion,
            iconCls:          v.version === q.currentVersion ? 'nqs-vh-icon nqs-vh-icon-active' : 'nqs-vh-icon',
            isExpanded:       this._expandedVersion === v.version,
            expandBtnLabel:   this._expandedVersion === v.version ? '▲ Masquer' : '▼ Détails',
            expandProducts:   (v.products || []).map((p, i) => ({
                key:         p.product.id || String(i),
                productName: p.product.name + ' ×' + p.quantity,
                lineTotal:   '$' + (p.product.price * p.quantity).toLocaleString('fr-FR')
            }))
        }));
    }

    get selectedQuoteHasVersions() { return this.selectedQuoteVersions.length > 0; }

    // ── Computed: messages ─────────────────────────────────────────────────────
    get hasMessages() { return this._messages.length > 0; }
    get formattedMessages() {
        return this._messages.map(m => ({
            ...m,
            rowCls:        m.sender === 'user' ? 'nqs-msg-row nqs-msg-row-user' : 'nqs-msg-row',
            bubbleCls:     m.sender === 'user' ? 'nqs-bubble nqs-bubble-user' : 'nqs-bubble nqs-bubble-rep',
            timeCls:       m.sender === 'user' ? 'nqs-msg-time nqs-msg-time-user' : 'nqs-msg-time',
            avatarCls:     m.sender === 'user' ? 'nqs-avatar nqs-avatar-user' : 'nqs-avatar nqs-avatar-rep',
            avatarInitial: m.sender === 'user' ? 'M' : 'S'
        }));
    }

    // ── Computed: misc ─────────────────────────────────────────────────────────
    get signDisabled()    { return !this._signature.trim() || this._isDeciding; }
    get decideDisabled()  { return this._isDeciding; }
    get formCompany()     { return this._formCompany;     }
    get formEmail()       { return this._formEmail;       }
    get formQty()         { return this._formQty;         }
    get formMessage()     { return this._formMessage;     }
    get formSubmitting()  { return this._formSubmitting;  }
    get formSubmitLabel() { return this._formSubmitting ? 'Envoi en cours...' : 'Soumettre la Demande'; }
    get messageInput()    { return this._messageInput;    }
    get signature()       { return this._signature;       }
    get rejectReason()    { return this._rejectReason;    }
    get showNewForm()     { return this._showNewForm;     }
    get isFormStep()      { return this._formStep === 'form';    }
    get isSuccessStep()   { return this._formStep === 'success'; }

    // ── Handlers: filter ──────────────────────────────────────────────────────
    handleFilterChange(e) { this.filter = e.currentTarget.dataset.id; }

    // ── Handlers: detail modal ────────────────────────────────────────────────
    handleOpenDetail(e) {
        const id = e.currentTarget.dataset.id;
        this._selectedQuoteId = id;
        this._modalTab        = 'details';
        this._isSigning       = false;
        this._signature       = '';
        this._showRejectForm  = false;
        this._rejectReason    = '';
        this._expandedVersion = null;
        // Seed messages from quote data (mock initial conversation)
        const q = this.activeQuotes.find(r => r.quoteId === id);
        this._messages    = q && q.messages ? q.messages.map((m, i) => ({ ...m, id: m.id || String(i) })) : [];
        this._msgCounter  = this._messages.length;
        this._messageInput = '';
    }
    handleCloseDetail() { this._selectedQuoteId = null; }
    handleStopProp(e)   { e.stopPropagation(); }

    // ── Handlers: modal tabs ──────────────────────────────────────────────────
    handleTabDetails()  { this._modalTab = 'details';  }
    handleTabMessages() { this._modalTab = 'messages'; }
    handleTabHistory()  { this._modalTab = 'history';  }

    // ── Handlers: version toggle ───────────────────────────────────────────────
    handleToggleVersion(e) {
        const v = parseInt(e.currentTarget.dataset.version, 10);
        this._expandedVersion = this._expandedVersion === v ? null : v;
    }

    // ── Handlers: messages ────────────────────────────────────────────────────
    handleMessageInput(e)   { this._messageInput = e.target.value; }
    handleMessageKeydown(e) { if (e.key === 'Enter') this._sendMessage(); }
    handleSendMessage()     { this._sendMessage(); }

    _sendMessage() {
        const txt = this._messageInput.trim();
        if (!txt) return;
        this._messages = [...this._messages, {
            id: String(++this._msgCounter), sender: 'user', text: txt,
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }];
        this._messageInput = '';
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            this._messages = [...this._messages, {
                id: String(++this._msgCounter), sender: 'rep',
                text: 'Merci pour votre message. Notre équipe commerciale vous répondra dans les meilleurs délais.',
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            }];
        }, 1500);
    }

    // ── Handlers: PDF ─────────────────────────────────────────────────────────
    handleDownloadPDF()     { this._toast('PDF', 'Génération du PDF en cours...', 'info'); }
    handleDownloadPDFCard(e) {
        e.stopPropagation();
        this._toast('PDF', 'Génération du PDF en cours...', 'info');
    }

    // ── Handlers: accept / sign ───────────────────────────────────────────────
    handleAcceptQuote()     { this._isSigning = true; }
    handleSignatureInput(e) { this._signature = e.target.value; }
    handleCancelSign()      { this._isSigning = false; this._signature = ''; }

    handleConfirmSign() {
        if (this._isMock(this._selectedQuoteId)) {
            this._updateMockStatus(this._selectedQuoteId, 'Signed');
            this._isSigning  = false;
            this._signature  = '';
            this._selectedQuoteId = null;
            this._toast('Contrat Signé ✓', 'Votre signature a été enregistrée.', 'success');
            return;
        }
        this._isDeciding = true;
        processQuoteDecision({ quoteId: this._selectedQuoteId, decision: 'Accepted', reason: '' })
            .then(() => { this._isSigning = false; this._signature = ''; return refreshApex(this._quotesWireResult); })
            .then(() => { this._isDeciding = false; this._selectedQuoteId = null; this._toast('Devis Accepté ✓', 'Votre devis a été accepté. Le contrat est en cours.', 'success'); })
            .catch(err => { this._isDeciding = false; this._toast('Erreur', err.body?.message || 'Une erreur est survenue.', 'error'); });
    }

    // ── Handlers: reject ──────────────────────────────────────────────────────
    handleShowRejectForm()  { this._showRejectForm = true; }
    handleRejectReason(e)   { this._rejectReason = e.target.value; }
    handleCancelReject()    { this._showRejectForm = false; this._rejectReason = ''; }

    handleConfirmReject() {
        if (this._isMock(this._selectedQuoteId)) {
            this._updateMockStatus(this._selectedQuoteId, 'Rejected');
            this._showRejectForm = false; this._rejectReason = '';
            this._selectedQuoteId = null;
            this._toast('Devis Refusé', 'Votre décision a été enregistrée.', 'info');
            return;
        }
        this._isDeciding = true;
        processQuoteDecision({ quoteId: this._selectedQuoteId, decision: 'Rejected', reason: this._rejectReason })
            .then(() => { this._showRejectForm = false; this._rejectReason = ''; return refreshApex(this._quotesWireResult); })
            .then(() => { this._isDeciding = false; this._selectedQuoteId = null; this._toast('Devis Refusé', 'Votre décision a été enregistrée.', 'info'); })
            .catch(err => { this._isDeciding = false; this._toast('Erreur', err.body?.message || 'Une erreur est survenue.', 'error'); });
    }

    // ── Handlers: new quote form ───────────────────────────────────────────────
    handleOpenNewForm()  { this._showNewForm = true; this._formStep = 'form'; }
    handleCloseNewForm() {
        this._showNewForm = false; this._formStep = 'form';
        this._formCompany = ''; this._formEmail = ''; this._formQty = '10';
        this._formMessage = ''; this._formSubmitting = false;
    }
    handleFormCompany(e) { this._formCompany = e.target.value; }
    handleFormEmail(e)   { this._formEmail   = e.target.value; }
    handleFormQty(e)     { this._formQty     = e.target.value; }
    handleFormMessage(e) { this._formMessage = e.target.value; }

    handleFormSubmit(e) {
        e.preventDefault();
        this._formSubmitting = true;
        requestQuote({ companyName: this._formCompany, email: this._formEmail, qty: this._formQty, message: this._formMessage })
            .then(() => { this._formSubmitting = false; this._formStep = 'success'; })
            .catch(err => { this._formSubmitting = false; this._toast('Erreur', err.body?.message || 'Une erreur est survenue.', 'error'); });
    }

    // ── Private helpers ───────────────────────────────────────────────────────
    _isMock(id) { return id && String(id).startsWith('MOCK-'); }

    _updateMockStatus(id, newStatus) {
        this._quotes = this.activeQuotes.map(q =>
            q.quoteId === id
                ? { ...q, status: newStatus, canDecide: false, isAccepted: newStatus === 'Signed' || newStatus === 'Accepted', isRejected: newStatus === 'Rejected' }
                : q
        );
        this._sfDataLoaded = true;
    }

    _toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
