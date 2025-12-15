import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type ServerStatus = 'connected' | 'disconnected' | 'error';

interface ChatState {
  currentSessionId: string | null;
  sessions: Session[];
  messages: Message[];
  isStreaming: boolean;
  serverStatus: ServerStatus;
  currentMessageId: string | null;
}

type ChatAction =
  | { type: 'SET_SESSION'; sessionId: string }
  | { type: 'ADD_SESSION'; session: Session }
  | { type: 'UPDATE_SESSIONS'; sessions: Session[] }
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'UPDATE_MESSAGE'; id: string; content: string }
  | { type: 'SET_MESSAGES'; messages: Message[] }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_STREAMING'; isStreaming: boolean }
  | { type: 'SET_SERVER_STATUS'; status: ServerStatus }
  | { type: 'SET_CURRENT_MESSAGE_ID'; id: string | null };

const initialState: ChatState = {
  currentSessionId: null,
  sessions: [],
  messages: [],
  isStreaming: false,
  serverStatus: 'disconnected',
  currentMessageId: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, currentSessionId: action.sessionId };
    
    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [action.session, ...state.sessions],
      };
    
    case 'UPDATE_SESSIONS':
      return { ...state, sessions: action.sessions };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
      };
    
    case 'UPDATE_MESSAGE': {
      const existing = state.messages.find(m => m.id === action.id);
      if (existing) {
        return {
          ...state,
          messages: state.messages.map(m =>
            m.id === action.id ? { ...m, content: action.content } : m
          ),
        };
      } else {
        return {
          ...state,
          messages: [
            ...state.messages,
            {
              id: action.id,
              role: 'assistant',
              content: action.content,
              timestamp: new Date(),
            },
          ],
        };
      }
    }
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.messages };
    
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    
    case 'SET_STREAMING':
      return { ...state, isStreaming: action.isStreaming };
    
    case 'SET_SERVER_STATUS':
      return { ...state, serverStatus: action.status };
    
    case 'SET_CURRENT_MESSAGE_ID':
      return { ...state, currentMessageId: action.id };
    
    default:
      return state;
  }
}

interface ChatContextValue {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  actions: {
    setSession: (sessionId: string) => void;
    addSession: (session: Session) => void;
    updateSessions: (sessions: Session[]) => void;
    addMessage: (message: Message) => void;
    updateMessage: (id: string, content: string) => void;
    setMessages: (messages: Message[]) => void;
    clearMessages: () => void;
    setStreaming: (isStreaming: boolean) => void;
    setServerStatus: (status: ServerStatus) => void;
    setCurrentMessageId: (id: string | null) => void;
  };
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const actions = {
    setSession: useCallback((sessionId: string) => {
      dispatch({ type: 'SET_SESSION', sessionId });
    }, []),
    
    addSession: useCallback((session: Session) => {
      dispatch({ type: 'ADD_SESSION', session });
    }, []),
    
    updateSessions: useCallback((sessions: Session[]) => {
      dispatch({ type: 'UPDATE_SESSIONS', sessions });
    }, []),
    
    addMessage: useCallback((message: Message) => {
      dispatch({ type: 'ADD_MESSAGE', message });
    }, []),
    
    updateMessage: useCallback((id: string, content: string) => {
      dispatch({ type: 'UPDATE_MESSAGE', id, content });
    }, []),
    
    setMessages: useCallback((messages: Message[]) => {
      dispatch({ type: 'SET_MESSAGES', messages });
    }, []),
    
    clearMessages: useCallback(() => {
      dispatch({ type: 'CLEAR_MESSAGES' });
    }, []),
    
    setStreaming: useCallback((isStreaming: boolean) => {
      dispatch({ type: 'SET_STREAMING', isStreaming });
    }, []),
    
    setServerStatus: useCallback((status: ServerStatus) => {
      dispatch({ type: 'SET_SERVER_STATUS', status });
    }, []),
    
    setCurrentMessageId: useCallback((id: string | null) => {
      dispatch({ type: 'SET_CURRENT_MESSAGE_ID', id });
    }, []),
  };

  return (
    <ChatContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatStore() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatStore must be used within ChatProvider');
  }
  return context;
}
