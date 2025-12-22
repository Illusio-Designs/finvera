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

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Get main domain from environment or default to finvera.solutions
    const mainDomain = process.env.MAIN_DOMAIN || process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'finvera.solutions';
    
    // List of allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN,
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
    
    // Check if origin matches production domain pattern (with or without subdomain)
    const isProductionDomain = new RegExp(`^https?://(www\\.)?(admin|client)?\\.?${mainDomain.replace(/\./g, '\\.')}$`).test(origin);
    
    // Allow if in allowed list, is localhost/subdomain, matches production domain, or is development
    if (allowedOrigins.includes(origin) || isLocalhost || isProductionDomain || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Company-Id'],
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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 in dev, 100 in prod
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
});
app.use('/api/', limiter);

// Initialize Passport for OAuth
const passport = require('./config/passport');
const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Payload encryption/decryption (optional - activates when client sends encrypted data)
app.use('/api', decryptRequest, encryptResponse);

// Static file serving for uploads
// Resolve upload directory to absolute path
const absoluteUploadDir = path.isAbsolute(uploadDir) 
  ? uploadDir 
  : path.join(__dirname, '..', uploadDir);

// Serve static files with CORS headers
app.use('/uploads', (req, res, next) => {
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
}, express.static(absoluteUploadDir, {
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
}));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
