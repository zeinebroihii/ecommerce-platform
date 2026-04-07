import { LightningElement, wire, track } from "lwc";
import getProductsWithStock from "@salesforce/apex/ProductController.getProductsWithStock";

const COMBO_FAMILIES = [
  "Computing",
  "Connectivity",
  "Sensors & Monitoring",
  "Sustainability"
];
const SAVINGS_PCT = 0.1; // 10% bundle discount

function fmt(n) {
  return (
    "$" +
    Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}

function buildCombos(products) {
  // Group products by family
  const byFamily = {};
  products.forEach((p) => {
    const fam = p.family || "Other";
    if (!byFamily[fam]) byFamily[fam] = [];
    byFamily[fam].push(p);
  });

  const combos = [];
  let comboIdx = 0;

  // Priority order: target families first, then whatever else exists
  const families = [
    ...COMBO_FAMILIES,
    ...Object.keys(byFamily).filter((f) => !COMBO_FAMILIES.includes(f))
  ];

  for (const fam of families) {
    if (combos.length >= 4) break;
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

  // Fill remaining slots with cross-family combos if needed
  if (combos.length < 4) {
    const usedIds = new Set(
      combos.flatMap((c) => c.productsWithIndex.map((p) => p.id))
    );
    const leftover = products.filter((p) => !usedIds.has(p.productId));

    while (combos.length < 4 && leftover.length >= 2) {
      const selected = leftover.splice(0, Math.min(3, leftover.length));
      const origTotal = selected.reduce((s, p) => s + (p.unitPrice || 0), 0);
      const savings = origTotal * SAVINGS_PCT;
      const comboPrice = origTotal - savings;

      combos.push({
        id: "combo-" + ++comboIdx,
        brand: "Multi-Category",
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
  }

  return combos;
}

export default class NexusComboDeals extends LightningElement {
  @track _combos = [];

  @wire(getProductsWithStock, { searchTerm: null, category: null })
  wiredProducts({ error, data }) {
    if (data) {
      this._combos = buildCombos(data);
    } else if (error) {
      console.error("NexusComboDeals wire error", error);
    }
  }

  get comboDeals() {
    return this._combos;
  }

  // Click on individual product thumbnail → open product detail view
  handleProductClick(event) {
    event.stopPropagation();
    const productId = event.currentTarget.dataset.productId;
    if (!productId) return;
    document.dispatchEvent(
      new CustomEvent("nexusopenproductdetail", {
        detail: { productId }
      })
    );
  }

  // Click "+" center icon → open combo builder with this combo
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
