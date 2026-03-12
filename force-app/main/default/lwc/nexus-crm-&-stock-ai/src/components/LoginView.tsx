import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, User, ArrowRight, ShieldCheck, 
  ShoppingCart, Globe, Zap, Package, Search
} from 'lucide-react';
import { Hero } from './Hero';
import { NexusAbout } from './NexusAbout';
import { NexusJourney } from './NexusJourney';
import { NexusReviews } from './NexusReviews';
import { NexusDealsSection } from './NexusDealsSection';
import { NexusFAQ } from './NexusFAQ';
import { ProductCard } from './ProductCard';
import { ProductDetailView } from './ProductDetailView';
import { NexusButton } from './ui/NexusButton';
import { NexusCard } from './ui/NexusCard';
import { NexusInput } from './ui/NexusInput';
import { cn } from '../lib/utils';

interface LoginViewProps {
  onSelect: (type: 'B2B' | 'B2C', mode: 'login' | 'signup') => void;
  onAddToCart: (product: any) => void;
  onToggleFavorite?: (product: any) => void;
  favorites?: any[];
  isAuthenticated?: boolean;
  userType?: 'B2B' | 'B2C' | null;
  cartCount?: number;
  onViewChange?: (view: any) => void;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onRequestQuote?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ 
  onSelect, 
  onAddToCart,
  onToggleFavorite,
  favorites = [],
  isAuthenticated,
  userType,
  cartCount,
  onViewChange,
  onLogout,
  onLoginClick,
  onRequestQuote
}) => {
  const [products] = useState<any[]>([
    {
      id: '1',
      name: 'Nexus Core X1',
      family: 'Processors',
      description: 'Ultra-high performance neural processor for real-time data analysis.',
      price: 1299,
      image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=800',
      colors: [{ name: 'Emerald', hex: '#10b981' }, { name: 'Slate', hex: '#1e293b' }]
    },
    {
      id: '2',
      name: 'Quantum Link S2',
      family: 'Networking',
      description: 'Zero-latency quantum communication module for global connectivity.',
      price: 849,
      image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800',
      colors: [{ name: 'Indigo', hex: '#4f46e5' }]
    },
    {
      id: '3',
      name: 'Nexus Vision Pro',
      family: 'Sensors',
      description: 'High-precision optical sensor array with integrated AI vision.',
      price: 2100,
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
      colors: [{ name: 'Black', hex: '#000000' }]
    },
    {
      id: '4',
      name: 'Energy Cell Z',
      family: 'Power',
      description: 'High-density solid-state energy storage for industrial applications.',
      price: 450,
      image: 'https://images.unsplash.com/photo-1568910748155-01ca989dbdd6?auto=format&fit=crop&q=80&w=800',
      colors: [{ name: 'Emerald', hex: '#10b981' }]
    }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('All');
  const [selectedColor, setSelectedColor] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFamily = selectedFamily === 'All' || p.family === selectedFamily;
    const matchesColor = selectedColor === 'All' || p.colors?.some((c: any) => c.name === selectedColor);
    return matchesSearch && matchesFamily && matchesColor;
  });

  const families = ['All', ...new Set(products.map(p => p.family))];
  const allColors = ['All', ...new Set(products.flatMap(p => p.colors?.map((c: any) => c.name) || []))];

  return (
    <div className="space-y-0 pb-0">
      <Hero />

      <NexusAbout />
      
      <NexusJourney />
      
      <NexusDealsSection 
        onAddToCart={onAddToCart} 
        onViewDetails={(product) => setSelectedProduct(product)} 
      />

      {/* Tech Product Showcase Section */}
      <section id="products-section" className="py-20 bg-slate-50 flex flex-col justify-center">
        <div className="w-full px-12 md:px-24">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12">
            <div className="max-w-2xl text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center justify-center lg:justify-start gap-3 text-emerald-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4"
              >
                <div className="w-12 h-[2px] bg-emerald-600" />
                Nexus Collection
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none text-slate-900 uppercase italic"
              >
                PREMIUM <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">TECH</span>
              </motion.h2>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {families.map(family => (
                <button
                  key={family}
                  onClick={() => setSelectedFamily(family)}
                  className={cn(
                    "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2",
                    selectedFamily === family 
                      ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10" 
                      : "bg-white border-slate-200 text-slate-500 hover:border-emerald-500 hover:text-emerald-600"
                  )}
                >
                  {family}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, idx) => {
                const isFavorite = favorites.some((f: any) => f.id === product.id);
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="group relative bg-white rounded-[2rem] p-5 border-2 border-slate-100 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 flex flex-col h-full"
                  >
                    <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-6 bg-slate-50">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite?.(product);
                          }}
                          className={cn(
                            "h-9 w-9 rounded-lg backdrop-blur-md flex items-center justify-center transition-all",
                            isFavorite ? "bg-emerald-500 text-white" : "bg-white/80 text-slate-400 hover:text-emerald-500"
                          )}
                        >
                          <Zap className={cn("w-4 h-4", isFavorite && "fill-white")} />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <div className="px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest">
                          {product.family}
                        </div>
                      </div>
                    </div>

                    <div className="flex-grow">
                      <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tighter uppercase italic">{product.name}</h3>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="text-xl font-black text-slate-900 italic">${product.price}</div>
                      <NexusButton 
                        size="sm"
                        onClick={() => onAddToCart(product)}
                        className="h-10 w-10 rounded-lg bg-slate-900 hover:bg-emerald-600 transition-colors p-0"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </NexusButton>
                    </div>

                    <button 
                      onClick={() => setSelectedProduct(product)}
                      className="absolute inset-0 z-0 cursor-pointer"
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Login Selection Section */}
      <section id="login-section" className="py-16 bg-white flex flex-col justify-center">
        <div className="w-full px-12 md:px-24">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-3 text-emerald-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4"
            >
              <div className="w-12 h-[2px] bg-emerald-600" />
              Access Portal
            </motion.div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-[0.85] text-slate-900 mb-4 uppercase italic">
              JOIN <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">THE ECOSYSTEM</span>
            </h2>
            <p className="text-base text-slate-500 font-medium max-w-2xl mx-auto">Choose your profile to access your personalized space.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <NexusCard className="group relative p-10 text-left overflow-hidden rounded-[2.5rem] border-2 border-slate-100 hover:border-indigo-600 transition-all duration-500">
              <div className="relative z-10">
                <div className="w-16 h-16 bg-indigo-50 rounded-[1.25rem] flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-all duration-500 group-hover:scale-110">
                  <Building2 className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter uppercase italic">Enterprise (B2B)</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
                  Access wholesale pricing, manage complex orders, and track your quotes in real-time.
                </p>
                <div className="flex flex-col gap-3">
                  <NexusButton onClick={() => onSelect('B2B', 'login')} className="w-full h-14 rounded-[1rem] text-sm font-black uppercase tracking-widest italic shadow-xl shadow-indigo-200">
                    Login <ArrowRight className="w-5 h-5" />
                  </NexusButton>
                  <NexusButton variant="outline" onClick={() => onSelect('B2B', 'signup')} className="w-full h-14 rounded-[1rem] text-sm font-black uppercase tracking-widest italic border-2">
                    Register Company
                  </NexusButton>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full -mr-24 -mt-24 group-hover:bg-indigo-100 transition-colors duration-500" />
            </NexusCard>

            <NexusCard className="group relative p-10 text-left overflow-hidden rounded-[2.5rem] border-2 border-slate-100 hover:border-emerald-600 transition-all duration-500">
              <div className="relative z-10">
                <div className="w-16 h-16 bg-emerald-50 rounded-[1.25rem] flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-all duration-500 group-hover:scale-110">
                  <User className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter uppercase italic">Individual (B2C)</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
                  Direct purchase, instant order tracking, and immediate activation of your personal account.
                </p>
                <div className="flex flex-col gap-3">
                  <NexusButton onClick={() => onSelect('B2C', 'login')} className="w-full h-14 rounded-[1rem] text-sm font-black uppercase tracking-widest italic bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200">
                    Login <ArrowRight className="w-5 h-5" />
                  </NexusButton>
                  <NexusButton variant="outline" onClick={() => onSelect('B2C', 'signup')} className="w-full h-14 rounded-[1rem] text-sm font-black uppercase tracking-widest italic border-2">
                    Create Account
                  </NexusButton>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full -mr-24 -mt-24 group-hover:bg-emerald-100 transition-colors duration-500" />
            </NexusCard>
          </div>
        </div>
      </section>

      <NexusReviews />

      <NexusFAQ />

      {/* Trust Section */}
      <section className="max-w-7xl mx-auto px-6 py-32 border-t border-slate-100">
        <div className="flex flex-wrap items-center justify-center gap-20 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <div className="flex items-center gap-4 font-black text-4xl italic tracking-tighter"><Globe className="w-10 h-10" /> GLOBAL</div>
          <div className="flex items-center gap-4 font-black text-4xl italic tracking-tighter"><Package className="w-10 h-10" /> LOGISTICS</div>
          <div className="flex items-center gap-4 font-black text-4xl italic tracking-tighter"><Zap className="w-10 h-10" /> ENERGY</div>
          <div className="flex items-center gap-4 font-black text-4xl italic tracking-tighter"><ShieldCheck className="w-10 h-10" /> SECURE</div>
        </div>
      </section>

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
    </div>
  );
};
