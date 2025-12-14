import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-[var(--oc-surface)] text-[var(--oc-fg)] border border-[var(--oc-border)]',
    success: 'bg-[var(--oc-success)] bg-opacity-20 text-[var(--oc-success)] border border-[var(--oc-success)] border-opacity-30',
    warning: 'bg-[var(--oc-warning)] bg-opacity-20 text-[var(--oc-warning)] border border-[var(--oc-warning)] border-opacity-30',
    danger: 'bg-[var(--oc-danger)] bg-opacity-20 text-[var(--oc-danger)] border border-[var(--oc-danger)] border-opacity-30'
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

interface StatusDotProps {
  status: 'connected' | 'disconnected' | 'error';
  className?: string;
}

export function StatusDot({ status, className = '' }: StatusDotProps) {
  const statusClasses = {
    connected: 'bg-[var(--oc-success)]',
    disconnected: 'bg-[var(--oc-muted)]',
    error: 'bg-[var(--oc-danger)]'
  };
  
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${statusClasses[status]} ${className}`}
      aria-label={status}
      role="status"
    />
  );
}
