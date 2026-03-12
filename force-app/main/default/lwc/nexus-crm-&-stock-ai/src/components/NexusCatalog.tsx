import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, ShoppingCart, ArrowRight, 
  Sparkles, ShieldCheck, Zap, Info, ChevronRight,
  Package, Star, Heart, Layers, Cpu, Globe,
  ChevronDown, LayoutGrid, List, SlidersHorizontal,
  Tag, Box, Database, Network, Eye, X, Plus, Check, RotateCcw
} from 'lucide-react';
import { NexusCard } from './ui/NexusCard';
import { NexusButton } from './ui/NexusButton';
import { NexusBadge } from './ui/NexusBadge';
import { ProductDetailView } from './ProductDetailView';
import { B2BQuoteForm } from './B2BQuoteForm';
import { cn } from '../lib/utils';
import { Product } from '../types';

interface CatalogProduct extends Product {
  category: string;
  subcategory: string;
}

const CATEGORIES = [
  {
    id: 'computing',
    name: 'Computing',
    icon: Cpu,
    subcategories: [
      { id: 'workstations', name: 'Workstations' },
      { id: 'edge-nodes', name: 'Edge Nodes' },
      { id: 'quantum', name: 'Quantum Computing' }
    ]
  },
  {
    id: 'connectivity',
    name: 'Connectivity',
    icon: Network,
    subcategories: [
      { id: 'hubs', name: 'Hubs & Gateways' },
      { id: 'bridges', name: 'Bridges' },
      { id: 'wireless', name: 'Wireless Modules' }
    ]
  },
  {
    id: 'sensors',
    name: 'Sensors & Monitoring',
    icon: Eye,
    subcategories: [
      { id: 'environmental', name: 'Environmental' },
      { id: 'visual', name: 'Visual Monitoring' },
      { id: 'neural', name: 'Neural Sensors' }
    ]
  },
  {
    id: 'sustainability',
    name: 'Sustainability',
    icon: Globe,
    subcategories: [
      { id: 'energy', name: 'Energy Monitoring' },
      { id: 'carbon', name: 'Carbon Tracking' }
    ]
  }
];

