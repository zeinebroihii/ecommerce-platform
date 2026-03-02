import React from 'react';
import { cn } from '../../lib/utils';

interface NexusInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const NexusInput: React.FC<NexusInputProps> = ({ 
  label, 
  icon, 
  className, 
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input 
          className={cn(
            'w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pr-6 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium placeholder:text-slate-400',
            icon ? 'pl-12' : 'pl-6',
            className
          )}
          {...props}
        />
      </div>
    </div>
  );
};