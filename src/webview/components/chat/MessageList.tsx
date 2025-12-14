import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../ChatMessage';
import { TypingIndicator } from './TypingIndicator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-[var(--oc-muted)]">
          <h2 className="text-lg font-semibold mb-2">Start a conversation</h2>
          <p className="text-sm">Type a message below to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4" role="log" aria-live="polite" aria-label="Chat messages">
      {messages.map(msg => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {isStreaming && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
}
