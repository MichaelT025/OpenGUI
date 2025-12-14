import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

export class ServerManager {
  private process: ChildProcess | null = null;
  private port: number = 0;
  private outputChannel: vscode.OutputChannel;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(
    private context: vscode.ExtensionContext,
    private workspaceRoot: string
  ) {
    this.outputChannel = vscode.window.createOutputChannel('OpenGUI: Server Logs');
  }

  /**
   * Start the OpenCode server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.log('Server is already running');
      return;
    }

    try {
      const binaryPath = this.detectBinary();
      this.port = this.allocatePort();

      this.log('Starting OpenCode server...');
      this.log(`Binary: ${binaryPath}`);
      this.log(`Port: ${this.port}`);
      this.log(`Working directory: ${this.workspaceRoot}`);

      // Check if port is already in use before spawning
      const portInUse = await this.isPortInUse(this.port);
      if (portInUse) {
        this.log(`⚠ Port ${this.port} is already in use`);
        await this.killProcessOnPort(this.port);
        this.log(`Killed process on port ${this.port}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for port to be released
      }

      await this.spawn(binaryPath);
      this.isRunning = true; // Set before health check so isHealthy() can proceed

      await this.waitForHealth();
      this.startHealthCheck();

      this.log('✓ Server ready');
    } catch (error) {
      this.log(`✗ Failed to start server: ${error}`);
      throw error;
    }
  }

  /**
   * Stop the OpenCode server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.log('Server is not running');
      return;
    }

    this.log('Stopping OpenCode server...');

    this.stopHealthCheck();

    if (this.process && this.process.pid) {
      // On Windows with shell: true, we need to kill the entire process tree
      if (process.platform === 'win32') {
        try {
          this.log(`Killing process tree for PID ${this.process.pid}`);
          execSync(`taskkill /F /T /PID ${this.process.pid}`, { stdio: 'ignore' });
          this.log('✓ Server stopped');
        } catch (error) {
          this.log(`Warning: Failed to kill process: ${error}`);
        }
        this.process = null;
      } else {
        // Unix-like systems: use SIGTERM/SIGKILL
        this.process.kill('SIGTERM');

        // Wait for graceful shutdown
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            if (this.process && !this.process.killed) {
              this.log('Force killing server...');
              this.process.kill('SIGKILL');
            }
            resolve();
          }, 5000);

          this.process?.on('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
        });

        this.process = null;
        this.log('✓ Server stopped');
      }
    }

    this.isRunning = false;
  }

  /**
   * Restart the OpenCode server
   */
  async restart(): Promise<void> {
    this.log('Restarting OpenCode server...');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
    await this.start();
  }

  /**
   * Get the server URL
   */
  getServerUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  /**
   * Get the server port
   */
  getPort(): number {
    return this.port;
  }

