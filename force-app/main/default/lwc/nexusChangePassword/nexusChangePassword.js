import { LightningElement, api, track } from 'lwc';
import changeUserPassword from '@salesforce/apex/AuthController.changeUserPassword';

const PORTAL_HOME = '/ss/s/';

export default class NexusChangePassword extends LightningElement {
    /** Set to true when embedded inside a modal (removes position:fixed wrapper) */
    @api isModal = false;

    get outerClass() {
        return this.isModal ? 'nav-outer nav-outer--modal' : 'nav-outer';
    }

    @track showCurrent  = false;
    @track showNew      = false;
    @track showConfirm  = false;
    @track isLoading    = false;
    @track isSuccess    = false;
    @track errorMsg     = '';
    @track currentPwdValue  = '';
    @track newPwdValue      = '';
    @track confirmPwdValue  = '';

    // ── Eye toggles ───────────────────────────────────────────────────────────
    get currentPwdType()  { return this.showCurrent  ? 'text' : 'password'; }
    get newPwdType()      { return this.showNew      ? 'text' : 'password'; }
    get confirmPwdType()  { return this.showConfirm  ? 'text' : 'password'; }
    get currentEyeIcon()  { return this.showCurrent  ? 'utility:preview' : 'utility:hide'; }
    get newEyeIcon()      { return this.showNew      ? 'utility:preview' : 'utility:hide'; }
    get confirmEyeIcon()  { return this.showConfirm  ? 'utility:preview' : 'utility:hide'; }

    handleToggleCurrent() { this.showCurrent  = !this.showCurrent; }
    handleToggleNew()     { this.showNew      = !this.showNew; }
    handleToggleConfirm() { this.showConfirm  = !this.showConfirm; }

    // ── Input handlers ────────────────────────────────────────────────────────
    handleCurrentPwdInput(event)  { this.currentPwdValue  = event.target.value; }
    handleNewPwdInput(event)      { this.newPwdValue      = event.target.value; this.errorMsg = ''; }
    handleConfirmPwdInput(event)  { this.confirmPwdValue  = event.target.value; }

    // ── Password rule checks ──────────────────────────────────────────────────
    get has8()      { return this.newPwdValue.length >= 8; }
    get hasUpper()  { return /[A-Z]/.test(this.newPwdValue); }
    get hasLower()  { return /[a-z]/.test(this.newPwdValue); }
    get hasNumber() { return /[0-9]/.test(this.newPwdValue); }
    get hasSpecial(){ return /[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/.test(this.newPwdValue); }
    get hasMatch()  { return this.newPwdValue.length > 0 && this.newPwdValue === this.confirmPwdValue; }
    get allRulesMet(){ return this.has8 && this.hasUpper && this.hasLower && this.hasNumber && this.hasSpecial; }

    // ── Rule CSS classes ──────────────────────────────────────────────────────
    get ruleClass8()      { return 'ncp-rule' + (this.has8      ? ' ncp-rule-ok' : ''); }
    get ruleClassUpper()  { return 'ncp-rule' + (this.hasUpper  ? ' ncp-rule-ok' : ''); }
    get ruleClassLower()  { return 'ncp-rule' + (this.hasLower  ? ' ncp-rule-ok' : ''); }
    get ruleClassNumber() { return 'ncp-rule' + (this.hasNumber ? ' ncp-rule-ok' : ''); }
    get ruleClassSpecial(){ return 'ncp-rule' + (this.hasSpecial ? ' ncp-rule-ok' : ''); }
    get ruleClassMatch()  { return 'ncp-rule' + (this.hasMatch  ? ' ncp-rule-ok' : ' ncp-rule-error'); }

    // ── Rule icons ────────────────────────────────────────────────────────────
    get ruleIcon8()       { return this.has8      ? 'utility:check' : 'utility:close'; }
    get ruleIconUpper()   { return this.hasUpper  ? 'utility:check' : 'utility:close'; }
    get ruleIconLower()   { return this.hasLower  ? 'utility:check' : 'utility:close'; }
    get ruleIconNumber()  { return this.hasNumber ? 'utility:check' : 'utility:close'; }
    get ruleIconSpecial() { return this.hasSpecial ? 'utility:check' : 'utility:close'; }
    get ruleIconMatch()   { return this.hasMatch  ? 'utility:check' : 'utility:close'; }

    // ── Submit disabled state ─────────────────────────────────────────────────
    get isSubmitDisabled() {
        return this.isLoading
            || !this.currentPwdValue
            || !this.allRulesMet
            || !this.hasMatch;
    }

    // ── Form submit ───────────────────────────────────────────────────────────
    async handleSubmit(event) {
        event.preventDefault();
        this.isLoading = true;
        this.errorMsg  = '';

        const currentPwd = this.template.querySelector('[data-field="currentPassword"]').value;
        const newPwd     = this.template.querySelector('[data-field="newPassword"]').value;
        const confirmPwd = this.template.querySelector('[data-field="confirmPassword"]').value;

        if (newPwd !== confirmPwd) {
            this.errorMsg  = 'Passwords do not match.';
            this.isLoading = false;
            return;
        }

        try {
            await changeUserPassword({ newPassword: newPwd, verifyPassword: confirmPwd, oldPassword: currentPwd });
            this.isSuccess = true;
            // Redirect to portal home after short delay
            setTimeout(() => { window.location.href = PORTAL_HOME; }, 2000);
        } catch (e) {
            this.errorMsg = e.body
                ? e.body.message
                : 'Impossible de modifier le mot de passe. Vérifiez que le mot de passe temporaire est correct.';
        } finally {
            this.isLoading = false;
        }
    }
}
