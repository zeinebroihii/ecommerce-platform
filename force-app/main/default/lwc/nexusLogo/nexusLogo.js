import { LightningElement, api } from 'lwc';

/**
 * nexusLogo — reusable Nexus brand logo
 *
 * Props (all optional):
 *   variant  : 'slate' | 'indigo' | 'emerald' | 'white' | 'gradient'  (default: 'slate')
 *   size     : 'xs' | 'sm' | 'md' | 'lg' | 'xl'                       (default: 'md')
 *   hide-text: Boolean — omit to show text, add attribute to hide it
 *   subtitle : String                                                   (default: none)
 *
 * Events:
 *   logoclick — fired on click
 */
export default class NexusLogo extends LightningElement {

    @api variant  = 'slate';
    @api size     = 'md';
    @api hideText = false;
    @api subtitle;

    connectedCallback() {
        if (!document.getElementById('nexus-logo-font')) {
            const link = document.createElement('link');
            link.id   = 'nexus-logo-font';
            link.rel  = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&display=swap';
            document.head.appendChild(link);
        }
    }

    // ── Icon size ────────────────────────────────────────────────────
    get iconSize() {
        return ({ xs: 'x-small', sm: 'x-small', md: 'small', lg: 'small', xl: 'medium' })[this.size] || 'small';
    }

    get hasSubtitle() { return !!this.subtitle; }

    // ── CSS class builders ───────────────────────────────────────────
    get containerClass() {
        const gap = ({ xs: 'nl-gap-xs', sm: 'nl-gap-sm', md: 'nl-gap-md', lg: 'nl-gap-lg', xl: 'nl-gap-xl' })[this.size] || 'nl-gap-md';
        return `nl-root ${gap}`;
    }

    get iconBoxClass() {
        const sz = `nl-box-${this.size    || 'md'}`;
        const vr = `nl-box-${this.variant || 'slate'}`;
        return `nl-icon-box ${sz} ${vr}`;
    }

    get glowClass()     { return `nl-glow nl-glow-${this.variant || 'slate'}`; }
    get zapClass()      { return `nl-zap nl-zap-${this.variant   || 'slate'}`; }
    get iconSvgClass()  { return `nl-icon-svg nl-icon-${this.size || 'md'} nl-zap-${this.variant || 'slate'}`; }

    get nameClass() {
        const sz = `nl-name-${this.size    || 'md'}`;
        const vr = `nl-name-${this.variant || 'slate'}`;
        return `nl-name ${sz} ${vr}`;
    }

    // ── Events ───────────────────────────────────────────────────────
    handleClick() {
        this.dispatchEvent(new CustomEvent('logoclick'));
    }
}
