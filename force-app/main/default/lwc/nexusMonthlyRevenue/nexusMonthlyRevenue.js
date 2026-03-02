import { LightningElement, api } from 'lwc';

function formatMoney(v) {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M€';
    if (v >= 1_000)     return (v / 1_000).toFixed(1) + ' K€';
    return v.toLocaleString('fr-FR') + ' €';
}

/**
 * nexusMonthlyRevenue — KPI card showing monthly revenue.
 *
 * @api revenueAmount — raw number in euros. Defaults to 285000 (285.0 K€).
 * @api trend         — trend label string. Defaults to "+18%".
 */
export default class NexusMonthlyRevenue extends LightningElement {
    @api revenueAmount = 285000;
    @api trend = '+18%';

    get formattedRevenue() {
        return formatMoney(Number(this.revenueAmount));
    }
}
