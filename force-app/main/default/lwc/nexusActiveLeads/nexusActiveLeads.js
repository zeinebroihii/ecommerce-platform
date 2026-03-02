import { LightningElement, api, wire } from 'lwc';
import getLeadsToConvert from '@salesforce/apex/LeadManagementController.getLeadsToConvert';

/**
 * nexusActiveLeads — KPI card showing the total number of active leads.
 * Wires to LeadManagementController.getLeadsToConvert() for a live count.
 *
 * @api trend  — override the trend label, e.g. "+5%". Defaults to "+5%".
 */
export default class NexusActiveLeads extends LightningElement {
    @api trend = '+5%';

    _liveCount = null;

    @wire(getLeadsToConvert)
    wiredLeads({ data }) {
        if (data) this._liveCount = data.length;
    }

    get totalLeads() {
        // Show live count if wired data is available, otherwise show default
        return this._liveCount !== null ? this._liveCount : 1284;
    }
}
