import { LightningElement, api } from 'lwc';

function formatMoney(v) {
    if (!v && v !== 0) return '—';
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M€';
    if (v >= 1_000)     return (v / 1_000).toFixed(1) + ' K€';
    return v.toLocaleString('fr-FR') + ' €';
}

const MOCK_OPPORTUNITIES = [
    { id: 'o1', name: 'TechFlow — Expansion Capteurs',    stage: 'Qualification', amount: 45000, status: 'Open' },
    { id: 'o2', name: 'Green Energy — Solaire Connecté',  stage: 'Negotiation',   amount: 85000, status: 'Open' },
    { id: 'o3', name: 'AutoPart — Prototype V3',          stage: 'Prospecting',   amount: 12000, status: 'Open' },
];

/**
 * nexusTopOpportunities — Top open opportunities widget.
 *
 * Usage (pass data from parent):
 *   <c-nexus-top-opportunities opportunities-data={myOpps}>
 *   </c-nexus-top-opportunities>
 *
 * Usage (standalone with mock data — useful on App Pages):
 *   <c-nexus-top-opportunities></c-nexus-top-opportunities>
 *
 * opportunitiesData: Array of { id, name, stage, amount, status }
 *   — accepts both JS camelCase and Salesforce SOQL PascalCase field names.
 *   — filters automatically to status === 'Open'.
 *   — if not provided, falls back to built-in mock data.
 *
 * Fires an "oppselect" CustomEvent with { detail: { id } } on card click.
 */
export default class NexusTopOpportunities extends LightningElement {
    /**
     * Opportunity records to display.
     * Accepts: { id/Id, name/Name, stage/StageName, amount/Amount, status/StageName }
     * If omitted, shows mock data.
     */
    @api opportunitiesData;

    get opportunities() {
        const src = this.opportunitiesData || MOCK_OPPORTUNITIES;
        return src
            .filter(o => {
                const status = o.status || o.IsClosed;
                // Keep if status is 'Open' or no status field (assume open)
                return !status || status === 'Open';
            })
            .map(o => ({
                id:              o.id  || o.Id,
                name:            o.name || o.Name,
                stage:           o.stage || o.StageName,
                formattedAmount: formatMoney(o.amount || o.Amount),
            }));
    }

    get hasOpportunities() {
        return this.opportunities.length > 0;
    }

    handleOppClick(event) {
        const id = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('oppselect', {
            bubbles: true,
            detail: { id },
        }));
    }
}
