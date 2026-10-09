import { ApiError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid resource ID format: ${err.value}`);
  }

  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`Duplicate value for '${field}'. This value is already in use.`);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = ApiError.badRequest(`Validation error: ${messages.join(', ')}`);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authorization token');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Authorization token has expired');
  }

  // Handle Multer file size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = ApiError.badRequest('File size cannot exceed 10MB limit');
  }

  // Default to 500 if not an ApiError instance
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  if (statusCode === 500) {
    console.error('[Unhandled Server Error]', err);
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

