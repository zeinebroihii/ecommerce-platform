import { LightningElement, api, track } from 'lwc';
import requestQuote from '@salesforce/apex/QuoteController.requestQuote';

export default class NexusB2BQuoteForm extends LightningElement {

    @api product = null;

    @track companyName  = '';
    @track email        = '';
    @track quantity     = '10';
    @track industry     = 'Technology';
    @track message      = '';
    @track isSuccess    = false;
    @track isSubmitting = false;

    /* ── Computed ── */

    get hasProduct() { return !!this.product; }

    /* ── Handlers ── */

    handleInput(event) {
        const field = event.currentTarget.dataset.field;
        this[field] = event.target.value;
    }

    handleIndustry(event) {
        this.industry = event.target.value;
    }

    handleOverlayClick() { this._close(); }

    stopPropagation(event) { event.stopPropagation(); }

    handleClose() { this._close(); }

    async handleSubmit() {
        if (!this.companyName || !this.email) return;
        this.isSubmitting = true;
        try {
            await requestQuote({
                companyName : this.companyName,
                email       : this.email,
                qty         : this.quantity,
                message     : this.message
            });
        } catch (err) {
            console.error('nexusB2BQuoteForm – requestQuote error:', err);
        }
        this.isSubmitting = false;
        this.isSuccess    = true;
        this.dispatchEvent(new CustomEvent('submit', {
            detail   : { companyName: this.companyName, email: this.email },
            bubbles  : true,
            composed : true
        }));
    }

    /* ── Private ── */

    _close() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }
}
