import React from 'react';
import { StatusDot } from '../ui/Badge';
import { SessionSwitcher } from '../session/SessionSwitcher';
import { MenuActions } from '../menu/MenuActions';
import type { Session } from '../../hooks/useChatStore';

export type ServerStatus = 'connected' | 'disconnected' | 'error';

interface HeaderProps {
  status: ServerStatus;
  sessionTitle?: string;
  sessions?: Session[];
  currentSessionId?: string | null;
  onSelectSession?: (sessionId: string) => void;
  onNewSession?: () => void;
  onClearSession?: () => void;
  onOpenLogs?: () => void;
  onOpenSettings?: () => void;
}

export function Header({
  status,
  sessionTitle = 'New Session',
  sessions = [],
  currentSessionId,
  onSelectSession,
  onNewSession,
  onClearSession,
  onOpenLogs,
  onOpenSettings,
}: HeaderProps) {
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
      
      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Session History */}
        {onSelectSession && onNewSession && (
          <SessionSwitcher
            sessions={sessions}
            currentSessionId={currentSessionId || null}
            onSelectSession={onSelectSession}
            onNewSession={onNewSession}
          />
        )}
        
        {/* Menu */}
        {onNewSession && onClearSession && onOpenLogs && onOpenSettings && (
          <MenuActions
            onNewSession={onNewSession}
            onClearSession={onClearSession}
            onOpenLogs={onOpenLogs}
            onOpenSettings={onOpenSettings}
          />
        )}
      </div>
    </div>
  );
}
