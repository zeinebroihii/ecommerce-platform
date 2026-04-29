import { LightningElement, wire, track } from "lwc";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getAllPackages from "@salesforce/apex/ComboPackageController.getAllPackages";
import savePackage from "@salesforce/apex/ComboPackageController.savePackage";
import deletePackage from "@salesforce/apex/ComboPackageController.deletePackage";
import togglePackageActive from "@salesforce/apex/ComboPackageController.togglePackageActive";
import getProductsWithStock from "@salesforce/apex/ProductController.getProductsWithStock";

const CATEGORY_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "Computing", label: "Computing" },
  { value: "Connectivity", label: "Connectivity" },
  { value: "Sensors & Monitoring", label: "Sensors & Monitoring" },
  { value: "Sustainability", label: "Sustainability" },
  { value: "Multi-Category", label: "Multi-Category" }
];

const PICKER_CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "Computing", label: "Computing" },
  { value: "Connectivity", label: "Connectivity" },
  { value: "Sensors & Monitoring", label: "Sensors & Monitoring" },
  { value: "Sustainability", label: "Sustainability" }
];

function fmt(n) {
  return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default class NexusComboPackageManager extends LightningElement {
  // ── Package list ──────────────────────────────────────────────────────────
  @track _packages = [];
  _wiredResult;

  @wire(getAllPackages)
  wiredPackages(result) {
    this._wiredResult = result;
    if (result.data) {
      this._packages = result.data;
    } else if (result.error) {
      console.error("getAllPackages error", result.error);
    }
  }

  // ── Product catalog for picker ────────────────────────────────────────────
  @track _allProducts = [];

  @wire(getProductsWithStock, { searchTerm: null, category: null })
  wiredProducts({ data }) {
    if (data) this._allProducts = data;
  }

  // ── Editor state ──────────────────────────────────────────────────────────
  @track isEditing = false;
  @track isSaving = false;
  @track editId = null;
  @track editName = "";
  @track editDescription = "";
  @track editCategory = "";
  @track editDiscount = 10;
  @track editIsActive = true;
  @track editItems = []; // [{productId, productName, productImageUrl, productPrice, productFamily}]

  // ── Picker state ──────────────────────────────────────────────────────────
  @track isPickerOpen = false;
  @track pickerSearch = "";
  @track pickerCategory = "";
  @track pickerSelected = []; // productIds currently checked in picker

  // ── Computed: package list ────────────────────────────────────────────────
  get hasPackages() {
    return this._packages.length > 0;
  }

  get packagesEnriched() {
    return this._packages.map((pkg) => ({
      ...pkg,
      cardClass: "ncpm-pkg-card" + (pkg.isActive ? "" : " ncpm-pkg-card--inactive"),
      statusLabel: pkg.isActive ? "Active" : "Inactive",
      statusBadgeClass: pkg.isActive ? "ncpm-status ncpm-status--active" : "ncpm-status ncpm-status--inactive",
      toggleTitle: pkg.isActive ? "Deactivate" : "Activate",
      noItems: !pkg.items || pkg.items.length === 0,
      totalPriceFormatted: fmt(pkg.totalPrice),
      originalPriceFormatted: fmt(pkg.originalPrice),
      discountLabel: "-" + (pkg.discountPercent || 10) + "%"
    }));
  }

  // ── Computed: editor ──────────────────────────────────────────────────────
  get editorTitle() {
    return this.editId ? "Edit Package" : "New Package";
  }

  get editItemCount() {
    return this.editItems.length;
  }

  get hasEditItems() {
    return this.editItems.length > 0;
  }

  get editItemsEnriched() {
    return this.editItems.map((item) => ({
      ...item,
      priceFormatted: fmt(item.productPrice)
    }));
  }

  get editOriginalPrice() {
    return this.editItems.reduce((s, i) => s + (i.productPrice || 0), 0);
  }

  get editOriginalPriceFormatted() {
    return fmt(this.editOriginalPrice);
  }

  get editBundlePrice() {
    const disc = parseFloat(this.editDiscount) || 0;
    return this.editOriginalPrice * (1 - disc / 100);
  }

  get editBundlePriceFormatted() {
    return fmt(this.editBundlePrice);
  }

  get editSavingsFormatted() {
    return fmt(this.editOriginalPrice - this.editBundlePrice);
  }

  // ── Computed: category select options ────────────────────────────────────
  get categoryOptions() {
    return CATEGORY_OPTIONS.map((o) => ({ ...o, selected: o.value === this.editCategory }));
  }

  get pickerCategoryOptions() {
    return PICKER_CATEGORY_OPTIONS.map((o) => ({ ...o, selected: o.value === this.pickerCategory }));
  }

  // ── Computed: product picker ──────────────────────────────────────────────
  get filteredPickerProducts() {
    const search = (this.pickerSearch || "").toLowerCase();
    const cat = this.pickerCategory;
    return this._allProducts
      .filter((p) => {
        const matchSearch = !search || (p.name || "").toLowerCase().includes(search);
        const matchCat = !cat || (p.family || "") === cat;
        return matchSearch && matchCat;
      })
      .map((p) => ({
        ...p,
        id: p.productId,
        priceFormatted: fmt(p.unitPrice),
        isSelected: this.pickerSelected.includes(p.productId),
        pickerCardClass: "ncpm-picker-card" + (this.pickerSelected.includes(p.productId) ? " ncpm-picker-card--selected" : "")
      }));
  }

  get hasPickerProducts() {
    return this.filteredPickerProducts.length > 0;
  }

  get selectedPickerCount() {
    return this.pickerSelected.length;
  }

  // ── renderedCallback: sync textarea value ─────────────────────────────────
  renderedCallback() {
    const ta = this.template.querySelector("[data-id='description-area']");
    if (ta && ta.value !== this.editDescription) {
      ta.value = this.editDescription;
    }
  }

  // ── Handlers: list ────────────────────────────────────────────────────────
  handleNewPackage() {
    this.editId = null;
    this.editName = "";
    this.editDescription = "";
    this.editCategory = "";
    this.editDiscount = 10;
    this.editIsActive = true;
    this.editItems = [];
    this.isEditing = true;
  }

  handleEditPackage(event) {
    const id = event.currentTarget.dataset.id;
    const pkg = this._packages.find((p) => p.id === id);
    if (!pkg) return;
    this.editId = pkg.id;
    this.editName = pkg.name || "";
    this.editDescription = pkg.description || "";
    this.editCategory = pkg.category || "";
    this.editDiscount = pkg.discountPercent || 10;
    this.editIsActive = pkg.isActive !== false;
    this.editItems = (pkg.items || []).map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productImageUrl: item.productImageUrl,
      productPrice: item.productPrice || 0,
      productFamily: item.productFamily || ""
    }));
    this.isEditing = true;
  }

  handleCancelEdit() {
    this.isEditing = false;
  }

  async handleDeletePackage(event) {
    const id = event.currentTarget.dataset.id;
    // eslint-disable-next-line no-alert
    if (!confirm("Delete this combo package? This cannot be undone.")) return;
    try {
      await deletePackage({ packageId: id });
      await refreshApex(this._wiredResult);
      this._toast("Package deleted", "", "success");
    } catch (e) {
      this._toast("Delete failed", e.body?.message || "", "error");
    }
  }

  async handleToggleActive(event) {
    const id = event.currentTarget.dataset.id;
    const pkg = this._packages.find((p) => p.id === id);
    if (!pkg) return;
    try {
      await togglePackageActive({ packageId: id, isActive: !pkg.isActive });
      await refreshApex(this._wiredResult);
    } catch (e) {
      this._toast("Update failed", e.body?.message || "", "error");
    }
  }

  // ── Handlers: editor fields ───────────────────────────────────────────────
  handleEditName(event) { this.editName = event.target.value; }
  handleEditDescription(event) { this.editDescription = event.target.value; }
  handleEditCategory(event) { this.editCategory = event.target.value; }
  handleEditDiscount(event) { this.editDiscount = parseFloat(event.target.value) || 0; }
  handleEditIsActive(event) { this.editIsActive = event.target.checked; }

  handleRemoveItem(event) {
    const id = event.currentTarget.dataset.id;
    this.editItems = this.editItems.filter((i) => i.productId !== id);
  }

  async handleSavePackage() {
    if (!this.editName || !this.editName.trim()) {
      this._toast("Package name is required", "", "warning");
      return;
    }
    this.isSaving = true;
    try {
      const payload = {
        id: this.editId,
        name: this.editName.trim(),
        description: this.editDescription,
        category: this.editCategory,
        discountPercent: this.editDiscount,
        isActive: this.editIsActive,
        items: this.editItems.map((item, idx) => ({ ...item, sortOrder: idx }))
      };
      await savePackage({ packageJson: JSON.stringify(payload) });
      await refreshApex(this._wiredResult);
      this.isEditing = false;
      this._toast("Package saved!", "", "success");
    } catch (e) {
      this._toast("Save failed", e.body?.message || "", "error");
    } finally {
      this.isSaving = false;
    }
  }

  // ── Handlers: product picker ──────────────────────────────────────────────
  handleOpenProductPicker() {
    this.pickerSearch = "";
    this.pickerCategory = this.editCategory && this.editCategory !== "Multi-Category" ? this.editCategory : "";
    this.pickerSelected = this.editItems.map((i) => i.productId);
    this.isPickerOpen = true;
  }

  handleClosePicker() { this.isPickerOpen = false; }
  handleClosePickerOverlay() { this.isPickerOpen = false; }
  handleModalStopProp(event) { event.stopPropagation(); }
  handlePickerSearch(event) { this.pickerSearch = event.target.value; }
  handlePickerCategory(event) { this.pickerCategory = event.target.value; }

  handlePickProduct(event) {
    const id = event.currentTarget.dataset.id;
    if (this.pickerSelected.includes(id)) {
      this.pickerSelected = this.pickerSelected.filter((s) => s !== id);
    } else {
      this.pickerSelected = [...this.pickerSelected, id];
    }
  }

  handleConfirmPicker() {
    // Merge picker selection into editItems, preserving existing order
    const existingIds = this.editItems.map((i) => i.productId);

    // Remove items that were deselected in picker
    const kept = this.editItems.filter((i) => this.pickerSelected.includes(i.productId));

    // Add newly selected products
    const newIds = this.pickerSelected.filter((id) => !existingIds.includes(id));
    const newItems = newIds
      .map((id) => {
        const p = this._allProducts.find((prod) => prod.productId === id);
        if (!p) return null;
        return {
          productId: p.productId,
          productName: p.name,
          productImageUrl: p.imageUrl || "",
          productPrice: p.unitPrice || 0,
          productFamily: p.family || ""
        };
      })
      .filter(Boolean);

    this.editItems = [...kept, ...newItems];
    this.isPickerOpen = false;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  _toast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }
}
