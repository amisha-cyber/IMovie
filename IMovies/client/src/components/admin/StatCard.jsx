import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color = 'danger', subtitle }) => {
  return (
    <div className="bg-dark p-4 rounded-4 border border-secondary border-opacity-25 h-100 shadow-sm position-relative overflow-hidden">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="text-muted small text-uppercase fw-semibold tracking-wider">{title}</span>
        <div className={`p-2 rounded-3 bg-${color} bg-opacity-10 text-${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <h3 className="fw-bold mb-1 text-light">{value}</h3>
      {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
    </div>
  );
};
