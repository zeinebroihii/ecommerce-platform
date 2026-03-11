import { LightningElement, api, track } from 'lwc';

/**
 * NexusAuthModal — full-screen auth overlay
 * Translated from React NexusAuthModal.tsx
 *
 * @api isOpen       Boolean — show/hide the modal. Default: false
 * @api initialMode  'login' | 'signup-select' | 'forgot-password' | 'signup-b2c'
 *                   Default: 'login'
 *
 * Flow:
 *   - Opens with nexusAuthView in the given initialMode
 *   - When user clicks Enterprise in signup-select → nexusAuthView fires 'signupb2b'
 *     → modal switches to showing nexusLeadForm
 *   - X button always closes the modal (fires 'modalclose')
 *
 * Fires: 'modalclose' CustomEvent (bubbles, composed) — backdrop or X clicked
 *
 * Usage:
 *   <c-nexus-auth-modal is-open={authOpen} initial-mode="login"
 *       onmodalclose={handleAuthClose}>
 *   </c-nexus-auth-modal>
 */
export default class NexusAuthModal extends LightningElement {

    @api isOpen      = false;
    @api initialMode = 'login';

    /** true when user chose Enterprise → show nexusLeadForm instead of nexusAuthView */
    @track showLeadForm = false;

    // Reset lead form flag whenever the modal opens fresh
    // (isOpen change is handled by the template re-rendering via if:true={isOpen})

    handleClose() {
        this.showLeadForm = false;
        this.dispatchEvent(new CustomEvent('modalclose', { bubbles: true, composed: true }));
    }

    // Prevent backdrop close when clicking inside the modal card
    handleModalClick(event) {
        event.stopPropagation();
    }

    // nexusAuthView fires 'signupb2b' → switch to lead form
    handleSignupB2B() {
        this.showLeadForm = true;
    }
}
