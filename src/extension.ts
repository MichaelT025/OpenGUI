import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('OpenGUI extension is now active');

	// Register commands
	const openChatCommand = vscode.commands.registerCommand('opengui.openChat', () => {
		vscode.window.showInformationMessage('OpenGUI: Chat command executed');
	});

	const restartServerCommand = vscode.commands.registerCommand('opengui.restartServer', () => {
		vscode.window.showInformationMessage('OpenGUI: Restart server command executed');
	});

	const stopServerCommand = vscode.commands.registerCommand('opengui.stopServer', () => {
		vscode.window.showInformationMessage('OpenGUI: Stop server command executed');
	});

	const showLogsCommand = vscode.commands.registerCommand('opengui.showServerLogs', () => {
		vscode.window.showInformationMessage('OpenGUI: Show logs command executed');
	});

	context.subscriptions.push(
		openChatCommand,
		restartServerCommand,
		stopServerCommand,
		showLogsCommand
	);
}

export function deactivate() {
	console.log('OpenGUI extension is now deactivated');
}
