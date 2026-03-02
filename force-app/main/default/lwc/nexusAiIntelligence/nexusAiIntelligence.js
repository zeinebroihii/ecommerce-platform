import { LightningElement, api, track } from 'lwc';

const DEFAULT_INSIGHTS = [
    {
        id: 'stock',
        iconName: 'utility:product',
        category: 'Stock Optimization',
        labelClass: 'ai-insight-label ai-insight-label--danger',
        text: 'Predictive analysis suggests a',
        highlight: '40% stockout risk',
        highlightClass: 'ai-highlight--danger',
        textSuffix: ' for Sensor X1 in Region A.',
    },
    {
        id: 'sales',
        iconName: 'utility:trending',
        category: 'Sales Acceleration',
        labelClass: 'ai-insight-label ai-insight-label--success',
        text: 'Lead "Alice Vasseur" has a',
        highlight: '92% conversion probability',
        highlightClass: 'ai-highlight--success',
        textSuffix: '.',
    },
];

/**
 * nexusAiIntelligence — Nexus AI Intelligence dark panel widget.
 *
 * Usage:
 *   <c-nexus-ai-intelligence insights-data={myInsights}>
 *   </c-nexus-ai-intelligence>
 *
 * Fires a "notify" CustomEvent when the "Notify Sales Agents" button is clicked.
 * Listen with: onnotify={handleNotify}
 *
 * insightsData: Array of insight objects (see DEFAULT_INSIGHTS for shape).
 * If not provided, default mock insights are displayed.
 */
export default class NexusAiIntelligence extends LightningElement {
    /**
     * Optional array of insight objects to display.
     * Each object: { id, iconName, category, labelClass, text, highlight, highlightClass, textSuffix }
     */
    @api insightsData;

    @track _notified = false;

    get insights() {
        return this.insightsData || DEFAULT_INSIGHTS;
    }

    get notifyIcon() {
        return this._notified ? 'utility:check' : 'utility:notification';
    }

    get notifyLabel() {
        return this._notified ? 'Summary Sent!' : 'Notify Sales Agents';
    }

    get notifyBtnClass() {
        return this._notified ? 'ai-btn ai-btn--sent' : 'ai-btn';
    }

    handleNotify() {
        if (this._notified) return;
        this._notified = true;

        // Fire custom event so parent can react (e.g. show a toast)
        this.dispatchEvent(new CustomEvent('notify', { bubbles: true }));

        // Reset after 3 seconds
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            this._notified = false;
        }, 3000);
    }
}
