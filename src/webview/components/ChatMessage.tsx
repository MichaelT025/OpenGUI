import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { IconButton } from './ui/IconButton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className={`mb-8 group ${isUser ? 'flex justify-end' : ''}`}>
      <div className={isUser ? 'max-w-[75%]' : 'w-full'}>
        {/* Header with role and timestamp */}
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-[10px] uppercase font-semibold tracking-wide text-[var(--oc-muted)]">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-[10px] text-[var(--oc-muted)] opacity-60" title={message.timestamp.toLocaleString()}>
            {formatRelativeTime(message.timestamp)}
          </span>
          
          {/* Copy button - shows on hover */}
          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              aria-label={showCopyFeedback ? 'Copied!' : 'Copy message'}
              onClick={handleCopy}
              size="sm"
              className={showCopyFeedback ? 'text-[var(--oc-success)]' : ''}
            >
              {showCopyFeedback ? (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"/>
                  <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"/>
                </svg>
              )}
            </IconButton>
          </div>
        </div>
        
        {/* Message content */}
        <div className={`leading-relaxed ${isUser ? 'bg-[var(--oc-accent)] bg-opacity-10 rounded-lg px-4 py-3' : ''}`}>
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            <ReactMarkdown
              className="prose prose-sm max-w-none"
              components={{
                // Style code blocks as "Artifacts"
                pre: ({ node, ...props }) => (
                  <div className="not-prose my-4">
                    <pre
                      className="bg-[var(--vscode-textCodeBlock-background)] border border-[var(--oc-border)] rounded-lg p-4 overflow-x-auto text-sm"
                      {...props}
                    />
                  </div>
                ),
                code: ({ node, inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  
                  if (!inline && match) {
                    return (
                      <div className="not-prose my-4 rounded-lg border border-[var(--oc-border)] overflow-hidden bg-[var(--vscode-textCodeBlock-background)]">
                        {/* Artifact header */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--oc-border)] bg-[var(--oc-surface)] bg-opacity-50">
                          <div className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--oc-muted)]">
                              <path d="M4 1.75C4 .784 4.784 0 5.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0114.25 16h-9a1.75 1.75 0 01-1.75-1.75V6h-.75A1.75 1.75 0 011 4.25v-2.5C1 .784 1.784 0 2.75 0H4v1.75zm1.5 0V0h-.75a.25.25 0 00-.25.25v1.5c0 .138.112.25.25.25h.75zm3.25 0V0h-2v1.75h2zm3 0h.75a.25.25 0 00.25-.25v-.917a.75.75 0 00-.22-.53L10.647.22a.75.75 0 00-.53-.22H9.5v1.75h2.25z"/>
                            </svg>
                            <span className="text-xs font-medium text-[var(--oc-muted)]">{match[1]}</span>
                          </div>
                          <button
                            onClick={() => handleCopyCode(codeString)}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs text-[var(--oc-fg)] hover:bg-[var(--oc-surface)] rounded transition-colors"
                            aria-label="Copy code"
                          >
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"/>
                              <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"/>
                            </svg>
                            Copy
                          </button>
                        </div>
                        {/* Code content */}
                        <code className={`${className} block p-4 overflow-x-auto`} {...props}>
                          {children}
                        </code>
                      </div>
                    );
                  }
                  
                  return (
                    <code
                      className="bg-[var(--vscode-textCodeBlock-background)] px-1.5 py-0.5 rounded text-[13px] font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // Style other markdown elements with generous spacing
                p: ({ node, ...props }) => <p className="my-3 leading-relaxed" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside my-3 space-y-1.5" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside my-3 space-y-1.5" {...props} />,
                li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                h1: ({ node, ...props }) => <h1 className="text-xl font-semibold mt-6 mb-3" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mt-5 mb-2.5" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-4 mb-2" {...props} />,
                a: ({ node, ...props }) => (
                  <a
                    className="text-[var(--vscode-textLink-foreground)] hover:text-[var(--vscode-textLink-activeForeground)] underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-3 border-[var(--oc-border)] pl-4 italic my-3 text-[var(--oc-muted)]"
                    {...props}
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
