import { LightningElement, api } from 'lwc';

export default class NexusFavoritesSystem extends LightningElement {
    @api favorites = [];

    get favoritesEnriched() {
        return (this.favorites || []).map(p => ({
            ...p,
            formattedPrice: '$' + (p.price || 0).toLocaleString()
        }));
    }

    get isEmpty()    { return !this.favorites || this.favorites.length === 0; }
    get savedLabel() { return (this.favorites ? this.favorites.length : 0) + ' article(s) sauvegardé(s)'; }

    handleRemoveFavorite(e) {
        const id = e.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('removefavorite', {
            detail: { id },
            bubbles: true,
            composed: true
        }));
    }

    handleAddToCart(e) {
        const id = e.currentTarget.dataset.id;
        const p  = (this.favorites || []).find(f => f.id === id);
        if (!p) return;
        this.dispatchEvent(new CustomEvent('addtocart', { detail: { product: p }, bubbles: true, composed: true }));
    }

    handleExploreCatalog() {
        this.dispatchEvent(new CustomEvent('explorecatalog', { bubbles: true }));
    }
}
