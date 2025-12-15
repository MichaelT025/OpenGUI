import { useEffect, useCallback } from 'react';

declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

let vscodeApi: ReturnType<typeof acquireVsCodeApi> | undefined;

function getVSCodeAPI() {
  if (!vscodeApi) {
    vscodeApi = acquireVsCodeApi();
  }
  return vscodeApi;
}

interface PersistedState {
  lastSessionId?: string;
  [key: string]: any;
}

export function useVSCodeState<T extends PersistedState>() {
  const vscode = getVSCodeAPI();

  const getState = useCallback((): T | undefined => {
    const state = vscode.getState();
    return state as T | undefined;
  }, [vscode]);

  const setState = useCallback((state: T) => {
    vscode.setState(state);
  }, [vscode]);

  const updateState = useCallback((updates: Partial<T>) => {
    const currentState = getState() || {} as T;
    const newState = { ...currentState, ...updates };
    setState(newState);
  }, [getState, setState]);

  return { getState, setState, updateState };
}

export function useVSCodeMessaging() {
  const vscode = getVSCodeAPI();

  const postMessage = useCallback((message: any) => {
    vscode.postMessage(message);
  }, [vscode]);

  const addEventListener = useCallback((handler: (event: MessageEvent) => void) => {
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return { postMessage, addEventListener };
}

// Hook to manage session persistence
export function useSessionPersistence() {
  const { getState, updateState } = useVSCodeState<PersistedState>();

  const saveLastSessionId = useCallback((sessionId: string) => {
    updateState({ lastSessionId: sessionId });
  }, [updateState]);

  const getLastSessionId = useCallback((): string | undefined => {
    const state = getState();
    return state?.lastSessionId;
  }, [getState]);

  const clearLastSessionId = useCallback(() => {
    updateState({ lastSessionId: undefined });
  }, [updateState]);

  return {
    saveLastSessionId,
    getLastSessionId,
    clearLastSessionId,
  };
}
