import { LightningElement } from "lwc";
import getCurrentUserContext from "@salesforce/apex/EmbeddedChatContextController.getCurrentUserContext";
import linkContactToSession from "@salesforce/apex/EmbeddedChatContextController.linkContactToSession";
import saveCart from "@salesforce/apex/SaveCartForAgent.saveCart";

export default class NexusEmbeddedChatInit extends LightningElement {
  _context = null;
  _bootstrapReady = false;
  _handler;
  _convHandler;

  connectedCallback() {
    // Fetch user context
    getCurrentUserContext()
      .then((data) => {
        this._context = data;
        console.log("[NexusEmbeddedChatInit] User context loaded:", data);
        this._trySetFields();
      })
      .catch((err) => {
        console.warn("[NexusEmbeddedChatInit] Could not load user context:", err?.body?.message || err);
      });

    // Listen for Embedded Messaging ready
    this._handler = () => {
      this._bootstrapReady = true;
      this._trySetFields();
    };
    window.addEventListener("onEmbeddedMessagingReady", this._handler);

    // Bootstrap may already be ready
    if (window.embeddedservice_bootstrap?.prechatAPI) {
      this._bootstrapReady = true;
      this._trySetFields();
    }

    // When a new conversation starts, stamp MessagingEndUser.ContactId and save the cart.
    this._convHandler = () => {
      console.log("[NexusEmbeddedChatInit] Conversation started — linking contact to session...");
      linkContactToSession()
        .then((result) => {
          console.log("[NexusEmbeddedChatInit] linkContactToSession result:", result);
        })
        .catch((err) => {
          console.warn("[NexusEmbeddedChatInit] linkContactToSession failed:", err?.body?.message || err);
        });

      // Save cart from sessionStorage to Salesforce so the bot can read it
      try {
        const rawCart = window.sessionStorage.getItem("ecomm_cart");
        const cartJson = rawCart || "[]";
        saveCart({ cartJson })
          .then(() => console.log("[NexusEmbeddedChatInit] Cart saved to Salesforce"))
          .catch((err) => console.warn("[NexusEmbeddedChatInit] saveCart failed:", err?.body?.message || err));
      } catch (e) {
        console.warn("[NexusEmbeddedChatInit] Could not read cart from sessionStorage:", e);
      }
    };
    window.addEventListener("onEmbeddedMessagingConversationStarted", this._convHandler);
  }

  disconnectedCallback() {
    window.removeEventListener("onEmbeddedMessagingReady", this._handler);
    window.removeEventListener("onEmbeddedMessagingConversationStarted", this._convHandler);
  }

  _trySetFields() {
    if (!this._bootstrapReady || !this._context) return;

    const api = window.embeddedservice_bootstrap?.prechatAPI;
    if (!api) return;

    try {
      const fields = {};
      if (this._context.contactId)   fields["ContactId"]   = this._context.contactId;
      if (this._context.contactName) fields["ContactName"] = this._context.contactName;
      if (this._context.email)       fields["Email"]       = this._context.email;

      if (Object.keys(fields).length > 0) {
        api.setHiddenPrechatFields(fields);
        console.log("[NexusEmbeddedChatInit] Pre-chat fields set:", fields);
      }
    } catch (e) {
      console.warn("[NexusEmbeddedChatInit] setHiddenPrechatFields failed:", e);
    }
  }
}
