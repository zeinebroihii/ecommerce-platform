import { LightningElement, api, track } from 'lwc';

export default class NexusPortalQuoteModal extends LightningElement {

    // ── isVisible uses getter/setter so the close button can
    //    self-dismiss without violating the @api mutation rule ───────
    @track _isVisible = false;

    @api
    get isVisible() { return this._isVisible; }
    set isVisible(val) { this._isVisible = val; }

    @api isLoading            = false;
    @api quoteId              = 'QT-2024-001';
    @api discountPercent      = 0;       // e.g. 10
    @api paymentTerms         = 'Net 30';
    @api validUntil           = '+30 jours';
    @api quoteTotal           = 0;       // numeric total
    @api acceptanceProbability = 85;    // 0-100
    @api recipientEmail       = 'votre compte';

    // ── computed ───────────────────────────────────────────────────
    get discountLabel() {
        const d = parseFloat(this.discountPercent || 0);
        return d > 0 ? d + '% Bulk' : 'Aucune';
    }

    get quoteTotalLabel() {
        const t = parseFloat(this.quoteTotal || 0);
        return '$' + t.toLocaleString('fr-FR');
    }

    get probabilityBarStyle() {
        const pct = Math.min(100, Math.max(0, parseInt(this.acceptanceProbability || 0, 10)));
        const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
        return `width:${pct}%; background:${color};`;
    }

    // ── handlers ───────────────────────────────────────────────────
    handleClose() {
        this._isVisible = false;   // self-close immediately
        this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
    }

    handleViewQuote() {
        this.dispatchEvent(new CustomEvent('viewquote', {
            bubbles: true,
            detail: { quoteId: this.quoteId }
        }));
    }

    handleOverlayClick() {
        this.handleClose();
    }

    stopPropagation(evt) {
        evt.stopPropagation();
    }
}
