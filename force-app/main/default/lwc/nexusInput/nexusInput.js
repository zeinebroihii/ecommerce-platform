import { LightningElement, api, track } from 'lwc';

/**
 * NexusInput — UI primitive
 * Translated from React NexusInput.tsx
 *
 * @api label        Optional label text above the input
 * @api hasIcon      Boolean — set to true when using the 'icon' slot. Adds left padding. Default: false
 * @api type         Input type. Default: 'text'
 * @api value        Current value (controlled). Default: ''
 * @api placeholder  Placeholder text
 * @api disabled     Boolean. Default: false
 * @api required     Boolean. Default: false
 * @api min          For number/date inputs
 * @api max          For number/date inputs
 *
 * Slots:
 *   icon  — optional icon placed on the left (use with has-icon="true")
 *
 * Fires:
 *   'change'  — mirrors native change event, detail: { value }
 *   'input'   — mirrors native input event, detail: { value }
 *
 * Usage:
 *   <c-nexus-input label="Email" type="email" placeholder="you@company.com"
 *       has-icon="true" onchange={handleEmail}>
 *       <lightning-icon slot="icon" icon-name="utility:email" size="x-small" />
 *   </c-nexus-input>
 */
export default class NexusInput extends LightningElement {
    @api label;
    @api hasIcon    = false;
    @api type       = 'text';
    @api value      = '';
    @api placeholder;
    @api disabled   = false;
    @api required   = false;
    @api min;
    @api max;

    // Stable unique ID so label htmlFor works
    inputId = `nexus-input-${Math.random().toString(36).slice(2)}`;

    get computedInputClass() {
        return this.hasIcon ? 'ni-input ni-input--icon' : 'ni-input';
    }

    handleChange(event) {
        this.dispatchEvent(new CustomEvent('change', {
            detail: { value: event.target.value },
            bubbles: true,
            composed: true,
        }));
    }

    handleInput(event) {
        this.dispatchEvent(new CustomEvent('input', {
            detail: { value: event.target.value },
            bubbles: true,
            composed: true,
        }));
    }
}
