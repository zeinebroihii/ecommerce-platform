import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

/**
 * nexusContactProfile — modal overlay showing full contact details.
 * Rendered conditionally by the parent (if:true).
 *
 * Fires:  close — bubbles, no detail
 */
export default class NexusContactProfile extends NavigationMixin(LightningElement) {
    @api contactId   = '';
    @api contactName = '';
    @api account     = '';
    @api email       = '';
    @api phone       = '';
    @api title       = '';
    @api department  = '';
    @api initials    = '';

    get phoneDisplay()      { return this.phone      || '—'; }
    get departmentDisplay() { return this.department || '—'; }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
    }

    handleOverlayClick() { this.handleClose(); }

    stopPropagation(event) { event.stopPropagation(); }

    handleEdit() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: this.contactId, actionName: 'edit' }
        });
    }

    handleActivity() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: this.contactId, actionName: 'view' }
        });
    }
}
