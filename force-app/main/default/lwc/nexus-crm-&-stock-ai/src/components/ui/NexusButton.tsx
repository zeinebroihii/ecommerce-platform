import React from 'react';
import { cn } from '../../lib/utils';

interface NexusButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const NexusButton: React.FC<NexusButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}) => {
  const variants = {
    primary: 'bg-accent-primary text-white hover:bg-accent-primary/90 shadow-lg shadow-accent-primary/20',
    secondary: 'bg-nexus-900 text-white hover:bg-nexus-800 shadow-xl shadow-nexus-900/10',
    outline: 'bg-white border border-nexus-200 text-nexus-600 hover:bg-nexus-50 shadow-sm',
    ghost: 'text-nexus-500 hover:bg-nexus-100',
    danger: 'bg-accent-danger text-white hover:bg-accent-danger/90 shadow-xl shadow-accent-danger/20'
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px] uppercase tracking-widest',
    md: 'px-6 py-3 text-[11px] uppercase tracking-widest',
    lg: 'px-8 py-4 text-xs uppercase tracking-widest',
    xl: 'px-12 py-6 text-sm uppercase tracking-widest'
  };

  return (
    <button 
      className={cn(
        'rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
