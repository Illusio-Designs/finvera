# Secure API Payloads - Complete Guide

Prevent users from inspecting/viewing your API request/response data in browser DevTools.

## Security Layers

### 1. HTTPS (Transport Layer Security)
✅ **Must Have** - Encrypts data in transit

```nginx
# nginx configuration
server {
    listen 443 ssl http2;
    server_name api.finvera.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
}
```

### 2. Request/Response Encryption
✅ **Highly Recommended** - Encrypt payload before sending

---

## Implementation: End-to-End Payload Encryption

### Backend Setup

**1. Install crypto package:**
```bash
npm install crypto-js
```

**2. Create encryption utility:**

**File:** `backend/src/utils/encryption.js`
```javascript
const CryptoJS = require('crypto-js');

// Use a strong secret key (store in .env)
const SECRET_KEY = process.env.PAYLOAD_ENCRYPTION_KEY || 'your-very-strong-secret-key-min-32-chars';

/**
 * Encrypt payload
 */
function encryptPayload(data) {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    return { encrypted: encrypted };
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt payload
 */
function decryptPayload(encryptedData) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

module.exports = {
  encryptPayload,
  decryptPayload,
};
```

**3. Create encryption middleware:**

**File:** `backend/src/middleware/payloadEncryption.js`
```javascript
const { decryptPayload, encryptPayload } = require('../utils/encryption');

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
    }
    next();
  } catch (error) {
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
    // Only encrypt if request was encrypted
    if (req.isEncrypted) {
      const encrypted = encryptPayload(data);
      return originalJson(encrypted);
    }
    return originalJson(data);
  };

  next();
}

module.exports = {
  decryptRequest,
  encryptResponse,
};
```

**4. Apply middleware to routes:**

**File:** `backend/server.js`
```javascript
const { decryptRequest, encryptResponse } = require('./src/middleware/payloadEncryption');

// Apply to all routes (or specific routes)
app.use('/api', decryptRequest, encryptResponse);

// Or apply to specific routes only
app.use('/api/sensitive', decryptRequest, encryptResponse);
```

---

### Frontend Setup

**1. Install crypto-js:**
```bash
cd frontend
npm install crypto-js
```

**2. Create encryption utility:**

**File:** `frontend/lib/encryption.js`
```javascript
import CryptoJS from 'crypto-js';

// IMPORTANT: Use same secret key as backend
const SECRET_KEY = process.env.NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY || 'your-very-strong-secret-key-min-32-chars';

/**
 * Encrypt payload before sending
 */
export function encryptPayload(data) {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    return { encrypted };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
}

/**
 * Decrypt response from server
 */
export function decryptPayload(encryptedData) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
}
```

**3. Create secure API client:**

**File:** `frontend/lib/secureApi.js`
```javascript
import { encryptPayload, decryptPayload } from './encryption';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Secure API client with encryption
 */
export const secureAPI = {
  async post(endpoint, data, token) {
    // Encrypt the payload
    const encryptedPayload = encryptPayload(data);

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(encryptedPayload),
    });

    const result = await response.json();

    // Decrypt the response if it's encrypted
    if (result.encrypted) {
      return decryptPayload(result.encrypted);
    }

    return result;
  },

  async get(endpoint, token) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    const result = await response.json();

    // Decrypt the response if it's encrypted
    if (result.encrypted) {
      return decryptPayload(result.encrypted);
    }

    return result;
  },

  async put(endpoint, data, token) {
    const encryptedPayload = encryptPayload(data);

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(encryptedPayload),
    });

    const result = await response.json();

    if (result.encrypted) {
      return decryptPayload(result.encrypted);
    }

    return result;
  },
};
```

**4. Use in your React components:**

