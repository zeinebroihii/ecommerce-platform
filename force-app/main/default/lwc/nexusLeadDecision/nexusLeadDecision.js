import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex }              from '@salesforce/apex';
import { ShowToastEvent }           from 'lightning/platformShowToastEvent';

import AI_SCORE_FIELD    from '@salesforce/schema/Lead.AIScore__c';
import AI_REASON_FIELD   from '@salesforce/schema/Lead.AIReason__c';
import DECISION_FIELD    from '@salesforce/schema/Lead.AdminDecision__c';
import INTENT_FIELD      from '@salesforce/schema/Lead.Intent__c';
import COMPANY_FIELD     from '@salesforce/schema/Lead.Company';
import STATUS_FIELD      from '@salesforce/schema/Lead.Status';

const FIELDS = [AI_SCORE_FIELD, AI_REASON_FIELD, DECISION_FIELD, INTENT_FIELD, COMPANY_FIELD, STATUS_FIELD];

export default class NexusLeadDecision extends LightningElement {
    @api recordId;
    @track isRefreshing = false;

    _wiredResult;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredLead(result) {
        this._wiredResult = result;
    }

    // ── Getters ───────────────────────────────────────────────────────────────
    get isLoading() { return !this._wiredResult || (!this._wiredResult.data && !this._wiredResult.error); }

    get score()      { return this._wiredResult?.data ? (getFieldValue(this._wiredResult.data, AI_SCORE_FIELD) ?? '—') : '—'; }
    get reason()     { return this._wiredResult?.data ? getFieldValue(this._wiredResult.data, AI_REASON_FIELD) : null; }
    get decision()   { return this._wiredResult?.data ? getFieldValue(this._wiredResult.data, DECISION_FIELD)  : null; }
    get intent()     { return this._wiredResult?.data ? getFieldValue(this._wiredResult.data, INTENT_FIELD)    : null; }
    get leadStatus() { return this._wiredResult?.data ? getFieldValue(this._wiredResult.data, STATUS_FIELD)    : null; }

    get hasReason()  { return !!this.reason; }
    get hasIntent()  { return !!this.intent; }
    get isPending()  { return !this.decision || this.decision === 'Pending'; }

    get scoreNum() {
        const s = getFieldValue(this._wiredResult?.data, AI_SCORE_FIELD);
        return s != null ? Number(s) : null;
    }

    get scoreRingClass() {
        const n = this.scoreNum;
        if (n == null) return 'nld-score-ring nld-ring-neutral';
        return n >= 80 ? 'nld-score-ring nld-ring-green'
             : n >= 60 ? 'nld-score-ring nld-ring-amber'
             :            'nld-score-ring nld-ring-red';
    }

    get scoreLabelClass() {
        const n = this.scoreNum;
        if (n == null) return 'nld-score-label';
        return n >= 80 ? 'nld-score-label nld-label-green'
             : n >= 60 ? 'nld-score-label nld-label-amber'
             :            'nld-score-label nld-label-red';
    }

    get scoreLabel() {
        const n = this.scoreNum;
        if (n == null) return 'En attente de scoring';
        return n >= 80 ? 'Haute intention — Conversion recommandée'
             : n >= 60 ? 'Intention modérée — À qualifier'
             :            'Score faible — À surveiller';
    }

    get decisionLabel() {
        const d = this.decision;
        if (!d || d === 'Pending') return 'En attente';
        return d === 'Approved' ? 'Approuvé' : 'Rejeté';
    }

    get decisionBadgeClass() {
        const d = this.decision;
        if (!d || d === 'Pending') return 'nld-decision-badge nld-badge-pending';
        return d === 'Approved' ? 'nld-decision-badge nld-badge-approved' : 'nld-decision-badge nld-badge-rejected';
    }

    // ── Handlers ──────────────────────────────────────────────────────────────
    async handleCopyPrompt() {
        const prompt = `Analyse ce lead et mets à jour ses champs : ${this.recordId}`;
        try {
            await navigator.clipboard.writeText(prompt);
            this.dispatchEvent(new ShowToastEvent({
                title: '✓ Prompt copié',
                message: `Ctrl+V dans l'agent : "${prompt}"`,
                variant: 'info',
                mode: 'sticky'
            }));
        } catch(e) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Nexus Lead Analyst',
                message: `Copiez ce texte dans l'agent → ${prompt}`,
                variant: 'info',
                mode: 'sticky'
            }));
        }
    }

    async handleRefresh() {
        this.isRefreshing = true;
        try {
            await refreshApex(this._wiredResult);
        } finally {
            this.isRefreshing = false;
        }
    }

}
