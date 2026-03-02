import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getCases from '@salesforce/apex/LeadManagementController.getCases';

/**
 * nexusSupportBoard — Support & Cases board.
 * Wires to LeadManagementController.getCases().
 * Left: case list (c-nexus-case-card)
 * Right: AI insights panel (c-nexus-support-insights)
 */
export default class NexusSupportBoard extends NavigationMixin(LightningElement) {
    @track _cases = [];

    @wire(getCases)
    wiredCases({ data }) {
        if (data) this._cases = data;
    }

    get filteredCases() { return this._cases; }
    get isEmpty()       { return this._cases.length === 0; }
    get hasCases()      { return this._cases.length > 0; }

    handleViewHistory(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: event.detail.caseId, actionName: 'view' }
        });
    }

    handleScheduleMeeting(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: event.detail.caseId, actionName: 'view' }
        });
    }
}
