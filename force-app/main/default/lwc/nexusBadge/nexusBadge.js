import { LightningElement, api } from 'lwc';

/**
 * NexusBadge — UI primitive
 * Translated from React NexusBadge.tsx
 *
 * @api variant  'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
 *               Default: 'primary'
 *
 * Usage:
 *   <c-nexus-badge variant="success">Active</c-nexus-badge>
 */
export default class NexusBadge extends LightningElement {
    @api variant = 'primary';

    get computedClass() {
        const variantMap = {
            primary:   'nb-badge nb-badge--primary',
            secondary: 'nb-badge nb-badge--secondary',
            success:   'nb-badge nb-badge--success',
            warning:   'nb-badge nb-badge--warning',
            danger:    'nb-badge nb-badge--danger',
            ghost:     'nb-badge nb-badge--ghost',
        };
        return variantMap[this.variant] || variantMap.primary;
    }
}
