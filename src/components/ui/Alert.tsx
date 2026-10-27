import React from 'react';

interface AlertProps {
  title: string;
  description?: string;
  variant?: 'warning' | 'info' | 'error' | 'success';
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  description,
  variant = 'warning',
  className = '',
}) => {
  const variantStyles = {
    warning: {
      box: 'border-amber-400 bg-amber-500/15 text-amber-900 dark:text-amber-200',
      icon: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      box: 'border-blue-400 bg-blue-500/15 text-blue-900 dark:text-blue-200',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    error: {
      box: 'border-red-400 bg-red-500/15 text-red-900 dark:text-red-200',
      icon: 'text-red-600 dark:text-red-400',
    },
    success: {
      box: 'border-emerald-400 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border flex items-start space-x-3 shadow-sm ${style.box} ${className}`}
    >
      <div className={`flex-shrink-0 mt-0.5 ${style.icon}`}>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div>
        <p className="text-xs font-bold tracking-tight">{title}</p>
        {description && <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </div>
  );
};
