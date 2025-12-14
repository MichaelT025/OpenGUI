# OpenGUI

A lightweight VSCode extension providing a native GUI for OpenCode CLI.

## Features

- 💬 Chat interface for OpenCode CLI in VSCode sidebar
- 🔄 Server lifecycle management (spawn/stop/restart)
- ✅ Permission approval workflow with keyboard shortcuts
- ⌨️ Slash command parity with OpenCode TUI
- 📊 Real-time inline diff visualization

## Installation

### Prerequisites

- VSCode 1.85.0 or higher
- Node.js 20.x or higher
- OpenCode CLI installed and in PATH

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd opengui
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run compile
```

4. Run in Extension Development Host:
   - Press `F5` in VSCode
   - Or use "Run Extension" from the debug menu

## Development

### Project Structure

```
opengui/
├── src/
│   ├── extension.ts         # Extension entry point
│   ├── services/            # Core services (ServerManager, etc.)
│   ├── providers/           # VSCode providers
│   ├── commands/            # Command handlers
│   ├── types/               # TypeScript type definitions
│   └── webview/             # React webview UI
│       ├── App.tsx
│       ├── components/
│       └── styles/
├── .md/                     # Documentation
│   ├── PRD.md               # Product requirements
│   └── p0.md                # P0 implementation plan
└── dist/                    # Build output
```

### Available Scripts

- `npm run compile` - Build extension and webview
- `npm run watch` - Watch mode for development
- `npm run package` - Package extension as .vsix
- `npm run lint` - Run ESLint

### Configuration

OpenGUI can be configured through VSCode settings (`Cmd+,` or `Ctrl+,`):

- `opengui.opencodePath` - Path to OpenCode binary
- `opengui.serverUrl` - Connect to existing server URL
- `opengui.autoStart` - Auto-start server on activation
- `opengui.defaultModel` - Default model for new sessions

## Usage

### Basic Usage

1. Click the OpenGUI icon in the Activity Bar
2. Start chatting with OpenCode
3. Approve/reject tool requests with keyboard shortcuts (1/2/3)

### Keyboard Shortcuts

- `1` - Approve permission request once
- `2` - Approve permission request always (for this workspace)
- `3` - Reject permission request and provide feedback
- `/` - Trigger slash command autocomplete
- `@` - Trigger file/symbol autocomplete

### Slash Commands

All OpenCode TUI commands work in the extension:

- `/help` - Show available commands
- `/clear` - Clear conversation
- `/checkpoint` - Create a checkpoint
- `/rewind` - Rewind to a checkpoint
- `/model` - Switch model

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT

