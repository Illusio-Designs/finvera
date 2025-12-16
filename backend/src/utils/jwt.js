const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../config/redis');
const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Sign JWT tokens (access and refresh)
 * @param {Object} userData - User data to encode in token
 * @returns {Promise<Object>} Object with accessToken, refreshToken, and jti
 */
async function signTokens(userData) {
  const jti = uuidv4(); // JWT ID for session management

  const payload = {
    id: userData.id,
    user_id: userData.id, // Alias for compatibility
    sub: userData.id, // Standard JWT subject
    tenant_id: userData.tenant_id,
    role: userData.role,
    jti: jti,
  };

  // Generate access token
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  // Generate refresh token (longer expiry)
  const refreshToken = jwt.sign(
    { id: userData.id, tenant_id: userData.tenant_id, jti: jti },
    JWT_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    }
  );

  // Store session in Redis
  const sessionKey = `session:${userData.id}:${jti}`;
  const sessionData = {
    user_id: userData.id,
    tenant_id: userData.tenant_id,
    role: userData.role,
    created_at: new Date().toISOString(),
  };

  try {
    // Store session with expiry matching refresh token expiry (7 days)
    const expirySeconds = 7 * 24 * 60 * 60; // 7 days in seconds
    await redisClient.setEx(sessionKey, expirySeconds, JSON.stringify(sessionData));
  } catch (error) {
    // Continue even if Redis fails (graceful degradation)
    if (redisClient.isConnected()) {
      logger.error('Failed to store session in Redis:', error);
    }
  }

  return {
    accessToken,
    refreshToken,
    jti,
  };
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token');
    } else {
      logger.error('Token verification error:', error);
    }
    return null;
  }
}

/**
 * Get session from Redis
 * @param {string} userId - User ID
 * @param {string} jti - JWT ID
 * @returns {Promise<Object|null>} Session data or null
 */
async function getSession(userId, jti) {
  try {
    const sessionKey = `session:${userId}:${jti}`;
    const session = await redisClient.get(sessionKey);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    // If Redis is not connected, return null (session validation will be skipped)
    if (redisClient.isConnected()) {
      logger.error('Failed to get session from Redis:', error);
    }
    return null;
  }
}

/**
 * Revoke session (logout)
 * @param {string} userId - User ID
 * @param {string} jti - JWT ID
 * @returns {Promise<boolean>} Success status
 */
async function revokeSession(userId, jti) {
  try {
    const sessionKey = `session:${userId}:${jti}`;
    await redisClient.del(sessionKey);
    if (redisClient.isConnected()) {
      logger.info(`Session revoked for user ${userId}, jti ${jti}`);
    }
    return true;
  } catch (error) {
    if (redisClient.isConnected()) {
      logger.error('Failed to revoke session from Redis:', error);
    }
    return false;
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object|null>} New tokens or null if invalid
 */
async function refreshAccessToken(refreshToken) {
  try {
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return null;
    }

    // Verify session exists
    const session = await getSession(decoded.id, decoded.jti);
    if (!session) {
      return null;
    }

    // Generate new access token
    const newPayload = {
      id: decoded.id,
      user_id: decoded.id,
      sub: decoded.id,
      tenant_id: decoded.tenant_id,
      role: session.role,
      jti: decoded.jti,
    };

    const newAccessToken = jwt.sign(newPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: refreshToken, // Keep same refresh token
      jti: decoded.jti,
    };
  } catch (error) {
    logger.error('Failed to refresh token:', error);
    return null;
  }
}

module.exports = {
  signTokens,
  verifyToken,
  getSession,
  revokeSession,
  refreshAccessToken,
};
