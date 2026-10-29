import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.js';

export const createShowValidator = [
  body('movie').isMongoId().withMessage('Valid movie ID is required'),
  body('theatre').isMongoId().withMessage('Valid theatre ID is required'),
  body('screen').isMongoId().withMessage('Valid screen ID is required'),
  body('startTime').notEmpty().withMessage('Show start time is required').isISO8601().withMessage('Invalid start time format'),
  body('endTime').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid end time format'),
  body('basePrice').optional().isNumeric().withMessage('Base price must be a number').custom((v) => Number(v) > 0),
  validate
];

export const updateShowValidator = [
  param('id').isMongoId().withMessage('Invalid show ID'),
  body('startTime').optional().isISO8601().withMessage('Invalid start time format'),
  body('endTime').optional().isISO8601().withMessage('Invalid end time format'),
  body('basePrice').optional().isNumeric().custom((v) => Number(v) > 0),
  validate
];
