import { createOpencodeClient } from '@opencode-ai/sdk';
import type { OpencodeClient } from '@opencode-ai/sdk';
import type { Session, MessageEvent, ServerEvent } from '../types';

export class OpenCodeClient {
  private client: OpencodeClient;

  constructor(private baseUrl: string) {
    this.client = createOpencodeClient({ baseUrl });
  }

  /**
   * Create a new session
   */
  async createSession(): Promise<Session> {
    const response = await this.client.session.create();
    return this.toSession(response.data);
  }

  /**
   * Get a session by ID
   */
  async getSession(id: string): Promise<Session> {
    const response = await this.client.session.get({ path: { id } });
    return this.toSession(response.data);
  }

  /**
   * List all sessions
   */
  async listSessions(): Promise<Session[]> {
    const response = await this.client.session.list();
    const items = (response.data ?? []) as any[];
    return items.map(s => this.toSession(s));
  }

  private toSession(data: any): Session {
    return {
      id: String(data?.id ?? ''),
      title: typeof data?.title === 'string' ? data.title : undefined,
      createdAt: new Date(typeof data?.time?.created === 'number' ? data.time.created : Date.now()),
      updatedAt: new Date(typeof data?.time?.updated === 'number' ? data.time.updated : Date.now()),
      messageCount: typeof data?.messageCount === 'number' ? data.messageCount : 0
    };
  }

  /**
   * Send a message to a session and stream the response
   */
  async *sendMessage(
    sessionId: string,
    content: string
  ): AsyncGenerator<MessageEvent> {
    console.log('[OpenCodeClient] Sending message to session:', sessionId);
    console.log('[OpenCodeClient] Message content:', content);

    const abortController = new AbortController();
    const startTime = Date.now();
    let assistantMessageId: string | undefined;
    let completed = false;

    try {
      const eventStream = await this.client.global.event({ signal: abortController.signal } as any);

      // Start generation asynchronously; stream is delivered via global events.
      await this.client.session.promptAsync({
        path: { id: sessionId },
        body: {
          parts: [
            {
              type: 'text',
              text: content
            }
          ]
        }
      } as any);

      for await (const evt of eventStream.stream as AsyncGenerator<any>) {
        const payload = evt?.payload;
        if (!payload?.type) continue;

        // Detect the assistant message that belongs to this session.
        if (payload.type === 'message.updated') {
          const info = payload?.properties?.info;
          if (!info || info.sessionID !== sessionId || info.role !== 'assistant') {
            continue;
          }

          // If multiple sessions/messages are active, only lock onto messages created after this prompt started.
          if (!assistantMessageId) {
            const created = info?.time?.created;
            if (typeof created === 'number' && created < startTime - 1000) {
              continue;
            }
            assistantMessageId = info.id;
          }

          if (assistantMessageId && info.id !== assistantMessageId) {
            continue;
          }

          const serverError = info?.error;
          if (serverError) {
            const errorMessage =
              serverError?.data?.message ||
              serverError?.message ||
              JSON.stringify(serverError);
            yield { type: 'error', error: errorMessage } as MessageEvent;
            completed = true;
            break;
          }

          if (info?.time?.completed) {
            completed = true;
            break;
          }
        }

        if (payload.type === 'message.part.updated') {
          const part = payload?.properties?.part;
          const delta = payload?.properties?.delta;

          if (!part || part.sessionID !== sessionId) {
            continue;
          }
          if (assistantMessageId && part.messageID !== assistantMessageId) {
            continue;
          }

          if (part.type === 'text' && typeof delta === 'string' && delta.length > 0) {
            yield { type: 'content_delta', delta } as MessageEvent;
          }
        }

        if (payload.type === 'session.error') {
          const errorSessionId = payload?.properties?.sessionID;
          if (errorSessionId && errorSessionId !== sessionId) {
            continue;
          }
          const serverError = payload?.properties?.error;
          if (serverError) {
            const errorMessage =
              serverError?.data?.message ||
              serverError?.message ||
              JSON.stringify(serverError);
            yield { type: 'error', error: errorMessage } as MessageEvent;
            completed = true;
            break;
          }
        }

        if (completed) {
          break;
        }
      }

      if (completed) {
        yield { type: 'content_complete' } as MessageEvent;
      }
    } catch (error) {
      console.error('[OpenCodeClient] Error sending message:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      } as MessageEvent;
    } finally {
      abortController.abort();
    }
  }

  /**
   * Stream events from the server
   */
  async *streamEvents(): AsyncGenerator<ServerEvent> {
    const eventStream = await this.client.global.event();
    for await (const event of eventStream.stream as AsyncGenerator<any>) {
      yield event as ServerEvent;
    }
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
