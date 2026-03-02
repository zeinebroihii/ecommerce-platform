import { LightningElement, api } from 'lwc';

const COLOR_MAP = {
    green:   '#10b981',
    emerald: '#10b981',
    indigo:  '#818cf8',
    purple:  '#a78bfa',
    amber:   '#f59e0b',
    orange:  '#f97316',
    red:     '#ef4444',
    blue:    '#60a5fa',
    white:   '#ffffff',
};

export default class NexusPortalDashboardHero extends LightningElement {

    @api aiTag           = 'Nexus AI Intelligence';
    @api titleLine1      = 'VOTRE PORTAIL';
    @api titleHighlight  = 'INTELLIGENT';
    @api heroDescription = 'Nexus AI a analysé votre compte. Découvrez vos prévisions de consommation et vos recommandations personnalisées.';
    @api primaryBtnLabel  = 'Voir les Insights';
    @api secondaryBtnLabel = '';

    @api metric1Value = '98%';
    @api metric1Label = 'Score Santé';
    @api metric1Color = 'green';

    @api metric2Value = '15%';
    @api metric2Label = 'Économies AI';
    @api metric2Color = 'indigo';

    @api metric3Value = '+12%';
    @api metric3Label = 'Usage Prévu';
    @api metric3Color = 'amber';

    @api metric4Value = '100%';
    @api metric4Label = 'SLA Status';
    @api metric4Color = 'green';

    get showSecondary() { return !!this.secondaryBtnLabel; }

    _toHex(color) { return COLOR_MAP[(color || '').toLowerCase()] || '#ffffff'; }

    get metric1Style() { return `color:${this._toHex(this.metric1Color)}`; }
    get metric2Style() { return `color:${this._toHex(this.metric2Color)}`; }
    get metric3Style() { return `color:${this._toHex(this.metric3Color)}`; }
    get metric4Style() { return `color:${this._toHex(this.metric4Color)}`; }

    handlePrimary()   { this.dispatchEvent(new CustomEvent('primaryaction',   { bubbles: true })); }
    handleSecondary() { this.dispatchEvent(new CustomEvent('secondaryaction', { bubbles: true })); }
}
