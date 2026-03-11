import { LightningElement, track } from 'lwc';

const X0 = 50, X1 = 570, Y0 = 20, Y1 = 270;

export default class NexusTimeMachine extends LightningElement {

    @track monthsAhead = 3;

    /* ── Coordinate helpers ── */

    _toY(val)       { return Y1 - (val / 100) * (Y1 - Y0); }
    _toX(i, total)  { return X0 + (total === 0 ? 0 : (i / total) * (X1 - X0)); }

    /* ── Data generation (deterministic) ── */

    _stockValues() {
        const pts = [];
        for (let i = 0; i <= this.monthsAhead; i++) {
            pts.push(Math.max(0, 85 - i * (75 / Math.max(this.monthsAhead, 1))));
        }
        return pts;
    }

    _demandValues() {
        const pts = [];
        for (let i = 0; i <= this.monthsAhead; i++) {
            pts.push(Math.min(100, 30 + i * (55 / Math.max(this.monthsAhead, 1))));
        }
        return pts;
    }

    /* ── Chart path getters ── */

    get stockLinePath() {
        const n = this.monthsAhead;
        return this._stockValues().map((v, i) => {
            const x = this._toX(i, n);
            const y = this._toY(v);
            return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
        }).join(' ');
    }

    get stockAreaPath() {
        const n    = this.monthsAhead;
        const pts  = this._stockValues().map((v, i) => ({ x: this._toX(i, n), y: this._toY(v) }));
        const line = pts.map((p, i) => i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`).join(' ');
        return `${line} L ${pts[pts.length - 1].x},${Y1} L ${pts[0].x},${Y1} Z`;
    }

    get demandPath() {
        const n = this.monthsAhead;
        return this._demandValues().map((v, i) => {
            const x = this._toX(i, n);
            const y = this._toY(v);
            return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
        }).join(' ');
    }

    get xAxisLabels() {
        const labels = [];
        for (let i = 0; i <= this.monthsAhead; i++) {
            labels.push({
                key   : `lbl-${i}`,
                x     : this._toX(i, this.monthsAhead),
                label : i === 0 ? 'Now' : `+${i}m`
            });
        }
        return labels;
    }

    /* ── Risk / insight getters ── */

    get riskLevel() {
        if (this.monthsAhead >= 9) return 'Critical';
        if (this.monthsAhead >= 6) return 'High';
        if (this.monthsAhead >= 3) return 'Medium';
        return 'Low';
    }

    get riskBadgeCls() {
        const m = {
            Critical : 'ntm-badge ntm-badge--critical',
            High     : 'ntm-badge ntm-badge--high',
            Medium   : 'ntm-badge ntm-badge--medium',
            Low      : 'ntm-badge ntm-badge--low'
        };
        return m[this.riskLevel];
    }

    get stockoutMonth() {
        return Math.max(1, Math.ceil(this.monthsAhead * 0.65));
    }

    /* ── Handlers ── */

    handleSlider(event) {
        this.monthsAhead = parseInt(event.target.value, 10);
    }
}
