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
        'bg-gray-800 border ring-1 ring-white/5 ring-inset rounded-lg p-6',
        highlight ? 'border-[#F5C518]/40' : 'border-gray-700',
        className
      )}
    >
      {children}
    </div>
  );
}
