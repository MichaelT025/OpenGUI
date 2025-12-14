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
    return response.data as Session;
  }

  /**
   * Get a session by ID
   */
  async getSession(id: string): Promise<Session> {
    const response = await this.client.session.get({ path: { id } });
    return response.data as Session;
  }

  /**
   * List all sessions
   */
  async listSessions(): Promise<Session[]> {
    const response = await this.client.session.list();
    return response.data as Session[];
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

    try {
      const response = await this.client.session.prompt({
        path: { id: sessionId },
        body: {
          parts: [
            {
              type: 'text',
              text: content
            }
          ]
        }
      });

      console.log('[OpenCodeClient] Response received:', JSON.stringify(response, null, 2));

      const responseError = (response as any)?.data?.info?.error;
      if (responseError) {
        const errorMessage =
          responseError?.data?.message ||
          responseError?.message ||
          JSON.stringify(responseError);
        console.error('[OpenCodeClient] Server returned error:', errorMessage);
        yield {
          type: 'error',
          error: errorMessage
        } as MessageEvent;
        return;
      }

      const parts = ((response as any)?.data?.parts ?? []) as Array<any>;
      const responseContent = parts
        .filter(p => p && p.type === 'text' && typeof p.text === 'string')
        .map(p => p.text)
        .join('');

      console.log('[OpenCodeClient] Response content:', responseContent);

      // Yield content as delta event so it gets displayed
      if (responseContent) {
        yield {
          type: 'content_delta',
          delta: responseContent
        } as MessageEvent;
      }

      // Then yield complete event
      yield {
        type: 'content_complete',
        content: responseContent
      } as MessageEvent;
    } catch (error) {
      console.error('[OpenCodeClient] Error sending message:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      } as MessageEvent;
    }
  }

  /**
   * Stream events from the server
   */
  async *streamEvents(): AsyncGenerator<ServerEvent> {
    const eventStream = await this.client.global.event();
    for await (const event of eventStream) {
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
