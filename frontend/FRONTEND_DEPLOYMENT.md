# Frontend Deployment Guide - Finvera

## 🔍 Current Issue

Getting **404 error** on: `https://client.finvera.solutions/auth/callback`

**Reason:** Frontend is NOT deployed to `client.finvera.solutions`

The Google OAuth is working (backend generates tokens), but there's no frontend app running on the domain to receive the callback.

---

## ✅ Solution: Deploy Frontend

The frontend is a **Next.js** application that needs to be deployed separately from the backend.

---

## 📋 Pre-Deployment Checklist

### 1. Create Production .env

```bash
cd /workspace/frontend
cp .env.production .env
```

Update `.env` with:
```env
NEXT_PUBLIC_API_URL=https://api.finvera.solutions/api
NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY=Devils@2609
NEXT_PUBLIC_MAIN_DOMAIN=finvera.solutions
NEXT_PUBLIC_UPLOADS_BASE_URL=https://api.finvera.solutions
```

### 2. Verify Google OAuth Configuration

In Google Cloud Console, make sure you have:
- **Authorized JavaScript origins:**
  - `https://client.finvera.solutions`
  - `https://admin.finvera.solutions`
  
- **Authorized redirect URIs:**
  - `https://api.finvera.solutions/api/auth/google/callback`

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Next.js) ⭐

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Deploy**
```bash
cd /workspace/frontend
vercel --prod
```

**Step 3: Configure Domain**
- In Vercel dashboard, add custom domain: `client.finvera.solutions`
- Point DNS A record to Vercel's IP

**Step 4: Set Environment Variables in Vercel**
- Go to Project Settings → Environment Variables
- Add:
  - `NEXT_PUBLIC_API_URL` = `https://api.finvera.solutions/api`
  - `NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY` = `Devils@2609`
  - `NEXT_PUBLIC_MAIN_DOMAIN` = `finvera.solutions`
  - `NEXT_PUBLIC_UPLOADS_BASE_URL` = `https://api.finvera.solutions`

---

### Option 2: Build and Deploy on Your Server

**Step 1: Build the Frontend**
```bash
cd /workspace/frontend
npm install
npm run build
```

This creates a `.next` folder with optimized production build.

**Step 2: Upload to Server**

Upload these folders/files to `client.finvera.solutions`:
```
.next/          (build output)
public/         (static assets)
node_modules/   (or run npm install --production on server)
package.json
next.config.js
.env.production (rename to .env)
```

**Step 3: Run on Server**
```bash
# On the server
cd /path/to/frontend
npm install --production
npm start
# Or with PM2
pm2 start npm --name "finvera-client" -- start
pm2 save
```

**Step 4: Configure Nginx/Apache**

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name client.finvera.solutions;

    location / {
        proxy_pass http://localhost:3001;  # Next.js default port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### Option 3: Static Export (if no SSR needed)

**Step 1: Update next.config.js**
```javascript
module.exports = {
  output: 'export',
  // ... other config
}
```

**Step 2: Build Static Files**
```bash
cd /workspace/frontend
npm run build
```

This creates an `out/` folder with static HTML/CSS/JS.

**Step 3: Deploy to Static Hosting**

Upload `out/` folder to:
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting

**Note:** Static export doesn't support API routes or SSR.

---

## 🎯 Domain Configuration

### DNS Records

Point `client.finvera.solutions` to your hosting:

**If using Vercel:**
```
Type: CNAME
Name: client
Value: cname.vercel-dns.com
```

**If using your own server:**
```
Type: A
Name: client
Value: Your server IP
```

**Similarly for admin portal:**
```
Type: CNAME or A
Name: admin
Value: Your hosting/server
```

---

## ✅ Verification Steps

After deployment:

1. **Check Frontend is Live:**
   ```bash
   curl https://client.finvera.solutions
   ```
   Should return HTML (not 404)

2. **Test Register Page:**
   Go to: `https://client.finvera.solutions/client/register`
   Should load the registration form

3. **Test Google OAuth:**
   Click "Sign up with Google"
   Should redirect to Google, then back to `/auth/callback`

4. **Test Callback Page:**
   After Google auth, should:
   - Store tokens
   - Redirect to `/client/companies` (if needsCompany=true)
   - Or redirect to dashboard

---

## 🔧 Environment Variables Summary

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=https://api.finvera.solutions/api
NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY=Devils@2609
NEXT_PUBLIC_MAIN_DOMAIN=finvera.solutions
NEXT_PUBLIC_UPLOADS_BASE_URL=https://api.finvera.solutions
```

### Backend (already configured)
```env
FRONTEND_URL=https://client.finvera.solutions
ADMIN_FRONTEND_URL=https://admin.finvera.solutions
GOOGLE_CALLBACK_URL=https://api.finvera.solutions/api/auth/google/callback
```

---

## 🐛 Troubleshooting

### Still Getting 404?

1. **Check if frontend is running:**
   ```bash
   curl https://client.finvera.solutions
   ```

2. **Check DNS propagation:**
   ```bash
   nslookup client.finvera.solutions
   ```

3. **Check Next.js pages exist:**
   - `/pages/auth/callback.jsx` ✓
   - `/pages/client/companies.jsx` ✓
   - `/pages/client/register.jsx` ✓

4. **Check build output:**
   ```bash
   ls -la .next/server/pages/auth/
   # Should show callback.html or callback.js
   ```

### CORS Errors?

Update backend CORS configuration:
```javascript
// backend/src/app.js
cors({
  origin: [
    'https://client.finvera.solutions',
    'https://admin.finvera.solutions',
    'https://finvera.solutions'
  ],
  credentials: true
})
```

### Google OAuth Errors?

1. Check Google Cloud Console → Credentials
2. Verify Authorized JavaScript origins include:
   - `https://client.finvera.solutions`
3. Verify Authorized redirect URIs include:
   - `https://api.finvera.solutions/api/auth/google/callback`

---

## 📝 Quick Commands Reference

```bash
# Build frontend
cd /workspace/frontend
npm install
npm run build

# Run in production
npm start

# Or with PM2
pm2 start npm --name "finvera-client" -- start
pm2 save

# Check if it's running
curl http://localhost:3001

# Deploy with Vercel
vercel --prod
```

---

## ✅ Success Checklist

- [ ] Frontend built successfully
- [ ] .env.production configured
- [ ] Deployed to hosting (Vercel/server)
- [ ] Domain `client.finvera.solutions` points to hosting
- [ ] Frontend loads in browser (no 404)
- [ ] Register page works
- [ ] Google OAuth redirects to callback
- [ ] Callback processes tokens correctly
- [ ] Redirects to companies page work

---

## 🎉 Next Steps

1. Deploy frontend to `client.finvera.solutions`
2. Deploy admin frontend to `admin.finvera.solutions` (same process)
3. Test complete OAuth flow
4. Test company creation
5. Production ready! 🚀

---

**Note:** The backend is working (generating OAuth tokens). The only issue is the frontend needs to be deployed to receive and process those tokens.
