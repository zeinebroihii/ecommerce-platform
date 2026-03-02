import { LightningElement, api } from 'lwc';

const MENU = [
    { id: 'dashboard',  label: 'Dashboard',      iconName: 'utility:home'    },
    { id: 'catalog',    label: 'Catalogue',       iconName: 'utility:package' },
    { id: 'orders',     label: 'Commandes',       iconName: 'utility:list'    },
    { id: 'quotations', label: 'Devis',           iconName: 'utility:chat'    },
    { id: 'cart',       label: 'Mon Panier',      iconName: 'utility:cart',   hasCartBadge: true },
    { id: 'insights',   label: 'AI Insights',     iconName: 'utility:chart'   },
    { id: 'timeline',   label: '360\u00b0 Timeline', iconName: 'utility:history' },
    { id: 'war-room',   label: 'War Room',        iconName: 'utility:people'  },
    { id: 'profile',    label: 'Profil',          iconName: 'utility:user'    },
    { id: 'cases',      label: 'R\u00e9clamations', iconName: 'utility:help'  },
];

export default class NexusPortalSidebar extends LightningElement {
    @api activeTab  = 'dashboard';
    @api cartCount  = 0;

    get menuItems() {
        return MENU.map(item => {
            const isActive = item.id === this.activeTab;
            return {
                id:          item.id,
                label:       item.label,
                iconName:    item.iconName,
                iconVariant: isActive ? 'inverse' : '',
                btnClass:    'npsb-item' + (isActive ? ' npsb-item--active' : ''),
                showBadge:   !!item.hasCartBadge && this.cartCount > 0,
                badge:       item.hasCartBadge ? this.cartCount : null,
            };
        });
    }

    handleNavClick(e) {
        const tab = e.currentTarget.dataset.tab;
        this.dispatchEvent(new CustomEvent('navigate', { detail: { tab }, bubbles: true }));
    }

    handleContactExpert() {
        this.dispatchEvent(new CustomEvent('contactexpert', { bubbles: true }));
    }

    handleLogout() {
        this.dispatchEvent(new CustomEvent('logout', { bubbles: true }));
    }
}
