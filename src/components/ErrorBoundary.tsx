import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950">
          <div className="max-w-sm">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Une erreur inattendue s'est produite
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 font-mono break-all">
              {this.state.error?.message}
            </p>
            <button
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
