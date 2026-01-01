const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const sanitizeInput = require('./middleware/sanitize');
const { uploadDir } = require('./config/multer');
const { decryptRequest, encryptResponse } = require('./middleware/payloadEncryption');

const app = express();

// Trust proxy - configure based on deployment environment
// In production behind a reverse proxy/load balancer, trust only specified number of hops
// This prevents IP spoofing while still getting the real client IP
// Set TRUST_PROXY_HOPS environment variable to the number of proxies (default: 1)
// Common values: 1 (single reverse proxy), 2 (Cloudflare + load balancer)
if (process.env.NODE_ENV === 'production') {
  const trustProxyHops = parseInt(process.env.TRUST_PROXY_HOPS) || 1;
  // Trust only specified number of proxies
  // This means we trust the X-Forwarded-For header from the first N proxies only
  app.set('trust proxy', trustProxyHops);
  console.log(`[SECURITY] Trust proxy configured: ${trustProxyHops} hop(s) - prevents IP spoofing`);
} else {
  // In development, trust all proxies (for local testing)
  app.set('trust proxy', true);
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Get main domain from environment or default to finvera.solutions
    const mainDomain = process.env.MAIN_DOMAIN || process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'finvera.solutions';
    
    // Support multiple allowed origins via comma-separated CORS_ORIGINS env var
    const additionalOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
      : [];
    
    // List of allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN,
      ...additionalOrigins, // Add any additional origins from CORS_ORIGINS
      // Localhost origins
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
      // Production origins - admin subdomain
      `https://admin.${mainDomain}`,
      `http://admin.${mainDomain}`,
      // Production origins - client subdomain
      `https://client.${mainDomain}`,
      `http://client.${mainDomain}`,
    ].filter(Boolean); // Remove undefined values
    
    // Allow all localhost subdomains in development
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin) ||
                        /^https?:\/\/.*\.localhost(:\d+)?$/.test(origin);
    
    // More flexible production domain pattern matching
    // Matches: https://domain.com, https://www.domain.com, https://admin.domain.com, https://client.domain.com
    // Also matches any subdomain pattern and handles domains with multiple parts (e.g., finvera.illusiodesigns.agency)
    const escapedDomain = mainDomain.replace(/\./g, '\\.');
    
    // Pattern 1: Exact match or with www/admin/client prefix
    const exactMatch = new RegExp(`^https?://(www\\.|admin\\.|client\\.)?${escapedDomain}(:\\d+)?$`).test(origin);
    
    // Pattern 2: Any subdomain of the main domain
    const subdomainMatch = new RegExp(`^https?://[a-zA-Z0-9-]+\\.${escapedDomain}(:\\d+)?$`).test(origin);
    
    // Pattern 3: Match if the origin ends with the main domain (handles nested domains)
    const endsWithDomain = origin.endsWith(mainDomain) || origin.includes(`.${mainDomain}`);
    
    const isProductionDomain = exactMatch || subdomainMatch || endsWithDomain;
    
    // Check if origin is in allowed list
    const isInAllowedList = allowedOrigins.includes(origin);
    
    // In development, be more permissive
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Allow all origins in development if CORS_ALLOW_ALL is set (for debugging)
    if (process.env.CORS_ALLOW_ALL === 'true') {
      console.warn(`[CORS] Allowing all origins (CORS_ALLOW_ALL=true): ${origin}`);
      return callback(null, true);
    }
    
    // Allow if in allowed list, is localhost/subdomain, matches production domain, or is development
    if (isInAllowedList || isLocalhost || isProductionDomain || isDevelopment) {
      return callback(null, true);
    }
    
    // Log rejected origin for debugging (always log in development, or if DEBUG_CORS is set)
    if (isDevelopment || process.env.DEBUG_CORS === 'true') {
      console.warn(`[CORS] Rejected origin: ${origin}`);
      console.warn(`[CORS] Main domain: ${mainDomain}`);
      console.warn(`[CORS] Allowed origins count: ${allowedOrigins.length}`);
      console.warn(`[CORS] Checks - In list: ${isInAllowedList}, Localhost: ${isLocalhost}, Production: ${isProductionDomain}, Dev: ${isDevelopment}`);
      if (allowedOrigins.length > 0 && allowedOrigins.length <= 10) {
        console.warn(`[CORS] Allowed origins:`, allowedOrigins);
      }
    }
    
    callback(new Error('Not allowed by CORS'));
  },
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
app.use(cors(corsOptions));

// Security middleware - configure helmet to allow images
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:*", "https:", "*"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginResourcePolicy: false, // Disable CORP to allow cross-origin images
}));

