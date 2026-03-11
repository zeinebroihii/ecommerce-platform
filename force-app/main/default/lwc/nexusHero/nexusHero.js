import { LightningElement } from 'lwc';

/**
 * NexusHero — Landing page hero section
 * Translated from React NexusHero (NexusLandingBundle.tsx)
 *
 * Fires: 'exploretriggered' CustomEvent (bubbles, composed)
 *        Parent should scroll to #products-section on receive.
 *
 * Usage:
 *   <c-nexus-hero onexploretriggered={handleExplore}></c-nexus-hero>
 */
export default class NexusHero extends LightningElement {
    // "Explore Products" → scroll to products + notify parent
    handleExploreProducts() {
        const el = document.getElementById('products-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.dispatchEvent(new CustomEvent('exploretriggered', { bubbles: true, composed: true }));
    }

    // "Get Started" → scroll to login/auth section
    handleGetStarted() {
        const el = document.getElementById('login-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
