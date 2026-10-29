import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Film, User, LogOut, Ticket, Shield, Menu, X, Search, MapPin, ChevronDown, Bell } from 'lucide-react';
import { logoutUser } from '../../store/authSlice.js';
import { toast } from 'react-toastify';

export const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.info('Logged out successfully.');
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/movies?search=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="stitch-navbar sticky-top w-100">
      <div className="container-xl d-flex align-items-center justify-content-between py-3">
        {/* Left: Brand Logo & Location Hub */}
        <div className="d-flex align-items-center gap-3">
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <div
              className="d-flex align-items-center justify-content-center rounded-3 p-2"
              style={{
                background: 'linear-gradient(135deg, #E50914 0%, #B80710 100%)',
                boxShadow: '0 0 16px rgba(229, 9, 20, 0.45)'
              }}
            >
              <Film className="text-white" size={20} />
            </div>
            <span
              className="font-display fs-4 fw-bold text-white tracking-tight"
              style={{ letterSpacing: '-0.02em' }}
            >
              I<span style={{ color: 'var(--imv-primary)' }}>Movies</span>
            </span>
          </Link>

          {/* Location Selector (Stitch Specification) */}
          <Link
            to="/theatres"
            className="d-none d-xl-flex align-items-center gap-1 px-3 py-1.5 rounded-3 text-decoration-none"
            style={{
              background: 'var(--imv-surface-container)',
              border: '1px solid var(--imv-border)',
              color: 'var(--imv-text-med)',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <MapPin size={15} style={{ color: 'var(--imv-primary)' }} />
            <span>Mumbai - Flagship IMAX</span>
            <ChevronDown size={14} className="text-muted ms-1" />
          </Link>
        </div>

        {/* Center: Navigation Pill Container (Stitch Design) */}
        <nav
          className="d-none d-md-flex align-items-center gap-1 p-1 rounded-3"
          style={{
            background: 'var(--imv-surface-container-low)',
            border: '1px solid var(--imv-border)'
          }}
        >
          <Link
            to="/movies"
            className={`px-3 py-1.5 rounded-3 text-decoration-none label-caps transition-all ${
              location.pathname.startsWith('/movies')
                ? 'text-white'
                : 'text-muted'
            }`}
            style={{
              background: location.pathname.startsWith('/movies')
                ? 'var(--imv-primary)'
                : 'transparent',
              boxShadow: location.pathname.startsWith('/movies')
                ? '0 0 20px rgba(229, 9, 20, 0.45)'
                : 'none',
              color: location.pathname.startsWith('/movies') ? '#fff' : 'var(--imv-text-muted)'
            }}
          >
            Movies
          </Link>
          <Link
            to="/theatres"
            className={`px-3 py-1.5 rounded-3 text-decoration-none label-caps transition-all ${
              location.pathname === '/theatres'
                ? 'text-white'
                : 'text-muted'
            }`}
            style={{
              background: location.pathname === '/theatres'
                ? 'var(--imv-primary)'
                : 'transparent',
              boxShadow: location.pathname === '/theatres'
                ? '0 0 20px rgba(229, 9, 20, 0.45)'
                : 'none',
              color: location.pathname === '/theatres' ? '#fff' : 'var(--imv-text-muted)'
            }}
          >
            Theatres
          </Link>
        </nav>

        {/* Right: Search, Admin Shortcut, & User Auth */}
        <div className="d-flex align-items-center gap-3">
          {/* Quick Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="d-none d-lg-flex align-items-center position-relative"
          >
            <Search
              size={15}
              className="position-absolute ms-3 pointer-events-none"
              style={{ color: 'var(--imv-text-muted)' }}
            />
            <input
              type="text"
              className="form-control form-control-sm text-light ps-5 pe-3 py-2"
              placeholder="Search movies, halls..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              style={{
                width: '210px',
                background: 'var(--imv-surface-container)',
                border: '1px solid var(--imv-border)',
                borderRadius: '8px',
                fontSize: '13px'
              }}
            />
          </form>

          {/* Admin Portal Shortcut if Admin */}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="d-none d-lg-flex align-items-center gap-1 px-2.5 py-1.5 rounded label-caps text-decoration-none"
              style={{
                background: 'var(--imv-surface-container)',
                border: '1px solid var(--imv-border)',
                color: 'var(--imv-gold)',
                fontSize: '11px'
              }}
            >
              <Shield size={13} style={{ color: 'var(--imv-gold)' }} />
              <span>Admin</span>
            </Link>
          )}

          {/* User Account / Auth Actions */}
          {isAuthenticated ? (
            <div className="dropdown">
              <button
                className="d-flex align-items-center gap-2 p-1 pe-2 rounded-pill border-0 dropdown-toggle text-decoration-none"
                style={{
                  background: 'var(--imv-surface-container)',
                  border: '1px solid var(--imv-border)'
                }}
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white font-display fw-bold"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'var(--imv-surface-container-high)',
                    border: '1.5px solid var(--imv-gold)',
                    fontSize: '12px'
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="d-none d-sm-flex flex-column align-items-start text-start me-1">
                  <span
                    className="text-white fw-bold text-truncate"
                    style={{ fontSize: '13px', maxWidth: '100px' }}
                  >
                    {user?.name}
                  </span>
                  <span
                    className="label-caps"
                    style={{
                      fontSize: '9px',
                      color: 'var(--imv-gold)',
                      lineHeight: '1'
                    }}
                  >
                    VIP GOLD
                  </span>
                </div>
              </button>
              <ul
                className="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow-2xl p-2 mt-2"
                style={{
                  background: 'var(--imv-surface-2)',
                  border: '1px solid var(--imv-border)',
                  borderRadius: '12px',
                  minWidth: '200px'
                }}
              >
                <li>
                  <Link
                    to="/my-bookings"
                    className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-2"
                  >
                    <Ticket size={16} style={{ color: 'var(--imv-primary)' }} />
                    <span>My Bookings</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-2"
                  >
                    <User size={16} />
                    <span>Account Profile</span>
                  </Link>
                </li>
                {user?.role === 'admin' && (
                  <li>
                    <Link
                      to="/admin"
                      className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-2"
                      style={{ color: 'var(--imv-gold)' }}
                    >
                      <Shield size={16} />
                      <span>Admin Management</span>
                    </Link>
                  </li>
                )}
                <li>
                  <hr className="dropdown-divider my-1" style={{ borderColor: 'var(--imv-border)' }} />
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-2 text-danger"
                  >
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <Link
                to="/login"
                className="btn btn-sm btn-cinema-outline px-3 py-1.5"
                style={{ fontSize: '13px' }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-sm btn-cinema px-3 py-1.5"
                style={{ fontSize: '13px' }}
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Toggle */}
          <button
            className="d-md-none btn btn-sm border-0 text-white p-1"
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="d-md-none p-3 border-top"
          style={{
            background: 'var(--imv-surface-1)',
            borderColor: 'var(--imv-border)'
          }}
        >
          <form onSubmit={handleSearchSubmit} className="mb-3">
            <input
              type="text"
              className="form-control form-control-sm text-light py-2"
              placeholder="Search movies..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              style={{
                background: 'var(--imv-surface-container)',
                borderColor: 'var(--imv-border)'
              }}
            />
          </form>
          <div className="d-flex flex-column gap-2">
            <Link
              to="/movies"
              className="btn btn-cinema-outline text-start py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Explore Movies
            </Link>
            <Link
              to="/theatres"
              className="btn btn-cinema-outline text-start py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Auditorium Theatres
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="btn btn-cinema-outline text-start py-2"
                style={{ color: 'var(--imv-gold)' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin Management Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
