import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Film, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Mail, KeyRound } from 'lucide-react';
import { authService } from '../services/authService.js';
import { toast } from 'react-toastify';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);
  const autoVerifyAttempted = useRef(false);

  // Countdown timer effect for resend cooldown
  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (tokenParam && !autoVerifyAttempted.current) {
      autoVerifyAttempted.current = true;
      handleAutoTokenVerify(tokenParam, emailParam);
    }
  }, [tokenParam, emailParam]);

  const handleAutoTokenVerify = async (token, userEmail) => {
    setAutoVerifying(true);
    setErrorMessage('');
    try {
      const res = await authService.verifyEmail({ token, email: userEmail });
      setVerificationSuccess(true);
      toast.success(res.message || 'Email verified successfully! Welcome to IMovies.');
    } catch (err) {
      const msg = err.message || 'Invalid or expired verification link.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setAutoVerifying(false);
    }
  };

  const handleOtpChange = (index, value) => {
    // Only allow single digit numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    if (!email) {
      setErrorMessage('Please provide your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyEmail({ email: email.trim(), otp: otpCode });
      setVerificationSuccess(true);
      toast.success(res.message || 'Email verified successfully! You can now log in.');
    } catch (err) {
      const msg = err.message || 'Failed to verify code. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address to receive a new verification code.');
      return;
    }

    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setErrorMessage('');

    try {
      const res = await authService.resendVerification({ email: email.trim() });
      toast.success(res.message || 'A new verification email has been sent!');
      setResendCooldown(60); // 60s cooldown
    } catch (err) {
      const msg = err.message || 'Failed to resend verification email.';
      if (err.data?.retryAfter) {
        setResendCooldown(err.data.retryAfter);
      }
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div
        className="bg-dark p-4 p-md-5 rounded-4 border border-secondary border-opacity-25 shadow-lg w-100"
        style={{ maxWidth: '520px' }}
      >
        {/* IMovies Branding Header */}
        <div className="text-center mb-4">
          <div className="d-inline-flex bg-danger p-3 rounded-3 mb-3 shadow">
            <Film size={32} className="text-white" />
          </div>
          <h2 className="fw-bold text-light mb-1">Verify Your Email</h2>
          <p className="text-muted small">
            To activate your IMovies account and secure cinema bookings, please verify your email address.
          </p>
        </div>

        {/* State 1: Auto Verifying Link Token */}
        {autoVerifying && (
          <div className="text-center py-4">
            <div className="spinner-border text-danger mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="text-light fw-semibold">Validating Verification Link...</h5>
            <p className="text-muted small">Please wait while we confirm your credentials.</p>
          </div>
        )}

        {/* State 2: Verification Success */}
        {verificationSuccess && (
          <div className="text-center py-3">
            <div className="d-inline-flex bg-success bg-opacity-25 p-3 rounded-circle text-success mb-3">
              <CheckCircle2 size={48} />
            </div>
            <h4 className="fw-bold text-light mb-2">Account Verified!</h4>
            <p className="text-muted small mb-4">
              Your email <strong className="text-light">{email || 'address'}</strong> has been successfully verified. You now have full access to movie reservations and tickets.
            </p>
            <button
              id="proceed-to-login-btn"
              className="btn btn-cinema w-100 py-2 d-flex align-items-center justify-content-center gap-2"
              onClick={() => navigate('/login')}
            >
              Proceed to Sign In
            </button>
          </div>
        )}

        {/* State 3: Manual OTP / Token Fallback Form */}
        {!autoVerifying && !verificationSuccess && (
          <>
            {errorMessage && (
              <div className="alert alert-danger py-2 px-3 small border-0 mb-4 d-flex align-items-start gap-2">
                <AlertCircle size={18} className="flex-shrink-0 mt-1" />
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleOtpSubmit}>
              {/* Email field */}
              <div className="mb-4">
                <label className="form-label text-muted small">Registered Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-black border-secondary text-muted">
                    <Mail size={16} />
                  </span>
                  <input
                    id="verify-email-input"
                    type="email"
                    required
                    className="form-control bg-black border-secondary text-light py-2"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* 6-Digit OTP Inputs */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label text-muted small mb-0 d-flex align-items-center gap-1">
                    <KeyRound size={14} /> Enter 6-Digit Verification Code
                  </label>
                  <span className="badge bg-secondary bg-opacity-25 text-muted small">Expires in 60m</span>
                </div>

                <div className="d-flex justify-content-between gap-2" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      id={`otp-input-${index}`}
                      className="form-control text-center bg-black border-secondary text-danger fw-bold fs-4 py-2"
                      style={{ width: '48px', height: '54px' }}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                    />
                  ))}
                </div>
                <div className="form-text text-muted small mt-2">
                  Check your spam/junk folder if the email is not in your inbox.
                </div>
              </div>

              {/* Verify Button */}
              <button
                id="verify-submit-btn"
                type="submit"
                className="btn btn-cinema w-100 py-2 d-flex align-items-center justify-content-center gap-2 mb-3"
                disabled={loading || otp.join('').length !== 6 || !email}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Verify Email
                  </>
                )}
              </button>
            </form>

            {/* Resend Action with Cooldown */}
            <div className="text-center pt-2 pb-3 border-bottom border-secondary border-opacity-25 mb-3">
              <span className="text-muted small me-2">Didn't receive the email or code expired?</span>
              <button
                id="resend-verification-btn"
                type="button"
                className="btn btn-link text-danger p-0 small fw-semibold text-decoration-none"
                disabled={resendCooldown > 0 || resending || !email}
                onClick={handleResend}
              >
                {resending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" /> Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend Code in ${resendCooldown}s`
                ) : (
                  <>
                    <RefreshCw size={14} className="me-1" /> Resend Verification Code
                  </>
                )}
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link to="/login" className="text-muted text-decoration-none small d-inline-flex align-items-center gap-1 hover-light">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
