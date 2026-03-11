import React from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, FileText, 
  User, LifeBuoy, LogOut, ChevronRight, TrendingUp,
  History, Users2, Sparkles, Bot, Zap, RefreshCw, Clock, ShieldCheck, Heart
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NexusLogo } from './NexusLogo';

interface PortalSidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  notificationsCount: number;
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  notificationsCount 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalog', label: 'Catalog', icon: Package },
    { id: 'favorites', label: 'My Favorites', icon: Heart },
    { id: 'orders', label: 'Orders & Delivery', icon: FileText },
    { id: 'quotations', label: 'Quotes & Contracts', icon: FileText },
    { id: 'cart', label: 'My Cart', icon: ShoppingCart, badge: notificationsCount },
    { id: 'swap', label: 'Nexus Swap', icon: RefreshCw },
    { id: 'passport', label: 'Digital Passport', icon: ShieldCheck },
    { id: 'timeline', label: '360° Timeline', icon: History },
    { id: 'war-room', label: 'War Room', icon: Users2 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'cases', label: 'Support Cases', icon: LifeBuoy },
  ];

  return (
    <aside className="w-80 flex-shrink-0 h-full bg-white p-8 flex flex-col border-r border-slate-100">
      <div className="mb-12">
        <NexusLogo 
          variant="slate"
          size="lg"
          subtitle="Customer Portal"
        />
      </div>

      <div className="flex-grow space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all group",
              activeTab === item.id 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <div className="flex items-center gap-4">
              <item.icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                activeTab === item.id ? "text-white" : "text-slate-400"
              )} />
              <span>{item.label}</span>
            </div>
            {item.badge ? (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            ) : (
              <ChevronRight className={cn(
                "w-4 h-4 transition-transform group-hover:translate-x-1",
                activeTab === item.id ? "text-white/50" : "text-slate-300"
              )} />
            )}
          </button>
        ))}

        <div className="mt-12 pt-12 border-t border-slate-100">
          <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-sm font-black text-indigo-900 mb-2">Premium Support</h4>
              <p className="text-xs text-indigo-700 leading-relaxed mb-6 font-bold">Need help with a complex order?</p>
              <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl text-xs font-black shadow-sm hover:bg-indigo-600 hover:text-white transition-all">
                Contact an expert
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-colors" />
          </div>
        </div>

        <div className="mt-auto pt-12">
          <button className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-rose-500 font-bold transition-all group">
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
