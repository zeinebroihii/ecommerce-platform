import React from 'react';
import { cn } from '../../lib/utils';

interface NexusCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export const NexusCard: React.FC<NexusCardProps> = ({ 
  children, 
  title,
  className, 
  hoverable = true,
  padding = 'lg',
  onClick
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
      'bg-white rounded-3xl border border-nexus-200 shadow-sm transition-all duration-500 overflow-hidden',
      hoverable && 'hover:shadow-2xl hover:-translate-y-1 hover:border-accent-primary/20',
      paddings[padding],
      className
    )}>
      {title && (
        <h3 className="text-sm font-black text-nexus-900 mb-6 uppercase tracking-widest font-display flex items-center gap-2 transition-colors duration-500">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};
