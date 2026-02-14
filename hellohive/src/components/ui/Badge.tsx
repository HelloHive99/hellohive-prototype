import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'completed' | 'in-progress' | 'open' | 'overdue' | 'pending' | 'dispatched';

interface BadgeProps {
  children: React.ReactNode;
  variant: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  completed: {
    container: 'bg-[#2ECC71]/10 text-[#2ECC71] border-[#2ECC71]/20',
    dot: 'bg-[#2ECC71]',
  },
  'in-progress': {
    container: 'bg-[#F5C518]/10 text-[#F5C518] border-[#F5C518]/20',
    dot: 'bg-[#F5C518]',
  },
  open: {
    container: 'bg-[#F5F0EB]/10 text-[#F5F0EB] border-[#F5F0EB]/20',
    dot: 'bg-[#F5F0EB]',
  },
  overdue: {
    container: 'bg-[#E74C3C]/10 text-[#E74C3C] border-[#E74C3C]/20',
    dot: 'bg-[#E74C3C]',
  },
  pending: {
    container: 'bg-[#D4820A]/10 text-[#D4820A] border-[#D4820A]/20',
    dot: 'bg-[#D4820A]',
  },
  dispatched: {
    container: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
    dot: 'bg-[#3B82F6]',
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
