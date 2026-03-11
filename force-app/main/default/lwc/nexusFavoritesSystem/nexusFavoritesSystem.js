import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const MOCK_FAVORITES = [
    {
        id: '1',
        name: 'Nexus Core Pro X-1',
        description: 'The ultimate enterprise core system with integrated AI processing and real-time data synchronization.',
        family: 'Hardware',
        price: 2500,
        image: 'https://picsum.photos/seed/core/800/600',
        productCode: 'NEX-CORE-01'
    },
    {
        id: '2',
        name: 'Quantum Edge Sensor',
        description: 'High-precision edge computing sensor for industrial automation and predictive maintenance.',
        family: 'Sensors',
        price: 850,
        image: 'https://picsum.photos/seed/sensor/800/600',
        productCode: 'NEX-SENS-02'
    },
    {
        id: '3',
        name: 'Cloud Sync Module v2',
        description: 'Seamlessly bridge your local hardware with the Nexus Cloud for instant analytics and global monitoring.',
        family: 'Software',
        price: 1200,
        image: 'https://picsum.photos/seed/cloud/800/600',
        productCode: 'NEX-SOFT-03'
    }
];

export default class NexusFavoritesSystem extends LightningElement {
    @track _favorites = [...MOCK_FAVORITES];

    get favorites() {
        return this._favorites.map(p => ({
            ...p,
            formattedPrice: '$' + p.price.toLocaleString()
        }));
    }

    get isEmpty()    { return this._favorites.length === 0; }
    get savedLabel() { return this._favorites.length + ' Items Saved'; }

    handleRemoveFavorite(e) {
        const id = e.currentTarget.dataset.id;
        this._favorites = this._favorites.filter(p => p.id !== id);
        this.dispatchEvent(new ShowToastEvent({ title: 'Favoris', message: 'Produit retiré des favoris.', variant: 'info' }));
    }

    handleAddToCart(e) {
        const id = e.currentTarget.dataset.id;
        const p  = this._favorites.find(f => f.id === id);
        if (!p) return;
        this.dispatchEvent(new ShowToastEvent({ title: 'Panier', message: `${p.name} ajouté au panier.`, variant: 'success' }));
        this.dispatchEvent(new CustomEvent('addtocart', { detail: { product: p }, bubbles: true }));
    }

    handleExploreCatalog() {
        this.dispatchEvent(new CustomEvent('explorecatalog', { bubbles: true }));
    }
}
