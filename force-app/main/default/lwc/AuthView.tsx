import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Lock, ArrowRight, ChevronLeft,
  ShieldCheck, Building2, User, Sparkles,
  KeyRound, Eye, EyeOff, CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

type AuthMode = 'login' | 'signup-select' | 'forgot-password' | 'set-password' | 'b2c-signup';

interface AuthViewProps {
  onLogin: (type: 'B2B' | 'B2C') => void;
  onSignUp: (type: 'B2B' | 'B2C') => void;
  initialMode?: AuthMode;
  pendingType?: 'B2B' | 'B2C';
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLogin,
  onSignUp,
  initialMode = 'login',
  pendingType = 'B2C',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [activeType, setActiveType] = useState<'B2B' | 'B2C'>(pendingType);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Login form (B2B or B2C) ───────────────────────────────────────────────
  const renderLogin = () => (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md space-y-8"
    >
      <div className="text-center">
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4",
          activeType === 'B2B'
            ? "bg-indigo-50 text-indigo-600"
            : "bg-emerald-50 text-emerald-600"
        )}>
          <ShieldCheck className="w-3 h-3" />
          {activeType === 'B2B' ? 'Espace Entreprise' : 'Espace Particulier'}
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Bon retour !</h2>
        <p className="text-slate-500 font-medium">Connectez-vous à votre écosystème Nexus.</p>
      </div>

      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(activeType); }}>
        <div className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              required
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Se souvenir de moi</span>
          </label>
          <button
            type="button"
            onClick={() => setMode('forgot-password')}
            className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            Mot de passe oublié ?
          </button>
        </div>

        <button className={cn(
          "w-full py-4 text-white rounded-2xl font-black transition-all shadow-xl flex items-center justify-center gap-3 group",
          activeType === 'B2B'
            ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
            : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
        )}>
          Se Connecter <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>

      {activeType === 'B2C' && (
        <div className="text-center pt-4">
          <p className="text-slate-500 font-medium">
            Pas encore de compte ?{' '}
            <button onClick={() => setMode('b2c-signup')} className="text-emerald-600 font-black hover:underline">
              Créer un compte
            </button>
          </p>
        </div>
      )}
    </motion.div>
  );

  // ── B2C direct signup ─────────────────────────────────────────────────────
  const renderB2CSignup = () => (
    <motion.div
      key="b2c-signup"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md space-y-8"
    >
      <div className="text-center">
        <button
          onClick={() => setMode('login')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Retour à la connexion
        </button>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-4">
          <User className="w-3 h-3" /> Particulier (B2C)
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Créer un compte</h2>
        <p className="text-slate-500 font-medium">Activation immédiate — aucune validation requise.</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => { e.preventDefault(); onSignUp('B2C'); }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
            <input
              type="text"
              placeholder="Prénom"
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              required
            />
          </div>
          <div className="relative group">
            <input
              type="text"
              placeholder="Nom"
              className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              required
            />
          </div>
        </div>

        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="email"
            placeholder="Adresse email"
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            required
          />
        </div>

        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Mot de passe"
            className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirmer le mot de passe"
            className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-700 font-medium leading-relaxed">
            Votre compte sera activé immédiatement. Aucune conversion de lead n'est nécessaire.
          </p>
        </div>

        <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 group mt-2">
          Créer mon compte <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>

      <div className="text-center">
        <p className="text-slate-500 font-medium">
          Déjà un compte ?{' '}
          <button onClick={() => setMode('login')} className="text-emerald-600 font-black hover:underline">
            Se connecter
          </button>
        </p>
      </div>
    </motion.div>
  );

  // ── Profile selector (from navbar Login click) ────────────────────────────
  const renderSignUpSelect = () => (
    <motion.div
      key="signup-select"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-2xl space-y-8"
    >
      <div className="text-center">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Identifiez-vous</h2>
        <p className="text-slate-500 font-medium">Choisissez votre profil pour accéder à votre espace personnalisé.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* B2B */}
        <div className="group p-8 bg-white border border-slate-200 rounded-[2.5rem] text-left hover:border-indigo-500 hover:shadow-2xl transition-all">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
            <Building2 className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Entreprise (B2B)</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
            Tarifs de gros, gestion de commandes complexes et suivi de devis.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setActiveType('B2B'); setMode('login'); }}
              className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              Se Connecter <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSignUp('B2B')}
              className="w-full py-3 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black hover:bg-slate-50 transition-all"
            >
              Enregistrer l'entreprise
            </button>
          </div>
        </div>

        {/* B2C */}
        <div className="group p-8 bg-white border border-slate-200 rounded-[2.5rem] text-left hover:border-emerald-500 hover:shadow-2xl transition-all">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
            <User className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Particulier (B2C)</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
            Achat direct, suivi instantané et activation immédiate de votre compte.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setActiveType('B2C'); setMode('login'); }}
              className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              Se Connecter <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode('b2c-signup')}
              className="w-full py-3 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black hover:bg-slate-50 transition-all"
            >
              Créer un compte
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // ── Forgot password ───────────────────────────────────────────────────────
  const renderForgotPassword = () => (
    <motion.div
      key="forgot-password"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md space-y-8"
    >
      <div className="text-center">
        <button
          onClick={() => setMode('login')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Retour
        </button>
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <KeyRound className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Récupération</h2>
        <p className="text-slate-500 font-medium">Saisissez votre email pour recevoir un lien de réinitialisation.</p>
      </div>

      <form className="space-y-6" onSubmit={(e: React.FormEvent) => e.preventDefault()}>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="email"
            placeholder="Email de récupération"
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            required
          />
        </div>
        <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
          Envoyer le lien
        </button>
      </form>
    </motion.div>
  );

  // ── Set password (B2B post-conversion) ───────────────────────────────────
  const renderSetPassword = () => (
    <motion.div
      key="set-password"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md space-y-8"
    >
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-4">
          <Sparkles className="w-3 h-3" /> Lead Converti avec Succès
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Finalisez votre compte</h2>
        <p className="text-slate-500 font-medium">Définissez vos identifiants pour accéder au portail.</p>
      </div>

      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin('B2B'); }}>
        <div className="space-y-4">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              required
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nouveau mot de passe"
              className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              required
            />
          </div>
        </div>
        <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
          Activer mon compte
        </button>
      </form>
    </motion.div>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {mode === 'login' && renderLogin()}
        {mode === 'b2c-signup' && renderB2CSignup()}
        {mode === 'signup-select' && renderSignUpSelect()}
        {mode === 'forgot-password' && renderForgotPassword()}
        {mode === 'set-password' && renderSetPassword()}
      </AnimatePresence>
    </div>
  );
};
