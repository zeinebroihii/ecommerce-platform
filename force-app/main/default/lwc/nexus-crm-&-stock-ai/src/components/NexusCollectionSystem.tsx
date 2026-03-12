import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, ShoppingCart, ArrowRight, 
  Sparkles, ShieldCheck, Zap, Info, ChevronRight,
  Package, Star, Heart, Layers, Cpu, Globe,
  Building2, Mail, Hash, MessageSquare, CheckCircle2,
  X, Send, FileText
} from 'lucide-react';
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * UTILITIES
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * TYPES
 */
export interface Product {
  id: string;
  name: string;
  productCode: string;
  family: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  features: string[];
  isNew?: boolean;
  isPopular?: boolean;
  isActive?: boolean;
  stockLevel?: number;
  recommendedStock?: number;
  status?: string;
  unitOfMeasure?: string;
  specs?: Record<string, string>;
  colors?: { name: string; hex: string; image: string }[];
}

/**
 * UI COMPONENTS (Internal for reusability)
 */
const NexusCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}> = ({ children, className, title, padding = 'md' }) => (
  <div className={cn(
    "bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500",
    className
  )}>
    {title && (
      <div className="px-8 py-6 border-b border-slate-50">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h3>
      </div>
    )}
    <div className={cn(
      padding === 'none' ? 'p-0' : 
      padding === 'sm' ? 'p-4' : 
      padding === 'md' ? 'p-8' : 'p-12'
    )}>
      {children}
    </div>
  </div>
);

const NexusButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}> = ({ children, onClick, variant = 'primary', size = 'md', className, disabled, type = 'button' }) => {
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200",
    outline: "bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-50"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3 text-xs",
    lg: "px-8 py-4 text-sm"
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-xl font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
};

const NexusBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'secondary';
  className?: string;
}> = ({ children, variant = 'primary', className }) => {
  const variants = {
    primary: "bg-indigo-50 text-indigo-600 border-indigo-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    secondary: "bg-slate-50 text-slate-500 border-slate-100"
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

/**
 * B2B QUOTE FORM COMPONENT
 */
const B2BQuoteForm: React.FC<{
  product?: Product;
  onClose: () => void;
  onSubmit: (data: any) => void;
}> = ({ product, onClose, onSubmit }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
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
              {product && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <img src={product.image} className="w-16 h-16 rounded-xl object-cover shadow-sm" alt={product.name} />
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase italic">{product.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product ID: {product.productCode}</p>
                  </div>
                </div>
              )}

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
                Our Enterprise team has received your request{product ? <> for <span className="text-slate-900">{product.name}</span></> : ' for our services'}. 
                A dedicated account manager will contact you within 2 business hours.
              </p>
            </div>
            <NexusButton onClick={onClose} className="w-full h-14 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-xl">
              Back to Catalog
            </NexusButton>
          </div>
        )}
      </motion.div>
    </div>
  );
};

/**
 * PRODUCT DETAIL MODAL COMPONENT
 */
