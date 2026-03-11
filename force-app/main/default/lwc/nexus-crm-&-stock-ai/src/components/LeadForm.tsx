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
      <div className="w-full py-24 px-8 text-center bg-white transition-colors duration-500">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </motion.div>
        <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter uppercase italic transition-colors duration-500">Application Received!</h2>
        <p className="text-slate-500 text-lg leading-relaxed font-medium max-w-md mx-auto transition-colors duration-500">
          Thank you for your trust. Our team is analyzing your profile <strong>{formData.companyName}</strong>. 
          Your access credentials will be sent to you by email within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white transition-colors duration-500">
      <div className="overflow-hidden">
        <div className="bg-slate-900 p-6 md:p-8 text-white relative overflow-hidden transition-colors duration-500">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-0.5 bg-indigo-500 rounded-full text-[9px] font-bold uppercase tracking-widest transition-colors duration-500">Step {step} of 2</div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight transition-colors duration-500">
              {step === 1 ? 'Personal Information' : 'Your Company'}
            </h2>
            <p className="text-slate-400 mt-1 text-sm transition-colors duration-500">
              {step === 1 ? 'Tell us who you are to personalize your experience.' : 'Tell us about your organization to adapt our offers.'}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl" />
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">Gender</label>
                    <select name="gender" onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm">
                      <option value="">Select</option>
                      <option value="M">Mr.</option>
                      <option value="F">Ms.</option>
                      <option value="O">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">First Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                      <input name="firstName" required onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm" placeholder="John" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                      <input name="lastName" required onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm" placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">Professional Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                      <input name="email" type="email" required onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm" placeholder="john.doe@company.com" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                      <input name="phone" type="tel" required onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm" placeholder="+1 000 000 0000" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">Responsibility / Role</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                      <input name="responsibility" required onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm" placeholder="Purchasing Director" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="button" onClick={() => setStep(2)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 text-sm">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                      <input name="companyName" required onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm" placeholder="Nexus Systems" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">Industry</label>
                    <select name="industry" required onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm">
                      <option value="">Select</option>
                      <option>Technology</option>
                      <option>Industry</option>
                      <option>Services</option>
                      <option>Health</option>
                      <option>Finance</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">Number of Employees</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                      <input name="employeeCount" type="number" required onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm" placeholder="500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">Annual Revenue ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                      <input name="annualRevenue" type="number" required onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm" placeholder="1000000" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">Country</label>
                    <div className="relative">
                      <Flag className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                      <input name="country" required onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm" placeholder="USA" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                      <input name="city" required onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm" placeholder="New York" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">State / Province</label>
                    <div className="relative">
                      <Map className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                      <input name="state" required onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm" placeholder="NY" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 transition-colors duration-500">Zip Code</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                      <input name="zip" required onChange={handleChange} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 text-sm" placeholder="10001" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <button type="button" onClick={() => setStep(1)} className="px-6 py-3 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center gap-2 text-sm">
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 text-sm">
                    Finalize Registration <CheckCircle2 className="w-4 h-4" />
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
