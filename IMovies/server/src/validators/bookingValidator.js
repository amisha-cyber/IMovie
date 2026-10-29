import { body, param } from 'express-validator';
import { validate } from '../middleware/validator.js';

export const holdSeatsValidator = [
  body('showId').isMongoId().withMessage('Valid showId is required'),
  body('seats')
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 seats'),
  body('seats.*').isString().trim().notEmpty().withMessage('Each seat number must be a valid string'),
  validate
];

export const createPaymentOrderValidator = [
  body('bookingId').isMongoId().withMessage('Valid bookingId is required'),
  validate
];

export const confirmBookingValidator = [
  body('bookingId').isMongoId().withMessage('Valid bookingId is required'),
  body('orderId').notEmpty().withMessage('orderId is required'),
  body('paymentId').notEmpty().withMessage('paymentId is required'),
  validate
];

export const cancelBookingValidator = [
  param('id').isMongoId().withMessage('Valid booking ID is required'),
  body('reason').optional().trim().isLength({ max: 250 }),
  validate
];
