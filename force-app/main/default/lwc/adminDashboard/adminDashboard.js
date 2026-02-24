import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getMetrics              from '@salesforce/apex/DashboardController.getMetrics';
import getOpportunitiesByStage from '@salesforce/apex/DashboardController.getOpportunitiesByStage';
import getLeadsByStatus        from '@salesforce/apex/DashboardController.getLeadsByStatus';
import getRecentLeads          from '@salesforce/apex/DashboardController.getRecentLeads';
import getRecentOpportunities  from '@salesforce/apex/DashboardController.getRecentOpportunities';
import getRecentContacts       from '@salesforce/apex/DashboardController.getRecentContacts';
import getRecentOrders         from '@salesforce/apex/DashboardController.getRecentOrders';
import getRecentCases          from '@salesforce/apex/DashboardController.getRecentCases';
import getLeadsToConvert       from '@salesforce/apex/LeadManagementController.getLeadsToConvert';
import convertLeadFull         from '@salesforce/apex/LeadManagementController.convertLeadFull';

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6','#f97316'];
const STAGE_COLORS  = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#7c3aed','#4f46e5','#3730a3','#312e81'];
const STATUS_COLORS = ['#10b981','#f59e0b','#ef4444','#3b82f6','#6366f1','#ec4899'];

const STAGE_OPTS = [
    'Prospecting','Qualification','Needs Analysis','Value Proposition',
    'Proposal/Price Quote','Perception Analysis','Negotiation/Review','Closed Won'
];

const STATUS_META = {
    'new'      : { label: 'Nouveau',  cls: 'ls-badge ls-new'       },
    'qualified': { label: 'Qualifié', cls: 'ls-badge ls-qualified'  },
    'progress' : { label: 'En cours', cls: 'ls-badge ls-progress'   }
};

const NAV = [
    { id: 'overview',  icon: '🏠', label: "Vue d'ensemble" },
    { id: 'leads',     icon: '👥', label: 'Leads'          },
    { id: 'contacts',  icon: '👤', label: 'Contacts'       },
    { id: 'pipeline',  icon: '📈', label: 'Pipeline'       },
    { id: 'quotes',    icon: '📋', label: 'Devis'          },
    { id: 'orders',    icon: '📦', label: 'Commandes'      },
    { id: 'cases',     icon: '🎫', label: 'Support'        }
];

export default class AdminDashboard extends NavigationMixin(LightningElement) {

    @track activeSection = 'overview';
    @track currentTime   = '';
    @track currentDate   = '';
    _clockInterval;

    @track metrics     = null;
    @track stageGroups = [];
    @track statusGroups= [];
    @track recentLeads = [];
    @track recentOpps  = [];
    @track leads       = [];
    @track contacts    = [];
    @track orders      = [];
    @track cases       = [];

    @track loading = true;
    _wiredCount    = 0;
    _wiredLeads;

    @track leadFilter = 'all';

    @track showConvertModal = false;
    @track convertingLead   = null;
    @track convOppName      = '';
    @track convAmount       = '';
    @track convCloseDate    = '';
    @track convStage        = 'Qualification';
    @track converting       = false;

    @track showSuccessBanner = false;
    @track successMessage    = '';

    // ── lifecycle ──────────────────────────────────────────────────────────────
    connectedCallback() {
        this._tick();
        this._clockInterval = setInterval(() => this._tick(), 60000);
    }
    disconnectedCallback() { clearInterval(this._clockInterval); }
    _tick() {
        const now = new Date();
        this.currentTime = now.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
        this.currentDate = now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
    }

    // ── wires ──────────────────────────────────────────────────────────────────
    @wire(getMetrics)
    wm({ data, error }) {
        if (data) { this.metrics = data; this._chk(); }
        if (error) this.loading = false;
    }

    @wire(getOpportunitiesByStage)
    ws({ data, error }) {
        if (data) {
            const max = data.reduce((m,g) => Math.max(m,g.count),1);
            this.stageGroups = data.map((g,i) => ({
                ...g,
                barStyle  : `width:${Math.round((g.count/max)*100)}%;background:${STAGE_COLORS[i%STAGE_COLORS.length]}`,
                amountFmt : this._money(g.amount)
            }));
            this._chk();
        }
        if (error) this.loading = false;
    }

