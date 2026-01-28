import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="h-full flex flex-col items-center justify-center p-6 text-center"
          style={{ backgroundColor: 'var(--tg-bg)' }}
        >
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: '#ef444420' }}
          >
            <AlertTriangle size={32} color="#ef4444" />
          </div>
          <h2 
            className="text-xl font-bold mb-2"
            style={{ color: 'var(--tg-text)' }}
          >
            Oops! Something went wrong
          </h2>
          <p 
            className="text-sm mb-6"
            style={{ color: 'var(--tg-hint)' }}
          >
            Don't worry, your progress is saved.
          </p>
          <button
            onClick={this.handleRefresh}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium active:opacity-80"
            style={{ backgroundColor: 'var(--tg-button)', color: 'var(--tg-button-text)' }}
          >
            <RefreshCw size={18} />
            Refresh App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
