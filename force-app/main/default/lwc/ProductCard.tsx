import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Heart, Zap, Star } from 'lucide-react';
import { Product } from '../types';
import { NexusBadge } from './ui/NexusBadge';
import { NexusButton } from './ui/NexusButton';
import { NexusCard } from './ui/NexusCard';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <NexusCard padding="none" className="group">
      <div className="relative h-72 overflow-hidden bg-slate-50">
        <img 
          src={product.image} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
          alt={product.name}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute top-6 right-6 flex flex-col gap-3 translate-x-12 group-hover:translate-x-0 transition-transform duration-500 delay-75">
          <button className="p-3 bg-white/90 backdrop-blur-xl rounded-2xl text-slate-400 hover:text-rose-500 shadow-xl transition-all">
            <Heart className="w-5 h-5" />
          </button>
          <button className="p-3 bg-white/90 backdrop-blur-xl rounded-2xl text-slate-400 hover:text-indigo-600 shadow-xl transition-all">
            <Zap className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute bottom-6 left-6">
          <NexusBadge variant="primary">{product.family}</NexusBadge>
        </div>
      </div>
      
      <div className="p-10">
        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-xs text-slate-400 font-black ml-2">4.9</span>
        </div>
        
        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">
          {product.productCode}
        </div>

        <h4 className="text-2xl font-black text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
          {product.name}
        </h4>
        
        <p className="text-sm text-slate-500 font-medium mb-8 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between pt-8 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Investissement</span>
            <span className="text-3xl font-black text-slate-900">${product.price}</span>
          </div>
          <NexusButton 
            variant="secondary"
            size="md"
            className="p-5 rounded-[1.5rem]"
            onClick={() => onAddToCart(product)}
          >
            <ShoppingCart className="w-6 h-6" />
          </NexusButton>
        </div>
      </div>
    </NexusCard>
  );
};