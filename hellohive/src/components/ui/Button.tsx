import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: 'bg-[#F5C518] hover:bg-[#F5C518]/90 text-[#150F16] font-semibold focus:ring-2 focus:ring-[#F5C518] focus:ring-offset-2 focus:ring-offset-[#150F16]',
    secondary: 'bg-[#2C1F2F] hover:bg-[#2C1F2F]/80 text-[#F5F0EB] font-medium border border-[#4A4953]/40',
    ghost: 'text-[#4A4953] hover:text-[#F5F0EB] font-medium',
  };

  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
