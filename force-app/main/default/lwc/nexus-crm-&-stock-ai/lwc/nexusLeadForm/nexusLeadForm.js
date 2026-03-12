import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { createRecord } from 'lightning/uiRecordApi';
import LEAD_OBJECT from '@salesforce/schema/Lead';

export default class NexusLeadForm extends LightningElement {
    @track formData = {};

    industryOptions = [
        { label: 'Technologie', value: 'Technology' },
        { label: 'Énergie', value: 'Energy' },
        { label: 'Logistique', value: 'Logistics' },
        { label: 'Santé', value: 'Healthcare' },
        { label: 'Autre', value: 'Other' }
    ];

    handleChange(event) {
        this.formData[event.target.name] = event.target.value;
    }

    async handleSubmit() {
        const fields = { ...this.formData };
        const recordInput = { apiName: LEAD_OBJECT.objectApiName, fields };

        try {
            await createRecord(recordInput);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Succès',
                    message: 'Votre demande de devis a été envoyée avec succès !',
                    variant: 'success'
                })
            );
            this.dispatchEvent(new CustomEvent('success'));
        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Erreur',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        }
    }
}
