import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Building2, Mail, Hash, MessageSquare, CheckCircle2 } from 'lucide-react';
import { NexusButton } from './ui/NexusButton';
import { Product } from '../types';
import { cn } from '../lib/utils';

interface B2BQuoteFormProps {
  product?: Product;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const B2BQuoteForm: React.FC<B2BQuoteFormProps> = ({ product, onClose, onSubmit }) => {
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
    // Simulate API call
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {product.productCode ? `Code: ${product.productCode}` : `Product ID: NX-${product.id}00`}
                    </p>
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
                A dedicated account manager will contact you at <span className="text-indigo-600 underline">{formData.email}</span> within 2 business hours.
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
