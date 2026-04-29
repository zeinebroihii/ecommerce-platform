import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Package, 
  ArrowRight, 
  Search, 
  Filter,
  BrainCircuit,
  RefreshCw,
  ShoppingCart,
  FileText,
  LineChart,
  Sparkles,
  Clock,
  X,
  Check
} from 'lucide-react';

/**
 * STANDALONE UTILS & COMPONENTS
 * These are inlined to make the file completely reusable in any project.
 */

// Simple class merger utility
const cn = (...classes: (string | undefined | boolean | null)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Reusable Nexus Button
const NexusButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}> = ({ variant = 'primary', size = 'md', className, children, ...props }) => {
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20',
    secondary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/10',
    outline: 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm',
    ghost: 'text-slate-500 hover:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-500 shadow-xl shadow-rose-600/20'
  };
  const sizes = {
    sm: 'px-4 py-2 text-[10px] uppercase tracking-widest',
    md: 'px-6 py-3 text-[11px] uppercase tracking-widest',
    lg: 'px-8 py-4 text-xs uppercase tracking-widest'
  };
  return (
    <button 
      className={cn(
        'rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// Reusable Nexus Input
const NexusInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input 
    className={cn(
      'w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium placeholder:text-slate-400',
      className
    )}
    {...props}
  />
);

/**
 * DATA MODELS & MOCK DATA
 */

interface StockItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  velocity: number;
  daysLeft: number;
  quotesAtRisk: number;
  aiInsight: string;
  status: 'critical' | 'at-risk' | 'healthy' | 'overstock';
  image: string;
}

const MOCK_STOCK: StockItem[] = [
  {
    id: '1',
    name: 'NVIDIA RTX PRO 6000 Blackwell',
    category: 'Computing',
    stock: 5,
    velocity: 0.07,
    daysLeft: 75,
    quotesAtRisk: 2,
    aiInsight: 'AT RISK: 5 units remaining (~75 days). Velocity: 0.07 units/day. Reorder threshold triggered by high-value pipeline.',
    status: 'at-risk',
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: '2',
    name: 'Cisco Catalyst 9300 Switch',
    category: 'Connectivity',
    stock: 10,
    velocity: 0.03,
    daysLeft: 300,
    quotesAtRisk: 0,
    aiInsight: 'HEALTHY: 10 units remaining (~300 days). Velocity: 0.03 units/day. Stable supply chain confirmed.',
    status: 'healthy',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: '3',
    name: 'Cisco Meraki MX450 Gateway',
    category: 'Connectivity',
    stock: 59,
    velocity: 0.2,
    daysLeft: 305,
    quotesAtRisk: 0,
    aiInsight: 'OVERSTOCK: 61 units on hand (~305 days of supply). Only 0.20 units/day sold. Consider promotional bundle.',
    status: 'overstock',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: '4',
    name: 'Nexus Core X1 Processor',
    category: 'Processors',
    stock: 2,
    velocity: 0.8,
    daysLeft: 2,
    quotesAtRisk: 15,
    aiInsight: 'CRITICAL: Stock depletion imminent. 15 Quotes at risk. Immediate reorder required from Tier 1 supplier.',
    status: 'critical',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200'
  }
];

/**
 * MAIN COMPONENT: Stock Intelligence
 */

export const StockIntelligence: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'at-risk' | 'healthy' | 'overstock'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForReorder, setSelectedItemForReorder] = useState<StockItem | null>(null);
  const [reorderQuantity, setReorderQuantity] = useState(10);

  const filteredStock = MOCK_STOCK.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    critical: MOCK_STOCK.filter(i => i.status === 'critical').length,
    atRisk: MOCK_STOCK.filter(i => i.status === 'at-risk').length,
    healthy: MOCK_STOCK.filter(i => i.status === 'healthy').length,
    overstock: MOCK_STOCK.filter(i => i.status === 'overstock').length,
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-[0.3em] text-[8px] mb-0.5">
                <BrainCircuit className="w-3 h-3" />
                AI-Driven Operations
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Stock Intelligence</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NexusButton variant="outline" className="h-10 px-4 border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[9px] rounded-xl">
              <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
            </NexusButton>
            <NexusButton className="h-10 px-6 bg-slate-900 text-white font-black uppercase tracking-widest text-[9px] shadow-xl shadow-slate-900/10 rounded-xl">
              <Zap className="w-3.5 h-3.5 mr-2 fill-emerald-500 text-emerald-500" /> AI Forecast
            </NexusButton>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full space-y-6">
        {/* Compact Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Critical" 
            value={stats.critical} 
            subtitle="≤ 3 Days Left" 
            status="critical"
            active={filter === 'critical'}
            onClick={() => setFilter('critical')}
          />
          <StatCard 
            label="At Risk" 
            value={stats.atRisk} 
            subtitle="≤ 14 Days Left" 
            status="at-risk"
            active={filter === 'at-risk'}
            onClick={() => setFilter('at-risk')}
          />
          <StatCard 
            label="Healthy" 
            value={stats.healthy} 
            subtitle="Optimal Supply" 
            status="healthy"
            active={filter === 'healthy'}
            onClick={() => setFilter('healthy')}
          />
          <StatCard 
            label="Overstock" 
            value={stats.overstock} 
            subtitle="Run Promotions" 
            status="overstock"
            active={filter === 'overstock'}
            onClick={() => setFilter('overstock')}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button 
              onClick={() => setFilter('all')}
              className={cn(
                "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                filter === 'all' ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "bg-white text-slate-500 hover:bg-white hover:text-slate-900 border border-slate-100"
              )}
            >
              All Products
            </button>
            <div className="w-[1px] h-4 bg-slate-200 mx-1" />
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select className="bg-transparent text-[9px] font-black uppercase tracking-widest text-slate-600 focus:outline-none cursor-pointer">
                <option>All Categories</option>
                <option>Computing</option>
                <option>Connectivity</option>
                <option>Processors</option>
              </select>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <NexusInput 
              placeholder="Search inventory..." 
              className="pl-11 h-11 bg-white border-slate-100 focus:border-emerald-500 rounded-xl text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Inventory List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-12 px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/30">
            <div className="col-span-4">Product</div>
            <div className="col-span-1 text-center">Stock</div>
            <div className="col-span-1 text-center">Velocity</div>
            <div className="col-span-1 text-center">Days Left</div>
            <div className="col-span-3">AI Insight</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {filteredStock.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <div className="grid grid-cols-12 items-center p-6 gap-4">
                    {/* Product Info */}
                    <div className="col-span-4 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full", 
                            item.status === 'critical' ? "bg-rose-500" :
                            item.status === 'at-risk' ? "bg-amber-500" :
                            item.status === 'healthy' ? "bg-emerald-500" : "bg-blue-500"
                          )} />
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight italic">{item.name}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="col-span-1 text-center">
                      <div className="text-base font-black text-slate-900 italic">{item.stock}</div>
                      <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Units</div>
                    </div>

                    <div className="col-span-1 text-center">
                      <div className="text-xs font-black text-slate-900 italic">{item.velocity}</div>
                      <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">/ Day</div>
                    </div>

                    <div className="col-span-1 text-center">
                      <div className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block",
                        item.daysLeft <= 7 ? "bg-rose-50 text-rose-600" : 
                        item.daysLeft <= 30 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-600"
                      )}>
                        {item.daysLeft}d
                      </div>
                    </div>

                    {/* AI Insight */}
                    <div className="col-span-3">
                      <div className="flex gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-colors">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[9px] font-medium text-slate-500 leading-relaxed">
                          {item.aiInsight}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex flex-col gap-1.5">
                      {item.status === 'overstock' ? (
                        <NexusButton className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-black uppercase tracking-widest rounded-xl">
                          <TrendingUp className="w-3 h-3 mr-2" /> Run Promo
                        </NexusButton>
                      ) : (
                        <NexusButton 
                          onClick={() => setSelectedItemForReorder(item)}
                          className="w-full h-9 bg-slate-900 hover:bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest rounded-xl"
                        >
                          <ShoppingCart className="w-3 h-3 mr-2" /> Reorder
                        </NexusButton>
                      )}
                      <div className="grid grid-cols-2 gap-1.5">
                        <NexusButton variant="outline" className="h-9 border-slate-200 text-slate-600 text-[8px] font-black uppercase tracking-widest rounded-xl">
                          Brief
                        </NexusButton>
                        <NexusButton variant="outline" className="h-9 border-slate-200 text-slate-600 text-[8px] font-black uppercase tracking-widest rounded-xl">
                          Forecast
                        </NexusButton>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Reorder Modal */}
      <AnimatePresence>
        {selectedItemForReorder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Confirm Reorder</h2>
                  <button 
                    onClick={() => setSelectedItemForReorder(null)}
                    className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-black text-slate-900 mb-1 tracking-tight">{selectedItemForReorder.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedItemForReorder.category} • Current Stock: {selectedItemForReorder.stock}</p>
                </div>

                <div className="space-y-6 mb-10">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Quantity to Order</label>
                    <div className="relative">
                      <NexusInput 
                        type="number" 
                        value={reorderQuantity}
                        onChange={(e) => setReorderQuantity(parseInt(e.target.value) || 0)}
                        className="h-14 text-xl font-black italic bg-slate-50 border-slate-100 focus:bg-white focus:border-emerald-500 rounded-2xl pl-6"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-3">
                    <BrainCircuit className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-indigo-700 leading-relaxed">
                      AI suggests {reorderQuantity} units to cover 60 days of demand based on current velocity.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <NexusButton 
                    variant="outline" 
                    onClick={() => setSelectedItemForReorder(null)}
                    className="flex-1 h-14 font-black uppercase tracking-widest text-[10px] rounded-2xl border-slate-200"
                  >
                    Cancel
                  </NexusButton>
                  <NexusButton 
                    className="flex-1 h-14 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-slate-900/20"
                    onClick={() => {
                      // Handle reorder logic
                      setSelectedItemForReorder(null);
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" /> Confirm Reorder
                  </NexusButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * INTERNAL SUB-COMPONENTS
 */

const StatCard: React.FC<{ 
  label: string; 
  value: number; 
  subtitle: string; 
  status: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ label, value, subtitle, status, active, onClick }) => {
  const statusColors = {
    critical: "text-rose-600",
    'at-risk': "text-amber-600",
    healthy: "text-emerald-600",
    overstock: "text-blue-600",
  }[status as keyof typeof statusColors];

  const icon = {
    critical: <AlertTriangle className="w-5 h-5" />,
    'at-risk': <Clock className="w-5 h-5" />,
    healthy: <CheckCircle2 className="w-5 h-5" />,
    overstock: <Package className="w-5 h-5" />,
  }[status as keyof typeof icon];

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative p-6 rounded-[2rem] border-2 text-left transition-all duration-300 group",
        active 
          ? "bg-slate-900 border-slate-900 shadow-xl shadow-slate-900/10" 
          : "bg-white border-slate-100 hover:border-slate-200"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
          active ? "bg-white/10 text-white" : "bg-slate-50 text-slate-400 group-hover:text-slate-900"
        )}>
          {icon}
        </div>
        <div className={cn(
          "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
          active ? "bg-white/10 text-white" : "bg-slate-50 text-slate-400"
        )}>
          {subtitle}
        </div>
      </div>
      
      <div>
        <div className={cn("text-3xl font-black italic tracking-tighter mb-0.5", active ? "text-white" : "text-slate-900")}>
          {value}
        </div>
        <div className={cn("text-[10px] font-black uppercase tracking-widest", active ? "text-white/60" : statusColors)}>
          {label}
        </div>
      </div>
    </motion.button>
  );
};
