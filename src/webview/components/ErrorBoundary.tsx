import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-[var(--oc-bg)] text-[var(--oc-fg)] p-4">
          <div className="max-w-lg w-full bg-[var(--oc-surface)] border border-[var(--oc-border)] rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <svg
                className="w-6 h-6 text-[var(--oc-danger)] flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">Something went wrong</h2>
                <p className="text-sm text-[var(--oc-muted)] mb-4">
                  An unexpected error occurred in the OpenGUI interface.
                </p>
              </div>
            </div>

            {this.state.error && (
              <details className="mb-4 bg-[var(--oc-bg)] border border-[var(--oc-border)] rounded p-3">
                <summary className="text-sm font-medium cursor-pointer text-[var(--oc-muted)] hover:text-[var(--oc-fg)]">
                  Error details
                </summary>
                <div className="mt-2 text-xs font-mono text-[var(--oc-danger)] whitespace-pre-wrap break-words">
                  <div className="font-bold mb-1">{this.state.error.name}: {this.state.error.message}</div>
                  {this.state.error.stack && (
                    <div className="opacity-75">{this.state.error.stack}</div>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="primary">
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="secondary">
                Reload Webview
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
