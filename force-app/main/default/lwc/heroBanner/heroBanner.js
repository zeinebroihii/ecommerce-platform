import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class HeroBanner extends NavigationMixin(LightningElement) {

    @api shopUrl    = '/shop/s/';
    @api supportUrl = '/shop/s/';

    handleShopNow() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: { url: this.shopUrl }
        });
    }

    handleSupport() {
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: { url: this.supportUrl }
        });
    }
}
