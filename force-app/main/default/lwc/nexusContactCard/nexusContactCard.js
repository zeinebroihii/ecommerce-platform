import { LightningElement, api } from 'lwc';

/**
 * nexusContactCard — single contact card in the Contact Directory.
 *
 * @api contactId   — SF Contact Id
 * @api contactName — full name
 * @api account     — account / company name
 * @api email       — email address
 * @api phone       — phone number
 * @api title       — job title
 * @api department  — department
 * @api initials    — 1-2 char initials
 *
 * Fires:
 *   profileclick — detail: { contactId, contactName, account, email, phone, title, department, initials }
 *   messageclick — detail: { contactId, contactName, initials }
 */
export default class NexusContactCard extends LightningElement {
    @api contactId   = '';
    @api contactName = '';
    @api account     = '';
    @api email       = '';
    @api phone       = '';
    @api title       = '';
    @api department  = '';
    @api initials    = '';

    handleProfile() {
        this.dispatchEvent(new CustomEvent('profileclick', {
            detail: {
                contactId:   this.contactId,
                contactName: this.contactName,
                account:     this.account,
                email:       this.email,
                phone:       this.phone,
                title:       this.title,
                department:  this.department,
                initials:    this.initials
            },
            bubbles: true
        }));
    }

    handleMessage() {
        this.dispatchEvent(new CustomEvent('messageclick', {
            detail: {
                contactId:   this.contactId,
                contactName: this.contactName,
                initials:    this.initials
            },
            bubbles: true
        }));
    }
}
