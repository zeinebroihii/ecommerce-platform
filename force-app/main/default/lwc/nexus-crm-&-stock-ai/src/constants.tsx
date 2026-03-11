import React from 'react';
import { ComponentExample, Lead, Product } from './types';

export const MOCK_LEADS: Lead[] = [
  { 
    id: '1', 
    firstName: 'Jean', 
    lastName: 'Dupont', 
    email: 'jean.dupont@techflow.com', 
    phone: '+33 6 12 34 56 78', 
    responsibility: 'Directeur Achats', 
    companyName: 'TechFlow Inc', 
    industry: 'Software', 
    employeeCount: '500', 
    annualRevenue: '5000000', 
    country: 'France', 
    city: 'Paris', 
    state: 'Île-de-France', 
    zip: '75001', 
    status: 'New', 
    score: 85 
  },
  { 
    id: '2', 
    firstName: 'Marie', 
    lastName: 'Curie', 
    email: 'm.curie@greenenergy.fr', 
    phone: '+33 7 89 01 23 45', 
    responsibility: 'CEO', 
    companyName: 'GreenEnergy Co', 
    industry: 'Energy', 
    employeeCount: '250', 
    annualRevenue: '12000000', 
    country: 'France', 
    city: 'Lyon', 
    state: 'Auvergne-Rhône-Alpes', 
    zip: '69001', 
    status: 'Qualified', 
    score: 65 
  },
];

export const MOCK_PRODUCTS: Product[] = [
  { 
    id: 'p1', 
    name: 'Nexus Industrial Sensor X1', 
    productCode: 'NXS-SNS-001',
    description: 'Capteur industriel haute précision pour la surveillance en temps réel des flux de production.',
    family: 'Hardware',
    price: 299, 
    stockLevel: 45, 
    recommendedStock: 120, 
    status: 'Low Stock', 
    image: 'https://picsum.photos/seed/sensor/800/600',
    isActive: true,
    unitOfMeasure: 'Unité'
  },
  { 
    id: 'p2', 
    name: 'Cloud Gateway Pro v2', 
    productCode: 'NXS-GWY-002',
    description: 'Passerelle cloud sécurisée avec chiffrement de bout en bout pour l\'agrégation de données IoT.',
    family: 'Networking',
    price: 899, 
    stockLevel: 12, 
    recommendedStock: 50, 
    status: 'Critical', 
    image: 'https://picsum.photos/seed/gateway/800/600',
    isActive: true,
    unitOfMeasure: 'Unité'
  },
  { 
    id: 'p3', 
    name: 'Nexus Smart Hub v4', 
    productCode: 'NXS-HUB-004',
    description: 'Unité centrale intelligente pour la gestion centralisée des périphériques Nexus.',
    family: 'IoT',
    price: 149, 
    stockLevel: 250, 
    recommendedStock: 200, 
    status: 'In Stock', 
    image: 'https://picsum.photos/seed/hub/800/600',
    isActive: true,
    unitOfMeasure: 'Unité'
  },
  { 
    id: 'p4', 
    name: 'AI Edge Processor E1', 
    productCode: 'NXS-AI-E1',
    description: 'Processeur de calcul en périphérie optimisé pour les modèles de vision par ordinateur.',
    family: 'Hardware',
    price: 1250, 
    stockLevel: 85, 
    recommendedStock: 100, 
    status: 'In Stock', 
    image: 'https://picsum.photos/seed/ai/800/600',
    isActive: true,
    unitOfMeasure: 'Unité'
  },
  { 
    id: 'p5', 
    name: 'Nexus Fiber Link 10G', 
    productCode: 'NXS-FBR-10G',
    description: 'Module de connexion fibre optique 10Gbps pour infrastructures réseau haute performance.',
    family: 'Networking',
    price: 450, 
    stockLevel: 30, 
    recommendedStock: 40, 
    status: 'Low Stock', 
    image: 'https://picsum.photos/seed/fiber/800/600',
    isActive: true,
    unitOfMeasure: 'Unité'
  },
  { 
    id: 'p6', 
    name: 'Environmental Monitor S2', 
    productCode: 'NXS-ENV-S2',
    description: 'Station de surveillance environnementale (température, humidité, CO2) avec alertes SMS.',
    family: 'IoT',
    price: 199, 
    stockLevel: 150, 
    recommendedStock: 100, 
    status: 'In Stock', 
    image: 'https://picsum.photos/seed/monitor/800/600',
    isActive: true,
    unitOfMeasure: 'Unité'
  },
  { 
    id: 'p7', 
    name: 'Power Management Unit P1', 
    productCode: 'NXS-PWR-P1',
    description: 'Unité de gestion d\'énergie intelligente avec redondance et surveillance de la consommation.',
    family: 'Hardware',
    price: 599, 
    stockLevel: 25, 
    recommendedStock: 30, 
    status: 'Low Stock', 
    image: 'https://picsum.photos/seed/power/800/600',
    isActive: true,
    unitOfMeasure: 'Unité'
  },
  { 
    id: 'p8', 
    name: 'Thermal Analysis Camera T5', 
    productCode: 'NXS-CAM-T5',
    description: 'Caméra thermique haute résolution pour la détection préventive de surchauffe industrielle.',
    family: 'Hardware',
    price: 1850, 
    stockLevel: 8, 
    recommendedStock: 15, 
    status: 'Critical', 
    image: 'https://picsum.photos/seed/thermal/800/600',
    isActive: true,
    unitOfMeasure: 'Unité'
  },
  { 
    id: 'p9', 
    name: 'Secure Storage Array S1', 
    productCode: 'NXS-STR-S1',
    description: 'Baie de stockage sécurisée avec RAID matériel et chiffrement AES-256 intégré.',
    family: 'Networking',
    price: 3200, 
    stockLevel: 5, 
    recommendedStock: 10, 
    status: 'Critical', 
    image: 'https://picsum.photos/seed/storage/800/600',
    isActive: true,
    unitOfMeasure: 'Unité'
  },
  { 
    id: 'p10', 
    name: 'Wireless Mesh Node M3', 
    productCode: 'NXS-MSH-M3',
    description: 'Nœud de réseau maillé sans fil longue portée pour environnements industriels difficiles.',
    family: 'Networking',
    price: 349, 
    stockLevel: 120, 
    recommendedStock: 100, 
    status: 'In Stock', 
    image: 'https://picsum.photos/seed/mesh/800/600',
    isActive: true,
    unitOfMeasure: 'Unité'
  },
];