    @wire(getLeadsByStatus)
    wst({ data, error }) {
        if (data) {
            const total = data.reduce((s,g) => s+g.count,0)||1;
            this.statusGroups = data.map((g,i) => ({
                ...g,
                pct      : Math.round((g.count/total)*100),
                dotStyle : `background:${STATUS_COLORS[i%STATUS_COLORS.length]}`,
                segStyle : `width:${Math.round((g.count/total)*100)}%;background:${STATUS_COLORS[i%STATUS_COLORS.length]}`
            }));
            this._chk();
        }
        if (error) this.loading = false;
    }

    @wire(getRecentLeads)
    wrl({ data, error }) {
        if (data) {
            this.recentLeads = data.map(l => ({
                ...l,
                avatarStyle : `background:${this._color(l.initials)}`,
                scoreStyle  : `width:${Math.min(l.score||0,100)}%`
            }));
            this._chk();
        }
        if (error) this.loading = false;
    }

    @wire(getRecentOpportunities)
    wro({ data, error }) {
        if (data) {
            this.recentOpps = data.map(o => ({
                ...o,
                rowClass     : o.isClosedWon ? 'pt-row pt-won' : o.isClosedLost ? 'pt-row pt-lost' : 'pt-row',
                stageClass   : o.isClosedWon ? 'stage-chip chip-won' : o.isClosedLost ? 'stage-chip chip-lost' : 'stage-chip chip-open',
                payClass     : o.paymentStatus==='Paid' ? 'pay-chip paid' : o.paymentStatus==='Unpaid' ? 'pay-chip unpaid' : 'pay-chip',
                stageDotStyle: `background:${o.isClosedWon?'#10b981':o.isClosedLost?'#ef4444':'#6366f1'}`
            }));
            this._chk();
        }
        if (error) this.loading = false;
    }

    @wire(getLeadsToConvert)
    wltc(result) {
        this._wiredLeads = result;
        const { data, error } = result;
        if (data) { this.leads = data.map(l => this._enrichLead(l)); this._chk(); }
        if (error) this.loading = false;
    }

    @wire(getRecentContacts)
    wcon({ data, error }) {
        if (data) { this.contacts = data.map(c => this._enrichContact(c)); this._chk(); }
        if (error) this.loading = false;
    }

    @wire(getRecentOrders)
    word({ data, error }) {
        if (data) { this.orders = data.map(o => this._enrichOrder(o)); this._chk(); }
        if (error) this.loading = false;
    }

    @wire(getRecentCases)
    wcas({ data, error }) {
        if (data) { this.cases = data.map(c => this._enrichCase(c)); this._chk(); }
        if (error) this.loading = false;
    }

    // 9 total wire adapters
    _chk() { if (++this._wiredCount >= 9) this.loading = false; }

    // ── enrichers ──────────────────────────────────────────────────────────────
    _enrichLead(l) {
        const meta = STATUS_META[l.statusGroup] || { label: l.status, cls: 'ls-badge ls-progress' };
        const loc  = [l.city, l.postalCode, l.country].filter(Boolean).join(' ');
        return {
            ...l,
            avatarStyle : `background:${this._color(l.initials)}`,
            scoreStyle  : `width:${Math.min(l.score||0,100)}%`,
            leadUrl     : `/lightning/r/Lead/${l.leadId}/view`,
            locationStr : loc,
            relativeTime: this._relTime(l.createdTimestamp),
            statusLabel : meta.label,
            statusCls   : meta.cls,
            cardCls     : 'lead-card lead-card-' + (l.statusGroup||'new')
        };
    }

    _enrichContact(c) {
        return { ...c, avatarStyle: `background:${this._color(c.initials)}` };
    }

    _enrichOrder(o) {
        const s = (o.status || '').toLowerCase().replace(/\s+/g, '-');
        return { ...o, amountFmt: this._money(o.totalAmount), statusCls: `chip chip-${s}` };
    }

    _enrichCase(c) {
        const s = (c.status   || '').toLowerCase().replace(/\s+/g, '-');
        const p = (c.priority || '').toLowerCase();
        return { ...c, statusCls: `chip chip-${s}`, priorityCls: `chip chip-${p}` };
    }

