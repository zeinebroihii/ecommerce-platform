import { LightningElement, track } from 'lwc';
import createLead from '@salesforce/apex/LeadController.createLead';

export default class LeadCapture extends LightningElement {

    @track salutation    = '';
    @track firstName     = '';
    @track lastName      = '';
    @track email         = '';
    @track phone         = '';
    @track title         = '';
    @track company       = '';
    @track industry      = '';
    @track employees     = '';
    @track annualRevenue = '';
    @track country       = 'United Kingdom';
    @track city          = '';
    @track state         = '';
    @track zip           = '';
    @track description   = '';
    @track isSubmitted   = false;
    @track isLoading     = false;
    @track errorMsg      = null;

    get salutationOptions() {
        return [
            { label: '-- Civilité --', value: '' },
            { label: 'M.',             value: 'Mr.' },
            { label: 'Mme',            value: 'Ms.' },
            { label: 'Dr.',            value: 'Dr.' },
            { label: 'Prof.',          value: 'Prof.' }
        ];
    }

    get industryOptions() {
        return [
            { label: "-- Secteur d'activité --",  value: '' },
            { label: 'Technologie & IT',           value: 'Technology' },
            { label: 'Finance & Banque',           value: 'Finance' },
            { label: 'Santé',                      value: 'Healthcare' },
            { label: 'Éducation',                  value: 'Education' },
            { label: 'Commerce & E-Commerce',      value: 'Retail' },
            { label: 'Industrie & Fabrication',    value: 'Manufacturing' },
            { label: 'Juridique & Professionnel',  value: 'Legal' },
            { label: 'Secteur Public',             value: 'Government' },
            { label: 'Télécommunications',         value: 'Telecommunications' },
            { label: 'Autre',                      value: 'Other' }
        ];
    }

    get employeeOptions() {
        return [
            { label: "-- Taille de l'entreprise --", value: '' },
            { label: '1 – 10',    value: '1-10' },
            { label: '11 – 50',   value: '11-50' },
            { label: '51 – 200',  value: '51-200' },
            { label: '201 – 1 000', value: '201-1000' },
            { label: '1 000+',    value: '1000+' }
        ];
    }

    handleField(event) {
        this[event.target.name] = event.target.value;
    }

    handleSubmit() {
        const allValid = [...this.template.querySelectorAll(
            'lightning-input, lightning-combobox, lightning-textarea'
        )].reduce((valid, el) => el.reportValidity() && valid, true);
        if (!allValid) return;

        this.isLoading = true;
        this.errorMsg  = null;

        createLead({
            salutation:    this.salutation,
            firstName:     this.firstName,
            lastName:      this.lastName,
            email:         this.email,
            phone:         this.phone,
            title:         this.title,
            company:       this.company,
            industry:      this.industry,
            employees:     this.employees,
            annualRevenue: this.annualRevenue ? parseFloat(this.annualRevenue) : null,
            country:       this.country,
            city:          this.city,
            state:         this.state,
            zip:           this.zip,
            description:   this.description
        })
        .then(() => { this.isSubmitted = true; })
        .catch(err => { this.errorMsg = err && err.body ? err.body.message : 'Envoi échoué. Veuillez réessayer.'; })
        .finally(() => { this.isLoading = false; });
    }

    handleReset() {
        this.isSubmitted = false;
        this.errorMsg    = null;
        ['salutation','firstName','lastName','email','phone','title',
         'company','industry','employees','annualRevenue','city','state','zip','description']
            .forEach(f => { this[f] = ''; });
        this.country = 'United Kingdom';
    }
}
