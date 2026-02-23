import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'completed' | 'in-progress' | 'open' | 'overdue' | 'pending' | 'dispatched' | 'pending-approval' | 'cancelled';

interface BadgeProps {
  children: React.ReactNode;
  variant: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  completed: {
    container: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30',
    dot: 'bg-[#10B981]',
  },
  'in-progress': {
    container: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30',
    dot: 'bg-[#F59E0B]',
  },
  open: {
    container: 'bg-white/20 text-white border-white/30',
    dot: 'bg-white',
  },
  overdue: {
    container: 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30',
    dot: 'bg-[#EF4444]',
  },
  pending: {
    container: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30',
    dot: 'bg-[#F59E0B]',
  },
  dispatched: {
    container: 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30',
    dot: 'bg-[#3B82F6]',
  },
  'pending-approval': {
    container: 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30',
    dot: 'bg-[#8B5CF6]',
  },
  cancelled: {
    container: 'bg-[#6B7280]/20 text-[#6B7280] border-[#6B7280]/30',
    dot: 'bg-[#6B7280]',
  },
};

export function Badge({ children, variant, className }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        styles.container,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
      {children}
    </span>
  );
}