    // ── getters ────────────────────────────────────────────────────────────────
    get navItems() {
        return NAV.map(n => {
            let badge = null;
            if (n.id==='leads')  badge = this.pendingLeadsCount  || null;
            if (n.id==='quotes') badge = this.pendingQuotesCount || null;
            if (n.id==='cases')  badge = this.openCasesCount     || null;
            return { ...n, cls:'nav-item'+(this.activeSection===n.id?' nav-active':''), badge, hasBadge:badge>0 };
        });
    }

    get activeSectionLabel() { return (NAV.find(n=>n.id===this.activeSection)||{}).label||''; }
    get greeting() {
        const h = new Date().getHours();
        return h<12?'Bonjour 👋':h<18?'Bon après-midi 👋':'Bonsoir 👋';
    }

    get isOverview()  { return this.activeSection==='overview';  }
    get isLeads()     { return this.activeSection==='leads';     }
    get isContacts()  { return this.activeSection==='contacts';  }
    get isPipeline()  { return this.activeSection==='pipeline';  }
    get isQuotes()    { return this.activeSection==='quotes';    }
    get isOrders()    { return this.activeSection==='orders';    }
    get isCases()     { return this.activeSection==='cases';     }

    get pendingLeadsCount()  { return this.leads.length; }
    get pendingQuotesCount() { return this.metrics ? this.metrics.pendingQuotes : 0; }
    get openCasesCount()     { return this.metrics ? this.metrics.openCases     : 0; }

    get contactsCount() { return this.contacts.length; }
    get ordersCount()   { return this.orders.length;   }
    get casesCount()    { return this.cases.length;    }

    get hasContacts()  { return this.contacts.length > 0; }
    get hasOrders()    { return this.orders.length   > 0; }
    get hasCases()     { return this.cases.length    > 0; }

    get kpiCards() {
        if (!this.metrics) return [];
        const m = this.metrics;
        return [
            { id:'tl', icon:'👤', label:'Total Leads',      value:m.totalLeads,                      sub:`+${m.newLeadsThisMonth} ce mois`,  cls:'kpi-card kpi-indigo' },
            { id:'cl', icon:'✅', label:'Leads Convertis',   value:m.convertedLeads,                  sub:`${m.notConvertedLeads} non conv.`, cls:'kpi-card kpi-green'  },
            { id:'ao', icon:'📈', label:'Opps Actives',      value:m.activeOpportunities,             sub:'opportunités ouvertes',            cls:'kpi-card kpi-blue'   },
            { id:'tv', icon:'💰', label:'Valeur Pipeline',   value:this._money(m.totalPipelineValue), sub:'toutes opps ouvertes',             cls:'kpi-card kpi-purple' },
            { id:'rm', icon:'🏆', label:'Revenus ce mois',   value:this._money(m.revenueThisMonth),   sub:'Closed Won / mois',                cls:'kpi-card kpi-gold'   },
            { id:'pq', icon:'📋', label:'Devis en attente',  value:m.pendingQuotes,                   sub:'statut Presented',                 cls:'kpi-card kpi-amber'  },
            { id:'oc', icon:'🎫', label:'Cases Ouverts',     value:m.openCases,                       sub:'tous statuts',                     cls:'kpi-card kpi-red'    },
            { id:'to', icon:'📦', label:'Commandes',         value:m.totalOrders,                     sub:'toutes périodes',                  cls:'kpi-card kpi-teal'   },
            { id:'uw', icon:'⚡', label:'Impayés Won',       value:m.unpaidWonOpps,                   sub:'à encaisser',                      cls:'kpi-card kpi-orange' }
        ];
    }

    get hasStageGroups()  { return this.stageGroups.length  > 0; }
    get hasStatusGroups() { return this.statusGroups.length > 0; }
    get hasRecentOpps()   { return this.recentOpps.length   > 0; }
    get recentLeadsMini() { return this.recentLeads.slice(0,5); }
    get recentOppsMini()  { return this.recentOpps.slice(0,5);  }

