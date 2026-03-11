import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, ShoppingCart, Trash2, Plus, Minus, Truck, ShieldCheck,
  TrendingUp, History, Users2, Bot, X, ArrowUpRight, Sparkles,
  Mail, Phone, UserPlus, FileText, Building2, Search,
  AlertTriangle, Target, RefreshCw, Upload,
  LifeBuoy, Check, Heart, MapPin, Bell, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';
import { cn } from '../lib/utils';
import { PortalSidebar } from './PortalSidebar';
import { PortalDashboard } from './PortalDashboard';
import { PortalProfile } from './PortalProfile';
import { PortalCases } from './PortalCases';
import { NexusSwap } from './NexusSwap';
import { NexusTimeMachine } from './NexusTimeMachine';
import { NexusDigitalPassport } from './NexusDigitalPassport';
import { NexusCatalog } from './NexusCatalog';
import { NexusWarRoomStreaming } from './NexusWarRoomStreaming';
import { ProductCard } from './ProductCard';
import { NexusCard } from './ui/NexusCard';
import { NexusButton } from './ui/NexusButton';
import { NexusBadge } from './ui/NexusBadge';
import { NexusQuoteNegotiator } from './NexusQuoteNegotiator';
import { B2BQuoteForm } from './B2BQuoteForm';
import { Product, CartItem, Quote, QuoteMessage, QuoteVersion } from '../types';

export type PortalTab = 'dashboard' | 'catalog' | 'favorites' | 'orders' | 'quotations' | 'cart' | 'profile' | 'cases' | 'insights' | 'timeline' | 'war-room' | 'swap' | 'time-machine' | 'passport';

