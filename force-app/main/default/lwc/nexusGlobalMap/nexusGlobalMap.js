import { LightningElement, track, wire } from 'lwc';
import getLeadLocations from '@salesforce/apex/LeadManagementController.getLeadLocations';

export default class NexusGlobalMap extends LightningElement {
    @track selectedId = null;
    @track _leads     = [];
    @track _error     = null;
    @track _loading   = true;

    @wire(getLeadLocations)
    wiredLeads({ data, error }) {
        this._loading = false;
        if (data) {
            this._leads = data;
            this._error = null;
        } else if (error) {
            this._error = error.body ? error.body.message : 'Loading error';
        }
    }

    get isLoading()   { return this._loading; }
    get hasError()    { return !!this._error; }
    get errorMessage(){ return this._error; }
    get hasLeads()    { return !this._loading && !this._error && this._leads.length > 0; }
    get isEmpty()     { return !this._loading && !this._error && this._leads.length === 0; }
    get nodeCount()   { return this._leads.length; }

    get locations() {
        return this._leads.map(u => ({
            leadId:      u.leadId,
            name:        u.name || u.company || 'Lead',
            company:     u.company || '',
            city:        u.city    || '',
            state:       u.state   || '',
            country:     u.country || '',
            postalCode:  u.postalCode || '',
            aiScore:     u.aiScore,
            intent:      u.intent,
            initials:    u.initials || (u.name || '?').substring(0, 2).toUpperCase(),
            cardClass:   'ngm-user-card' + (this.selectedId === u.leadId ? ' ngm-user-card-active' : ''),
            chevronClass:'ngm-chevron'   + (this.selectedId === u.leadId ? ' ngm-chevron-active'   : ''),
        }));
    }

    get mapMarkers() {
        return this._leads.map(u => ({
            location: {
                City:       u.city       || '',
                State:      u.state      || '',
                Country:    u.country    || '',
                PostalCode: u.postalCode || '',
            },
            title:       u.name || u.company || 'Lead',
            description: u.company || '',
        }));
    }

    get mapZoom() {
        return this.selectedId ? 5 : 2;
    }

    get mapCenter() {
        if (!this.selectedId) {
            return { location: { Latitude: 30, Longitude: 10 } };
        }
        const lead = this._leads.find(l => l.leadId === this.selectedId);
        if (!lead) return { location: { Latitude: 30, Longitude: 10 } };
        return {
            location: {
                City:       lead.city       || '',
                State:      lead.state      || '',
                Country:    lead.country    || '',
                PostalCode: lead.postalCode || '',
            }
        };
    }

    get selectedUser() {
        if (!this.selectedId) return null;
        return this._leads.find(l => l.leadId === this.selectedId) || null;
    }

    get selectedUserInitials() {
        const u = this.selectedUser;
        if (!u) return '';
        return u.initials || (u.name || '?').substring(0, 2).toUpperCase();
    }

    handleSelectUser(event) {
        const id = event.currentTarget.dataset.id;
        this.selectedId = this.selectedId === id ? null : id;
    }
}
