/**
 * CORS Configuration
 * Supports environment variables and dynamic domain matching
 */

// Get main domain from environment or default to fintranzact.com
const mainDomain = process.env.MAIN_DOMAIN || process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'fintranzact.com';

// Build allowed origins list from environment variables and defaults
const ALLOWED_ORIGINS = [
  // Environment variable origins
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  // Localhost origins for development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://admin.localhost:3000',
  'http://admin.localhost:3001',
  'http://client.localhost:3000',
  'http://client.localhost:3001',
  // Production origins - main domain
  `https://${mainDomain}`,
  `http://${mainDomain}`,
  `https://www.${mainDomain}`,
  `http://www.${mainDomain}`,
  // Production origins - API subdomain
  `https://api.${mainDomain}`,
  `http://api.${mainDomain}`,
  // Production origins - client subdomain
  `https://client.${mainDomain}`,
  `http://client.${mainDomain}`,
  // Production origins - admin subdomain
  `https://admin.${mainDomain}`,
  `http://admin.${mainDomain}`,
].filter(Boolean); // Remove undefined values

/**
 * Origin validation function
 * Supports environment variables and flexible domain matching
 */
function validateOrigin(origin, callback) {
  // Allow requests with no origin (mobile apps, curl, etc.)
  if (!origin) {
    return callback(null, true);
  }
  
  // Check if origin is in allowed list
  if (ALLOWED_ORIGINS.includes(origin)) {
    return callback(null, true);
  }
  
  // Allow all localhost subdomains in development
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin) ||
                      /^https?:\/\/.*\.localhost(:\d+)?$/.test(origin);
  
  if (isLocalhost) {
    return callback(null, true);
  }
  
  // Check if origin matches production domain pattern (with or without subdomain)
  const isProductionDomain = new RegExp(`^https?://(www\\.)?(admin|client|api)?\\.?${mainDomain.replace(/\./g, '\\.')}$`).test(origin) ||
                             origin.includes(mainDomain);
  
  if (isProductionDomain) {
    return callback(null, true);
  }
  
  // Allow in development mode (non-production)
  if (process.env.NODE_ENV !== 'production') {
    return callback(null, true);
  }
  
  // Log rejected origin for debugging
  if (process.env.DEBUG_CORS === 'true' || process.env.NODE_ENV !== 'production') {
    console.warn(`[CORS] Rejected origin: ${origin}`);
    console.warn(`[CORS] Main domain: ${mainDomain}`);
    console.warn(`[CORS] Allowed origins:`, ALLOWED_ORIGINS);
  }
  
  callback(new Error('Not allowed by CORS'));
}

/**
 * CORS configuration
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
  ALLOWED_ORIGINS,
};
