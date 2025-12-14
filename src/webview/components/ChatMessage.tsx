import React from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}>
      <div
        className={`inline-block max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)]'
            : 'bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)]'
        }`}
      >
        <div className="text-xs opacity-70 mb-1">
          {isUser ? 'You' : 'Assistant'}
        </div>
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
        <div className="text-xs opacity-50 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
