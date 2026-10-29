import { body, param } from 'express-validator';
import { validate } from '../middleware/validator.js';

export const simulatePaymentValidator = [
  body('orderId').trim().notEmpty().withMessage('orderId is required for payment simulation'),
  body('method').optional().isIn(['card', 'upi', 'netbanking', 'wallet', 'simulator']).withMessage('Invalid payment method'),
  validate
];

export const getPaymentStatusValidator = [
  param('id').isMongoId().withMessage('Valid payment ID is required'),
  validate
];
