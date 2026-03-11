import { LightningElement, api, track, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import getLeadLocationById from '@salesforce/apex/LeadManagementController.getLeadLocationById';

export default class NexusPrecisionLocator extends LightningElement {
    @api recordId;
    @track _resolvedId = null;
    @track _singleLead = null;
    @track _error      = null;
    @track _loading    = true;

    // Resolve the record ID from @api prop (parent/App Builder) or page context
    @wire(CurrentPageReference)
    wiredPageRef(pageRef) {
        const fromPage = pageRef && pageRef.attributes && pageRef.attributes.recordId
            ? pageRef.attributes.recordId
            : null;
        this._resolvedId = this.recordId || fromPage;
    }

    @wire(getLeadLocationById, { leadId: '$_resolvedId' })
    wiredSingle({ data, error }) {
        this._loading = false;
        if (data) {
            this._singleLead = data;
            this._error = null;
        } else if (error) {
            this._error = error.body ? error.body.message : 'Erreur de chargement';
        }
    }

    get isLoading()    { return !!this._resolvedId && this._loading; }
    get noRecord()     { return !this._resolvedId; }
    get hasError()     { return !!this._error; }
    get errorMessage() { return this._error; }

    get hasLead() {
        return !!this._resolvedId && !this._loading && !this._error && !!this._singleLead;
    }

    get isEmpty() {
        return !!this._resolvedId && !this._loading && !this._error && !this._singleLead;
    }

    get selectedUser() {
        const u = this._singleLead;
        if (!u) return null;
        return {
            ...u,
            initials:     u.initials || (u.name || '?').substring(0, 2).toUpperCase(),
            locationLine: [u.city, u.state, u.country].filter(Boolean).join(', '),
        };
    }

    get mapMarkers() {
        const u = this.selectedUser;
        if (!u) return [];
        return [{
            location: {
                City:       u.city       || '',
                State:      u.state      || '',
                Country:    u.country    || '',
                PostalCode: u.postalCode || '',
            },
            title:       u.name || u.company || 'Lead',
            description: `${u.company || ''} — ${[u.city, u.country].filter(Boolean).join(', ')}`,
        }];
    }

    get googleMapsUrl() {
        const u = this.selectedUser;
        if (!u) return '#';
        const q = encodeURIComponent(
            [u.city, u.postalCode, u.state, u.country].filter(Boolean).join(' ')
        );
        return `https://www.google.com/maps/search/?api=1&query=${q}`;
    }
}
