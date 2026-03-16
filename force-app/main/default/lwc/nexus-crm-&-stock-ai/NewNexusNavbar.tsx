import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, LogIn, UserCircle, Bell, ShoppingCart, 
  LogOut, FileText, Search, LayoutGrid, 
  MoreHorizontal, ChevronDown 
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  scrollId?: string;
}

interface NexusNavbarProps {
  isAuthenticated?: boolean;
  userType?: 'B2B' | 'B2C' | null;
  cartCount?: number;
  onViewChange?: (view: any) => void;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onRequestQuote?: () => void;
  activeView?: string;
  subHeaderItems?: NavItem[];
}

export const NexusNavbar: React.FC<NexusNavbarProps> = ({ 
  isAuthenticated, 
  cartCount = 0, 
  onViewChange, 
  onLogout,
  onLoginClick,
  onRequestQuote,
  activeView,
  subHeaderItems
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);

  // Default items for landing page
  const defaultSubHeaderItems: NavItem[] = [
    { id: 'home', label: 'Home' },
    { id: 'products', label: 'Products', icon: LayoutGrid, scrollId: 'products-section' },
    { id: 'about', label: 'About', scrollId: 'about-section' },
    { id: 'journey', label: 'Journey', scrollId: 'journey-section' },
    { id: 'faq', label: 'FAQ', scrollId: 'faq-section' },
  ];

  const itemsToRender = subHeaderItems || defaultSubHeaderItems;
  const visibleItems = itemsToRender.slice(0, 6); 
  const moreItems = itemsToRender.slice(6);

  return (
    <header className="sticky top-0 z-[200] w-full flex flex-col shadow-2xl">
      {/* Top Utility Bar */}
      <div className="bg-slate-950 w-full px-6 md:px-12 py-1 flex items-center justify-between border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500">
        <div className="flex items-center gap-4">
          <button className="hover:text-emerald-400">Help Center</button>
          <button className="hover:text-emerald-400">Track Order</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-500">System Status: Optimal</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-slate-950 w-full px-6 md:px-12 py-2 flex items-center gap-4 border-b border-white/5">
        <div className="text-white font-black text-xl italic tracking-tighter cursor-pointer" onClick={() => onViewChange?.('home')}>
          NEXUS<span className="text-emerald-500">.</span>
        </div>

        <div className="flex-1 max-w-2xl mx-auto hidden md:block">
          <div className="relative flex">
            <input type="text" placeholder="Search ecosystem..." className="w-full h-9 pl-4 pr-12 bg-white/5 border border-white/10 rounded-l-lg text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all" />
            <button className="h-9 w-12 bg-emerald-600 rounded-r-lg flex items-center justify-center text-white"><Search className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && <Bell className="w-5 h-5 text-slate-400" />}
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <button onClick={() => onViewChange?.('dashboard')} className="flex flex-col items-center group">
                <UserCircle className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
                <span className="text-[8px] font-black uppercase text-slate-500 mt-0.5">Portal</span>
              </button>
              <button onClick={() => onViewChange?.('cart')} className="flex flex-col items-center group relative">
                <ShoppingCart className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] rounded-full flex items-center justify-center">{cartCount}</span>}
                <span className="text-[8px] font-black uppercase text-slate-500 mt-0.5">Cart</span>
              </button>
              <button onClick={onLogout} className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={onLoginClick} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Login</button>
          )}
        </div>
      </div>

      {/* Sub-Header (Glass-morphism) */}
      <div className="bg-white/95 backdrop-blur-md w-full px-6 md:px-12 py-1 flex items-center gap-6 border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-6 h-8">
          {visibleItems.map(item => (
            <button 
              key={item.id}
              onClick={() => {
                if (item.scrollId) {
                  const el = document.getElementById(item.scrollId);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else { onViewChange?.('home'); setTimeout(() => document.getElementById(item.scrollId!)?.scrollIntoView({ behavior: 'smooth' }), 100); }
                } else onViewChange?.(item.id);
              }}
              className={cn("text-[9px] font-black uppercase tracking-widest transition-all hover:text-emerald-600 h-full border-b-2 border-transparent", activeView === item.id ? "text-emerald-600 border-emerald-500" : "text-slate-500")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};