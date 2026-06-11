const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const logger = require('../config/logger');

/**
 * Auth middleware — verifies JWT and attaches user to req.
 * Usage: router.get('/protected', auth, handler)
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or deactivated' });
    }

    req.user   = user;
    req.userId = user.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    logger.warn('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Generate a signed JWT for a user.
 */
const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

module.exports = { auth, generateToken };
