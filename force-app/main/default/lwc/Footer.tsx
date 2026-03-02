import React, { useState } from 'react';
import { Zap, Globe, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  return (
    <footer className="border-t border-slate-200 bg-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-24">

          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">Nexus CRM</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              L'écosystème CRM le plus avancé pour les entreprises modernes. Propulsé par l'intelligence artificielle Agentforce.
            </p>
            <div className="flex gap-4">
              {['Twitter', 'LinkedIn', 'GitHub'].map(social => (
                <button
                  key={social}
                  aria-label={social}
                  className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  <Globe className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Solutions</h4>
            <ul className="space-y-4">
              {['Gestion de Stock', 'Analyse Prédictive', 'IoT Intégration', 'Support AI'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Entreprise</h4>
            <ul className="space-y-4">
              {['À Propos', 'Carrières', 'Partenaires', 'Contact'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="p-8 bg-slate-950 rounded-[2.5rem] text-white relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-lg font-black mb-4">Nexus Newsletter</h4>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Recevez nos dernières innovations AI directement dans votre boîte mail.
              </p>
              <div className="relative">
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  onClick={() => setEmail('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full -mr-16 -mt-16" />
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-slate-400 font-medium">© 2024 Nexus Systems. Tous droits réservés.</p>
          <div className="flex gap-8">
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">Confidentialité</a>
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">CGU</a>
            <a href="#" className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
