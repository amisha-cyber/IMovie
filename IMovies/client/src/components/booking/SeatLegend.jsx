import React from 'react';

export const SeatLegend = ({ pricing }) => {
  return (
    <div
      className="p-3 rounded-4 mb-4"
      style={{
        background: 'var(--imv-surface-1)',
        border: '1px solid var(--imv-border)'
      }}
    >
      <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 gap-md-4 small">
        <div className="d-flex align-items-center gap-2">
          <div className="seat-button seat-available m-0" style={{ width: '22px', height: '22px' }}></div>
          <span style={{ color: 'var(--imv-text-muted)' }}>Available</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="seat-button seat-selected m-0" style={{ width: '22px', height: '22px' }}></div>
          <span className="text-white fw-bold">Selected</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="seat-button seat-held m-0" style={{ width: '22px', height: '22px' }}></div>
          <span style={{ color: 'var(--imv-gold)' }}>Reserved (Hold)</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="seat-button seat-booked m-0" style={{ width: '22px', height: '22px' }}></div>
          <span style={{ color: 'var(--imv-text-disabled)' }}>Sold Out</span>
        </div>
      </div>

      {pricing && (
        <div
          className="border-top mt-3 pt-2 d-flex flex-wrap justify-content-center gap-4 small"
          style={{
            borderColor: 'var(--imv-border)',
            color: 'var(--imv-text-muted)'
          }}
        >
          <span>Silver: <strong className="text-white">₹{pricing.silver || 200}</strong></span>
          <span>Gold: <strong className="text-white">₹{pricing.gold || 260}</strong></span>
          <span>Platinum / Recliner: <strong style={{ color: 'var(--imv-gold)' }}>₹{pricing.platinum || 360}</strong></span>
        </div>
      )}
    </div>
  );
};
