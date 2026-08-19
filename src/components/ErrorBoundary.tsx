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
        <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <div className="max-w-md w-full p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <p className="text-5xl mb-3" aria-hidden="true">
              ⚠️
            </p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 font-sport">
              Une erreur inattendue s'est produite
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Veuillez réessayer. Si le problème persiste, rechargez l'application.
            </p>

            {this.state.error && (
              <div className="text-left bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg p-3 mb-4 text-xs font-mono text-red-700 dark:text-red-300 overflow-x-auto">
                <p className="font-bold mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-[10px] whitespace-pre-wrap opacity-75">
                    {this.state.error.stack.slice(0, 300)}...
                  </pre>
                )}
              </div>
            )}

            <button
              className="w-full px-5 py-3 bg-[#3629e1] hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-colors shadow-md"
              onClick={() => window.location.reload()}
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
