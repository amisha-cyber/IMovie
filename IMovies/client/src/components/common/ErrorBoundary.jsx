import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 my-5 text-center">
          <div className="bg-dark p-5 rounded-4 border border-danger border-opacity-25 shadow-lg d-inline-block" style={{ maxWidth: '600px' }}>
            <AlertTriangle size={54} className="text-danger mb-3" />
            <h2 className="fw-bold mb-2">Something went wrong</h2>
            <p className="text-muted mb-4 small">
              An unexpected error occurred while rendering the page. Please try refreshing or returning to the home page.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <button onClick={this.handleReload} className="btn btn-cinema d-flex align-items-center gap-2">
                <RefreshCw size={18} /> Reload Page
              </button>
              <a href="/" className="btn btn-outline-light">
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
