import { LightningElement, api } from "lwc";

export default class NexusSupportChat extends LightningElement {
  @api accountId;

  _cartOpen   = false;
  _esReady    = false;
  _pendingOpen = false;

  _onCartReveal;
  _onCartClose;
  _onEsReady;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  connectedCallback() {
    // Cart visibility
    this._onCartReveal = () => { this._cartOpen = true; };
    this._onCartClose  = () => { this._cartOpen = false; };
    document.addEventListener("nexuscartreveal", this._onCartReveal);
    document.addEventListener("nexuscartclose",  this._onCartClose);

    // Wait for Embedded Messaging to be ready
    this._onEsReady = () => {
      this._esReady = true;
      if (this._pendingOpen) {
        this._pendingOpen = false;
        this._launchChat();
      }
    };
    window.addEventListener("onEmbeddedMessagingReady", this._onEsReady);

    // If bootstrap already initialized before component mounted
    if (
      window.embeddedservice_bootstrap &&
      window.embeddedservice_bootstrap.utilAPI
    ) {
      this._esReady = true;
    }
  }

  disconnectedCallback() {
    document.removeEventListener("nexuscartreveal", this._onCartReveal);
    document.removeEventListener("nexuscartclose",  this._onCartClose);
    window.removeEventListener("onEmbeddedMessagingReady", this._onEsReady);
  }

  // ── Getter ────────────────────────────────────────────────────────────────

  get showFab() {
    return !this._cartOpen;
  }

  // ── Open ──────────────────────────────────────────────────────────────────

  handleOpen() {
    if (this._esReady) {
      this._launchChat();
    } else {
      // Queue — will fire once ready event arrives
      this._pendingOpen = true;
    }
  }

  _launchChat() {
    const bs = window.embeddedservice_bootstrap;
    if (bs && bs.utilAPI && typeof bs.utilAPI.launchChat === "function") {
      bs.utilAPI.launchChat();
    } else if (bs && typeof bs.bootstrapEmbeddedMessaging === "function") {
      bs.bootstrapEmbeddedMessaging();
    } else {
      // Last resort: click the hidden Salesforce button
      const btn = document.querySelector(
        ".embeddedServiceHelpButton button, .helpButtonEnabled, [class*='helpButton'] button"
      );
      if (btn) btn.click();
    }
  }
}
