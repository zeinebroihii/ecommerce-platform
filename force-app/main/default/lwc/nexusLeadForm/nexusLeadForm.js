import { LightningElement, track } from 'lwc';
import createLead    from '@salesforce/apex/LeadController.createLead';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class NexusLeadForm extends LightningElement {
    @track step = 1;
    @track submitted = false;
    @track isLoading = false;

    // form field state
    @track gender = '';
    @track firstName = '';
    @track lastName = '';
    @track email = '';
    @track phone = '';
    @track responsibility = '';
    @track companyName = '';
    @track industry = '';
    @track employeeCount = '';
    @track annualRevenue = '';
    @track country = '';
    @track city = '';
    @track state = '';
    @track zip = '';
    @track domain = '';
    @track intent = '';

    // ── Computed ──────────────────────────────────────────────────────────────
    get isStep1()     { return this.step === 1; }
    get isStep2()     { return this.step === 2; }
    get isSubmitted() { return this.submitted; }
    get stepLabel()   { return `Étape ${this.step} / 2`; }
    get stepTitle()   { return this.step === 1 ? 'Informations Personnelles' : 'Votre Entreprise'; }
    get stepDesc()    { return this.step === 1
        ? 'Dites-nous qui vous êtes pour personnaliser votre expérience.'
        : 'Parlez-nous de votre structure pour adapter nos offres.'; }

    industryOptions = [
        { label: 'Technologie', value: 'Technologie' },
        { label: 'Industrie',   value: 'Industrie'   },
        { label: 'Services',    value: 'Services'     },
        { label: 'Santé',       value: 'Santé'        },
        { label: 'Finance',     value: 'Finance'      }
    ];

    // ── Field change handlers ─────────────────────────────────────────────────
    handleGender(e)       { this.gender        = e.target.value; }
    handleFirstName(e)    { this.firstName     = e.target.value; }
    handleLastName(e)     { this.lastName      = e.target.value; }
    handleEmail(e)        { this.email         = e.target.value; }
    handlePhone(e)        { this.phone         = e.target.value; }
    handleResponsibility(e){ this.responsibility = e.target.value; }
    handleCompanyName(e)  { this.companyName   = e.target.value; }
    handleIndustry(e)     { this.industry      = e.target.value; }
    handleEmployeeCount(e){ this.employeeCount = e.target.value; }
    handleAnnualRevenue(e){ this.annualRevenue = e.target.value; }
    handleCountry(e)      { this.country       = e.target.value; }
    handleCity(e)         { this.city          = e.target.value; }
    handleState(e)        { this.state         = e.target.value; }
    handleZip(e)          { this.zip           = e.target.value; }
    handleDomain(e)       { this.domain        = e.target.value; }
    handleIntent(e)       { this.intent        = e.target.value; }

    handleNext() { this.step = 2; }
    handleBack() { this.step = 1; }

    // ── Submit → LeadController.createLead ───────────────────────────────────
    async handleSubmit(event) {
        event.preventDefault();
        this.isLoading = true;
        const salutation = this.gender === 'M' ? 'Mr.' : this.gender === 'F' ? 'Ms.' : '';
        try {
            await createLead({
                salutation,
                firstName:     this.firstName,
                lastName:      this.lastName,
                email:         this.email,
                phone:         this.phone,
                title:         this.responsibility,
                company:       this.companyName,
                industry:      this.industry,
                employees:     this.employeeCount,
                annualRevenue: this.annualRevenue ? parseFloat(this.annualRevenue) : null,
                country:       this.country,
                city:          this.city,
                state:         this.state,
                zip:           this.zip,
                description:   '',
                website:       this.domain,
                intent:        this.intent
            });
            this.submitted = true;
        } catch (e) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Erreur', message: e.body.message, variant: 'error'
            }));
        } finally {
            this.isLoading = false;
        }
    }
}