export const COMPONENT_EXAMPLES: ComponentExample[] = [
  {
    id: 'button',
    name: 'Button',
    description: 'A versatile button component with multiple variants.',
    reactCode: `import React from 'react';

export const Button = ({ variant = 'primary', children, ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    outline: 'border border-slate-200 hover:bg-slate-50'
  };
  
  return (
    <button className={\`\${baseStyles} \${variants[variant]}\`} {...props}>
      {children}
    </button>
  );
};`,
    lwcHtml: `<template>
    <button class={computedClass} onclick={handleClick}>
        <slot></slot>
    </button>
</template>`,
    lwcJs: `import { LightningElement, api } from 'lwc';

export default class Button extends LightningElement {
    @api variant = 'primary';

    get computedClass() {
        const base = 'px-4 py-2 rounded-lg font-medium transition-all ';
        const variants = {
            primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
            secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
            outline: 'border border-slate-200 hover:bg-slate-50'
        };
        return base + (variants[this.variant] || variants.primary);
    }

    handleClick(event) {
        this.dispatchEvent(new CustomEvent('click', { detail: event }));
    }
}`,
    lwcXml: `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__AppPage</target>
        <target>lightning__RecordPage</target>
        <target>lightning__HomePage</target>
    </targets>
</LightningComponentBundle>`,
    lwcCss: `.bg-indigo-600 { background-color: #4f46e5; }
.hover\\:bg-indigo-700:hover { background-color: #4338ca; }
.bg-slate-100 { background-color: #f1f5f9; }
.hover\\:bg-slate-200:hover { background-color: #e2e8f0; }
.bg-white { background-color: #ffffff; }
.text-white { color: #ffffff; }
.text-slate-900 { color: #0f172a; }
.border { border-width: 1px; border-style: solid; }
.border-slate-200 { border-color: #e2e8f0; }
.hover\\:bg-slate-50:hover { background-color: #f8fafc; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.rounded-lg { border-radius: 0.5rem; }
.font-medium { font-weight: 500; }
.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
button { cursor: pointer; border: none; outline: none; }`,
    render: () => (
      <div className="flex gap-4">
        <button className="px-4 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all">Primary</button>
        <button className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-900 hover:bg-slate-200 transition-all">Secondary</button>
        <button className="px-4 py-2 rounded-lg font-medium border border-slate-200 hover:bg-slate-50 transition-all">Outline</button>
      </div>
    )
  },
  {
    id: 'card',
    name: 'Card',
    description: 'A clean container for grouping related information.',
    reactCode: `export const Card = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <div className="text-slate-600">{children}</div>
  </div>
);`,
    lwcHtml: `<template>
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 class="text-lg font-semibold mb-2">{title}</h3>
        <div class="text-slate-600">
            <slot></slot>
        </div>
    </div>
</template>`,
    lwcJs: `import { LightningElement, api } from 'lwc';

export default class Card extends LightningElement {
    @api title;
}`,
    lwcXml: `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <isExposed>true</isExposed>
</LightningComponentBundle>`,
    lwcCss: `.bg-white { background-color: #ffffff; }
.rounded-2xl { border-radius: 1rem; }
.border { border-width: 1px; border-style: solid; }
.border-slate-100 { border-color: #f1f5f9; }
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.p-6 { padding: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.font-semibold { font-weight: 600; }
.mb-2 { margin-bottom: 0.5rem; }
.text-slate-600 { color: #475569; }
h3 { margin: 0; }`,
    render: () => (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-sm">
        <h3 className="text-lg font-semibold mb-2">Project Alpha</h3>
        <p className="text-slate-600">A high-performance dashboard for monitoring real-time metrics and user engagement across all platforms.</p>
      </div>
    )
  },
  {
    id: 'badge',
    name: 'Badge',
    description: 'Status indicators and labels.',
    reactCode: `export const Badge = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-rose-50 text-rose-700 border-rose-100'
  };
  return (
    <span className={\`px-2.5 py-0.5 rounded-full text-xs font-medium border \${colors[color]}\`}>
      {children}
    </span>
  );
};`,
    lwcHtml: `<template>
    <span class={computedClass}>
        <slot></slot>
    </span>
</template>`,
    lwcJs: `import { LightningElement, api } from 'lwc';

export default class Badge extends LightningElement {
    @api color = 'blue';

    get computedClass() {
        const base = 'px-2.5 py-0.5 rounded-full text-xs font-medium border ';
        const colors = {
            blue: 'bg-blue-50 text-blue-700 border-blue-100',
            green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            red: 'bg-rose-50 text-rose-700 border-rose-100'
        };
        return base + (colors[this.color] || colors.blue);
    }
}`,
    lwcXml: `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <isExposed>true</isExposed>
</LightningComponentBundle>`,
    lwcCss: `.px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
.py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
.rounded-full { border-radius: 9999px; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.font-medium { font-weight: 500; }
.border { border-width: 1px; border-style: solid; }

.bg-blue-50 { background-color: #eff6ff; }
.text-blue-700 { color: #1d4ed8; }
.border-blue-100 { border-color: #dbeafe; }

.bg-emerald-50 { background-color: #ecfdf5; }
.text-emerald-700 { color: #047857; }
.border-emerald-100 { border-color: #d1fae5; }

.bg-rose-50 { background-color: #fff1f2; }
.text-rose-700 { color: #be123c; }
.border-rose-100 { border-color: #ffe4e6; }`,
    render: () => (
      <div className="flex gap-2">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-100">Active</span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-100">Completed</span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-rose-50 text-rose-700 border-rose-100">Overdue</span>
      </div>
    )
  }
];
