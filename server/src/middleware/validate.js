import { ApiError } from '../utils/errors.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Update req with sanitized data
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    next();
  } catch (error) {
    if (error.errors) {
      const messages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      return next(ApiError.badRequest('Validation failed: ' + messages.join(', '), error.errors));
    }
    next(error);
  }
};

