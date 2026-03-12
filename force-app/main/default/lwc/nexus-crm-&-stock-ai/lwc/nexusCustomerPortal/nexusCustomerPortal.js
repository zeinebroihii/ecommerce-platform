import { LightningElement, track } from 'lwc';

export default class NexusCustomerPortal extends LightningElement {
    @track activeTab = 'dashboard';

    get tabs() {
        const baseClass = "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ";
        return [
            { id: 'dashboard', label: 'Dashboard', icon: 'utility:dashboard', className: baseClass + (this.activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-100'), iconVariant: this.activeTab === 'dashboard' ? 'inverse' : '' },
            { id: 'catalog', label: 'Catalogue', icon: 'utility:package', className: baseClass + (this.activeTab === 'catalog' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-100'), iconVariant: this.activeTab === 'catalog' ? 'inverse' : '' },
            { id: 'cart', label: 'Mon Panier', icon: 'utility:cart', className: baseClass + (this.activeTab === 'cart' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-100'), iconVariant: this.activeTab === 'cart' ? 'inverse' : '' },
            { id: 'profile', label: 'Profil', icon: 'utility:user', className: baseClass + (this.activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-100'), iconVariant: this.activeTab === 'profile' ? 'inverse' : '' },
            { id: 'cases', label: 'Réclamations', icon: 'utility:help', className: baseClass + (this.activeTab === 'cases' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-100'), iconVariant: this.activeTab === 'cases' ? 'inverse' : '' }
        ];
    }

    get isDashboard() { return this.activeTab === 'dashboard'; }
    get isCatalog() { return this.activeTab === 'catalog'; }
    get isProfile() { return this.activeTab === 'profile'; }

    handleTabChange(event) {
        this.activeTab = event.currentTarget.dataset.id;
    }
}
