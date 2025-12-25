# Google OAuth Setup Guide for Finvera

**Complete guide for configuring Google OAuth with correct callback URLs**

---

## 🌐 Your Domain Structure

Based on your main domain: **`finvera.solutions`**

```
finvera.solutions (Main Domain)
├── api.finvera.solutions       → Backend API (Node.js/Express)
├── admin.finvera.solutions     → Admin Portal (Next.js Frontend)
├── client.finvera.solutions    → Client Portal (Next.js Frontend)
└── www.finvera.solutions       → Marketing Site (Optional)
```

---

## 🔑 Understanding OAuth Flow

### How Google OAuth Works in Finvera:

```
┌─────────────┐
│   USER      │
│ (Browser)   │
└──────┬──────┘
       │ 1. Clicks "Sign up with Google"
       │
       ▼
┌─────────────────────────────────────────────┐
│  FRONTEND (client.finvera.solutions)        │
│  - register.jsx or login.jsx                │
│  - Redirects to: api.finvera.solutions     │
│    /api/auth/google                         │
└──────┬──────────────────────────────────────┘
       │ 2. Redirects to Google
       │
       ▼
┌─────────────────────────────────────────────┐
│  GOOGLE OAUTH                               │
│  - User grants permissions                  │
│  - Google redirects back with auth code     │
└──────┬──────────────────────────────────────┘
       │ 3. Callback to Backend
       │
       ▼
┌─────────────────────────────────────────────┐
│  BACKEND (api.finvera.solutions)            │
│  - Receives callback at:                    │
│    /api/auth/google/callback                │
│  - Creates/finds user                       │
│  - Generates JWT tokens                     │
│  - Redirects to frontend with tokens        │
└──────┬──────────────────────────────────────┘
       │ 4. Redirects to Frontend
       │
       ▼
┌─────────────────────────────────────────────┐
│  FRONTEND (/auth/callback)                  │
│  - Receives tokens                          │
│  - Stores in cookies                        │
│  - Redirects to dashboard or company setup │
└─────────────────────────────────────────────┘
```

**KEY POINT:** The callback URL MUST point to your **BACKEND API**, not frontend!

---

## 📝 Step-by-Step Google Cloud Console Setup

### Step 1: Access Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create or Select Project

**Option A: Create New Project**
1. Click "Select a project" dropdown (top left)
2. Click "NEW PROJECT"
3. Project name: **Finvera**
4. Click "CREATE"

**Option B: Use Existing Project**
1. Select your existing project from dropdown

### Step 3: Enable Google+ API

1. Click "☰" menu → **APIs & Services** → **Library**
2. Search for: **"Google+ API"**
3. Click on "Google+ API"
4. Click **"ENABLE"**
5. Wait for activation (may take a few seconds)

### Step 4: Configure OAuth Consent Screen

1. Go to: **APIs & Services** → **OAuth consent screen**
2. Choose user type:
   - **External** (for public users) ✅ RECOMMENDED
   - Internal (only for Google Workspace users)
3. Click **"CREATE"**

4. **Fill in App Information:**
   ```
   App name: Finvera
   User support email: your-email@finvera.solutions
   App logo: (Optional - upload your logo)
   
   Application home page: https://finvera.solutions
   Application privacy policy: https://finvera.solutions/privacy
   Application terms of service: https://finvera.solutions/terms
   
   Authorized domains:
   - finvera.solutions
   
   Developer contact email: your-email@finvera.solutions
   ```

5. Click **"SAVE AND CONTINUE"**

6. **Scopes:** Click **"ADD OR REMOVE SCOPES"**
   - Select: `email`
   - Select: `profile`
   - Select: `openid`
   - Click **"UPDATE"**
   - Click **"SAVE AND CONTINUE"**

7. **Test users** (if in testing mode):
   - Add your email addresses
   - Click **"SAVE AND CONTINUE"**

8. Click **"BACK TO DASHBOARD"**

### Step 5: Create OAuth 2.0 Credentials

1. Go to: **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **OAuth client ID**
3. Application type: **Web application**
4. Name: **Finvera Backend**

5. **Authorized JavaScript origins:**
   ```
   https://api.finvera.solutions
   https://client.finvera.solutions
   https://admin.finvera.solutions
   https://finvera.solutions
   ```

