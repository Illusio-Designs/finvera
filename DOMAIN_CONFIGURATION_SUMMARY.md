# Domain Configuration Summary for Finvera

**Quick answers to your questions about domain setup**

---

## ❓ Your Questions:

### Q1: "We have admin.finvera.com - should it be added to frontend?"

**Answer:** YES! `admin.finvera.solutions` is a **FRONTEND** application (admin portal).

### Q2: "What will be the Google callback URL based on domain finvera.solutions?"

**Answer:** `https://api.finvera.solutions/api/auth/google/callback`

---

## 🌐 Complete Domain Setup

Based on your main domain: **`finvera.solutions`**

```
┌─────────────────────────────────────────────────────────────┐
│                    finvera.solutions                        │
│                    (Main Domain)                            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┏━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━┓
        ┃                                        ┃
        ▼                                        ▼
┌─────────────────┐                  ┌─────────────────────┐
│    BACKEND      │                  │     FRONTEND        │
│      API        │◄─────────────────│   Applications      │
│                 │   API Calls      │                     │
│ api.finvera    │                  │ ┌─────────────────┐ │
│ .solutions     │                  │ │ Admin Portal    │ │
│                 │                  │ │ admin.finvera   │ │
│ • Express.js    │                  │ │ .solutions      │ │
│ • Node.js       │                  │ └─────────────────┘ │
│ • MySQL         │                  │                     │
│ • Redis         │                  │ ┌─────────────────┐ │
│ • Google OAuth  │                  │ │ Client Portal   │ │
│ • Razorpay      │                  │ │ client.finvera  │ │
└─────────────────┘                  │ │ .solutions      │ │
                                     │ └─────────────────┘ │
                                     │                     │
                                     │ • Next.js           │
                                     │ • React             │
                                     └─────────────────────┘
```

---

## 📋 Your Domains Breakdown

| Domain | Type | Application | Purpose |
|--------|------|-------------|---------|
| **api.finvera.solutions** | Backend | Node.js/Express API | All API endpoints, OAuth callback |
| **admin.finvera.solutions** | Frontend | Next.js Admin Portal | Admin/super admin dashboard |
| **client.finvera.solutions** | Frontend | Next.js Client Portal | Client/tenant dashboard |
| **finvera.solutions** | Frontend | Marketing site | Landing page, pricing, etc. |
| **www.finvera.solutions** | Frontend | Marketing site | Same as above (www redirect) |

---

## 🔑 Google OAuth Configuration

### The Critical Detail:

**Google OAuth callback MUST point to BACKEND API**, not frontend!

### ✅ Correct Google OAuth Callback URL:

```
https://api.finvera.solutions/api/auth/google/callback
```

### Why Backend?

1. **User clicks "Sign up with Google"** on frontend (client.finvera.solutions or admin.finvera.solutions)
2. **Frontend redirects to backend:** `https://api.finvera.solutions/api/auth/google`
3. **Backend redirects to Google** for authentication
4. **Google redirects back to backend callback:** `https://api.finvera.solutions/api/auth/google/callback`
5. **Backend processes OAuth:**
   - Creates/finds user
   - Creates tenant (for new users)
   - Generates JWT tokens
6. **Backend redirects to frontend** with tokens: `https://client.finvera.solutions/auth/callback?token=...`
7. **Frontend stores tokens** and redirects to dashboard

---

## ⚙️ Configuration Files

### 1. Backend Configuration

**File:** `/workspace/backend/.env`

```bash
# =================================
# DOMAIN CONFIGURATION
# =================================
MAIN_DOMAIN=finvera.solutions
API_DOMAIN=api.finvera.solutions
FRONTEND_URL=https://client.finvera.solutions

# =================================
# GOOGLE OAUTH
# =================================
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://api.finvera.solutions/api/auth/google/callback

# Backend automatically allows CORS for:
# - https://client.finvera.solutions
# - https://admin.finvera.solutions  
# - https://finvera.solutions
# - https://www.finvera.solutions
```

### 2. Admin Frontend Configuration

**File:** `/workspace/frontend/.env` (deployed to admin.finvera.solutions)

```bash
# API Configuration - Points to backend
NEXT_PUBLIC_API_URL=https://api.finvera.solutions/api

# Domain Configuration
NEXT_PUBLIC_MAIN_DOMAIN=finvera.solutions

# Uploads Base URL
NEXT_PUBLIC_UPLOADS_BASE_URL=https://api.finvera.solutions

# Encryption Key (must match backend)
NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY=your-same-key-from-backend-env
```

### 3. Client Frontend Configuration

**File:** `/workspace/frontend/.env` (deployed to client.finvera.solutions)

```bash
# API Configuration - Points to backend
NEXT_PUBLIC_API_URL=https://api.finvera.solutions/api

# Domain Configuration
NEXT_PUBLIC_MAIN_DOMAIN=finvera.solutions

# Uploads Base URL
NEXT_PUBLIC_UPLOADS_BASE_URL=https://api.finvera.solutions

# Encryption Key (must match backend)
NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY=your-same-key-from-backend-env
```

