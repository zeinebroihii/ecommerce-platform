import { LightningElement, api, wire } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import { CloseActionScreenEvent } from "lightning/actions";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import sendToDocuSign from "@salesforce/apex/NexusQuoteController.sendQuoteToDocuSign";

const FIELDS = [
  "TALEXO_Quote__c.Name",
  "TALEXO_Quote__c.DocuSign_Status__c",
  "TALEXO_Quote__c.DocuSign_Sent_At__c",
  "TALEXO_Quote__c.Status__c"
];

export default class NexusSendToDocuSign extends LightningElement {
  @api recordId;

  quoteName = "";
  sentAt = "";
  alreadySent = false;
  isLoading = false;
  isSent = false;
  isError = false;
  errorMessage = "";

  @wire(getRecord, { recordId: "$recordId", fields: FIELDS })
  wiredQuote({ data }) {
    if (data) {
      this.quoteName = getFieldValue(data, "TALEXO_Quote__c.Name");
      const dsStatus = getFieldValue(
        data,
        "TALEXO_Quote__c.DocuSign_Status__c"
      );
      const dsSentAt = getFieldValue(
        data,
        "TALEXO_Quote__c.DocuSign_Sent_At__c"
      );
      this.alreadySent = dsStatus && dsStatus !== "Not Sent";
      this.sentAt = dsSentAt ? new Date(dsSentAt).toLocaleString("fr-FR") : "";
    }
  }

  get showConfirm() {
    return !this.isLoading && !this.isSent && !this.isError;
  }

  async handleSend() {
    this.isLoading = true;
    try {
      await sendToDocuSign({ quoteId: this.recordId });
      this.isSent = true;
      this.isLoading = false;
      this.dispatchEvent(
        new ShowToastEvent({
          title: "DocuSign envelope sent",
          message:
            this.quoteName + " has been sent to the customer for signature.",
          variant: "success"
        })
      );
    } catch (err) {
      this.isLoading = false;
      this.isError = true;
      this.errorMessage = err.body ? err.body.message : err.message;
    }
  }

  handleCancel() {
    this.dispatchEvent(new CloseActionScreenEvent());
  }
}
