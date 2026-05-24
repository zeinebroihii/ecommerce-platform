import { LightningElement, wire, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { refreshApex } from "@salesforce/apex";
import getStockProducts from "@salesforce/apex/ProductController.getStockProducts";

/**
 * nexusStockBoard — Stock Optimization board.
 * Wires to ProductController.getStockProducts().
 * Left: product card grid (c-nexus-product-card)
 * Right: AI insights panel (c-nexus-stock-guard)
 */
export default class NexusStockBoard extends NavigationMixin(LightningElement) {
  @track _products = [];
  _wiredProducts;

  @wire(getStockProducts)
  wiredProducts(result) {
    this._wiredProducts = result;
    if (result.data) this._products = result.data;
  }

  connectedCallback() {
    refreshApex(this._wiredProducts);
  }

  get isEmpty() {
    return this._products.length === 0;
  }
  get hasProducts() {
    return this._products.length > 0;
  }
  get totalLabel() {
    return `${this._products.length} Products`;
  }

  handleAudit() {
    // Placeholder — could trigger a Flow or Einstein audit
  }

  handleAddProduct() {
    this[NavigationMixin.Navigate]({
      type: "standard__objectPage",
      attributes: { objectApiName: "Product2", actionName: "new" }
    });
  }
}
