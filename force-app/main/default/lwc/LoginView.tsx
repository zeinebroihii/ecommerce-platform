import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, User, ArrowRight, ShieldCheck, 
  ShoppingCart, Star, Zap, ChevronDown, Sparkles,
  Package, Globe, Heart
} from 'lucide-react';

interface LoginViewProps {
  onSelect: (type: 'B2B' | 'B2C', action: 'login' | 'signup') => void;
  onAddToCart: (product: any) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSelect, onAddToCart }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('All');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFamily = selectedFamily === 'All' || p.family === selectedFamily;
    return matchesSearch && matchesFamily;
  });

  const families = ['All', ...new Set(products.map(p => p.family))];

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Banner */}
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
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(79, 70, 229, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="relative overflow-hidden px-12 py-6 bg-indigo-600 text-white rounded-2xl font-black text-xl transition-all flex items-center gap-4 group shadow-2xl shadow-indigo-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span>Commencer l'aventure</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-12 py-6 bg-white/5 backdrop-blur-2xl text-white border-2 border-white/10 rounded-2xl font-black text-xl transition-all flex items-center gap-4 group"
              >
                <span>Voir les services</span>
                <Zap className="w-6 h-6 text-amber-400 group-hover:rotate-12 transition-transform" />
              </motion.button>
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
            <div className="w-1 h-2 bg-indigo-500 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Login Selection Section */}
      <section id="login-section" className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">Identifiez-vous</h2>
          <p className="text-lg text-slate-500">Choisissez votre profil pour accéder à votre espace personnalisé</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          <motion.div
            whileHover={{ y: -5 }}
            className="group relative p-10 bg-white rounded-[2.5rem] border border-slate-200 hover:border-indigo-500 transition-all text-left shadow-sm hover:shadow-2xl overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 transition-colors">
                <Building2 className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-3">Entreprise (B2B)</h3>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Accédez aux tarifs de gros, gérez vos commandes complexes et suivez vos devis.
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => onSelect('B2B', 'login')}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  Se Connecter <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onSelect('B2B', 'signup')}
                  className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  Enregistrer l'entreprise
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors" />
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="group relative p-10 bg-white rounded-[2.5rem] border border-slate-200 hover:border-emerald-500 transition-all text-left shadow-sm hover:shadow-2xl overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 transition-colors">
                <User className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-3">Particulier (B2C)</h3>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Achat direct, suivi de commande instantané et activation immédiate de votre compte.
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => onSelect('B2C', 'login')}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                >
                  Se Connecter <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onSelect('B2C', 'signup')}
                  className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  Créer un compte
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-100 transition-colors" />
          </motion.div>
        </div>
      </section>

      {/* Astonishing Products Section */}
      <section id="products-section" className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-indigo-500 font-black uppercase tracking-[0.3em] text-[10px] mb-6">
              <div className="w-10 h-[2px] bg-indigo-500" />
              Solutions Technologiques
            </div>
            <h2 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
              CATALOGUE <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">PRODUITS</span>
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <ShoppingCart className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-full sm:w-64 shadow-sm"
              />
            </div>
            <select 
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              className="px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            >
              {families.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 overflow-hidden">
                <div className="relative h-72 overflow-hidden bg-slate-50">
                  <img 
                    src={product.image} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                    alt={product.name}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute top-6 right-6 flex flex-col gap-3 translate-x-12 group-hover:translate-x-0 transition-transform duration-500 delay-75">
                    <button className="p-3 bg-white/90 backdrop-blur-xl rounded-2xl text-slate-400 hover:text-rose-500 shadow-xl transition-all">
                      <Heart className="w-5 h-5" />
                    </button>
                    <button className="p-3 bg-white/90 backdrop-blur-xl rounded-2xl text-slate-400 hover:text-indigo-600 shadow-xl transition-all">
                      <Zap className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="absolute bottom-6 left-6">
                    <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                      {product.family}
                    </span>
                  </div>
                </div>
                
                <div className="p-10">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs text-slate-400 font-black ml-2">4.9</span>
                  </div>
                  
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">
                    {product.productCode}
                  </div>

                  <h4 className="text-2xl font-black text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                    {product.name}
                  </h4>
                  
                  <p className="text-sm text-slate-500 font-medium mb-8 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Investissement</span>
                      <span className="text-3xl font-black text-slate-900">${product.price}</span>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onAddToCart(product)}
                      className="p-5 bg-slate-950 text-white rounded-[1.5rem] hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-950/20 group-hover:shadow-indigo-500/40"
                    >
                      <ShoppingCart className="w-6 h-6" />
                    </motion.button>
                  </div>
                </div>
              </div>
              
              {/* Decorative background glow on hover */}
              <div className="absolute -inset-4 bg-indigo-500/5 rounded-[4rem] -z-10 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100">
        <div className="flex flex-wrap items-center justify-center gap-12 opacity-30 grayscale">
          <div className="flex items-center gap-2 font-black text-2xl italic"><Globe className="w-6 h-6" /> GLOBAL</div>
          <div className="flex items-center gap-2 font-black text-2xl italic"><Package className="w-6 h-6" /> LOGISTICS</div>
          <div className="flex items-center gap-2 font-black text-2xl italic"><Zap className="w-6 h-6" /> ENERGY</div>
          <div className="flex items-center gap-2 font-black text-2xl italic"><ShieldCheck className="w-6 h-6" /> SECURE</div>
        </div>
      </section>
    </div>
  );
};
