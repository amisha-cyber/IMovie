import { body } from 'express-validator';
import { validate } from '../middleware/validator.js';

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  '1234567890',
  '123456789',
  '12345678',
  'qwertyuiop',
  'admin12345',
  'iloveyou123',
  'welcome123',
  'passcode123',
  'sunshine123',
  'princess123',
  'football123',
  'monkey12345',
  'charlie1234',
  'aa12345678',
  'dragon12345',
  'master12345'
]);

export const validatePasswordPolicy = (value) => {
  if (!value || typeof value !== 'string') {
    throw new Error('Password is required');
  }
  if (value.length < 10) {
    throw new Error('Password must be at least 10 characters long');
  }
  if (Buffer.byteLength(value, 'utf8') > 72) {
    throw new Error('Password must not exceed 72 bytes');
  }
  if (COMMON_PASSWORDS.has(value.toLowerCase())) {
    throw new Error('This password is too common and easily guessed. Please choose a more secure password.');
  }
  return true;
};

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .custom(validatePasswordPolicy),
  body('confirmPassword')
    .optional({ checkFalsy: true })
    .custom((value, { req }) => {
      if (req.body.confirmPassword && value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  validate
];

export const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  validate
];

export const resetPasswordValidator = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .custom(validatePasswordPolicy),
  body('confirmPassword')
    .optional({ checkFalsy: true })
    .custom((value, { req }) => {
      if (req.body.confirmPassword && value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  validate
];

export const verifyEmailValidator = [
  body('token')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Verification token must be valid'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('otp')
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be a 6-digit number')
    .isNumeric()
    .withMessage('Verification code must contain only numbers'),
  body().custom((value, { req }) => {
    if (!req.body.token && !(req.body.email && req.body.otp)) {
      throw new Error('Either a verification token or an email and 6-digit OTP code is required');
    }
    return true;
  }),
  validate
];

export const resendVerificationValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  validate
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

export const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .trim(),
  body('avatar')
    .optional()
    .trim(),
  validate
];
