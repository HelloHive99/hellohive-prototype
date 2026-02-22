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
    primary: 'bg-[#F5C518] hover:bg-[#F5C518]/90 text-neutral-950 font-semibold focus:ring-2 focus:ring-[#F5C518] focus:ring-offset-2 focus:ring-offset-neutral-950',
    secondary: 'bg-neutral-800 hover:bg-neutral-800/80 text-white font-medium border border-gray-700/40',
    ghost: 'text-gray-400 hover:text-white font-medium',
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
