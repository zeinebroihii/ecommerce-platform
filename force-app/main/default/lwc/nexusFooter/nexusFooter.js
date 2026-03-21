import { LightningElement, track } from 'lwc';

export default class NexusFooter extends LightningElement {

    socials   = ['Twitter', 'LinkedIn', 'GitHub'];
    solutions = ['Stock Management', 'Predictive Analytics', 'IoT Integration', 'AI Support'];
    company   = ['À Propos', 'Carrières', 'Partenaires', 'Contact'];

    @track newsletterEmail = '';
    @track subscribed      = false;

    handleEmailInput(event) {
        this.newsletterEmail = event.target.value;
    }

    handleSubscribe() {
        if (!this.newsletterEmail) return;
        // TODO: wire to an Apex email-subscription endpoint
        this.subscribed      = true;
        this.newsletterEmail = '';
        setTimeout(() => { this.subscribed = false; }, 4000);
    }
}
