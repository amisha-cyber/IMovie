import { body, param } from 'express-validator';
import { validate } from '../middleware/validator.js';

export const createScreenValidator = [
  param('theatreId').isMongoId().withMessage('Invalid theatre ID'),
  body('name').trim().notEmpty().withMessage('Screen name is required').isLength({ max: 100 }),
  body('screenType').optional().trim(),
  body('seatingLayout').optional().isObject().withMessage('Seating layout must be an object'),
  validate
];

export const updateScreenValidator = [
  param('id').isMongoId().withMessage('Invalid screen ID'),
  body('name').optional().trim().notEmpty().withMessage('Screen name cannot be empty'),
  body('screenType').optional().trim(),
  body('isActive').optional().isBoolean(),
  validate
];
