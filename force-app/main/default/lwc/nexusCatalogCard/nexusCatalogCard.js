import { LightningElement, api } from 'lwc';

/**
 * NexusCatalogCard — customer-facing product card
 * Translated from React ProductCard.tsx
 *
 * @api product     Object: { id, name, productCode, family, price, description, image }
 * @api isFavorited Boolean — heart icon state. Default: false
 *
 * Fires:
 *   'addtocart'       — { detail: { product } }
 *   'viewdetails'     — { detail: { product } }
 *   'togglefavorite'  — { detail: { product } }
 */
export default class NexusCatalogCard extends LightningElement {
    @api product = {};
    @api isFavorited = false;

    get favBtnClass() {
        return this.isFavorited
            ? 'ncc-action-btn ncc-action-btn--fav-active'
            : 'ncc-action-btn ncc-action-btn--fav';
    }

    get favFill() {
        return this.isFavorited ? 'currentColor' : 'none';
    }

    handleAddToCart(event) {
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('addtocart', {
            detail: { product: this.product }, bubbles: true, composed: true
        }));
    }

    handleViewDetails(event) {
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('viewdetails', {
            detail: { product: this.product }, bubbles: true, composed: true
        }));
    }

    handleFavorite(event) {
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('togglefavorite', {
            detail: { product: this.product }, bubbles: true, composed: true
        }));
    }
}
