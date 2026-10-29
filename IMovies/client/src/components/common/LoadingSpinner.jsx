import React from 'react';

export const LoadingSpinner = ({ message = 'Loading cinema experience...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5">
      <div className="spinner-grow text-danger mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted fw-semibold small tracking-wide">{message}</p>
    </div>
  );
};
