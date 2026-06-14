'use client';

import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'h-11 px-4 rounded-xl text-sm font-medium transition flex items-center justify-center';

  const variants = {
    primary:
      'bg-primary text-primary-foreground hover:opacity-90',
    secondary:
      'bg-muted text-foreground hover:bg-muted/80',
    danger:
      'bg-red-500 text-white hover:bg-red-600',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${
        disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
