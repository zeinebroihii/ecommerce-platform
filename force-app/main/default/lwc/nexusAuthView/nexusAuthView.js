import { LightningElement, track, api } from 'lwc';
import loginUser        from '@salesforce/apex/AuthController.loginUser';
import selfRegisterB2C  from '@salesforce/apex/AuthController.selfRegisterB2C';
import forgotPassword   from '@salesforce/apex/AuthController.forgotPassword';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const PORTAL_HOME = '/ss/s/customportal';

// Modes: 'login' | 'signup-select' | 'forgot-password' | 'signup-b2c' | 'change-password'
const VALID_MODES = ['login', 'signup-select', 'forgot-password', 'signup-b2c', 'change-password'];

export default class NexusAuthView extends LightningElement {

    @track mode           = 'login';
    @track showPassword   = false;
    @track isLoading      = false;

    // ── Forgot-password state ─────────────────────────────────────────────────
    @track forgotEmailSent = false;
    @track forgotEmail     = '';
    @track forgotError     = '';

    // ── B2C signup reactive state ─────────────────────────────────────────────
    @track b2cFirstName    = '';
    @track b2cLastName     = '';
    @track b2cPasswordValue = '';

    /** Set to true when rendered as a standalone page (not inside a modal) */
    @api fullPage  = false;
    @api startUrl  = PORTAL_HOME;

    // @api initialMode — allows parent modal to set the starting mode
    _initialMode = 'login';
    @api
    get initialMode() { return this._initialMode; }
    set initialMode(val) {
        this._initialMode = val;
        if (val && VALID_MODES.includes(val)) {
            this.mode = val;
        }
    }

    connectedCallback() {
        const params      = new URLSearchParams(window.location.search);
        const modeParam   = params.get('mode');
        if (modeParam && VALID_MODES.includes(modeParam)) {
            this.mode = modeParam;
        }
        const startUrlParam = params.get('startUrl');
        if (startUrlParam) this.startUrl = startUrlParam;
    }

    // ── Computed ──────────────────────────────────────────────────────────────

    get outerClass() {
        return this.fullPage
            ? 'nav-outer nav-outer--fullpage'
            : 'nav-outer nav-outer--modal';
    }

    get isLogin()          { return this.mode === 'login'; }
    get isSignupSelect()   { return this.mode === 'signup-select'; }
    get isForgotPassword() { return this.mode === 'forgot-password'; }
    get isSignupB2C()      { return this.mode === 'signup-b2c'; }
    get isChangePassword() { return this.mode === 'change-password'; }
    get passwordType()     { return this.showPassword ? 'text' : 'password'; }

    // ── B2C computed ──────────────────────────────────────────────────────────

    get b2cInitials() {
        const f = (this.b2cFirstName || '').trim();
        const l = (this.b2cLastName  || '').trim();
        return ((f[0] || '') + (l[0] || '')).toUpperCase();
    }

    get b2cHasInitials() { return this.b2cInitials.length > 0; }

    get b2cAvatarText() { return this.b2cHasInitials ? this.b2cInitials : '?'; }

    get b2cAvatarClass() {
        return this.b2cHasInitials
            ? 'nav-b2c-avatar-preview nav-b2c-avatar-active'
            : 'nav-b2c-avatar-preview';
    }

    get b2cPasswordStrength() {
        const pwd = this.b2cPasswordValue || '';
        if (!pwd) return 0;
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return Math.max(1, score);
    }

    get b2cHasPassword() { return this.b2cPasswordValue.length > 0; }

    get b2cStrengthBarClass() {
        return 'nav-strength-bar nav-strength-' + this.b2cPasswordStrength;
    }

    get b2cStrengthLabelClass() {
        return 'nav-strength-label nav-strength-lbl-' + this.b2cPasswordStrength;
    }

    get b2cStrengthLabel() {
        const labels = ['', 'Faible', 'Moyen', 'Fort'];
        return labels[this.b2cPasswordStrength] || '';
    }

    // ── Mode navigation ───────────────────────────────────────────────────────

    handleShowLogin() {
        this.mode = 'login';
        this.forgotEmailSent  = false;
        this.forgotError      = '';
        this._resetB2CState();
    }

    handleShowSignup()       { this.mode = 'signup-select'; }

    handleShowSignupSelect() {
        this.mode = 'signup-select';
        this._resetB2CState();
    }

    handleShowForgot() {
        this.mode = 'forgot-password';
        this.forgotEmailSent = false;
        this.forgotError     = '';
        this.forgotEmail     = '';
    }

    handleShowChangePassword() { this.mode = 'change-password'; }

    handleTogglePwd() { this.showPassword = !this.showPassword; }

    _resetB2CState() {
        this.b2cFirstName     = '';
        this.b2cLastName      = '';
        this.b2cPasswordValue = '';
    }

    // ── B2C live-input handlers ───────────────────────────────────────────────

    handleB2CFirstNameInput(event) { this.b2cFirstName    = event.target.value; }
    handleB2CLastNameInput(event)  { this.b2cLastName     = event.target.value; }
    handleB2CPasswordInput(event)  { this.b2cPasswordValue = event.target.value; }

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
                title:   'Login failed',
                message: e.body ? e.body.message : 'Incorrect email or password.',
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }

    // ── Forgot password ───────────────────────────────────────────────────────

    async handleForgotSubmit(event) {
        event.preventDefault();
        this.isLoading  = true;
        this.forgotError = '';
        const emailInput = this.template.querySelector('[data-field="forgotEmail"]');
        const email = emailInput ? emailInput.value.trim() : '';
        this.forgotEmail = email;
        try {
            await forgotPassword({ email });
            this.forgotEmailSent = true;
        } catch (e) {
            this.forgotError = e.body
                ? e.body.message
                : 'Impossible d\'envoyer l\'email. Vérifiez l\'adresse saisie.';
        } finally {
            this.isLoading = false;
        }
    }

    handleResendForgot() {
        this.forgotEmailSent = false;
        this.forgotError     = '';
        this.forgotEmail     = '';
    }

    // ── Signup: B2B → fire event to parent modal to show lead form ────────────

    handleB2BSignup(event) {
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('signupb2b', { bubbles: true, composed: true }));
    }

    // ── Signup: B2C → switch to signup-b2c mode ───────────────────────────────

    handleB2CSignup(event) {
        event.stopPropagation();
        this.mode = 'signup-b2c';
    }

    // ── B2C direct registration ───────────────────────────────────────────────

    async handleB2CSignupSubmit(event) {
        event.preventDefault();
        const firstName = this.template.querySelector('[data-field="firstName"]').value.trim();
        const lastName  = this.template.querySelector('[data-field="lastName"]').value.trim();
        const email     = this.template.querySelector('[data-field="email"]').value.trim();
        const password  = this.template.querySelector('[data-field="password"]').value;

        this.isLoading = true;
        try {
            const url = await selfRegisterB2C({ firstName, lastName, email, password });
            window.location.href = url || PORTAL_HOME;
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({
                title:   'Account creation failed',
                message: e.body ? e.body.message : 'Unable to create account. Please try again.',
                variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }
}
