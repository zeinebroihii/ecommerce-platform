import { LightningElement, wire, track } from "lwc";
import getActivePackages from "@salesforce/apex/ComboPackageController.getActivePackages";
import getProductsWithStock from "@salesforce/apex/ProductController.getProductsWithStock";

const SAVINGS_PCT = 0.1;

function fmt(n) {
  return (
    "$" +
    Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}

// Fallback: auto-generate combos from product catalog when no real packages exist
function buildCombos(products) {
  const COMBO_FAMILIES = [
    "Computing",
    "Connectivity",
    "Sensors & Monitoring",
    "Sustainability"
  ];
  const byFamily = {};
  products.forEach((p) => {
    const fam = p.family || "Other";
    if (!byFamily[fam]) byFamily[fam] = [];
    byFamily[fam].push(p);
  });

  const combos = [];
  let comboIdx = 0;
  const families = [
    ...COMBO_FAMILIES,
    ...Object.keys(byFamily).filter((f) => !COMBO_FAMILIES.includes(f))
  ];

  for (const fam of families) {
    const famProds = byFamily[fam];
    if (!famProds || famProds.length < 2) continue;
    const selected = famProds.slice(0, Math.min(4, famProds.length));
    const origTotal = selected.reduce((s, p) => s + (p.unitPrice || 0), 0);
    const savings = origTotal * SAVINGS_PCT;
    const comboPrice = origTotal - savings;
    combos.push({
      id: "combo-" + ++comboIdx,
      brand: fam,
      title: "Bundle — " + selected.length + " products",
      savings,
      savingsFormatted: savings.toFixed(2),
      price: comboPrice,
      priceFormatted: fmt(comboPrice),
      originalPrice: origTotal,
      originalPriceFormatted: fmt(origTotal),
      productsWithIndex: selected.map((p, idx) => ({
        id: p.productId,
        productId: p.productId,
        name: p.name,
        image: p.imageUrl || "",
        price: p.unitPrice || 0,
        priceFormatted: fmt(p.unitPrice || 0),
        family: p.family || "",
        idx
      }))
    });
  }

  return combos;
}

// Map Apex PackageWrapper → combo deal shape, using product catalog for missing images
function packageToCombo(pkg, productMap) {
  return {
    id: pkg.id,
    brand: pkg.category || "Bundle",
    title: pkg.name,
    savings: pkg.savings || 0,
    savingsFormatted: (pkg.savings || 0).toFixed(2),
    price: pkg.totalPrice || 0,
    priceFormatted: fmt(pkg.totalPrice || 0),
    originalPrice: pkg.originalPrice || 0,
    originalPriceFormatted: fmt(pkg.originalPrice || 0),
    productsWithIndex: (pkg.items || []).map((item, idx) => {
      const productId = item.productId || item.id;
      const catalogProduct = productMap.get(productId) || {};
      return {
        id: productId,
        productId,
        name: item.productName,
        image: item.productImageUrl || catalogProduct.imageUrl || "",
        price: item.productPrice || 0,
        priceFormatted: fmt(item.productPrice || 0),
        family: item.productFamily || "",
        idx
      };
    })
  };
}

export default class NexusComboDeals extends LightningElement {
  @track _combos = [];
  _hasPackages = false;
  _rawPackages = null;
  _productMap = new Map();

  @wire(getActivePackages)
  wiredPackages({ data, error }) {
    if (data) {
      this._hasPackages = true;
      this._rawPackages = data;
      this._rebuildFromPackages();
    } else if (error) {
      console.error("NexusComboDeals getActivePackages error", error);
    }
  }

  @wire(getProductsWithStock, { searchTerm: null, category: null })
  wiredProducts({ data, error }) {
    if (data) {
      this._productMap = new Map(data.map((p) => [p.productId, p]));
      if (this._hasPackages) {
        // Re-enrich package images now that catalog is available
        this._rebuildFromPackages();
      } else {
        this._combos = buildCombos(data);
      }
    } else if (error && !this._hasPackages) {
      console.error("NexusComboDeals wire error", error);
    }
  }

  _rebuildFromPackages() {
    this._combos = (this._rawPackages || [])
      .map((pkg) => packageToCombo(pkg, this._productMap))
      .filter((combo) => combo.productsWithIndex.length > 0);
  }

  get comboDeals() {
    return this._combos;
  }

  handleProductClick(event) {
    event.stopPropagation();
    const productId = event.currentTarget.dataset.productId;
    if (!productId) return;
    document.dispatchEvent(
      new CustomEvent("nexusopenproductdetail", { detail: { productId } })
    );
  }

  handlePlusClick(event) {
    event.stopPropagation();
    const comboId = event.currentTarget.dataset.comboId;
    this._dispatchBuilderInit(comboId);
  }

  handleBuildWithIt(event) {
    const comboId = event.currentTarget.dataset.comboId;
    this._dispatchBuilderInit(comboId);
  }

  _dispatchBuilderInit(comboId) {
    const combo = this._combos.find((c) => c.id === comboId);
    if (!combo) return;
    document.dispatchEvent(
      new CustomEvent("nexuscombobuilderinit", {
        detail: {
          combo: {
            ...combo,
            products: combo.productsWithIndex.map((p) => ({
              id: p.id,
              name: p.name,
              image: p.image,
              price: p.price,
              priceFormatted: p.priceFormatted
            }))
          }
        }
      })
    );
  }

  handleAddToCart(event) {
    const comboId = event.currentTarget.dataset.comboId;
    const combo = this._combos.find((c) => c.id === comboId);
    if (!combo) return;
    combo.productsWithIndex.forEach((product) => {
      this.dispatchEvent(
        new CustomEvent("addtocart", {
          detail: { product },
          bubbles: true,
          composed: true
        })
      );
    });
  }
}
