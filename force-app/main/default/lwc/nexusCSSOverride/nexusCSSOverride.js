import { LightningElement } from 'lwc';

const STYLE_ID = 'nexus-global-override';

const CSS = `
/* ── Nexus Global Override — injected by nexusCSSOverride component ── */

/* Override the Starter Template CSS variable for max page width */
:root,
html {
    --dxp-s-page-container-max-width: 100% !important;
    --dxp-s-page-max-width: 100% !important;
    --community-max-width: 100% !important;
    --siteMaxWidth: 100% !important;
}

/* Aura Experience Cloud containers */
.siteforceContentArea,
.forcePageContainer,
.siteforceBody .siteforceContentArea,
.siteforceBody .forcePageContainer {
    max-width: 100% !important;
    width: 100% !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    box-sizing: border-box !important;
}

/* Layout columns */
.forceCommunityThemeLayoutOneColumn .layoutColumn,
.forceCommunityThemeLayoutTwoColumn .layoutColumn,
.forceCommunityThemeLayout .layoutColumn,
.cCommunityThemeContainer,
.cCommunityThemeContainer > .container,
.cPageLayout,
.cPageLayoutColumn {
    max-width: 100% !important;
    width: 100% !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    box-sizing: border-box !important;
}

/* Starter Template specific max-width containers */
[class*="maxWidth"],
[class*="max-width"],
[class*="pageWidth"],
[class*="contentWidth"],
[style*="max-width: 1920px"],
[style*="max-width:1920px"] {
    max-width: 100% !important;
}

/* Region / slot wrappers */
[data-region-name],
[data-region-name] > *,
.experience-component > *,
.pageLayoutColumn {
    max-width: 100% !important;
    width: 100% !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
}

/* Body */
body, .siteforceBody {
    overflow-x: hidden !important;
    padding: 0 !important;
    margin: 0 !important;
}
`;

export default class NexusCSSOverride extends LightningElement {
    renderedCallback() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }
}