6. **Authorized redirect URIs:** ⚠️ **CRITICAL - Must be exact!**

   **For Production:**
   ```
   https://api.finvera.solutions/api/auth/google/callback
   ```

   **For Development/Testing (add these too):**
   ```
   http://localhost:3000/api/auth/google/callback
   http://localhost:3001/api/auth/google/callback
   ```

   **How to add multiple URIs:**
   - Click "+ ADD URI" for each URL
   - Enter one URL at a time
   - Make sure there are NO trailing slashes
   - Make sure URLs are EXACT

7. Click **"CREATE"**

### Step 6: Copy Credentials

A popup will appear with your credentials:

```
Client ID: 123456789-abc123def456.apps.googleusercontent.com
Client Secret: GOCSPX-abc123def456ghi789
```

**⚠️ IMPORTANT:** 
- Click **"DOWNLOAD JSON"** to save credentials
- Keep these credentials SECRET
- Never commit them to version control

---

## ⚙️ Backend Configuration

### Update Your `.env` File:

```bash
# =================================
# GOOGLE OAUTH CONFIGURATION
# =================================
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456ghi789
GOOGLE_CALLBACK_URL=https://api.finvera.solutions/api/auth/google/callback
```

### Restart Backend:

```bash
# If using PM2
pm2 restart finvera-backend

# Or if running directly
npm start
```

---

## 🎨 Frontend Configuration

### Admin Portal (.env)

**File:** `/workspace/frontend/.env` (for admin.finvera.solutions)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.finvera.solutions/api

# Domain Configuration
NEXT_PUBLIC_MAIN_DOMAIN=finvera.solutions

# Encryption Key (must match backend)
NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY=your-same-key-from-backend

# Uploads Base URL
NEXT_PUBLIC_UPLOADS_BASE_URL=https://api.finvera.solutions
```

### Client Portal (.env)

**File:** `/workspace/frontend/.env` (for client.finvera.solutions)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.finvera.solutions/api

# Domain Configuration
NEXT_PUBLIC_MAIN_DOMAIN=finvera.solutions

# Encryption Key (must match backend)
NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY=your-same-key-from-backend

# Uploads Base URL
NEXT_PUBLIC_UPLOADS_BASE_URL=https://api.finvera.solutions
```

**Note:** Both admin and client portals use the SAME backend API!

---

## 🧪 Testing Google OAuth

### Test URLs:

**Client Portal (for clients/tenants):**
- Login: https://client.finvera.solutions/client/login
- Register: https://client.finvera.solutions/client/register

**Admin Portal (for admins):**
- Login: https://admin.finvera.solutions/admin/login

### Testing Flow:

1. **Open Browser** (incognito mode recommended)
2. **Go to client register page:**
   ```
   https://client.finvera.solutions/client/register
   ```
3. **Click "Sign up with Google"**
4. **You should be redirected to:**
   ```
   https://accounts.google.com/o/oauth2/auth?...
   ```
5. **Grant permissions**
6. **You should be redirected back through:**
   ```
   https://api.finvera.solutions/api/auth/google/callback
   ```
7. **Then to:**
   ```
   https://client.finvera.solutions/auth/callback?token=...
   ```
8. **Finally to:**
   ```
   https://client.finvera.solutions/client/companies (for new users)
   OR
   https://client.finvera.solutions/client/dashboard (for existing users)
   ```

---

## 🔍 Troubleshooting

### Issue: "Error 400: redirect_uri_mismatch"

**Cause:** The redirect URI doesn't match what's configured in Google Console.

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Click on your OAuth 2.0 Client ID
3. Check **Authorized redirect URIs**
4. Make sure it EXACTLY matches:
   ```
   https://api.finvera.solutions/api/auth/google/callback
   ```
5. No trailing slash!
6. No typos!
7. Save and wait 5 minutes for changes to propagate

### Issue: "Access blocked: This app's request is invalid"

**Cause:** OAuth consent screen not properly configured.

**Solution:**
1. Go to **OAuth consent screen**
2. Make sure:
   - App name is set
   - Support email is set
   - Authorized domains includes: `finvera.solutions`
3. Save and try again

### Issue: "This app isn't verified"

**Cause:** App is in testing mode or not verified by Google.

**Solution (For Testing):**
1. Click "Advanced"
2. Click "Go to Finvera (unsafe)"
3. This is normal for apps in testing

