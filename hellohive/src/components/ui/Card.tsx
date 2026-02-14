import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}

export function Card({ children, className, highlight = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#2C1F2F] border ring-1 ring-white/5 ring-inset rounded-lg p-6',
        highlight ? 'border-[#F5C518]/40' : 'border-[#4A4953]/40',
        className
      )}
    >
      {children}
    </div>
  );
}
