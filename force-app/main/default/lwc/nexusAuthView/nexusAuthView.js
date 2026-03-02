import { LightningElement, track, api } from 'lwc';
import loginUser from '@salesforce/apex/AuthController.loginUser';
import selfRegisterB2C from '@salesforce/apex/AuthController.selfRegisterB2C';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const PORTAL_HOME = '/NexusPortal/s/';
const FORGOT_URL  = '/NexusPortal/s/ForgotPassword';
const LEAD_FORM   = '/NexusPortal/s/demande-devis';

export default class NexusAuthView extends LightningElement {
    // mode: 'choose' | 'login' | 'signup-select' | 'forgot-password' | 'b2c-signup'
    @track mode = 'choose';
    @track showPassword = false;
    @track isLoading = false;
    @api startUrl = PORTAL_HOME;

    connectedCallback() {
        // Read ?mode=b2c-signup or ?type=B2B|B2C from URL
        const params = new URLSearchParams(window.location.search);
        const modeParam = params.get('mode');
        if (modeParam && ['choose', 'login', 'signup-select', 'forgot-password', 'b2c-signup'].includes(modeParam)) {
            this.mode = modeParam;
        }
    }

    // ── Getters ──────────────────────────────────────────────────────────────
    get splitCardClass() {
        if (this.mode === 'choose')     return 'nav-split-card nav-single-card nav-choose-wide';
        if (this.mode === 'b2c-signup') return 'nav-split-card nav-single-card';
        return 'nav-split-card';
    }
    get isChoose()       { return this.mode === 'choose'; }
    get isLogin()        { return this.mode === 'login'; }
    get isSignupSelect() { return this.mode === 'signup-select'; }
    get isForgotPwd()    { return this.mode === 'forgot-password'; }
    get isB2CSignup()    { return this.mode === 'b2c-signup'; }
    get passwordType()   { return this.showPassword ? 'text' : 'password'; }
    get eyeIcon()        { return this.showPassword ? 'utility:preview' : 'utility:hide'; }

    // ── Navigation ───────────────────────────────────────────────────────────
    handleShowChoose() { this.mode = 'choose'; }
    handleShowLogin()  { this.mode = 'login'; }
    handleShowSignup() { this.mode = 'signup-select'; }
    handleShowForgot() { this.mode = 'forgot-password'; }
    handleTogglePwd()  { this.showPassword = !this.showPassword; }
    handleChooseB2B()  { this.mode = 'login'; }
    handleChooseB2C()  { this.mode = 'login'; }

    // ── Login form submit ─────────────────────────────────────────────────────
    async handleLogin(event) {
        event.preventDefault();
        this.isLoading = true;
        const email = this.template.querySelector('[data-field="email"]').value;
        const pwd   = this.template.querySelector('[data-field="password"]').value;
        try {
            const url = await loginUser({ username: email, password: pwd, startUrl: this.startUrl });
            window.location.href = url || PORTAL_HOME;
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Connexion échouée',
                message: e.body ? e.body.message : 'Email ou mot de passe incorrect.',
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }

    // ── Forgot password ───────────────────────────────────────────────────────
    handleForgotSubmit(event) {
        event.preventDefault();
        window.location.href = FORGOT_URL;
    }

    // ── Signup choices ────────────────────────────────────────────────────────
    handleB2BSignup(event) {
        event.stopPropagation();
        window.location.href = LEAD_FORM;
    }

    handleB2CSignup(event) {
        event.stopPropagation();
        this.mode = 'b2c-signup';
    }

    // ── B2C direct registration ───────────────────────────────────────────────
    async handleB2CSignupSubmit(event) {
        event.preventDefault();
        const firstName       = this.template.querySelector('[data-field="firstName"]').value.trim();
        const lastName        = this.template.querySelector('[data-field="lastName"]').value.trim();
        const email           = this.template.querySelector('[data-field="email"]').value.trim();
        const password        = this.template.querySelector('[data-field="password"]').value;
        const confirmPassword = this.template.querySelector('[data-field="confirmPassword"]').value;

        if (password !== confirmPassword) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Erreur',
                message: 'Les mots de passe ne correspondent pas.',
                variant: 'error'
            }));
            return;
        }

        this.isLoading = true;
        try {
            const url = await selfRegisterB2C({ firstName, lastName, email, password });
            window.location.href = url || PORTAL_HOME;
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Erreur de création',
                message: e.body ? e.body.message : 'Impossible de créer le compte. Veuillez réessayer.',
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }
}
