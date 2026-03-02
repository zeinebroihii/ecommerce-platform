import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Zap } from 'lucide-react';
import { NexusButton } from './ui/NexusButton';

export const Hero: React.FC = () => {
  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden rounded-[3.5rem] bg-slate-950 mx-6 mt-6 shadow-2xl shadow-indigo-500/10">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/seed/future-tech/1920/1080?blur=1" 
          className="w-full h-full object-cover opacity-50 scale-105"
          alt="Hero Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/60 to-indigo-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.15),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-10 backdrop-blur-xl shadow-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            L'Élite du CRM Intelligent
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.85] mb-10">
            NEXUS <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 drop-shadow-sm">
              SYSTEMS
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-16 font-medium leading-relaxed">
            L'architecture ultime pour vos flux B2B & B2C. <br className="hidden md:block"/> 
            Une expérience sans couture, propulsée par l'intelligence Nexus.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <NexusButton 
              size="xl"
              onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="group"
            >
              <span>Commencer l'aventure</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </NexusButton>

            <NexusButton 
              variant="outline"
              size="xl"
              onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white/5 backdrop-blur-2xl text-white border-2 border-white/10 group"
            >
              <span>Voir les services</span>
              <Zap className="w-6 h-6 text-amber-400 group-hover:rotate-12 transition-transform" />
            </NexusButton>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Explorer</span>
        <motion.div 
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/10 rounded-full flex justify-center p-1"
        >
          <div className="w-1 h-2 bg-indigo-50 rounded-full" />
        </motion.div>
      </div>
    </section>
  );
};