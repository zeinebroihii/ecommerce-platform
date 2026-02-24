import { LightningElement, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id';
import ACCOUNT_ID_FIELD from '@salesforce/schema/User.AccountId';
import getMyOpportunities from '@salesforce/apex/OpportunityController.getMyOpportunities';

// Must match STAGE_ORDER in OpportunityController.cls
const STAGE_ORDER = [
    { name: 'Working',              label: 'Enquiry'   },
    { name: 'Quote Sent',           label: 'Quote'     },
    { name: 'Quote Accepted',       label: 'Accepted'  },
    { name: 'Contract In Progress', label: 'Contract'  },
    { name: 'Contract Signed',      label: 'Signed'    },
    { name: 'Closed Won',           label: 'Complete'  }
];

export default class OpportunityTracker extends LightningElement {

    userId = Id;
    @track accountId;
    @track opportunities = [];
    @track isLoading = true;

    @wire(getRecord, { recordId: '$userId', fields: [ACCOUNT_ID_FIELD] })
    wiredUser({ data }) {
        if (data) {
            this.accountId = getFieldValue(data, ACCOUNT_ID_FIELD);
        }
    }

    @wire(getMyOpportunities, { accountId: '$accountId' })
    wiredOpps({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.opportunities = data.map(o => this._enrichOpp(o));
        } else if (error) {
            console.error('opportunityTracker error:', error);
        }
    }

    get hasOpportunities() { return !this.isLoading && this.opportunities.length > 0; }
    get noOpportunities()  { return !this.isLoading && this.opportunities.length === 0; }

    // ── Enrich each opportunity with display data ─────────────────────────
    _enrichOpp(o) {
        const idx      = o.stageIndex ?? 0;
        const total    = STAGE_ORDER.length;
        const progress = Math.round(((idx + 1) / total) * 100);

        return {
            ...o,
            formattedAmount: o.amount ? Number(o.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 }) : null,
            progressStyle:   `width: ${progress}%`,
            stageBadgeClass: this._badgeClass(o.stageName, o.isLost),
            statusDotClass:  `status-dot ${o.isLost ? 'dot-lost' : o.isWon ? 'dot-won' : 'dot-active'}`,
            stageSteps: STAGE_ORDER.map((s, i) => ({
                name:     s.name,
                label:    s.label,
                index:    i + 1,
                isDone:   i <= idx && !o.isLost,
                isCurrent:i === idx && !o.isClosed,
                stepClass:`step-item ${i < idx ? 'step-done' : i === idx && !o.isClosed ? 'step-current' : 'step-pending'}`,
                dotClass: `step-dot ${i < idx ? 'dot-done' : i === idx && !o.isClosed ? 'dot-current' : 'dot-pending'}`
            }))
        };
    }

    _badgeClass(stage, isLost) {
        if (isLost)                          return 'stage-badge badge-lost';
        if (stage === 'Closed Won')          return 'stage-badge badge-won';
        if (stage === 'Quote Accepted' || stage === 'Contract Signed') return 'stage-badge badge-success';
        if (stage === 'Quote Sent' || stage === 'Contract In Progress') return 'stage-badge badge-info';
        return 'stage-badge badge-default';
    }
}
