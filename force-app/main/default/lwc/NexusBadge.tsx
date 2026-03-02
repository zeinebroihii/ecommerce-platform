import React from 'react';
import { cn } from '../../lib/utils';

interface NexusBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  className?: string;
}

export const NexusBadge: React.FC<NexusBadgeProps> = ({ 
  children, 
  variant = 'primary', 
  className 
}) => {
  const variants = {
    primary: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    secondary: 'bg-slate-100 text-slate-600 border-slate-200',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    danger: 'bg-rose-50 text-rose-600 border-rose-100',
    ghost: 'bg-white/10 text-white border-white/20'
  };

  return (
    <span className={cn(
      'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm inline-flex items-center gap-1.5',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};