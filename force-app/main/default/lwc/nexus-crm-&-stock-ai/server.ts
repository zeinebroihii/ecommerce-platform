import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Database / API Routes
  const leads: any[] = [];
  const products = [
    {
      id: 'pc-1',
      name: 'Nexus Pro-Station G1',
      productCode: 'PC-G1',
      family: 'Computing',
      price: 2499,
      rating: 5.0,
      reviews: 156,
      image: 'https://picsum.photos/seed/pc-black/800/800',
      description: 'The ultimate workstation for high-performance computing. Available in three distinct finishes.',
      features: ['RTX 5090 Ready', '128GB DDR5', 'Liquid Cooled'],
      isNew: true,
      isActive: true,
      stockLevel: 12,
      recommendedStock: 15,
      status: 'In Stock',
      unitOfMeasure: 'Unit',
      specs: {
        'CPU': 'Nexus Quantum X1',
        'GPU': 'RTX 5090',
        'RAM': '128GB'
      },
      colors: [
        { name: 'Black', hex: '#000000', image: 'https://picsum.photos/seed/pc-black/800/800' },
        { name: 'White', hex: '#ffffff', image: 'https://picsum.photos/seed/pc-white/800/800' },
        { name: 'Gray', hex: '#64748b', image: 'https://picsum.photos/seed/pc-gray/800/800' }
      ]
    },
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
      unitOfMeasure: 'Unité',
      colors: [
        { name: 'Titanium', hex: '#475569', image: 'https://picsum.photos/seed/hub/800/800' },
        { name: 'Midnight', hex: '#0f172a', image: 'https://picsum.photos/seed/hub-dark/800/800' }
      ]
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
    { 
      id: 'p11', 
      name: 'Nexus Security Key K1', 
      productCode: 'NXS-KEY-K1',
      description: 'Clé de sécurité matérielle pour l\'authentification multi-facteurs ultra-sécurisée.',
      family: 'Security',
      price: 49, 
      stockLevel: 500, 
      recommendedStock: 200, 
      status: 'In Stock', 
      image: 'https://picsum.photos/seed/key/800/600',
      isActive: true,
      unitOfMeasure: 'Unité'
    },
    { 
      id: 'p12', 
      name: 'Industrial Tablet T10', 
      productCode: 'NXS-TAB-T10',
      description: 'Tablette durcie pour une utilisation intensive en milieu industriel et logistique.',
      family: 'Hardware',
      price: 1150, 
      stockLevel: 15, 
      recommendedStock: 20, 
      status: 'Low Stock', 
      image: 'https://picsum.photos/seed/tablet/800/600',
      isActive: true,
      unitOfMeasure: 'Unité'
    },
  ];

  app.get("/api/products", (req, res) => {
    res.json(products);
  });

  app.post("/api/leads", (req, res) => {
    const lead = { id: Date.now().toString(), ...req.body, status: 'New', score: Math.floor(Math.random() * 40) + 60 };
    leads.push(lead);
    res.status(201).json(lead);
  });

  app.get("/api/leads", (req, res) => {
    res.json(leads);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
