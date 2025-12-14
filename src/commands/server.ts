import * as vscode from 'vscode';
import { ServerManager } from '../services/ServerManager';

/**
 * Register all server-related commands
 */
export function registerServerCommands(
  context: vscode.ExtensionContext,
  serverManager: ServerManager
): void {
  // Restart server command
  context.subscriptions.push(
    vscode.commands.registerCommand('opengui.restartServer', async () => {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Restarting OpenCode server...',
        cancellable: false
      }, async () => {
        await serverManager.restart();
      });
      vscode.window.showInformationMessage('OpenCode server restarted');
    })
  );

  // Stop server command
  context.subscriptions.push(
    vscode.commands.registerCommand('opengui.stopServer', async () => {
      await serverManager.stop();
      vscode.window.showInformationMessage('OpenCode server stopped');
    })
  );

  // Show server logs command
  context.subscriptions.push(
    vscode.commands.registerCommand('opengui.showServerLogs', () => {
      serverManager.showLogs();
    })
  );
}

/**
 * Create status bar item for server status
 */
export function createStatusBarItem(
  serverManager: ServerManager
): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  item.command = 'opengui.showServerLogs';

  async function updateStatus() {
    const healthy = await serverManager.isHealthy();
    if (healthy) {
      item.text = '$(check) OpenGUI';
      item.tooltip = `OpenCode server running on port ${serverManager.getPort()}`;
      item.backgroundColor = undefined;
    } else {
      item.text = '$(warning) OpenGUI';
      item.tooltip = 'OpenCode server not responding';
      item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
  }

  // Update every 10 seconds
  const interval = setInterval(updateStatus, 10000);
  updateStatus();

  item.show();

  // Cleanup on dispose
  const originalDispose = item.dispose.bind(item);
  item.dispose = () => {
    clearInterval(interval);
    originalDispose();
  };

  return item;
}
