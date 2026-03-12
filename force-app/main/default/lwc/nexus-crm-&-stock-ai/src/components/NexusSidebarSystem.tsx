import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Package, ShoppingCart, FileText, 
  User, LifeBuoy, LogOut, ChevronRight, TrendingUp,
  History, Users2, Sparkles, Bot, Zap, RefreshCw, 
  Clock, ShieldCheck, Heart, Bell, Settings,
  Search, Menu, X, Globe, CreditCard
} from 'lucide-react';
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NexusLogo } from './NexusLogo';

/**
 * UTILITIES
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * TYPES
 */
export type SidebarTab = 
  | 'dashboard' | 'catalog' | 'favorites' | 'orders' 
  | 'quotations' | 'cart' | 'swap' | 'passport' 
  | 'timeline' | 'war-room' | 'profile' | 'cases' | 'settings';

export interface SidebarMenuItem {
  id: SidebarTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
  category?: 'main' | 'tools' | 'account';
}

/**
 * MOCK DATA
 */
const DEFAULT_MENU_ITEMS: SidebarMenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'main' },
  { id: 'catalog', label: 'Catalog', icon: Package, category: 'main' },
  { id: 'favorites', label: 'My Favorites', icon: Heart, category: 'main' },
  { id: 'orders', label: 'Orders & Delivery', icon: TruckIcon, category: 'main' },
  { id: 'quotations', label: 'Quotes & Contracts', icon: FileText, category: 'main' },
  { id: 'cart', label: 'My Cart', icon: ShoppingCart, badge: 3, category: 'main' },
  
  { id: 'swap', label: 'Nexus Swap', icon: RefreshCw, category: 'tools' },
  { id: 'passport', label: 'Digital Passport', icon: ShieldCheck, category: 'tools' },
  { id: 'timeline', label: '360° Timeline', icon: History, category: 'tools' },
  { id: 'war-room', label: 'War Room', icon: Users2, category: 'tools' },
  
  { id: 'profile', label: 'Profile', icon: User, category: 'account' },
  { id: 'cases', label: 'Support Cases', icon: LifeBuoy, category: 'account' },
  { id: 'settings', label: 'Settings', icon: Settings, category: 'account' },
];

// Custom Truck Icon since it was missing in the original imports but used in logic
function TruckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10h3Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

/**
 * MAIN COMPONENT: NexusSidebarSystem
 */
export const NexusSidebarSystem: React.FC<{
  activeTab?: SidebarTab;
  onTabChange?: (tab: SidebarTab) => void;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  onLogout?: () => void;
}> = ({ 
  activeTab: externalActiveTab, 
  onTabChange,
  userName = "Marco Ross",
  userRole = "Enterprise Admin",
  userAvatar = "https://picsum.photos/seed/user/100/100",
  onLogout = () => console.log('Logout clicked')
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<SidebarTab>('dashboard');
  const activeTab = externalActiveTab || internalActiveTab;

  const handleTabChange = (tab: SidebarTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const renderMenuItem = (item: SidebarMenuItem) => {
    const isActive = activeTab === item.id;
    
    return (
      <button
        key={item.id}
        onClick={() => handleTabChange(item.id)}
        className={cn(
          "w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all duration-300 group relative overflow-hidden",
          isActive 
            ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <div className="flex items-center gap-4 relative z-10">
          <item.icon className={cn(
            "w-5 h-5 transition-transform duration-500 group-hover:scale-110",
            isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-900"
          )} />
          <span className="tracking-tight">{item.label}</span>
        </div>
        
        <div className="flex items-center gap-2 relative z-10">
          {item.badge ? (
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-rose-500/20">
              {item.badge}
            </span>
          ) : (
            <ChevronRight className={cn(
              "w-4 h-4 transition-transform duration-500 group-hover:translate-x-1",
              isActive ? "text-white/30" : "text-slate-300"
            )} />
          )}
        </div>

        {isActive && (
          <motion.div 
            layoutId="active-pill"
            className="absolute inset-0 bg-slate-900 -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>
    );
  };

  return (
    <aside className="w-80 flex-shrink-0 h-screen bg-white flex flex-col border-r border-slate-100 sticky top-0 overflow-hidden">
      {/* Header / Logo */}
      <div className="p-8 pb-12">
        <NexusLogo 
          variant="slate"
          size="lg"
          subtitle="Customer Portal"
        />
      </div>

      {/* Navigation Scroll Area */}
      <div className="flex-grow overflow-y-auto nexus-scrollbar px-6 space-y-8 pb-8">
        {/* Main Section */}
        <div className="space-y-1">
          <p className="px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>
          {DEFAULT_MENU_ITEMS.filter(i => i.category === 'main').map(renderMenuItem)}
        </div>

        {/* Tools Section */}
        <div className="space-y-1">
          <p className="px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Advanced Tools</p>
          {DEFAULT_MENU_ITEMS.filter(i => i.category === 'tools').map(renderMenuItem)}
        </div>

        {/* Account Section */}
        <div className="space-y-1">
          <p className="px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Account & Support</p>
          {DEFAULT_MENU_ITEMS.filter(i => i.category === 'account').map(renderMenuItem)}
        </div>

        {/* Premium Support Card */}
        <div className="pt-4">
          <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-200 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-white mb-2 uppercase italic tracking-tight">Premium Support</h4>
              <p className="text-xs text-indigo-100 leading-relaxed mb-6 font-bold">Need help with a complex enterprise order?</p>
              <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-900 hover:text-white transition-all duration-300">
                Contact an expert
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          </div>
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="p-6 border-t border-slate-50 bg-slate-50/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={userAvatar} 
                className="w-10 h-10 rounded-xl object-cover shadow-md" 
                alt={userName} 
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h5 className="text-xs font-black text-slate-900 tracking-tight">{userName}</h5>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{userRole}</p>
            </div>
          </div>
          <button className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-rose-500 font-black uppercase tracking-widest text-[10px] transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Logout System</span>
        </button>
      </div>
    </aside>
  );
};

export default NexusSidebarSystem;
