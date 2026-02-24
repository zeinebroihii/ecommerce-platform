import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import IMAGE_URL_FIELD from '@salesforce/schema/Product2.Image_URL__c';
import saveProductImage from '@salesforce/apex/ProductController.saveProductImage';

const FIELDS = [IMAGE_URL_FIELD];

export default class ProductImageUploader extends LightningElement {

    @api recordId;
    @track uploadSuccess = false;
    @track uploadError   = null;

    _wiredRecord;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord(result) {
        this._wiredRecord = result;
    }

    get currentImageUrl() {
        return getFieldValue(this._wiredRecord.data, IMAGE_URL_FIELD);
    }

    handleUploadFinished(event) {
        this.uploadSuccess = false;
        this.uploadError   = null;

        const uploadedFiles = event.detail.files;
        if (!uploadedFiles || uploadedFiles.length === 0) return;

        const contentVersionId = uploadedFiles[0].contentVersionId;

        saveProductImage({ productId: this.recordId, contentVersionId })
            .then(() => {
                this.uploadSuccess = true;
                return refreshApex(this._wiredRecord);
            })
            .catch(err => {
                this.uploadError = err?.body?.message ?? 'Failed to save image.';
            });
    }
}
