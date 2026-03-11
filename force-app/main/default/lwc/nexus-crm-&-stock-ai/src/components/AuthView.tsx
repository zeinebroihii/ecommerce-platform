import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, Lock, ArrowRight, ChevronLeft, 
  ShieldCheck, Building2, User, Sparkles,
  KeyRound, Eye, EyeOff
} from 'lucide-react';
import { cn } from '../lib/utils';

type AuthMode = 'login' | 'signup-select' | 'forgot-password' | 'set-password' | 'signup-b2c';

interface AuthViewProps {
  onLogin: (type: 'B2B' | 'B2C') => void;
  onSignUp: (type: 'B2B' | 'B2C') => void;
  initialMode?: AuthMode;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onSignUp, initialMode = 'login' }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');

  const renderLogin = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col lg:flex-row min-h-[600px]"
    >
      {/* Left: Branding/Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 p-10 flex-col justify-between relative overflow-hidden border-r border-slate-100">
        <div className="relative z-10">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-6">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-4">
            SECURE <br/>
            <span className="text-emerald-600 italic">GATEWAY.</span>
          </h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">
            Access the most advanced CRM ecosystem for modern businesses.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
              </div>
            ))}
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined by 2k+ Professionals</span>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-5" style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, #000000 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-1/2 p-10 md:p-12 flex flex-col justify-center bg-white">
        <div className="max-w-md mx-auto w-full space-y-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Welcome back!</h3>
            <p className="text-sm text-slate-500 font-medium">Log in to your Nexus ecosystem.</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin('B2C'); }}>
            <div className="space-y-3">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type="email" 
                  placeholder="Professional Email" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-sm"
                  required
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-sm"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-200 bg-slate-50 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-xs text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Remember me</span>
              </label>
              <button 
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-[10px] font-black text-emerald-600 hover:text-emerald-500 transition-colors uppercase tracking-widest"
              >
                Forgot?
              </button>
            </div>

            <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-black hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-2 group text-[10px] uppercase tracking-widest">
              Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500 font-medium">
              New to Nexus?{' '}
              <button onClick={() => setMode('signup-select')} className="text-emerald-600 font-black hover:underline uppercase tracking-widest text-[10px] ml-2">
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSignUpSelect = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full p-10 md:p-12 bg-white"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <button 
            onClick={() => setMode('login')}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest mb-6 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" /> Back to login
          </button>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Choose your profile</h2>
          <p className="text-slate-500 font-medium text-sm">A tailored experience for your needs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => onSignUp('B2B')}
            className="group p-8 bg-white border border-slate-200 rounded-[2rem] text-left hover:border-emerald-500 hover:shadow-2xl transition-all relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
                <Building2 className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Enterprise</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                Wholesale rates, fleet management, and personalized quotes for professionals.
              </p>
              <div className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-widest text-[10px]">
                Sign Up <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all" />
          </button>

          <button 
            onClick={() => setMode('signup-b2c')}
            className="group p-8 bg-white border border-slate-200 rounded-[2rem] text-left hover:border-indigo-500 hover:shadow-2xl transition-all relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                <User className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Individual</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                Direct purchase, instant tracking, and exclusive access to Nexus novelties.
              </p>
              <div className="flex items-center gap-2 text-indigo-500 font-black uppercase tracking-widest text-[10px]">
                Sign Up <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderForgotPassword = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md mx-auto p-10 md:p-12 bg-white"
    >
      <div className="text-center">
        <button 
          onClick={() => setMode('login')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest mb-6 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" /> Back
        </button>
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Recovery</h2>
        <p className="text-slate-500 font-medium text-sm">Enter your email to receive a reset link.</p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
          <input 
            type="email" 
            placeholder="Recovery Email" 
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-sm"
            required
          />
        </div>
        <button className="w-full py-4 bg-amber-600 text-white rounded-xl font-black hover:bg-amber-500 transition-all shadow-2xl shadow-amber-600/20 uppercase tracking-widest text-[10px]">
          Send link
        </button>
      </form>
    </motion.div>
  );

  const renderSetPassword = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md mx-auto p-10 md:p-12 bg-white"
    >
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full text-emerald-600 text-[9px] font-black uppercase tracking-[0.3em] mb-6">
          <Sparkles className="w-3 h-3" /> Lead Converted
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Finalize account</h2>
        <p className="text-slate-500 font-medium text-sm">Set your credentials to access the portal.</p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin('B2B'); }}>
        <div className="space-y-3">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Username" 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-sm"
              required
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="New password" 
              className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-sm"
              required
            />
          </div>
        </div>
        <button className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-600/20 uppercase tracking-widest text-[10px]">
          Activate my account
        </button>
      </form>
    </motion.div>
  );

  const renderSignUpB2C = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md mx-auto p-10 md:p-12 bg-white"
    >
      <div className="text-center">
        <button 
          onClick={() => setMode('signup-select')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest mb-6 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" /> Back
        </button>
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Create Account</h2>
        <p className="text-slate-500 font-medium text-sm">Join the Nexus ecosystem as an individual.</p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin('B2C'); }}>
        <div className="space-y-3">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Full Name" 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-sm"
              required
            />
          </div>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-sm"
              required
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-sm"
              required
            />
          </div>
        </div>
        <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/20 uppercase tracking-widest text-[10px]">
          Create my account
        </button>
      </form>
    </motion.div>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {mode === 'login' && renderLogin()}
        {mode === 'signup-select' && renderSignUpSelect()}
        {mode === 'forgot-password' && renderForgotPassword()}
        {mode === 'set-password' && renderSetPassword()}
        {mode === 'signup-b2c' && renderSignUpB2C()}
      </AnimatePresence>
    </div>
  );
};
