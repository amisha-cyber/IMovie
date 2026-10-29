import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../store/authSlice.js';
import { Film, Mail, Lock, LogIn, Sparkles, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../services/authService.js';
import { sanitizeRedirectPath } from '../utils/sanitizeRedirect.js';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resending, setResending] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, authErrorCode, unverifiedEmail } = useSelector((state) => state.auth);

  const queryParams = new URLSearchParams(location.search);
  const redirect = sanitizeRedirectPath(queryParams.get('redirect'), '/');

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());

    const result = await dispatch(loginUser({ email: email.trim(), password }));
    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back to IMovies!');
      navigate(redirect);
    }
  };

  const handleQuickResend = async () => {
    const targetEmail = unverifiedEmail || email;
    if (!targetEmail) return;

    setResending(true);
    try {
      const res = await authService.resendVerification({ email: targetEmail });
      toast.success(res.message || 'Verification email resent successfully!');
      navigate(`/verify-email?email=${encodeURIComponent(targetEmail)}`);
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  const handleFillDemoUser = () => {
    setEmail('john@example.com');
    setPassword('User@123456');
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@imovies.com');
    setPassword('Admin@123456');
  };

  const isEmailNotVerified = authErrorCode === 'EMAIL_NOT_VERIFIED' || (error && error.toLowerCase().includes('not verified'));

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="bg-dark p-4 p-md-5 rounded-4 border border-secondary border-opacity-25 shadow-lg w-100" style={{ maxWidth: '460px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex bg-danger p-3 rounded-3 mb-3 shadow">
            <Film size={28} className="text-white" />
          </div>
          <h2 className="fw-bold text-light mb-1">Sign In to IMovies</h2>
          <p className="text-muted small">Access your bookings and real-time seat reservations</p>
        </div>

        {/* Unverified Email Warning Alert */}
        {isEmailNotVerified ? (
          <div className="alert alert-warning border-0 p-3 mb-4 rounded-3 text-start">
            <div className="d-flex align-items-start gap-2 mb-2">
              <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-1" />
              <div>
                <strong className="text-warning d-block">Email Verification Required</strong>
                <span className="small text-dark fw-medium">
                  Your account is registered but your email has not been verified. Please verify your email to log in and reserve cinema seats.
                </span>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2 mt-2 pt-2 border-top border-warning border-opacity-25">
              <Link
                to={`/verify-email?email=${encodeURIComponent(unverifiedEmail || email)}`}
                className="btn btn-warning btn-sm text-dark fw-semibold d-flex align-items-center gap-1"
                id="verify-email-now-btn"
              >
                Verify Email Now <ArrowRight size={14} />
              </Link>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm d-flex align-items-center gap-1"
                onClick={handleQuickResend}
                disabled={resending}
              >
                {resending ? <span className="spinner-border spinner-border-sm" /> : <RefreshCw size={12} />} Resend Email
              </button>
            </div>
          </div>
        ) : (
          error && (
            <div className="alert alert-danger py-2 px-3 small border-0 mb-3">
              {error}
            </div>
          )
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-muted small">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-black border-secondary text-muted">
                <Mail size={16} />
              </span>
              <input
                id="login-email-input"
                type="email"
                required
                className="form-control bg-black border-secondary text-light py-2"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-muted small">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-black border-secondary text-muted">
                <Lock size={16} />
              </span>
              <input
                id="login-password-input"
                type="password"
                required
                className="form-control bg-black border-secondary text-light py-2"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-cinema w-100 py-2 d-flex align-items-center justify-content-center gap-2 mb-3"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Fill Buttons */}
        <div className="border-top border-secondary border-opacity-25 pt-3 mb-3">
          <div className="text-muted small mb-2 text-center" style={{ fontSize: '0.75rem' }}>
            <Sparkles size={12} className="text-warning me-1" /> Quick Demo Credentials:
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm w-50 py-1"
              style={{ fontSize: '0.75rem' }}
              onClick={handleFillDemoUser}
            >
              Demo User
            </button>
            <button
              type="button"
              className="btn btn-outline-warning btn-sm w-50 py-1 text-warning"
              style={{ fontSize: '0.75rem' }}
              onClick={handleFillDemoAdmin}
            >
              Demo Admin
            </button>
          </div>
        </div>

        <div className="text-center text-muted small">
          Don't have an account?{' '}
          <Link to="/register" className="text-danger text-decoration-none fw-semibold">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
