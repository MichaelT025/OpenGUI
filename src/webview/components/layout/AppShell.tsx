import React from 'react';

interface AppShellProps {
  header: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AppShell({ header, children, footer }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col bg-[var(--oc-bg)] text-[var(--oc-fg)]">
      {/* Header - sticky at top */}
      <div className="flex-shrink-0 border-b border-[var(--oc-border)]">
        {header}
      </div>
      
      {/* Main content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      
      {/* Footer - sticky at bottom */}
      <div className="flex-shrink-0 border-t border-[var(--oc-border)]">
        {footer}
      </div>
    </div>
  );
}
