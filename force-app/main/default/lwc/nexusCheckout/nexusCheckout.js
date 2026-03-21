import { LightningElement, api, track, wire } from "lwc";
import createDraftOrder from "@salesforce/apex/StripePaymentController.createDraftOrder";
import createCheckoutSession from "@salesforce/apex/StripePaymentController.createCheckoutSession";
import getShippingConfig from "@salesforce/apex/StripePaymentController.getShippingConfig";

const PENDING_OID_KEY = "nexus_pending_oid";

export default class NexusCheckout extends LightningElement {
  // ── Props from portal ──────────────────────────────────────────────────
  @api cartItems = [];
  @api accountId = "";
  @api profileStreet = "";
  @api profileCity = "";
  @api profilePostalCode = "";
  @api profileCountry = "";
  @api sparksDiscount = 0; // $ discount from Sparks points (e.g. 10.00)

  // ── State ──────────────────────────────────────────────────────────────
  @track isLoading = false;
  @track errorMsg = "";

  // Shipping fields
  @track street = "";
  @track city = "";
  @track state = "";
  @track zipCode = "";
  @track country = "";

  _shippingAmount = 45;
  _freeShippingThreshold = 5000;

  @wire(getShippingConfig)
  wiredShipping({ data }) {
    if (data) {
      this._shippingAmount = data.shippingAmount || 45;
      this._freeShippingThreshold = data.freeShippingThreshold || 5000;
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────
  connectedCallback() {
    this.street = this.profileStreet || "";
    this.city = this.profileCity || "";
    this.zipCode = this.profilePostalCode || "";
    this.country = this.profileCountry || "France";
  }

  // ── Getters ────────────────────────────────────────────────────────────
  get addressIsValid() {
    return !!(this.street.trim() && this.city.trim() && this.country.trim());
  }
  get proceedDisabled() {
    return this.isLoading || !this.addressIsValid || !this.cartItems.length;
  }

  get cartSummary() {
    return this.cartItems.map((i) => ({
      key: i.itemId || i.productId || i.id,
      name: i.name || "Produit",
      unitPrice: (parseFloat(i.unitPrice) || 0).toFixed(2),
      quantity: i.quantity || 1,
      lineTotal: ((parseFloat(i.unitPrice) || 0) * (i.quantity || 1)).toFixed(
        2
      ),
      imageUrl: i.imageUrl || i.image || ""
    }));
  }

  get subtotal() {
    return this.cartItems
      .reduce(
        (s, i) => s + (parseFloat(i.unitPrice) || 0) * (i.quantity || 1),
        0
      )
      .toFixed(2);
  }

  get itemCountLabel() {
    const n = this.cartItems.reduce((s, i) => s + (i.quantity || 1), 0);
    return n === 1 ? "1 article" : `${n} articles`;
  }

  get isFreeShipping() {
    return parseFloat(this.subtotal) >= this._freeShippingThreshold;
  }
  get shippingLabel() {
    return this.isFreeShipping
      ? "Gratuit"
      : this._shippingAmount.toFixed(2) + " €";
  }
  get sparksDiscountVal() {
    return parseFloat(this.sparksDiscount) || 0;
  }
  get hasSparksDiscount() {
    return this.sparksDiscountVal > 0;
  }
  get formattedSparksDiscount() {
    return "-" + this.sparksDiscountVal.toFixed(2) + " €";
  }

  get total() {
    const s = parseFloat(this.subtotal) || 0;
    const ship = this.isFreeShipping ? 0 : this._shippingAmount;
    return Math.max(0, s + ship - this.sparksDiscountVal).toFixed(2);
  }

  // ── Form handlers ──────────────────────────────────────────────────────
  handleStreet(e) {
    this.street = e.target.value;
  }
  handleCity(e) {
    this.city = e.target.value;
  }
  handleState(e) {
    this.state = e.target.value;
  }
  handleZip(e) {
    this.zipCode = e.target.value;
  }
  handleCountry(e) {
    this.country = e.target.value;
  }

  handleBackToCart() {
    this.dispatchEvent(
      new CustomEvent("navigate", {
        bubbles: true,
        detail: { tab: "cart" }
      })
    );
  }

  // ── Main action — redirect to Stripe Hosted Checkout ──────────────────
  async handleProceedToPayment() {
    this.errorMsg = "";
    if (!this.addressIsValid) {
      this.errorMsg = "Veuillez remplir la rue, la ville et le pays.";
      return;
    }
    if (!this.cartItems || this.cartItems.length === 0) {
      this.errorMsg = "Votre panier est vide.";
      return;
    }

    this.isLoading = true;

    try {
      const cartJson = JSON.stringify(
        this.cartItems.map((i) => ({
          productId: i.productId || i.id,
          name: i.name || "Produit",
          unitPrice: parseFloat(i.unitPrice) || 0,
          quantity: i.quantity || 1,
          imageUrl: i.imageUrl || i.image || ""
        }))
      );

      // 1. Create Draft Order in Salesforce
      const shippingAmount = this.isFreeShipping ? 0 : this._shippingAmount;
      const orderId = await createDraftOrder({
        accountId: this.accountId,
        cartItemsJson: cartJson,
        street: this.street,
        city: this.city,
        state: this.state,
        zipCode: this.zipCode,
        country: this.country,
        shippingAmount: shippingAmount,
        sparksDiscount: this.sparksDiscountVal
      });
      // eslint-disable-next-line no-unused-vars
      try {
        sessionStorage.setItem(PENDING_OID_KEY, orderId);
      } catch (e) {
        /* quota */
      }

      // 2. Build success / cancel URLs
      const origin = window.location.origin;
      const basePath = window.location.pathname.split("/s/")[0] + "/s";
      const successUrl = `${origin}${basePath}/customportal?payment_success=1&oid=${orderId}&sid={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}${basePath}/customportal?payment_cancel=1`;

      // 3. Create Stripe Hosted Checkout Session
      const session = await createCheckoutSession({
        orderId,
        cartItemsJson: cartJson,
        successUrl,
        cancelUrl,
        sparksDiscount: this.sparksDiscountVal
      });

      // 4. Redirect to Stripe hosted checkout page
      window.location.href = session.url;
    } catch (err) {
      this.errorMsg =
        (err && err.body && err.body.message) ||
        "Erreur lors de l'initialisation du paiement. Réessayez.";
      this.isLoading = false;
    }
  }
}
