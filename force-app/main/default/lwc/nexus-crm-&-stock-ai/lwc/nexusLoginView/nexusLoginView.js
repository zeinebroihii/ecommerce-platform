import { LightningElement, wire, track } from 'lwc';
import getProducts from '@salesforce/apex/NexusProductController.getProducts';

export default class NexusLoginView extends LightningElement {
    @track products = [];

    @wire(getProducts)
    wiredProducts({ error, data }) {
        if (data) {
            this.products = data;
        } else if (error) {
            console.error(error);
        }
    }

    handleStart() {
        this.dispatchEvent(new CustomEvent('start'));
    }

    handleAddToCart(event) {
        const productId = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('addtocart', {
            detail: { productId }
        }));
    }
}
