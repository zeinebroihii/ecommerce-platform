import { LightningElement, api, track } from "lwc";
import requestQuoteFromCart from "@salesforce/apex/QuoteController.requestQuoteFromCart";

const CART_KEY = "ecomm_cart";

export default class NexusPortalCart extends LightningElement {
  @api sparksBalance = 1250;
  @api isB2C = false;
  @track cartItems = [];
  @track showQuoteModal = false;
  @track isGeneratingQuote = false;
  @track showQuoteResult = false;
  @track quoteError = null;
  @track generatedQuoteName = "";
  @track generatedQuoteId = null;

  // ── lifecycle ──────────────────────────────────────────────────
  connectedCallback() {
    this._loadCart();
  }

  // ── getters ────────────────────────────────────────────────────
  get hasItems() {
    return this.cartItems.length > 0;
  }

  get itemCount() {
    return this.cartItems.reduce((sum, i) => sum + i.quantity, 0);
  }

  get itemCountLabel() {
    const n = this.itemCount;
    return n === 1 ? "1 Item" : `${n} Items`;
  }

  get subtotal() {
    return this.cartItems
      .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
      .toFixed(2);
  }

  get hasError() {
    return !!this.quoteError;
  }

  // ── private helpers ────────────────────────────────────────────
  _loadCart() {
    try {
      const raw = sessionStorage.getItem(CART_KEY);
      this.cartItems = raw ? JSON.parse(raw) : [];
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      this.cartItems = [];
    }
  }

  _saveCart() {
    try {
      sessionStorage.setItem(CART_KEY, JSON.stringify(this.cartItems));
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      /* quota */
    }
    this.dispatchEvent(
      new CustomEvent("cartchanged", {
        bubbles: true,
        detail: { cart: this.cartItems }
      })
    );
  }

  // ── item events ────────────────────────────────────────────────
  handleRemoveItem(evt) {
    const { itemId } = evt.detail;
    this.cartItems = this.cartItems.filter((i) => i.itemId !== itemId);
    this._saveCart();
  }

  handleUpdateQty(evt) {
    const { itemId, delta } = evt.detail;
    this.cartItems = this.cartItems.map((i) => {
      if (i.itemId !== itemId) return i;
      const newQty = Math.max(1, i.quantity + delta);
      return { ...i, quantity: newQty };
    });
    this._saveCart();
  }

  // ── summary events ─────────────────────────────────────────────
  handlePlaceOrder(e) {
    const appliedSparks = (e && e.detail && e.detail.appliedSparks) || 0;
    this.dispatchEvent(
      new CustomEvent("navigate", {
        bubbles: true,
        detail: { tab: "checkout", appliedSparks }
      })
    );
  }

  handleRequestQuote() {
    this.showQuoteModal = true;
    this.isGeneratingQuote = true;
    this.showQuoteResult = false;
    this.quoteError = null;

    const cartPayload = this.cartItems.map((item) => ({
      productId: item.productId || null,
      name: item.name,
      family: item.family || null,
      quantity: parseInt(item.quantity, 10) || 1,
      unitPrice: parseFloat(String(item.unitPrice).replace(/[^0-9.]/g, "")) || 0
    }));

    requestQuoteFromCart({ cartJSON: JSON.stringify(cartPayload), customerNote: "" })
      .then((result) => {
        this.isGeneratingQuote = false;
        this.showQuoteResult = true;
        this.generatedQuoteId = result.quoteId;
        this.generatedQuoteName = result.quoteName || "";
        this.cartItems = [];
        this._saveCart();
      })
      .catch((err) => {
        this.isGeneratingQuote = false;
        this.quoteError = err.body ? err.body.message : "An error occurred.";
        this.showQuoteResult = true;
      });
  }

  handleCloseModal() {
    this.showQuoteModal = false;
    this.isGeneratingQuote = false;
    this.showQuoteResult = false;
    this.quoteError = null;
  }

  handleGoToQuotes() {
    this.handleCloseModal();
    this.dispatchEvent(
      new CustomEvent("navigate", {
        bubbles: true,
        detail: {
          tab: "quotations",
          quoteId: this.generatedQuoteId,
          quoteName: this.generatedQuoteName
        }
      })
    );
  }

  handleGoCatalog() {
    this.dispatchEvent(
      new CustomEvent("navigate", {
        bubbles: true,
        detail: { tab: "catalog" }
      })
    );
  }
}
