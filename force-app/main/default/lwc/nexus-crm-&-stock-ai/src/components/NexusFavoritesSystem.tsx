import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, ShoppingCart, Star, ShieldCheck, 
  ChevronRight, Zap, Info, Search, Trash2,
  Sparkles, ArrowRight, Package
} from 'lucide-react';
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * UTILITIES
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * TYPES
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  family: string;
  price: number;
  image: string;
  productCode?: string;
  category?: string;
}

/**
 * UI COMPONENTS (Internal for reusability)
 */
const NexusCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}> = ({ children, className, title, padding = 'md' }) => (
  <div className={cn(
    "bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500",
    className
  )}>
    {title && (
      <div className="px-8 py-6 border-b border-slate-50">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h3>
      </div>
    )}
    <div className={cn(
      padding === 'none' ? 'p-0' : 
      padding === 'sm' ? 'p-4' : 
      padding === 'md' ? 'p-8' : 'p-12'
    )}>
      {children}
    </div>
  </div>
);

const NexusButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, variant = 'primary', size = 'md', className, disabled }) => {
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200",
    outline: "bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-50"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3 text-xs",
    lg: "px-8 py-4 text-sm"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-xl font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
};

const NexusBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'secondary';
  className?: string;
}> = ({ children, variant = 'primary', className }) => {
  const variants = {
    primary: "bg-indigo-50 text-indigo-600 border-indigo-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    secondary: "bg-slate-50 text-slate-500 border-slate-100"
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

/**
 * PRODUCT CARD COMPONENT
 */
const ProductCard: React.FC<{
  product: Product;
  onAddToCart: (product: Product) => void;
  onToggleFavorite: (product: Product) => void;
  isFavorited: boolean;
}> = ({ product, onAddToCart, onToggleFavorite, isFavorited }) => (
  <NexusCard padding="none" className="group relative h-full flex flex-col overflow-hidden border-slate-200/60 bg-white hover:border-indigo-600/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500">
    <div className="relative h-64 overflow-hidden bg-slate-100">
      <img 
        src={product.image} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
        alt={product.name}
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="absolute top-4 left-4 flex flex-col gap-1.5">
        <NexusBadge className="bg-white/90 backdrop-blur-md text-slate-900 border-none px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">
          {product.family}
        </NexusBadge>
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-16 group-hover:translate-x-0 transition-transform duration-500 ease-out">
        <button 
          onClick={() => onToggleFavorite(product)}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shadow-2xl transition-all hover:scale-110",
            isFavorited ? "bg-rose-500 text-white" : "bg-white text-slate-400 hover:text-rose-500"
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 translate-y-16 group-hover:translate-y-0 transition-transform duration-500">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">MSRP</span>
          <span className="text-xl font-black text-slate-900">${product.price}</span>
        </div>
      </div>
    </div>
    
    <div className="p-6 flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-[10px] text-slate-900 font-black ml-1.5">4.9</span>
        </div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          ID: {product.productCode || 'NEX-001'}
        </span>
      </div>

      <h4 className="text-xl font-black text-slate-900 mb-2 leading-none tracking-tight group-hover:text-indigo-600 transition-colors">
        {product.name}
      </h4>
      
      <p className="text-sm text-slate-500 font-medium mb-6 line-clamp-2 leading-relaxed">
        {product.description}
      </p>

      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <ShieldCheck className="w-2.5 h-2.5 text-indigo-500" />
            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Nexus Verified</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Enterprise Ready</span>
        </div>
        <NexusButton 
          variant="primary"
          className="h-12 px-6 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 shadow-2xl shadow-slate-900/10 transition-all group/btn"
          onClick={() => onAddToCart(product)}
        >
          <ShoppingCart className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
        </NexusButton>
      </div>
    </div>
  </NexusCard>
);

/**
 * MOCK DATA
 */
export const MOCK_FAVORITES: Product[] = [
  {
    id: '1',
    name: 'Nexus Core Pro X-1',
    description: 'The ultimate enterprise core system with integrated AI processing and real-time data synchronization.',
    family: 'Hardware',
    price: 2500,
    image: 'https://picsum.photos/seed/core/800/600',
    productCode: 'NEX-CORE-01'
  },
  {
    id: '2',
    name: 'Quantum Edge Sensor',
    description: 'High-precision edge computing sensor for industrial automation and predictive maintenance.',
    family: 'Sensors',
    price: 850,
    image: 'https://picsum.photos/seed/sensor/800/600',
    productCode: 'NEX-SENS-02'
  },
  {
    id: '3',
    name: 'Cloud Sync Module v2',
    description: 'Seamlessly bridge your local hardware with the Nexus Cloud for instant analytics and global monitoring.',
    family: 'Software',
    price: 1200,
    image: 'https://picsum.photos/seed/cloud/800/600',
    productCode: 'NEX-SOFT-03'
  }
];

/**
 * MAIN COMPONENT: NexusFavoritesSystem
 */
export const NexusFavoritesSystem: React.FC<{
  initialFavorites?: Product[];
  onAddToCart?: (product: Product) => void;
  onRemoveFavorite?: (product: Product) => void;
}> = ({ 
  initialFavorites = MOCK_FAVORITES, 
  onAddToCart = (p) => console.log('Added to cart:', p),
  onRemoveFavorite
}) => {
  const [favorites, setFavorites] = useState<Product[]>(initialFavorites);

  const handleToggleFavorite = (product: Product) => {
    if (onRemoveFavorite) {
      onRemoveFavorite(product);
    }
    setFavorites(prev => prev.filter(p => p.id !== product.id));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">My Favorites</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage your saved items and quick-buy options.</p>
        </div>
        <NexusBadge variant="primary" className="px-4 py-1.5 text-xs">
          {favorites.length} Items Saved
        </NexusBadge>
      </div>
      
      <AnimatePresence mode="popLayout">
        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
          >
            <NexusCard className="text-center py-24 bg-white/50 border-dashed border-2 rounded-[3rem] flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-8">
                <Heart className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Your wishlist is empty</h3>
              <p className="text-slate-500 max-w-sm mx-auto font-medium mb-10">
                Start exploring our catalog and save the products that interest you for quick access later.
              </p>
              <NexusButton variant="outline" size="lg" className="h-14 px-10">
                Explore Catalog <ArrowRight className="w-5 h-5 ml-2" />
              </NexusButton>
            </NexusCard>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favorites.map((product, idx) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                transition={{ delay: idx * 0.05 }}
              >
                <ProductCard 
                  product={product} 
                  onAddToCart={onAddToCart} 
                  onToggleFavorite={handleToggleFavorite}
                  isFavorited={true}
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* AI Recommendation Section */}
      {favorites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <NexusCard className="bg-slate-900 border-none p-10 relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Nexus AI Insights</h3>
                </div>
                <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">
                  Based on your favorites...
                </h4>
                <p className="text-slate-400 font-medium leading-relaxed max-w-xl">
                  We've detected a pattern in your saved items. You might be interested in our <span className="text-white font-black">Enterprise Expansion Pack</span> which includes all your favorites at a <span className="text-emerald-400">15% bundle discount</span>.
                </p>
                <div className="flex gap-4 mt-8">
                  <NexusButton className="bg-indigo-600 hover:bg-indigo-500 h-14 px-8">View Bundle Offer</NexusButton>
                  <NexusButton variant="ghost" className="text-white hover:bg-white/10 h-14 px-8">Dismiss</NexusButton>
                </div>
              </div>
              <div className="w-full lg:w-72 h-72 bg-white/5 rounded-[3rem] backdrop-blur-3xl border border-white/10 flex items-center justify-center relative group">
                <Package className="w-24 h-24 text-white/20 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute -top-4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-xs shadow-xl animate-bounce">
                  -15% OFF
                </div>
              </div>
            </div>
            {/* Decorative Orbs */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px]" />
          </NexusCard>
        </motion.div>
      )}
    </div>
  );
};

export default NexusFavoritesSystem;