const ProductDetailModal: React.FC<{
  product: Product | null;
  onClose: () => void;
  onToggleFavorite?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  favorites?: Product[];
}> = ({ product, onClose, onToggleFavorite, onAddToCart, favorites = [] }) => {
  const [activeColor, setActiveColor] = useState<{ name: string; hex: string; image: string } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  const isFavorited = product ? favorites.some(f => f.id === product.id) : false;

  useEffect(() => {
    if (product?.colors?.[0]) {
      setActiveColor(product.colors[0]);
    } else {
      setActiveColor(null);
    }
  }, [product]);

  if (!product) return null;

  const currentImage = activeColor?.image || product.image;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="w-full max-w-4xl bg-white rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col lg:flex-row relative z-10 max-h-[85vh] border border-white/20 transition-colors duration-500"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-slate-100/80 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all z-50 shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-full lg:w-1/2 bg-slate-50 p-6 md:p-8 flex flex-col justify-center relative overflow-hidden group/viewer transition-colors duration-500">
            <div className="relative z-10 flex flex-col items-center">
              <div className="absolute top-0 left-0 flex items-center gap-2 px-2 py-0.5 bg-white/50 backdrop-blur-md rounded-full border border-white/50 text-[7px] font-black uppercase tracking-widest text-slate-400">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                Interactive 3D Preview
              </div>

              <motion.div 
                style={{ perspective: 1000 }}
                className="w-full max-w-[280px] aspect-square relative"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / rect.width - 0.5;
                  setRotation(x * 40);
                }}
                onMouseLeave={() => setRotation(0)}
              >
                <motion.div
                  animate={{ rotateY: rotation, y: [0, -6, 0] }}
                  transition={{ 
                    rotateY: { type: 'spring', stiffness: 100, damping: 20 },
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="w-full h-full relative"
                >
                  <div 
                    className="absolute inset-0 rounded-[2rem] blur-3xl opacity-20 transition-colors duration-500"
                    style={{ backgroundColor: activeColor?.hex || '#6366f1' }}
                  />
                  <div className="w-full h-full rounded-[2rem] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.1)] ring-[8px] ring-white relative">
                    <img src={currentImage} className="w-full h-full object-cover" alt={product.name} />
                  </div>
                </motion.div>
              </motion.div>

              {product.colors && (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400">Select Configuration</span>
                  <div className="flex gap-2">
                    {product.colors.map(color => (
                      <button
                        key={color.hex}
                        onClick={() => setActiveColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 relative group/color",
                          activeColor?.hex === color.hex ? "border-slate-900 scale-110 shadow-lg" : "border-white"
                        )}
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-1/2 p-6 md:p-8 overflow-y-auto nexus-scrollbar bg-white transition-colors duration-500">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <NexusBadge className="bg-slate-900 text-white border-none px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20">
                  {product.family || 'Technology'}
                </NexusBadge>
                <NexusBadge className="bg-emerald-500 text-white border-none px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20">
                  New Gen
                </NexusBadge>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2 uppercase italic">
                {product.name}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={cn("w-2.5 h-2.5", i <= 4 ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                    ))}
                  </div>
                  <span className="text-xs font-black text-slate-900">4.9</span>
                </div>
                <div className="h-3 w-[1px] bg-slate-200" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Verified Architecture</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 italic">${product.price}</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Excl. VAT</span>
              </div>

              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {product.description}
              </p>

              <div className="space-y-2">
                <h4 className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400">Core Capabilities</h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {(product.features || ['AI-Driven Optimization', 'Real-time Analytics', 'Quantum Encryption']).map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-900/30 hover:bg-white transition-all group">
                      <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20 group-hover:scale-110 transition-transform">
                        <Zap className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                <div className="flex gap-2">
                  <NexusButton 
                    onClick={() => product && onToggleFavorite?.(product)}
                    className={cn(
                      "flex-1 h-12 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all flex items-center justify-center gap-2",
                      isFavorited ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", isFavorited ? "fill-white scale-110" : "")} />
                    {isFavorited ? 'Favorited' : 'Favorite'}
                  </NexusButton>

                  <NexusButton 
                    onClick={() => {
                      if (product) {
                        onAddToCart?.(product);
                        onClose();
                      }
                    }}
                    className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </NexusButton>
                </div>

                <NexusButton 
                  onClick={() => setShowQuoteForm(true)}
                  className="w-full h-12 rounded-xl border-2 border-slate-900 text-slate-900 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Request B2B Quote
                </NexusButton>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showQuoteForm && product && (
            <B2BQuoteForm 
              product={product} 
              onClose={() => setShowQuoteForm(false)} 
              onSubmit={(data) => {
                console.log('Quote Request Submitted:', data);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>,
    document.body
  );
};

/**
 * MOCK DATA
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'pc-1',
    name: 'Nexus Pro-Station G1',
    productCode: 'PC-G1',
    family: 'Computing',
    price: 2499,
    rating: 5.0,
    reviews: 156,
    image: 'https://picsum.photos/seed/pc-black/800/800',
    description: 'The ultimate workstation for high-performance computing. Available in three distinct finishes.',
    features: ['RTX 5090 Ready', '128GB DDR5', 'Liquid Cooled'],
    isNew: true,
    isActive: true,
    stockLevel: 12,
    recommendedStock: 15,
    status: 'In Stock',
    unitOfMeasure: 'Unit',
    specs: { 'CPU': 'Nexus Quantum X1', 'GPU': 'RTX 5090', 'RAM': '128GB' },
    colors: [
      { name: 'Black', hex: '#000000', image: 'https://picsum.photos/seed/pc-black/800/800' },
      { name: 'White', hex: '#ffffff', image: 'https://picsum.photos/seed/pc-white/800/800' },
      { name: 'Gray', hex: '#64748b', image: 'https://picsum.photos/seed/pc-gray/800/800' }
    ]
  },
  {
    id: '1',
    name: 'Nexus Core Hub v3',
    productCode: 'NX-100',
    family: 'Central Systems',
    price: 1299,
    rating: 4.9,
    reviews: 128,
    image: 'https://picsum.photos/seed/hub/800/800',
    description: 'The ultimate central intelligence unit for your industrial ecosystem. Powered by Nexus Neural Engine.',
    features: ['AI-Driven Optimization', 'Real-time Analytics', 'Quantum Encryption'],
    isActive: true,
    stockLevel: 45,
    recommendedStock: 50,
    status: 'In Stock',
    unitOfMeasure: 'Unit',
    specs: { 'Processor': 'Nexus N2 Chip', 'Connectivity': '5G / Wi-Fi 7', 'Power': 'Solar-Ready' },
    colors: [
      { name: 'Titanium', hex: '#475569', image: 'https://picsum.photos/seed/hub/800/800' },
      { name: 'Midnight', hex: '#0f172a', image: 'https://picsum.photos/seed/hub-dark/800/800' }
    ]
  },
  {
    id: '2',
    name: 'Neural Sensor Pack',
    productCode: 'NX-200',
    family: 'Sensors',
    price: 499,
    rating: 4.8,
    reviews: 85,
    image: 'https://picsum.photos/seed/sensor/800/800',
    description: 'High-precision environmental sensors with edge-computing capabilities for instant data processing.',
    features: ['Ultra-low Latency', 'Self-Calibrating', 'IP68 Rated'],
    isPopular: true,
    isActive: true,
    stockLevel: 120,
    recommendedStock: 100,
    status: 'In Stock',
    unitOfMeasure: 'Pack',
    specs: { 'Accuracy': '±0.01%', 'Range': '500m', 'Battery': '5 Years' }
  },
  {
    id: '3',
    name: 'Quantum Link Bridge',
    productCode: 'NX-300',
    family: 'Connectivity',
    price: 899,
    rating: 5.0,
    reviews: 42,
    image: 'https://picsum.photos/seed/bridge/800/800',
    description: 'Seamlessly bridge your legacy systems with the Nexus ecosystem using our quantum-secure gateway.',
    features: ['Legacy Support', 'Zero-Trust Security', 'Auto-Scaling'],
    isActive: true,
    stockLevel: 15,
    recommendedStock: 20,
    status: 'Low Stock',
    unitOfMeasure: 'Unit',
    specs: { 'Throughput': '100 Gbps', 'Security': 'AES-512', 'Latency': '<1ms' }
  },
  {
    id: '4',
    name: 'Nexus Vision Pro',
    productCode: 'NX-400',
    family: 'Monitoring',
    price: 1599,
    rating: 4.7,
    reviews: 210,
    image: 'https://picsum.photos/seed/vision/800/800',
    description: 'Advanced visual monitoring system with integrated AI for anomaly detection and predictive maintenance.',
    features: ['8K Resolution', 'Night Vision', 'Object Tracking'],
    isNew: true,
    isActive: true,
    stockLevel: 8,
    recommendedStock: 15,
    status: 'Low Stock',
    unitOfMeasure: 'Unit',
    specs: { 'Resolution': '8K Ultra HD', 'FOV': '180°', 'AI Engine': 'VisionX' }
  },
  {
    id: '5',
    name: 'Eco-Pulse Monitor',
    productCode: 'NX-500',
    family: 'Sustainability',
    price: 299,
    rating: 4.9,
    reviews: 67,
    image: 'https://picsum.photos/seed/pulse/800/800',
    description: 'Track your carbon footprint and energy efficiency in real-time with the Eco-Pulse ecosystem.',
    features: ['CO2 Tracking', 'Energy Insights', 'Auto-Reporting'],
    isPopular: true,
    isActive: true,
    stockLevel: 200,
    recommendedStock: 150,
    status: 'In Stock',
    unitOfMeasure: 'Unit',
    specs: { 'Precision': 'High', 'Integration': 'Universal', 'Eco-Score': 'A+' }
  }
];

/**
 * MAIN COMPONENT: NexusCollectionSystem
 */
export const NexusCollectionSystem: React.FC<{
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  favorites?: Product[];
}> = ({ onAddToCart, onToggleFavorite, favorites = [] }) => {
  const [selectedFamily, setSelectedFamily] = useState('All');
  const [selectedColor, setSelectedColor] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quoteProduct, setQuoteProduct] = useState<Product | null>(null);

  const families = ['All', ...Array.from(new Set(MOCK_PRODUCTS.map(p => p.family)))];
  const allColors = ['All', ...Array.from(new Set(MOCK_PRODUCTS.flatMap(p => p.colors?.map(c => c.name) || [])))];

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const matchesFamily = selectedFamily === 'All' || p.family === selectedFamily;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesColor = selectedColor === 'All' || p.colors?.some(c => c.name === selectedColor);
    return matchesFamily && matchesSearch && matchesColor;
  });

  return (
    <div className="space-y-12 pb-24">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 min-h-[400px] flex items-center shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img src="https://picsum.photos/seed/industrial-tech/1920/1080" className="w-full h-full object-cover opacity-40" alt="Background" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>

        <div className="relative z-10 px-8 md:px-16 py-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Nexus Collection 2024</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-6 text-white uppercase italic"
          >
            Premium Tech <br /> <span className="text-indigo-400">Excellence.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-slate-300 font-medium leading-relaxed mb-10 max-w-lg"
          >
            Discover our elite selection of high-performance industrial solutions. Engineered for precision, built for the future.
          </motion.p>
          
          <div className="flex flex-wrap gap-4">
            <NexusButton className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-600/40 border-none">
              New Arrivals
            </NexusButton>
            <NexusButton variant="outline" className="h-14 px-10 rounded-2xl border-white/20 text-white hover:bg-white hover:text-slate-900 font-black uppercase tracking-widest text-[10px] backdrop-blur-sm">
              View All Specs
            </NexusButton>
          </div>
        </div>

        <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden xl:block">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="p-8 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl"
          >
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white italic">99.9%</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Uptime Guaranteed</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white italic">ISO 27001</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Security Certified</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-6 sticky top-4 z-30 bg-slate-50/80 backdrop-blur-xl p-4 md:p-6 rounded-[2.5rem] border border-slate-200/50 shadow-2xl shadow-slate-200/20">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">Family</span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {families.map(family => (
                <button
                  key={family}
                  onClick={() => setSelectedFamily(family)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    selectedFamily === family 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                      : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  {family}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, index) => {
            const matchedColor = product.colors?.find(c => c.name === selectedColor);
            const displayImage = matchedColor?.image || product.image;

            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <NexusCard className="group relative h-full flex flex-col overflow-hidden border-slate-200/60 hover:border-indigo-600/30 hover:shadow-3xl transition-all duration-500">
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <img src={displayImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                      {product.isNew && <NexusBadge className="bg-emerald-500 text-white border-none px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">New</NexusBadge>}
                      {product.isPopular && <NexusBadge className="bg-amber-500 text-white border-none px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Popular</NexusBadge>}
                    </div>

                    <button 
                      onClick={() => setSelectedProduct(product)}
                      className="absolute bottom-4 right-4 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl translate-y-20 group-hover:translate-y-0 transition-all duration-500 hover:bg-indigo-500 hover:scale-110 z-20"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.(product);
                      }}
                      className={cn(
                        "absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 z-20",
                        favorites.some(f => f.id === product.id)
                          ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                          : "bg-white/80 backdrop-blur-md text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <Heart className={cn("w-5 h-5", favorites.some(f => f.id === product.id) && "fill-current")} />
                    </button>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                        {product.family}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-black text-slate-900">{product.rating}</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Price</span>
                          <span className="text-lg font-black text-slate-900">${product.price}</span>
                        </div>
                        <NexusButton 
                          variant="outline"
                          onClick={() => onAddToCart?.(product)}
                          className="h-10 px-5 rounded-xl border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white font-black uppercase tracking-widest text-[9px] transition-all"
                        >
                          Add to Cart
                        </NexusButton>
                      </div>
                      <NexusButton 
                        variant="outline"
                        onClick={() => setQuoteProduct(product)}
                        className="w-full h-10 rounded-xl border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-black uppercase tracking-widest text-[9px] transition-all"
                      >
                        Request Quote
                      </NexusButton>
                    </div>
                  </div>
                </NexusCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <ProductDetailModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onToggleFavorite={onToggleFavorite}
        onAddToCart={onAddToCart}
        favorites={favorites}
      />

      <AnimatePresence>
        {quoteProduct && (
          <B2BQuoteForm 
            product={quoteProduct} 
            onClose={() => setQuoteProduct(null)} 
            onSubmit={(data) => console.log('Quote Request Submitted:', data)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NexusCollectionSystem;
