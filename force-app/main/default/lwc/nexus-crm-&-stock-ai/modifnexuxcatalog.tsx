import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, ShoppingCart, ArrowRight, 
  Sparkles, ShieldCheck, Zap, Info, ChevronRight,
  Package, Star, Heart, Layers, Cpu, Globe,
  ChevronDown, LayoutGrid, List, SlidersHorizontal,
  Tag, Box, Database, Network, Eye, X, Plus, Check, RotateCcw,
  Bell, UserCircle
} from 'lucide-react';
import { NexusCard } from './ui/NexusCard';
import { NexusButton } from './ui/NexusButton';
import { NexusBadge } from './ui/NexusBadge';
import { ProductDetailView } from './ProductDetailView';
import { B2BQuoteForm } from './B2BQuoteForm';
import { cn } from '../lib/utils';
import { Product } from '../types';
import { useComboBuilder } from '../context/ComboBuilderContext';

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
  },
  {
    id: 'pc-components',
    name: 'PC Components',
    icon: Box,
    subcategories: [
      { id: 'cpu', name: 'Processors (CPU)' },
      { id: 'motherboard', name: 'Motherboards' },
      { id: 'memory', name: 'Memory (RAM)' },
      { id: 'gpu', name: 'Graphics Cards' },
      { id: 'storage', name: 'Storage (SSD/HDD)' },
      { id: 'case', name: 'Cases & Chassis' }
    ]
  }
];

