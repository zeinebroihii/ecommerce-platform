import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, Package, TrendingUp, Clock, 
  ArrowUpRight, ChevronRight, Cpu
} from 'lucide-react';
import { NexusCard } from './ui/NexusCard';
import { NexusButton } from './ui/NexusButton';
import { NexusBadge } from './ui/NexusBadge';

export const PortalDashboard: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* AI Hero Card */}
      <section className="relative bg-slate-900 rounded-[3rem] p-12 text-white overflow-hidden shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-400 mb-6">
              <Cpu className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">Nexus AI Optimizer</span>
            </div>
            <h2 className="text-5xl font-black mb-6 tracking-tighter leading-none">
              OPTIMISEZ VOTRE <span className="text-indigo-400">STOCK</span> EN TEMPS RÉEL
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed font-medium">
              Notre algorithme prédictif a identifié 3 opportunités de réapprovisionnement pour vos capteurs industriels.
            </p>
            <NexusButton size="lg" className="shadow-indigo-500/40">
              Appliquer les recommandations
            </NexusButton>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
                <div className="text-indigo-400 font-black text-2xl mb-1">+24%</div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Efficacité</div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-600/20 to-transparent" />
        <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full" />
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Commandes Actives', value: '12', icon: Package, color: 'indigo' },
          { label: 'Économies Réalisées', value: '$2,450', icon: TrendingUp, color: 'emerald' },
          { label: 'Temps de Réponse', value: '1.2h', icon: Clock, color: 'amber' },
        ].map((stat, i) => (
          <NexusCard key={i} className="relative group">
            <div className={`w-12 h-12 bg-${stat.color}-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-${stat.color}-600 transition-colors`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-600 group-hover:text-white transition-colors`} />
            </div>
            <div className="text-4xl font-black text-slate-900 mb-1">{stat.value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
            <ArrowUpRight className="absolute top-8 right-8 w-5 h-5 text-slate-200 group-hover:text-indigo-600 transition-colors" />
          </NexusCard>
        ))}
      </div>

      {/* Recent Activity */}
      <NexusCard padding="none">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">Activité Récente</h3>
          <NexusButton variant="ghost" size="sm">Voir tout</NexusButton>
        </div>
        <div className="divide-y divide-slate-50">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400">
                  #00{i}
                </div>
                <div>
                  <div className="font-bold text-slate-900">Commande Nexus Industrial Sensor X1</div>
                  <div className="text-xs text-slate-400 mt-1">Il y a 2 heures • TechFlow Inc</div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <NexusBadge variant={i === 1 ? 'success' : 'primary'}>
                  {i === 1 ? 'Livré' : 'En transit'}
                </NexusBadge>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </NexusCard>
    </div>
  );
};