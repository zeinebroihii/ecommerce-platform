import { LightningElement, wire, track } from 'lwc';
import getLeads from '@salesforce/apex/NexusAdminController.getLeads';
import convertLead from '@salesforce/apex/NexusAdminController.convertLead';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class NexusAdminDashboard extends LightningElement {
    @track leads = [];
    wiredLeadsResult;

    @wire(getLeads)
    wiredLeads(result) {
        this.wiredLeadsResult = result;
        if (result.data) {
            this.leads = result.data.map(lead => ({
                ...lead,
                scoreStyle: `width: ${lead.Nexus_Score__c}%`,
                statusClass: this.getStatusClass(lead.Status)
            }));
        }
    }

    getStatusClass(status) {
        const base = "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ";
        if (status === 'New') return base + "bg-indigo-50 text-indigo-600";
        if (status === 'Qualified') return base + "bg-emerald-50 text-emerald-600";
        return base + "bg-slate-50 text-slate-600";
    }

    handleRefresh() {
        return refreshApex(this.wiredLeadsResult);
    }

    async handleConvert(event) {
        const leadId = event.target.dataset.id;
        try {
            await convertLead({ leadId });
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Succès',
                    message: 'Lead converti avec succès !',
                    variant: 'success'
                })
            );
            this.handleRefresh();
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
