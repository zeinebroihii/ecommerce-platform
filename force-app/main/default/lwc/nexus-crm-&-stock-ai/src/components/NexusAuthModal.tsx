import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { AuthView } from './AuthView';
import { LeadForm } from './LeadForm';

interface NexusAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (type: 'B2B' | 'B2C') => void;
  onSignUp: (type: 'B2B' | 'B2C') => void;
  onRegisterSuccess?: () => void;
  initialMode?: 'login' | 'signup-select' | 'forgot-password' | 'set-password' | 'b2b-register' | 'signup-b2c';
}

export const NexusAuthModal: React.FC<NexusAuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onLogin, 
  onSignUp,
  onRegisterSuccess,
  initialMode = 'signup-select'
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-slate-200 transition-colors duration-500"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all z-50 border border-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-h-[85vh] overflow-y-auto nexus-scrollbar">
              {initialMode === 'b2b-register' ? (
                <div className="p-0">
                  <LeadForm onSubmit={() => {
                    onRegisterSuccess?.();
                    onClose();
                  }} />
                </div>
              ) : (
                <div className="p-0">
                  <AuthView 
                    onLogin={(type) => {
                      onLogin(type);
                      onClose();
                    }}
                    onSignUp={(type) => {
                      onSignUp(type);
                    }}
                    initialMode={initialMode}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
