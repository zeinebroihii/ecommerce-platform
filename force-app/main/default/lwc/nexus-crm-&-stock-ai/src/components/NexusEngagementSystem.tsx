import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, History, Sparkles, Check, ShoppingCart, 
  TrendingUp, Package, Info, ArrowUpRight,
  ShieldCheck, Zap, Clock, ExternalLink
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
export interface Activity {
  id: string;
  title: string;
  time: string;
  client: string;
  status: string;
  type: 'success' | 'warning' | 'primary' | 'secondary';
}

export interface Offer {
  id: string;
  name: string;
  category: string;
  reason: string;
  price: string;
  image: string;
  [key: string]: any;
}

/**
 * UI COMPONENTS (Internal for reusability)
 */
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
      "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

const NexusButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
}> = ({ children, onClick, variant = 'primary', className }) => {
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200",
    outline: "bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-50"
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "rounded-xl font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 active:scale-95",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

/**
 * COMPONENT: ActivityHistoryDrawer
 */
export const ActivityHistoryDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
}> = ({ isOpen, onClose, activities }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[1000] flex justify-end bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-white h-full shadow-4xl flex flex-col"
        >
          <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-white relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">History</h3>
                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">All your interactions</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto nexus-scrollbar divide-y divide-slate-50">
            {activities.map((activity) => (
              <div key={activity.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors group cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xs group-hover:bg-white group-hover:shadow-sm transition-all">
                    #{activity.id}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{activity.title}</div>
                    <div className="text-[9px] text-slate-400 mt-1 uppercase font-black tracking-widest">
                      {activity.time} • {activity.client}
                    </div>
                  </div>
                </div>
                <NexusBadge variant={activity.type}>{activity.status}</NexusBadge>
              </div>
            ))}
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100">
            <NexusButton className="w-full h-14 text-xs" onClick={onClose}>
              Close Panel
            </NexusButton>
          </div>
        </motion.div>
        <button className="absolute inset-0 -z-10 cursor-default" onClick={onClose} />
      </div>
    )}
  </AnimatePresence>
);

/**
 * COMPONENT: OfferDetailDrawer
 */
export const OfferDetailDrawer: React.FC<{
  offer: Offer | null;
  onClose: () => void;
  onAddToCart?: (offer: Offer) => void;
}> = ({ offer, onClose, onAddToCart }) => (
  <AnimatePresence>
    {offer && (
      <div className="fixed inset-0 z-[1000] flex justify-end bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-white h-full shadow-4xl flex flex-col overflow-hidden"
        >
          <div className="relative h-72 flex-shrink-0">
            <img src={offer.image} className="w-full h-full object-cover" alt={offer.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/40 transition-all shadow-2xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto nexus-scrollbar p-8 -mt-16 relative z-10">
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-50">
              <div className="flex items-center gap-3 mb-6">
                <NexusBadge variant="primary" className="text-[9px] px-4 py-1.5">{offer.category}</NexusBadge>
                <div className="flex items-center gap-2 text-indigo-600">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">AI Recommendation</span>
                </div>
              </div>

              <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-4 leading-none">
                {offer.name}
              </h3>
              
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                {offer.reason}. This product was selected by our predictive algorithm because it perfectly complements your current assets and usage patterns.
              </p>
              
              <div className="grid grid-cols-1 gap-4 mb-10">
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Special Price</div>
                    <div className="text-3xl font-black text-indigo-600 italic tracking-tighter">{offer.price}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Availability</div>
                    <div className="text-xs font-black text-emerald-600 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Limited Stock
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <NexusButton 
                  className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-200 text-sm"
                  onClick={() => onAddToCart?.(offer)}
                >
                  <ShoppingCart className="w-5 h-5" /> Add to Cart
                </NexusButton>
                <NexusButton 
                  variant="outline" 
                  className="w-full h-16 rounded-2xl border-2 text-sm" 
                  onClick={onClose}
                >
                  Save for Later
                </NexusButton>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-4 text-slate-400">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Nexus Enterprise Warranty Included</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        <button className="absolute inset-0 -z-10 cursor-default" onClick={onClose} />
      </div>
    )}
  </AnimatePresence>
);

/**
 * MOCK DATA
 */
export const MOCK_ACTIVITIES: Activity[] = [
  { id: '001', title: 'Order Nexus Industrial Sensor X1', time: '2 hours ago', client: 'TechFlow Inc', status: 'Delivered', type: 'success' },
  { id: '002', title: 'Quote Update QT-2024', time: '5 hours ago', client: 'Global Logistics', status: 'In transit', type: 'primary' },
  { id: '003', title: 'New support message', time: 'Yesterday', client: 'Nexus Support', status: 'Replied', type: 'primary' },
  { id: '004', title: 'Payment received INV-452', time: 'Yesterday', client: 'Finance Dept', status: 'Completed', type: 'success' },
  { id: '005', title: 'Predictive maintenance alert', time: '2 days ago', client: 'Asset #452', status: 'Urgent', type: 'warning' },
];

export const MOCK_OFFER: Offer = {
  id: 'OFF-99',
  name: 'Nexus Quantum Core X-1',
  category: 'Hardware',
  reason: 'Based on your recent high-load processing requirements',
  price: '$4,500',
  image: 'https://picsum.photos/seed/quantum/800/600'
};

/**
 * MAIN COMPONENT: NexusEngagementSystem
 * Manages both drawers and their states.
 */
export const NexusEngagementSystem: React.FC<{
  onAddToCart?: (offer: Offer) => void;
}> = ({ onAddToCart }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  return (
    <div className="p-10 space-y-10">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Trigger for History */}
        <div className="flex-1">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="w-full p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group text-left"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                <History className="w-7 h-7" />
              </div>
              <ArrowUpRight className="w-6 h-6 text-slate-300 group-hover:text-slate-900 transition-colors" />
            </div>
            <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">View All Activity</h4>
            <p className="text-slate-500 font-medium text-sm mt-2">Access your full interaction history and logs.</p>
          </button>
        </div>

        {/* Trigger for Offer */}
        <div className="flex-1">
          <button 
            onClick={() => setSelectedOffer(MOCK_OFFER)}
            className="w-full p-8 bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-500 group text-left relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-2xl group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7" />
                </div>
                <Zap className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">View Special Offer</h4>
              <p className="text-indigo-100 font-medium text-sm mt-2">Personalized AI recommendation for your account.</p>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          </button>
        </div>
      </div>

      {/* Drawers */}
      <ActivityHistoryDrawer 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        activities={MOCK_ACTIVITIES} 
      />
      
      <OfferDetailDrawer 
        offer={selectedOffer} 
        onClose={() => setSelectedOffer(null)} 
        onAddToCart={onAddToCart}
      />
    </div>
  );
};

export default NexusEngagementSystem;