export const MOCK_PRODUCTS: CatalogProduct[] = [
  {
    id: 'ups-1',
    name: 'CyberPower CP1500PFCLCD PFC Sinewave UPS Systems',
    productCode: 'CP1500PFCLCD',
    family: 'Power Protection',
    category: 'computing',
    subcategory: 'workstations',
    brand: 'CyberPower',
    warranty: '3 Ans',
    price: 299,
    rating: 4.8,
    reviews: 748,
    image: 'https://m.media-amazon.com/images/I/71X8X8X8X8L._AC_SL1500_.jpg',
    description: 'A rock-solid performer and can keep a gaming rig up even under full load.',
    features: ['1500VA / 1000W', 'Pure Sinewave', 'LCD Display'],
    isNew: false,
    isActive: true,
    stockLevel: 12,
    recommendedStock: 15,
    status: 'En stock',
    unitOfMeasure: 'Unit',
    specs: {
      'Capacity': '1500VA',
      'Output': '1000W',
      'Waveform': 'Pure Sine'
    }
  },
  {
    id: 'gpu-1',
    name: 'NVIDIA RTX PRO 6000 Blackwell Workstation Edition Graphic Card',
    productCode: 'RTX-6000-BW',
    family: 'Graphics',
    category: 'computing',
    subcategory: 'workstations',
    brand: 'NVIDIA',
    warranty: '3 Ans',
    price: 13559,
    rating: 5.0,
    reviews: 9,
    image: 'https://m.media-amazon.com/images/I/61X8X8X8X8L._AC_SL1500_.jpg',
    description: 'Good packaging from Newegg, just a smallish box with no branding on the outside. Obviously it performs quite well.',
    features: ['Blackwell Architecture', '48GB GDDR7', 'ECC Memory'],
    isNew: true,
    isActive: true,
    stockLevel: 5,
    recommendedStock: 10,
    status: 'En stock',
    unitOfMeasure: 'Unit',
    specs: {
      'VRAM': '48GB GDDR7',
      'Cores': '18176 CUDA',
      'TDP': '300W'
    }
  },
  {
    id: 'nas-1',
    name: 'Synology 2-bay DiskStation DS725+ (Diskless)',
    productCode: 'DS725+',
    family: 'Storage',
    category: 'computing',
    subcategory: 'edge-nodes',
    brand: 'Synology',
    warranty: '3 Ans',
    price: 759,
    rating: 4.9,
    reviews: 3,
    image: 'https://m.media-amazon.com/images/I/51X8X8X8X8L._AC_SL1500_.jpg',
    description: 'As of DSM 7.3 you can now use any name brand drive again. I tested with my old 4 TB Seagate Red drives and no issues.',
    features: ['Dual Core CPU', 'NVMe Support', '2.5GbE Port'],
    isActive: true,
    stockLevel: 8,
    recommendedStock: 10,
    status: 'En stock',
    unitOfMeasure: 'Unit',
    specs: {
      'Bays': '2-Bay',
      'CPU': 'AMD Ryzen',
      'RAM': '2GB DDR4'
    }
  },
  {
    id: 'gpu-2',
    name: 'PNY NVIDIA RTX PRO 6000 Blackwell Max-Q 96GB GDDR7 with ECC AI',
    productCode: 'RTX-6000-96G',
    family: 'Graphics',
    category: 'computing',
    subcategory: 'workstations',
    brand: 'PNY',
    price: 13424,
    rating: 5.0,
    reviews: 1,
    image: 'https://m.media-amazon.com/images/I/61X8X8X8X8L._AC_SL1500_.jpg',
    description: '96Gb of vram and energy efficient. Perfect for large scale AI training and simulations.',
    features: ['96GB VRAM', 'ECC Support', 'AI Optimized'],
    isNew: true,
    isActive: true,
    stockLevel: 2,
    recommendedStock: 5,
    status: 'En arrivage',
    unitOfMeasure: 'Unit',
    specs: {
      'VRAM': '96GB',
      'Type': 'Max-Q',
      'ECC': 'Yes'
    }
  },
  {
    id: 'nas-2',
    name: 'Synology 8-bay DiskStation DS1825+ (Diskless)',
    productCode: 'DS1825+',
    family: 'Storage',
    category: 'computing',
    subcategory: 'edge-nodes',
    brand: 'Synology',
    price: 1299,
    rating: 4.8,
    reviews: 4,
    image: 'https://m.media-amazon.com/images/I/61X8X8X8X8L._AC_SL1500_.jpg',
    description: 'High-capacity storage solution for business environments. Scalable and reliable.',
    features: ['8-Bay', 'Expandable', 'DSM OS'],
    isActive: true,
    stockLevel: 3,
    recommendedStock: 5,
    status: 'En stock',
    unitOfMeasure: 'Unit',
    specs: {
      'Bays': '8-Bay',
      'Network': '10GbE Ready',
      'RAM': '8GB'
    }
  },
  {
    id: 'switch-1',
    name: 'TP-Link TL-SG108-M2 | 8 Port Multi-Gigabit Unmanaged Network...',
    productCode: 'TL-SG108-M2',
    family: 'Networking',
    category: 'connectivity',
    subcategory: 'hubs',
    brand: 'TP-Link',
    price: 199,
    rating: 4.7,
    reviews: 5,
    image: 'https://m.media-amazon.com/images/I/51X8X8X8X8L._AC_SL1500_.jpg',
    description: '8-Port 2.5G Desktop Switch. Plug and play, no configuration required.',
    features: ['2.5G Ports', 'Fanless', 'Metal Casing'],
    isActive: true,
    stockLevel: 45,
    recommendedStock: 50,
    status: 'En stock',
    unitOfMeasure: 'Unit',
    specs: {
      'Ports': '8 x 2.5G',
      'Type': 'Unmanaged',
      'Switching': '40Gbps'
    }
  },
  {
    id: 'cpu-1',
    name: 'AMD Ryzen 7 9800X3D - 8-Core 5.2 GHz',
    productCode: 'R7-9800X3D',
    family: 'Processors',
    category: 'pc-components',
    subcategory: 'cpu',
    brand: 'AMD',
    price: 479,
    rating: 4.9,
    reviews: 128,
    image: 'https://picsum.photos/seed/cpu/400/400',
    description: 'The ultimate gaming processor with 3D V-Cache technology.',
    features: ['8 Cores', '16 Threads', '3D V-Cache'],
    isActive: true,
    stockLevel: 15,
    recommendedStock: 50,
    status: 'En stock',
    unitOfMeasure: 'Unit'
  },
  {
    id: 'mobo-1',
    name: 'ASUS TUF GAMING X870-PLUS WIFI',
    productCode: 'TUF-X870',
    family: 'Motherboards',
    category: 'pc-components',
    subcategory: 'motherboard',
    brand: 'ASUS',
    price: 309,
    rating: 4.7,
    reviews: 45,
    image: 'https://picsum.photos/seed/mobo/400/400',
    description: 'Durable and stable motherboard for high-performance gaming.',
    features: ['X870 Chipset', 'WiFi 7', 'DDR5 Support'],
    isActive: true,
    stockLevel: 20,
    recommendedStock: 40,
    status: 'En stock',
    unitOfMeasure: 'Unit'
  },
  {
    id: 'gpu-3',
    name: 'NVIDIA GeForce RTX 4080 Super',
    productCode: 'RTX-4080S',
    family: 'Graphics',
    category: 'pc-components',
    subcategory: 'gpu',
    brand: 'NVIDIA',
    price: 999,
    rating: 4.8,
    reviews: 89,
    image: 'https://picsum.photos/seed/gpu/400/400',
    description: 'High-end graphics card for 4K gaming and creative work.',
    features: ['DLSS 3.5', 'Ray Tracing', '16GB GDDR6X'],
    isActive: true,
    stockLevel: 10,
    recommendedStock: 25,
    status: 'En stock',
    unitOfMeasure: 'Unit'
  }
];

