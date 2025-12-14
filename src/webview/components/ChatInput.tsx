import React, { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
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

  return (
    <div className="border-t border-[var(--vscode-panel-border)] p-4">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)]
                     border border-[var(--vscode-input-border)] rounded px-3 py-2 resize-none
                     placeholder-[var(--vscode-input-placeholderForeground)]
                     focus:outline-none focus:border-[var(--vscode-focusBorder)]
                     disabled:opacity-50 disabled:cursor-not-allowed"
          rows={3}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="px-4 py-2 bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)]
                     rounded hover:bg-[var(--vscode-button-hoverBackground)]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
