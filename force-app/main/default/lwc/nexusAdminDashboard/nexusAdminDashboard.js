import { LightningElement, wire, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import getLeadsToConvert from "@salesforce/apex/LeadManagementController.getLeadsToConvert";
import convertLeadFull from "@salesforce/apex/LeadManagementController.convertLeadFull";
import provisionPortalUser from "@salesforce/apex/LeadManagementController.provisionPortalUser";
import getContacts from "@salesforce/apex/LeadManagementController.getContacts";
import approveRejectLead from "@salesforce/apex/LeadManagementController.approveRejectLead";
import sendLeadRejectionEmail from "@salesforce/apex/LeadManagementController.sendLeadRejectionEmail";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";

export default class NexusAdminDashboard extends NavigationMixin(
  LightningElement
) {
  // ── Tab state ─────────────────────────────────────────────────────────────
  @track activeTab = "crm";

  get isCrm() {
    return this.activeTab === "crm";
  }
  get isQuotes() {
    return this.activeTab === "quotes";
  }
  get isPackages() {
    return this.activeTab === "packages";
  }

  get tabCrmClass() {
    return this.activeTab === "crm" ? "nad-tab nad-tab-active" : "nad-tab";
  }
  get tabQuoteClass() {
    return this.activeTab === "quotes" ? "nad-tab nad-tab-active" : "nad-tab";
  }
  get tabPackagesClass() {
    return this.activeTab === "packages" ? "nad-tab nad-tab-active" : "nad-tab";
  }

  handleTabClick(event) {
    this.activeTab = event.currentTarget.dataset.tab;
  }

  // ── Leads state ───────────────────────────────────────────────────────────
  @track searchTerm = "";
  @track _leads = [];
  wiredLeadsResult;

  @wire(getLeadsToConvert)
  wiredLeads(result) {
    this.wiredLeadsResult = result;
    if (result.data) {
      this._leads = result.data.map((l) => ({
        ...l,
        scoreClass:
          l.score >= 80
            ? "nad-score-badge nad-score-green"
            : l.score >= 60
              ? "nad-score-badge nad-score-amber"
              : "nad-score-badge nad-score-red"
      }));
    }
  }

  // ── Contacts state ────────────────────────────────────────────────────────
  @track contactSearchTerm = "";
  @track _contacts = [];
  @track selectedContact = null;
  @track showProfile = false;
  @track showMessage = false;

  @wire(getContacts)
  wiredContacts({ data }) {
    if (data) this._contacts = data;
  }

  // ── Leads computed ────────────────────────────────────────────────────────

  get filteredLeads() {
    const q = this.searchTerm.toLowerCase();
    return q
      ? this._leads.filter(
          (l) =>
            (l.company || "").toLowerCase().includes(q) ||
            (l.name || "").toLowerCase().includes(q)
        )
      : this._leads;
  }

  get isEmptyList() {
    return this.filteredLeads.length === 0;
  }
  get hasLeads() {
    return this.filteredLeads.length > 0;
  }
  get totalLeads() {
    return this._leads.length + 124;
  }
  get newLeadsLabel() {
    return `${this._leads.length} Nouveaux`;
  }
  get totalLeadsLabel() {
    return `${this._leads.length} Active Leads`;
  }

  get pendingLeads() {
    return this._leads.filter(
      (l) => l.adminDecision == null || l.adminDecision === "Pending"
    );
  }
  get hasPendingLeads() {
    return this.pendingLeads.length > 0;
  }
  get pendingLeadsLabel() {
    return `${this.pendingLeads.length} en attente`;
  }

  // ── Contacts computed ─────────────────────────────────────────────────────

  get filteredContacts() {
    const q = this.contactSearchTerm.toLowerCase();
    return q
      ? this._contacts.filter(
          (c) =>
            (c.fullName || "").toLowerCase().includes(q) ||
            (c.account || "").toLowerCase().includes(q) ||
            (c.email || "").toLowerCase().includes(q)
        )
      : this._contacts;
  }

  get isEmptyContacts() {
    return this.filteredContacts.length === 0;
  }
  get hasContacts() {
    return this.filteredContacts.length > 0;
  }
  get totalContactsLabel() {
    return `${this._contacts.length} Contacts`;
  }

  // ── Lead handlers ─────────────────────────────────────────────────────────

  handleSearch(event) {
    this.searchTerm = event.target.value;
  }
  handleContactSearch(event) {
    this.contactSearchTerm = event.target.value;
  }
  handleRefresh() {
    return refreshApex(this.wiredLeadsResult);
  }

  handleViewLead(event) {
    const { leadId } = event.detail;
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: { recordId: leadId, actionName: "view" }
    });
  }

  async handleConvert(event) {
    const leadId = event.detail.leadId;
    let convertError = null;
    try {
      await convertLeadFull({
        leadId,
        opportunityName: "",
        amount: 0,
        closeDateStr: "",
        stage: "Qualification"
      });
    } catch (e) {
      convertError = e.body ? e.body.message : "Unknown error";
    }
    try {
      await provisionPortalUser({ leadId });
      if (convertError) {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Warning",
            message: "Partial conversion: " + convertError,
            variant: "warning"
          })
        );
      } else {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Lead converted. Credentials sent by email.",
            variant: "success"
          })
        );
      }
    } catch (e) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Portal Error",
          message: e.body ? e.body.message : String(e),
          variant: "error"
        })
      );
    }
    this.handleRefresh();
  }

  async handleLeadDecision(event) {
    const leadId = event.currentTarget.dataset.id;
    const decision = event.currentTarget.dataset.decision;
    try {
      await approveRejectLead({ leadId, decision });
      if (decision === "Rejected") {
        await sendLeadRejectionEmail({ leadId });
      }
      this.dispatchEvent(
        new ShowToastEvent({
          title: decision === "Approved" ? "Lead approuvé" : "Lead rejeté",
          message:
            decision === "Approved"
              ? "Lead approuvé. Les identifiants seront envoyés lors de la conversion."
              : "Lead rejected. Notification email sent to lead.",
          variant: decision === "Approved" ? "success" : "warning"
        })
      );
      refreshApex(this.wiredLeadsResult);
    } catch (e) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: e.body ? e.body.message : "Unknown error",
          variant: "error"
        })
      );
    }
  }

  // ── Contact handlers ──────────────────────────────────────────────────────

  handleProfileClick(event) {
    this.selectedContact = event.detail;
    this.showMessage = false;
    this.showProfile = true;
  }

  handleMessageClick(event) {
    this.selectedContact = event.detail;
    this.showProfile = false;
    this.showMessage = true;
  }

  handleCloseProfile() {
    this.showProfile = false;
    this.selectedContact = null;
  }

  handleCloseMessage() {
    this.showMessage = false;
    this.selectedContact = null;
  }
}