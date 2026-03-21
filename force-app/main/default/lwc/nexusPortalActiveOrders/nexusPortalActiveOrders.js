import { LightningElement, api } from 'lwc';

export default class NexusPortalActiveOrders extends LightningElement {

    @api cardTitle    = 'Active Orders';

    @api ordersCount  = '12';
    @api ordersLabel  = 'Ongoing Orders';

    @api savingsAmount = '$2,450';
    @api savingsLabel  = 'Économies Réalisées';

    @api responseTime  = '1.2h';
    @api responseLabel = 'Temps de Réponse Moy.';

    handleViewOrders() {
        this.dispatchEvent(new CustomEvent('vieworders', { bubbles: true }));
    }
}
