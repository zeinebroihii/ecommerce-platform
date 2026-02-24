import { LightningElement, wire, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id';
import ACCOUNT_ID_FIELD from '@salesforce/schema/User.AccountId';
import FIRSTNAME_FIELD   from '@salesforce/schema/User.FirstName';
import LASTNAME_FIELD    from '@salesforce/schema/User.LastName';
import getPortalSummary from '@salesforce/apex/PortalHomeController.getPortalSummary';

// 6 customer-facing stages — full B2B sales cycle
const STAGE_JOURNEY = [
    { id: 'order',    label: 'Attente commande',     num: '1' },
    { id: 'quote',    label: 'Devis en cours',       num: '2' },
    { id: 'decision', label: 'D\u00e9cision devis',  num: '3' },
    { id: 'contract', label: 'Contrat en cours',     num: '4' },
    { id: 'sign',     label: 'Signature en attente', num: '5' },
    { id: 'done',     label: 'F\u00e9licitations !', num: '6' }
];

// Maps Salesforce Opportunity StageName → 0-based journey index
const STAGE_MAP = {
    'Needs Analysis':       0,   // order received, working on quote
    'Value Proposition':    1,   // quote being built
    'Proposal/Price Quote': 1,
    'Presented':            2,   // quote sent, awaiting customer decision
    'Id. Decision Makers':  2,
    'Contract In Progress': 3,   // quote accepted, contract being prepared
    'Perception Analysis':  4,   // contract sent for signature
    'Negotiation/Review':   4,
    'Closed Won':           5,   // fully complete
    'Closed Lost':          2    // sits at decision stage
};

export default class CustomerPortalHome extends NavigationMixin(LightningElement) {

    @api dealsUrl   = '/shop/s/mes-offres';
    @api ordersUrl  = '/shop/s/mes-commandes';
    @api supportUrl = '/shop/s/support';
    @api catalogUrl = '/shop/s/catalogue';

    userId = Id;
    @track accountId;
    @track firstName = '';
    @track lastName  = '';
    @track summary   = { activeDeals: 0, totalOrders: 0, openCases: 0, latestOppStage: '—' };

    @wire(getRecord, { recordId: '$userId', fields: [ACCOUNT_ID_FIELD, FIRSTNAME_FIELD, LASTNAME_FIELD] })
    wiredUser({ data }) {
        if (data) {
            this.accountId = getFieldValue(data, ACCOUNT_ID_FIELD);
            this.firstName = getFieldValue(data, FIRSTNAME_FIELD) || '';
            this.lastName  = getFieldValue(data, LASTNAME_FIELD)  || '';
        }
    }

    @wire(getPortalSummary, { accountId: '$accountId' })
    wiredSummary({ data }) {
        if (data) this.summary = { ...data, latestOppStage: data.latestOppStage || '—' };
    }

    get initials() {
        return ((this.firstName[0] || '') + (this.lastName[0] || '')).toUpperCase() || '?';
    }

    get journeySteps() {
        const stageIdx = STAGE_MAP[this.summary.latestOppStage] ?? 0;
        return STAGE_JOURNEY.map((s, i) => {
            const isDone   = i < stageIdx;
            const isActive = i === stageIdx;
            return {
                ...s,
                done:      isDone,
                active:    isActive,
                wrapClass: 'j-step ' + (isDone ? 'j-step-done' : isActive ? 'j-step-active' : 'j-step-pending'),
                dotClass:  'j-dot '  + (isDone ? 'j-dot-done'  : isActive ? 'j-dot-active'  : 'j-dot-pending')
            };
        });
    }

    get journeyProgressStyle() {
        const stageIdx = STAGE_MAP[this.summary.latestOppStage] ?? 0;
        const pct = Math.round((stageIdx / (STAGE_JOURNEY.length - 1)) * 100);
        return `width: ${pct}%`;
    }

    _nav(url) {
        this[NavigationMixin.Navigate]({ type: 'standard__webPage', attributes: { url } });
    }

    goDeals()   { this._nav(this.dealsUrl);   }
    goOrders()  { this._nav(this.ordersUrl);  }
    goSupport() { this._nav(this.supportUrl); }
    goCatalog() { this._nav(this.catalogUrl); }
}
