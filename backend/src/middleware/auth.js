const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

/**
 * JWT Authentication Middleware
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is in Redis (session validation)
    const sessionKey = `session:${decoded.user_id}:${decoded.jti}`;
    const session = await redisClient.get(sessionKey);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid',
      });
    }

    // Attach user info to request
    req.user = decoded;
    req.user_id = decoded.user_id;
    req.tenant_id = decoded.tenant_id;
    req.role = decoded.role;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const sessionKey = `session:${decoded.user_id}:${decoded.jti}`;
      const session = await redisClient.get(sessionKey);
      
      if (session) {
        req.user = decoded;
        req.user_id = decoded.user_id;
        req.tenant_id = decoded.tenant_id;
        req.role = decoded.role;
      }
    }
    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};
