import { LightningElement } from "lwc";

export default class NexusPowerBITab extends LightningElement {
  get embedUrl() {
    return "https://app.powerbi.com/reportEmbed?reportId=81994956-e352-4ef0-9120-923269cf59ef&autoAuth=true";
  }
}
