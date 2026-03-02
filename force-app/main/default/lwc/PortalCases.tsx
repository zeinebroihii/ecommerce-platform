import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Headphones, Send, ChevronRight, 
  AlertCircle, CheckCircle2, Paperclip 
} from 'lucide-react';
import { NexusCard } from './ui/NexusCard';
import { NexusButton } from './ui/NexusButton';
import { NexusBadge } from './ui/NexusBadge';
import { NexusInput } from './ui/NexusInput';

export const PortalCases: React.FC = () => {
  const [caseStep, setCaseStep] = useState(1);
  const [casePriority, setCasePriority] = useState('Medium');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-12">
        <div className="flex items-center justify-between">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Support & Réclamations</h2>
          <div className="flex gap-2">
            {[1, 2].map(s => (
              <div key={s} className={`w-12 h-1.5 rounded-full transition-all ${caseStep >= s ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {caseStep === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <NexusCard className="bg-slate-950 text-white border-none p-12 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/40">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-black mb-4">Nexus Agentforce</h3>
                  <p className="text-slate-400 text-lg mb-10 leading-relaxed max-w-xl">
                    Bonjour ! Je suis votre assistant intelligent. Décrivez votre problème, je peux résoudre 80% des incidents instantanément.
                  </p>
                  
                  <div className="bg-white/5 rounded-3xl p-6 border border-white/10 mb-10">
                    <div className="flex gap-4 mb-6">
                      <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-white/10 rounded-2xl p-4 text-sm text-slate-200">
                        Comment puis-je vous aider aujourd'hui ?
                      </div>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Décrivez votre problème..." 
                        className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-8 border-t border-white/10">
                    <p className="text-xs text-slate-500 font-medium italic">L'IA Nexus apprend de chaque interaction.</p>
                    <NexusButton variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => setCaseStep(2)}>
                      Contacter un expert <ChevronRight className="w-4 h-4" />
                    </NexusButton>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full -mr-48 -mt-48" />
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <NexusCard className="p-12">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">Escalation vers un Expert</h3>
                    <p className="text-sm text-slate-500">Un administrateur Nexus vous répondra sous 24h.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <NexusInput label="Sujet de la réclamation" placeholder="Ex: Problème de livraison..." />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Priorité</label>
                    <div className="flex gap-2">
                      {['Low', 'Medium', 'High', 'Critical'].map(p => (
                        <button 
                          key={p}
                          onClick={() => setCasePriority(p)}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${casePriority === p ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-200'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Description détaillée</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 h-40 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                    placeholder="Veuillez détailler votre demande..."
                  />
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer group mb-10">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-50 transition-colors">
                    <Paperclip className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 mb-1">Joindre des fichiers</p>
                  <p className="text-xs text-slate-400">PDF, JPG, PNG (Max 10MB)</p>
                </div>

                <div className="flex gap-4">
                  <NexusButton variant="outline" className="flex-1 py-4" onClick={() => setCaseStep(1)}>Retour</NexusButton>
                  <NexusButton className="flex-[2] py-4">Soumettre le ticket</NexusButton>
                </div>
              </NexusCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-8">
        <NexusCard title="Vos tickets récents" padding="md">
          <div className="space-y-6">
            {[
              { id: 'CAS-9021', status: 'En cours', date: 'Hier' },
              { id: 'CAS-8842', status: 'Résolu', date: '12 Fév' },
            ].map(c => (
              <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-white hover:shadow-xl transition-all">
                <div>
                  <div className="text-sm font-black text-slate-900">{c.id}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{c.date}</div>
                </div>
                <NexusBadge variant={c.status === 'Résolu' ? 'success' : 'warning'}>{c.status}</NexusBadge>
              </div>
            ))}
          </div>
        </NexusCard>

        <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
          <div className="relative z-10">
            <AlertCircle className="w-10 h-10 mb-6 opacity-50" />
            <h4 className="text-xl font-black mb-2">Urgence ?</h4>
            <p className="text-indigo-100 text-xs leading-relaxed mb-6">Pour les incidents critiques de production, utilisez notre ligne directe 24/7.</p>
            <NexusButton variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white text-xs py-3">
              Appeler le Support
            </NexusButton>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  );
};