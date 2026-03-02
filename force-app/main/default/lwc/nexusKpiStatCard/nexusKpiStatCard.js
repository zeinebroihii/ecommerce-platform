import { LightningElement, api } from 'lwc';

/**
 * nexusKpiStatCard — Reusable KPI stat card widget.
 *
 * Usage:
 *   <c-nexus-kpi-stat-card
 *       label="Pipeline Value"
 *       value="1.4 M€"
 *       icon-name="utility:trending"
 *       trend="+12%"
 *       trend-up
 *       color-variant="primary">
 *   </c-nexus-kpi-stat-card>
 *
 * color-variant: "primary" | "success" | "danger" | "warning"
 */
export default class NexusKpiStatCard extends LightningElement {
    /** Display label shown below the value e.g. "Pipeline Value" */
    @api label = '';

    /** Formatted value string e.g. "1.4 M€", "1284", "68%" */
    @api value = '';

    /** Lightning Design System icon name e.g. "utility:trending" */
    @api iconName = 'utility:metrics';

    /** Trend label string e.g. "+12%", "-2" */
    @api trend = '';

    /** True = upward trend (green arrow), false = downward trend (red arrow) */
    @api trendUp = false;

    /**
     * Color variant for the icon and accent.
     * Accepted values: "primary" | "success" | "danger" | "warning"
     */
    @api colorVariant = 'primary';

    get cardClass() {
        return 'kpi-card';
    }

    get iconWrapClass() {
        return `kpi-icon kpi-icon--${this.colorVariant}`;
    }

    get trendClass() {
        return this.trendUp ? 'kpi-trend kpi-trend--up' : 'kpi-trend kpi-trend--down';
    }

    get blobClass() {
        return `kpi-blob kpi-blob--${this.colorVariant}`;
    }
}
