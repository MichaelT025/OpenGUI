import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { Header, ServerStatus } from './components/layout/Header';
import { MessageList } from './components/chat/MessageList';
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
  const [serverStatus, setServerStatus] = useState<ServerStatus>('disconnected');

  useEffect(() => {
    // Listen for messages from extension
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case 'sessionReady':
          setSessionId(message.payload.sessionId);
          setServerStatus('connected');
          break;
        case 'messageUpdate':
          updateMessage(message.payload);
          break;
        case 'streamComplete':
          setIsStreaming(false);
          break;
        case 'streamError':
          setIsStreaming(false);
          setServerStatus('error');
          break;
        case 'serverStatus':
          setServerStatus(message.payload.status);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify extension that webview is ready
    vscode.postMessage({ type: 'ready' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

  function stopGeneration() {
    vscode.postMessage({ type: 'stopGeneration' });
    setIsStreaming(false);
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

  const sessionTitle = sessionId ? `Session ${sessionId.slice(0, 8)}` : 'New Session';

  return (
    <ErrorBoundary>
      <AppShell
        header={
          <Header
            status={serverStatus}
            sessionTitle={sessionTitle}
            onMenuClick={() => {
              // TODO: Phase 2 - implement menu
              console.log('Menu clicked');
            }}
          />
        }
        footer={
          <ChatInput
            onSend={sendMessage}
            onStop={stopGeneration}
            disabled={serverStatus !== 'connected'}
            isStreaming={isStreaming}
          />
        }
      >
        <MessageList messages={messages} isStreaming={isStreaming} />
      </AppShell>
    </ErrorBoundary>
  );
}
