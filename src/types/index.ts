import * as vscode from 'vscode';

// Server types
export interface ServerConfig {
  binaryPath?: string;
  serverUrl?: string;
  autoStart: boolean;
}

export interface ServerStatus {
  isRunning: boolean;
  port?: number;
  pid?: number;
  url?: string;
}

// Session types
export interface Session {
  id: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

// Message types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  parts?: MessagePart[];
}

export interface MessagePart {
  type: 'text' | 'tool_call' | 'tool_result';
  content: string;
  toolName?: string;
  toolParams?: any;
}

// Permission types
export type PermissionScope = 'once' | 'workspace';

export interface PermissionRequest {
  id: string;
  tool: string;
  params: any;
  timestamp: Date;
}

export interface PermissionRecord {
  tool: string;
  scope: PermissionScope;
  workspace: string;
  timestamp: number;
}

// Command types
export interface CommandDefinition {
  name: string;
  description: string;
  usage?: string;
  args?: Array<{
    name: string;
    required: boolean;
    description?: string;
  }>;
}

// Event types
export type ServerEventType =
  | 'message.part.updated'
  | 'message.updated'
  | 'message.complete'
  | 'permission.request'
  | 'session.status'
  | 'server.connected'
  | 'error';

export interface ServerEvent {
  type: ServerEventType;
  sessionId?: string;
  messageId?: string;
  delta?: string;
  data?: any;
}

export interface MessageEvent {
  type: 'content_delta' | 'content_complete' | 'tool_call' | 'error';
  messageId?: string;
  delta?: string;
  content?: string;
  error?: string;
}

// Webview message types
export interface WebviewMessage {
  type: string;
  payload?: any;
}