interface NexusCatalogProps {
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  favorites?: Product[];
  isAuthenticated?: boolean;
  userType?: 'B2B' | 'B2C' | null;
  cartCount?: number;
  onViewChange?: (view: any) => void;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onRequestQuote?: () => void;
  initialCategory?: string | null;
  initialSubcategory?: string | null;
}

export const NexusCatalog: React.FC<NexusCatalogProps> = ({ 
  onAddToCart, 
  onToggleFavorite,
  favorites = [],
  isAuthenticated,
  userType,
  cartCount,
  onViewChange,
  onLogout,
  onLoginClick,
  onRequestQuote,
  initialCategory = null,
  initialSubcategory = null
}) => {
  const { activeSlotId, addOrUpdateProduct, setIsPanelOpen, setIsMinimized } = useComboBuilder();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(initialSubcategory);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quoteProduct, setQuoteProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating'>('rating');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);

  React.useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialSubcategory) setSelectedSubcategory(initialSubcategory);
  }, [initialCategory, initialSubcategory]);

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
    <div id="products-section" className="flex flex-col gap-0 pb-24 w-full min-h-screen bg-white">
      <div className="p-0 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-start">
          {/* Sidebar Navigation */}
          <aside className={cn(
            "lg:col-span-3 xl:col-span-2 space-y-0 sticky top-24 transition-all duration-300 z-40 border-r border-slate-100 min-h-[calc(100vh-6rem)]",
            mobileMenuOpen ? "fixed inset-0 bg-white p-6 lg:relative lg:bg-transparent lg:p-0 overflow-y-auto" : "hidden lg:block"
          )}>
            {mobileMenuOpen && (
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <div className="text-emerald-600 font-black text-xl italic">NEXUS MENU</div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full">
                  <RotateCcw className="w-5 h-5 rotate-45" />
                </button>
              </div>
            )}
            <div className="p-8 bg-white">
              <div className="flex items-center justify-between mb-8 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
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
                    !selectedCategory ? "bg-emerald-50 text-emerald-600" : "text-slate-500 hover:bg-slate-50"
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
                        selectedCategory === category.id ? "bg-emerald-50 text-emerald-600 shadow-sm ring-1 ring-emerald-100" : "text-slate-500 hover:bg-slate-50"
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
                                selectedSubcategory === sub.id ? "text-emerald-600 bg-emerald-50/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full transition-all flex-shrink-0",
                                  selectedSubcategory === sub.id ? "bg-emerald-600 scale-125" : "bg-slate-200 group-hover/sub:bg-slate-300"
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
                    <button onClick={() => setStatusFilter([])} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Clear</button>
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
                            statusFilter.includes(status) ? "bg-emerald-600 border-emerald-600 shadow-md shadow-emerald-600/20" : "border-slate-200 group-hover:border-emerald-300"
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
                    <button onClick={() => setBrandFilter([])} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Clear</button>
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
                            brandFilter.includes(brand!) ? "bg-emerald-600 border-emerald-600 shadow-md shadow-emerald-600/20" : "border-slate-200 group-hover:border-emerald-300"
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
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-900">
                    <span>$0</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>

              <NexusButton 
                variant="ghost" 
                className="w-full mt-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600"
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
            </div>

            <div className="p-8 bg-slate-900 rounded-[2.5rem] mx-4 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <Sparkles className="w-8 h-8 text-emerald-400 mb-4" />
                <h4 className="text-lg font-black uppercase italic tracking-tighter mb-2">Need a Custom Build?</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">Our engineers can design a bespoke solution for your specific requirements.</p>
                <NexusButton className="w-full bg-white text-slate-900 hover:bg-emerald-400 hover:text-white font-black uppercase tracking-widest text-[9px] h-12">
                  Consult an Expert
                </NexusButton>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-600/20 rounded-full blur-2xl group-hover:bg-emerald-600/40 transition-colors" />
            </div>
          </aside>

          {/* Main Results Panel */}
          <div className="space-y-6 lg:col-span-9 xl:col-span-10 p-6 md:p-8 lg:p-12">
            {/* Breadcrumbs & Active Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
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

                {activeSlotId && (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setIsPanelOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    Reveal Combo Builder
                  </motion.button>
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
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">
                    <span>{activeCategory?.name}</span>
                    <button onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}><X className="w-3 h-3" /></button>
                  </div>
                )}
                {selectedSubcategory && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">
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
                "grid gap-4 sm:gap-6",
                viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              )}>
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className={cn(
                        "bg-white group relative flex hover:z-10 hover:shadow-2xl transition-all duration-500 rounded-3xl border border-transparent hover:border-emerald-500/20",
                        viewMode === 'grid' ? "flex-col h-full" : "flex-row items-center p-4 gap-8"
                      )}
                    >
                      {/* Index Badge */}
                      <div className={cn(
                        "absolute z-20",
                        viewMode === 'grid' ? "top-4 left-4" : "top-2 left-2"
                      )}>
                        <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all">
                          {index + 1}
                        </div>
                      </div>

                      {/* Image Container */}
                      <div 
                        className={cn(
                          "relative cursor-pointer overflow-hidden flex-shrink-0",
                          viewMode === 'grid' ? "aspect-square w-full p-4" : "w-48 h-48 p-4"
                        )}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                        />
                        
                        {/* Quick Action Overlay */}
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite?.(product);
                              }}
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                favorites.some(f => f.id === product.id)
                                  ? "bg-rose-500 text-white"
                                  : "bg-white text-slate-900 hover:bg-emerald-600 hover:text-white"
                              )}
                            >
                              <Heart className={cn("w-4 h-4", favorites.some(f => f.id === product.id) && "fill-current")} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart?.(product);
                              }}
                              className="w-10 h-10 rounded-full bg-white text-slate-900 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            {activeSlotId && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addOrUpdateProduct(activeSlotId, product);
                                  setIsPanelOpen(true);
                                }}
                                className="w-10 h-10 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center transition-all shadow-lg"
                                title="Add to Combo"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className={cn(
                        "flex-1 flex flex-col",
                        viewMode === 'grid' ? "p-6 pt-0" : "py-4 pr-8"
                      )}>
                        {/* Rating */}
                        <div className="flex items-center gap-0.5 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={cn(
                                "w-3 h-3",
                                i < Math.floor(product.rating || 0) 
                                  ? "text-amber-400 fill-amber-400" 
                                  : "text-slate-200 fill-slate-200"
                              )} 
                            />
                          ))}
                          <span className="text-[10px] font-bold text-slate-400 ml-1">({product.reviews || 0})</span>
                        </div>

                        {/* Title */}
                        <h3 
                          className={cn(
                            "font-black text-slate-900 leading-tight mb-2 group-hover:text-emerald-600 transition-colors cursor-pointer line-clamp-2",
                            viewMode === 'grid' ? "text-sm" : "text-xl"
                          )}
                          onClick={() => setSelectedProduct(product)}
                        >
                          {product.name}
                        </h3>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {product.isNew && (
                            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                              Save 5%
                            </span>
                          )}
                          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                            Free Shipping
                          </span>
                        </div>

                        <div className={cn(
                          "flex",
                          viewMode === 'grid' ? "flex-col" : "flex-row items-center justify-between"
                        )}>
                          <div>
                            {/* Price */}
                            <div className="flex items-baseline gap-1 mb-1">
                              <span className={cn(
                                "font-black text-slate-900 tracking-tighter",
                                viewMode === 'grid' ? "text-2xl" : "text-4xl"
                              )}>${product.price}</span>
                              <span className="text-[10px] font-bold text-slate-400">.99</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 mb-4">
                              from United States
                            </div>
                          </div>

                          {viewMode === 'list' && (
                            <div className="flex gap-4">
                              {activeSlotId && (
                                <NexusButton 
                                  onClick={() => {
                                    addOrUpdateProduct(activeSlotId, product);
                                    setIsPanelOpen(true);
                                  }}
                                  className="h-12 px-6 bg-emerald-600 text-white hover:bg-emerald-700 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-600/20"
                                >
                                  Select for Combo
                                </NexusButton>
                              )}
                              <NexusButton 
                                variant="outline"
                                onClick={() => setSelectedProduct(product)}
                                className="h-12 px-6 text-[10px] font-black uppercase tracking-widest"
                              >
                                View Details
                              </NexusButton>
                              <NexusButton 
                                onClick={() => onAddToCart?.(product)}
                                className="h-12 px-6 bg-emerald-600 text-white hover:bg-emerald-700 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-600/20"
                              >
                                Add to Cart
                              </NexusButton>
                            </div>
                          )}
                        </div>

                        {/* Description Snippet */}
                        <div className={cn(
                          "mt-auto pt-4 border-t border-slate-50",
                          viewMode === 'list' && "max-w-2xl"
                        )}>
                          <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed line-clamp-2">
                            "{product.description}"
                          </p>
                        </div>
                      </div>

                      {/* Add to Nexus Build — grid-mode full-width bottom bar */}
                      {viewMode === 'grid' && activeSlotId && (
                        <motion.button
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            addOrUpdateProduct(activeSlotId, product);
                            setIsPanelOpen(true);
                            setIsMinimized(false);
                          }}
                          className="w-full flex items-center justify-between px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white transition-all rounded-b-3xl border-t border-emerald-500"
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest">Add to Nexus Build</span>
                          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        </motion.button>
                      )}
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
            isAuthenticated={isAuthenticated}
            userType={userType}
            cartCount={cartCount}
            onViewChange={onViewChange}
            onLogout={onLogout}
            onLoginClick={onLoginClick}
            onRequestQuote={onRequestQuote}
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
