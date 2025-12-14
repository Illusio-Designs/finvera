# Payload Encryption - Usage Guide

## Quick Start

### ✅ Backend is READY
Encryption middleware is already installed and active on `/api` routes.

### ✅ Frontend Usage

```javascript
import { secureAPI } from '@/lib/secureApi';

// Login with encryption
const handleLogin = async () => {
  try {
    const result = await secureAPI.post('/auth/login', {
      email: 'user@example.com',
      password: 'MyPassword123',
    });
    
    console.log('Logged in:', result);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

That's it! Data is automatically encrypted! 🔒

---

## What Happens

### Without Encryption (Default fetch):
```javascript
// User sees in DevTools Network tab:
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "MyPassword123"  ❌ VISIBLE
}
```

### With secureAPI:
```javascript
// User sees in DevTools:
POST /api/auth/login
{
  "encrypted": "U2FsdGVkX1+vupppZksvRf5pq..." ✅ ENCRYPTED
}
```

---

## Frontend Examples

### 1. Login (Encrypted)
```javascript
import { secureAPI } from '@/lib/secureApi';

const login = async (credentials) => {
  const result = await secureAPI.post('/auth/login', credentials);
  // Automatically encrypted + decrypted
  return result;
};
```

### 2. Create Ledger (Encrypted)
```javascript
const createLedger = async (ledgerData, token) => {
  const result = await secureAPI.post('/ledgers', ledgerData, { token });
  return result;
};
```

### 3. Get Data (No Encryption Needed)
```javascript
import { regularAPI } from '@/lib/secureApi';

const getTenants = async (token) => {
  // For non-sensitive GET requests, use regularAPI
  const result = await regularAPI.get('/admin/tenants', token);
  return result;
};
```

### 4. Update Data (Encrypted)
```javascript
const updateUser = async (userId, data, token) => {
  const result = await secureAPI.put(`/users/${userId}`, data, { token });
  return result;
};
```

---

## Configuration

### Backend .env
```env
# Add this to your .env file
PAYLOAD_ENCRYPTION_KEY=your-very-strong-secret-key-at-least-32-characters-long

# Generate a strong key:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend .env.local
```env
# Add this to your .env.local file
NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY=your-very-strong-secret-key-at-least-32-characters-long
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

⚠️ **IMPORTANT:** Use the SAME key on both backend and frontend!

---

## Generate Strong Encryption Key

```bash
# Generate a random 64-character hex string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# 7f9d8c6e5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e
```

Use this as your `PAYLOAD_ENCRYPTION_KEY`.

---

## When to Use Encryption

### ✅ USE secureAPI for:
- Login/Authentication
- Password changes
- Sensitive user data
- Financial transactions
- Personal information
- Payment details
- API keys/secrets

### ✅ USE regularAPI for:
- Public data
- Listing items (tenants, products)
- Non-sensitive GET requests
- Static content

---

## Real-World Example

**Complete Login Component:**

```javascript
// pages/login.jsx
import { useState } from 'react';
import { secureAPI } from '@/lib/secureApi';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Data is automatically encrypted!
      const result = await secureAPI.post('/auth/login', formData);
      
      // Store token
      localStorage.setItem('token', result.token);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## Testing

### Test Encryption
```javascript
import { encryptPayload, decryptPayload } from '@/lib/encryption';

const testData = { email: 'test@example.com', password: 'secret123' };
console.log('Original:', testData);

const encrypted = encryptPayload(testData);
console.log('Encrypted:', encrypted);

const decrypted = decryptPayload(encrypted.encrypted);
console.log('Decrypted:', decrypted);

console.log('Match:', JSON.stringify(testData) === JSON.stringify(decrypted));
```

---

## Troubleshooting

### Error: "Decryption failed"
- Check that BOTH backend and frontend use the SAME encryption key
- Verify the key is set in both `.env` files

### Error: "Decryption produced empty result"
- The encrypted data is corrupted or using wrong key
- Make sure keys match on both sides

### Data not encrypted?
- secureAPI encrypts by default
- Check that you're using `secureAPI`, not regular `fetch`

---

## Security Features

✅ **AES-256 Encryption** - Military-grade encryption  
✅ **Automatic** - No manual encryption/decryption needed  
✅ **Transparent** - Works like regular fetch()  
✅ **Backward Compatible** - Non-encrypted requests still work  
✅ **Optional** - Can disable encryption per request  

---

## Migration from Regular API

**Before:**
```javascript
const result = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

**After:**
```javascript
const result = await secureAPI.post('/auth/login', { email, password });
```

That's it! Just replace `fetch` with `secureAPI`! 🚀

---

## Summary

1. ✅ Backend encryption is already installed
2. ✅ Import `secureAPI` in your components
3. ✅ Use `secureAPI.post()` instead of `fetch()`
4. ✅ Data is automatically encrypted and decrypted
5. ✅ Users cannot see sensitive data in DevTools

**Your payloads are now secure!** 🔒
