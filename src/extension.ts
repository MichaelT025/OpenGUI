import * as vscode from 'vscode';
import { ServerManager } from './services/ServerManager';
import { registerServerCommands, createStatusBarItem } from './commands/server';

let serverManager: ServerManager | null = null;
let statusBarItem: vscode.StatusBarItem | null = null;

export async function activate(context: vscode.ExtensionContext) {
	console.log('OpenGUI extension is now active');

	// Get workspace root
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!workspaceRoot) {
		vscode.window.showErrorMessage('OpenGUI requires a workspace to be opened');
		return;
	}

	// Initialize ServerManager
	serverManager = new ServerManager(context, workspaceRoot);
	context.subscriptions.push(serverManager);

	// Register server commands
	registerServerCommands(context, serverManager);

	// Create status bar item
	statusBarItem = createStatusBarItem(serverManager);
	context.subscriptions.push(statusBarItem);

	// Register placeholder chat command
	const openChatCommand = vscode.commands.registerCommand('opengui.openChat', () => {
		vscode.window.showInformationMessage('OpenGUI: Chat interface coming soon...');
	});
	context.subscriptions.push(openChatCommand);

	// Auto-start server if configured
	const config = vscode.workspace.getConfiguration('opengui');
	const autoStart = config.get<boolean>('autoStart', true);

	if (autoStart) {
		try {
			await serverManager.start();
			vscode.window.showInformationMessage('OpenCode server started successfully');
		} catch (error) {
			const err = error as Error;
			vscode.window.showErrorMessage(
				`Failed to start OpenCode server: ${err.message}`,
				'Open Settings',
				'Show Logs'
			).then(action => {
				if (action === 'Open Settings') {
					vscode.commands.executeCommand('workbench.action.openSettings', 'opengui');
				} else if (action === 'Show Logs') {
					serverManager?.showLogs();
				}
			});
		}
	}
}

export async function deactivate() {
	console.log('OpenGUI extension is now deactivated');

	// Stop server and cleanup
	if (serverManager) {
		await serverManager.stop();
	}
}
