import { LightningElement, track } from "lwc";
import subscribeToNewsletter from "@salesforce/apex/NewsletterController.subscribeToNewsletter";
import unsubscribeByToken from "@salesforce/apex/NewsletterController.unsubscribeByToken";

export default class NexusFooter extends LightningElement {
  socials = [
    {
      id: "linkedin",
      label: "LinkedIn",
      href: "https://linkedin.com/company/nexus-platform",
      path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
    },
    {
      id: "twitter",
      label: "X (Twitter)",
      href: "https://x.com/nexusplatform",
      path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 7.184 6.082-7.183zm-1.161 19.49h2.04L6.29 3.24H4.168z"
    }
  ];
  solutions = [
    "Stock Management",
    "Predictive Analytics",
    "IoT Integration",
    "AI Support"
  ];
  company = ["About", "Careers", "Partners", "Contact"];

  @track newsletterEmail = "";
  @track subscribed = false;
  @track isLoading = false;
  @track errorMessage = "";

  // Unsubscribe state
  @track showUnsubscribeModal = false;
  @track unsubscribeLoading = false;
  @track unsubscribeDone = false;
  @track unsubscribeEmail = "";
  @track unsubscribeError = "";
  _unsubToken = null;

  connectedCallback() {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("unsubscribe");
      if (token) {
        this._unsubToken = token;
        this.showUnsubscribeModal = true;
      }
      // eslint-disable-next-line no-unused-vars
    } catch (_e) {
      /* ignore */
    }
  }

  // ── Subscribe ──────────────────────────────────────────────────────────
  handleEmailInput(event) {
    this.newsletterEmail = event.target.value;
    if (this.errorMessage) this.errorMessage = "";
  }

  handleKeyDown(event) {
    if (event.key === "Enter") this.handleSubscribe();
  }

  handleSubscribe() {
    const email = this.newsletterEmail.trim();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.errorMessage = "Please enter a valid email address.";
      return;
    }
    this.isLoading = true;
    this.errorMessage = "";
    subscribeToNewsletter({ email })
      .then(() => {
        this.subscribed = true;
        this.newsletterEmail = "";
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
          this.subscribed = false;
        }, 6000);
      })
      .catch((error) => {
        this.errorMessage =
          (error.body && error.body.message) ||
          "Something went wrong. Please try again.";
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  // ── Unsubscribe modal ─────────────────────────────────────────────────
  handleConfirmUnsubscribe() {
    if (!this._unsubToken) return;
    this.unsubscribeLoading = true;
    this.unsubscribeError = "";
    unsubscribeByToken({ token: this._unsubToken })
      .then((email) => {
        this.unsubscribeEmail = email === "already_removed" ? "" : email;
        this.unsubscribeDone = true;
      })
      .catch((error) => {
        this.unsubscribeError =
          (error.body && error.body.message) ||
          "Something went wrong. Please try again.";
      })
      .finally(() => {
        this.unsubscribeLoading = false;
      });
  }

  handleCancelUnsubscribe() {
    this.showUnsubscribeModal = false;
  }

  handleCloseUnsubscribe() {
    this.showUnsubscribeModal = false;
  }

  stopProp(event) {
    event.stopPropagation();
  }
}
