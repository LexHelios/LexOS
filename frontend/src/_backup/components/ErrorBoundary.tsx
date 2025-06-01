import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-screen flex items-center justify-center bg-background p-4"
        >
          <div className="max-w-md w-full space-y-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center"
            >
              <svg
                className="w-8 h-8 text-red-500"
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
            </motion.div>

            <h2 className="text-2xl font-bold text-foreground">Oops! Something went wrong</h2>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              Try Again
            </motion.button>

            <div className="mt-4 text-sm text-muted-foreground">
              <p>If the problem persists, please contact support.</p>
              <p className="mt-2">Error ID: {Math.random().toString(36).substr(2, 9)}</p>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
} 