import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Mail, CheckCircle2, 
  User, Phone, Briefcase, DollarSign, MapPin, Flag, 
  Map, Hash, ChevronRight, ChevronLeft, Users
} from 'lucide-react';

interface LeadFormProps {
  onSubmit: (data: any) => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    gender: '', firstName: '', lastName: '', email: '', phone: '', responsibility: '',
    companyName: '', industry: '', employeeCount: '', annualRevenue: '',
    country: '', city: '', state: '', zip: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => onSubmit(formData), 2000);
      }
    } catch (error) {
      console.error('Failed to submit lead:', error);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Application Received!</h2>
        <p className="text-slate-500 text-lg leading-relaxed">
          Merci pour votre confiance. Notre équipe analyse votre profil <strong>{formData.companyName}</strong>. 
          Vos identifiants d'accès vous seront envoyés par email sous 24h.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 bg-indigo-500 rounded-full text-[10px] font-bold uppercase tracking-widest">Step {step} of 2</div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              {step === 1 ? 'Informations Personnelles' : 'Votre Entreprise'}
            </h2>
            <p className="text-slate-400 mt-2">
              {step === 1 ? 'Dites-nous qui vous êtes pour personnaliser votre expérience.' : 'Parlez-nous de votre structure pour adapter nos offres.'}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        </div>
        
        <form onSubmit={handleSubmit} className="p-10">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Genre</label>
                    <select name="gender" onChange={handleChange} className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50">
                      <option value="">Sélectionner</option>
                      <option value="M">Monsieur</option>
                      <option value="F">Madame</option>
                      <option value="O">Autre</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Prénom</label>
                    <div className="relative">
                      <User className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <input name="firstName" required onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50" placeholder="Jean" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nom</label>
                    <div className="relative">
                      <User className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <input name="lastName" required onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50" placeholder="Dupont" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email Professionnel</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <input name="email" type="email" required onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50" placeholder="jean.dupont@entreprise.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Numéro de Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <input name="phone" type="tel" required onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50" placeholder="+33 6 00 00 00 00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Responsabilité / Poste</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <input name="responsibility" required onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50" placeholder="Directeur Achats" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setStep(2)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100">
                    Suivant <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nom de l'entreprise</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <input name="companyName" required onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50" placeholder="Nexus Systems" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Secteur d'activité</label>
                    <select name="industry" required onChange={handleChange} className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50">
                      <option value="">Sélectionner</option>
                      <option>Technologie</option>
                      <option>Industrie</option>
                      <option>Services</option>
                      <option>Santé</option>
                      <option>Finance</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nombre de salariés</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <input name="employeeCount" type="number" required onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50" placeholder="500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Revenue Annuel (€)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <input name="annualRevenue" type="number" required onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50" placeholder="1000000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Pays</label>
                    <div className="relative">
                      <Flag className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <input name="country" required onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50" placeholder="France" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Ville</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <input name="city" required onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50" placeholder="Paris" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">État / Province</label>
                    <div className="relative">
                      <Map className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <input name="state" required onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50" placeholder="Île-de-France" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Code Postal (ZIP)</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <input name="zip" required onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50" placeholder="75001" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <button type="button" onClick={() => setStep(1)} className="px-8 py-4 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all flex items-center gap-2">
                    <ChevronLeft className="w-5 h-5" /> Précédent
                  </button>
                  <button type="submit" className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100">
                    Finaliser l'inscription <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
};
