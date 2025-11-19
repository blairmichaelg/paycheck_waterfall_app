import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Could send to error tracking service here if needed
  }

  handleReset = () => {
    // Clear localStorage to reset app state
    if (
      window.confirm(
        'Reset the app? This will clear your configuration. Make sure to export first if you want to keep it.'
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 32,
              maxWidth: 500,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h1 style={{ fontSize: 24, marginBottom: 16, color: '#1f2937' }}>
              😕 Oops! Something went wrong
            </h1>
            <p style={{ color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
              PayFlow encountered an unexpected error. This might be due to corrupted data or a bug.
              You can try refreshing the page or resetting the app.
            </p>

            {this.state.error && (
              <details style={{ marginBottom: 24 }}>
                <summary
                  style={{
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                >
                  Error details (for debugging)
                </summary>
                <pre
                  style={{
                    background: '#f9fafb',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 12,
                    overflow: 'auto',
                    color: '#1f2937',
                  }}
                >
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  color: '#1f2937',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                🔧 Reset App
              </button>
              <a
                href="mailto:feedback@payflow.app?subject=Error%20Report"
                style={{
                  padding: '12px 24px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  color: '#1f2937',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: 14,
                  display: 'inline-block',
                }}
              >
                📧 Report Bug
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
