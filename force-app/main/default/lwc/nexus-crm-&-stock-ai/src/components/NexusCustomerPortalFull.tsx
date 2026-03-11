import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, ShoppingCart, Trash2, Plus, Minus, Truck, ShieldCheck,
  TrendingUp, History, Users2, Bot, X, ArrowUpRight, Sparkles,
  Mail, Phone, UserPlus, FileText, Building2, Search,
  AlertTriangle, Target, RefreshCw, Upload, Check, LifeBuoy, User,
  LayoutDashboard, LogOut, Zap, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';
import { cn } from '../lib/utils';
import { NexusCard } from './ui/NexusCard';
import { NexusButton } from './ui/NexusButton';
import { NexusBadge } from './ui/NexusBadge';
import { PortalDashboard } from './PortalDashboard';
import { PortalProfile } from './PortalProfile';
import { PortalCases } from './PortalCases';
import { B2BQuoteForm } from './B2BQuoteForm';
import { MOCK_PRODUCTS } from '../constants';

export type PortalTab = 'dashboard' | 'catalog' | 'orders' | 'quotations' | 'cart' | 'profile' | 'cases' | 'insights' | 'timeline' | 'war-room';

// --- INTERNAL SIDEBAR COMPONENT ---
const Sidebar: React.FC<{ activeTab: string; onTabChange: (tab: any) => void; notificationsCount: number }> = ({ 
  activeTab, onTabChange, notificationsCount 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalog', label: 'Catalogue', icon: Package },
    { id: 'orders', label: 'Commandes', icon: FileText },
    { id: 'quotations', label: 'Devis', icon: FileText },
    { id: 'cart', label: 'Mon Panier', icon: ShoppingCart, badge: notificationsCount },
    { id: 'insights', label: 'AI Insights', icon: TrendingUp },
    { id: 'timeline', label: '360° Timeline', icon: History },
    { id: 'war-room', label: 'War Room', icon: Users2 },
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'cases', label: 'Réclamations', icon: LifeBuoy },
  ];

  return (
    <aside className="w-80 flex-shrink-0 h-full bg-white p-8 flex flex-col border-r border-slate-100">
      <div className="mb-12 flex items-center gap-4 px-2">
        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
          <Zap className="w-7 h-7 fill-indigo-400 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">NEXUS</h1>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Customer Portal</p>
        </div>
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
              <h4 className="text-sm font-black text-indigo-900 mb-2">Support Premium</h4>
              <p className="text-xs text-indigo-700 leading-relaxed mb-6 font-bold">Besoin d'aide pour une commande complexe ?</p>
              <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl text-xs font-black shadow-sm hover:bg-indigo-600 hover:text-white transition-all">
                Contacter un expert
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-colors" />
          </div>
        </div>

        <div className="mt-auto pt-12">
          <button className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-rose-500 font-bold transition-all group">
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

// --- MAIN PORTAL COMPONENT ---
export const NexusCustomerPortalFull: React.FC<{
  isAuthenticated: boolean;
  userType: 'B2B' | 'B2C' | null;
  cart: any[];
  onAddToCart: (product: any) => void;
  onLoginRequest: () => void;
  initialTab?: PortalTab;
}> = ({ 
  isAuthenticated, 
  userType,
  cart, 
  onAddToCart,
  onLoginRequest,
  initialTab = 'dashboard'
}) => {
  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<any[]>([
    { id: 1, sender: 'bot', text: 'Nexus AI Copilot active. How can I help you with your account today?' }
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [isRequestingQuote, setIsRequestingQuote] = useState(false);
  const [showB2BForm, setShowB2BForm] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([
    { id: 'QT-2024-001', date: 'Mar 10, 2024', total: 12500, status: 'Accepted', probability: 98 },
    { id: 'QT-2024-002', date: 'Mar 15, 2024', total: 8900, status: 'Draft', probability: 72 },
  ]);
  const [quoteResult, setQuoteResult] = useState<{
    discount: number;
    terms: string;
    pdfSent: boolean;
    probability: number;
  } | null>(null);

  const forecastData = [
    { month: 'Jan', usage: 4500, forecast: 4500 },
    { month: 'Feb', usage: 5200, forecast: 5200 },
    { month: 'Mar', usage: 4800, forecast: 4800 },
    { month: 'Apr', usage: 6100, forecast: 6100 },
    { month: 'May', usage: null, forecast: 6800 },
    { month: 'Jun', usage: null, forecast: 7500 },
    { month: 'Jul', usage: null, forecast: 8200 },
  ];

  const timelineEvents = [
    { id: 1, type: 'order', title: 'Order Shipped #ORD-2024-001', date: 'Today, 10:30 AM', user: 'System', description: 'Your order has been dispatched from our warehouse.' },
    { id: 2, type: 'email', title: 'Contract Renewal Proposal', date: 'Yesterday, 2:15 PM', user: 'Sarah Miller', description: 'Sent the renewal proposal for the next fiscal year.' },
    { id: 3, type: 'call', title: 'Account Review Call', date: 'Mar 12, 2024', user: 'Marco Ross', description: 'Discussed Q1 performance and upcoming needs.' },
    { id: 4, type: 'case', title: 'Support Case Resolved #CS-1102', date: 'Mar 10, 2024', user: 'Tech Support', description: 'The calibration issue has been fixed remotely.' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-slate-50">
        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-8 shadow-xl">
          <ShieldCheck className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4">Accès Restreint</h2>
        <p className="text-slate-500 max-w-md mb-10 text-lg leading-relaxed">
          Veuillez vous connecter pour accéder à votre portail client Nexus et gérer vos services.
        </p>
        <NexusButton size="lg" onClick={onLoginRequest}>
          Se Connecter Maintenant
        </NexusButton>
      </div>
    );
  }

  const renderInsights = () => (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">AI Insights</h2>
        <NexusBadge variant="primary">Analyse en temps réel</NexusBadge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <NexusCard className="p-8">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Usage Prévu (Q3)</h4>
          <div className="text-4xl font-black text-slate-900">8,200 units</div>
          <p className="text-xs text-slate-500 mt-4 font-bold">+15% par rapport à Q2</p>
        </NexusCard>
        <NexusCard className="p-8">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
            <Target className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Efficacité du Stock</h4>
          <div className="text-4xl font-black text-slate-900">94%</div>
          <p className="text-xs text-slate-500 mt-4 font-bold">Optimisé par Nexus AI</p>
        </NexusCard>
        <NexusCard className="p-8">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Risque de Rupture</h4>
          <div className="text-4xl font-black text-slate-900">Faible</div>
          <p className="text-xs text-slate-500 mt-4 font-bold">3 alertes résolues</p>
        </NexusCard>
      </div>

      <NexusCard title="Prévisions de Consommation" padding="lg">
        <div className="h-[350px] w-full mt-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '900' }} />
              <Area type="monotone" dataKey="usage" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorUsage)" />
              <Area type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </NexusCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <NexusCard title="Intelligence Documentaire" padding="lg">
          <div onClick={() => { setIsProcessingDoc(true); setTimeout(() => setIsProcessingDoc(false), 3000); }} className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center hover:border-indigo-600 hover:bg-indigo-50/30 transition-all group cursor-pointer relative overflow-hidden">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2">Analyse de Documents</h4>
            <p className="text-sm text-slate-500">Déposez vos contrats ou factures pour une extraction automatique par Nexus AI.</p>
            {isProcessingDoc && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Analyse AI en cours...</span>
              </motion.div>
            )}
          </div>
        </NexusCard>
        <NexusCard title="Recommandations AI" padding="lg">
          <div className="space-y-6">
            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
              <div className="flex gap-4">
                <Sparkles className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                  Nous avons détecté une opportunité d'économiser <span className="font-black text-indigo-600">15%</span> sur vos frais de maintenance en passant au forfait Premium Annuel.
                </p>
              </div>
            </div>
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
              <div className="flex gap-4">
                <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <p className="text-sm font-bold text-emerald-900 leading-relaxed">
                  Votre score de santé de compte est de <span className="font-black text-emerald-600">98/100</span>. Toutes vos licences sont à jour.
                </p>
              </div>
            </div>
          </div>
        </NexusCard>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Timeline 360°</h2>
        <NexusBadge variant="primary">Historique Complet</NexusBadge>
      </div>
      <div className="max-w-4xl mx-auto py-12">
        <div className="relative">
          <div className="absolute left-16 top-0 bottom-0 w-px bg-slate-200" />
          <div className="space-y-16">
            {timelineEvents.map((event, i) => (
              <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-12 relative">
                <div className="flex-shrink-0 w-32 text-right pt-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{event.date}</p>
                </div>
                <div className="relative z-10">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl ring-8 ring-slate-50",
                    event.type === 'email' ? 'bg-indigo-600 text-white' :
                    event.type === 'call' ? 'bg-amber-500 text-white' :
                    event.type === 'order' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'
                  )}>
                    {event.type === 'email' ? <Mail className="w-6 h-6" /> :
                     event.type === 'call' ? <Phone className="w-6 h-6" /> :
                     event.type === 'order' ? <Package className="w-6 h-6" /> : <LifeBuoy className="w-6 h-6" />}
                  </div>
                </div>
                <div className="flex-1">
                  <NexusCard className="p-8 hover:shadow-2xl transition-all duration-500">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-black text-slate-900">{event.title}</h4>
                      <NexusBadge variant="primary" className="text-[10px] font-black uppercase">{event.user}</NexusBadge>
                    </div>
                    <p className="text-slate-500 font-medium leading-relaxed">{event.description}</p>
                  </NexusCard>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderWarRoom = () => (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">War Room</h2>
        <NexusBadge variant="danger">Collaboration Prioritaire</NexusBadge>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <NexusCard className="p-12 bg-slate-900 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-12">
              <div className="w-16 h-16 rounded-[2rem] bg-rose-500 flex items-center justify-center shadow-xl shadow-rose-500/20">
                <Users2 className="w-8 h-8 text-white" />
              </div>
              <NexusBadge variant="danger">Session Active</NexusBadge>
            </div>
            <h3 className="text-3xl font-black mb-4 tracking-tight">Projet Expansion IoT</h3>
            <p className="text-slate-400 mb-12 text-lg leading-relaxed">Collaboration en temps réel avec l'équipe Nexus pour finaliser votre déploiement.</p>
            <div className="space-y-6 mb-12">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xs font-black">SM</div>
                <div className="flex-1 bg-white/5 p-4 rounded-3xl rounded-tl-none border border-white/10">
                  <p className="text-sm font-medium text-slate-300">Spécifications techniques mises à jour.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <NexusButton className="flex-1 py-4 bg-rose-500 hover:bg-rose-600">Rejoindre</NexusButton>
              <NexusButton variant="outline" className="flex-1 py-4 border-white/10 text-white">Documents</NexusButton>
            </div>
          </div>
        </NexusCard>
        <NexusCard title="Playbook de Succès" padding="lg">
          <div className="space-y-4">
            {[
              { step: 'Configuration de la passerelle IoT', status: 'completed' },
              { step: 'Formation de l\'équipe technique', status: 'active' },
              { step: 'Audit de sécurité initial', status: 'pending' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm", item.status === 'completed' ? 'bg-emerald-500 text-white' : item.status === 'active' ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400')}>
                  {item.status === 'completed' ? <Check className="w-5 h-5" /> : i + 1}
                </div>
                <div className="flex-grow">
                  <div className={cn("font-black text-sm", item.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900')}>{item.step}</div>
                </div>
              </div>
            ))}
          </div>
        </NexusCard>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Commandes</h2>
        <NexusBadge variant="primary">Suivi en direct</NexusBadge>
      </div>
      <div className="space-y-6">
        {[
          { id: 'ORD-2024-001', date: 'Aujourd\'hui', total: 4500, status: 'En cours' },
          { id: 'ORD-2023-098', date: '12 Mars 2024', total: 12800, status: 'Livré' },
        ].map(order => (
          <NexusCard key={order.id} className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                  <Package className="w-6 h-6" />
                </div>
                <div><h4 className="text-xl font-black text-slate-900">{order.id}</h4><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{order.date}</p></div>
              </div>
              <div className="text-right"><div className="text-2xl font-black text-slate-900">${order.total}</div><NexusBadge variant={order.status === 'Livré' ? 'primary' : 'warning'}>{order.status}</NexusBadge></div>
            </div>
          </NexusCard>
        ))}
      </div>
    </div>
  );

  const renderQuotations = () => (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Devis & Offres</h2>
        <NexusBadge variant="primary">Généré par Nexus AI</NexusBadge>
      </div>
      <div className="space-y-6">
        {quotes.map(quote => (
          <NexusCard key={quote.id} className="p-8 hover:shadow-2xl transition-all duration-500 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <FileText className="w-6 h-6" />
                </div>
                <div><h4 className="text-xl font-black text-slate-900">{quote.id}</h4><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{quote.date}</p></div>
              </div>
              <div className="flex items-center gap-12">
                <div className="text-center"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Probabilité</div><div className="text-lg font-black text-indigo-600">{quote.probability}%</div></div>
                <div className="text-right"><div className="text-2xl font-black text-slate-900">${quote.total}</div><NexusBadge variant={quote.status === 'Accepted' ? 'primary' : quote.status === 'Sent' ? 'warning' : 'secondary'}>{quote.status}</NexusBadge></div>
                <NexusButton variant="outline" size="sm" className="group-hover:bg-indigo-600 group-hover:text-white transition-all"><ArrowUpRight className="w-4 h-4" /></NexusButton>
              </div>
            </div>
          </NexusCard>
        ))}
      </div>
    </div>
  );

  const renderCart = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-8 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter">Mon Panier</h2>
          <NexusBadge variant="primary" className="px-6 py-2 text-sm">{cart.length} Articles</NexusBadge>
        </div>
        {cart.length === 0 ? (
          <NexusCard className="text-center py-32 bg-white/50 border-dashed border-2">
            <ShoppingCart className="w-24 h-24 text-slate-200 mx-auto mb-8" />
            <p className="text-2xl font-black text-slate-400">Votre panier est vide.</p>
            <NexusButton variant="outline" className="mt-10 h-14 px-10 text-lg" onClick={() => setActiveTab('catalog')}>Parcourir le catalogue</NexusButton>
          </NexusCard>
        ) : (
          <div className="space-y-8">
            {cart.map((item, idx) => (
              <NexusCard key={idx} padding="none" className="group overflow-hidden hover:shadow-3xl transition-all duration-700 border-none bg-white ring-1 ring-slate-200/50">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-72 h-72 bg-slate-50 overflow-hidden flex-shrink-0 relative">
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={item.name} />
                  </div>
                  <div className="flex-grow p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div><div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Nexus Product</div><h4 className="text-3xl font-black text-slate-900 tracking-tight">{item.name}</h4></div>
                        <button className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 className="w-6 h-6" /></button>
                      </div>
                      <p className="text-slate-500 font-medium leading-relaxed max-w-xl">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-10">
                      <div className="flex items-center gap-6 bg-slate-50 rounded-2xl p-2 border border-slate-100">
                        <button className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition-all"><Minus className="w-4 h-4" /></button>
                        <span className="text-lg font-black w-10 text-center">1</span>
                        <button className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition-all"><Plus className="w-4 h-4" /></button>
                      </div>
                      <div className="text-4xl font-black text-slate-900">${item.price}</div>
                    </div>
                  </div>
                </div>
              </NexusCard>
            ))}
          </div>
        )}
      </div>
      <div className="lg:col-span-4 space-y-8">
        <NexusCard title="Récapitulatif" padding="lg" className="sticky top-12 border-none shadow-2xl ring-1 ring-slate-200/50">
          <div className="space-y-6 mb-10">
            <div className="flex justify-between text-slate-500 text-lg font-medium"><span>Sous-total</span><span className="font-black text-slate-900">${cart.reduce((acc, item) => acc + item.price, 0)}</span></div>
            <div className="flex justify-between text-slate-500 text-lg font-medium"><span>Livraison</span><span className="text-emerald-600 font-black">Gratuit</span></div>
            <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
              <div><span className="text-sm font-black text-slate-400 uppercase tracking-widest block mb-1">Total à payer</span><span className="text-lg font-black text-slate-900">TVA incluse</span></div>
              <span className="text-5xl font-black text-indigo-600 tracking-tighter">${cart.reduce((acc, item) => acc + item.price, 0)}</span>
            </div>
          </div>
          <div className="space-y-4">
            <NexusButton className="w-full py-6 text-xl font-black uppercase tracking-widest h-20 shadow-xl shadow-indigo-200">Passer la commande</NexusButton>
            <div className="pt-4 border-t border-slate-100">
              <NexusButton 
                variant="outline" 
                className="w-full py-6 text-sm font-black uppercase tracking-widest border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white h-20 transition-all" 
                onClick={() => setShowB2BForm(true)}
              >
                Request Formal Quote
              </NexusButton>
            </div>
          </div>
        </NexusCard>
      </div>
    </div>
  );

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Hardware', 'Networking', 'IoT'];
  
  const filteredProducts = MOCK_PRODUCTS.filter(p => 
    (activeCategory === 'All' || p.family === activeCategory) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderCatalog = () => (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="relative p-16 bg-slate-900 rounded-[4rem] overflow-hidden shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-400 mb-8">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Nexus Premium Selection</span>
            </div>
            <h2 className="text-7xl font-black text-white tracking-tighter mb-6 leading-none">
              CATALOGUE <span className="text-indigo-400">COMPLET</span>
            </h2>
            <p className="text-slate-400 text-xl font-medium max-w-xl leading-relaxed">
              Explorez notre gamme complète de solutions Nexus. Des technologies de pointe pour transformer votre infrastructure industrielle.
            </p>
          </div>
          <div className="hidden lg:flex justify-end">
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute inset-4 border-2 border-indigo-500/30 rounded-full animate-spin-slow" />
              <div className="absolute inset-12 border border-white/10 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-32 h-32 text-indigo-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-600/10 to-transparent" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-indigo-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/50">
        <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-8 py-3 rounded-xl text-sm font-black transition-all uppercase tracking-widest",
                activeCategory === cat 
                  ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-200" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-grow lg:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit..." 
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all"
            />
          </div>
          <NexusButton variant="outline" className="h-16 px-8 rounded-2xl border-slate-200 hover:bg-slate-50">
            <ArrowUpRight className="w-5 h-5" />
          </NexusButton>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product) => (
            <motion.div
              layout
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <NexusCard padding="none" className="group h-full overflow-hidden hover:shadow-4xl transition-all duration-700 border-none bg-white ring-1 ring-slate-200/50 flex flex-col relative">
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                  <img 
                    src={product.image} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                    alt={product.name} 
                  />
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <NexusBadge variant={product.status === 'In Stock' ? 'success' : 'warning'} className="backdrop-blur-md bg-white/80 border-none shadow-sm font-black">
                      {product.status}
                    </NexusBadge>
                    {product.price > 1000 && (
                      <NexusBadge variant="primary" className="backdrop-blur-md bg-indigo-600/80 text-white border-none shadow-sm font-black">
                        PREMIUM
                      </NexusBadge>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                    <NexusButton variant="outline" className="w-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white hover:text-slate-900 font-black">
                      DÉTAILS PRODUIT
                    </NexusButton>
                  </div>
                </div>
                
                <div className="p-10 flex-grow flex flex-col">
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{product.family}</div>
                    </div>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-4 group-hover:text-indigo-600 transition-colors leading-tight">{product.name}</h4>
                    <p className="text-slate-500 text-base font-medium line-clamp-2 leading-relaxed opacity-80">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Investissement</div>
                      <div className="text-4xl font-black text-slate-900 tracking-tighter">${product.price}</div>
                    </div>
                    <NexusButton 
                      onClick={() => onAddToCart(product)}
                      className="h-16 px-10 rounded-2xl shadow-xl shadow-indigo-200 hover:shadow-indigo-400 hover:-translate-y-1 transition-all font-black"
                    >
                      AJOUTER
                    </NexusButton>
                  </div>
                </div>
              </NexusCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-32 bg-white rounded-[4rem] shadow-xl shadow-slate-200/50">
          <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Search className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-2">Aucun produit trouvé</h3>
          <p className="text-slate-500 font-medium">Essayez d'ajuster vos filtres ou votre recherche.</p>
          <NexusButton variant="outline" className="mt-10" onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}>
            Réinitialiser
          </NexusButton>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <PortalDashboard onShowActivity={() => {}} onSelectOffer={() => {}} />;
      case 'profile': return <PortalProfile userType={userType} />;
      case 'cases': return <PortalCases />;
      case 'insights': return renderInsights();
      case 'timeline': return renderTimeline();
      case 'war-room': return renderWarRoom();
      case 'orders': return renderOrders();
      case 'quotations': return renderQuotations();
      case 'cart': return renderCart();
      case 'catalog': return renderCatalog();
      default: return <div className="text-center p-24 bg-white rounded-[3rem] border border-slate-200"><h3 className="text-2xl font-black text-slate-900">Section en développement</h3></div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} notificationsCount={cart.length} />

      <main className="flex-grow p-16 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Quote Generation Modal */}
      <AnimatePresence>
        {(isRequestingQuote || quoteResult) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden">
              <div className="p-10">
                {isRequestingQuote ? (
                  <div className="text-center py-12">
                    <div className="relative w-24 h-24 mx-auto mb-8"><RefreshCw className="w-full h-full text-indigo-600 animate-spin" /><div className="absolute inset-0 flex items-center justify-center"><FileText className="w-8 h-8 text-indigo-600" /></div></div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Salesforce Flow Active</h3>
                    <p className="text-slate-500 font-bold text-sm">Generating Quote Object & PDF...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between"><div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Check className="w-8 h-8" /></div><button onClick={() => setQuoteResult(null)} className="text-slate-300 hover:text-slate-900"><X className="w-6 h-6" /></button></div>
                    <div><h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Quote Generated</h3><p className="text-slate-500 font-bold mt-1">A formal PDF has been emailed to your account.</p></div>
                    <div className="grid grid-cols-2 gap-4"><div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Discount Applied</div><div className="text-2xl font-black text-emerald-600">{quoteResult?.discount}% Bulk</div></div><div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Terms</div><div className="text-2xl font-black text-slate-900">{quoteResult?.terms}</div></div></div>
                    <div className="p-6 bg-indigo-900 rounded-3xl text-white relative overflow-hidden"><div className="relative z-10 flex items-center justify-between"><div><div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-indigo-400" /><span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Agentforce Prediction</span></div><div className="text-sm font-bold">Acceptance Probability</div></div><div className="text-4xl font-black">{quoteResult?.probability}%</div></div></div>
                    <NexusButton className="w-full py-4" onClick={() => setQuoteResult(null)}>Done</NexusButton>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating AI Copilot */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
        <AnimatePresence>{isCopilotOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="w-96 bg-white rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-slate-200 flex flex-col h-[500px]">
            <div className="p-8 bg-slate-900 text-white flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg"><Bot className="w-7 h-7" /></div><div><h4 className="text-lg font-black tracking-tight">Nexus AI</h4><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Copilot Actif</p></div></div><button onClick={() => setIsCopilotOpen(false)} className="text-white/50 hover:text-white transition-colors"><X className="w-6 h-6" /></button></div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 nexus-scrollbar">{copilotMessages.map(msg => (<div key={msg.id} className={cn("flex", msg.sender === 'user' ? 'justify-end' : 'justify-start')}><div className={cn("max-w-[85%] p-5 rounded-[2rem] text-sm font-medium leading-relaxed", msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-900 rounded-tl-none')}>{msg.text}</div></div>))}</div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50"><div className="relative"><input value={copilotInput} onChange={(e) => setCopilotInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && copilotInput.trim()) { setCopilotMessages([...copilotMessages, { id: Date.now(), sender: 'user', text: copilotInput }]); setCopilotInput(''); setTimeout(() => { setCopilotMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: "J'analyse votre demande..." }]); }, 1000); } }} placeholder="Posez une question..." className="w-full pl-6 pr-14 py-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none shadow-sm" /><button className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><ArrowUpRight className="w-4 h-4" /></button></div></div>
          </motion.div>
        )}</AnimatePresence>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsCopilotOpen(!isCopilotOpen)} className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl group relative overflow-hidden"><Bot className="w-10 h-10 group-hover:animate-bounce" /></motion.button>
      </div>

      {/* B2B Quote Form Overlay */}
      <AnimatePresence>
        {showB2BForm && (
          <B2BQuoteForm 
            product={cart.length > 0 ? cart[0] : undefined} 
            onClose={() => setShowB2BForm(false)} 
            onSubmit={(data) => {
              console.log('Bulk Quote Request Submitted:', data);
              setShowB2BForm(false);
              setQuoteResult({
                discount: 10,
                terms: 'Net 30',
                pdfSent: true,
                probability: 92
              });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
