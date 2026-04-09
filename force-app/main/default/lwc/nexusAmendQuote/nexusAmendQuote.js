import { LightningElement, api, track, wire } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import { CloseActionScreenEvent } from "lightning/actions";
import amendQuote from "@salesforce/apex/ContractAmendmentService.amendQuote";
import { getRelatedListRecords } from "lightning/uiRelatedListApi";

const QUOTE_FIELDS = [
  "TALEXO_Quote__c.Name",
  "TALEXO_Quote__c.BulkDiscount__c",
  "TALEXO_Quote__c.Contract_Start_Date__c",
  "TALEXO_Quote__c.Contract_End_Date__c",
  "TALEXO_Quote__c.Status__c"
];

export default class NexusAmendQuote extends LightningElement {
  @api recordId;

  @track contractStartDate = "";
  @track contractEndDate = "";
  @track bulkDiscount = 10;
  @track lineItems = [];
  @track result = null;
  @track error = null;
  @track isLoading = false;

  // Wire original quote fields
  @wire(getRecord, { recordId: "$recordId", fields: QUOTE_FIELDS })
  wiredQuote({ data }) {
    if (data) {
      const start = getFieldValue(
        data,
        "TALEXO_Quote__c.Contract_Start_Date__c"
      );
      const end = getFieldValue(data, "TALEXO_Quote__c.Contract_End_Date__c");
      const disc = getFieldValue(data, "TALEXO_Quote__c.BulkDiscount__c");
      if (start) this.contractStartDate = start;
      if (end) this.contractEndDate = end;
      if (disc) this.bulkDiscount = disc;
    }
  }

  // Wire existing line items from original quote
  @wire(getRelatedListRecords, {
    parentRecordId: "$recordId",
    relatedListId: "NexusQuoteLineItem__r",
    fields: [
      "NexusQuoteLineItem__c.Id",
      "NexusQuoteLineItem__c.ProductName__c",
      "NexusQuoteLineItem__c.Product__c",
      "NexusQuoteLineItem__c.ProductFamily__c",
      "NexusQuoteLineItem__c.Product_Type__c",
      "NexusQuoteLineItem__c.Billing_Frequency__c",
      "NexusQuoteLineItem__c.Quantity__c",
      "NexusQuoteLineItem__c.ListPrice__c"
    ]
  })
  wiredLineItems({ data }) {
    if (data) {
      this.lineItems = data.records.map((r) => ({
        id: r.fields.Id.value,
        product2Id: r.fields.Product__c.value,
        productName: r.fields.ProductName__c.value,
        productFamily: r.fields.ProductFamily__c.value,
        productType: r.fields.Product_Type__c.value,
        billingFrequency: r.fields.Billing_Frequency__c.value,
        quantity: r.fields.Quantity__c.value,
        listPrice: r.fields.ListPrice__c.value,
        included: true
      }));
    }
  }

  get showForm() {
    return !this.result && !this.isLoading;
  }
  get prorationPct() {
    if (!this.result) return 0;
    return (this.result.prorationFactor * 100).toFixed(1);
  }
  get fullValueFormatted() {
    if (!this.result) return "";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD"
    }).format(this.result.fullValueGrandTotal);
  }
  get proratedFormatted() {
    if (!this.result) return "";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD"
    }).format(this.result.proratedGrandTotal);
  }

  handleStartDate(e) {
    this.contractStartDate = e.detail.value;
  }
  handleEndDate(e) {
    this.contractEndDate = e.detail.value;
  }
  handleDiscount(e) {
    this.bulkDiscount = e.detail.value;
  }

  handleQtyChange(e) {
    const id = e.target.dataset.id;
    const qty = parseInt(e.detail.value, 10);
    this.lineItems = this.lineItems.map((li) => {
      return li.id === id ? { ...li, quantity: qty } : li;
    });
  }

  handleIncludeChange(e) {
    const id = e.target.dataset.id;
    const checked = e.detail.checked;
    this.lineItems = this.lineItems.map((li) => {
      return li.id === id ? { ...li, included: checked } : li;
    });
  }

  async handleSubmit() {
    if (!this.contractEndDate) {
      this.error = "Contract End Date is required.";
      return;
    }
    this.isLoading = true;
    this.error = null;

    const selectedLines = this.lineItems
      .filter((li) => li.included && li.quantity > 0)
      .map((li) => ({
        product2Id: li.product2Id,
        productName: li.productName,
        productFamily: li.productFamily,
        productType: li.productType,
        billingFrequency: li.billingFrequency,
        quantity: li.quantity,
        listPrice: li.listPrice
      }));

    const request = {
      originalQuoteId: this.recordId,
      contractStartDate: this.contractStartDate,
      contractEndDate: this.contractEndDate,
      bulkDiscount: this.bulkDiscount,
      lineItems: selectedLines
    };

    try {
      this.result = await amendQuote({ requestJSON: JSON.stringify(request) });
    } catch (err) {
      this.error = err.body ? err.body.message : err.message;
    } finally {
      this.isLoading = false;
    }
  }

  handleCancel() {
    this.dispatchEvent(new CloseActionScreenEvent());
  }
}
