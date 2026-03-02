import { LightningElement, wire, track } from 'lwc';
import getProductsWithStock from '@salesforce/apex/ProductController.getProductsWithStock';

const PORTAL_LOGIN  = '/NexusPortal/s/login';
const LEAD_FORM     = '/NexusPortal/s/demande-devis';
const B2C_REGISTER  = '/NexusPortal/s/login?mode=b2c-signup';

export default class NexusLoginView extends LightningElement {
    @track products = [];

    @wire(getProductsWithStock, { searchTerm: '', category: '' })
    wiredProducts({ error, data }) {
        if (data) {
            this.products = data;
        } else if (error) {
            console.error(error);
        }
    }

    // "Commencer l'aventure" — scroll to profile selector
    handleStart() {
        const section = this.template.querySelector('[data-id="login-section"]');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    }

    // "Voir les services" — scroll to product catalogue
    handleScrollProducts() {
        const section = this.template.querySelector('[data-id="products-section"]');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    }

    // B2B — go to login page (AuthView will show the login form)
    handleB2BLogin() {
        window.location.href = PORTAL_LOGIN + '?type=B2B';
    }

    // B2B — go to lead-capture / demande de devis
    handleB2BRegister() {
        window.location.href = LEAD_FORM;
    }

    // B2C — go to login page
    handleB2CLogin() {
        window.location.href = PORTAL_LOGIN + '?type=B2C';
    }

    // B2C — go to inline signup form in AuthView
    handleB2CRegister() {
        window.location.href = B2C_REGISTER;
    }

    handleAddToCart(event) {
        const productId = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('addtocart', {
            detail: { productId }
        }));
    }
}
