import { LightningElement, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import USER_ACCOUNT_ID from '@salesforce/schema/User.AccountId';

import getMyCases from '@salesforce/apex/CaseController.getMyCases';
import createCase from '@salesforce/apex/CaseController.createCase';

const STATUS_CLASS_MAP = {
    'New':         'badge-status new',
    'In Progress': 'badge-status in-progress',
    'Waiting':     'badge-status waiting',
    'Closed':      'badge-status closed',
};

const PRIORITY_CLASS_MAP = {
    'High':   'meta-tag priority-high',
    'Medium': 'meta-tag priority-medium',
    'Low':    'meta-tag priority-low',
};

const CASE_TYPE_OPTIONS = [
    { value: 'Technical Support', label: 'Technical Support', icon: '🔧' },
    { value: 'Return Request',    label: 'Return Request',    icon: '↩'  },
    { value: 'Billing Issue',     label: 'Billing Issue',     icon: '💳' },
];

export default class CaseManager extends LightningElement {

    // ── State ──────────────────────────────────────────────────────────────
    @track activeTab      = 'my-cases';
    @track cases          = [];
    @track isLoadingCases = true;
    @track casesError     = null;

    @track formType        = 'Technical Support';
    @track formSubject     = '';
    @track formPriority    = 'Medium';
    @track formDescription = '';
    @track formOrderRef    = '';

    @track isSubmitting  = false;
    @track submitError   = null;
    @track submitSuccess = false;
    @track newCaseNumber = '';

    userId     = USER_ID;
    _accountId = null;

    // ── Wire: User → AccountId ─────────────────────────────────────────────
    @wire(getRecord, { recordId: '$userId', fields: [USER_ACCOUNT_ID] })
    wiredUser({ data, error }) {
        if (data) {
            const acctId = data.fields.AccountId?.value;
            this._accountId = acctId;
            if (acctId) {
                this.loadCases(acctId);
            } else {
                this.isLoadingCases = false;
            }
        } else if (error) {
            this.casesError     = 'Could not identify your account.';
            this.isLoadingCases = false;
        }
    }

    // ── Load cases ─────────────────────────────────────────────────────────
    loadCases(accountId) {
        this.isLoadingCases = true;
        this.casesError     = null;
        getMyCases({ accountId })
            .then(records => {
                this.cases = records.map(c => ({
                    ...c,
                    isExpanded:    false,
                    formattedDate: this._formatDate(c.CreatedDate),
                    statusClass:   STATUS_CLASS_MAP[c.Status]   ?? 'badge-status new',
                    priorityClass: PRIORITY_CLASS_MAP[c.Priority] ?? 'meta-tag',
                    orderName:     c.Related_Order__r ? c.Related_Order__r.Name : null,
                }));
                this.isLoadingCases = false;
            })
            .catch(err => {
                this.casesError   = err?.body?.message ?? 'Failed to load cases.';
                this.isLoadingCases = false;
            });
    }

    // ── Tab getters ────────────────────────────────────────────────────────
    get isMyCasesTab()    { return this.activeTab === 'my-cases'; }
    get isNewCaseTab()    { return this.activeTab === 'new-case'; }
    get myCasesTabClass() { return 'tab-btn' + (this.activeTab === 'my-cases' ? ' active' : ''); }
    get newCaseTabClass() { return 'tab-btn' + (this.activeTab === 'new-case' ? ' active' : ''); }

    showMyCases() { this.activeTab = 'my-cases'; }
    showNewCase() {
        this.activeTab     = 'new-case';
        this.submitError   = null;
        this.submitSuccess = false;
    }

    // ── Case list computed ─────────────────────────────────────────────────
    get hasCases() {
        return !this.isLoadingCases && !this.casesError && this.cases.length > 0;
    }
    get noCases() {
        return !this.isLoadingCases && !this.casesError && this.cases.length === 0;
    }
    get openCaseCount() {
        const n = this.cases.filter(c => c.Status !== 'Closed').length;
        return n > 0 ? n : null;
    }

    handleCaseClick(event) {
        const id = event.currentTarget.dataset.id;
        this.cases = this.cases.map(c =>
            c.Id === id ? { ...c, isExpanded: !c.isExpanded } : c
        );
    }

    // ── Form computed ──────────────────────────────────────────────────────
    get caseTypeOptions() {
        return CASE_TYPE_OPTIONS.map(o => ({
            ...o,
            checked: o.value === this.formType,
        }));
    }

    // ── Form handlers ──────────────────────────────────────────────────────
    handleTypeChange(event)        { this.formType        = event.target.value; }
    handleSubjectChange(event)     { this.formSubject     = event.target.value; }
    handlePriorityChange(event)    { this.formPriority    = event.target.value; }
    handleDescriptionChange(event) { this.formDescription = event.target.value; }
    handleOrderRefChange(event)    { this.formOrderRef    = event.target.value; }

    // ── Submit ─────────────────────────────────────────────────────────────
    handleSubmit() {
        this.submitError = null;

        if (!this.formSubject.trim()) {
            this.submitError = 'Please enter a subject.';
            return;
        }
        if (!this.formDescription.trim()) {
            this.submitError = 'Please describe your issue.';
            return;
        }

        this.isSubmitting = true;

        createCase({
            caseType:    this.formType,
            subject:     this.formSubject.trim(),
            priority:    this.formPriority,
            description: this.formDescription.trim(),
            orderRef:    this.formOrderRef.trim() || null,
        })
        .then(result => {
            this.isSubmitting  = false;
            this.submitSuccess = true;
            this.newCaseNumber = result.caseNumber;
            this.formSubject     = '';
            this.formDescription = '';
            this.formOrderRef    = '';
            this.formType        = 'Technical Support';
            this.formPriority    = 'Medium';
        })
        .catch(err => {
            this.isSubmitting = false;
            this.submitError  = err?.body?.message ?? 'Failed to submit case. Please try again.';
        });
    }

    handleAfterSubmit() {
        this.submitSuccess  = false;
        this.activeTab      = 'my-cases';
        if (this._accountId) {
            this.loadCases(this._accountId);
        } else {
            this.isLoadingCases = false;
        }
    }

    // ── Utility ────────────────────────────────────────────────────────────
    _formatDate(isoString) {
        if (!isoString) return '';
        return new Date(isoString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    }
}