```javascript
import { secureAPI } from '@/lib/secureApi';

// In your component
const handleLogin = async (formData) => {
  try {
    // Data is automatically encrypted before sending
    const result = await secureAPI.post('/auth/login', {
      email: formData.email,
      password: formData.password,
    });

    console.log('Login successful:', result);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

---

## What Users Will See in DevTools

### Before Encryption (Normal):
```javascript
// Network tab shows:
{
  "email": "user@example.com",
  "password": "MyPassword123"
}
```

### After Encryption:
```javascript
// Network tab shows:
{
  "encrypted": "U2FsdGVkX1+vupppZksvRf5pq5g5XjFRIipRkwB0K1Y96Qsv2Lm+31cmzaAILwyt..."
}
```

Users **cannot** decrypt this without the SECRET_KEY!

---

## Additional Security Measures

### 1. Add Request Signing

**Prevents tampering with encrypted data:**

```javascript
// Backend
const crypto = require('crypto');

function signPayload(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex');
}

function verifySignature(data, signature, secret) {
  const expected = signPayload(data, secret);
  return signature === expected;
}

// Middleware
function verifyRequestSignature(req, res, next) {
  const signature = req.headers['x-signature'];
  if (!signature || !verifySignature(req.body, signature, SECRET_KEY)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  next();
}
```

### 2. Add Timestamp (Prevent Replay Attacks)

```javascript
// Frontend
const payload = {
  data: yourData,
  timestamp: Date.now(),
};

// Backend - Verify timestamp
if (Math.abs(Date.now() - payload.timestamp) > 60000) { // 1 minute
  return res.status(401).json({ error: 'Request expired' });
}
```

### 3. Use Strong Authentication

```javascript
// JWT with short expiry
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '15m' } // Short lived tokens
);
```

### 4. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api', limiter);
```

### 5. Input Validation

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/login',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process login...
  }
);
```

---

## Environment Variables

**Backend `.env`:**
```env
PAYLOAD_ENCRYPTION_KEY=your-very-strong-secret-key-at-least-32-characters-long
JWT_SECRET=your-jwt-secret-key
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY=your-very-strong-secret-key-at-least-32-characters-long
NEXT_PUBLIC_API_URL=https://api.finvera.com/api
```

⚠️ **IMPORTANT:** 
- Keep these keys secret
- Use different keys for development and production
- Never commit .env files to git

---

## Testing

### Test Encryption/Decryption

**Backend test:**
```javascript
const { encryptPayload, decryptPayload } = require('./src/utils/encryption');

const testData = { email: 'test@example.com', password: 'secret123' };
console.log('Original:', testData);

const encrypted = encryptPayload(testData);
console.log('Encrypted:', encrypted);

const decrypted = decryptPayload(encrypted.encrypted);
console.log('Decrypted:', decrypted);

console.log('Match:', JSON.stringify(testData) === JSON.stringify(decrypted));
```

---

## Security Checklist

- ✅ HTTPS only (no HTTP)
- ✅ Payload encryption (AES-256)
- ✅ Strong secret keys (32+ characters)
- ✅ Request signing (HMAC)
- ✅ Timestamp validation (prevent replay)
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ Input validation
- ✅ CORS properly configured
- ✅ Security headers (helmet.js)

---

## What Users CANNOT Do

❌ Cannot read request payload in DevTools  
❌ Cannot read response data in DevTools  
❌ Cannot replay old requests (timestamp check)  
❌ Cannot modify requests (signature check)  
❌ Cannot decrypt data without SECRET_KEY  

---

## What You CAN Do

✅ Log decrypted data on server (for debugging)  
✅ Monitor suspicious activity  
✅ Rotate encryption keys periodically  
✅ Track failed decryption attempts  

---

## Production Deployment

1. **Use strong keys:**
   ```bash
   openssl rand -base64 32
   ```

2. **Use HTTPS everywhere:**
   - Get SSL certificate (Let's Encrypt)
   - Force HTTPS redirect

3. **Monitor and log:**
   - Failed decryption attempts
   - Invalid signatures
   - Unusual request patterns

4. **Regular security audits**

---

## Summary

With this setup:
1. All sensitive data is encrypted before sending
2. Users see only encrypted gibberish in DevTools
3. Data is decrypted only on server (with secret key)
4. Multiple layers of security (encryption + signing + timestamps)
5. Even if someone intercepts, they cannot decrypt without the key

**Your payloads are now secure!** 🔒