    get leadFilterOptions() {
        const c = { all: this.leads.length };
        this.leads.forEach(l => { c[l.statusGroup] = (c[l.statusGroup]||0)+1; });
        return [
            { value:'all',       label:'Tous',      count: c.all       ||0 },
            { value:'new',       label:'Nouveaux',  count: c.new       ||0 },
            { value:'progress',  label:'En cours',  count: c.progress  ||0 },
            { value:'qualified', label:'Qualifiés', count: c.qualified ||0 }
        ].map(f => ({ ...f, cls:'lf-btn'+(this.leadFilter===f.value?' lf-active':'') }));
    }

    get filteredLeads()    { return this.leadFilter==='all' ? this.leads : this.leads.filter(l=>l.statusGroup===this.leadFilter); }
    get hasFilteredLeads() { return this.filteredLeads.length > 0; }

    get convertingName()        { return this.convertingLead?.name        || ''; }
    get convertingCompany()     { return this.convertingLead?.company     || ''; }
    get convertingEmail()       { return this.convertingLead?.email       || ''; }
    get convertingScore()       { return this.convertingLead?.score       || 0;  }
    get convertingInitials()    { return this.convertingLead?.initials    || ''; }
    get convertingAvatarStyle() { return this.convertingLead?.avatarStyle || ''; }

    get stageOptions() {
        return STAGE_OPTS.map(v => ({ value:v, label:v, isSelected: v===this.convStage }));
    }

    // ── handlers ───────────────────────────────────────────────────────────────
    handleNav(evt)         { this.activeSection = evt.currentTarget.dataset.id; }
    handleLeadFilter(evt)  { this.leadFilter    = evt.currentTarget.dataset.value; }
    handleConvField(evt)   { this[evt.currentTarget.dataset.field] = evt.target.value; }
    handleCloseConvert()   { this.showConvertModal = false; }

    handleOpenConvert(evt) {
        const lead = this.leads.find(l => l.leadId === evt.currentTarget.dataset.id);
        if (!lead) return;
        this.convertingLead   = lead;
        this.convOppName      = (lead.company||'') + (lead.company?' — ':'') + 'TALCORE';
        this.convAmount       = '';
        this.convCloseDate    = '';
        this.convStage        = 'Qualification';
        this.showConvertModal = true;
    }

    async handleConvertConfirm() {
        if (!this.convertingLead || !this.convOppName) {
            this._toast('Champ requis', "Nom de l'opportunité obligatoire.", 'error');
            return;
        }
        this.converting = true;
        try {
            await convertLeadFull({
                leadId         : this.convertingLead.leadId,
                opportunityName: this.convOppName,
                amount         : this.convAmount ? parseFloat(this.convAmount) : null,
                closeDateStr   : this.convCloseDate,
                stage          : this.convStage
            });
            this.showConvertModal = false;
            const name = this.convertingLead.name;
            this.convertingLead = null;
            await refreshApex(this._wiredLeads);
            this._showSuccess(`✅ ${name} converti(e) avec succès ! Email de bienvenue envoyé.`);
        } catch (e) {
            const msg = e?.body?.message
                ?? (Array.isArray(e?.body) ? e.body[0]?.message : null)
                ?? e?.message
                ?? 'Échec de la conversion.';
            this._toast('Erreur', msg, 'error');
        } finally {
            this.converting = false;
        }
    }

    // ── utils ──────────────────────────────────────────────────────────────────
    _money(v) {
        if (!v) return '0 €';
        if (v>=1_000_000) return (v/1_000_000).toFixed(1)+' M€';
        if (v>=1_000)     return (v/1_000).toFixed(1)+' K€';
        return Number(v).toLocaleString('fr-FR')+' €';
    }
    _color(init) {
        const c = ((init||'').charCodeAt(0)||0)+((init||'').charCodeAt(1)||0);
        return AVATAR_COLORS[c%AVATAR_COLORS.length];
    }
    _relTime(ms) {
        if (!ms) return '';
        const d = Math.floor((Date.now()-ms)/60000);
        if (d<1)    return "À l'instant";
        if (d<60)   return `Il y a ${d} min`;
        if (d<1440) return `Il y a ${Math.floor(d/60)}h`;
        return `Il y a ${Math.floor(d/1440)} j`;
    }
    _toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
    _showSuccess(msg) {
        this.successMessage    = msg;
        this.showSuccessBanner = true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => { this.showSuccessBanner = false; }, 5000);
    }
}
