import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Users, Target, CheckCircle2, MoreHorizontal, 
  Search, Filter, LayoutDashboard, UserCircle, BarChart3, 
  FileText, ShoppingBag, LifeBuoy, Package, Clock, 
  ArrowUpRight, Building2, Mail, Phone, MapPin, 
  ChevronRight, AlertCircle, ShieldCheck, Zap,
  Image as ImageIcon, Upload, Check, ExternalLink,
  UserPlus, Briefcase, DollarSign, PieChart, LogOut,
  Sparkles, Bot, MessageSquare, Bell, ArrowDownRight,
  RefreshCw, Layers, Box, Plus, AlertTriangle, BrainCircuit
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NexusCard } from './ui/NexusCard';
import { NexusButton } from './ui/NexusButton';
import { NexusBadge } from './ui/NexusBadge';
import { NexusInput } from './ui/NexusInput';

type AdminSection = 'overview' | 'leads' | 'contacts' | 'pipeline' | 'orders' | 'cases' | 'catalogue' | 'contracts';

interface AdminDashboardProps {
  onConvertLead?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onConvertLead }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiSummarySent, setAiSummarySent] = useState(false);
  
  // Modal States
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [orderFilter, setOrderFilter] = useState('All');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: 1, sender: 'bot', text: 'Hello! How can I help you with this contact today?' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Mock Data States
  const [metrics, setMetrics] = useState({
    totalLeads: 1284,
    newLeadsThisMonth: 45,
    convertedLeads: 842,
    notConvertedLeads: 442,
    activeOpportunities: 156,
    totalPipelineValue: 1450000,
    revenueThisMonth: 285000,
    pendingQuotes: 24,
    openCases: 12,
    totalOrders: 342,
    unpaidWonOpps: 12500
  });

  const [leads, setLeads] = useState<any[]>([]);
  const [recentOpps, setRecentOpps] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
    };
    tick();
    const timer = setInterval(tick, 60000);

    // Simulate Data Fetching
    setTimeout(() => {
      setLeads([
        { id: '1', name: 'Alice Vasseur', company: 'TechFlow Inc.', email: 'alice@techflow.com', phone: '+33 6 12 34 56 78', status: 'New', score: 92, industry: 'Technology', createdDate: '2024-03-20', initials: 'AV', description: 'Intéressé par le capteur X1 pour sa nouvelle usine.' },
        { id: '2', name: 'Marc Durand', company: 'Logistics Pro', email: 'm.durand@logpro.fr', phone: '+33 6 98 76 54 32', status: 'Qualified', score: 78, industry: 'Logistics', createdDate: '2024-03-19', initials: 'MD', description: 'Besoin d\'une solution de tracking temps réel.' },
        { id: '3', name: 'Sophie Martin', company: 'Green Energy', email: 'sophie@green.com', phone: '+33 7 44 55 66 77', status: 'Working', score: 65, industry: 'Energy', createdDate: '2024-03-18', initials: 'SM', description: 'Demande de devis pour 500 unités.' },
        { id: '4', name: 'Jean Dupont', company: 'AutoPart', email: 'j.dupont@autopart.fr', phone: '+33 6 11 22 33 44', status: 'New', score: 45, industry: 'Automotive', createdDate: '2024-03-21', initials: 'JD', description: 'Recherche capteurs de pression.' },
      ]);

      setRecentOpps([
        { id: 'o1', name: 'TechFlow — Expansion Capteurs', account: 'TechFlow Inc.', stage: 'Qualification', amount: 45000, closeDate: '2024-05-15', status: 'Open' },
        { id: 'o2', name: 'Logistics Pro — Flotte IoT', account: 'Logistics Pro', stage: 'Closed Won', amount: 125000, closeDate: '2024-03-10', status: 'Won' },
        { id: 'o3', name: 'Green Energy — Solaire Connecté', account: 'Green Energy', stage: 'Negotiation', amount: 85000, closeDate: '2024-04-20', status: 'Open' },
        { id: 'o4', name: 'AutoPart — Prototype V3', account: 'AutoPart', stage: 'Prospecting', amount: 12000, closeDate: '2024-06-01', status: 'Open' },
      ]);

      setContacts([
        { id: 'c1', name: 'Alice Vasseur', account: 'TechFlow Inc.', email: 'alice@techflow.com', phone: '+33 6 12 34 56 78', title: 'CTO', department: 'Engineering', initials: 'AV' },
        { id: 'c2', name: 'Marc Durand', account: 'Logistics Pro', email: 'm.durand@logpro.fr', phone: '+33 6 98 76 54 32', title: 'Operations Manager', department: 'Logistics', initials: 'MD' },
      ]);

      setOrders([
        { id: 'ord1', number: 'ORD-2024-001', account: 'Logistics Pro', status: 'Shipped', amount: 125000, date: '2024-03-12' },
        { id: 'ord2', number: 'ORD-2024-002', account: 'TechFlow Inc.', status: 'Draft', amount: 4500, date: '2024-03-22' },
      ]);

      setCases([
        { id: 'cas1', number: '001245', subject: 'Problème calibration X1', account: 'TechFlow Inc.', contact: 'Alice Vasseur', status: 'New', priority: 'High', date: '2024-03-24', type: 'Technical', aiImportance: 'Critical', needsMeeting: true },
        { id: 'cas2', number: '001246', subject: 'Retard livraison ORD-001', account: 'Logistics Pro', contact: 'Marc Durand', status: 'Working', priority: 'Medium', date: '2024-03-23', type: 'Logistics', aiImportance: 'Medium', needsMeeting: false },
        { id: 'cas3', number: '001247', subject: 'Demande documentation API', account: 'Green Energy', contact: 'Sophie Martin', status: 'Closed', priority: 'Low', date: '2024-03-22', type: 'Inquiry', aiImportance: 'Low', needsMeeting: false },
      ]);

      setProducts([
        { id: 'p1', name: 'Nexus Industrial Sensor X1', family: 'Sensors', price: 299, stock: 12, capacity: 200, image: 'https://picsum.photos/seed/sensor1/400/300', status: 'Critical' },
        { id: 'p2', name: 'Nexus IoT Gateway Pro', family: 'Gateways', price: 899, stock: 180, capacity: 200, image: 'https://picsum.photos/seed/gateway/400/300', status: 'Overstock' },
        { id: 'p3', name: 'Smart Controller V2', family: 'Controllers', price: 549, stock: 82, capacity: 150, image: 'https://picsum.photos/seed/controller/400/300', status: 'Optimal' },
        { id: 'p4', name: 'Edge Node Mini', family: 'Nodes', price: 149, stock: 45, capacity: 100, image: 'https://picsum.photos/seed/node/400/300', status: 'Optimal' },
      ]);

      setLoading(false);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const NAV_ITEMS = [
    { id: 'overview', icon: LayoutDashboard, label: "Dashboard" },
    { id: 'leads', icon: Users, label: 'Leads', badge: leads.length },
    { id: 'contacts', icon: UserCircle, label: 'Contacts' },
    { id: 'pipeline', icon: BarChart3, label: 'Pipeline' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'cases', icon: LifeBuoy, label: 'Support', badge: metrics.openCases },
    { id: 'contracts', icon: FileText, label: 'Contracts' },
    { id: 'catalogue', icon: Package, label: 'Catalogue' }
  ];

  const formatMoney = (v: number) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1) + ' M€';
    if (v >= 1000) return (v / 1000).toFixed(1) + ' K€';
    return v.toLocaleString('fr-FR') + ' €';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const renderOverview = () => (
    <div className="h-full flex flex-col p-8 gap-8 overflow-hidden bg-nexus-50/50">
      {/* KPI Row - Bento Style */}
      <div className="grid grid-cols-5 gap-6 flex-shrink-0">
        {[
          { label: 'Pipeline Value', value: formatMoney(metrics.totalPipelineValue), icon: TrendingUp, color: 'primary', trend: '+12%', trendUp: true },
          { label: 'Active Leads', value: metrics.totalLeads, icon: Users, color: 'primary', trend: '+5%', trendUp: true },
          { label: 'Monthly Revenue', value: formatMoney(metrics.revenueThisMonth), icon: DollarSign, color: 'success', trend: '+18%', trendUp: true },
          { label: 'Open Cases', value: metrics.openCases, icon: LifeBuoy, color: 'danger', trend: '-2', trendUp: false },
          { label: 'Win Rate', value: '68%', icon: Target, color: 'warning', trend: '+3%', trendUp: true },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <NexusCard padding="sm" className="flex flex-col justify-center border-none shadow-sm bg-white ring-1 ring-nexus-200/50 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  kpi.color === 'primary' ? "bg-accent-primary/10 text-accent-primary group-hover:bg-accent-primary group-hover:text-white" :
                  kpi.color === 'success' ? "bg-accent-success/10 text-accent-success group-hover:bg-accent-success group-hover:text-white" :
                  kpi.color === 'danger' ? "bg-accent-danger/10 text-accent-danger group-hover:bg-accent-danger group-hover:text-white" :
                  "bg-accent-warning/10 text-accent-warning group-hover:bg-accent-warning group-hover:text-white"
                )}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                  kpi.trendUp ? "bg-accent-success/10 text-accent-success" : "bg-accent-danger/10 text-accent-danger"
                )}>
                  {kpi.trendUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {kpi.trend}
                </div>
              </div>
              <div className="text-2xl font-black text-nexus-900 tracking-tighter font-display relative z-10">{kpi.value}</div>
              <div className="text-[10px] font-black text-nexus-400 uppercase tracking-widest mt-1 relative z-10">{kpi.label}</div>
              
              {/* Subtle background pattern */}
              <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <kpi.icon className="w-24 h-24 rotate-12" />
              </div>
            </NexusCard>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
        {/* Left Column: Pipeline & AI */}
        <div className="col-span-8 flex flex-col gap-8 min-h-0">
          <div className="grid grid-cols-2 gap-8 flex-shrink-0">
            <NexusCard className="h-72 border-none shadow-sm bg-white ring-1 ring-nexus-200/50 flex flex-col p-0 overflow-hidden">
              <div className="p-6 border-b border-nexus-50 flex items-center justify-between">
                <h3 className="text-xs font-black text-nexus-900 uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-accent-primary" />
                  Pipeline Velocity
                </h3>
                <div className="text-[10px] font-bold text-nexus-400 uppercase">Q1 2024</div>
              </div>
              <div className="flex-1 p-6 flex flex-col justify-between min-h-0 overflow-y-auto nexus-scrollbar">
                {[
                  { label: 'Prospecting', amount: 120000, color: 'var(--color-accent-primary)', count: 12 },
                  { label: 'Qualification', amount: 245000, color: 'var(--color-accent-secondary)', count: 8 },
                  { label: 'Negotiation', amount: 310000, color: '#a78bfa', count: 5 },
                  { label: 'Closed Won', amount: 450000, color: 'var(--color-accent-success)', count: 15 },
                ].map((stage, i) => (
                  <div key={i} className="space-y-2 mb-4 last:mb-0">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[9px] font-black text-nexus-400 uppercase tracking-widest block">{stage.label}</span>
                        <span className="text-xs font-black text-nexus-900">{stage.count} Deals</span>
                      </div>
                      <span className="text-xs font-black text-nexus-900">{formatMoney(stage.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-nexus-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(stage.amount / 500000) * 100}%` }}
                        className="h-full rounded-full shadow-sm"
                        style={{ backgroundColor: stage.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </NexusCard>
            
            {/* Agentforce AI Insights */}
            <NexusCard className="h-72 bg-nexus-950 border-none relative overflow-hidden group flex flex-col p-0">
              <div className="absolute top-0 right-0 p-6">
                <Sparkles className="w-8 h-8 text-accent-primary/20 group-hover:text-accent-primary/40 transition-colors animate-pulse" />
              </div>
              <div className="relative z-10 h-full flex flex-col">
                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent-primary/20 flex items-center justify-center border border-accent-primary/30 shadow-lg shadow-accent-primary/10">
                    <Bot className="w-6 h-6 text-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Nexus AI Intelligence</h3>
                    <div className="text-[9px] text-accent-primary font-bold uppercase tracking-tighter">Predictive Engine Active</div>
                  </div>
                </div>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto nexus-scrollbar">
                  <motion.div 
                    whileHover={{ x: 4 }}
                    className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group/item"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-3.5 h-3.5 text-accent-primary" />
                      <div className="text-[9px] font-black text-accent-primary uppercase tracking-widest">Stock Optimization</div>
                    </div>
                    <p className="text-[11px] text-nexus-300 leading-relaxed">
                      Predictive analysis suggests a <span className="text-accent-danger font-bold">40% stockout risk</span> for Sensor X1 in Region A.
                    </p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ x: 4 }}
                    className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group/item"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-3.5 h-3.5 text-accent-success" />
                      <div className="text-[9px] font-black text-accent-success uppercase tracking-widest">Sales Acceleration</div>
                    </div>
                    <p className="text-[11px] text-nexus-300 leading-relaxed">
                      Lead "Alice Vasseur" has a <span className="text-accent-success font-bold">92% conversion probability</span>.
                    </p>
                  </motion.div>
                </div>
                <div className="p-6 pt-0">
                  <NexusButton 
                    size="sm" 
                    className="w-full bg-accent-primary hover:bg-accent-primary/90 text-white border-none text-[10px] font-black uppercase tracking-widest h-10 shadow-xl shadow-accent-primary/20 flex-shrink-0"
                    onClick={() => {
                      setAiSummarySent(true);
                      setTimeout(() => setAiSummarySent(false), 3000);
                    }}
                  >
                    {aiSummarySent ? <Check className="w-4 h-4 mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
                    {aiSummarySent ? "Summary Sent" : "Notify Sales Agents"}
                  </NexusButton>
                </div>
              </div>
              {/* Decorative background element */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent-primary/10 rounded-full blur-[100px]" />
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-accent-secondary/10 rounded-full blur-[100px]" />
            </NexusCard>
          </div>

          {/* Bottom Row: Live Monitoring */}
          <NexusCard className="flex-1 border-none shadow-sm bg-white ring-1 ring-nexus-200/50 flex flex-col min-h-0 p-0 overflow-hidden">
            <div className="p-6 border-b border-nexus-50 flex items-center justify-between">
              <h3 className="text-xs font-black text-nexus-900 uppercase tracking-widest flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-accent-success animate-spin-slow" />
                Live Pipeline Monitoring
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
                  <span className="text-[10px] font-bold text-nexus-400 uppercase">Real-time</span>
                </div>
                <NexusButton variant="outline" size="sm" className="h-8 px-3 text-[9px] font-black uppercase tracking-widest border-nexus-200">Export</NexusButton>
              </div>
            </div>
            <div className="flex-1 overflow-auto nexus-scrollbar p-6 pt-0">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-[9px] font-black text-nexus-400 uppercase tracking-widest border-b border-nexus-50">
                    <th className="py-4">Account</th>
                    <th className="py-4">Stage</th>
                    <th className="py-4">Amount</th>
                    <th className="py-4">Close Date</th>
                    <th className="py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-50">
                  {recentOpps.map(opp => (
                    <tr key={opp.id} className="group hover:bg-nexus-50/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-nexus-50 flex items-center justify-center text-nexus-400 group-hover:bg-accent-primary/10 group-hover:text-accent-primary transition-colors">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-nexus-900">{opp.account}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-[10px] font-black text-nexus-600 uppercase tracking-widest bg-nexus-100 px-2 py-1 rounded-md">{opp.stage}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-black text-nexus-900">{formatMoney(opp.amount)}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2 text-[10px] text-nexus-400 font-bold uppercase">
                          <Clock className="w-3 h-3" />
                          {opp.closeDate}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <NexusBadge variant={opp.status === 'Won' ? 'success' : 'primary'} className="text-[9px] font-black uppercase px-2 py-0.5">
                          {opp.status}
                        </NexusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NexusCard>
        </div>

        {/* Right Column: Recent Activity & Leads */}
        <div className="col-span-4 flex flex-col gap-8 min-h-0">
          <NexusCard className="flex-1 border-none shadow-sm bg-white ring-1 ring-nexus-200/50 flex flex-col min-h-0 p-0 overflow-hidden">
            <div className="p-6 border-b border-nexus-50 flex items-center justify-between">
              <h3 className="text-xs font-black text-nexus-900 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent-primary" />
                Recent Activity
              </h3>
              <NexusButton variant="outline" size="sm" className="h-8 px-3 text-[9px] font-black uppercase tracking-widest border-nexus-200">View All</NexusButton>
            </div>
            <div className="flex-1 overflow-y-auto nexus-scrollbar p-6">
              <div className="space-y-6">
                {[
                  { user: 'Marc Durand', action: 'converted a lead', target: 'Logistics Pro', time: '2h ago', icon: UserPlus, color: 'accent-success' },
                  { user: 'Alice Vasseur', action: 'updated opportunity', target: 'TechFlow Expansion', time: '4h ago', icon: RefreshCw, color: 'accent-primary' },
                  { user: 'System', action: 'generated monthly report', target: 'March 2024', time: '6h ago', icon: FileText, color: 'accent-secondary' },
                  { user: 'Sophie Martin', action: 'closed deal', target: 'Green Energy', time: '1d ago', icon: CheckCircle2, color: 'accent-success' },
                ].map((activity, i) => (
                  <div key={i} className="flex gap-4 group cursor-pointer">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110", 
                      activity.color === 'accent-success' ? "bg-accent-success/10 text-accent-success" : 
                      activity.color === 'accent-primary' ? "bg-accent-primary/10 text-accent-primary" : 
                      "bg-accent-secondary/10 text-accent-secondary"
                    )}>
                      <activity.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-nexus-600 leading-snug">
                        <span className="font-black text-nexus-900">{activity.user}</span> {activity.action} <span className="font-black text-nexus-900">{activity.target}</span>
                      </p>
                      <p className="text-[10px] text-nexus-400 font-bold uppercase tracking-widest mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </NexusCard>

          <NexusCard className="h-80 border-none shadow-sm bg-white ring-1 ring-nexus-200/50 flex flex-col p-0 overflow-hidden">
            <div className="p-6 border-b border-nexus-50 flex items-center justify-between">
              <h3 className="text-xs font-black text-nexus-900 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4 text-accent-danger" />
                Top Opportunities
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto nexus-scrollbar p-6">
              <div className="space-y-4">
                {recentOpps.filter(o => o.status === 'Open').map((opp, i) => (
                  <div key={i} className="p-4 bg-nexus-50/50 rounded-2xl border border-nexus-100 hover:border-accent-primary/30 transition-colors group cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xs font-black text-nexus-900 group-hover:text-accent-primary transition-colors">{opp.name}</h4>
                      <ArrowUpRight className="w-3.5 h-3.5 text-nexus-300 group-hover:text-accent-primary transition-colors" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-accent-primary">{formatMoney(opp.amount)}</span>
                      <span className="text-[9px] font-black text-nexus-400 uppercase tracking-widest">{opp.stage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </NexusCard>
        </div>
      </div>
    </div>
  );

  const renderLeads = () => (
    <div className="h-full flex flex-col p-8 space-y-8 overflow-hidden bg-nexus-50/30">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <h3 className="text-2xl font-black text-nexus-900 tracking-tight font-display">Lead Management</h3>
          <NexusBadge variant="primary" className="px-4 py-1.5 font-black uppercase tracking-widest text-[10px] shadow-sm">
            {leads.length} Active Leads
          </NexusBadge>
        </div>
        <div className="flex gap-3">
          <NexusInput placeholder="Search leads..." className="w-72 h-10 text-xs bg-white border-nexus-200" />
          <NexusButton className="h-10 px-6 font-black uppercase tracking-widest text-[10px] bg-nexus-900 text-white shadow-lg shadow-nexus-200">
            <UserPlus className="w-4 h-4 mr-2" /> New Lead
          </NexusButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 nexus-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {leads.map((lead, i) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <NexusCard className="border-none bg-white shadow-sm ring-1 ring-nexus-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                <div className={cn("absolute top-0 left-0 w-full h-1", lead.score >= 80 ? "bg-accent-success" : lead.score >= 60 ? "bg-accent-warning" : "bg-accent-danger")} />
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-nexus-900 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-nexus-200 group-hover:bg-accent-primary transition-colors">
                      {lead.initials}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-nexus-900 group-hover:text-accent-primary transition-colors">{lead.name}</h4>
                      <p className="text-[10px] text-nexus-400 font-bold uppercase tracking-wider">{lead.company}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm ring-4 ring-offset-0", 
                      lead.score >= 80 ? "bg-accent-success ring-accent-success/20" : 
                      lead.score >= 60 ? "bg-accent-warning ring-accent-warning/20" : 
                      "bg-accent-danger ring-accent-danger/20"
                    )} />
                  </div>
                </div>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-nexus-400 uppercase tracking-widest">AI Lead Score</span>
                    <span className={cn("text-xs font-black", 
                      lead.score >= 80 ? "text-accent-success" : 
                      lead.score >= 60 ? "text-accent-warning" : 
                      "text-accent-danger"
                    )}>{lead.score}%</span>
                  </div>
                  <div className="h-2 bg-nexus-50 rounded-full overflow-hidden p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${lead.score}%` }}
                      className={cn("h-full rounded-full shadow-sm", 
                        lead.score >= 80 ? "bg-accent-success" : 
                        lead.score >= 60 ? "bg-accent-warning" : 
                        "bg-accent-danger"
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <NexusButton variant="outline" className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest border-nexus-200 hover:bg-nexus-50">View</NexusButton>
                  <NexusButton className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest bg-accent-primary hover:bg-accent-primary/90 text-white shadow-lg shadow-accent-primary/20" onClick={() => handleConvert(lead.id)}>Convert</NexusButton>
                </div>
              </NexusCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="h-full flex flex-col p-8 space-y-8 overflow-hidden bg-nexus-50/30 relative">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <h3 className="text-2xl font-black text-nexus-900 tracking-tight font-display">Contact Directory</h3>
          <NexusBadge variant="primary" className="px-4 py-1.5 font-black uppercase tracking-widest text-[10px] shadow-sm">
            {contacts.length} Total Contacts
          </NexusBadge>
        </div>
        <div className="flex gap-3">
          <NexusInput placeholder="Search contacts..." className="w-72 h-10 text-xs bg-white border-nexus-200" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 nexus-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {contacts.map((contact, i) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <NexusCard className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group border-none bg-white shadow-sm ring-1 ring-nexus-200/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent-primary to-accent-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-accent-primary to-accent-secondary text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-accent-primary/20 group-hover:scale-110 transition-transform duration-500">
                    {contact.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black text-nexus-900 truncate group-hover:text-accent-primary transition-colors">{contact.name}</h4>
                    <p className="text-[11px] text-nexus-400 font-bold uppercase tracking-widest">{contact.title}</p>
                  </div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-[11px] text-nexus-600 font-medium group/item cursor-pointer">
                    <div className="w-8 h-8 rounded-xl bg-nexus-50 flex items-center justify-center group-hover/item:bg-accent-primary/10 group-hover/item:text-accent-primary transition-colors">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="truncate">{contact.account}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-nexus-600 font-medium group/item cursor-pointer">
                    <div className="w-8 h-8 rounded-xl bg-nexus-50 flex items-center justify-center group-hover/item:bg-accent-primary/10 group-hover/item:text-accent-primary transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="truncate">{contact.email}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <NexusButton 
                    variant="outline" 
                    className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest border-nexus-200 hover:bg-nexus-50"
                    onClick={() => {
                      setSelectedContact(contact);
                      setShowProfileModal(true);
                    }}
                  >
                    Profile
                  </NexusButton>
                  <NexusButton 
                    className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest bg-nexus-900 hover:bg-nexus-800 text-white shadow-xl shadow-nexus-200"
                    onClick={() => {
                      setSelectedContact(contact);
                      setShowChatModal(true);
                    }}
                  >
                    Message
                  </NexusButton>
                </div>
              </NexusCard>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showProfileModal && selectedContact && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors"
                >
                  ×
                </button>
                <div className="absolute -bottom-12 left-8">
                  <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl">
                    <div className="w-full h-full rounded-2xl bg-indigo-50 text-white flex items-center justify-center font-black text-3xl">
                      {selectedContact.initials}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-16 pb-8 px-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-900">{selectedContact.name}</h2>
                  <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{selectedContact.title} @ {selectedContact.account}</p>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
                      <p className="text-sm font-bold text-slate-700">{selectedContact.email}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Phone Number</label>
                      <p className="text-sm font-bold text-slate-700">{selectedContact.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Department</label>
                      <p className="text-sm font-bold text-slate-700">{selectedContact.department}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Location</label>
                      <p className="text-sm font-bold text-slate-700">Paris, France</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <NexusButton className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest">Edit Profile</NexusButton>
                  <NexusButton variant="outline" className="flex-1 font-black uppercase tracking-widest">View Activity</NexusButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Contract Details Modal */}
        {showContractModal && selectedContract && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedContract.name}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contract Details • {selectedContract.id}</p>
                  </div>
                </div>
                <button onClick={() => setShowContractModal(false)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-3 gap-8 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                    <NexusBadge variant={selectedContract.status === 'Active' ? 'success' : 'primary'}>{selectedContract.status}</NexusBadge>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</div>
                    <div className="text-base font-black text-slate-900">{selectedContract.value}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expiry Date</div>
                    <div className="text-base font-black text-slate-900">{selectedContract.expiry}</div>
                  </div>
                </div>
                <div className="space-y-6 mb-8">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Key Terms & Conditions</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {['Auto-renewal enabled', 'Net 30 payment terms', 'SLA 99.9% uptime', '24/7 Premium Support'].map((term, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {term}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <NexusButton className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest h-12">Renew Contract</NexusButton>
                  <NexusButton variant="outline" className="flex-1 font-black uppercase tracking-widest h-12">Download PDF</NexusButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderDetailsModal && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Order {selectedOrder.number}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedOrder.account} • {selectedOrder.date}</p>
                  </div>
                </div>
                <button onClick={() => setShowOrderDetailsModal(false)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-3 gap-8 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                    <NexusBadge variant={selectedOrder.status === 'Shipped' ? 'success' : 'warning'}>{selectedOrder.status}</NexusBadge>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</div>
                    <div className="text-base font-black text-slate-900">{formatMoney(selectedOrder.amount)}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items</div>
                    <div className="text-base font-black text-slate-900">12 Items</div>
                  </div>
                </div>
                <div className="space-y-4 mb-8">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Order Timeline</h4>
                  <div className="space-y-4">
                    {[
                      { status: 'Order Placed', date: 'Mar 20, 2024', done: true },
                      { status: 'Payment Confirmed', date: 'Mar 20, 2024', done: true },
                      { status: 'Processing', date: 'Mar 21, 2024', done: true },
                      { status: 'Shipped', date: 'Mar 22, 2024', done: selectedOrder.status === 'Shipped' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", step.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>
                          {step.done ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-black text-slate-900">{step.status}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{step.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <NexusButton className="flex-1 bg-slate-900 text-white font-black uppercase tracking-widest h-12">Track Shipment</NexusButton>
                  <NexusButton variant="outline" className="flex-1 font-black uppercase tracking-widest h-12">Contact Support</NexusButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Invoice Modal */}
        {showInvoiceModal && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-12 bg-slate-50 border-b border-slate-200 flex justify-between items-start">
                <div>
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl">
                    <Zap className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Invoice</h2>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">INV-{selectedOrder.number.split('-')[2]}-2024</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-slate-900 mb-1">Nexus CRM Solutions</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    123 Innovation Drive<br />
                    75001 Paris, France<br />
                    contact@nexus-crm.com
                  </div>
                </div>
              </div>
              <div className="p-12">
                <div className="grid grid-cols-2 gap-12 mb-12">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Bill To</h4>
                    <div className="text-sm font-black text-slate-900 mb-1">{selectedOrder.account}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                      45 Business Avenue<br />
                      92100 Boulogne, France
                    </div>
                  </div>
                  <div className="text-right">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Invoice Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Date Issued</span>
                        <span className="text-slate-900">{selectedOrder.date}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Due Date</span>
                        <span className="text-slate-900">Apr 20, 2024</span>
                      </div>
                    </div>
                  </div>
                </div>
                <table className="w-full mb-12">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="pb-4 text-left">Description</th>
                      <th className="pb-4 text-center">Qty</th>
                      <th className="pb-4 text-right">Unit Price</th>
                      <th className="pb-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr className="text-xs font-bold text-slate-900">
                      <td className="py-6">Industrial IoT Sensor Pack X1</td>
                      <td className="py-6 text-center">12</td>
                      <td className="py-6 text-right">{formatMoney(selectedOrder.amount / 12)}</td>
                      <td className="py-6 text-right font-black">{formatMoney(selectedOrder.amount)}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex justify-end pt-8 border-t border-slate-100">
                  <div className="w-64 space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">Subtotal</span>
                      <span className="text-slate-900">{formatMoney(selectedOrder.amount)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">Tax (20%)</span>
                      <span className="text-slate-900">{formatMoney(selectedOrder.amount * 0.2)}</span>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-slate-900">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-900">Total Amount</span>
                      <span className="text-xl font-black text-indigo-600">{formatMoney(selectedOrder.amount * 1.2)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-12 flex gap-3">
                  <NexusButton className="flex-1 bg-slate-900 text-white font-black uppercase tracking-widest h-12">Download PDF</NexusButton>
                  <NexusButton variant="outline" className="flex-1 font-black uppercase tracking-widest h-12" onClick={() => setShowInvoiceModal(false)}>Close</NexusButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChatModal && selectedContact && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]"
            >
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center font-black">
                    {selectedContact.initials}
                  </div>
                  <div>
                    <div className="text-sm font-black">{selectedContact.name}</div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">Online</div>
                  </div>
                </div>
                <button onClick={() => setShowChatModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <LogOut className="w-5 h-5 rotate-90" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 custom-scrollbar">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={cn("flex", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-sm",
                      msg.sender === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <NexusInput 
                  placeholder="Type a message..." 
                  className="flex-1 h-10 text-xs"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newMessage.trim()) {
                      setChatMessages([...chatMessages, { id: Date.now(), sender: 'user', text: newMessage }]);
                      setNewMessage('');
                    }
                  }}
                />
                <NexusButton 
                  className="h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => {
                    if (newMessage.trim()) {
                      setChatMessages([...chatMessages, { id: Date.now(), sender: 'user', text: newMessage }]);
                      setNewMessage('');
                    }
                  }}
                >
                  <ArrowUpRight className="w-4 h-4" />
                </NexusButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderPipeline = () => (
    <div className="h-full flex flex-col p-8 space-y-8 overflow-hidden bg-slate-50/30">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sales Pipeline</h3>
          <div className="flex items-center gap-3 px-4 py-1.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">AI Optimized Flow</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex -space-x-2 mr-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                <img src={`https://picsum.photos/seed/user${i}/32/32`} alt="User" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">+4</div>
          </div>
          <NexusButton variant="outline" size="sm" className="h-10 px-6 font-black uppercase tracking-widest text-[10px] border-slate-200 bg-white">Filter</NexusButton>
        </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-x-auto pb-6 custom-scrollbar">
        {['Prospecting', 'Qualification', 'Negotiation', 'Closed Won'].map((stage, i) => (
          <div key={i} className="flex-shrink-0 w-80 flex flex-col gap-6">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-4 h-4 rounded-full shadow-lg ring-4", 
                  i === 3 ? "bg-emerald-500 ring-emerald-500/20" : "bg-indigo-500 ring-indigo-500/20"
                )} />
                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{stage}</span>
              </div>
              <NexusBadge variant="secondary" className="text-[10px] font-black px-3 py-1 bg-white shadow-sm border-none">
                {recentOpps.filter(o => o.stage === stage).length}
              </NexusBadge>
            </div>
            <div className="flex-1 bg-slate-200/30 rounded-[2.5rem] p-5 space-y-5 overflow-y-auto custom-scrollbar border border-slate-200/50 backdrop-blur-sm">
              {recentOpps.filter(o => o.stage === stage).map(opp => (
                <motion.div
                  key={opp.id}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <NexusCard padding="sm" className="cursor-move group border-none bg-white shadow-sm hover:shadow-2xl transition-all duration-300 ring-1 ring-slate-200/50">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-xs font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors pr-6">{opp.name}</h4>
                      <button className="p-1 hover:bg-slate-50 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-slate-300" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-bold uppercase mb-6">
                      <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      {opp.account}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="text-sm font-black text-slate-900 tracking-tight">{formatMoney(opp.amount)}</div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        <Clock className="w-3.5 h-3.5" /> {opp.closeDate}
                      </div>
                    </div>
                  </NexusCard>
                </motion.div>
              ))}
              {recentOpps.filter(o => o.stage === stage).length === 0 && (
                <div className="h-40 border-2 border-dashed border-slate-200/50 rounded-[2rem] flex flex-col items-center justify-center bg-white/30 backdrop-blur-sm">
                  <Layers className="w-8 h-8 text-slate-200 mb-2" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Active Deals</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOrders = () => {
    const filteredOrders = orders.filter(o => orderFilter === 'All' || o.status === orderFilter);

    return (
      <div className="h-full flex flex-col p-8 space-y-8 overflow-hidden bg-nexus-50/30">
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-6">
            <h3 className="text-2xl font-black text-nexus-900 tracking-tight font-display">Order Management</h3>
            <NexusBadge variant="primary" className="px-4 py-1.5 font-black uppercase tracking-widest text-[10px] shadow-sm">
              {filteredOrders.length} Orders
            </NexusBadge>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-white p-1 rounded-xl border border-nexus-200 shadow-sm">
              {['All', 'Shipped', 'Processing', 'Draft'].map(f => (
                <button
                  key={f}
                  onClick={() => setOrderFilter(f)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    orderFilter === f ? "bg-nexus-900 text-white shadow-lg" : "text-nexus-400 hover:text-nexus-600"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <NexusInput placeholder="Search orders..." className="w-64 h-10 text-xs bg-white border-nexus-200" />
            <NexusButton className="h-10 px-6 font-black uppercase tracking-widest text-[10px] bg-nexus-900 text-white shadow-lg shadow-nexus-200">
              <Plus className="w-4 h-4 mr-2" /> New Order
            </NexusButton>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 nexus-scrollbar">
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <NexusCard className="border-none bg-white shadow-sm ring-1 ring-nexus-200/50 hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-nexus-50 flex items-center justify-center text-nexus-900 font-black text-xs shadow-inner group-hover:bg-accent-primary/10 group-hover:text-accent-primary transition-colors">
                        #{order.number.split('-')[2]}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-nexus-900 group-hover:text-accent-primary transition-colors">{order.account}</h4>
                        <p className="text-[10px] text-nexus-400 font-bold uppercase tracking-widest mt-0.5">{order.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-12">
                      <div className="text-right">
                        <p className="text-[10px] text-nexus-400 font-black uppercase tracking-widest mb-1">Total Amount</p>
                        <p className="text-sm font-black text-nexus-900">{formatMoney(order.amount)}</p>
                      </div>
                      
                      <div className="w-32">
                        <p className="text-[10px] text-nexus-400 font-black uppercase tracking-widest mb-2">Status</p>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full shadow-sm", 
                            order.status === 'Shipped' ? "bg-accent-success" : 
                            order.status === 'Processing' ? "bg-accent-warning" : 
                            "bg-accent-primary"
                          )} />
                          <span className={cn("text-[10px] font-black uppercase tracking-widest",
                            order.status === 'Shipped' ? "text-accent-success" : 
                            order.status === 'Processing' ? "text-accent-warning" : 
                            "text-accent-primary"
                          )}>{order.status}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <NexusButton 
                          variant="outline" 
                          className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-nexus-200 hover:bg-nexus-50"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetailsModal(true);
                          }}
                        >
                          Details
                        </NexusButton>
                        <NexusButton 
                          className="h-9 px-4 text-[10px] font-black uppercase tracking-widest bg-nexus-900 text-white"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowInvoiceModal(true);
                          }}
                        >
                          Invoice
                        </NexusButton>
                      </div>
                    </div>
                  </div>
                </NexusCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };


  const renderCases = () => (
    <div className="h-full flex flex-col p-8 space-y-8 overflow-hidden bg-nexus-50/30">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <h3 className="text-2xl font-black text-nexus-900 tracking-tight font-display">Support & Cases</h3>
          <div className="flex items-center gap-3 px-4 py-1.5 bg-accent-danger text-white rounded-2xl shadow-lg shadow-accent-danger/20">
            <Bot className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">Nexus AI Monitoring</span>
          </div>
        </div>
        <div className="flex gap-3">
          <NexusButton variant="outline" size="sm" className="h-10 px-6 font-black uppercase tracking-widest text-[10px] border-nexus-200 bg-white">Filter by Urgency</NexusButton>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* Cases List */}
        <div className="col-span-8 overflow-y-auto pr-4 nexus-scrollbar space-y-6">
          {cases.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <NexusCard padding="sm" className="hover:shadow-2xl transition-all group border-none bg-white shadow-sm ring-1 ring-nexus-200/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-accent-danger" />
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-nexus-900 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-nexus-200 group-hover:bg-accent-danger transition-colors">
                      #{c.number}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-nexus-900 tracking-tight group-hover:text-accent-danger transition-colors">{c.subject}</h4>
                      <p className="text-[11px] text-nexus-400 font-bold uppercase tracking-wider">{c.account} • {c.contact}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <NexusBadge variant={c.priority === 'High' ? 'danger' : 'warning'} className="text-[9px] font-black uppercase px-3 py-1">
                      {c.priority} Priority
                    </NexusBadge>
                    {c.needsMeeting && (
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-accent-primary bg-accent-primary/5 px-3 py-1 rounded-full border border-accent-primary/10">
                        <Clock className="w-4 h-4" /> Meeting Needed
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-nexus-50/50 rounded-2xl border border-nexus-100 mb-6 relative group/ai">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-accent-primary animate-pulse" />
                    <span className="text-[10px] font-black text-accent-primary uppercase tracking-widest">Nexus AI Analysis</span>
                  </div>
                  <p className="text-xs text-nexus-600 leading-relaxed italic font-medium">
                    "Customer is reporting persistent calibration issues. Sentiment analysis indicates frustration. AI recommends scheduling a technical deep-dive within 24 hours."
                  </p>
                  <div className="absolute top-4 right-4 opacity-0 group-hover/ai:opacity-100 transition-opacity">
                    <NexusBadge variant="primary" className="text-[8px]">Confidence 98%</NexusBadge>
                  </div>
                </div>

                <div className="flex gap-3">
                  <NexusButton variant="outline" className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest border-nexus-200 hover:bg-nexus-50">View History</NexusButton>
                  {c.needsMeeting && (
                    <NexusButton className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest bg-accent-primary hover:bg-accent-primary/90 text-white shadow-lg shadow-accent-primary/20">
                      Schedule Meeting
                    </NexusButton>
                  )}
                </div>
              </NexusCard>
            </motion.div>
          ))}
        </div>

        {/* AI Support Insights */}
        <div className="col-span-4 flex flex-col gap-6">
          <NexusCard className="bg-nexus-950 border-none text-white relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-accent-primary/20 flex items-center justify-center border border-accent-primary/30 shadow-lg shadow-accent-primary/10">
                  <Sparkles className="w-6 h-6 text-accent-primary" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest">AI Support Summary</h4>
              </div>
              <div className="space-y-8">
                <div>
                  <div className="text-[10px] font-black text-accent-primary uppercase tracking-widest mb-2">Global Support Health</div>
                  <div className="flex items-end gap-3">
                    <div className="text-4xl font-black tracking-tighter">94%</div>
                    <div className="text-[11px] text-accent-success font-bold mb-1.5 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> 2% vs Last Week
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="text-[10px] font-black text-accent-warning uppercase tracking-widest mb-2">Urgent Action Required</div>
                    <p className="text-[11px] text-nexus-300 leading-relaxed">
                      3 high-priority cases detected in TechFlow account. AI suggests consolidating into a single major incident.
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="text-[10px] font-black text-accent-success uppercase tracking-widest mb-2">Proactive Resolution</div>
                    <p className="text-[11px] text-nexus-300 leading-relaxed">
                      AI Agent has already drafted 5 responses for common inquiries today, saving 2.5 hours of manual work.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent-primary/10 rounded-full blur-[100px]" />
          </NexusCard>

          <NexusCard title="Communication Trends" className="flex-1 border-none shadow-sm bg-white ring-1 ring-nexus-200/50">
            <div className="space-y-6 mt-4">
              {[
                { label: 'Chat Volume', value: 'High', color: 'accent-danger', icon: MessageSquare },
                { label: 'Email Volume', value: 'Normal', color: 'accent-success', icon: Mail },
                { label: 'Meeting Requests', value: 'Increasing', color: 'accent-warning', icon: Clock },
              ].map((trend, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors", 
                      trend.color === 'accent-danger' ? "bg-accent-danger/10 text-accent-danger" :
                      trend.color === 'accent-success' ? "bg-accent-success/10 text-accent-success" :
                      "bg-accent-warning/10 text-accent-warning"
                    )}>
                      <trend.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-black text-nexus-400 uppercase tracking-widest">{trend.label}</span>
                  </div>
                  <NexusBadge variant={trend.color === 'accent-danger' ? 'danger' : trend.color === 'accent-warning' ? 'warning' : 'success'} className="text-[9px] font-black uppercase px-3 py-1">
                    {trend.value}
                  </NexusBadge>
                </div>
              ))}
            </div>
          </NexusCard>
        </div>
      </div>
    </div>
  );

  const renderContracts = () => (
    <div className="h-full flex flex-col p-8 space-y-8 overflow-hidden bg-slate-50/30">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Contract Management</h3>
          <NexusBadge variant="primary" className="px-3 py-1 font-black uppercase tracking-widest text-[10px]">3 Active MSAs</NexusBadge>
        </div>
        <div className="flex gap-3">
          <NexusButton variant="outline" size="sm" className="h-10 px-6 font-black uppercase tracking-widest text-[10px] border-slate-200 bg-white">Filter</NexusButton>
          <NexusButton className="h-10 px-6 font-black uppercase tracking-widest text-[10px] bg-slate-900 text-white shadow-lg shadow-slate-200">New Contract</NexusButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { id: 'ct1', name: 'Master Service Agreement', account: 'TechFlow Inc.', status: 'Active', value: '250,000 €', expiry: '2025-12-31', type: 'SaaS' },
            { id: 'ct2', name: 'SLA - Gold Support', account: 'Logistics Pro', status: 'Pending Approval', value: '45,000 €', expiry: '2025-06-30', type: 'Support' },
            { id: 'ct3', name: 'Hardware Lease Agreement', account: 'Green Energy', status: 'Active', value: '120,000 €', expiry: '2026-03-15', type: 'Hardware' },
          ].map((contract, i) => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <NexusCard className="hover:shadow-2xl transition-all border-none bg-white shadow-sm ring-1 ring-slate-200/50 group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <NexusBadge variant={contract.status === 'Active' ? 'success' : 'primary'} className="text-[9px] font-black uppercase px-3 py-1">
                    {contract.status}
                  </NexusBadge>
                </div>
                <h4 className="text-base font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{contract.name}</h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-6">
                  <Building2 className="w-3.5 h-3.5" />
                  {contract.account}
                </div>
                
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</div>
                    <div className="text-sm font-black text-slate-900 tracking-tight">{contract.value}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expiry Date</div>
                    <div className="text-sm font-black text-slate-900 tracking-tight">{contract.expiry}</div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{contract.type}</span>
                  </div>
                  <NexusButton 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-[9px] font-black uppercase tracking-widest"
                    onClick={() => {
                      setSelectedContract(contract);
                      setShowContractModal(true);
                    }}
                  >
                    View Details
                  </NexusButton>
                </div>
              </NexusCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCatalogue = () => (
    <div className="h-full flex flex-col p-8 space-y-8 overflow-hidden bg-slate-50/30">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Stock Optimization</h3>
          <NexusBadge variant="primary" className="px-4 py-1.5 font-black uppercase tracking-widest text-[10px] shadow-sm">
            {products.length} Products
          </NexusBadge>
        </div>
        <div className="flex gap-3">
          <NexusButton variant="outline" className="h-10 px-6 font-black uppercase tracking-widest text-[10px] border-slate-200 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4 mr-2" /> Run AI Audit
          </NexusButton>
          <NexusButton className="h-10 px-6 font-black uppercase tracking-widest text-[10px] bg-slate-900 text-white shadow-lg shadow-slate-200">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </NexusButton>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
        <div className="col-span-9 overflow-y-auto pr-4 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <NexusCard padding="none" className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-none bg-white shadow-sm ring-1 ring-slate-200/50">
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-4 right-4">
                      <NexusBadge variant={product.status === 'Critical' ? 'danger' : product.status === 'Overstock' ? 'warning' : 'success'} className="px-3 py-1 font-black uppercase tracking-widest text-[9px] shadow-lg">
                        {product.status}
                      </NexusBadge>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">{product.family}</div>
                    <h4 className="text-base font-black text-slate-900 mb-6 line-clamp-1 group-hover:text-indigo-600 transition-colors">{product.name}</h4>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Stock Velocity</span>
                        <span className={cn("font-black", product.stock < 20 ? "text-rose-500" : "text-emerald-500")}>
                          {product.stock} / {product.capacity}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(product.stock / product.capacity) * 100}%` }}
                          className={cn("h-full rounded-full shadow-sm", 
                            product.status === 'Critical' ? "bg-rose-500" : 
                            product.status === 'Overstock' ? "bg-amber-500" : "bg-emerald-500"
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="text-2xl font-black text-slate-900 tracking-tighter">{product.price} €</div>
                      <NexusButton variant="outline" size="sm" className="h-10 w-10 p-0 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition-all">
                        <RefreshCw className="w-4 h-4" />
                      </NexusButton>
                    </div>
                  </div>
                </NexusCard>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="col-span-3 flex flex-col gap-8">
          <NexusCard className="bg-slate-950 text-white border-none relative overflow-hidden group shadow-2xl shadow-slate-200">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest">AI Stock Guard</h4>
              </div>
              <div className="space-y-6">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Critical Shortage</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                    Sensor X1 is below safety threshold. AI suggests immediate reorder of 150 units to prevent stockout.
                  </p>
                </div>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Overstock Alert</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                    IoT Gateway Pro is occupying 40% of shelf space. Recommend promotional bundle to clear inventory.
                  </p>
                </div>
              </div>
              <NexusButton className="w-full mt-8 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20">
                Optimize Inventory
              </NexusButton>
            </div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
          </NexusCard>

          <NexusCard title="Stock Trends" className="flex-1 border-none bg-white shadow-sm ring-1 ring-slate-200/50">
            <div className="space-y-8 mt-6">
              {[
                { label: 'Inbound Flow', value: '+12%', color: 'emerald' },
                { label: 'Outbound Flow', value: '-8%', color: 'rose' },
                { label: 'Storage Cap', value: '78%', color: 'indigo' },
              ].map((trend, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">{trend.label}</span>
                    <span className={cn("font-black", 
                      trend.color === 'emerald' ? "text-emerald-600" : 
                      trend.color === 'rose' ? "text-rose-600" : "text-indigo-600"
                    )}>{trend.value}</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: trend.value.replace(/[^0-9]/g, '') + '%' }}
                      className={cn("h-full rounded-full shadow-sm", 
                        trend.color === 'emerald' ? "bg-emerald-500" : 
                        trend.color === 'rose' ? "bg-rose-500" : "bg-indigo-500"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </NexusCard>
        </div>
      </div>
    </div>
  );

  const handleConvert = (id: string) => {
    if (onConvertLead) onConvertLead();
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'leads': return renderLeads();
      case 'contacts': return renderContacts();
      case 'pipeline': return renderPipeline();
      case 'orders': return renderOrders();
      case 'cases': return renderCases();
      case 'contracts': return renderContracts();
      case 'catalogue': return renderCatalogue();
      default: return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
          <Zap className="w-12 h-12 mb-4 opacity-10 animate-pulse" />
          <p className="text-sm font-black uppercase tracking-widest">Section {activeSection} Loading...</p>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-nexus-50">
      {/* Ultra-Compact Sidebar */}
      <aside className="w-20 bg-nexus-950 flex flex-col items-center py-8 flex-shrink-0 border-r border-white/5 relative z-50">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-12 h-12 bg-accent-primary rounded-2xl flex items-center justify-center mb-12 shadow-xl shadow-accent-primary/20 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Zap className="w-7 h-7 text-white fill-white group-hover:animate-pulse relative z-10" />
        </motion.div>
        
        <nav className="flex-1 space-y-4">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as AdminSection)}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative group",
                activeSection === item.id 
                  ? "bg-accent-primary text-white shadow-xl shadow-accent-primary/40" 
                  : "text-nexus-500 hover:bg-white/5 hover:text-nexus-200"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-danger text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-nexus-950 shadow-lg">
                  {item.badge}
                </span>
              )}
              {/* Tooltip */}
              <div className="absolute left-16 px-4 py-2 bg-nexus-900 text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-2xl border border-white/10 uppercase tracking-widest">
                {item.label}
              </div>
              {/* Active Indicator */}
              {activeSection === item.id && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute -left-4 w-1.5 h-8 bg-accent-primary rounded-r-full"
                />
              )}
            </button>
          ))}
        </nav>

        <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-nexus-500 hover:bg-accent-danger/10 hover:text-accent-danger transition-all group relative">
          <LogOut className="w-5 h-5" />
          <div className="absolute left-16 px-4 py-2 bg-accent-danger text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-2xl uppercase tracking-widest">
            Logout
          </div>
        </button>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Compact Header */}
        <header className="h-16 bg-white border-b border-nexus-200 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-nexus-900 uppercase tracking-tighter font-display">{activeSection}</h2>
            <div className="w-px h-4 bg-nexus-200" />
            <div className="text-[10px] font-bold text-nexus-400 uppercase tracking-widest">{currentDate}</div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nexus-400" />
              <input 
                className="pl-10 pr-4 py-2 bg-nexus-50 border border-nexus-200 rounded-lg text-[11px] outline-none focus:ring-2 focus:ring-accent-primary w-48 transition-all" 
                placeholder="Global Search..." 
              />
            </div>
            <div className="flex items-center gap-4 px-3 py-1.5 bg-accent-success/5 rounded-xl border border-accent-success/10 group cursor-pointer hover:bg-accent-success/10 transition-colors">
              <div className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
              <span className="text-[10px] font-black text-accent-success uppercase tracking-widest">Live Sync</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] font-black text-nexus-900">Admin Nexus</div>
                <div className="text-[9px] font-bold text-accent-success uppercase">System Active</div>
              </div>
              <div className="w-9 h-9 bg-nexus-50 rounded-lg flex items-center justify-center border border-nexus-200">
                <ShieldCheck className="w-5 h-5 text-accent-primary" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] text-nexus-400 font-black uppercase tracking-widest animate-pulse">Syncing Nexus Core...</p>
                </div>
              ) : renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-nexus-200);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-nexus-300);
        }
      `}} />
    </div>
  );
};
.rounded-\[3rem\] { border-radius: 3rem; }
.p-10 { padding: 2.5rem; }
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.border { border-width: 1px; border-style: solid; }
.border-slate-200 { border-color: #e2e8f0; }
.bg-white { background-color: #ffffff; }
.text-6xl { font-size: 3.75rem; line-height: 1; }
.font-black { font-weight: 900; }
.text-slate-900 { color: #0f172a; }
.tracking-tighter { letter-spacing: -0.05em; }
.leading-none { line-height: 1; }
.text-transparent { color: transparent; }
.bg-clip-text { -webkit-background-clip: text; background-clip: text; }
.bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
.from-indigo-600 { --tw-gradient-from: #4f46e5; --tw-gradient-to: rgb(79 70 229 / 0); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
.to-purple-600 { --tw-gradient-to: #9333ea; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.text-\[10px\] { font-size: 10px; }
.text-slate-400 { color: #94a3b8; }
.uppercase { text-transform: uppercase; }
.tracking-widest { letter-spacing: 0.1em; }
.bg-slate-950 { background-color: #020617; }
.text-white { color: #ffffff; }
.rounded-xl { border-radius: 0.75rem; }
.hover\:bg-indigo-600:hover { background-color: #4f46e5; }
.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }

.bg-indigo-50 { background-color: #eef2ff; }
.text-indigo-600 { color: #4f46e5; }
.bg-emerald-50 { background-color: #ecfdf5; }
.text-emerald-600 { color: #059669; }
.bg-slate-50 { background-color: #f8fafc; }
.text-slate-600 { color: #475569; }
.bg-slate-100 { background-color: #f1f5f9; }

table { width: 100%; border-collapse: collapse; }
th { text-align: left; }
td { vertical-align: middle; }


