const { decryptPayload, encryptPayload } = require('../utils/encryption');
const logger = require('../utils/logger');

/**
 * Middleware to decrypt incoming requests
 */
function decryptRequest(req, res, next) {
  try {
    // Check if request is encrypted
    if (req.body && req.body.encrypted) {
      // Decrypt the payload
      const decryptedData = decryptPayload(req.body.encrypted);
      req.body = decryptedData;
      req.isEncrypted = true;
      
      logger.info('Request decrypted successfully', {
        method: req.method,
        url: req.url,
      });
    }
    next();
  } catch (error) {
    logger.error('Decryption failed:', {
      error: error.message,
      method: req.method,
      url: req.url,
    });
    
    return res.status(400).json({
      success: false,
      error: 'Invalid encrypted payload',
    });
  }
}

/**
 * Middleware to encrypt outgoing responses
 */
function encryptResponse(req, res, next) {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method
  res.json = function (data) {
    // Only encrypt if request was encrypted OR if explicitly requested
    if (req.isEncrypted || req.headers['x-encrypt-response'] === 'true') {
      try {
        const encrypted = encryptPayload(data);
        logger.info('Response encrypted successfully', {
          method: req.method,
          url: req.url,
        });
        return originalJson(encrypted);
      } catch (error) {
        logger.error('Response encryption failed:', {
          error: error.message,
          method: req.method,
          url: req.url,
        });
        // Fall back to unencrypted response
        return originalJson(data);
      }
    }
    return originalJson(data);
  };

  next();
}

module.exports = {
  decryptRequest,
  encryptResponse,
};
