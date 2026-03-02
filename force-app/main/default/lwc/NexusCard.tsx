import React from 'react';
import { cn } from '../../lib/utils';

interface NexusCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const NexusCard: React.FC<NexusCardProps> = ({ 
  children, 
  className, 
  hoverable = true,
  padding = 'lg'
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  };

  return (
    <div className={cn(
      'bg-white rounded-[2.5rem] border border-slate-200 shadow-sm transition-all duration-500 overflow-hidden',
      hoverable && 'hover:shadow-2xl hover:-translate-y-1',
      paddings[padding],
      className
    )}>
      {children}
    </div>
  );
};