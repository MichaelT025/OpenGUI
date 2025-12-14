/**
 * Type definitions for VSCode webview API
 */

interface VsCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

declare const vscode: VsCodeApi;
