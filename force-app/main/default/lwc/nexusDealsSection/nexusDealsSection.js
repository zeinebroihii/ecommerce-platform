import { LightningElement } from 'lwc';

const DEALS = [
    {
        id: 'deal-1', name: 'Nexus Core Hub v3', productCode: 'NX-100',
        family: 'Central Systems', originalPrice: 1299, salePrice: 899, discount: 31,
        badge: 'Flash Sale',
        image: 'https://picsum.photos/seed/hub/800/800',
        description: 'The ultimate central intelligence unit for your industrial ecosystem. Powered by Nexus Neural Engine.',
        features: ['AI-Driven Optimization', 'Real-time Analytics', 'Quantum Encryption'],
        colors: [
            { name: 'Titanium', hex: '#475569', image: 'https://picsum.photos/seed/hub/800/800' },
            { name: 'Midnight', hex: '#0f172a', image: 'https://picsum.photos/seed/hub-dark/800/800' }
        ]
    },
    {
        id: 'deal-2', name: 'Neural Sensor Pack', productCode: 'NX-200',
        family: 'Sensors', originalPrice: 499, salePrice: 299, discount: 40,
        badge: 'Best Deal',
        image: 'https://picsum.photos/seed/sensor/800/800',
        description: 'High-precision environmental sensors with edge-computing capabilities for instant data processing.',
        features: ['Ultra-low Latency', 'Self-Calibrating', 'IP68 Rated'],
        colors: []
    },
    {
        id: 'deal-3', name: 'Eco-Pulse Monitor', productCode: 'NX-500',
        family: 'Sustainability', originalPrice: 299, salePrice: 179, discount: 40,
        badge: 'Limité',
        image: 'https://picsum.photos/seed/pulse/800/800',
        description: 'Track your carbon footprint and energy efficiency in real-time with the Eco-Pulse ecosystem.',
        features: ['CO2 Tracking', 'Energy Insights', 'Auto-Reporting'],
        colors: []
    },
    {
        id: 'deal-4', name: 'Quantum Link Bridge', productCode: 'NX-300',
        family: 'Connectivity', originalPrice: 899, salePrice: 599, discount: 33,
        badge: 'Bundle',
        image: 'https://picsum.photos/seed/bridge/800/800',
        description: 'Quantum-secure gateway to seamlessly bridge your legacy systems with the Nexus ecosystem.',
        features: ['Legacy Support', 'Zero-Trust Security', 'Auto-Scaling'],
        colors: []
    }
];

const DEALS_VIEW = DEALS.map(d => ({
    ...d,
    originalPriceFormatted: d.originalPrice.toLocaleString('fr-FR'),
    salePriceFormatted: d.salePrice.toLocaleString('fr-FR'),
    savingFormatted: (d.originalPrice - d.salePrice).toLocaleString('fr-FR')
}));

export default class NexusDealsSection extends LightningElement {

    get deals() {
        return DEALS_VIEW;
    }

    handleAddToCart(event) {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        const product = DEALS.find(d => d.id === id);
        if (product) {
            this.dispatchEvent(new CustomEvent('addtocart', {
                bubbles: true,
                composed: true,
                detail: { product }
            }));
        }
    }

    handleViewDetails(event) {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        const product = DEALS.find(d => d.id === id);
        if (product) {
            this.dispatchEvent(new CustomEvent('viewdetails', {
                bubbles: true,
                composed: true,
                detail: { product }
            }));
        }
    }
}
