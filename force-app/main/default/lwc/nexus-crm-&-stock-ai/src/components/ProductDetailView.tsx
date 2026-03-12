import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Star, Zap, Heart, ShoppingCart, 
  FileText, ShieldCheck, Package, Globe, Cpu,
  Check, Share2, Info, ArrowRight, MessageSquare, User
} from 'lucide-react';
import { NexusBadge } from './ui/NexusBadge';
import { NexusButton } from './ui/NexusButton';
import { B2BQuoteForm } from './B2BQuoteForm';
import { cn } from '../lib/utils';
import { Product } from '../types';

interface ProductDetailViewProps {
  product: Product;
  onClose: () => void;
  onToggleFavorite?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  favorites?: Product[];
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ 
  product, 
  onClose,
  onToggleFavorite,
  onAddToCart,
  favorites = []
}) => {
  const [activeColor, setActiveColor] = useState<{ name: string; hex: string; image: string } | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews' | 'compare' | 'warranty'>('overview');
  const [showStickyNav, setShowStickyNav] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isFavorited = favorites.some(f => f.id === product.id);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'specs', label: 'Specifications' },
    { id: 'reviews', label: `Reviews (39)` },
    { id: 'compare', label: 'Compare Products' },
    { id: 'warranty', label: 'Warranty & Returns' }
  ] as const;

  const currentImage = activeColor?.image || product.image;

  useEffect(() => {
    if (product.colors?.[0]) {
      setActiveColor(product.colors[0]);
    }
    // Scroll to top when product opens
    containerRef.current?.scrollTo(0, 0);

    // Intersection Observer to toggle sticky nav visibility
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setShowStickyNav(scrollTop > 50);
      }
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);

    // Intersection Observer to update active tab based on scroll
    const tabObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tabId = entry.target.id.replace('section-', '') as typeof activeTab;
            setActiveTab(tabId);
          }
        });
      },
      { threshold: 0.5, root: container }
    );

    tabs.forEach((tab) => {
      const element = document.getElementById(`section-${tab.id}`);
      if (element) tabObserver.observe(element);
    });

    return () => {
      container?.removeEventListener('scroll', handleScroll);
      tabObserver.disconnect();
    };
  }, [product]);

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white overflow-y-auto nexus-scrollbar"
    >
      {/* Top Navigation / Breadcrumbs */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <button onClick={onClose} className="hover:text-indigo-600 transition-colors">Home</button>
            <ChevronRight className="w-3 h-3" />
            <span>{product.category}</span>
            <ChevronRight className="w-3 h-3" />
            <span>{product.subcategory}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 font-black truncate max-w-[200px]">{product.productCode}</span>
          </div>
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Catalog
          </button>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: Image Gallery */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm group">
              <img 
                src={currentImage} 
                alt={product.name}
                className="w-full h-full object-contain p-8 transition-transform duration-700 group-hover:scale-105"
              />
              <button 
                onClick={() => onToggleFavorite?.(product)}
                className={cn(
                  "absolute top-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg",
                  isFavorited ? "bg-rose-500 text-white" : "bg-white text-slate-400 hover:text-rose-500"
                )}
              >
                <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
              </button>
            </div>

            {/* Thumbnails / Colors */}
            {product.colors && (
              <div className="flex gap-3">
                {product.colors.map(color => (
                  <button
                    key={color.hex}
                    onClick={() => setActiveColor(color)}
                    className={cn(
                      "w-16 h-16 rounded-xl border-2 transition-all p-1",
                      activeColor?.hex === color.hex ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-white hover:border-slate-300"
                    )}
                  >
                    <img src={color.image} alt={color.name} className="w-full h-full object-cover rounded-lg" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Purchase Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <NexusBadge className="bg-indigo-600 text-white border-none px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest">
                  {product.brand}
                </NexusBadge>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item#: {product.productCode}</span>
              </div>
            <h1 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight mb-4">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={cn("w-2.5 h-2.5", i <= 4 ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-indigo-600 tracking-wide">(39 Reviews)</span>
                <div className="h-3 w-[1px] bg-slate-200" />
                <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Write a Review</button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-slate-900 italic tracking-tighter">${product.price}</span>
                <span className="text-xs font-bold text-slate-400">.99</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">USD</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  <Check className="w-4 h-4 text-emerald-500" />
                  In Stock & Ready to Ship
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  Free Global Shipping
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <NexusButton 
                  onClick={() => onAddToCart?.(product)}
                  className="w-full h-12 bg-slate-900 text-white hover:bg-indigo-600 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </NexusButton>
                
                <NexusButton 
                  onClick={() => setShowQuoteForm(true)}
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Request B2B Quote
                </NexusButton>
              </div>
            </div>

            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
              <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-4">Enterprise Benefits</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Warranty</span>
                  <span className="text-[10px] font-bold text-indigo-900">{product.warranty || '3 Years'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Support</span>
                  <span className="text-[10px] font-bold text-indigo-900">24/7 Priority</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Tabs Navigation */}
      {showStickyNav && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-y border-slate-200"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    const element = document.getElementById(`section-${tab.id}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={cn(
                    "py-4 text-[11px] font-black uppercase tracking-widest transition-all relative",
                    activeTab === tab.id ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}


      {/* Sections Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-24">
        
        {/* Overview Section */}
        <section id="section-overview" className="scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-8">
              <div className="prose prose-slate max-w-none">
                <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Product Overview</h2>
                <p className="text-slate-600 leading-relaxed text-sm font-medium">
                  {product.description}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(product.features || ['AI-Driven Performance', 'Quantum Encryption', 'Real-time Telemetry']).map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-0.5">{feature}</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">Advanced engineering ensures peak performance in critical environments.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                <h3 className="text-lg font-black uppercase italic tracking-tighter mb-6">Key Highlights</h3>
                <ul className="space-y-4">
                  {['Next-Gen Architecture', 'Optimized for Scale', 'Industry-Leading Security', 'Global Compatibility'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Specifications Section */}
        <section id="section-specs" className="scroll-mt-24">
          <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-6">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
            {Object.entries(product.specs || {}).map(([key, value]) => (
              <div key={key} className="bg-white p-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{key}</span>
                <span className="text-xs font-black text-slate-900">{value}</span>
              </div>
            ))}
            <div className="bg-white p-4">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Warranty</span>
              <span className="text-xs font-black text-slate-900">{product.warranty || '3 Years Limited'}</span>
            </div>
            <div className="bg-white p-4">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Origin</span>
              <span className="text-xs font-black text-slate-900">Global Manufacturing</span>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="section-reviews" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Customer Reviews</h2>
            <NexusButton className="bg-slate-900 text-white font-black uppercase tracking-widest text-[9px] px-6 h-10 rounded-lg">
              Write a Review
            </NexusButton>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 text-center">
                <div className="text-4xl font-black italic tracking-tighter text-slate-900 mb-1">4.9</div>
                <div className="flex justify-center gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Based on 39 Verified Purchases</p>
              </div>
            </div>
            <div className="lg:col-span-8 space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Verified Professional</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">March 2026</div>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(j => (
                        <Star key={j} className="w-2 h-2 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1.5">Exceptional Performance</h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    The integration was seamless and the performance gains were immediate. Highly recommend for any enterprise-grade deployment.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compare / Similar Products Section */}
        <section id="section-compare" className="scroll-mt-24">
          <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-6">Similar Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="group bg-white rounded-2xl p-4 border border-slate-100 hover:border-indigo-600 transition-all">
                <div className="aspect-square rounded-xl bg-slate-50 mb-3 overflow-hidden">
                  <img src={`https://picsum.photos/seed/tech${i}/400/400`} alt="Similar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-tight mb-0.5">Nexus Variant {i}</h4>
                <div className="text-[9px] font-black text-indigo-600 italic mb-2">$1,299.99</div>
                <NexusButton size="sm" className="w-full bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest h-8 rounded-lg">
                  View Details
                </NexusButton>
              </div>
            ))}
          </div>
        </section>

        {/* Warranty Section */}
        <section id="section-warranty" className="scroll-mt-24">
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
            <div className="max-w-3xl">
              <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Warranty & Returns</h2>
              <div className="space-y-4 text-slate-600 text-[11px] font-medium leading-relaxed">
                <p>
                  Every Nexus product is backed by our comprehensive 3-year limited warranty. We stand behind the quality and reliability of our hardware, ensuring your operations remain uninterrupted.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Return Policy</h4>
                    <p className="text-[10px]">30-day hassle-free returns for all unopened products. Restocking fees may apply for opened items.</p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Support Coverage</h4>
                    <p className="text-[10px]">24/7 technical support included for the duration of the warranty period.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      <AnimatePresence>
        {showQuoteForm && (
          <B2BQuoteForm 
            product={product} 
            onClose={() => setShowQuoteForm(false)} 
            onSubmit={(data) => {
              console.log('Quote Request Submitted:', data);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
