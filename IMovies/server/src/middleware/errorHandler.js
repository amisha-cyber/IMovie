import { logger } from '../utils/logger.js';
import { errorResponse } from '../utils/apiResponse.js';
import { isProduction } from '../config/environment.js';

export const notFoundHandler = (req, res, next) => {
  return errorResponse(res, `API route not found: ${req.method} ${req.originalUrl}`, 404);
};

export const globalErrorHandler = (err, req, res, next) => {
  logger.error(`Unhandled Error [${req.method} ${req.originalUrl}]:`, err.stack || err.message);

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    return errorResponse(res, `Resource not found with specified ID: ${err.value}`, 400);
  }

  // Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return errorResponse(res, `A record with this ${field} already exists.`, 409);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
    return errorResponse(res, 'Database validation failed.', 400, errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid authentication token.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Authentication token has expired. Please log in again.', 401);
  }

  const statusCode = err.statusCode || 500;
  const message = isProduction() && statusCode === 500
    ? 'Internal server error. Please try again later.'
    : err.message || 'Internal server error.';

  return errorResponse(res, message, statusCode);
};
