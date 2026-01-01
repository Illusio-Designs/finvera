/**
 * Simple CORS Configuration
 * Hardcoded allowed origins for finvera.solutions
 */

// Hardcoded allowed origins
const ALLOWED_ORIGINS = [
  // Main domain
  'https://finvera.solutions',
  'http://finvera.solutions',
  'https://www.finvera.solutions',
  'http://www.finvera.solutions',
  // API subdomain
  'https://api.finvera.solutions',
  'http://api.finvera.solutions',
  // Client subdomain
  'https://client.finvera.solutions',
  'http://client.finvera.solutions',
  // Admin subdomain
  'https://admin.finvera.solutions',
  'http://admin.finvera.solutions',
];

/**
 * Simple origin validation
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
  
  // Check if origin matches finvera.solutions pattern (any subdomain)
  if (origin.includes('finvera.solutions')) {
    return callback(null, true);
  }
  
  // Allow in development mode
  if (process.env.NODE_ENV !== 'production') {
    return callback(null, true);
  }
  
  // Log rejected origin for debugging
  if (process.env.DEBUG_CORS === 'true') {
    console.warn(`[CORS] Rejected origin: ${origin}`);
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
