import { LightningElement, track, api } from 'lwc';

const DEFAULT_SLOTS = [
    // ── Computing ──────────────────────────────────────────────────────────
    { id: 'workstations',  label: 'Workstations',     category: 'computing',      subcategory: 'workstations',  product: null, isLocked: false, iconType: 'cpu'       },
    { id: 'edge-nodes',    label: 'Edge Nodes',        category: 'computing',      subcategory: 'edge-nodes',    product: null, isLocked: false, iconType: 'layers'    },
    { id: 'quantum',       label: 'Quantum Computing', category: 'computing',      subcategory: 'quantum',       product: null, isLocked: false, iconType: 'monitor'   },
    // ── Connectivity ───────────────────────────────────────────────────────
    { id: 'hubs',          label: 'Hubs & Gateways',  category: 'connectivity',   subcategory: 'hubs',          product: null, isLocked: false, iconType: 'network'   },
    { id: 'bridges',       label: 'Bridges',           category: 'connectivity',   subcategory: 'bridges',       product: null, isLocked: false, iconType: 'gamepad'   },
    { id: 'wireless',      label: 'Wireless Modules',  category: 'connectivity',   subcategory: 'wireless',      product: null, isLocked: false, iconType: 'harddrive' },
    // ── Sensors & Monitoring ───────────────────────────────────────────────
    { id: 'environmental', label: 'Environmental',     category: 'sensors',        subcategory: 'environmental', product: null, isLocked: false, iconType: 'eye'       },
    { id: 'visual',        label: 'Visual Monitoring', category: 'sensors',        subcategory: 'visual',        product: null, isLocked: false, iconType: 'box'       },
    { id: 'neural',        label: 'Neural Sensors',    category: 'sensors',        subcategory: 'neural',        product: null, isLocked: false, iconType: 'cpu'       },
    // ── Sustainability ─────────────────────────────────────────────────────
    { id: 'energy',        label: 'Energy Monitoring', category: 'sustainability', subcategory: 'energy',        product: null, isLocked: false, iconType: 'layers'    },
];

const SLOT_CATEGORY_MAP = {
    'workstations':  { cat: 'computing',      sub: 'workstations'  },
    'edge-nodes':    { cat: 'computing',      sub: 'edge-nodes'    },
    'quantum':       { cat: 'computing',      sub: 'quantum'        },
    'hubs':          { cat: 'connectivity',   sub: 'hubs'          },
    'bridges':       { cat: 'connectivity',   sub: 'bridges'       },
    'wireless':      { cat: 'connectivity',   sub: 'wireless'      },
    'environmental': { cat: 'sensors',        sub: 'environmental' },
    'visual':        { cat: 'sensors',        sub: 'visual'        },
    'neural':        { cat: 'sensors',        sub: 'neural'        },
    'energy':        { cat: 'sustainability', sub: 'energy'        },
};

export default class NexusComboBuilder extends LightningElement {
    @api isComboPage           = false;
    @track hasBeenInitialized  = false;
    @track isPanelOpen         = false;
    @track isMinimized         = false;
    @track slots               = DEFAULT_SLOTS.map(s => ({ ...s }));
    @track activeSlotId        = null;
    @track savedLists          = [];
    @track activeListId        = null;
    @track isNamingModalOpen   = false;
    @track isRenamingModalOpen = false;
    @track newListName         = '';
    @track renameValue         = '';

    _onAddProduct;
    _onReveal;
    _onInit;

    connectedCallback() {
        this._onAddProduct = (e) => {
            const { slotId, product } = e.detail || {};
            if (slotId && product) this._addOrUpdateProduct(slotId, product);
        };
        this._onReveal = () => {
            this.isPanelOpen = true;
            this.isMinimized = false;
        };
        this._onInit = (e) => {
            const combo = e.detail && e.detail.combo;
            if (combo) this._initializeWithCombo(combo);
        };
        document.addEventListener('nexuscomboaddproduct',  this._onAddProduct);
        document.addEventListener('nexuscomboreveal',      this._onReveal);
        document.addEventListener('nexuscombobuilderinit', this._onInit);
    }

    disconnectedCallback() {
        document.removeEventListener('nexuscomboaddproduct',  this._onAddProduct);
        document.removeEventListener('nexuscomboreveal',      this._onReveal);
        document.removeEventListener('nexuscombobuilderinit', this._onInit);
    }

