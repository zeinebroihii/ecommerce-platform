import React from 'react';
import { motion } from 'motion/react';
import { Zap, ArrowRight, Sparkles, Tag, ShoppingCart, Plus, ChevronRight } from 'lucide-react';
import { NexusCard } from './ui/NexusCard';
import { NexusButton } from './ui/NexusButton';
import { NexusBadge } from './ui/NexusBadge';
import { cn } from '../lib/utils';
import { useComboBuilder } from '../context/ComboBuilderContext';

const COMBO_DEALS = [
  {
    id: 'combo-1',
    brand: 'AMD',
    title: 'Combo up savings $398.00',
    price: 1264.97,
    originalPrice: 1662.97,
    savings: 398.00,
    products: [
      { id: 'p1', name: 'AMD Ryzen 7 9800X3D - Ryzen 7 9000 Series Zen 5 8-Core 5.2 GHz', image: 'https://picsum.photos/seed/cpu/100/100', price: 479.99 },
      { id: 'p2', name: 'ASUS TUF GAMING X870-PLUS WIFI AM5 AMD X870 SATA 6Gb/s USB4', image: 'https://picsum.photos/seed/mobo/100/100', price: 309.99 },
      { id: 'p3', name: 'CORSAIR Vengeance RGB 32GB (2 x 16GB) 288-Pin PC RAM DDR5 6000', image: 'https://picsum.photos/seed/ram/100/100', price: 114.99 }
    ]
  },
  {
    id: 'combo-2',
    brand: 'Desktop/Laptop',
    title: 'Combo up savings $38.31',
    price: 3212.65,
    originalPrice: 3250.96,
    savings: 38.31,
    products: [
      { id: 'p4', name: 'Stoneforged Crescent Gaming Desktop - Intel Core i9-14900KF', image: 'https://picsum.photos/seed/desktop/100/100', price: 2499.99 },
      { id: 'p5', name: 'Corsair K100 RGB Optical-Mechanical Gaming Keyboard', image: 'https://picsum.photos/seed/keyboard/100/100', price: 229.99 },
      { id: 'p6', name: 'LG UltraGear 27" QHD 2K 1440P IPS Gaming Monitor', image: 'https://picsum.photos/seed/monitor/100/100', price: 349.99 },
      { id: 'p7', name: 'KingSpec XG 7000 1TB M.2 NVMe PCIe Gen4 x4 SSD', image: 'https://picsum.photos/seed/ssd/100/100', price: 132.68 }
    ]
  }
];

interface NexusComboDealsProps {
  onAddToCart?: (product: any) => void;
}

export const NexusComboDeals: React.FC<NexusComboDealsProps> = ({ onAddToCart }) => {
  const { initializeWithCombo, isPanelOpen, setIsPanelOpen, slots, removeProduct, setActiveSlotId, totalCost, totalSavings, wattageEstimate } = useComboBuilder();

  const handleBuildWithIt = (combo: any) => {
    initializeWithCombo(combo);
  };

  const handleAddToCart = (combo: any) => {
    if (onAddToCart) {
      combo.products.forEach((product: any) => {
        onAddToCart(product);
      });
    }
  };

  return (
    <div className="space-y-8 p-6 bg-[#F0F2F5] min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-600/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Nexus Combo Builder</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Build your dream setup with exclusive bundle savings</p>
          </div>
        </div>
        <NexusButton variant="outline" className="border-slate-300 text-slate-600 font-black uppercase tracking-widest h-12 px-6 hover:bg-slate-100">
          Explore All Combos
        </NexusButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {COMBO_DEALS.map((deal) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-[1.5rem] p-4 text-white shadow-2xl relative overflow-hidden group border border-white/5 flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-10">
              <div>
                <h4 className="text-4xl font-black italic tracking-tighter leading-none mb-3 text-emerald-400">{deal.brand}</h4>
                <p className="text-2xl font-black text-white leading-none uppercase tracking-tight">{deal.title}</p>
                <p className="text-sm font-bold text-emerald-400 mt-2 uppercase tracking-widest">
                  Save ${deal.savings.toFixed(2)} on this bundle
                </p>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 transition-colors">
                More options <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Products Grid */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-8 border border-white/10 flex-grow">
              <div className="grid grid-cols-2 gap-5 relative h-full">
                {deal.products.map((product, idx) => (
                  <React.Fragment key={product.id}>
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 flex flex-col gap-4 group/item hover:bg-white/10 transition-all cursor-pointer border border-white/5">
                      <div className="w-full aspect-square bg-white rounded-xl p-3 flex-shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-white leading-tight line-clamp-3">{product.name}</p>
                        <p className="text-sm font-black text-emerald-400 mt-2 uppercase tracking-widest">${product.price}</p>
                      </div>
                    </div>
                    {idx === 0 && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg border border-white/20">
                          <Plus className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Price and Actions */}
            <div className="flex flex-col items-center gap-5">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black">=</span>
                <span className="text-5xl font-black tracking-tighter">${deal.price.toLocaleString()}</span>
                <span className="text-xl font-bold text-white/60 line-through">${deal.originalPrice.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <NexusButton
                  onClick={() => handleBuildWithIt(deal)}
                  className="bg-white text-slate-900 hover:bg-emerald-400 hover:text-white font-black uppercase tracking-widest h-16 rounded-2xl border-none shadow-xl shadow-white/5 text-sm"
                >
                  Build with it
                </NexusButton>
                <NexusButton
                  onClick={() => handleAddToCart(deal)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest h-16 rounded-2xl border-none flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 text-sm"
                >
                  Add to cart <ChevronRight className="w-5 h-5" />
                </NexusButton>
              </div>
            </div>

            {/* Decorative background element */}
            <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

