import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Heart, Zap, Star, ShieldCheck, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Product } from '../types';
import { NexusBadge } from './ui/NexusBadge';
import { NexusButton } from './ui/NexusButton';
import { NexusCard } from './ui/NexusCard';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorited?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onViewDetails,
  onToggleFavorite,
  isFavorited = false
}) => {
  return (
    <NexusCard padding="none" className="group relative h-full flex flex-col overflow-hidden border-slate-200/60 bg-white hover:border-indigo-600/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500">
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden bg-slate-100">
        <img 
          src={product.image} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
          alt={product.name}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Floating Tech Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          <NexusBadge className="bg-white/90 backdrop-blur-md text-slate-900 border-none px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">
            {product.family}
          </NexusBadge>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/90 backdrop-blur-md rounded-full text-white text-[7px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
            <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
            Active Node
          </div>
        </div>

        {/* Quick Actions */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-16 group-hover:translate-x-0 transition-transform duration-500 ease-out">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(product);
            }}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-2xl transition-all hover:scale-110",
              isFavorited ? "bg-rose-500 text-white" : "bg-white text-slate-400 hover:text-rose-500"
            )}
          >
            <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
          </button>
          <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-2xl transition-all hover:scale-110">
            <Zap className="w-4 h-4" />
          </button>
        </div>

        {/* Detail Arrow Button */}
        <button 
          onClick={() => onViewDetails?.(product)}
          className="absolute bottom-4 right-4 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl translate-y-20 group-hover:translate-y-0 transition-all duration-500 hover:bg-indigo-500 hover:scale-110 z-20"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Price Tag Overlay */}
        <div className="absolute bottom-4 left-4 translate-y-16 group-hover:translate-y-0 transition-transform duration-500">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">MSRP</span>
            <span className="text-xl font-black text-slate-900">${product.price}</span>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-[10px] text-slate-900 font-black ml-1.5">4.9</span>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            ID: {product.productCode}
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
};