    _addOrUpdateProduct(slotId, product) {
        this.slots = this.slots.map(slot =>
            slot.id === slotId ? { ...slot, product } : slot
        );
        this.isPanelOpen = true;
        this.isMinimized = false;
        this.activeSlotId = null;
        document.dispatchEvent(new CustomEvent('nexuscombobuilderslotactive', {
            detail: { slotId: null, category: null }
        }));
    }

    _removeProduct(slotId) {
        this.slots = this.slots.map(slot => {
            if (slot.id === slotId) {
                if (slot.isLocked) return slot;
                return { ...slot, product: null };
            }
            return slot;
        });
    }

    _resetBuilder() {
        this.slots = this.slots.map(slot =>
            slot.isLocked ? slot : { ...slot, product: null }
        );
        this.activeSlotId = null;
    }

    _initializeWithCombo(combo) {
        const products = combo.products || [];
        // Distribute products across slots in order — first product → first slot, etc.
        // Lock whichever slots got filled.
        const newSlots = DEFAULT_SLOTS.map((slot, idx) => {
            const product = products[idx] || null;
            return {
                ...slot,
                product:  product ? { ...product, category: slot.category } : null,
                isLocked: !!product
            };
        });
        this.slots              = newSlots;
        this.isPanelOpen        = true;
        this.isMinimized        = false;
        this.activeListId       = null;
        this.hasBeenInitialized = true;
    }

    // ── Computed getters ───────────────────────────────────────────────────────

    get isPanelVisible()        { return this.isPanelOpen && !this.isMinimized; }
    get showToggleTab()         { return this.isComboPage && this.hasBeenInitialized; }
    get selectedCount()         { return this.slots.filter(s => s.product).length; }
    get totalCost()             { return this.slots.reduce((acc, s) => acc + ((s.product && s.product.price) || 0), 0); }
    get totalCostFormatted()    { return this.totalCost.toFixed(2); }
    get totalSavings()          { return this.selectedCount * 20; }
    get totalSavingsFormatted() { return this.totalSavings.toFixed(2); }
    get wattageEstimate()       { return this.selectedCount * 80 + 100; }
    get activeList()            { return this.savedLists.find(l => l.id === this.activeListId) || null; }
    get hasActiveList()         { return !!this.activeList; }
    get panelTitle()            { return this.hasActiveList ? this.activeList.name : 'Nexus Combo Builder'; }
    get hasSavedLists()         { return this.savedLists.length > 0; }
    get noSavedLists()          { return this.savedLists.length === 0; }

    get toggleChevronClass() {
        return (this.isPanelOpen && !this.isMinimized)
            ? 'ncb-chevron ncb-chevron--right'
            : 'ncb-chevron ncb-chevron--left';
    }

    get slotsEnriched() {
        const CATEGORY_LABELS = {
            computing:      'Computing',
            connectivity:   'Connectivity',
            sensors:        'Sensors & Monitoring',
            sustainability: 'Sustainability',
        };
        let lastCat = null;
        return this.slots.map(slot => {
            const showCatHeader = slot.category !== lastCat;
            lastCat = slot.category;
            return {
                ...slot,
                hasProduct:      !!slot.product,
                slotIconClass:   slot.product ? 'ncb-slot-icon ncb-slot-icon--filled' : 'ncb-slot-icon',
                slotLabelClass:  slot.product ? 'ncb-slot-label ncb-slot-label--filled' : 'ncb-slot-label',
                productPrice:    slot.product ? (slot.product.price || 0).toFixed(2) : '0.00',
                showRemove:      slot.product && !slot.isLocked,
                showLock:        slot.product && !!slot.isLocked,
                isCpu:           slot.iconType === 'cpu',
                isLayers:        slot.iconType === 'layers',
                isMonitor:       slot.iconType === 'monitor',
                isGamepad:       slot.iconType === 'gamepad',
                isHarddrive:     slot.iconType === 'harddrive',
                isBox:           slot.iconType === 'box',
                isNetwork:       slot.iconType === 'network',
                isEye:           slot.iconType === 'eye',
                showCatHeader,
                catHeaderLabel:  showCatHeader ? (CATEGORY_LABELS[slot.category] || slot.category) : '',
            };
        });
    }

    get savedListsEnriched() {
        return this.savedLists.map(list => ({
            ...list,
            pillClass: list.id === this.activeListId
                ? 'ncb-saved-pill ncb-saved-pill--active'
                : 'ncb-saved-pill'
        }));
    }

