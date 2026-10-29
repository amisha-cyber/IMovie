import crypto from 'crypto';

/**
 * Generates a cryptographically secure 32-byte hex string token
 * @returns {string} 64 character hex string
 */
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generates a cryptographically secure 6-digit numeric OTP string
 * @returns {string} 6-digit string (100000 - 999999)
 */
export const generateVerificationOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Produces a SHA-256 hex hash of the given token or OTP string
 * @param {string} value
 * @returns {string}
 */
export const hashVerificationValue = (value) => {
  if (!value || typeof value !== 'string') return '';
  return crypto.createHash('sha256').update(value.trim()).digest('hex');
};
