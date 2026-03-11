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
  Globe,
  ArrowUpRight
} from 'lucide-react';
import { COMPONENT_EXAMPLES } from './constants';
import { cn } from './lib/utils';
import { LoginView } from './components/LoginView';
import { AuthView } from './components/AuthView';
import { LeadForm } from './components/LeadForm';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerPortal } from './components/CustomerPortal';
import { NexusNavbar, NexusFooter } from './components/NexusLandingBundle';
import { NexusAuthModal } from './components/NexusAuthModal';
import { B2BQuoteForm } from './components/B2BQuoteForm';
import { Product, CartItem } from './types';

type AppView = 'home' | 'admin' | 'portal';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [portalTab, setPortalTab] = useState<'dashboard' | 'catalog' | 'favorites' | 'orders' | 'quotations' | 'cart' | 'profile' | 'cases' | 'insights' | 'timeline' | 'war-room'>('dashboard');
  const [userType, setUserType] = useState<'B2B' | 'B2C' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isB2BConverted, setIsB2BConverted] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup-select' | 'forgot-password' | 'set-password' | 'b2b-register' | 'signup-b2c'>('login');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [pendingAction, setPendingAction] = useState<{ type: 'cart' | 'favorite', product: Product } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [notifications, setNotifications] = useState<{id: string, text: string, read: boolean}[]>([
    { id: '1', text: 'Welcome to Nexus Systems!', read: false },
    { id: '2', text: 'New products available in the catalog.', read: false }
  ]);
  
  // Component Lab State
  const [selectedId, setSelectedId] = useState(COMPONENT_EXAMPLES[0].id);
  const [activeTab, setActiveTab] = useState<'react' | 'lwc'>('react');
  const [lwcSubTab, setLwcSubTab] = useState<'html' | 'js' | 'xml' | 'css'>('html');
  const [copied, setCopied] = useState(false);

  const selectedComponent = COMPONENT_EXAMPLES.find(c => c.id === selectedId)!;

  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated) {
      setPendingAction({ type: 'cart', product });
      setAuthMode('signup-select');
      setIsAuthModalOpen(true);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    
    setToast({ message: `${product.name} added to cart!`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
    
    setNotifications(prev => [{ id: Date.now().toString(), text: `${product.name} added to cart`, read: false }, ...prev]);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleToggleFavorite = (product: Product) => {
    if (!isAuthenticated) {
      setPendingAction({ type: 'favorite', product });
      setAuthMode('signup-select');
      setIsAuthModalOpen(true);
      return;
    }
    setFavorites(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const handleLogin = (type: 'B2B' | 'B2C') => {
    setIsAuthenticated(true);
    setUserType(type);
    setIsB2BConverted(false);
    setView('portal');
    
    if (pendingAction) {
      if (pendingAction.type === 'cart') {
        setCart(prev => {
          const existing = prev.find(item => item.product.id === pendingAction.product.id);
          if (existing) {
            return prev.map(item => 
              item.product.id === pendingAction.product.id 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            );
          }
          return [...prev, { product: pendingAction.product, quantity: 1 }];
        });
        setPortalTab('cart');
      } else {
        setFavorites(prev => [...prev, pendingAction.product]);
        setPortalTab('dashboard'); // Or a favorites tab if we add one
      }
      setPendingAction(null);
    }

    setNotifications(prev => [{ id: Date.now().toString(), text: `Login successful as ${type}`, read: false }, ...prev]);
  };

  const handleSignUp = (type: 'B2B' | 'B2C') => {
    if (type === 'B2B') {
      setAuthMode('b2b-register');
      setIsAuthModalOpen(true);
    } else {
      setAuthMode('signup-b2c');
      setIsAuthModalOpen(true);
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
        return <LoginView 
          onSelect={(type, mode) => {
            if (mode === 'login') {
              setAuthMode('login');
            } else {
              setAuthMode(type === 'B2B' ? 'signup-select' : 'signup-b2c');
            }
            setIsAuthModalOpen(true);
          }} 
          onAddToCart={handleAddToCart}
          onToggleFavorite={handleToggleFavorite}
          favorites={favorites}
        />;
      case 'admin':
        return <AdminDashboard onConvertLead={() => {
          setIsB2BConverted(true);
          setAuthMode('set-password');
          setIsAuthModalOpen(true);
        }} />;
      case 'portal':
        return (
          <CustomerPortal 
            isAuthenticated={isAuthenticated}
            userType={userType}
            cart={cart} 
            favorites={favorites}
            notifications={notifications} 
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onToggleFavorite={handleToggleFavorite}
            onLoginRequest={() => {
              setAuthMode('login');
              setIsAuthModalOpen(true);
            }}
            initialTab={portalTab}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-900 font-sans transition-colors duration-500">
      {/* Header */}
      {view !== 'admin' && view !== 'portal' && (
        <NexusNavbar 
          isAuthenticated={isAuthenticated}
          userType={userType}
          cartCount={cart.length}
          onViewChange={(v) => setView(v)}
          onLogout={handleLogout}
          onLoginClick={() => {
            setAuthMode('login');
            setIsAuthModalOpen(true);
          }}
          onRequestQuote={() => {
            setShowQuoteForm(true);
          }}
        />
      )}

      <main className={cn("w-full", (view === 'admin' || view === 'portal') && "p-0 m-0")}>
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

      {view !== 'admin' && view !== 'portal' && <NexusFooter />}

      <NexusAuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        onRegisterSuccess={() => {
          setNotifications(prev => [{ id: Date.now().toString(), text: 'Registration request sent!', read: false }, ...prev]);
          setToast({ message: 'Registration request sent!', type: 'success' });
          setTimeout(() => setToast(null), 3000);
        }}
        initialMode={isB2BConverted ? 'set-password' : authMode}
      />

      <AnimatePresence>
        {showQuoteForm && (
          <B2BQuoteForm 
            onClose={() => setShowQuoteForm(false)} 
            onSubmit={(data) => {
              console.log('Global Quote Request:', data);
              setToast({ message: 'Quote request submitted successfully!', type: 'success' });
              setTimeout(() => setToast(null), 3000);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-12 left-1/2 z-[9999] px-8 py-4 bg-slate-900 text-white rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-xl transition-colors duration-500"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-sm uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

