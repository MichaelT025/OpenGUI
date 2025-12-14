import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

const vscode = acquireVsCodeApi();

export function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for messages from extension
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case 'sessionReady':
          setSessionId(message.payload.sessionId);
          break;
        case 'messageUpdate':
          updateMessage(message.payload);
          break;
        case 'streamComplete':
          setIsStreaming(false);
          break;
        case 'streamError':
          setIsStreaming(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify extension that webview is ready
    vscode.postMessage({ type: 'ready' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(content: string) {
    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to extension (session will be created if needed)
    vscode.postMessage({
      type: 'sendMessage',
      payload: { content }
    });

    setIsStreaming(true);
  }

  function updateMessage(payload: { id: string; content: string }) {
    setMessages(prev => {
      const existing = prev.find(m => m.id === payload.id);
      if (existing) {
        return prev.map(m =>
          m.id === payload.id
            ? { ...m, content: payload.content }
            : m
        );
      } else {
        return [
          ...prev,
          {
            id: payload.id,
            role: 'assistant' as const,
            content: payload.content,
            timestamp: new Date()
          }
        ];
      }
    });
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)]">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-[var(--vscode-descriptionForeground)]">
              <h2 className="text-lg font-semibold mb-2">Start a conversation</h2>
              <p className="text-sm">Type a message below to begin</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
