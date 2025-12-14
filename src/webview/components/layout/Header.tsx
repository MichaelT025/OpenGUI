import React from 'react';
import { StatusDot } from '../ui/Badge';
import { IconButton } from '../ui/IconButton';

export type ServerStatus = 'connected' | 'disconnected' | 'error';

interface HeaderProps {
  status: ServerStatus;
  sessionTitle?: string;
  onMenuClick?: () => void;
}

export function Header({ status, sessionTitle = 'New Session', onMenuClick }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[var(--oc-bg)]">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Connection status */}
        <StatusDot status={status} className="flex-shrink-0" />
        
        {/* Session title */}
        <span className="text-sm font-medium truncate" title={sessionTitle}>
          {sessionTitle}
        </span>
      </div>
      
      {/* Menu button */}
      {onMenuClick && (
        <IconButton
          aria-label="Open menu"
          onClick={onMenuClick}
          size="sm"
          className="flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="13" cy="8" r="1.5" />
          </svg>
        </IconButton>
      )}
    </div>
  );
}
