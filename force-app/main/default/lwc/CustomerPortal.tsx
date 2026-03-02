import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, AlertTriangle, BrainCircuit, 
  ArrowUpRight, Search, Filter, Star, Heart, Zap,
  TrendingUp, Clock, FileText, LayoutDashboard,
  Package, History, MessageSquare, Bell, Trash2, Sparkles,
  User, LifeBuoy, Camera, Shield, Mail, Phone, MapPin, Bot, Headphones,
  Send, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Product } from '../types';

interface CustomerPortalProps {
  isAuthenticated: boolean;
  userType: 'B2B' | 'B2C' | null;
  cart: Product[];
  notifications: any[];
  onAddToCart: (product: Product) => void;
  onLoginRequest: () => void;
  initialTab?: PortalTab;
}

type PortalTab = 'dashboard' | 'catalog' | 'orders' | 'quotations' | 'cart' | 'profile' | 'cases';

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ 
  isAuthenticated, 
  userType,
  cart, 
  notifications, 
  onAddToCart,
  onLoginRequest,
  initialTab = 'dashboard'
}) => {
  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const handleAction = (action: () => void) => {
    if (!isAuthenticated) {
      onLoginRequest();
    } else {
      action();
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const renderDashboard = () => (
    <div className="space-y-12">
      {/* AI Intelligence Banner */}
      <section className="relative bg-slate-900 rounded-[3rem] p-12 text-white overflow-hidden shadow-2xl shadow-indigo-200/20">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-400 mb-6">
              <BrainCircuit className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Nexus AI Optimizer</span>
            </div>
            <h2 className="text-5xl font-black mb-6 tracking-tighter leading-none">
              OPTIMISEZ VOTRE <span className="text-indigo-400">STOCK</span> EN TEMPS RÉEL
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed font-medium">
              Notre algorithme prédictif a identifié 3 opportunités de réapprovisionnement pour sécuriser votre chaîne de production.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => setActiveTab('catalog')} className="px-8 py-4 bg-indigo-600 rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-500/20 group">
                Appliquer les recommandations <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
              <TrendingUp className="w-8 h-8 text-emerald-400 mb-4" />
              <div className="text-2xl font-black">+24%</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Efficacité Stock</div>
            </div>
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
              <Clock className="w-8 h-8 text-amber-400 mb-4" />
              <div className="text-2xl font-black">-15h</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Temps de Gestion</div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
      </section>

      {!isAuthenticated ? (
        <div className="bg-white rounded-[3rem] border border-slate-200 p-12 text-center">
          <Sparkles className="w-16 h-16 text-indigo-200 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-slate-900 mb-2">Bienvenue sur le Portail Nexus</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Connectez-vous pour accéder à vos activités récentes, vos commandes personnalisées et vos outils d'optimisation AI.</p>
          <button onClick={onLoginRequest} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10">
            Se Connecter Maintenant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 p-8">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Activités Récentes</h3>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Package className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900">Commande #ORD-2024-00{i}</div>
                    <div className="text-xs text-slate-500">Expédiée le 24 Février 2024</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-slate-900">$1,240.00</div>
                    <div className="text-[10px] font-bold text-emerald-600 uppercase">Livré</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              Alertes Stock
            </h3>
            <div className="space-y-6">
              {products.filter(p => p.status !== 'In Stock').slice(0, 3).map(p => (
                <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-slate-900">{p.name}</span>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider",
                      p.status === 'Critical' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    )}>{p.status}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-3">
                    <div 
                      className={cn("h-full rounded-full", p.status === 'Critical' ? "bg-rose-500" : "bg-amber-500")}
                      style={{ width: `${(p.stockLevel / p.recommendedStock) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCatalog = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-4xl font-black text-slate-900 tracking-tight">Catalogue Produits</h3>
          <p className="text-slate-500 font-medium mt-1">Solutions technologiques certifiées Nexus pour votre entreprise.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-64 shadow-sm" placeholder="Rechercher un produit..." />
          </div>
          <button className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product, idx) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -8 }}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden group"
          >
            <div className="h-56 bg-slate-50 flex items-center justify-center relative overflow-hidden">
              <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <button className="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur-md rounded-xl text-slate-400 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300">
                <Heart className="w-5 h-5" />
              </button>
              {product.status !== 'In Stock' && (
                <div className={cn(
                  "absolute top-4 left-4 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 backdrop-blur-md shadow-lg",
                  product.status === 'Critical' ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                )}>
                  <AlertTriangle className="w-3 h-3" />
                  {product.status}
                </div>
              )}
            </div>
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{product.productCode}</div>
                  <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{product.name}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{product.family}</p>
                </div>
                <span className="text-2xl font-black text-indigo-600">${product.price}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
              </div>
              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock</span>
                  <span className="text-sm font-black text-slate-900">{product.stockLevel} unités</span>
                </div>
                <button 
                  onClick={() => handleAction(() => onAddToCart(product))}
                  className="p-4 bg-slate-950 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-200 group-hover:scale-110 duration-300"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderCart = () => (
    <div className="space-y-8">
      <h3 className="text-4xl font-black text-slate-900 tracking-tight">Mon Panier</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-4">
          {cart.length === 0 ? (
            <div className="bg-white rounded-[3rem] border border-slate-200 p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-slate-900 mb-2">Votre panier est vide</h3>
              <p className="text-slate-500 mb-8">Découvrez nos produits et commencez vos achats.</p>
              <button onClick={() => handleAction(() => setActiveTab('catalog'))} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all">
                Voir le catalogue
              </button>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center gap-6 group hover:shadow-xl transition-all">
                <div className="w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden">
                  <img src={item.image} className="w-full h-full object-cover" alt={item.name} referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{item.productCode}</div>
                  <h4 className="text-lg font-black text-slate-900">{item.name}</h4>
                  <p className="text-xs text-slate-500">{item.family}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-slate-900">${item.price}</div>
                  <button className="text-rose-500 hover:text-rose-700 transition-colors mt-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white sticky top-24 shadow-2xl shadow-indigo-200/20">
            <h4 className="text-xl font-black mb-8">Résumé de la commande</h4>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-slate-400">
                <span>Sous-total</span>
                <span className="text-white font-bold">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>TVA (20%)</span>
                <span className="text-white font-bold">${(cartTotal * 0.2).toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between text-2xl font-black">
                <span>Total</span>
                <span className="text-indigo-400">${(cartTotal * 1.2).toFixed(2)}</span>
              </div>
            </div>
            <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20" onClick={() => handleAction(() => {})}>
              Procéder au paiement
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row items-start gap-12">
        <div className="relative group">
          <div className="w-48 h-48 bg-slate-100 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center">
            <User className="w-20 h-20 text-slate-300" />
          </div>
          <button className="absolute bottom-2 right-2 p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 transition-all group-hover:scale-110">
            <Camera className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 space-y-6">
          <div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">
              {userType === 'B2B' ? 'Profil Entreprise' : 'Profil Personnel'}
            </h3>
            <p className="text-slate-500 font-medium mt-2">Gérez vos informations et préférences de compte.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                <Shield className="w-4 h-4" /> Sécurité
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900">Mot de passe</div>
                <div className="text-xs text-slate-500">Dernière modification il y a 3 mois</div>
              </div>
              <button className="text-xs font-black text-indigo-600 hover:text-indigo-700">Changer le mot de passe</button>
            </div>
            
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4" /> Statut du compte
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900">Vérifié</div>
                <div className="text-xs text-slate-500">Accès complet aux services Nexus</div>
              </div>
              <div className="text-[10px] font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg inline-block">ACTIF</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 space-y-8">
          <h4 className="text-xl font-black text-slate-900">Informations Générales</h4>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom complet / Raison sociale</label>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <User className="w-5 h-5 text-slate-400" />
                <span className="font-bold text-slate-700">{userType === 'B2B' ? 'Nexus Global Corp' : 'John Doe'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email professionnel</label>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Mail className="w-5 h-5 text-slate-400" />
                <span className="font-bold text-slate-700">contact@nexus-global.com</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</label>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Phone className="w-5 h-5 text-slate-400" />
                <span className="font-bold text-slate-700">+33 1 23 45 67 89</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 space-y-8">
          <h4 className="text-xl font-black text-slate-900">Localisation</h4>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adresse de facturation</label>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <MapPin className="w-5 h-5 text-slate-400 mt-1" />
                <span className="font-bold text-slate-700 leading-relaxed">
                  128 Rue de la Technologie<br />
                  75008 Paris, France
                </span>
              </div>
            </div>
            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-black text-indigo-900">Nexus Prime</div>
                  <div className="text-[10px] text-indigo-600 font-bold uppercase">Membre depuis 2023</div>
                </div>
              </div>
              <p className="text-xs text-indigo-700 leading-relaxed">
                En tant que membre Prime, vous bénéficiez de la livraison prioritaire et d'un support AI dédié 24/7.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const [caseStep, setCaseStep] = useState<1 | 2>(1);
  const [casePriority, setCasePriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');

  const renderCases = () => (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-4xl font-black text-slate-900 tracking-tight">Réclamations & Support</h3>
          <p className="text-slate-500 font-medium mt-1">Résolvez vos problèmes rapidement avec notre assistance intelligente.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
          <button 
            onClick={() => setCaseStep(1)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
              caseStep === 1 ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Bot className="w-4 h-4" /> Agent AI
          </button>
          <button 
            onClick={() => setCaseStep(2)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
              caseStep === 2 ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Headphones className="w-4 h-4" /> Expert Humain
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {caseStep === 1 ? (
          <motion.div 
            key="ai-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-600/20 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-black">Nexus Agentforce</h4>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">En ligne</span>
                  </div>
                </div>
              </div>
              <button className="text-white/40 hover:text-white transition-colors">
                <History className="w-5 h-5" />
              </button>
            </div>

            <div className="h-[400px] p-8 overflow-y-auto space-y-6 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05),transparent_100%)]">
              <div className="flex gap-4 max-w-[80%]">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="p-4 bg-white/5 rounded-2xl rounded-tl-none text-slate-300 text-sm leading-relaxed border border-white/5">
                  Bonjour ! Je suis l'agent AI de Nexus. Comment puis-je vous aider aujourd'hui ? Je peux suivre vos commandes, expliquer une facture ou diagnostiquer un problème technique.
                </div>
              </div>

              <div className="flex gap-4 max-w-[80%] ml-auto flex-row-reverse">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <div className="p-4 bg-indigo-600 rounded-2xl rounded-tr-none text-white text-sm leading-relaxed shadow-lg shadow-indigo-500/10">
                  J'ai un problème avec ma dernière commande #ORD-2024-001. Le capteur semble défectueux.
                </div>
              </div>

              <div className="flex gap-4 max-w-[80%]">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="p-4 bg-white/5 rounded-2xl rounded-tl-none text-slate-300 text-sm leading-relaxed border border-white/5">
                  Je suis navré d'apprendre cela. J'ai vérifié le statut de votre commande. Souhaitez-vous que je lance une procédure de retour automatique ou préférez-vous parler à un administrateur pour une assistance personnalisée ?
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/5 border-t border-white/5">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Écrivez votre message..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 flex justify-center gap-4">
                <button onClick={() => setCaseStep(2)} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                  Escalader vers un administrateur <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="admin-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-200 p-10 space-y-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900">Ouvrir un Ticket Support</h4>
                  <p className="text-slate-500 text-sm">Un administrateur vous répondra sous 24h.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sujet de la réclamation</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Ex: Produit défectueux" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priorité</label>
                    <div className="flex gap-2">
                      {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                        <button 
                          key={p}
                          onClick={() => setCasePriority(p as any)}
                          className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                            casePriority === p 
                              ? "bg-slate-900 text-white shadow-lg" 
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description détaillée</label>
                  <textarea 
                    rows={6} 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    placeholder="Décrivez votre problème avec le plus de détails possible..."
                  />
                </div>

                <div className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-center space-y-4 hover:border-indigo-300 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto group-hover:bg-indigo-50 transition-colors">
                    <Package className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                  <div className="text-sm font-bold text-slate-600">Glissez-déposez des photos ou documents</div>
                  <div className="text-[10px] text-slate-400 uppercase font-black">PNG, JPG, PDF (Max 10MB)</div>
                </div>

                <button className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-all shadow-xl shadow-rose-500/20 flex items-center justify-center gap-3">
                  Envoyer la réclamation <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl shadow-indigo-200/20">
                <h4 className="text-lg font-black mb-6">Pourquoi escalader ?</h4>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-white font-bold block mb-1">Garantie Nexus</span>
                      Tous nos produits sont couverts par une garantie de remplacement immédiat.
                    </p>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-white font-bold block mb-1">Support 24h</span>
                      Nos experts s'engagent à traiter votre demande en moins de 24 heures ouvrées.
                    </p>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 space-y-6">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tickets Récents</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">#TKT-882</div>
                      <div className="text-[10px] text-slate-500">Facturation</div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg uppercase">Résolu</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-12">
      {/* Sidebar Navigation */}
      <aside className="lg:w-72 space-y-2">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all",
            activeTab === 'dashboard' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('catalog')}
          className={cn(
            "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all",
            activeTab === 'catalog' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <Package className="w-5 h-5" /> Catalogue
        </button>
        <button 
          onClick={() => setActiveTab('cart')}
          className={cn(
            "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all relative",
            activeTab === 'cart' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <ShoppingCart className="w-5 h-5" /> Mon Panier
          {cart.length > 0 && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={cn(
            "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all",
            activeTab === 'orders' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <History className="w-5 h-5" /> Commandes
        </button>
        <button 
          onClick={() => setActiveTab('quotations')}
          className={cn(
            "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all",
            activeTab === 'quotations' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <MessageSquare className="w-5 h-5" /> Devis
        </button>

        <div className="w-full h-px bg-slate-100 my-4" />

        <button 
          onClick={() => setActiveTab('profile')}
          className={cn(
            "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all",
            activeTab === 'profile' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <User className="w-5 h-5" /> Profil
        </button>

        <button 
          onClick={() => setActiveTab('cases')}
          className={cn(
            "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all",
            activeTab === 'cases' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <LifeBuoy className="w-5 h-5" /> Réclamations
        </button>
        
        <div className="pt-8 mt-8 border-t border-slate-200">
          <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
            <h4 className="text-sm font-black text-indigo-900 mb-2">Support Premium</h4>
            <p className="text-xs text-indigo-700 leading-relaxed mb-4">Besoin d'aide pour une commande complexe ?</p>
            <button className="w-full py-3 bg-white text-indigo-600 rounded-xl text-xs font-black shadow-sm hover:bg-indigo-600 hover:text-white transition-all">
              Contacter un expert
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'catalog' && renderCatalog()}
            {activeTab === 'cart' && renderCart()}
            {activeTab === 'profile' && renderProfile()}
            {activeTab === 'cases' && renderCases()}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-[3rem] border border-slate-200 p-12 text-center">
                <History className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-slate-900 mb-2">Historique des Commandes</h3>
                <p className="text-slate-500">Vous n'avez pas encore passé de commande.</p>
              </div>
            )}
            {activeTab === 'quotations' && (
              <div className="bg-white rounded-[3rem] border border-slate-200 p-12 text-center">
                <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-slate-900 mb-2">Demandes de Devis</h3>
                <p className="text-slate-500">Aucune demande de devis en cours.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
