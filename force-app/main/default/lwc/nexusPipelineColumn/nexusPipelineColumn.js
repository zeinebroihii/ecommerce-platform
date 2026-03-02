import { LightningElement, api } from 'lwc';

/**
 * nexusPipelineColumn — one stage column in the Sales Pipeline kanban.
 *
 * @api: stageName  (String) — displayed label e.g. 'PROSPECTING'
 *       stageColor (String) — 'indigo' | 'emerald'
 *       opportunities (Array) — list of OpportunityDetail objects from parent
 */
export default class NexusPipelineColumn extends LightningElement {
    @api stageName     = '';
    @api stageColor    = 'indigo';
    @api opportunities = [];

    get _opps()            { return this.opportunities || []; }
    get count()            { return this._opps.length; }
    get hasOpportunities() { return this.count > 0; }

    get dotClass() {
        return this.stageColor === 'emerald'
            ? 'npco-dot npco-dot--emerald'
            : 'npco-dot npco-dot--indigo';
    }
}
