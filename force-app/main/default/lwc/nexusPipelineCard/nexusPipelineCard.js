import { LightningElement, api } from 'lwc';

function fmtAmount(v) {
    if (!v) return '0 €';
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M€';
    if (v >= 1_000)     return (v / 1_000).toFixed(1) + ' K€';
    return Number(v).toLocaleString('fr-FR') + ' €';
}

/**
 * nexusPipelineCard — single deal card in the Sales Pipeline kanban.
 *
 * @api: oppId, oppName, account, amount (Number), closeDate (String)
 */
export default class NexusPipelineCard extends LightningElement {
    @api oppId     = '';
    @api oppName   = '';
    @api account   = '';
    @api amount    = 0;
    @api closeDate = '';

    get formattedAmount() { return fmtAmount(this.amount); }
}