export const MOCK_PRODUCTS: CatalogProduct[] = [
  {
    id: 'pc-1',
    name: 'Nexus Pro-Station G1',
    productCode: 'PC-G1',
    family: 'Computing',
    category: 'computing',
    subcategory: 'workstations',
    brand: 'Nexus',
    warranty: '3 Ans',
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
    status: 'En stock',
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
    id: 'pc-2',
    name: 'Nexus Edge-Node E1',
    productCode: 'PC-E1',
    family: 'Computing',
    category: 'computing',
    subcategory: 'edge-nodes',
    brand: 'Nexus',
    warranty: '2 Ans',
    price: 899,
    rating: 4.7,
    reviews: 89,
    image: 'https://picsum.photos/seed/node-1/800/800',
    description: 'Compact edge computing node for distributed intelligence.',
    features: ['Fanless Design', '5G Integrated', 'IP67 Rated'],
    isActive: true,
    stockLevel: 25,
    recommendedStock: 30,
    status: 'En stock',
    unitOfMeasure: 'Unit',
    specs: {
      'CPU': 'Nexus ARM v9',
      'RAM': '32GB',
      'Storage': '1TB'
    }
  },
  {
    id: 'pc-3',
    name: 'Quantum Core Q1',
    productCode: 'PC-Q1',
    family: 'Computing',
    category: 'computing',
    subcategory: 'quantum',
    brand: 'Quantum',
    warranty: '5 Ans',
    price: 15000,
    rating: 5.0,
    reviews: 12,
    image: 'https://picsum.photos/seed/quantum/800/800',
    description: 'Next-generation quantum processing unit for complex simulations.',
    features: ['Cryogenic Cooling', '1024 Qubits', 'Error Correction'],
    isNew: true,
    isActive: true,
    stockLevel: 2,
    recommendedStock: 5,
    status: 'En arrivage',
    unitOfMeasure: 'Unit',
    specs: {
      'Qubits': '1024',
      'Cooling': 'Liquid Helium',
      'Interface': 'Nexus Link'
    }
  },
  {
    id: '1',
    name: 'Nexus Core Hub v3',
    productCode: 'NX-100',
    family: 'Central Systems',
    category: 'connectivity',
    subcategory: 'hubs',
    brand: 'Nexus',
    warranty: '3 Ans',
    price: 1299,
    rating: 4.9,
    reviews: 128,
    image: 'https://picsum.photos/seed/hub/800/800',
    description: 'The ultimate central intelligence unit for your industrial ecosystem. Powered by Nexus Neural Engine.',
    features: ['AI-Driven Optimization', 'Real-time Analytics', 'Quantum Encryption'],
    isActive: true,
    stockLevel: 45,
    recommendedStock: 50,
    status: 'En stock',
    unitOfMeasure: 'Unit',
    specs: {
      'Processor': 'Nexus N2 Chip',
      'Connectivity': '5G / Wi-Fi 7',
      'Power': 'Solar-Ready'
    },
    colors: [
      { name: 'Titanium', hex: '#475569', image: 'https://picsum.photos/seed/hub/800/800' },
      { name: 'Midnight', hex: '#0f172a', image: 'https://picsum.photos/seed/hub-dark/800/800' }
    ]
  },
  {
    id: '2',
    name: 'Neural Sensor Pack',
    productCode: 'NX-200',
    family: 'Sensors',
    category: 'sensors',
    subcategory: 'neural',
    brand: 'NeuralLink',
    warranty: '2 Ans',
    price: 499,
    rating: 4.8,
    reviews: 85,
    image: 'https://picsum.photos/seed/sensor/800/800',
    description: 'High-precision environmental sensors with edge-computing capabilities for instant data processing.',
    features: ['Ultra-low Latency', 'Self-Calibrating', 'IP68 Rated'],
    isPopular: true,
    isActive: true,
    stockLevel: 120,
    recommendedStock: 100,
    status: 'En stock',
    unitOfMeasure: 'Pack',
    specs: {
      'Accuracy': '±0.01%',
      'Range': '500m',
      'Battery': '5 Years'
    }
  },
  {
    id: '3',
    name: 'Quantum Link Bridge',
    productCode: 'NX-300',
    family: 'Connectivity',
    category: 'connectivity',
    subcategory: 'bridges',
    brand: 'Quantum',
    warranty: '3 Ans',
    price: 899,
    rating: 5.0,
    reviews: 42,
    image: 'https://picsum.photos/seed/bridge/800/800',
    description: 'Seamlessly bridge your legacy systems with the Nexus ecosystem using our quantum-secure gateway.',
    features: ['Legacy Support', 'Zero-Trust Security', 'Auto-Scaling'],
    isActive: true,
    stockLevel: 15,
    recommendedStock: 20,
    status: 'En arrivage',
    unitOfMeasure: 'Unit',
    specs: {
      'Throughput': '100 Gbps',
      'Security': 'AES-512',
      'Latency': '<1ms'
    }
  },
  {
    id: '4',
    name: 'Nexus Vision Pro',
    productCode: 'NX-400',
    family: 'Monitoring',
    category: 'sensors',
    subcategory: 'visual',
    brand: 'Nexus',
    warranty: '2 Ans',
    price: 1599,
    rating: 4.7,
    reviews: 210,
    image: 'https://picsum.photos/seed/vision/800/800',
    description: 'Advanced visual monitoring system with integrated AI for anomaly detection and predictive maintenance.',
    features: ['8K Resolution', 'Night Vision', 'Object Tracking'],
    isNew: true,
    isActive: true,
    stockLevel: 8,
    recommendedStock: 15,
    status: 'En arrivage',
    unitOfMeasure: 'Unit',
    specs: {
      'Resolution': '8K Ultra HD',
      'FOV': '180°',
      'AI Engine': 'VisionX'
    }
  },
  {
    id: '5',
    name: 'Eco-Pulse Monitor',
    productCode: 'NX-500',
    family: 'Sustainability',
    category: 'sustainability',
    subcategory: 'energy',
    brand: 'EcoSystems',
    warranty: '5 Ans',
    price: 299,
    rating: 4.9,
    reviews: 67,
    image: 'https://picsum.photos/seed/pulse/800/800',
    description: 'Track your carbon footprint and energy efficiency in real-time with the Eco-Pulse ecosystem.',
    features: ['CO2 Tracking', 'Energy Insights', 'Auto-Reporting'],
    isPopular: true,
    isActive: true,
    stockLevel: 200,
    recommendedStock: 150,
    status: 'En stock',
    unitOfMeasure: 'Unit',
    specs: {
      'Precision': 'High',
      'Integration': 'Universal',
      'Eco-Score': 'A+'
    }
  },
  {
    id: '6',
    name: 'Nexus Edge Node',
    productCode: 'NX-600',
    family: 'Computing',
    category: 'computing',
    subcategory: 'edge-nodes',
    brand: 'Nexus',
    warranty: '3 Ans',
    price: 749,
    rating: 4.6,
    reviews: 54,
    image: 'https://picsum.photos/seed/node/800/800',
    description: 'Decentralized computing nodes for distributed intelligence across your entire network.',
    features: ['Edge AI', 'Dynamic Mesh', 'Hot-Swappable'],
    isActive: true,
    stockLevel: 3,
    recommendedStock: 10,
    status: 'Sur commande 48h',
    unitOfMeasure: 'Unit',
    specs: {
      'RAM': '32GB',
      'Storage': '2TB NVMe',
      'OS': 'NexusOS'
    }
  },
  {
    id: '7',
    name: 'Carbon Tracker Pro',
    productCode: 'NX-700',
    family: 'Sustainability',
    category: 'sustainability',
    subcategory: 'carbon',
    brand: 'EcoSystems',
    warranty: '5 Ans',
    price: 1199,
    rating: 4.8,
    reviews: 34,
    image: 'https://picsum.photos/seed/carbon/800/800',
    description: 'Enterprise-grade carbon emission tracking and reporting system.',
    features: ['Scope 1-3 Support', 'Blockchain Verified', 'API Integration'],
    isActive: true,
    stockLevel: 0,
    recommendedStock: 20,
    status: 'Epuisé',
    unitOfMeasure: 'Unit',
    specs: {
      'Reporting': 'GRI Compliant',
      'Verification': 'Nexus Trust',
      'Update Rate': 'Real-time'
    }
  }
];

