import { LightningElement, track, api } from 'lwc';

export default class NexusAuthView extends LightningElement {
    @track mode = 'login';
    @api initialMode = 'login';

    connectedCallback() {
        this.mode = this.initialMode;
    }

    get isLogin() {
        return this.mode === 'login';
    }

    toggleMode() {
        this.mode = this.mode === 'login' ? 'signup' : 'login';
    }

    handleLogin() {
        this.dispatchEvent(new CustomEvent('login', {
            detail: { email: 'user@example.com' }
        }));
    }

    handleB2B() {
        this.dispatchEvent(new CustomEvent('signup', {
            detail: { type: 'B2B' }
        }));
    }

    handleB2C() {
        this.dispatchEvent(new CustomEvent('signup', {
            detail: { type: 'B2C' }
        }));
    }
}
