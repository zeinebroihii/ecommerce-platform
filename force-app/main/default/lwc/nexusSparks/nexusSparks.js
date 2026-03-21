import { LightningElement, api, track } from 'lwc';

export default class NexusSparks extends LightningElement {

    @api sparksBalance = 1250;
    @track _showModal  = false;

    get formattedValue() {
        return '$' + ((parseInt(this.sparksBalance, 10) || 0) / 100).toFixed(2);
    }

    handleBannerClick()        { this._showModal = true; }
    handleIgniteClick(e)       { e.stopPropagation(); this._showModal = true; }
    handleOverlayClick()       { this._showModal = false; }
    closeModal()               { this._showModal = false; }
    stopProp(e)                { e.stopPropagation(); }
}
