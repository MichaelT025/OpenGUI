import * as vscode from 'vscode';
import { OpenCodeClient } from '../services/OpenCodeClient';
import { ServerManager } from '../services/ServerManager';
import type { Message, MessageEvent } from '../types';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private currentSessionId?: string;
  private currentMessageId?: string;
  private client?: OpenCodeClient;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly serverManager: ServerManager
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'dist/webview')
      ]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Setup message handling
    webviewView.webview.onDidReceiveMessage(
      message => this.handleMessage(message),
      undefined,
      this.context.subscriptions
    );
  }

  private getClient(): OpenCodeClient {
    if (!this.client) {
      this.client = new OpenCodeClient(this.serverManager.getServerUrl());
    }
    return this.client;
  }

  private async ensureSession(): Promise<string> {
    if (this.currentSessionId) {
      return this.currentSessionId;
    }

    try {
      const session = await this.getClient().createSession();
      this.currentSessionId = session.id;

      this.view?.webview.postMessage({
        type: 'sessionReady',
        payload: { sessionId: session.id }
      });

      return session.id;
    } catch (error) {
      throw new Error(`Failed to create session: ${error}`);
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist/webview/main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist/webview/main.css')
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} https:;">
        <link href="${styleUri}" rel="stylesheet">
        <title>OpenGUI Chat</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
      </body>
    </html>`;
  }

  private async handleMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'sendMessage':
        await this.handleSendMessage(message.payload);
        break;
      case 'ready':
        // Webview is ready - create session lazily on first message
        this.view?.webview.postMessage({
          type: 'sessionReady',
          payload: { sessionId: 'pending' }
        });
        break;
    }
  }

  private async handleSendMessage(payload: { content: string }): Promise<void> {
    let sessionId: string;

    try {
      // Ensure we have a session (creates one if needed)
      sessionId = await this.ensureSession();
    } catch (error) {
      vscode.window.showErrorMessage(`${error}`);
      return;
    }

    try {
      let accumulatedContent = '';
      this.currentMessageId = Date.now().toString();

      for await (const event of this.getClient().sendMessage(
        sessionId,
        payload.content
      )) {
        if (event.type === 'content_delta' && event.delta) {
          accumulatedContent += event.delta;

          this.view?.webview.postMessage({
            type: 'messageUpdate',
            payload: {
              id: this.currentMessageId,
              content: accumulatedContent
            }
          });
        } else if (event.type === 'content_complete') {
          this.view?.webview.postMessage({
            type: 'streamComplete',
            payload: {
              id: this.currentMessageId
            }
          });
        } else if (event.type === 'error') {
          vscode.window.showErrorMessage(`Message error: ${event.error}`);
          this.view?.webview.postMessage({
            type: 'streamError',
            payload: {
              id: this.currentMessageId,
              error: event.error
            }
          });
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to send message: ${error}`);
    }
  }

  public postMessage(message: any): void {
    this.view?.webview.postMessage(message);
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
