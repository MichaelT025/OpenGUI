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
    const response = await this.client.session.prompt({
      path: { id: sessionId },
      body: { content }
    });

    const responseContent = response.data?.content || '';

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
