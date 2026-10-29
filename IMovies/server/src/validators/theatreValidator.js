import { body, param } from 'express-validator';
import { validate } from '../middleware/validator.js';

export const createTheatreValidator = [
  body('name').trim().notEmpty().withMessage('Theatre name is required').isLength({ min: 2, max: 150 }),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').optional().trim(),
  body('postalCode').optional().trim(),
  body('country').optional().trim(),
  validate
];

export const updateTheatreValidator = [
  param('id').isMongoId().withMessage('Invalid theatre ID'),
  body('name').optional().trim().notEmpty().withMessage('Theatre name cannot be empty').isLength({ min: 2, max: 150 }),
  body('address').optional().trim().notEmpty(),
  body('city').optional().trim().notEmpty(),
  validate
];
