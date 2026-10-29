import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../store/authSlice.js';
import { Film, User, Mail, Lock, Phone, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [validationError, setValidationError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    dispatch(clearAuthError());

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    if (formData.password.length < 10) {
      setValidationError('Password must be at least 10 characters long.');
      return;
    }

    if (formData.password.length > 72) {
      setValidationError('Password must not exceed 72 characters.');
      return;
    }

    const result = await dispatch(
      registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone.trim()
      })
    );

    if (registerUser.fulfilled.match(result)) {
      toast.success('Registration successful! A verification email has been sent.');
      navigate(`/verify-email?email=${encodeURIComponent(formData.email.trim())}`);
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div
        className="bg-dark p-4 p-md-5 rounded-4 border border-secondary border-opacity-25 shadow-lg w-100"
        style={{ maxWidth: '500px' }}
      >
        <div className="text-center mb-4">
          <div className="d-inline-flex bg-danger p-3 rounded-3 mb-3 shadow">
            <Film size={28} className="text-white" />
          </div>
          <h2 className="fw-bold text-light mb-1">Create an Account</h2>
          <p className="text-muted small">Join IMovies to book seats in real time and unlock tickets</p>
        </div>

        {(validationError || error) && (
          <div className="alert alert-danger py-2 px-3 small border-0 mb-3 d-flex align-items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <div>{validationError || error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="mb-3">
            <label className="form-label text-muted small">Full Name *</label>
            <div className="input-group">
              <span className="input-group-text bg-black border-secondary text-muted">
                <User size={16} />
              </span>
              <input
                id="register-name-input"
                type="text"
                required
                className="form-control bg-black border-secondary text-light py-2"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="mb-3">
            <label className="form-label text-muted small">Email Address *</label>
            <div className="input-group">
              <span className="input-group-text bg-black border-secondary text-muted">
                <Mail size={16} />
              </span>
              <input
                id="register-email-input"
                type="email"
                required
                className="form-control bg-black border-secondary text-light py-2"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-text text-muted small" style={{ fontSize: '0.75rem' }}>
              We will send a secure verification code and link to this address.
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label text-muted small">Password (at least 6 characters) *</label>
            <div className="input-group">
              <span className="input-group-text bg-black border-secondary text-muted">
                <Lock size={16} />
              </span>
              <input
                id="register-password-input"
                type="password"
                required
                minLength={6}
                className="form-control bg-black border-secondary text-light py-2"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label className="form-label text-muted small">Confirm Password *</label>
            <div className="input-group">
              <span className="input-group-text bg-black border-secondary text-muted">
                <Lock size={16} />
              </span>
              <input
                id="register-confirm-password-input"
                type="password"
                required
                minLength={6}
                className={`form-control bg-black text-light py-2 border-secondary ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword ? 'is-invalid border-danger' : ''
                }`}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="text-danger small mt-1" style={{ fontSize: '0.75rem' }}>
                Passwords do not match
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="form-label text-muted small">Phone Number (Optional)</label>
            <div className="input-group">
              <span className="input-group-text bg-black border-secondary text-muted">
                <Phone size={16} />
              </span>
              <input
                id="register-phone-input"
                type="tel"
                className="form-control bg-black border-secondary text-light py-2"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-cinema w-100 py-2 d-flex align-items-center justify-content-center gap-2 mb-3"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              <>
                <UserPlus size={18} /> Register & Send Verification
              </>
            )}
          </button>
        </form>

        <div className="text-center text-muted small border-top border-secondary border-opacity-25 pt-3">
          Already have an account?{' '}
          <Link to="/login" className="text-danger text-decoration-none fw-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
