import { LightningElement, api, track } from 'lwc';

const STATUS_COLOR_MAP = {
    'En stock':         'green',
    'En arrivage':      'amber',
    'Epuisé':           'red',
    'Sur commande 48h': 'indigo'
};

export default class NexusProductDetailModal extends LightningElement {

    @track _product       = null;
    @track _specEntries   = [];
    @track activeColorIndex = 0;
    @api isFavorited      = false;

    @api get product() { return this._product; }
    set product(value) {
        this._product = value;
        this._specEntries = (value && value.specs)
            ? Object.entries(value.specs).map(([key, val]) => ({ key, value: val }))
            : [];
        this.activeColorIndex = 0;
    }

    /* ── Open state ── */
    get isOpen() { return !!this._product; }

    /* ── Product fields ── */
    get productName()        { return this._product ? this._product.name : ''; }
    get productCode()        { return this._product ? this._product.productCode : ''; }
    get productFamily()      { return (this._product && this._product.family) ? this._product.family : 'Technology'; }
    get productDescription() { return this._product ? this._product.description : ''; }
    get productWarranty()    { return (this._product && this._product.warranty) ? this._product.warranty : null; }
    get productStatus()      { return (this._product && this._product.status) ? this._product.status : null; }
    get productRating()      { return (this._product && this._product.rating) ? this._product.rating : 0; }

    get priceFormatted() {
        if (!this._product) return '';
        return '$' + this._product.price.toLocaleString();
    }

    /* ── Image / Colors ── */
    get hasColors() {
        return !!(this._product && this._product.colors && this._product.colors.length > 0);
    }

    get currentImage() {
        if (!this._product) return '';
        if (this.hasColors) {
            const col = this._product.colors[this.activeColorIndex];
            return (col && col.image) ? col.image : this._product.image;
        }
        return this._product.image;
    }

    get colorItems() {
        if (!this.hasColors) return [];
        return this._product.colors.map((c, idx) => ({
            hex: c.hex, name: c.name, idx,
            bgStyle: `background-color: ${c.hex};`,
            btnClass: idx === this.activeColorIndex
                ? 'npdm3-color-swatch npdm3-color-swatch--active'
                : 'npdm3-color-swatch'
        }));
    }

    get glowStyle() {
        if (!this.hasColors) return 'background-color: #6366f1;';
        const col = this._product.colors[this.activeColorIndex];
        return `background-color: ${(col && col.hex) ? col.hex : '#6366f1'};`;
    }

    /* ── Features ── */
    get featureItems() {
        if (!this._product) return [];
        return (this._product.features && this._product.features.length > 0)
            ? this._product.features
            : [];
    }
    get hasFeatures() { return this.featureItems.length > 0; }

    /* ── Specs ── */
    get specEntriesDetail() { return this._specEntries; }
    get hasSpecs()          { return this._specEntries.length > 0; }

    /* ── Favorites ── */
    get favBtnClass() {
        return this.isFavorited
            ? 'npdm3-fav-btn npdm3-fav-btn--active'
            : 'npdm3-fav-btn';
    }
    get favFill()  { return this.isFavorited ? 'currentColor' : 'none'; }
    get favLabel() { return this.isFavorited ? 'Favorited' : 'Favorite'; }

    /* ── Handlers ── */

    handleClose() { this._dispatchClose(); }

    handleOverlayClick(event) {
        if (event.target === event.currentTarget) this._dispatchClose();
    }

    handleColorSelect(event) {
        this.activeColorIndex = parseInt(event.currentTarget.dataset.idx, 10);
    }

    handleFavorite() {
        this.dispatchEvent(new CustomEvent('togglefavorite', {
            detail: { product: this._product }, bubbles: true, composed: true
        }));
    }

    handleAddToCart() {
        this.dispatchEvent(new CustomEvent('addtocart', {
            detail: { product: this._product }, bubbles: true, composed: true
        }));
        this._dispatchClose();
    }

    handleQuoteRequest() {
        this.dispatchEvent(new CustomEvent('requestquote', {
            detail: { product: this._product }, bubbles: true, composed: true
        }));
    }

    _dispatchClose() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }
}