  /**
   * Check if server is healthy
   */
  async isHealthy(): Promise<boolean> {
    if (!this.isRunning) {
      this.log('Health check: isRunning is false');
      return false;
    }

    return new Promise((resolve) => {
      const url = `${this.getServerUrl()}/`;
      this.log(`Health check: Trying ${url}`);

      const req = http.get(url, { timeout: 2000 }, (res) => {
        this.log(`Health check: Got response with status ${res.statusCode}`);
        // Consume response to free up connection
        res.resume();
        // Any response means server is alive
        resolve(true);
      });

      req.on('error', (err) => {
        this.log(`Health check: Error - ${err.message}`);
        resolve(false);
      });

      req.on('timeout', () => {
        this.log('Health check: Timeout');
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Show the output channel
   */
  showLogs(): void {
    this.outputChannel.show();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.stopHealthCheck();
    if (this.process) {
      this.process.kill();
    }
    this.outputChannel.dispose();
  }

  // ========== Private Methods ==========

  /**
   * Detect OpenCode binary location
   */
  private detectBinary(): string {
    // 1. Check VSCode config
    const config = vscode.workspace.getConfiguration('opengui');
    const configPath = config.get<string>('opencodePath');
    if (configPath && fs.existsSync(configPath)) {
      return configPath;
    }

    // 2. Check OPENCODE_PATH env var
    if (process.env.OPENCODE_PATH && fs.existsSync(process.env.OPENCODE_PATH)) {
      return process.env.OPENCODE_PATH;
    }

    // 3. Check PATH
    try {
      const which = process.platform === 'win32' ? 'where' : 'which';
      const result = execSync(`${which} opencode`, { encoding: 'utf-8' }).trim();
      const firstPath = result.split('\n')[0].trim();
      if (firstPath) {
        return firstPath;
      }
    } catch {
      // Command not found in PATH
    }

    throw new Error('OpenCode binary not found. Please install OpenCode or set opengui.opencodePath in settings.');
  }

  /**
   * Allocate a workspace-specific port
   */
  private allocatePort(): number {
    const basePort = 47339;
    const workspaceHash = this.hashWorkspace(this.workspaceRoot);
    return basePort + (workspaceHash % 1000);
  }

  /**
   * Hash workspace path for deterministic port allocation
   */
  private hashWorkspace(path: string): number {
    let hash = 0;
    for (let i = 0; i < path.length; i++) {
      hash = ((hash << 5) - hash) + path.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Spawn the OpenCode server process
   */
  private async spawn(binaryPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // On Windows, use shell to handle .cmd/.bat files
      const spawnOptions: any = {
        cwd: this.workspaceRoot,
        env: { ...process.env }
      };

      if (process.platform === 'win32') {
        spawnOptions.shell = true;
      }

      this.process = spawn(binaryPath, ['serve', '--port', this.port.toString()], spawnOptions);

      this.setupProcessHandlers();

      // Wait a moment for the process to start or fail
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          resolve();
        } else {
          reject(new Error('Server process failed to start'));
        }
      }, 1000);
    });
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(): void {
    if (!this.process) return;

    this.process.stdout?.on('data', (data: Buffer) => {
      this.log(`[stdout] ${data.toString().trim()}`);
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      this.log(`[stderr] ${data.toString().trim()}`);
    });

    this.process.on('exit', (code) => {
      this.log(`Server exited with code ${code}`);
      this.isRunning = false;
      this.stopHealthCheck();

      if (code !== 0 && code !== null) {
        this.handleCrash(code);
      }
    });

    this.process.on('error', (err) => {
      this.log(`Server error: ${err.message}`);
      this.isRunning = false;
      this.handleCrash(1);
    });

    // Capture stderr to detect port conflicts
    let stderrBuffer = '';
    this.process.stderr?.on('data', (data: Buffer) => {
      stderrBuffer += data.toString();

      // Check for port in use error
      if (stderrBuffer.includes('EADDRINUSE') || stderrBuffer.includes('port') && stderrBuffer.includes('in use')) {
        this.handlePortInUse();
      }
    });
  }

  /**
   * Wait for server to become healthy
   */
  private async waitForHealth(maxAttempts = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      if (await this.isHealthy()) {
        this.log(`Health check passed on attempt ${i + 1}`);
        return;
      }
      this.log(`Health check attempt ${i + 1}/${maxAttempts} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error('Server failed to become healthy');
  }

  /**
   * Start health check monitoring
   */
  private startHealthCheck(): void {
    this.stopHealthCheck();

    this.healthCheckInterval = setInterval(async () => {
      const healthy = await this.isHealthy();
      if (!healthy && this.isRunning) {
        this.log('⚠ Server health check failed');
        this.isRunning = false;
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Stop health check monitoring
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Handle server crash
   */
  private handleCrash(code: number): void {
    this.process = null;

    vscode.window.showErrorMessage(
      'OpenCode server crashed',
      'Restart Server',
      'Show Logs'
    ).then(action => {
      if (action === 'Restart Server') {
        this.restart().catch(err => {
          vscode.window.showErrorMessage(`Failed to restart server: ${err.message}`);
        });
      } else if (action === 'Show Logs') {
        this.showLogs();
      }
    });
  }

  /**
   * Handle port already in use
   */
  private handlePortInUse(): void {
    this.log(`⚠ Port ${this.port} is already in use`);

    vscode.window.showErrorMessage(
      `OpenCode server port ${this.port} is already in use. Another instance may be running.`,
      'Kill & Restart',
      'Show Logs'
    ).then(async action => {
      if (action === 'Kill & Restart') {
        try {
          await this.killProcessOnPort(this.port);
          this.log(`Killed process on port ${this.port}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.restart();
        } catch (err) {
          vscode.window.showErrorMessage(`Failed to restart: ${err}`);
        }
      } else if (action === 'Show Logs') {
        this.showLogs();
      }
    });
  }

  /**
   * Check if a port is in use
   */
  private async isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${port}/`, { timeout: 1000 }, (res) => {
        res.resume();
        resolve(true); // Port is in use
      });

      req.on('error', () => {
        resolve(false); // Port is free
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false); // Port is free
      });
    });
  }

  /**
   * Kill process using a specific port
   */
  private async killProcessOnPort(port: number): Promise<void> {
    if (process.platform === 'win32') {
      try {
        // Find PID using the port
        const netstatOutput = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
        const lines = netstatOutput.split('\n');

        for (const line of lines) {
          if (line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && /^\d+$/.test(pid)) {
              this.log(`Killing process ${pid} on port ${port}`);
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            }
          }
        }
      } catch (error) {
        this.log(`Failed to kill process on port ${port}: ${error}`);
      }
    } else {
      // Unix-like systems
      try {
        const lsofOutput = execSync(`lsof -t -i:${port}`, { encoding: 'utf-8' });
        const pid = lsofOutput.trim();
        if (pid) {
          this.log(`Killing process ${pid} on port ${port}`);
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        }
      } catch (error) {
        this.log(`Failed to kill process on port ${port}: ${error}`);
      }
    }
  }

  /**
   * Log message to output channel
   */
  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.outputChannel.appendLine(`[${timestamp}] ${message}`);
  }
}
