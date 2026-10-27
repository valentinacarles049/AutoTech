import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-2 text-xs font-semibold',
    lg: 'px-5 py-2.5 text-sm font-bold',
  };

  const variantClasses = {
    primary:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/30 border border-transparent focus:ring-2 focus:ring-red-500',
    secondary:
      'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 border border-transparent',
    outline:
      'border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 border border-transparent focus:ring-2 focus:ring-emerald-500',
    danger:
      'bg-red-700 hover:bg-red-800 text-white shadow-sm shadow-red-700/30 border border-transparent focus:ring-2 focus:ring-red-500',
  };

  return (
    <button
      className={`inline-flex items-center justify-center space-x-1.5 rounded-lg transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