**Note:** Both admin and client frontends use the SAME backend API!

---

## 🔧 Google Cloud Console Setup

### In Google Cloud Console, add these Authorized Redirect URIs:

```
✅ Production:
https://api.finvera.solutions/api/auth/google/callback

✅ Development/Testing:
http://localhost:3000/api/auth/google/callback
http://localhost:3001/api/auth/google/callback
```

### Add these Authorized JavaScript Origins:

```
https://api.finvera.solutions
https://admin.finvera.solutions
https://client.finvera.solutions
https://finvera.solutions
```

---

## 🚀 Deployment Structure

### Option 1: Separate Servers (Recommended for Production)

```
Server 1 (Backend):
- Domain: api.finvera.solutions
- Application: Node.js backend
- Port: 3000 (internal, proxied by Nginx)

Server 2 (Admin Frontend):
- Domain: admin.finvera.solutions
- Application: Next.js admin portal
- Port: 3001 (internal, proxied by Nginx)

Server 3 (Client Frontend):
- Domain: client.finvera.solutions
- Application: Next.js client portal
- Port: 3001 (internal, proxied by Nginx)
```

### Option 2: Single Server (For Smaller Deployments)

```
Single Server:
- api.finvera.solutions → Port 3000 (backend)
- admin.finvera.solutions → Port 3001 (admin frontend)
- client.finvera.solutions → Port 3002 (client frontend)
```

---

## 🌍 DNS Configuration

Add these DNS records to your domain registrar:

```
Type    Name     Value                       TTL
────────────────────────────────────────────────────
A       api      YOUR_BACKEND_SERVER_IP      300
A       admin    YOUR_FRONTEND_SERVER_IP     300
A       client   YOUR_FRONTEND_SERVER_IP     300
A       @        YOUR_MARKETING_SITE_IP      300
A       www      YOUR_MARKETING_SITE_IP      300
```

---

## ✅ Quick Verification Checklist

### Backend:
- [ ] Running at: `https://api.finvera.solutions`
- [ ] Health check works: `https://api.finvera.solutions/health`
- [ ] API works: `https://api.finvera.solutions/api/health`
- [ ] OAuth endpoint accessible: `https://api.finvera.solutions/api/auth/google`

### Admin Frontend:
- [ ] Accessible at: `https://admin.finvera.solutions`
- [ ] Can load login page: `https://admin.finvera.solutions/admin/login`
- [ ] API calls work (check browser console)
- [ ] Google sign-in button works

### Client Frontend:
- [ ] Accessible at: `https://client.finvera.solutions`
- [ ] Can load login page: `https://client.finvera.solutions/client/login`
- [ ] Can load register page: `https://client.finvera.solutions/client/register`
- [ ] Google sign-up button works
- [ ] API calls work (check browser console)

### Google OAuth:
- [ ] Client ID and Secret configured in backend `.env`
- [ ] Callback URL matches: `https://api.finvera.solutions/api/auth/google/callback`
- [ ] Authorized redirect URIs added in Google Console (exact match!)
- [ ] Can click "Sign up with Google" and get redirected to Google
- [ ] After auth, redirected back to app successfully

---

## 🎯 URLs for Testing

### Client Portal (Main User Flow):
```
Register:  https://client.finvera.solutions/client/register
Login:     https://client.finvera.solutions/client/login
Dashboard: https://client.finvera.solutions/client/dashboard
```

### Admin Portal:
```
Login:     https://admin.finvera.solutions/admin/login
Dashboard: https://admin.finvera.solutions/admin/dashboard
```

### Backend API:
```
Health:    https://api.finvera.solutions/health
API:       https://api.finvera.solutions/api/health
Google:    https://api.finvera.solutions/api/auth/google
```

---

## 📖 Related Documentation

For more detailed information, see:
- **`GOOGLE_OAUTH_SETUP.md`** - Complete Google OAuth configuration guide
- **`BACKEND_STATUS_REPORT.md`** - Complete backend feature list
- **`PRODUCTION_SETUP_GUIDE.md`** - Step-by-step production deployment
- **`backend/.env.example`** - All environment variables explained

---

## 💡 Key Takeaways

1. ✅ **admin.finvera.solutions** is a FRONTEND application (Next.js admin portal)
2. ✅ **client.finvera.solutions** is a FRONTEND application (Next.js client portal)
3. ✅ **api.finvera.solutions** is your BACKEND (Node.js/Express API)
4. ✅ **Google OAuth callback URL:** `https://api.finvera.solutions/api/auth/google/callback`
5. ✅ Both frontends point to the SAME backend API
6. ✅ Backend handles ALL OAuth callbacks, then redirects to appropriate frontend
7. ✅ Backend automatically allows CORS for admin and client subdomains

---

**Questions?** Contact: info@illusiodesigns.agency | 7600046416

**Last Updated:** December 25, 2025
