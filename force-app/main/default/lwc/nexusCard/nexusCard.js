import { LightningElement, api } from 'lwc';

/**
 * NexusCard — UI primitive
 * Translated from React NexusCard.tsx
 *
 * @api title    Optional heading shown at the top (with indigo dot)
 * @api noHover  Boolean — set to disable the lift-on-hover effect. Default: false (hover ON)
 * @api padding  'none' | 'sm' | 'md' | 'lg' | 'xl'. Default: 'lg'
 *
 * Fires: 'nexusclick' CustomEvent (bubbles, composed) when clicked
 *
 * Usage (hover on by default):
 *   <c-nexus-card title="Pipeline" padding="md" onnexusclick={handleCardClick}>
 *       <!-- card content goes here -->
 *   </c-nexus-card>
 *
 * Usage (hover disabled):
 *   <c-nexus-card no-hover padding="lg">...</c-nexus-card>
 */
export default class NexusCard extends LightningElement {
    @api title;
    @api noHover = false;   // LWC rule: boolean @api props must default to false
    @api padding = 'lg';

    get computedClass() {
        const padMap = {
            none: 'nc-card--pad-none',
            sm:   'nc-card--pad-sm',
            md:   'nc-card--pad-md',
            lg:   'nc-card--pad-lg',
            xl:   'nc-card--pad-xl',
        };
        const pad   = padMap[this.padding] || padMap.lg;
        const hover = this.noHover ? '' : 'nc-card--hoverable';
        return ['nc-card', pad, hover].filter(Boolean).join(' ');
    }

    handleClick() {
        this.dispatchEvent(new CustomEvent('nexusclick', { bubbles: true, composed: true }));
    }
}
