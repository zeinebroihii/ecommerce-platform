import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Code2, 
  Zap, 
  Box, 
  ChevronRight, 
  Copy, 
  Check,
  Smartphone,
  Monitor,
  Cloud,
  FileCode,
  Layers,
  LayoutDashboard,
  LogIn,
  UserCircle,
  Settings,
  LogOut,
  ShoppingCart,
  Bell,
  FileText,
} from 'lucide-react';
import { COMPONENT_EXAMPLES } from './constants';
import { cn } from './lib/utils';
import { LoginView } from './LoginView';
import { AuthView } from './AuthView';
import { LeadForm } from './LeadForm';
import { AdminDashboard } from './AdminDashboard';
import { CustomerPortal } from './CustomerPortal';
import { Footer } from './Footer';
import { Product } from './types';

type AppView = 'home' | 'login' | 'b2b-register' | 'admin' | 'portal';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [portalTab, setPortalTab] = useState<'dashboard' | 'catalog' | 'orders' | 'quotations' | 'cart' | 'profile' | 'cases'>('dashboard');
  const [userType, setUserType] = useState<'B2B' | 'B2C' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isB2BConverted, setIsB2BConverted] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup-select' | 'set-password' | 'b2c-signup'>('login');
  const [pendingLoginType, setPendingLoginType] = useState<'B2B' | 'B2C'>('B2C');
  const [cart, setCart] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<{id: string, text: string, read: boolean}[]>([
    { id: '1', text: 'Bienvenue sur Nexus Systems !', read: false },
    { id: '2', text: 'Nouveaux produits disponibles dans le catalogue.', read: false }
  ]);
  
  // Component Lab State
  const [selectedId, setSelectedId] = useState(COMPONENT_EXAMPLES[0].id);
  const [activeTab, setActiveTab] = useState<'react' | 'lwc'>('react');
  const [lwcSubTab, setLwcSubTab] = useState<'html' | 'js' | 'xml' | 'css'>('html');
  const [copied, setCopied] = useState(false);

  const selectedComponent = COMPONENT_EXAMPLES.find(c => c.id === selectedId)!;

  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated) {
      setView('login');
      return;
    }
    setCart(prev => [...prev, product]);
    setNotifications(prev => [{ id: Date.now().toString(), text: `${product.name} ajouté au panier`, read: false }, ...prev]);
  };

  const handleLogin = (type: 'B2B' | 'B2C') => {
    setIsAuthenticated(true);
    setUserType(type);
    setIsB2BConverted(false);
    setView('portal');
    setNotifications(prev => [{ id: Date.now().toString(), text: `Connexion réussie en tant que ${type}`, read: false }, ...prev]);
  };

  const handleSignUp = (type: 'B2B' | 'B2C') => {
    if (type === 'B2B') {
      setView('b2b-register');
    } else {
      handleLogin('B2C');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setView('home');
    setCart([]);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentCode = activeTab === 'react' 
    ? selectedComponent.reactCode 
    : lwcSubTab === 'html' 
      ? selectedComponent.lwcHtml 
      : lwcSubTab === 'js' 
        ? selectedComponent.lwcJs 
        : lwcSubTab === 'xml'
          ? selectedComponent.lwcXml
          : (selectedComponent as any).lwcCss;

  const renderView = () => {
    switch (view) {
      case 'home':
        return <LoginView onSelect={(type: 'B2B' | 'B2C', action: 'login' | 'signup') => {
          if (action === 'signup' && type === 'B2B') {
            setView('b2b-register');
          } else if (action === 'signup' && type === 'B2C') {
            setPendingLoginType('B2C');
            setAuthMode('b2c-signup');
            setView('login');
          } else {
            setPendingLoginType(type);
            setAuthMode('login');
            setView('login');
          }
        }} onAddToCart={handleAddToCart} />;
      case 'login':
        return (
          <AuthView
            initialMode={isB2BConverted ? 'set-password' : authMode}
            pendingType={pendingLoginType}
            onLogin={handleLogin}
            onSignUp={handleSignUp}
          />
        );
      case 'b2b-register':
        return <LeadForm onSubmit={() => {
          setNotifications(prev => [{ id: Date.now().toString(), text: 'Demande d\'enregistrement envoyée !', read: false }, ...prev]);
          setView('home');
        }} />;
      case 'admin':
        return <AdminDashboard onConvertLead={() => {
          setIsB2BConverted(true);
          setView('login');
        }} />;
      case 'portal':
        return (
          <CustomerPortal 
            isAuthenticated={isAuthenticated}
            userType={userType}
            cart={cart} 
            notifications={notifications} 
            onAddToCart={handleAddToCart}
            onLoginRequest={() => setView('login')}
            initialTab={portalTab}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Nexus CRM</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => {
              setView('home');
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Home</button>
            {isAuthenticated && (
              <button onClick={() => {
                setPortalTab('dashboard');
                setView('portal');
              }} className={cn("text-sm font-medium transition-colors", view === 'portal' ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600")}>Portal</button>
            )}
            <button onClick={() => setView('admin')} className={cn("text-sm font-medium transition-colors", view === 'admin' ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600")}>Admin</button>
            <div className="w-px h-4 bg-slate-200 mx-2" />
            
            <div className="flex items-center gap-4">
              {!isAuthenticated && (
                <button 
                  onClick={() => {
                    setAuthMode('signup-select');
                    setView('login');
                  }}
                  className="text-sm font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Demande de Devis
                </button>
              )}

              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 transition-all relative">
                      <Bell className="w-5 h-5" />
                      {notifications.some(n => !n.read) && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                      )}
                    </button>
                    {/* Notifications Dropdown */}
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-4 z-50">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Notifications</h4>
                      <div className="space-y-3">
                        {notifications.map(n => (
                          <div key={n.id} className="text-[10px] text-slate-600 leading-relaxed border-b border-slate-50 pb-2">
                            {n.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setPortalTab('cart');
                      setView('portal');
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-all relative"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        {cart.length}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{userType === 'B2B' ? 'Enterprise' : 'Individual'}</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('signup-select');
                    setView('login');
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Login
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

