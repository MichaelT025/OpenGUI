import React, { ButtonHTMLAttributes, forwardRef } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', className = '', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--oc-focus)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--oc-surface)]';
    
    const sizeClasses = {
      sm: 'w-6 h-6 text-sm',
      md: 'w-8 h-8',
      lg: 'w-10 h-10 text-lg'
    };
    
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
