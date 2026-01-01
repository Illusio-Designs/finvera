/**
 * CORS Configuration
 * Centralized CORS settings for the application
 */

/**
 * Get the main domain from environment variables
 * Default: finvera.solutions
 */
function getMainDomain() {
  // Hardcoded main domain
  const MAIN_DOMAIN = 'finvera.solutions';
  
  // Allow override via environment variable if needed
  return process.env.MAIN_DOMAIN || 
         process.env.NEXT_PUBLIC_MAIN_DOMAIN || 
         MAIN_DOMAIN;
}

/**
 * Check if origin is localhost
 */
function isLocalhost(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin) ||
         /^https?:\/\/.*\.localhost(:\d+)?$/.test(origin);
}

/**
 * Check if origin matches production domain pattern
 */
function isProductionDomain(origin, mainDomain) {
  const escapedDomain = mainDomain.replace(/\./g, '\\.');
  
  // Pattern 1: Exact match or with www/admin/client/api prefix
  const exactMatch = new RegExp(`^https?://(www\\.|admin\\.|client\\.|api\\.)?${escapedDomain}(:\\d+)?$`).test(origin);
  
  // Pattern 2: Any subdomain of the main domain (api, admin, client, etc.)
  const subdomainMatch = new RegExp(`^https?://[a-zA-Z0-9-]+\\.${escapedDomain}(:\\d+)?$`).test(origin);
  
  // Pattern 3: Match if the origin ends with the main domain (handles nested domains)
  const endsWithDomain = origin.endsWith(mainDomain) || origin.includes(`.${mainDomain}`);
  
  return exactMatch || subdomainMatch || endsWithDomain;
}

/**
 * Get list of allowed origins
 */
function getAllowedOrigins() {
  const mainDomain = getMainDomain();
  
  // Hardcoded production domains
  const productionOrigins = [
    // Main domain
    `https://${mainDomain}`,
    `http://${mainDomain}`,
    `https://www.${mainDomain}`,
    `http://www.${mainDomain}`,
    // API subdomain
    `https://api.${mainDomain}`,
    `http://api.${mainDomain}`,
    // Client subdomain
    `https://client.${mainDomain}`,
    `http://client.${mainDomain}`,
    // Admin subdomain
    `https://admin.${mainDomain}`,
    `http://admin.${mainDomain}`,
  ];
  
  // Support multiple allowed origins via comma-separated CORS_ORIGINS env var
  const additionalOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [];
  
  const allowedOrigins = [
    // Environment variable origins (can override)
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    ...additionalOrigins,
    // Hardcoded production origins
    ...productionOrigins,
  ].filter(Boolean); // Remove undefined values
  
  return allowedOrigins;
}

/**
 * CORS origin validation function
 */
function validateOrigin(origin, callback) {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    return callback(null, true);
  }
  
  const mainDomain = getMainDomain();
  const allowedOrigins = getAllowedOrigins();
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Allow all origins in development if CORS_ALLOW_ALL is set (for debugging)
  if (process.env.CORS_ALLOW_ALL === 'true') {
    if (isDevelopment || process.env.DEBUG_CORS === 'true') {
      console.warn(`[CORS] Allowing all origins (CORS_ALLOW_ALL=true): ${origin}`);
    }
    return callback(null, true);
  }
  
  // Check if origin is in allowed list
  const isInAllowedList = allowedOrigins.includes(origin);
  
  // Check if production domain
  const isProductionOrigin = isProductionDomain(origin, mainDomain);
  
  // Allow if in allowed list, matches production domain, or is development
  // Note: localhost origins removed - only production domains allowed
  if (isInAllowedList || isProductionOrigin || isDevelopment) {
    return callback(null, true);
  }
  
  // Log rejected origin for debugging
  if (isDevelopment || process.env.DEBUG_CORS === 'true') {
    console.warn(`[CORS] Rejected origin: ${origin}`);
    console.warn(`[CORS] Main domain: ${mainDomain}`);
    console.warn(`[CORS] Allowed origins count: ${allowedOrigins.length}`);
    console.warn(`[CORS] Checks - In list: ${isInAllowedList}, Production: ${isProductionOrigin}, Dev: ${isDevelopment}`);
    if (allowedOrigins.length > 0 && allowedOrigins.length <= 10) {
      console.warn(`[CORS] Allowed origins:`, allowedOrigins);
    }
  }
  
  callback(new Error('Not allowed by CORS'));
}

/**
 * CORS configuration object
 */
const corsConfig = {
  origin: validateOrigin,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-Company-Id',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-Encrypt-Response'
  ],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
};

module.exports = {
  corsConfig,
  validateOrigin,
  getAllowedOrigins,
  getMainDomain,
  isLocalhost,
  isProductionDomain,
};

