import React from 'react';
import { Link } from 'react-router-dom';
import { Film, ShieldCheck, Zap, Sparkles, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer
      className="w-100 mt-auto pt-5 pb-4"
      style={{
        background: 'var(--imv-surface-0)',
        borderTop: '1px solid var(--imv-border)',
        boxShadow: '0 -12px 36px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div className="container-xl">
        <div className="row g-4 justify-content-between mb-5">
          {/* Column 1: Brand & Bio */}
          <div className="col-lg-4 col-md-6">
            <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none mb-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 p-2"
                style={{
                  background: 'linear-gradient(135deg, #E50914 0%, #B80710 100%)',
                  boxShadow: '0 0 16px rgba(229, 9, 20, 0.45)'
                }}
              >
                <Film className="text-white" size={18} />
              </div>
              <span className="font-display fs-4 fw-bold text-white tracking-tight">
                I<span style={{ color: 'var(--imv-primary)' }}>Movies</span>
              </span>
            </Link>
            <p
              className="small mb-3"
              style={{ color: 'var(--imv-text-muted)', lineHeight: '1.6' }}
            >
              The definitive cinema destination engineered for film enthusiasts. State-of-the-art IMAX, Dolby Atmos soundscapes, and VIP lounge hospitality tailored to luxury moviegoers.
            </p>
            <div className="d-flex align-items-center gap-2">
              <span
                className="badge px-3 py-1 label-caps"
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  color: 'var(--imv-gold)',
                  border: '1px solid rgba(212, 175, 55, 0.3)'
                }}
              >
                Auditorium Flagship Network
              </span>
            </div>
          </div>

          {/* Column 2: Discovery */}
          <div className="col-lg-2 col-md-3 col-6">
            <h6 className="font-display fw-bold text-white mb-3" style={{ fontSize: '0.95rem' }}>
              Discovery
            </h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li>
                <Link to="/movies?status=now_showing" className="text-decoration-none hover-white" style={{ color: 'var(--imv-text-muted)' }}>
                  Now Showing
                </Link>
              </li>
              <li>
                <Link to="/movies?status=coming_soon" className="text-decoration-none hover-white" style={{ color: 'var(--imv-text-muted)' }}>
                  Coming Soon
                </Link>
              </li>
              <li>
                <Link to="/movies" className="text-decoration-none hover-white" style={{ color: 'var(--imv-text-muted)' }}>
                  All Movies
                </Link>
              </li>
              <li>
                <Link to="/theatres" className="text-decoration-none hover-white" style={{ color: 'var(--imv-text-muted)' }}>
                  Auditorium Theatres
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div className="col-lg-2 col-md-3 col-6">
            <h6 className="font-display fw-bold text-white mb-3" style={{ fontSize: '0.95rem' }}>
              Platform
            </h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li>
                <Link to="/my-bookings" className="text-decoration-none hover-white" style={{ color: 'var(--imv-text-muted)' }}>
                  My Tickets
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-decoration-none hover-white" style={{ color: 'var(--imv-text-muted)' }}>
                  Account Profile
                </Link>
              </li>
              <li>
                <Link to="/verify-email" className="text-decoration-none hover-white" style={{ color: 'var(--imv-text-muted)' }}>
                  Email Verification
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-decoration-none hover-white" style={{ color: 'var(--imv-gold)' }}>
                  Partner Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Payment & Trust */}
          <div className="col-lg-3 col-md-6">
            <h6 className="font-display fw-bold text-white mb-2" style={{ fontSize: '0.95rem' }}>
              Payment & Trust
            </h6>
            <p className="small mb-3" style={{ color: 'var(--imv-text-muted)' }}>
              Secured 256-bit encrypted transactions
            </p>
            <div className="row g-2">
              <div className="col-6">
                <div
                  className="d-flex align-items-center justify-content-center py-2 rounded text-center label-caps"
                  style={{
                    background: 'var(--imv-surface-container)',
                    border: '1px solid var(--imv-border)',
                    color: 'var(--imv-text-med)',
                    fontSize: '10px'
                  }}
                >
                  APPLE PAY
                </div>
              </div>
              <div className="col-6">
                <div
                  className="d-flex align-items-center justify-content-center py-2 rounded text-center label-caps"
                  style={{
                    background: 'var(--imv-surface-container)',
                    border: '1px solid var(--imv-border)',
                    color: 'var(--imv-text-med)',
                    fontSize: '10px'
                  }}
                >
                  GOOGLE PAY
                </div>
              </div>
              <div className="col-6">
                <div
                  className="d-flex align-items-center justify-content-center py-2 rounded text-center label-caps"
                  style={{
                    background: 'var(--imv-surface-container)',
                    border: '1px solid var(--imv-border)',
                    color: 'var(--imv-text-med)',
                    fontSize: '10px'
                  }}
                >
                  VISA
                </div>
              </div>
              <div className="col-6">
                <div
                  className="d-flex align-items-center justify-content-center py-2 rounded text-center label-caps"
                  style={{
                    background: 'var(--imv-surface-container)',
                    border: '1px solid var(--imv-border)',
                    color: 'var(--imv-text-med)',
                    fontSize: '10px'
                  }}
                >
                  MASTERCARD
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="pt-4 border-top d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 small"
          style={{
            borderColor: 'var(--imv-border)',
            color: 'var(--imv-text-muted)'
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} IMovies Entertainment Inc. All rights reserved.
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="hover-white cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover-white cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover-white cursor-pointer">Cookie Preferences</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
