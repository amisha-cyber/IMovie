import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="container py-5 my-5 text-center">
      <div className="d-inline-flex p-4 rounded-circle bg-danger bg-opacity-10 text-danger mb-4">
        <Film size={64} />
      </div>
      <h1 className="display-3 fw-bold mb-2">404</h1>
      <h3 className="fw-semibold text-light mb-3">Page Not Found</h3>
      <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '480px' }}>
        The cinema screen or reel you are looking for has been moved, rescheduled, or doesn't exist.
      </p>
      <Link to="/" className="btn btn-cinema d-inline-flex align-items-center gap-2 px-4 py-2">
        <Home size={18} /> Return to Home
      </Link>
    </div>
  );
};