    // ── Handlers: toggle ──────────────────────────────────────────────────────

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
    }

    handleMinimize() {
        this.isMinimized = true;
    }

    handleBackdropClick() {
        this.isMinimized = true;
    }

    // ── Handlers: slots ───────────────────────────────────────────────────────

    handleSelectSlot(event) {
        const slotId   = event.currentTarget.dataset.slotId;
        const category = event.currentTarget.dataset.category;
        this.activeSlotId = slotId;
        const catMap = SLOT_CATEGORY_MAP[slotId] || null;
        // Tell catalog which slot is active — sets category + subcategory filter
        document.dispatchEvent(new CustomEvent('nexuscombobuilderslotactive', {
            detail: { slotId, category, catMap }
        }));
        // Navigate portal to catalog tab
        document.dispatchEvent(new CustomEvent('nexuscombonavtocatalog', {
            detail: { slotId, catMap }
        }));
        this.isMinimized = true;
    }

    handleRemoveProduct(event) {
        const slotId = event.currentTarget.dataset.slotId;
        this._removeProduct(slotId);
    }

    // ── Handlers: saved lists ─────────────────────────────────────────────────

    handleReset() {
        this._resetBuilder();
    }

    handleNewBuild() {
        this._resetBuilder();
        this.activeListId = null;
        this.isNamingModalOpen = true;
    }

    handleSaveList() {
        if (this.activeList) {
            this.savedLists = this.savedLists.map(l =>
                l.id === this.activeListId
                    ? { ...l, slots: this.slots.map(s => ({ ...s })) }
                    : l
            );
        } else {
            this.isNamingModalOpen = true;
        }
    }

    handleOpenSaveModal() {
        this.isNamingModalOpen = true;
    }

    handleNamingModalClose() { this.isNamingModalOpen   = false; this.newListName  = ''; }
    handleRenamingModalClose(){ this.isRenamingModalOpen = false; this.renameValue  = ''; }

    handleNewListNameChange(event) { this.newListName  = event.target.value; }
    handleRenameValueChange(event) { this.renameValue  = event.target.value; }

    handleNamingKeyDown(event) { if (event.key === 'Enter') this.handleConfirmSave(); }
    handleRenameKeyDown(event) { if (event.key === 'Enter') this.handleConfirmRename(); }

    handleConfirmSave() {
        if (this.newListName && this.newListName.trim()) {
            const id = Math.random().toString(36).substr(2, 9);
            this.savedLists  = [...this.savedLists, {
                id,
                name:  this.newListName.trim(),
                slots: this.slots.map(s => ({ ...s }))
            }];
            this.activeListId      = id;
            this.newListName       = '';
            this.isNamingModalOpen = false;
        }
    }

    handleConfirmRename() {
        if (this.activeList && this.renameValue && this.renameValue.trim()) {
            this.savedLists       = this.savedLists.map(l =>
                l.id === this.activeListId ? { ...l, name: this.renameValue.trim() } : l
            );
            this.isRenamingModalOpen = false;
        }
    }

    handleRenameList() {
        if (this.activeList) {
            this.renameValue         = this.activeList.name;
            this.isRenamingModalOpen = true;
        }
    }

    handleDuplicateList() {
        if (this.activeList) {
            const id = Math.random().toString(36).substr(2, 9);
            this.savedLists = [...this.savedLists, {
                id,
                name:  this.activeList.name + ' (Copy)',
                slots: this.activeList.slots.map(s => ({ ...s }))
            }];
        }
    }

    handleRemoveList() {
        if (this.activeListId) {
            this.savedLists   = this.savedLists.filter(l => l.id !== this.activeListId);
            this.activeListId = null;
        }
    }

    handleLoadList(event) {
        const listId = event.currentTarget.dataset.listId;
        const list   = this.savedLists.find(l => l.id === listId);
        if (list) {
            this.slots = list.slots.map(savedSlot => {
                const def = DEFAULT_SLOTS.find(ds => ds.id === savedSlot.id);
                return { ...savedSlot, iconType: def ? def.iconType : (savedSlot.iconType || 'box') };
            });
            this.activeListId = listId;
            this.isPanelOpen  = true;
            this.isMinimized  = false;
        }
    }

    handleModalStopProp(event) { event.stopPropagation(); }

    // ── Handlers: cart ────────────────────────────────────────────────────────

    handleAddAllToCart() {
        const products = this.slots.filter(s => s.product).map(s => s.product);
        document.dispatchEvent(new CustomEvent('nexuscomboaddalltocart', { detail: { products } }));
        this.dispatchEvent(new CustomEvent('addallcart', { detail: { products }, bubbles: true, composed: true }));
    }
}
