import { LightningElement } from 'lwc';

/**
 * NexusAuthSelection — B2B / B2C profile selector cards
 * Translated from React NexusAuthSelection (NexusLandingBundle.tsx)
 *
 * Fires: 'select' CustomEvent (bubbles, composed)
 *        detail: { type: 'B2B' | 'B2C', mode: 'login' | 'signup' }
 *
 * Usage:
 *   <c-nexus-auth-selection onselect={handleSelect}></c-nexus-auth-selection>
 *
 *   handleSelect(event) {
 *     const { type, mode } = event.detail; // e.g. 'B2B', 'login'
 *   }
 */
export default class NexusAuthSelection extends LightningElement {

    _fire(type, mode) {
        this.dispatchEvent(new CustomEvent('select', {
            detail:   { type, mode },
            bubbles:  true,
            composed: true,
        }));
    }

    handleB2BLogin()  { this._fire('B2B', 'login');  }
    handleB2BSignup() { this._fire('B2B', 'signup'); }
    handleB2CLogin()  { this._fire('B2C', 'login');  }
    handleB2CSignup() { this._fire('B2C', 'signup'); }
}
