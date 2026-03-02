import { LightningElement, wire, track } from 'lwc';
import getOpportunities from '@salesforce/apex/LeadManagementController.getOpportunities';

const STAGES = [
    { key: 'Prospecting',   stageName: 'PROSPECTING',   stageColor: 'indigo'  },
    { key: 'Qualification', stageName: 'QUALIFICATION', stageColor: 'indigo'  },
    { key: 'Negotiation',   stageName: 'NEGOTIATION',   stageColor: 'indigo'  },
    { key: 'Closed Won',    stageName: 'CLOSED WON',    stageColor: 'emerald' },
];

/**
 * nexusSalesPipeline — Kanban board for Salesforce Opportunities.
 *
 * Wires to LeadManagementController.getOpportunities() and distributes
 * results into 4 stage columns rendered by c-nexus-pipeline-column.
 */
export default class NexusSalesPipeline extends LightningElement {
    @track _opportunities = [];

    @wire(getOpportunities)
    wiredOpps({ data }) {
        if (data) this._opportunities = data;
    }

    get columns() {
        return STAGES.map(s => ({
            key:           s.key,
            stageName:     s.stageName,
            stageColor:    s.stageColor,
            opportunities: this._opportunities.filter(o => o.stage === s.key),
        }));
    }
}
