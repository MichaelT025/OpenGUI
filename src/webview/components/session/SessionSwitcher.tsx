import React from 'react';
import { Dropdown, DropdownItem, DropdownSeparator } from '../ui/Dropdown';
import { IconButton } from '../ui/IconButton';
import type { Session } from '../../hooks/useChatStore';

interface SessionSwitcherProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}

export function SessionSwitcher({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
}: SessionSwitcherProps) {
  const sortedSessions = [...sessions].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  return (
    <Dropdown
      align="right"
      trigger={
        <IconButton aria-label="Session history" size="sm">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H7.5L5.75 1H1.75zM1.5 2.75a.25.25 0 01.25-.25h3.5c.066 0 .13.027.177.073L7.823 4.5h6.427a.25.25 0 01.25.25v8.5a.25.25 0 01-.25.25H1.75a.25.25 0 01-.25-.25V2.75z"/>
          </svg>
        </IconButton>
      }
    >
      <div className="py-1">
        {/* New Session */}
        <DropdownItem
          onClick={onNewSession}
          icon={
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 010 1.5H8.5v4.25a.75.75 0 01-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"/>
            </svg>
          }
        >
          New Session
        </DropdownItem>
        
        {sortedSessions.length > 0 && <DropdownSeparator />}
        
        {/* Session List */}
        <div className="max-h-[300px] overflow-y-auto">
          {sortedSessions.map((session) => (
            <DropdownItem
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={session.id === currentSessionId ? 'bg-[var(--oc-surface)]' : ''}
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{session.title || 'Untitled Session'}</span>
                  {session.id === currentSessionId && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0 text-[var(--oc-accent)]">
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--oc-muted)]">
                  <span>{formatRelativeTime(session.updatedAt)}</span>
                  <span>·</span>
                  <span>{session.messageCount} {session.messageCount === 1 ? 'message' : 'messages'}</span>
                </div>
              </div>
            </DropdownItem>
          ))}
        </div>
        
        {sortedSessions.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-[var(--oc-muted)]">
            No previous sessions
          </div>
        )}
      </div>
    </Dropdown>
  );
}
