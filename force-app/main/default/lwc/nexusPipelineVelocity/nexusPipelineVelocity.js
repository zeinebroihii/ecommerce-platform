import { LightningElement, api } from 'lwc';

const MAX_AMOUNT = 500_000;

function formatMoney(v) {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M€';
    if (v >= 1_000)     return (v / 1_000).toFixed(1) + ' K€';
    return v.toLocaleString('fr-FR') + ' €';
}

const DEFAULT_STAGES = [
    { label: 'Prospecting',  amount: 120000, count: 12, color: '#6366f1' },
    { label: 'Qualification',amount: 245000, count: 8,  color: '#8b5cf6' },
    { label: 'Negotiation',  amount: 310000, count: 5,  color: '#a78bfa' },
    { label: 'Closed Won',   amount: 450000, count: 15, color: '#10b981' },
];

/**
 * nexusPipelineVelocity — Pipeline stage velocity widget.
 *
 * Usage:
 *   <c-nexus-pipeline-velocity period="Q1 2024" stages={myStages}>
 *   </c-nexus-pipeline-velocity>
 *
 * stages: Array of { label: String, amount: Number, count: Number, color: String }
 * If stages is not provided, default mock data is used.
 */
export default class NexusPipelineVelocity extends LightningElement {
    /** Quarter / period label shown in the header */
    @api period = 'Q1 2024';

    /**
     * Array of stage objects:
     * { label: String, amount: Number, count: Number, color: String }
     */
    @api stagesData;

    get stages() {
        const src = this.stagesData || DEFAULT_STAGES;
        return src.map(s => ({
            label:           s.label,
            count:           s.count,
            formattedAmount: formatMoney(s.amount),
            barStyle:        `width:${Math.min((s.amount / MAX_AMOUNT) * 100, 100)}%; background:${s.color};`,
        }));
    }
}
