import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
  variant?: ButtonVariant;
}

export default function Button({
  children,
  fullWidth = true,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  const variantClasses =
    variant === 'secondary'
      ? 'bg-white text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50'
      : 'bg-slate-900 text-white hover:bg-slate-800';

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}
