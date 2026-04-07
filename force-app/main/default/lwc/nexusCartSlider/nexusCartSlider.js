import { LightningElement, track } from "lwc";

const CART_KEY = "ecomm_cart";

export default class NexusCartSlider extends LightningElement {
  @track isPanelOpen = false;
  @track isMinimized = false;
  @track cartItems = [];
  @track _hasBeenRevealed = false;
  @track _comboOpen = false;

  _onCartUpdate;
  _onCartReveal;
  _onComboOpen;
  _onComboClose;

  connectedCallback() {
    // Hydrate from sessionStorage so we reflect any persisted cart on load
    try {
      const raw = sessionStorage.getItem(CART_KEY);
      if (raw) this.cartItems = JSON.parse(raw);
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      /* silent */
    }

    this._onCartUpdate = (e) => {
      const { items } = e.detail || {};
      if (Array.isArray(items)) this.cartItems = items;
    };
    this._onCartReveal = () => {
      this._hasBeenRevealed = true;
      this.isPanelOpen = true;
      this.isMinimized = false;
    };
    this._onComboOpen = () => {
      this._comboOpen = true;
    };
    this._onComboClose = () => {
      this._comboOpen = false;
    };

    document.addEventListener("nexuscartupdate", this._onCartUpdate);
    document.addEventListener("nexuscartreveal", this._onCartReveal);
    document.addEventListener("nexuscombobuilderopen", this._onComboOpen);
    document.addEventListener("nexuscombobuilderclose", this._onComboClose);
  }

  disconnectedCallback() {
    document.removeEventListener("nexuscartupdate", this._onCartUpdate);
    document.removeEventListener("nexuscartreveal", this._onCartReveal);
    document.removeEventListener("nexuscombobuilderopen", this._onComboOpen);
    document.removeEventListener("nexuscombobuilderclose", this._onComboClose);
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get showToggleTab() {
    return (
      (this._hasBeenRevealed || this.cartItems.length > 0) &&
      !this.isPanelVisible &&
      !this._comboOpen
    );
  }
  get isPanelVisible() {
    return this.isPanelOpen && !this.isMinimized;
  }
  get hasItems() {
    return this.cartItems.length > 0;
  }
  get isEmpty() {
    return this.cartItems.length === 0;
  }
  get cartCount() {
    return this.cartItems.length;
  }
  get isSingleItem() {
    return this.cartItems.length === 1;
  }

  get subtotal() {
    return this.cartItems.reduce(
      (acc, i) => acc + (i.unitPrice || i.price || 0) * (i.quantity || 1),
      0
    );
  }
  get subtotalFormatted() {
    return this.subtotal.toFixed(2);
  }

  get toggleChevronClass() {
    return this.isPanelOpen && !this.isMinimized
      ? "ncs-chevron ncs-chevron--right"
      : "ncs-chevron ncs-chevron--left";
  }

  get cartItemsEnriched() {
    return this.cartItems.map((item) => {
      const unitPrice = item.unitPrice || item.price || 0;
      return {
        ...item,
        unitPriceFormatted: unitPrice.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }),
        lineTotalFormatted: (unitPrice * (item.quantity || 1)).toLocaleString(
          undefined,
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )
      };
    });
  }

  // ── Toggle / close ────────────────────────────────────────────────────────

  handleToggleTab() {
    if (!this.isPanelOpen) {
      this.isPanelOpen = true;
      this.isMinimized = false;
    } else {
      this.isMinimized = !this.isMinimized;
    }
  }

  handleClose() {
    this.isPanelOpen = false;
    this.isMinimized = false;
    document.dispatchEvent(new CustomEvent("nexuscartclose"));
  }

  handleMinimize() {
    this.isMinimized = true;
    document.dispatchEvent(new CustomEvent("nexuscartclose"));
  }

  handleBackdropClick() {
    this.isMinimized = true;
    document.dispatchEvent(new CustomEvent("nexuscartclose"));
  }

  // ── Item controls ─────────────────────────────────────────────────────────

  handleIncreaseQty(event) {
    const itemId = event.currentTarget.dataset.itemId;
    this.cartItems = this.cartItems.map((i) => {
      return i.itemId === itemId
        ? { ...i, quantity: (i.quantity || 1) + 1 }
        : i;
    });
    this._notifyChange();
  }

  handleDecreaseQty(event) {
    const itemId = event.currentTarget.dataset.itemId;
    this.cartItems = this.cartItems.map((i) => {
      return i.itemId === itemId
        ? { ...i, quantity: Math.max(1, (i.quantity || 1) - 1) }
        : i;
    });
    this._notifyChange();
  }

  handleRemoveItem(event) {
    const itemId = event.currentTarget.dataset.itemId;
    this.cartItems = this.cartItems.filter((i) => i.itemId !== itemId);
    this._notifyChange();
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  handleCheckout() {
    this.dispatchEvent(
      new CustomEvent("cartcheckout", { bubbles: true, composed: true })
    );
    this.isPanelOpen = false;
  }

  handleRequestQuote() {
    this.dispatchEvent(
      new CustomEvent("cartquote", { bubbles: true, composed: true })
    );
    this.isPanelOpen = false;
  }

  handleViewFullCart() {
    this.dispatchEvent(
      new CustomEvent("cartviewfull", { bubbles: true, composed: true })
    );
    this.isPanelOpen = false;
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _notifyChange() {
    this.dispatchEvent(
      new CustomEvent("cartchange", {
        detail: { items: this.cartItems },
        bubbles: true,
        composed: true
      })
    );
  }
}
