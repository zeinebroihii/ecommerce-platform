import { LightningElement } from 'lwc';

const COMBO_DEALS = [
    {
        id: 'combo-1',
        brand: 'AMD',
        title: 'Combo up savings $398.00',
        price: 1264.97,
        originalPrice: 1662.97,
        savings: 398.00,
        priceFormatted: '$1,264.97',
        originalPriceFormatted: '$1,662.97',
        products: [
            { id: 'p1', name: 'AMD Ryzen 7 9800X3D - Ryzen 7 9000 Series Zen 5 8-Core 5.2 GHz',  image: 'https://picsum.photos/seed/cpu/100/100',      price: 479.99, priceFormatted: '$479.99' },
            { id: 'p2', name: 'ASUS TUF GAMING X870-PLUS WIFI AM5 AMD X870 SATA 6Gb/s USB4',      image: 'https://picsum.photos/seed/mobo/100/100',     price: 309.99, priceFormatted: '$309.99' },
            { id: 'p3', name: 'CORSAIR Vengeance RGB 32GB (2 x 16GB) 288-Pin PC RAM DDR5 6000',   image: 'https://picsum.photos/seed/ram/100/100',      price: 114.99, priceFormatted: '$114.99' },
        ]
    },
    {
        id: 'combo-2',
        brand: 'Desktop/Laptop',
        title: 'Combo up savings $38.31',
        price: 3212.65,
        originalPrice: 3250.96,
        savings: 38.31,
        priceFormatted: '$3,212.65',
        originalPriceFormatted: '$3,250.96',
        products: [
            { id: 'p4', name: 'Stoneforged Crescent Gaming Desktop - Intel Core i9-14900KF',       image: 'https://picsum.photos/seed/desktop/100/100',  price: 2499.99, priceFormatted: '$2,499.99' },
            { id: 'p5', name: 'Corsair K100 RGB Optical-Mechanical Gaming Keyboard',               image: 'https://picsum.photos/seed/keyboard/100/100', price: 229.99,  priceFormatted: '$229.99'  },
            { id: 'p6', name: 'LG UltraGear 27" QHD 2K 1440P IPS Gaming Monitor',                image: 'https://picsum.photos/seed/monitor/100/100',  price: 349.99,  priceFormatted: '$349.99'  },
            { id: 'p7', name: 'KingSpec XG 7000 1TB M.2 NVMe PCIe Gen4 x4 SSD',                  image: 'https://picsum.photos/seed/ssd/100/100',      price: 132.68,  priceFormatted: '$132.68'  },
        ]
    },
    {
        id: 'combo-3',
        brand: 'Intel',
        title: 'Combo up savings $220.00',
        price: 1089.97,
        originalPrice: 1309.97,
        savings: 220.00,
        priceFormatted: '$1,089.97',
        originalPriceFormatted: '$1,309.97',
        products: [
            { id: 'p8',  name: 'Intel Core i9-14900K 3.2 GHz 24-Core LGA 1700 Processor',         image: 'https://picsum.photos/seed/intel/100/100',    price: 389.99, priceFormatted: '$389.99' },
            { id: 'p9',  name: 'MSI MAG Z790 TOMAHAWK WIFI DDR4 ATX Motherboard LGA 1700',         image: 'https://picsum.photos/seed/msi/100/100',      price: 269.99, priceFormatted: '$269.99' },
            { id: 'p10', name: 'NVIDIA GeForce RTX 4070 SUPER 12GB GDDR6X Graphics Card',          image: 'https://picsum.photos/seed/gpu/100/100',      price: 599.99, priceFormatted: '$599.99' },
        ]
    },
    {
        id: 'combo-4',
        brand: 'Streaming',
        title: 'Combo up savings $115.50',
        price: 634.47,
        originalPrice: 749.97,
        savings: 115.50,
        priceFormatted: '$634.47',
        originalPriceFormatted: '$749.97',
        products: [
            { id: 'p11', name: 'Elgato Stream Deck MK.2 – Studio Controller 15 LCD Keys',          image: 'https://picsum.photos/seed/streamdeck/100/100', price: 149.99, priceFormatted: '$149.99' },
            { id: 'p12', name: 'Blue Yeti USB Microphone - Blackout Edition for Streaming',         image: 'https://picsum.photos/seed/mic/100/100',       price: 129.99, priceFormatted: '$129.99' },
            { id: 'p13', name: 'Logitech C922x Pro Stream Webcam Full 1080p HD Camera',             image: 'https://picsum.photos/seed/webcam/100/100',    price: 99.99,  priceFormatted: '$99.99'  },
            { id: 'p14', name: 'HyperX Cloud Alpha Wireless Gaming Headset 300-Hour Battery',       image: 'https://picsum.photos/seed/headset/100/100',   price: 169.99, priceFormatted: '$169.99' },
        ]
    }
];

export default class NexusComboDeals extends LightningElement {

    get comboDeals() {
        return COMBO_DEALS.map(deal => ({
            ...deal,
            savingsFormatted: deal.savings.toFixed(2),
            productsWithIndex: deal.products.map((p, idx) => ({ ...p, idx, showPlus: idx === 0 }))
        }));
    }

    handleBuildWithIt(event) {
        const comboId = event.currentTarget.dataset.comboId;
        const combo   = COMBO_DEALS.find(c => c.id === comboId);
        if (combo) {
            document.dispatchEvent(new CustomEvent('nexuscombobuilderinit', { detail: { combo } }));
        }
    }

    handleAddToCart(event) {
        const comboId  = event.currentTarget.dataset.comboId;
        const combo    = COMBO_DEALS.find(c => c.id === comboId);
        if (!combo) return;
        combo.products.forEach(product => {
            this.dispatchEvent(new CustomEvent('addtocart', {
                detail: { product },
                bubbles: true,
                composed: true
            }));
        });
    }
}
