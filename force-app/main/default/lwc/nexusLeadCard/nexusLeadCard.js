import { LightningElement, api } from 'lwc';

/**
 * nexusLeadCard — standalone card for a single unconverted lead.
 *
 * @api leadId   — Salesforce Lead record Id
 * @api leadName — full name string (pre-computed by Apex: "FirstName LastName")
 * @api company  — company / account name
 * @api initials — 1-2 char initials (pre-computed by Apex)
 * @api score    — AI lead score, integer 0-100
 *
 * Fires:
 *   viewlead    — bubbles, detail: { leadId }
 *   convertlead — bubbles, detail: { leadId }
 */
export default class NexusLeadCard extends LightningElement {
    @api leadId   = '';
    @api leadName = '';
    @api company  = '';
    @api initials = '';
    @api score    = 0;

    // ── Score tier helpers ────────────────────────────────────────────────────

    get _high()   { return this.score >= 80; }
    get _medium() { return this.score >= 60 && this.score < 80; }

    // ── Computed CSS classes ──────────────────────────────────────────────────

    get topBarClass() {
        return this._high   ? 'nlc-top-bar nlc-top-bar--green' :
               this._medium ? 'nlc-top-bar nlc-top-bar--amber' :
                              'nlc-top-bar nlc-top-bar--rose';
    }

    get dotClass() {
        return this._high   ? 'nlc-dot nlc-dot--green' :
               this._medium ? 'nlc-dot nlc-dot--amber' :
                              'nlc-dot nlc-dot--rose';
    }

    get scoreValueClass() {
        return this._high   ? 'nlc-score-value nlc-score-value--green' :
               this._medium ? 'nlc-score-value nlc-score-value--amber' :
                              'nlc-score-value nlc-score-value--rose';
    }

    get barClass() {
        return this._high   ? 'nlc-bar nlc-bar--green' :
               this._medium ? 'nlc-bar nlc-bar--amber' :
                              'nlc-bar nlc-bar--rose';
    }

    get barStyle() {
        return `width: ${Math.min(Math.max(this.score, 0), 100)}%`;
    }

    // ── Handlers ──────────────────────────────────────────────────────────────

    handleView() {
        this.dispatchEvent(new CustomEvent('viewlead', {
            detail:  { leadId: this.leadId },
            bubbles: true
        }));
    }

    handleConvert() {
        this.dispatchEvent(new CustomEvent('convertlead', {
            detail:  { leadId: this.leadId },
            bubbles: true
        }));
    }
}
