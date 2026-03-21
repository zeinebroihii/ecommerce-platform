import { LightningElement, api } from 'lwc';

export default class NexusPortalRecentActivity extends LightningElement {

    @api cardTitle = 'Activités Récentes';

    @api activity1Number = '#ORD-2024-001';
    @api activity1Date   = 'Shipped February 24, 2024';
    @api activity1Price  = '$1,240.00';
    @api activity1Status = 'Delivered';

    @api activity2Number = '#ORD-2024-002';
    @api activity2Date   = 'Shipped February 22, 2024';
    @api activity2Price  = '$3,200.00';
    @api activity2Status = 'Delivered';

    @api activity3Number = '#ORD-2024-003';
    @api activity3Date   = 'In transit — Delivery February 27';
    @api activity3Price  = '$870.00';
    @api activity3Status = 'En transit';

    // ── Status badge classes ────────────────────────────────────────────
    _statusClass(status) {
        const s = (status || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (s === 'livre' || s === 'delivered' || s === 'activated') return 'npra-status npra-status--green';
        if (s.includes('transit') || s.includes('cours') || s.includes('progress')) return 'npra-status npra-status--amber';
        if (s.includes('cancel') || s.includes('annul')) return 'npra-status npra-status--red';
        return 'npra-status';
    }

    get status1Class() { return this._statusClass(this.activity1Status); }
    get status2Class() { return this._statusClass(this.activity2Status); }
    get status3Class() { return this._statusClass(this.activity3Status); }

    // ── Handlers ───────────────────────────────────────────────────────
    handleViewAll() {
        this.dispatchEvent(new CustomEvent('viewall', { bubbles: true }));
    }
    handleRow1() { this._fireSelect(this.activity1Number); }
    handleRow2() { this._fireSelect(this.activity2Number); }
    handleRow3() { this._fireSelect(this.activity3Number); }

    _fireSelect(orderNumber) {
        this.dispatchEvent(new CustomEvent('selectorder', {
            bubbles: true,
            detail: { orderNumber }
        }));
    }
}