interface NexusCatalogProps {
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  favorites?: Product[];
}

export const NexusCatalog: React.FC<NexusCatalogProps> = ({ 
  onAddToCart, 
  onToggleFavorite,
  favorites = []
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quoteProduct, setQuoteProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating'>('rating');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || p.subcategory === selectedSubcategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.productCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(p.status);
    const matchesBrand = brandFilter.length === 0 || (p.brand && brandFilter.includes(p.brand));
    
    return matchesCategory && matchesSubcategory && matchesSearch && matchesPrice && matchesStatus && matchesBrand;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  const activeCategory = CATEGORIES.find(c => c.id === selectedCategory);
  const activeSubcategory = activeCategory?.subcategories.find(s => s.id === selectedSubcategory);

  return (
    <div id="products-section" className="flex flex-col gap-8 pb-24">
      {/* Top Header / Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-6 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-12 px-5 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="rating">Top Rated</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3 space-y-6 sticky top-8">
            <NexusCard className="p-6 border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-slate-200/50">
              <div className="flex items-center justify-between mb-8 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Filters</h3>
                </div>
                {(selectedCategory || selectedSubcategory || statusFilter.length > 0 || brandFilter.length > 0 || priceRange[1] < 20000) && (
                  <button 
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                      setStatusFilter([]);
                      setBrandFilter([]);
                      setPriceRange([0, 20000]);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Reset All"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              <nav className="space-y-2">
                <button 
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all",
                    !selectedCategory ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>All Products</span>
                </button>

                {CATEGORIES.map(category => (
                  <div key={category.id} className="space-y-1">
                    <button 
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSelectedSubcategory(null);
                        toggleCategory(category.id);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all",
                        selectedCategory === category.id ? "bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100" : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          selectedCategory === category.id ? "bg-white shadow-sm" : "bg-slate-100"
                        )}>
                          <category.icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-widest break-words">{category.name}</span>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-300",
                        expandedCategories.includes(category.id) ? "rotate-180" : ""
                      )} />
                    </button>

                    <AnimatePresence>
                      {expandedCategories.includes(category.id) && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-6 ml-5 border-l-2 border-slate-100 space-y-2"
                        >
                          {category.subcategories.map(sub => (
                            <button 
                              key={sub.id}
                              onClick={() => {
                                setSelectedCategory(category.id);
                                setSelectedSubcategory(sub.id);
                              }}
                              className={cn(
                                "w-full text-left px-4 py-2 rounded-xl text-[10px] font-medium transition-all relative group/sub whitespace-normal break-words leading-tight uppercase tracking-wide",
                                selectedSubcategory === sub.id ? "text-indigo-600 bg-indigo-50/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full transition-all flex-shrink-0",
                                  selectedSubcategory === sub.id ? "bg-indigo-600 scale-125" : "bg-slate-200 group-hover/sub:bg-slate-300"
                                )} />
                                {sub.name}
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </nav>

              <div className="mt-12 pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibilité</h4>
                  {statusFilter.length > 0 && (
                    <button onClick={() => setStatusFilter([])} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Clear</button>
                  )}
                </div>
                <div className="px-2 space-y-3">
                  {['En stock', 'En arrivage', 'Epuisé', 'Sur commande 48h'].map(status => (
                    <label key={status} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div 
                          onClick={() => toggleStatusFilter(status)}
                          className={cn(
                            "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                            statusFilter.includes(status) ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/20" : "border-slate-200 group-hover:border-indigo-300"
                          )}
                        >
                          {statusFilter.includes(status) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={cn(
                          "text-[11px] font-bold transition-colors",
                          statusFilter.includes(status) ? "text-slate-900" : "text-slate-500"
                        )}>
                          {status}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-400 transition-colors">
                        {MOCK_PRODUCTS.filter(p => p.status === status).length}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marque</h4>
                  {brandFilter.length > 0 && (
                    <button onClick={() => setBrandFilter([])} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Clear</button>
                  )}
                </div>
                <div className="px-2 space-y-3">
                  {Array.from(new Set(MOCK_PRODUCTS.map(p => p.brand).filter(Boolean))).map(brand => (
                    <label key={brand} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div 
                          onClick={() => {
                            setBrandFilter(prev => 
                              prev.includes(brand!) ? prev.filter(b => b !== brand) : [...prev, brand!]
                            );
                          }}
                          className={cn(
                            "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                            brandFilter.includes(brand!) ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/20" : "border-slate-200 group-hover:border-indigo-300"
                          )}
                        >
                          {brandFilter.includes(brand!) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={cn(
                          "text-[11px] font-bold transition-colors",
                          brandFilter.includes(brand!) ? "text-slate-900" : "text-slate-500"
                        )}>
                          {brand}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-400 transition-colors">
                        {MOCK_PRODUCTS.filter(p => p.brand === brand).length}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Price Range</h4>
                <div className="px-2 space-y-4">
                  <input 
                    type="range" 
                    min="0" 
                    max="20000" 
                    step="500"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-900">
                    <span>$0</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>

              <NexusButton 
                variant="ghost" 
                className="w-full mt-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                  setSearchQuery('');
                  setPriceRange([0, 20000]);
                  setStatusFilter([]);
                  setBrandFilter([]);
                }}
              >
                Reset Filters
              </NexusButton>
            </NexusCard>

            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group">
              <div className="relative z-10">
                <Sparkles className="w-8 h-8 text-indigo-400 mb-4" />
                <h4 className="text-lg font-black uppercase italic tracking-tighter mb-2">Need a Custom Build?</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">Our engineers can design a bespoke solution for your specific requirements.</p>
                <NexusButton className="w-full bg-white text-slate-900 hover:bg-indigo-400 hover:text-white font-black uppercase tracking-widest text-[9px] h-12">
                  Consult an Expert
                </NexusButton>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-600/20 rounded-full blur-2xl group-hover:bg-indigo-600/40 transition-colors" />
            </div>
          </aside>

          {/* Main Results Panel */}
          <div className="space-y-6 lg:col-span-9">
            {/* Breadcrumbs & Active Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Catalog</span>
                <ChevronRight className="w-3 h-3" />
                <span className={cn(selectedCategory ? "text-slate-400" : "text-slate-900")}>All Products</span>
                {selectedCategory && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className={cn(selectedSubcategory ? "text-slate-400" : "text-slate-900")}>{activeCategory?.name}</span>
                  </>
                )}
                {selectedSubcategory && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-900">{activeSubcategory?.name}</span>
                  </>
                )}
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing <span className="text-slate-900">{filteredProducts.length}</span> Results
              </div>
            </div>

            {/* Active Filters Bar */}
            {(selectedCategory || selectedSubcategory || searchQuery || priceRange[1] < 20000 || statusFilter.length > 0 || brandFilter.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 mb-8">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Active Filters:</span>
                {selectedCategory && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold border border-indigo-100">
                    <span>{activeCategory?.name}</span>
                    <button onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}><X className="w-3 h-3" /></button>
                  </div>
                )}
                {selectedSubcategory && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold border border-indigo-100">
                    <span>{activeSubcategory?.name}</span>
                    <button onClick={() => setSelectedSubcategory(null)}><X className="w-3 h-3" /></button>
                  </div>
                )}
                {searchQuery && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold border border-slate-200">
                    <span>Search: {searchQuery}</span>
                    <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
                  </div>
                )}
                {statusFilter.map(status => (
                  <div key={status} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">
                    <span>{status}</span>
                    <button onClick={() => toggleStatusFilter(status)}><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {brandFilter.map(brand => (
                  <div key={brand} className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100">
                    <span>{brand}</span>
                    <button onClick={() => setBrandFilter(prev => prev.filter(b => b !== brand))}><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                    setSearchQuery('');
                    setPriceRange([0, 20000]);
                    setStatusFilter([]);
                    setBrandFilter([]);
                  }}
                  className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline ml-2"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Results Grid/List */}
            {filteredProducts.length > 0 ? (
              <div className={cn(
                "grid gap-8",
                viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              )}>
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                        <NexusCard 
                          padding="none"
                          className={cn(
                            "group relative flex overflow-hidden border-slate-200/60 hover:border-indigo-600/30 hover:shadow-3xl transition-all duration-500",
                            viewMode === 'grid' ? "flex-col h-full" : "flex-row min-h-[24rem] h-auto"
                          )}
                        >
                        {/* Image Container - "Encadré" Style */}
                        <div className={cn(
                          "relative bg-slate-50 p-4",
                          viewMode === 'grid' ? "aspect-[4/5] w-full" : "w-1/3 min-w-[320px] h-full"
                        )}>
                          <div className="w-full h-full rounded-[1.5rem] overflow-hidden border border-slate-200/60 shadow-inner bg-white">
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                          </div>
                          <div className="absolute inset-4 rounded-[1.5rem] bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                          
                          {/* Badges */}
                          <div className="absolute top-7 left-7 flex flex-col gap-1.5 z-10">
                            {product.isNew && (
                              <div className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/30 backdrop-blur-md">
                                New Arrival
                              </div>
                            )}
                            {product.isPopular && (
                              <div className="bg-amber-500 text-white px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-500/30 backdrop-blur-md">
                                Best Seller
                              </div>
                            )}
                          </div>

                          {/* Favorite Button */}
                          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite?.(product);
                              }}
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                favorites.some(f => f.id === product.id)
                                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                  : "bg-white/80 backdrop-blur-md text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100"
                              )}
                            >
                              <Heart className={cn("w-5 h-5", favorites.some(f => f.id === product.id) && "fill-current")} />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {product.brand && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                  {product.brand}
                                </span>
                              )}
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                {product.productCode}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                              <span className="text-[9px] font-black text-slate-900">{product.rating}</span>
                            </div>
                          </div>

                          <h3 className="text-sm font-black text-slate-900 tracking-tight mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[2.5rem] leading-tight uppercase italic">
                            {product.name}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">
                            {product.description}
                          </p>

                          {/* Availability & Warranty */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className={cn(
                              "px-2 py-0.5 rounded-full flex items-center gap-1.5 border transition-colors",
                              product.status === 'En stock' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                              product.status === 'En arrivage' ? "bg-amber-50 border-amber-100 text-amber-700" :
                              product.status === 'Epuisé' ? "bg-rose-50 border-rose-100 text-rose-700" : 
                              "bg-indigo-50 border-indigo-100 text-indigo-700"
                            )}>
                              <div className={cn(
                                "w-1 h-1 rounded-full animate-pulse",
                                product.status === 'En stock' ? "bg-emerald-500" :
                                product.status === 'En arrivage' ? "bg-amber-500" :
                                product.status === 'Epuisé' ? "bg-rose-500" : "bg-indigo-500"
                              )} />
                              <span className="text-[8px] font-black uppercase tracking-widest">
                                {product.status}
                              </span>
                            </div>
                            {product.warranty && (
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                <span className="text-[8px] font-black uppercase tracking-widest">{product.warranty}</span>
                              </div>
                            )}
                          </div>

                          {/* Specs Preview */}
                          {product.specs && (
                            <div className={cn(
                              "grid gap-1.5 mb-4",
                              viewMode === 'grid' ? "grid-cols-2" : "grid-cols-3"
                            )}>
                              {Object.entries(product.specs).slice(0, viewMode === 'grid' ? 2 : 3).map(([key, value]) => (
                                <div key={key} className="bg-slate-50/30 p-1.5 rounded-lg border border-slate-100/50 hover:bg-white hover:border-indigo-200 transition-all">
                                  <div className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{key}</div>
                                  <div className="text-[9px] font-black text-slate-900 truncate">{value}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-auto pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex flex-col">
                                <span className="text-[6px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Price</span>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-lg font-black text-slate-900 tracking-tighter">${product.price}</span>
                                  <span className="text-[8px] font-bold text-slate-400">USD</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                <span className="text-[9px] font-black text-slate-900">{product.rating}</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setSelectedProduct(product)}
                                className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-900 hover:bg-slate-50 font-black uppercase tracking-widest text-[8px] transition-all active:scale-95"
                              >
                                Details
                              </button>
                              <button 
                                onClick={() => onAddToCart?.(product)}
                                className="flex-[1.5] h-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-black uppercase tracking-widest text-[8px] shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                              >
                                <Plus className="w-3 h-3" />
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      </NexusCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                  <Search className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">No Products Found</h3>
                <p className="text-slate-500 font-medium max-w-xs mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
                <NexusButton 
                  variant="outline" 
                  className="mt-8"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                    setPriceRange([0, 20000]);
                    setStatusFilter([]);
                  }}
                >
                  Clear All Filters
                </NexusButton>
              </div>
            )}
          </div>
        </div>
      
      {/* Product Detail View (Full Page) */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailView 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            onToggleFavorite={onToggleFavorite}
            onAddToCart={onAddToCart}
            favorites={favorites}
          />
        )}
      </AnimatePresence>

      {/* B2B Quote Form Overlay */}
      <AnimatePresence>
        {quoteProduct && (
          <B2BQuoteForm 
            product={quoteProduct} 
            onClose={() => setQuoteProduct(null)} 
            onSubmit={(data) => {
              console.log('Quote Request Submitted:', data);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
