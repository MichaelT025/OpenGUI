import React, { useEffect } from 'react';
import { ChatProvider, useChatStore } from './hooks/useChatStore';
import { useVSCodeMessaging, useSessionPersistence } from './hooks/useVSCode';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { Header } from './components/layout/Header';
import { MessageList } from './components/chat/MessageList';
import { ChatInput } from './components/ChatInput';

function ChatApp() {
  const { state, actions } = useChatStore();
  const { postMessage, addEventListener } = useVSCodeMessaging();
  const { saveLastSessionId, getLastSessionId } = useSessionPersistence();

  useEffect(() => {
    // Listen for messages from extension
    const cleanup = addEventListener((event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case 'sessionReady':
          const sessionId = message.payload.sessionId;
          actions.setSession(sessionId);
          actions.setServerStatus('connected');
          if (sessionId !== 'pending') {
            saveLastSessionId(sessionId);
          }
          break;

        case 'messageUpdate':
          actions.updateMessage(message.payload.id, message.payload.content);
          break;

        case 'streamComplete':
          actions.setStreaming(false);
          actions.setCurrentMessageId(null);
          break;

        case 'streamError':
          actions.setStreaming(false);
          actions.setServerStatus('error');
          actions.setCurrentMessageId(null);
          break;

        case 'serverStatus':
          actions.setServerStatus(message.payload.status);
          break;

        case 'sessionList':
          // Convert dates from ISO strings
          const sessions = message.payload.sessions.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          }));
          actions.updateSessions(sessions);
          break;

        case 'sessionSwitched':
          actions.setSession(message.payload.sessionId);
          // Convert dates for messages
          const messages = message.payload.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          actions.setMessages(messages);
          saveLastSessionId(message.payload.sessionId);
          break;
      }
    });

    // Notify extension that webview is ready
    postMessage({ type: 'ready' });

    // Request last session if available
    const lastSessionId = getLastSessionId();
    if (lastSessionId) {
      postMessage({ type: 'switchSession', sessionId: lastSessionId });
    }

    return cleanup;
  }, [addEventListener, postMessage, actions, saveLastSessionId, getLastSessionId]);

  function sendMessage(content: string) {
    // Add user message immediately
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: new Date()
    };
    actions.addMessage(userMessage);

    // Send to extension
    postMessage({
      type: 'sendMessage',
      payload: { content }
    });

    actions.setStreaming(true);
    actions.setCurrentMessageId(Date.now().toString());
  }

  function stopGeneration() {
    postMessage({ type: 'stopGeneration' });
    actions.setStreaming(false);
  }

  function handleNewSession() {
    postMessage({ type: 'createSession' });
    actions.clearMessages();
  }

  function handleSwitchSession(sessionId: string) {
    postMessage({ type: 'switchSession', sessionId });
  }

  function handleClearSession() {
    if (confirm('Clear all messages in this session?')) {
      actions.clearMessages();
      // Optionally notify extension to clear server-side too
    }
  }

  function handleOpenLogs() {
    postMessage({ type: 'openLogs' });
  }

  function handleOpenSettings() {
    postMessage({ type: 'openSettings' });
  }

  const sessionTitle = state.currentSessionId
    ? `Session ${state.currentSessionId.slice(0, 8)}`
    : 'New Session';

  return (
    <ErrorBoundary>
      <AppShell
        header={
          <Header
            status={state.serverStatus}
            sessionTitle={sessionTitle}
            sessions={state.sessions}
            currentSessionId={state.currentSessionId}
            onSelectSession={handleSwitchSession}
            onNewSession={handleNewSession}
            onClearSession={handleClearSession}
            onOpenLogs={handleOpenLogs}
            onOpenSettings={handleOpenSettings}
          />
        }
        footer={
          <ChatInput
            onSend={sendMessage}
            onStop={stopGeneration}
            disabled={state.serverStatus !== 'connected'}
            isStreaming={state.isStreaming}
          />
        }
      >
        <MessageList messages={state.messages} isStreaming={state.isStreaming} />
      </AppShell>
    </ErrorBoundary>
  );
}

export function App() {
  return (
    <ChatProvider>
      <ChatApp />
    </ChatProvider>
  );
}
