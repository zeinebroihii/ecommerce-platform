import { LightningElement, api } from "lwc";

export default class NexusSparks extends LightningElement {
  @api sparksBalance = 1250;

  get formattedValue() {
    return "$" + ((parseInt(this.sparksBalance, 10) || 0) / 100).toFixed(2);
  }

  handleIgniteClick() {
    this.dispatchEvent(
      new CustomEvent("ignite", { bubbles: true, composed: true })
    );
  }
}
