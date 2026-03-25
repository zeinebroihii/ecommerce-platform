import { LightningElement, api, track } from "lwc";
import changeUserPassword from "@salesforce/apex/AuthController.changeUserPassword";
import setFirstPassword from "@salesforce/apex/AuthController.setFirstPassword";

const PORTAL_HOME = "/ss/s/";

export default class NexusChangePassword extends LightningElement {
  /** Set to true when embedded inside a modal (removes position:fixed wrapper) */
  @api isModal = false;

  /**
   * When true the user is setting their password for the first time via the
   * email link. The "current password" field is hidden and setupToken is used
   * as the old password internally (it's the one-time token from the URL).
   */
  @api isInitialSetup = false;

  /** One-time reset token passed via URL param */
  @api setupToken = "";

  /** User email passed via URL param — required for setFirstPassword login step */
  @api setupEmail = "";

  get outerClass() {
    return this.isModal ? "nav-outer nav-outer--modal" : "nav-outer";
  }

  @track showNew = false;
  @track showConfirm = false;
  @track isLoading = false;
  @track isSuccess = false;
  @track errorMsg = "";
  @track newPwdValue = "";
  @track confirmPwdValue = "";

  // ── Eye toggles ───────────────────────────────────────────────────────────
  get newPwdType() {
    return this.showNew ? "text" : "password";
  }
  get confirmPwdType() {
    return this.showConfirm ? "text" : "password";
  }
  get newEyeIcon() {
    return this.showNew ? "utility:preview" : "utility:hide";
  }
  get confirmEyeIcon() {
    return this.showConfirm ? "utility:preview" : "utility:hide";
  }

  handleToggleNew() {
    this.showNew = !this.showNew;
  }
  handleToggleConfirm() {
    this.showConfirm = !this.showConfirm;
  }

  // ── Input handlers ────────────────────────────────────────────────────────
  handleNewPwdInput(event) {
    this.newPwdValue = event.target.value;
    this.errorMsg = "";
  }
  handleConfirmPwdInput(event) {
    this.confirmPwdValue = event.target.value;
  }

  // ── Password rule checks ──────────────────────────────────────────────────
  get has8() {
    return this.newPwdValue.length >= 8;
  }
  get hasUpper() {
    return /[A-Z]/.test(this.newPwdValue);
  }
  get hasLower() {
    return /[a-z]/.test(this.newPwdValue);
  }
  get hasNumber() {
    return /[0-9]/.test(this.newPwdValue);
  }
  get hasSpecial() {
    return /[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/.test(this.newPwdValue);
  }
  get hasMatch() {
    return (
      this.newPwdValue.length > 0 && this.newPwdValue === this.confirmPwdValue
    );
  }
  get allRulesMet() {
    return (
      this.has8 &&
      this.hasUpper &&
      this.hasLower &&
      this.hasNumber &&
      this.hasSpecial
    );
  }

  // ── Rule CSS classes ──────────────────────────────────────────────────────
  get ruleClass8() {
    return "ncp-rule" + (this.has8 ? " ncp-rule-ok" : "");
  }
  get ruleClassUpper() {
    return "ncp-rule" + (this.hasUpper ? " ncp-rule-ok" : "");
  }
  get ruleClassLower() {
    return "ncp-rule" + (this.hasLower ? " ncp-rule-ok" : "");
  }
  get ruleClassNumber() {
    return "ncp-rule" + (this.hasNumber ? " ncp-rule-ok" : "");
  }
  get ruleClassSpecial() {
    return "ncp-rule" + (this.hasSpecial ? " ncp-rule-ok" : "");
  }
  get ruleClassMatch() {
    return "ncp-rule" + (this.hasMatch ? " ncp-rule-ok" : " ncp-rule-error");
  }

  // ── Rule icons ────────────────────────────────────────────────────────────
  get ruleIcon8() {
    return this.has8 ? "utility:check" : "utility:close";
  }
  get ruleIconUpper() {
    return this.hasUpper ? "utility:check" : "utility:close";
  }
  get ruleIconLower() {
    return this.hasLower ? "utility:check" : "utility:close";
  }
  get ruleIconNumber() {
    return this.hasNumber ? "utility:check" : "utility:close";
  }
  get ruleIconSpecial() {
    return this.hasSpecial ? "utility:check" : "utility:close";
  }
  get ruleIconMatch() {
    return this.hasMatch ? "utility:check" : "utility:close";
  }

  // ── Submit disabled state ─────────────────────────────────────────────────
  get isSubmitDisabled() {
    return this.isLoading || !this.allRulesMet || !this.hasMatch;
  }

  // ── Form submit ───────────────────────────────────────────────────────────
  async handleSubmit(event) {
    event.preventDefault();
    this.isLoading = true;
    this.errorMsg = "";

    const newPwd = this.template.querySelector(
      '[data-field="newPassword"]'
    ).value;
    const confirmPwd = this.template.querySelector(
      '[data-field="confirmPassword"]'
    ).value;

    if (newPwd !== confirmPwd) {
      this.errorMsg = "Les mots de passe ne correspondent pas.";
      this.isLoading = false;
      return;
    }

    try {
      if (this.isInitialSetup) {
        // First-time setup: Site.login(email, token) then Site.changePassword
        // — avoids "Your access is not allowed" for unauthenticated users.
        const redirectUrl = await setFirstPassword({
          email: this.setupEmail,
          token: this.setupToken,
          newPassword: newPwd,
          verifyPassword: confirmPwd
        });
        this.isSuccess = true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
          window.location.href = redirectUrl || PORTAL_HOME;
        }, 2000);
      } else {
        await changeUserPassword({
          newPassword: newPwd,
          verifyPassword: confirmPwd,
          oldPassword: ""
        });
        this.isSuccess = true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
          window.location.href = PORTAL_HOME;
        }, 2000);
      }
    } catch (e) {
      this.errorMsg = e.body
        ? e.body.message
        : 'Impossible de définir le mot de passe. Le lien a peut-être expiré — utilisez "Mot de passe oublié".';
    } finally {
      this.isLoading = false;
    }
  }
}
