import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex }              from '@salesforce/apex';
import { ShowToastEvent }           from 'lightning/platformShowToastEvent';
import analyzeLeadWithEinstein      from '@salesforce/apex/EinsteinLeadAnalysisController.analyzeLeadWithEinstein';

import AI_SCORE_FIELD    from '@salesforce/schema/Lead.AIScore__c';
import AI_REASON_FIELD   from '@salesforce/schema/Lead.AIReason__c';
import DECISION_FIELD    from '@salesforce/schema/Lead.AdminDecision__c';
import INTENT_FIELD      from '@salesforce/schema/Lead.Intent__c';
import COMPANY_FIELD     from '@salesforce/schema/Lead.Company';
import STATUS_FIELD      from '@salesforce/schema/Lead.Status';

const FIELDS = [
    AI_SCORE_FIELD, AI_REASON_FIELD, DECISION_FIELD,
    INTENT_FIELD, COMPANY_FIELD, STATUS_FIELD
];

const SECTION_ICONS = {
    'LEGITIMACY'           : 'utility:verified',
    'B2B POTENTIAL'        : 'utility:chart',
    'COMPANY PROFILE'      : 'utility:company',
    'EXECUTIVE SUMMARY'    : 'utility:summary',
    'FINAL RECOMMENDATION' : 'utility:priority'
};

export default class NexusLeadDecision extends LightningElement {
    @api recordId;

    @track isRefreshing  = false;
    @track isAnalyzing   = false;
    @track einsteinError = null;
    @track _sections     = [];

    _wiredResult;

    // ── Wire ─────────────────────────────────────────────────────────────────

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredLead(result) {
        this._wiredResult = result;
        if (result.data && this._sections.length === 0 && !this.isAnalyzing) {
            const reason = getFieldValue(result.data, AI_REASON_FIELD);
            if (reason && reason.includes('**')) {
                // Einstein has run before — parse instantly, no API call
                this._sections = this._parseAnalysis(reason);
            } else {
                // First time — auto-trigger Einstein on page open
                this.handleAnalyzeWithEinstein();
            }
        }
    }

    // ── Field getters ─────────────────────────────────────────────────────────

    get isLoading() {
        return !this._wiredResult || (!this._wiredResult.data && !this._wiredResult.error);
    }

    get score() {
        const s = this._wiredResult?.data
            ? getFieldValue(this._wiredResult.data, AI_SCORE_FIELD)
            : null;
        return s != null ? s : '—';
    }

    get reason() {
        return this._wiredResult?.data
            ? getFieldValue(this._wiredResult.data, AI_REASON_FIELD)
            : null;
    }

    get decision() {
        return this._wiredResult?.data
            ? getFieldValue(this._wiredResult.data, DECISION_FIELD)
            : null;
    }

    get intent() {
        return this._wiredResult?.data
            ? getFieldValue(this._wiredResult.data, INTENT_FIELD)
            : null;
    }

    get leadStatus() {
        return this._wiredResult?.data
            ? getFieldValue(this._wiredResult.data, STATUS_FIELD)
            : null;
    }

    get hasIntent()  { return !!this.intent; }
    get isPending()  { return !this.decision || this.decision === 'Pending'; }

    // ── Score ring ────────────────────────────────────────────────────────────

    get scoreNum() {
        const s = this._wiredResult?.data
            ? getFieldValue(this._wiredResult.data, AI_SCORE_FIELD)
            : null;
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
        if (n == null) return 'nld-score-label nld-label-neutral';
        return n >= 80 ? 'nld-score-label nld-label-green'
             : n >= 60 ? 'nld-score-label nld-label-amber'
             :            'nld-score-label nld-label-red';
    }

    get scoreLabel() {
        const n = this.scoreNum;
        if (n == null) return 'Awaiting scoring';
        return n >= 80 ? 'High Intent · Conversion Recommended'
             : n >= 60 ? 'Moderate Intent · Needs Qualification'
             :            'Low Score · Monitor Carefully';
    }

