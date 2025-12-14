import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Button } from './ui/Button';

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export function ChatInput({ onSend, onStop, disabled, isStreaming }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 24; // approximate line height
      const minRows = 1;
      const maxRows = 8;
      const minHeight = lineHeight * minRows;
      const maxHeight = lineHeight * maxRows;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !disabled && !isStreaming) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    if (onStop && isStreaming) {
      onStop();
    }
  };

  const charCount = input.length;
  const showCharCount = charCount > 1000; // Show near limit

  return (
    <div className="p-4 bg-[var(--oc-bg)]">
      {/* Floating command bar container */}
      <div className="bg-[var(--oc-surface)] border border-[var(--oc-border)] rounded-lg shadow-lg">
        <div className="flex gap-2 items-end p-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Type a message..."
              className="w-full bg-transparent text-[var(--oc-fg)]
                         border-none rounded px-2 py-1 resize-none
                         placeholder-[var(--vscode-input-placeholderForeground)]
                         focus:outline-none focus:ring-0
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all"
              rows={1}
              aria-label="Message input"
            />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isStreaming ? (
              <Button
                onClick={handleStop}
                variant="danger"
                size="sm"
                disabled={!onStop}
                aria-label="Stop generating"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="mr-1">
                  <rect x="4" y="4" width="8" height="8" rx="1" />
                </svg>
                Stop
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!input.trim() || disabled}
                variant="primary"
                size="sm"
                aria-label="Send message"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="mr-1">
                  <path d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z"/>
                </svg>
                Send
              </Button>
            )}
          </div>
        </div>
        
        {/* Keyboard hints at bottom */}
        <div className="flex items-center justify-between px-4 pb-2 pt-1 border-t border-[var(--oc-border)] border-opacity-50">
          <span className="text-[10px] text-[var(--oc-muted)]">
            <kbd className="px-1 py-0.5 bg-[var(--oc-bg)] bg-opacity-50 border border-[var(--oc-border)] border-opacity-50 rounded text-[10px] font-mono">Enter</kbd>
            {' '}to send
            {' · '}
            <kbd className="px-1 py-0.5 bg-[var(--oc-bg)] bg-opacity-50 border border-[var(--oc-border)] border-opacity-50 rounded text-[10px] font-mono">Shift+Enter</kbd>
            {' '}new line
          </span>
          {showCharCount && (
            <span className="text-[10px] text-[var(--oc-muted)]">
              {charCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
