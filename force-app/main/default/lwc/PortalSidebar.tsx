import React from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, FileText, 
  User, LifeBuoy, LogOut, ChevronRight 
} from 'lucide-react';
import { cn } from '../lib/utils';

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
    { id: 'catalog', label: 'Catalogue', icon: Package },
    { id: 'orders', label: 'Commandes', icon: FileText },
    { id: 'quotations', label: 'Devis', icon: FileText },
    { id: 'cart', label: 'Mon Panier', icon: ShoppingCart, badge: notificationsCount },
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'cases', label: 'Réclamations', icon: LifeBuoy },
  ];

  return (
    <aside className="w-80 flex-shrink-0">
      <div className="sticky top-32 space-y-2">
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

        <div className="mt-12 pt-12 border-t border-slate-200">
          <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-sm font-black text-indigo-900 mb-2">Support Premium</h4>
              <p className="text-xs text-indigo-700 leading-relaxed mb-4">Besoin d'aide pour une commande complexe ?</p>
              <button className="w-full py-3 bg-white text-indigo-600 rounded-xl text-xs font-black shadow-sm hover:bg-indigo-600 hover:text-white transition-all">
                Contacter un expert
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-colors" />
          </div>
        </div>
      </div>
    </aside>
  );
};