    // ── Decision badge ────────────────────────────────────────────────────────

    get decisionLabel() {
        const d = this.decision;
        if (!d || d === 'Pending') return 'Pending';
        return d === 'Approved' ? 'Approved' : 'Rejected';
    }

    get decisionBadgeClass() {
        const d = this.decision;
        if (!d || d === 'Pending') return 'nld-decision-badge nld-badge-pending';
        return d === 'Approved'
            ? 'nld-decision-badge nld-badge-approved'
            : 'nld-decision-badge nld-badge-rejected';
    }

    // ── Einstein sections ─────────────────────────────────────────────────────

    get sections()          { return this._sections; }
    get hasSections()       { return this._sections && this._sections.length > 0; }
    get hasEinsteinError()  { return !!this.einsteinError; }

    // ── Handlers ──────────────────────────────────────────────────────────────

    handleAnalyzeWithEinstein() {
        this.isAnalyzing   = true;
        this.einsteinError = null;

        analyzeLeadWithEinstein({ leadId: this.recordId })
            .then(result => {
                this._sections = this._parseAnalysis(result);
                return refreshApex(this._wiredResult);
            })
            .catch(error => {
                // Surface the real Salesforce error message
                this.einsteinError =
                    error?.body?.message
                    || error?.body?.output?.errors?.[0]?.message
                    || error?.message
                    || JSON.stringify(error);
            })
            .finally(() => {
                this.isAnalyzing = false;
            });
    }

    async handleRefresh() {
        this.isRefreshing  = true;
        this._sections     = [];   // clear so wiredLead re-triggers Einstein
        this.einsteinError = null;
        try {
            await refreshApex(this._wiredResult);
        } finally {
            this.isRefreshing = false;
        }
    }

    async handleCopyPrompt() {
        const prompt = `Analyze this lead and update its fields: ${this.recordId}`;
        try {
            await navigator.clipboard.writeText(prompt);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Prompt copied',
                message: `Paste into the agent: "${prompt}"`,
                variant: 'info',
                mode: 'sticky'
            }));
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Nexus Lead Analyst',
                message: `Copy into the agent → ${prompt}`,
                variant: 'info',
                mode: 'sticky'
            }));
        }
    }

    // ── Section parser ────────────────────────────────────────────────────────

    _parseAnalysis(text) {
        if (!text) return [];

        const sections = [];
        const lines    = text.split('\n');
        let currentTitle = null;
        let currentLines = [];
        let idx = 0;

        const pushSection = () => {
            if (currentTitle === null) return;
            const content   = currentLines.join('\n').trim();
            const isRec     = currentTitle.includes('RECOMMENDATION');
            const icon      = SECTION_ICONS[currentTitle] || 'utility:einstein';
            const cardClass = isRec
                ? 'nld-section-card nld-section-card--rec'
                : 'nld-section-card';

            let verdict = null, verdictLabel = null, verdictClass = null;
            if (isRec) {
                if (content.includes('ACCEPT') && !content.includes('REJECT')) {
                    verdict = 'accept'; verdictLabel = 'ACCEPT';
                    verdictClass = 'nld-verdict nld-verdict-accept';
                } else if (content.includes('REJECT')) {
                    verdict = 'reject'; verdictLabel = 'REJECT';
                    verdictClass = 'nld-verdict nld-verdict-reject';
                } else if (content.includes('REVIEW')) {
                    verdict = 'review'; verdictLabel = 'REVIEW';
                    verdictClass = 'nld-verdict nld-verdict-review';
                }
            }

            sections.push({ id: idx++, title: currentTitle, content, icon, cardClass, verdict, verdictLabel, verdictClass });
        };

        for (const line of lines) {
            const match = line.match(/^\*\*(.*?)\*\*\s*$/);
            if (match) {
                pushSection();
                currentTitle = match[1].trim();
                currentLines = [];
            } else if (currentTitle !== null) {
                currentLines.push(line);
            }
        }
        pushSection();

        return sections;
    }
}