// Rate limiting - more lenient in development
// Custom keyGenerator to properly handle IP addresses behind proxy
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 in dev, 100 in prod
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Custom key generator that validates IP properly
  keyGenerator: (req) => {
    // Get the real IP address
    // req.ip is already handled by trust proxy setting
    // In production with trust proxy = 1, this will be the client IP from X-Forwarded-For
    // In development, it will be the direct connection IP
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Additional validation: ensure IP is valid format
    // This helps prevent spoofing attempts
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|127\.0\.0\.1)$/;
    
    if (ipRegex.test(ip)) {
      return ip;
    }
    
    // Fallback: use a default key if IP is invalid
    // This prevents bypass attempts with malformed IPs
    return 'invalid-ip';
  },
  skip: (req) => {
    // Skip rate limiting for health check and OPTIONS (preflight) requests
    return req.path === '/health' || req.method === 'OPTIONS';
  },
});
app.use('/api/', limiter);

// Initialize Passport for OAuth
const passport = require('./config/passport');
const session = require('express-session');

// Configure session store
// Note: MemoryStore warning is acceptable since sessions are only used for OAuth (Google login)
// The main authentication uses JWT tokens stored in Redis, not sessions
// To use Redis for sessions, install: npm install connect-redis
// Then uncomment the RedisStore configuration below
let sessionStore = undefined;

// Optional: Use Redis for sessions (requires: npm install connect-redis)
if (process.env.USE_REDIS_SESSIONS === 'true') {
  try {
    const RedisStore = require('connect-redis').default;
    const { createClient } = require('redis');
    const redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });
    
    redisClient.connect().catch((err) => {
      console.warn('[SESSION] Redis connection failed, using MemoryStore:', err.message);
    });
    
    sessionStore = new RedisStore({
      client: redisClient,
      prefix: 'sess:',
    });
    console.log('[SESSION] Using Redis store for sessions');
  } catch (error) {
    console.warn('[SESSION] connect-redis not installed. Install with: npm install connect-redis');
    console.warn('[SESSION] Falling back to MemoryStore (acceptable for OAuth-only sessions)');
  }
}

app.use(session({
  store: sessionStore, // undefined = MemoryStore (acceptable since sessions only used for OAuth)
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Explicit OPTIONS handler middleware for /api routes to handle preflight requests
// This must be BEFORE routes to catch preflight requests
app.use('/api', (req, res, next) => {
  // Handle OPTIONS (preflight) requests
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    if (origin) {
      // Check if origin is allowed using the same logic as CORS
      corsOptions.origin(origin, (err, allowed) => {
        if (err || !allowed) {
          // Log the rejection for debugging
          if (process.env.DEBUG_CORS === 'true' || process.env.NODE_ENV !== 'production') {
            console.warn(`[CORS] OPTIONS request rejected for origin: ${origin}`);
            console.warn(`[CORS] Error:`, err?.message || 'Origin not allowed');
          }
          return res.status(403).json({ 
            error: 'Not allowed by CORS',
            origin: origin 
          });
        }
        
        // Origin is allowed - send CORS headers
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        return res.sendStatus(200);
      });
    } else {
      // No origin header, allow it (for same-origin requests or mobile apps)
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
      return res.sendStatus(200);
    }
  } else {
    // Not an OPTIONS request, continue to next middleware
    next();
  }
});

// Payload encryption/decryption (optional - activates when client sends encrypted data)
app.use('/api', decryptRequest, encryptResponse);

// Static file serving for uploads
// Resolve upload directory to absolute path
const absoluteUploadDir = path.isAbsolute(uploadDir) 
  ? uploadDir 
  : path.join(__dirname, '..', uploadDir);

// CORS middleware for static file serving
const staticFileCors = (req, res, next) => {
  // Set CORS headers for static files
  const origin = req.headers.origin || '*';
  // Check if origin is allowed
  if (typeof corsOptions.origin === 'function') {
    corsOptions.origin(origin, (err, allowed) => {
      if (allowed) {
        res.header('Access-Control-Allow-Origin', origin);
      }
    });
  } else {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
};

// Static file serving configuration
const staticFileConfig = {
  setHeaders: (res, filePath) => {
    // Set proper content type for images
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    }
    // Allow caching for images
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    // Explicitly set Cross-Origin-Resource-Policy to allow cross-origin access
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
};

// Serve static files at /uploads (legacy route)
app.use('/uploads', staticFileCors, express.static(absoluteUploadDir, staticFileConfig));

// Serve static files at /upload (for env variable compatibility)
app.use('/upload', staticFileCors, express.static(absoluteUploadDir, staticFileConfig));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
