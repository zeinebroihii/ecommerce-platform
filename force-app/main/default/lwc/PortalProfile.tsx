import React from 'react';
import { 
  User, Camera, Shield, Mail, 
  Phone, MapPin, CheckCircle2 
} from 'lucide-react';
import { NexusCard } from './ui/NexusCard';
import { NexusButton } from './ui/NexusButton';
import { NexusBadge } from './ui/NexusBadge';
import { NexusInput } from './ui/NexusInput';

interface PortalProfileProps {
  userType: 'B2B' | 'B2C' | null;
}

export const PortalProfile: React.FC<PortalProfileProps> = ({ userType }) => {
  return (
    <div className="max-w-5xl space-y-12">
      <div className="flex items-end gap-10">
        <div className="relative group">
          <div className="w-48 h-48 bg-slate-100 rounded-[3.5rem] flex items-center justify-center border-8 border-white shadow-2xl overflow-hidden">
            <User className="w-20 h-20 text-slate-300" />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="pb-4">
          <NexusBadge variant="success" className="mb-4">Compte Vérifié</NexusBadge>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
            {userType === 'B2B' ? 'TechFlow Inc.' : 'Jean Dupont'}
          </h2>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <Mail className="w-4 h-4" /> {userType === 'B2B' ? 'contact@techflow.com' : 'jean.dupont@gmail.com'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <NexusCard title="Informations Générales">
          <div className="space-y-6">
            <NexusInput label="Nom Complet / Entreprise" defaultValue={userType === 'B2B' ? 'TechFlow Inc.' : 'Jean Dupont'} />
            <NexusInput label="Email" defaultValue={userType === 'B2B' ? 'contact@techflow.com' : 'jean.dupont@gmail.com'} />
            <NexusInput label="Téléphone" defaultValue="+33 6 12 34 56 78" icon={<Phone className="w-4 h-4" />} />
          </div>
        </NexusCard>

        <NexusCard title="Sécurité">
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Mot de passe</div>
                  <div className="text-xs text-slate-400">Dernière modification : il y a 3 mois</div>
                </div>
              </div>
              <NexusButton variant="outline" size="sm">Modifier</NexusButton>
            </div>
            <NexusButton className="w-full py-4">Mettre à jour le profil</NexusButton>
          </div>
        </NexusCard>

        <NexusCard title="Localisation" className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NexusInput label="Adresse" defaultValue="123 Avenue de l'Innovation" icon={<MapPin className="w-4 h-4" />} />
            <NexusInput label="Ville" defaultValue="Paris" />
            <NexusInput label="Code Postal" defaultValue="75001" />
          </div>
        </NexusCard>
      </div>
    </div>
  );
};