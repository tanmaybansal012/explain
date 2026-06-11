const logger = require('../config/logger');

/**
 * Centralised error handler — catches everything thrown/passed to next(err).
 * Express identifies this as an error handler because it has 4 params.
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.path} — ${err.message}`, { stack: err.stack });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation failed', details: messages });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({ error: `Duplicate value for field: ${field}` });
  }

  // Sequelize validation
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors.map(e => e.message);
    return res.status(400).json({ error: 'Validation failed', details });
  }

  // JWT errors already handled in middleware; catch anything that slips through
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Generic fallback
  const status  = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
};

/**
 * 404 handler — place after all routes.
 */
const notFound = (req, res) =>
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });

module.exports = { errorHandler, notFound };
