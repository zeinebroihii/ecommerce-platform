import { LightningElement, api } from 'lwc';

/**
 * NexusButton — UI primitive
 * Translated from React NexusButton.tsx
 *
 * @api variant  'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 *               Default: 'primary'
 * @api size     'sm' | 'md' | 'lg' | 'xl'
 *               Default: 'md'
 * @api disabled Boolean. Default: false
 *
 * Fires: 'nexusclick' CustomEvent (bubbles, composed) on click
 *
 * Usage:
 *   <c-nexus-button variant="outline" size="lg" onnexusclick={handleSave}>
 *       Save Changes
 *   </c-nexus-button>
 */
export default class NexusButton extends LightningElement {
    @api variant  = 'primary';
    @api size     = 'md';
    @api disabled = false;

    get computedClass() {
        const variantMap = {
            primary:   'nbu-btn nbu-btn--primary',
            secondary: 'nbu-btn nbu-btn--secondary',
            outline:   'nbu-btn nbu-btn--outline',
            ghost:     'nbu-btn nbu-btn--ghost',
            danger:    'nbu-btn nbu-btn--danger',
        };
        const sizeMap = {
            sm: 'nbu-btn--sm',
            md: 'nbu-btn--md',
            lg: 'nbu-btn--lg',
            xl: 'nbu-btn--xl',
        };
        return (variantMap[this.variant] || variantMap.primary) + ' ' + (sizeMap[this.size] || sizeMap.md);
    }

    handleClick(event) {
        event.stopPropagation();
        if (this.disabled) return;
        this.dispatchEvent(new CustomEvent('nexusclick', { bubbles: true, composed: true }));
    }
}