interface CustomerPortalProps {
  isAuthenticated: boolean;
  userType: 'B2B' | 'B2C' | null;
  cart: CartItem[];
  favorites: any[];
  notifications: any[];
  onAddToCart: (product: any) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onToggleFavorite: (product: any) => void;
  onLoginRequest: () => void;
  initialTab?: PortalTab;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ 
  isAuthenticated, 
  userType,
  cart, 
  favorites,
  notifications, 
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  onToggleFavorite,
  onLoginRequest,
  initialTab = 'dashboard'
}) => {
  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState<{ id: number, title: string, message: string, type: 'offer' | 'update' | 'product' } | null>(null);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [quoteFilter, setQuoteFilter] = useState<'All' | 'Accepted' | 'Sent' | 'Draft'>('All');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [notificationsList, setNotificationsList] = useState<any[]>([
    { id: 1, title: 'Quote Updated', message: 'Sarah Miller updated quote QT-2024-001 (v2.0).', type: 'info', time: '10m' },
    { id: 2, title: 'Contract Ready', message: 'The contract for QT-2024-001 is ready for signature.', type: 'success', time: '1h' },
    { id: 3, title: 'New Message', message: 'Sarah Miller: "Hello! Here is the updated version..."', type: 'info', time: '2h' },
  ]);
  const [copilotMessages, setCopilotMessages] = useState<any[]>([
    { id: 1, sender: 'bot', text: 'Nexus AI Copilot active. How can I help you with your account today?' }
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [isRequestingQuote, setIsRequestingQuote] = useState(false);
  const [showB2BForm, setShowB2BForm] = useState(false);
  const [showRareItemAlert, setShowRareItemAlert] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([
    { 
      id: 'QT-2024-001', 
      date: '10 Mars 2024', 
      total: 12500, 
      status: 'Accepted', 
      probability: 98,
      currentVersion: 2,
      versions: [
        { version: 1, date: '05 Mars 2024', total: 13800, status: 'Sent', products: [] },
        { version: 2, date: '10 Mars 2024', total: 12500, status: 'Accepted', products: [] }
      ],
      messages: [
        { id: '1', sender: 'rep', text: 'Hello! Here is the updated version with the 10% discount as agreed.', time: 'March 10, 14:30' },
        { id: '2', sender: 'user', text: 'Thanks Sarah, this works perfectly for us.', time: 'March 10, 15:00' }
      ],
      contractStatus: 'Pending Signature'
    },
    { 
      id: 'QT-2024-002', 
      date: 'March 15, 2024', 
      total: 8900, 
      status: 'Negotiation', 
      probability: 72,
      currentVersion: 1,
      versions: [
        { version: 1, date: 'March 15, 2024', total: 8900, status: 'Sent', products: [] }
      ],
      messages: [
        { id: '1', sender: 'rep', text: 'I have sent the first draft of the quote for the IoT sensors.', time: 'March 15, 09:00' }
      ]
    },
  ]);
  const [quoteResult, setQuoteResult] = useState<{
    discount: number;
    terms: string;
    pdfSent: boolean;
    probability: number;
  } | null>(null);

  useEffect(() => {
    // Simulate Rare Item Alert
    const alertTimer = setTimeout(() => {
      setShowRareItemAlert(true);
    }, 8000);

    return () => clearTimeout(alertTimer);
  }, []);

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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 transition-colors duration-500">
        <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-8 transition-colors duration-500">
          <ShieldCheck className="w-12 h-12 text-slate-300" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 uppercase italic tracking-tighter transition-colors duration-500">Accès Restreint</h2>
        <p className="text-slate-500 max-w-md mb-10 text-lg leading-relaxed font-medium transition-colors duration-500">
          Veuillez vous connecter pour accéder à votre portail client Nexus et gérer vos services.
        </p>
        <NexusButton size="lg" onClick={onLoginRequest}>
          Se Connecter Maintenant
        </NexusButton>
      </div>
    );
  }

  useEffect(() => {
    const banners: any[] = [
      { id: 1, title: 'Offre Spéciale', message: '-20% sur les capteurs IoT ce weekend !', type: 'offer' },
      { id: 2, title: 'Nouveau Produit', message: 'Découvrez le Nexus Core X-2 ultra-puissant.', type: 'product' },
      { id: 3, title: 'Mise à jour', message: 'Nouvelle interface de suivi live disponible.', type: 'update' },
    ];

    const timer = setTimeout(() => {
      setActiveBanner(banners[Math.floor(Math.random() * banners.length)]);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const activities = [
    { id: '001', title: 'Order Nexus Industrial Sensor X1', time: '2 hours ago', client: 'TechFlow Inc', status: 'Delivered', type: 'success' },
    { id: '002', title: 'Quote Update QT-2024', time: '5 hours ago', client: 'Global Logistics', status: 'In transit', type: 'primary' },
    { id: '003', title: 'New support message', time: 'Yesterday', client: 'Nexus Support', status: 'Replied', type: 'primary' },
    { id: '004', title: 'Payment received INV-452', time: 'Yesterday', client: 'Finance Dept', status: 'Completed', type: 'success' },
    { id: '005', title: 'Predictive maintenance alert', time: '2 days ago', client: 'Asset #452', status: 'Urgent', type: 'warning' },
  ];

  const handleSendMessage = (quoteId: string, text: string) => {
    setQuotes(prev => prev.map(q => {
      if (q.id === quoteId) {
        const newMessage: QuoteMessage = {
          id: Date.now().toString(),
          sender: 'user',
          text,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        return { ...q, messages: [...q.messages, newMessage] };
      }
      return q;
    }));
    
    // Update selectedQuote if it's the one being messaged
    if (selectedQuote?.id === quoteId) {
      setSelectedQuote(prev => prev ? {
        ...prev,
        messages: [...prev.messages, {
          id: Date.now().toString(),
          sender: 'user',
          text,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }]
      } : null);
    }
  };

  const handleSignContract = (quoteId: string) => {
    setQuotes(prev => prev.map(q => {
      if (q.id === quoteId) {
        return { ...q, status: 'Signed', contractStatus: 'Signed' };
      }
      return q;
    }));
    
    if (selectedQuote?.id === quoteId) {
      setSelectedQuote(prev => prev ? { ...prev, status: 'Signed', contractStatus: 'Signed' } : null);
    }

    setNotificationsList(prev => [
      { id: Date.now(), title: 'Contract Signed', message: `The contract for ${quoteId} was successfully signed.`, type: 'success', time: 'Just now' },
      ...prev
    ]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <PortalDashboard 
          onShowActivity={() => setShowAllActivity(true)} 
          onSelectOffer={(offer) => setSelectedOffer(offer)} 
        />;
      case 'profile':
        return <PortalProfile userType={userType} />;
      case 'cases':
        return <PortalCases />;
      case 'insights':
        return renderInsights();
      case 'timeline':
        return renderTimeline();
      case 'war-room':
        return renderWarRoom();
      case 'swap':
        return <NexusSwap />;
      case 'time-machine':
        return <NexusTimeMachine />;
      case 'passport':
        return <NexusDigitalPassport />;
      case 'orders':
        return renderOrders();
      case 'quotations':
        return renderQuotations();
      case 'cart':
        return renderCart();
      case 'catalog':
        return <NexusCatalog 
          onAddToCart={onAddToCart} 
          onToggleFavorite={onToggleFavorite} 
          favorites={favorites} 
        />;
      case 'favorites':
        return renderFavorites();
      default:
        return (
          <div className="text-center p-24 bg-white rounded-[3rem] border border-slate-200 transition-colors duration-500">
            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Section en développement</h3>
            <p className="text-slate-500 mt-2 font-medium">Cette fonctionnalité sera bientôt disponible.</p>
          </div>
        );
    }
  };

  const renderInsights = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic transition-colors duration-500">AI Insights</h2>
        <NexusBadge variant="primary">Analyse en temps réel</NexusBadge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NexusCard className="p-6">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 transition-colors duration-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 transition-colors duration-500">Usage Prévu (Q3)</h4>
          <div className="text-3xl font-black text-slate-900 transition-colors duration-500">8,200 units</div>
          <p className="text-[10px] text-slate-500 mt-2 font-bold transition-colors duration-500">+15% par rapport à Q2</p>
        </NexusCard>
        <NexusCard className="p-6">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 transition-colors duration-500">
            <Target className="w-5 h-5" />
          </div>
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 transition-colors duration-500">Efficacité du Stock</h4>
          <div className="text-3xl font-black text-slate-900 transition-colors duration-500">94%</div>
          <p className="text-[10px] text-slate-500 mt-2 font-bold transition-colors duration-500">Optimisé par Nexus AI</p>
        </NexusCard>
        <NexusCard className="p-6">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4 transition-colors duration-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 transition-colors duration-500">Risque de Rupture</h4>
          <div className="text-3xl font-black text-slate-900 transition-colors duration-500">Faible</div>
          <p className="text-[10px] text-slate-500 mt-2 font-bold transition-colors duration-500">3 alertes résolues</p>
        </NexusCard>
      </div>

      <NexusCard title="Prévisions de Consommation" padding="md">
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '1.5rem', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#0f172a'
                }}
                itemStyle={{ color: '#0f172a' }}
              />
              <Area 
                type="monotone" 
                dataKey="usage" 
                stroke="#6366f1" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorUsage)" 
              />
              <Area 
                type="monotone" 
                dataKey="forecast" 
                stroke="#6366f1" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </NexusCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <NexusCard title="Intelligence Documentaire" padding="lg">
          <div 
            onClick={() => {
              setIsProcessingDoc(true);
              setTimeout(() => setIsProcessingDoc(false), 3000);
            }}
            className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center hover:border-indigo-600 hover:bg-indigo-50/30 transition-all group cursor-pointer relative overflow-hidden"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2 uppercase italic tracking-tighter">Analyse de Documents</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Déposez vos contrats ou factures pour une extraction automatique par Nexus AI.</p>
            {isProcessingDoc && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10"
              >
                <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Analyse AI en cours...</span>
              </motion.div>
            )}
          </div>
        </NexusCard>
        <NexusCard title="Recommandations AI" padding="lg">
          <div className="space-y-6">
            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 transition-colors duration-500">
              <div className="flex gap-4">
                <Sparkles className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                <p className="text-sm font-bold text-indigo-900 leading-relaxed">
                  Nous avons détecté une opportunité d'économiser <span className="font-black text-indigo-600">15%</span> sur vos frais de maintenance en passant au forfait Premium Annuel.
                </p>
              </div>
            </div>
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 transition-colors duration-500">
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic transition-colors duration-500">Timeline 360°</h2>
        <NexusBadge variant="primary">Historique Complet</NexusBadge>
      </div>

      <div className="max-w-4xl mx-auto py-8">
        <div className="relative">
          <div className="absolute left-16 top-0 bottom-0 w-px bg-slate-200 transition-colors duration-500" />
          <div className="space-y-12">
            {timelineEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-8 relative"
              >
                <div className="flex-shrink-0 w-32 text-right pt-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest transition-colors duration-500">{event.date}</p>
                </div>
                <div className="relative z-10">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-xl ring-8 ring-slate-50 transition-all duration-500",
                    event.type === 'email' ? 'bg-indigo-600 text-white' :
                    event.type === 'call' ? 'bg-amber-500 text-white' :
                    event.type === 'order' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'
                  )}>
                    {event.type === 'email' ? <Mail className="w-5 h-5" /> :
                     event.type === 'call' ? <Phone className="w-5 h-5" /> :
                     event.type === 'order' ? <Package className="w-5 h-5" /> : <LifeBuoy className="w-5 h-5" />}
                  </div>
                </div>
                <div className="flex-1">
                  <NexusCard className="p-6 hover:shadow-2xl transition-all duration-500">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter transition-colors duration-500">{event.title}</h4>
                      <NexusBadge variant="primary" className="text-[9px] font-black uppercase">{event.user}</NexusBadge>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed transition-colors duration-500">{event.description}</p>
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
    <div className="h-[calc(100vh-8rem)]">
      <NexusWarRoomStreaming />
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight transition-colors duration-500">Suivi de Commandes</h2>
        <NexusBadge variant="primary">Livraison en temps réel</NexusBadge>
      </div>
      
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-6">
          {[
            { 
              id: 'ORD-2024-001', 
              date: 'Today', 
              total: 4500, 
              status: 'In Transit',
              progress: 65,
              eta: 'Tomorrow, 14:00',
              location: 'Sorting Center - Paris South',
              items: 3
            },
            { 
              id: 'ORD-2023-098', 
              date: 'March 12, 2024', 
              total: 12800, 
              status: 'Delivered',
              progress: 100,
              eta: 'Delivered March 14',
              location: 'Your Address',
              items: 12
            },
          ].map(order => (
            <NexusCard key={order.id} className="p-8 hover:shadow-2xl transition-all duration-500 overflow-hidden group border-none bg-white ring-1 ring-slate-200/50">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl transition-colors duration-500">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 transition-colors duration-500">{order.id}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors duration-500">{order.date}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 transition-colors duration-500">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 transition-colors duration-500">Total</div>
                      <div className="text-lg font-black text-slate-900 transition-colors duration-500">${order.total}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 transition-colors duration-500">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 transition-colors duration-500">Items</div>
                      <div className="text-lg font-black text-slate-900 transition-colors duration-500">{order.items}</div>
                    </div>
                  </div>
                </div>

                <div className="flex-grow space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full animate-pulse",
                        order.status === 'Delivered' ? 'bg-emerald-500' : 'bg-amber-500'
                      )} />
                      <span className="text-base font-black text-slate-900 uppercase tracking-tight transition-colors duration-500">{order.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 transition-colors duration-500">Estimated Arrival</span>
                      <span className="text-xs font-black text-indigo-600 transition-colors duration-500">{order.eta}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden transition-colors duration-500">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${order.progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full",
                          order.status === 'Livré' ? 'bg-emerald-500' : 'bg-indigo-600'
                        )}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest transition-colors duration-500">
                      <span>Shipped</span>
                      <span>In Transit</span>
                      <span>Delivery</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 transition-colors duration-500">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-900">Current position : <span className="font-black">{order.location}</span></span>
                  </div>
                </div>
              </div>
            </NexusCard>
          ))}
        </div>

        <div className="col-span-4 space-y-8">
          <NexusCard className="bg-slate-900 border-none p-0 overflow-hidden h-[500px] relative group transition-colors duration-500">
            <div className="absolute inset-0 opacity-40">
              <img src="https://picsum.photos/seed/map/800/1200" className="w-full h-full object-cover grayscale" alt="Map" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            
            <div className="absolute inset-0 p-8 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 transition-colors duration-500">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Tracking</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 transition-colors duration-500">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">Last Update</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/80">Left the distribution center</p>
                      <p className="text-[10px] font-black text-white/40 uppercase mt-1">12 minutes ago</p>
                    </div>
                  </div>
                </div>
                <NexusButton 
                  className="w-full bg-white text-slate-900 hover:bg-white/90 font-black uppercase tracking-widest h-14"
                  onClick={() => setIsMapFullScreen(true)}
                >
                  Open Full Screen Map
                </NexusButton>
              </div>
            </div>
          </NexusCard>

          <NexusCard className="bg-indigo-600 border-none p-8 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-white" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Nexus AI Logistics</h3>
              </div>
              <p className="text-sm font-bold text-white leading-relaxed">
                "Your order ORD-2024-001 is 2 hours ahead of schedule thanks to route optimization via Agentforce."
              </p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </NexusCard>
        </div>
      </div>
    </div>
  );

  const renderQuotations = () => {
    const filteredQuotes = quotes.filter(q => quoteFilter === 'All' || q.status === quoteFilter);

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight transition-colors duration-500">Quotes & Contracts</h2>
          <div className="flex gap-2">
            {['All', 'Accepted', 'Sent', 'Draft'].map(f => (
              <button 
                key={f}
                onClick={() => setQuoteFilter(f as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border-2",
                  quoteFilter === f 
                    ? "bg-slate-900 border-slate-900 text-white" 
                    : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {filteredQuotes.map(quote => (
            <NexusCard key={quote.id} className="p-6 hover:shadow-2xl transition-all duration-500 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">{quote.id}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{quote.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Probability</div>
                    <div className="text-base font-black text-indigo-600">{quote.probability}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-slate-900">${quote.total}</div>
                    <NexusBadge variant={quote.status === 'Accepted' ? 'success' : quote.status === 'Sent' ? 'warning' : 'secondary'}>
                      {quote.status}
                    </NexusBadge>
                  </div>
                  <div className="flex gap-2">
                    <NexusButton 
                      variant="outline" 
                      size="sm" 
                      className="hover:bg-indigo-600 hover:text-white transition-all h-10 text-[10px]"
                      onClick={() => {
                        // Ensure quote has products for the demo
                        const quoteWithProducts = {
                          ...quote,
                          versions: quote.versions.map(v => ({
                            ...v,
                            products: v.products.length > 0 ? v.products : cart.length > 0 ? cart : [
                              { product: { name: 'Nexus Industrial Sensor X1', family: 'Hardware', price: 1500, image: 'https://picsum.photos/seed/sensor/100/100' }, quantity: 5 }
                            ]
                          }))
                        };
                        setSelectedQuote(quoteWithProducts as Quote);
                      }}
                    >
                      View & Negotiate
                    </NexusButton>
                    <NexusButton 
                      variant="outline" 
                      size="sm" 
                      className="hover:bg-indigo-600 hover:text-white transition-all h-10 text-[10px]"
                      onClick={() => {
                        alert(`Downloading quote ${quote.id} in progress...`);
                      }}
                    >
                      PDF
                    </NexusButton>
                  </div>
                </div>
              </div>
            </NexusCard>
          ))}
        </div>
      </div>
    );
  };

  const renderCart = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight transition-colors duration-500">My Cart</h2>
          <NexusBadge variant="primary" className="px-3 py-0.5 text-[9px] font-black uppercase">
            {cart.reduce((acc, item) => acc + item.quantity, 0)} Items
          </NexusBadge>
        </div>
        
        {cart.length === 0 ? (
          <NexusCard className="text-center py-12 bg-white/50 border-dashed border-2 rounded-2xl transition-colors duration-500">
            <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-4 transition-colors duration-500" />
            <p className="text-lg font-black text-slate-400 uppercase italic transition-colors duration-500">Your cart is empty</p>
            <NexusButton variant="outline" className="mt-6 h-10 px-6 text-[10px] font-black uppercase tracking-widest" onClick={() => setActiveTab('catalog')}>
              Browse Catalog
            </NexusButton>
          </NexusCard>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 nexus-scrollbar">
            {cart.map((item) => (
              <NexusCard key={item.product.id} padding="none" className="group overflow-hidden hover:shadow-xl transition-all duration-500 border-none bg-white ring-1 ring-slate-100 rounded-2xl">
                <div className="flex items-center p-3 gap-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 relative transition-colors duration-500">
                    <img src={item.product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.product.name} />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-0.5">
                      <div>
                        <div className="text-[7px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-0.5 transition-colors duration-500">{item.product.family}</div>
                        <h4 className="text-base font-black text-slate-900 tracking-tight transition-colors duration-500">{item.product.name}</h4>
                      </div>
                      <button 
                        onClick={() => onRemoveFromCart(item.product.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-0.5 border border-slate-100 transition-colors duration-500">
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm hover:bg-slate-900 hover:text-white transition-all"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-xs font-black w-5 text-center text-slate-900 transition-colors duration-500">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm hover:bg-slate-900 hover:text-white transition-all"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <div className="text-lg font-black text-slate-900 italic transition-colors duration-500">${item.product.price * item.quantity}</div>
                    </div>
                  </div>
                </div>
              </NexusCard>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-4 space-y-6">
        <NexusCard title="Summary" padding="lg" className="border-none shadow-2xl ring-1 ring-slate-100 rounded-[2.5rem]">
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-slate-500 text-sm font-bold transition-colors duration-500">
              <span>Subtotal</span>
              <span className="font-black text-slate-900 transition-colors duration-500">${cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-sm font-bold transition-colors duration-500">
              <span>Shipping</span>
              <span className="text-emerald-600 font-black transition-colors duration-500">Free</span>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-end transition-colors duration-500">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 transition-colors duration-500">Total to pay</span>
                <span className="text-xs font-black text-slate-900 uppercase transition-colors duration-500">VAT included</span>
              </div>
              <span className="text-4xl font-black text-emerald-600 tracking-tight transition-colors duration-500">${cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <NexusButton className="w-full py-5 text-sm font-black uppercase tracking-widest h-16 bg-slate-900 shadow-xl shadow-slate-200">
              Place Order
            </NexusButton>
            
            <div className="pt-4 border-t border-slate-100">
              <NexusButton 
                variant="outline" 
                className="w-full py-5 text-[10px] font-black uppercase tracking-widest border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white h-16 transition-all"
                onClick={() => setShowB2BForm(true)}
              >
                Request Formal Quote
              </NexusButton>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure SSL Payment
          </div>
        </NexusCard>

        <div className="p-8 bg-slate-950 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
              <Truck className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="text-xl font-black mb-2 tracking-tight uppercase italic">Express Delivery</h4>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">Order in the next 2h for same-day shipping.</p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-600/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );

  const renderFavorites = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">My Favorites</h2>
        <NexusBadge variant="primary">{favorites.length} Items</NexusBadge>
      </div>
      
      {favorites.length === 0 ? (
        <NexusCard className="text-center py-16 bg-white/50 border-dashed border-2 rounded-2xl">
          <Heart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-lg font-black text-slate-400">You don't have any favorites yet.</p>
          <NexusButton variant="outline" className="mt-6 h-10 px-6 text-[10px] font-black uppercase tracking-widest" onClick={() => setActiveTab('catalog')}>
            Browse Catalog
          </NexusButton>
        </NexusCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <ProductCard 
                product={product} 
                onAddToCart={onAddToCart} 
                onToggleFavorite={onToggleFavorite}
                isFavorited={true}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Rare Item Alert Notification */}
      <AnimatePresence>
        {showRareItemAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-12 right-12 z-[110] w-96"
          >
            <NexusCard className="bg-slate-900 border-rose-500/50 border-2 p-6 shadow-2xl shadow-rose-500/20 overflow-hidden relative">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center animate-pulse">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tighter">Rare Item Alert!</h4>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Critical Scarcity Detected</p>
                  </div>
                  <button 
                    onClick={() => setShowRareItemAlert(false)}
                    className="ml-auto text-white/40 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm font-bold text-white/80 mb-6">
                  "Nexus Quantum Core X-1" : Only <span className="text-rose-500 underline">1 unit left</span>. 3 Deal Rooms are in active competition.
                </p>
                <div className="flex gap-3">
                  <NexusButton 
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest h-12 text-[10px]"
                    onClick={() => {
                      setActiveTab('war-room');
                      setShowRareItemAlert(false);
                    }}
                  >
                    Enter War Room
                  </NexusButton>
                  <NexusButton 
                    variant="outline"
                    className="flex-1 border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest h-12 text-[10px]"
                    onClick={() => setShowRareItemAlert(false)}
                  >
                    Ignore
                  </NexusButton>
                </div>
              </div>
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl" />
            </NexusCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-96 flex-shrink-0 border-r border-slate-200 bg-white">
        <PortalSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          notificationsCount={cart.length} 
        />
      </div>

      <main className="flex-grow p-8 overflow-y-auto relative">
        <div className="fixed top-6 right-4 z-[50] flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 transition-all"
            >
              <Bell className="w-6 h-6" />
              {notificationsList.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {notificationsList.length}
                </span>
              )}
            </button>
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[60]"
                >
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Notifications</h4>
                    <button onClick={() => setNotificationsList([])} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Clear All</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                    {notificationsList.length === 0 ? (
                      <div className="p-12 text-center text-slate-300">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">No notifications</p>
                      </div>
                    ) : (
                      notificationsList.map(n => (
                        <div key={n.id} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group">
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="text-xs font-black text-slate-900 uppercase italic">{n.title}</h5>
                            <span className="text-[8px] font-black text-slate-400 uppercase">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Subtle Engagement Banner */}
      <AnimatePresence>
        {activeBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-8 left-1/2 z-[150] w-full max-w-md"
          >
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                activeBanner.type === 'offer' ? "bg-emerald-100 text-emerald-600" :
                activeBanner.type === 'product' ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"
              )}>
                {activeBanner.type === 'offer' ? <TrendingUp className="w-5 h-5" /> :
                 activeBanner.type === 'product' ? <Package className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{activeBanner.title}</h5>
                <p className="text-xs font-bold text-slate-900">{activeBanner.message}</p>
              </div>
              <button onClick={() => setActiveBanner(null)} className="text-slate-300 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Map Modal */}
      <AnimatePresence>
        {isMapFullScreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-slate-900"
          >
            <div className="absolute top-8 right-8 z-10">
              <button 
                onClick={() => setIsMapFullScreen(false)}
                className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-2xl hover:scale-110 transition-transform"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="w-full h-full relative">
              <img src="https://picsum.photos/seed/fullmap/1920/1080" className="w-full h-full object-cover" alt="Full Map" />
              <div className="absolute inset-0 bg-indigo-900/10 pointer-events-none" />
              <div className="absolute bottom-12 left-12 bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20 text-white max-w-md">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase italic tracking-tight">ORD-2024-001</h4>
                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Live Tracking Active</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm font-bold">Speed : 85 km/h</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    <span className="text-sm font-bold">Destination : Paris, France</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote Detail Modal */}
      <AnimatePresence>
        {selectedQuote && (
          <NexusQuoteNegotiator 
            quote={selectedQuote}
            onClose={() => setSelectedQuote(null)}
            onSendMessage={(text) => handleSendMessage(selectedQuote.id, text)}
            onSignContract={() => handleSignContract(selectedQuote.id)}
            onDownloadPDF={() => alert(`Downloading quote ${selectedQuote.id} in progress...`)}
          />
        )}
      </AnimatePresence>

      {/* Quote Generation Modal */}
      <AnimatePresence>
        {(isRequestingQuote || quoteResult) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                {isRequestingQuote ? (
                  <div className="text-center py-12">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                      <RefreshCw className="w-full h-full text-indigo-600 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-indigo-600" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Salesforce Flow Active</h3>
                    <p className="text-slate-500 font-bold text-sm">Generating Quote Object & PDF...</p>
                    <div className="mt-8 space-y-2">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 3 }}
                          className="h-full bg-indigo-600"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Applying Discounts</span>
                        <span>Calculating Probability</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Check className="w-8 h-8" />
                      </div>
                      <button onClick={() => setQuoteResult(null)} className="text-slate-300 hover:text-slate-900">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Quote Generated</h3>
                      <p className="text-slate-500 font-bold mt-1">A formal PDF has been emailed to your account.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Discount Applied</div>
                        <div className="text-2xl font-black text-emerald-600">{quoteResult?.discount}% Bulk</div>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Terms</div>
                        <div className="text-2xl font-black text-slate-900">{quoteResult?.terms}</div>
                      </div>
                    </div>

                    <div className="p-6 bg-indigo-900 rounded-3xl text-white relative overflow-hidden">
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Agentforce Prediction</span>
                          </div>
                          <div className="text-sm font-bold">Acceptance Probability</div>
                        </div>
                        <div className="text-4xl font-black">{quoteResult?.probability}%</div>
                      </div>
                      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl" />
                    </div>

                    <NexusButton className="w-full py-4" onClick={() => setQuoteResult(null)}>
                      Done
                    </NexusButton>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Activity History Drawer */}
      <AnimatePresence>
        {showAllActivity && (
          <div className="fixed inset-0 z-[500] flex justify-end bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">History</h3>
                    <p className="text-slate-400 font-bold text-[8px] uppercase tracking-widest">All your interactions</p>
                  </div>
                </div>
                <button onClick={() => setShowAllActivity(false)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto nexus-scrollbar divide-y divide-slate-50">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">
                        #{activity.id}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{activity.title}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 uppercase font-black tracking-widest">{activity.time} • {activity.client}</div>
                      </div>
                    </div>
                    <NexusBadge variant={activity.type as any} className="text-[8px]">{activity.status}</NexusBadge>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-50">
                <NexusButton className="w-full h-12 rounded-xl text-xs" onClick={() => setShowAllActivity(false)}>Close Panel</NexusButton>
              </div>
            </motion.div>
            <button 
              className="absolute inset-0 -z-10 cursor-default" 
              onClick={() => setShowAllActivity(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Offer Detail Drawer */}
      <AnimatePresence>
        {selectedOffer && (
          <div className="fixed inset-0 z-[500] flex justify-end bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="relative h-60 flex-shrink-0">
                <img src={selectedOffer.image} className="w-full h-full object-cover" alt={selectedOffer.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                <button 
                  onClick={() => setSelectedOffer(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/40 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto nexus-scrollbar p-6 -mt-12 relative z-10">
                <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-50">
                  <div className="flex items-center gap-2 mb-4">
                    <NexusBadge variant="primary" className="text-[8px]">{selectedOffer.category}</NexusBadge>
                    <div className="flex items-center gap-1.5 text-indigo-600">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">AI Recommendation</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-3 leading-none">{selectedOffer.name}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                    {selectedOffer.reason}. This product was selected by our predictive algorithm because it perfectly complements your current assets.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3 mb-8">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Special Price</div>
                        <div className="text-2xl font-black text-indigo-600">{selectedOffer.price}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Availability</div>
                        <div className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Limited
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <NexusButton className="w-full h-14 rounded-xl bg-indigo-600 shadow-xl shadow-indigo-200 text-xs">Add to Cart</NexusButton>
                    <NexusButton variant="outline" className="w-full h-14 rounded-xl border-2 text-xs" onClick={() => setSelectedOffer(null)}>Later</NexusButton>
                  </div>
                </div>
              </div>
            </motion.div>
            <button 
              className="absolute inset-0 -z-10 cursor-default" 
              onClick={() => setSelectedOffer(null)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Floating AI Copilot */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
        <AnimatePresence>
          {isCopilotOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-96 bg-white rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-slate-200 flex flex-col h-[500px]"
            >
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black tracking-tight">Nexus AI</h4>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Copilot Actif</p>
                  </div>
                </div>
                <button onClick={() => setIsCopilotOpen(false)} className="text-white/50 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 nexus-scrollbar">
                {copilotMessages.map(msg => (
                  <div key={msg.id} className={cn("flex", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      "max-w-[85%] p-5 rounded-[2rem] text-sm font-medium leading-relaxed",
                      msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-900 rounded-tl-none'
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <input 
                    value={copilotInput}
                    onChange={(e) => setCopilotInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && copilotInput.trim()) {
                        setCopilotMessages([...copilotMessages, { id: Date.now(), sender: 'user', text: copilotInput }]);
                        setCopilotInput('');
                        setTimeout(() => {
                          setCopilotMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: "J'analyse votre demande. Je traite les données de votre compte..." }]);
                        }, 1000);
                      }
                    }}
                    placeholder="Posez une question à Nexus AI..."
                    className="w-full pl-6 pr-14 py-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-slate-900/40 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
          <Bot className="w-10 h-10 group-hover:animate-bounce" />
          {!isCopilotOpen && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full animate-ping" />
          )}
        </motion.button>
      </div>

      {/* B2B Quote Form Overlay */}
      <AnimatePresence>
        {showB2BForm && (
          <B2BQuoteForm 
            product={cart.length > 0 ? cart[0].product : undefined} 
            onClose={() => setShowB2BForm(false)} 
            onSubmit={(data) => {
              console.log('Bulk Quote Request Submitted:', data);
              setShowB2BForm(false);
              // Show success state or similar
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
