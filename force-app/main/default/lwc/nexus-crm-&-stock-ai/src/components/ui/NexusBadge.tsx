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
    primary: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
    secondary: 'bg-nexus-100 text-nexus-600 border-nexus-200',
    success: 'bg-accent-success/10 text-accent-success border-accent-success/20',
    warning: 'bg-accent-warning/10 text-accent-warning border-accent-warning/20',
    danger: 'bg-accent-danger/10 text-accent-danger border-accent-danger/20',
    ghost: 'bg-white/10 text-white border-white/10 backdrop-blur-md'
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