**Solution (For Production):**
1. Go through Google's verification process
2. OR keep app in testing mode and add test users

### Issue: User logs in but gets redirected to wrong domain

**Cause:** Backend `FRONTEND_URL` is misconfigured.

**Solution:**
1. Check backend `.env`:
   ```bash
   FRONTEND_URL=https://client.finvera.solutions
   ```
2. This determines where users are redirected after OAuth
3. Restart backend after changes

### Issue: CORS errors when clicking Google sign-in

**Cause:** CORS not configured properly in backend.

**Solution:**
1. Backend automatically allows `client.finvera.solutions` and `admin.finvera.solutions`
2. If you have custom domains, add them:
   ```bash
   CORS_ORIGIN=https://your-custom-domain.com
   ```

---

## 📋 Checklist

### Google Cloud Console ✅
- [ ] Project created/selected
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] Authorized domains added: `finvera.solutions`
- [ ] OAuth 2.0 credentials created
- [ ] Authorized JavaScript origins added
- [ ] Authorized redirect URIs added (EXACT URLs)
- [ ] Client ID copied to backend `.env`
- [ ] Client Secret copied to backend `.env`

### Backend Configuration ✅
- [ ] `GOOGLE_CLIENT_ID` set in `.env`
- [ ] `GOOGLE_CLIENT_SECRET` set in `.env`
- [ ] `GOOGLE_CALLBACK_URL=https://api.finvera.solutions/api/auth/google/callback`
- [ ] `MAIN_DOMAIN=finvera.solutions`
- [ ] `FRONTEND_URL` set correctly
- [ ] Backend restarted after changes

### Frontend Configuration ✅
- [ ] Admin portal `.env` has `NEXT_PUBLIC_API_URL=https://api.finvera.solutions/api`
- [ ] Client portal `.env` has `NEXT_PUBLIC_API_URL=https://api.finvera.solutions/api`
- [ ] Both have `NEXT_PUBLIC_MAIN_DOMAIN=finvera.solutions`
- [ ] Frontends restarted/rebuilt after changes

### DNS Configuration ✅
- [ ] `api.finvera.solutions` points to backend server
- [ ] `admin.finvera.solutions` points to admin frontend server
- [ ] `client.finvera.solutions` points to client frontend server
- [ ] SSL certificates installed for all domains

### Testing ✅
- [ ] Can access https://client.finvera.solutions/client/register
- [ ] Google sign-up button appears
- [ ] Clicking button redirects to Google
- [ ] After auth, redirected back to app
- [ ] User is created in database
- [ ] User can access dashboard

---

## 🎯 Quick Reference

### Your URLs:

| Service | URL | Purpose |
|---------|-----|---------|
| **Backend API** | `https://api.finvera.solutions` | All API requests, OAuth callback |
| **Client Portal** | `https://client.finvera.solutions` | Client/tenant login & dashboard |
| **Admin Portal** | `https://admin.finvera.solutions` | Admin login & management |
| **Main Site** | `https://finvera.solutions` | Marketing/landing page |

### Google OAuth Callback:

```
✅ CORRECT: https://api.finvera.solutions/api/auth/google/callback
❌ WRONG:   https://client.finvera.solutions/api/auth/google/callback
❌ WRONG:   https://admin.finvera.solutions/api/auth/google/callback
❌ WRONG:   https://api.finvera.solutions/auth/google/callback (missing /api)
❌ WRONG:   https://api.finvera.solutions/api/auth/google/callback/ (trailing slash)
```

### Environment Variables Quick Copy:

**Backend `.env`:**
```bash
MAIN_DOMAIN=finvera.solutions
API_DOMAIN=api.finvera.solutions
FRONTEND_URL=https://client.finvera.solutions
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://api.finvera.solutions/api/auth/google/callback
```

**Frontend `.env` (both admin and client):**
```bash
NEXT_PUBLIC_API_URL=https://api.finvera.solutions/api
NEXT_PUBLIC_MAIN_DOMAIN=finvera.solutions
NEXT_PUBLIC_UPLOADS_BASE_URL=https://api.finvera.solutions
```

---

## 📞 Support

If you need help:
- **Email:** info@illusiodesigns.agency
- **Phone:** 7600046416
- **Documentation:** See `GOOGLE_SIGNUP_IMPLEMENTATION.md` for more details

---

**Last Updated:** December 25, 2025  
**Version:** 1.0.0
