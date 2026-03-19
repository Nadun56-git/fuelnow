/**
 * Global Error Handler Middleware
 * Catches and formats all errors for consistent API responses
 */

const mongoose = require('mongoose');

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    error.message = 'Resource not found - Invalid ID format';
    error.statusCode = 404;
    return res.status(404).json({
      success: false,
      message: error.message,
      error: 'INVALID_OBJECT_ID'
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `${field} already exists`;
    error.statusCode = 400;
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'DUPLICATE_FIELD',
      field
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error.message = messages.join(', ');
    error.statusCode = 400;
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: 'VALIDATION_ERROR',
      details: messages
    });
  }

  // Mongoose geospatial error
  if (err.message && err.message.includes('2dsphere')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid coordinates for geospatial query',
      error: 'INVALID_COORDINATES'
    });
  }

  // Axios/Nominatim errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      message: 'External service unavailable. Please try again later.',
      error: 'SERVICE_UNAVAILABLE'
    });
  }

  // Default to server error
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    error: err.errorCode || 'SERVER_ERROR',
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async handler wrapper - catches errors in async route handlers
 * Usage: asyncHandler(async (req, res) => { ... })
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 Not Found handler for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new APIError(
    `Route not found: ${req.originalUrl}`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

module.exports = errorHandler;
module.exports.APIError = APIError;
module.exports.asyncHandler = asyncHandler;
module.exports.notFound = notFound;
