import React from 'react';
import { 
  motion,
  useScroll, 
  useTransform,
  AnimatePresence
} from 'motion/react';
import { 
  Zap, 
  LogIn, 
  UserCircle, 
  Bell, 
  ShoppingCart, 
  LogOut, 
  Globe, 
  ArrowUpRight, 
  Building2, 
  User, 
  ArrowRight,
  FileText,
  Moon,
  Sun,
  Mail,
  Hash,
  MessageSquare,
  CheckCircle2,
  X,
  Send
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NexusButton } from './ui/NexusButton';
import { NexusCard } from './ui/NexusCard';
import { NexusLogo } from './NexusLogo';
import { NexusDealsSection } from './NexusDealsSection';
import { NexusAbout } from './NexusAbout';
import { NexusCatalog } from './NexusCatalog';

/**
 * NEXUS NAVBAR COMPONENT
 */
export const NexusNavbar: React.FC<{
  isAuthenticated?: boolean;
  userType?: 'B2B' | 'B2C' | null;
  cartCount?: number;
  onViewChange?: (view: any) => void;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onRequestQuote?: () => void;
}> = ({ 
  isAuthenticated, 
  userType, 
  cartCount = 0, 
  onViewChange, 
  onLogout,
  onLoginClick,
  onRequestQuote
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-colors duration-500">
      <div className="w-full px-12 h-20 flex items-center justify-between">
        <NexusLogo 
          variant="emerald"
          size="md"
          onClick={() => onViewChange?.('home')}
        />
        
        <nav className="hidden md:flex items-center gap-10">
          <button onClick={() => onViewChange?.('home')} className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-emerald-600 transition-colors">Home</button>
          <button onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-emerald-600 transition-colors">Products</button>
          <button onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-emerald-600 transition-colors">About</button>
          <button onClick={() => document.getElementById('journey-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-emerald-600 transition-colors">Journey</button>
          <button onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-emerald-600 transition-colors">FAQ</button>
          {isAuthenticated && (
            <button onClick={() => onViewChange?.('portal')} className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-emerald-600 transition-colors">Portal</button>
          )}
          <button onClick={() => onViewChange?.('admin')} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Admin</button>
          <div className="w-px h-4 bg-slate-200 mx-2" />
          
          <div className="flex items-center gap-4">
            {!isAuthenticated && (
              <button 
                onClick={onRequestQuote}
                className="text-sm font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Request Quote
              </button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-all relative">
                  <Bell className="w-5 h-5" />
                </button>

                <button 
                  onClick={() => onViewChange?.('portal')}
                  className="p-2 text-slate-400 hover:text-indigo-600 transition-all relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {cartCount}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center transition-colors duration-500">
                    <UserCircle className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 transition-colors duration-500">{userType === 'B2B' ? 'Enterprise' : 'Individual'}</span>
                </div>
                <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={onLoginClick} 
                className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Login
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

/**
 * NEXUS HERO COMPONENT
 */
export const NexusHero: React.FC = () => {
  return (
    <section className="relative min-h-[500px] h-[75vh] flex items-center justify-center overflow-hidden rounded-[2.5rem] bg-slate-50 mx-4 mt-4 shadow-2xl shadow-indigo-500/10 transition-all duration-700">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/seed/future-tech/1920/1080?blur=1" 
          className="w-full h-full object-cover opacity-30 transition-opacity duration-500"
          alt="Hero Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-50/60 to-indigo-50/40 transition-colors duration-500" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] mb-6 backdrop-blur-xl shadow-xl transition-colors duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            The Elite of Intelligent CRM
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[0.85] mb-6 transition-colors duration-500">
            NEXUS <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 drop-shadow-sm">
              SYSTEMS
            </span>
          </h1>
          
          <p className="text-base text-slate-600 max-w-xl mx-auto mb-8 font-medium leading-relaxed transition-colors duration-500">
            The ultimate architecture for your B2B & B2C flows. <br className="hidden md:block"/> 
            A seamless experience, powered by Nexus intelligence.
          </p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <NexusButton 
              size="md"
              onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="group h-14 px-8 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 shadow-2xl shadow-slate-900/20 transition-all duration-500 hover:scale-105 active:scale-95"
            >
              <span className="font-black uppercase tracking-widest italic text-xs">Start the Adventure</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
            </NexusButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

/**
 * NEXUS AUTH SELECTION (2 WAYS OF PROFILE CREATION)
 */
export const NexusAuthSelection: React.FC<{
  onSelect: (type: 'B2B' | 'B2C', mode: 'login' | 'signup') => void;
}> = ({ onSelect }) => {
  return (
    <section id="login-section" className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 transition-colors duration-500">Identify Yourself</h2>
        <p className="text-lg text-slate-500 font-medium transition-colors duration-500">Choose your profile to access your personalized space</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
        <NexusCard className="group relative p-10 text-left overflow-hidden border-none ring-1 ring-slate-100 bg-white transition-all duration-500">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 transition-all duration-500">
              <Building2 className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight transition-colors duration-500">Enterprise (B2B)</h3>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed font-medium transition-colors duration-500">
              Access wholesale pricing, manage complex orders, and track your quotes.
            </p>
            <div className="flex flex-col gap-4">
              <NexusButton onClick={() => onSelect('B2B', 'login')} className="w-full py-4 shadow-indigo-200">
                Login <ArrowRight className="w-5 h-5" />
              </NexusButton>
              <NexusButton variant="outline" onClick={() => onSelect('B2B', 'signup')} className="w-full py-4">
                Register Company
              </NexusButton>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors duration-500" />
        </NexusCard>

        <NexusCard className="group relative p-10 text-left overflow-hidden hover:border-emerald-500 border-none ring-1 ring-slate-100 bg-white transition-all duration-500">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 transition-all duration-500">
              <User className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight transition-colors duration-500">Individual (B2C)</h3>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed font-medium transition-colors duration-500">
              Direct purchase, instant order tracking, and immediate activation of your account.
            </p>
            <div className="flex flex-col gap-4">
              <NexusButton onClick={() => onSelect('B2C', 'login')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">
                Login <ArrowRight className="w-5 h-5" />
              </NexusButton>
              <NexusButton variant="outline" onClick={() => onSelect('B2C', 'signup')} className="w-full py-4">
                Create Account
              </NexusButton>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-100 transition-colors duration-500" />
        </NexusCard>
      </div>
    </section>
  );
};

/**
 * NEXUS FOOTER COMPONENT
 */
export const NexusFooter: React.FC = () => {
  return (
    <footer className="bg-slate-50 text-slate-900 pt-24 pb-12 overflow-hidden relative border-t border-slate-200">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/5 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="w-7 h-7 text-white fill-white" />
              </div>
              <span className="text-2xl font-black tracking-tight">Nexus CRM</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed font-medium max-w-xs">
              The most advanced CRM ecosystem for modern businesses. Powered by Nexus intelligence.
            </p>
            <div className="flex gap-4">
              {['Twitter', 'LinkedIn', 'GitHub'].map(social => (
                <button key={social} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm group">
                  <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-10">Solutions</h4>
            <ul className="space-y-4">
              {['Stock Management', 'Predictive Analytics', 'IoT Integration', 'AI Support'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-500 hover:text-emerald-600 font-medium transition-colors flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-10">Company</h4>
            <ul className="space-y-4">
              {['About Us', 'Careers', 'Partners', 'Contact'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-lg font-black mb-4 tracking-tight">Nexus Newsletter</h4>
              <p className="text-slate-500 text-xs mb-8 leading-relaxed">Receive our latest AI innovations directly in your inbox.</p>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="your@email.com" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-5 pr-14 text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-600/5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
          </div>
        </div>

        <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">© 2024 Nexus Systems. All rights reserved.</p>
          <div className="flex gap-10">
            {['Privacy', 'Terms', 'Cookies'].map(link => (
              <a key={link} href="#" className="text-[10px] text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

/**
 * FULL LANDING PAGE BUNDLE
 */
export const NexusLandingBundle: React.FC<{
  onSelect: (type: 'B2B' | 'B2C', mode: 'login' | 'signup') => void;
  isAuthenticated?: boolean;
  userType?: 'B2B' | 'B2C' | null;
  onLogout?: () => void;
  onRequestQuote?: () => void;
}> = ({ onSelect, isAuthenticated, userType, onLogout, onRequestQuote }) => {
  const [showQuoteForm, setShowQuoteForm] = React.useState(false);

  const handleRequestQuote = () => {
    if (onRequestQuote) {
      onRequestQuote();
    } else {
      setShowQuoteForm(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-900 font-sans">
      <NexusNavbar 
        isAuthenticated={isAuthenticated} 
        userType={userType} 
        onLogout={onLogout}
        onLoginClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
        onRequestQuote={handleRequestQuote}
      />
      <main>
        <NexusHero />
        <NexusAbout />
        <NexusCatalog />
        <NexusDealsSection 
          onAddToCart={(product) => console.log('Add to cart', product)}
          onViewDetails={(product) => console.log('View details', product)}
        />
        <NexusAuthSelection onSelect={onSelect} />
      </main>
      <NexusFooter />

      <AnimatePresence>
        {showQuoteForm && (
          <B2BQuoteForm 
            onClose={() => setShowQuoteForm(false)} 
            onSubmit={(data) => {
              console.log('General Quote Request Submitted:', data);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * B2B QUOTE FORM COMPONENT (Polished Version)
 */
const B2BQuoteForm: React.FC<{
  product?: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}> = ({ product, onClose, onSubmit }) => {
  const [step, setStep] = React.useState<'form' | 'success'>('form');
  const [formData, setFormData] = React.useState({
    companyName: '',
    email: '',
    quantity: '10',
    message: '',
    industry: 'Technology'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setStep('success');
      onSubmit(formData);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-4xl overflow-hidden relative z-10 border border-white/20"
      >
        {step === 'form' ? (
          <div className="flex flex-col h-full">
            <div className="bg-slate-900 p-8 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">B2B Quote Request</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Enterprise Solutions Division</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto nexus-scrollbar max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="e.g. Nexus Corp"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@company.com"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estimated Quantity</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                  >
                    <option>Technology</option>
                    <option>Manufacturing</option>
                    <option>Healthcare</option>
                    <option>Logistics</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specific Requirements</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your project..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                  />
                </div>
              </div>

              <NexusButton
                type="submit"
                className="w-full h-16 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"
              >
                <Send className="w-4 h-4" />
                Submit Quote Request
              </NexusButton>
            </form>
          </div>
        ) : (
          <div className="p-12 text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto shadow-inner ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Request Received</h3>
              <p className="text-slate-500 font-bold mt-2 leading-relaxed">
                Our Enterprise team has received your request. 
                A dedicated account manager will contact you within 2 business hours.
              </p>
            </div>
            <NexusButton onClick={onClose} className="w-full h-14 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-xl">
              Back to Site
            </NexusButton>
          </div>
        )}
      </motion.div>
    </div>
  );
};
