# Railway API URL Guide

## 🔍 How to Find Your Railway API URL

### Method 1: Railway Dashboard

1. Go to https://railway.app
2. Open your project
3. Click on your **backend service**
4. Go to **"Settings"** tab
5. Scroll down to **"Networking"** section
6. You'll see your **"Public Domain"** or **"Custom Domain"**

### Method 2: Railway Dashboard - Service Overview

1. In your Railway project dashboard
2. Click on your backend service
3. Look at the top of the service page
4. You'll see the URL displayed (e.g., `https://your-service.railway.app`)

### Method 3: Railway CLI

```bash
railway domain
```

This will show your Railway domain.

---

## 📋 Railway URL Formats

Railway provides URLs in these formats:

### Default Railway Domain
```
https://your-service-name.railway.app
```

### Generated Domain (if no custom name)
```
https://your-project-production.up.railway.app
```

### Custom Domain (if you set one)
```
https://api.finvera.solutions
https://finvera.illusiodesigns.agency
```

---

## 🔧 How to Set/Change Railway URL

### Option 1: Generate Public Domain (Automatic)

1. Railway automatically generates a public domain
2. Go to Service → Settings → Networking
3. Click **"Generate Domain"** if not already generated
4. Copy the generated URL

### Option 2: Set Custom Domain

1. Go to Service → Settings → Networking
2. Click **"Custom Domain"**
3. Enter your domain (e.g., `api.finvera.solutions`)
4. Add DNS records as instructed by Railway
5. Railway will provision SSL certificate automatically

---

## ✅ Update Environment Variables with Railway URL

Once you have your Railway URL, update these variables:

### In Railway Environment Variables:

```env
# Update API_DOMAIN to your Railway URL
API_DOMAIN=https://your-service.railway.app

# Update Google OAuth Callback URL
GOOGLE_CALLBACK_URL=https://your-service.railway.app/api/auth/google/callback

# Update Razorpay Webhook URL (if using)
RAZORPAY_WEBHOOK_URL=https://your-service.railway.app/api/razorpay/webhook

# Update uploads base URL (for frontend)
NEXT_PUBLIC_UPLOADS_BASE_URL=https://your-service.railway.app/uploads
```

### Example with Your Current Setup:

If your Railway URL is: `https://finvera-backend-production.up.railway.app`

Then update:
```env
API_DOMAIN=https://finvera-backend-production.up.railway.app
GOOGLE_CALLBACK_URL=https://finvera-backend-production.up.railway.app/api/auth/google/callback
```

---

## 🔗 Update Frontend to Use Railway Backend

In your **frontend** `.env` or Vercel environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-service.railway.app
```

---

## 📝 Quick Checklist

- [ ] Find Railway URL in dashboard
- [ ] Copy the Railway URL
- [ ] Update `API_DOMAIN` in Railway environment variables
- [ ] Update `GOOGLE_CALLBACK_URL` in Railway environment variables
- [ ] Update Google OAuth console with new callback URL
- [ ] Update Razorpay webhook URL (if using)
- [ ] Update frontend `NEXT_PUBLIC_API_URL` to Railway URL
- [ ] Test API endpoints

---

## 🎯 Example: Complete Setup

**Railway URL:** `https://finvera-backend-production.up.railway.app`

**Railway Environment Variables:**
```env
API_DOMAIN=https://finvera-backend-production.up.railway.app
GOOGLE_CALLBACK_URL=https://finvera-backend-production.up.railway.app/api/auth/google/callback
```

**Frontend Environment Variables (Vercel):**
```env
NEXT_PUBLIC_API_URL=https://finvera-backend-production.up.railway.app
```

**Google OAuth Console:**
- Add authorized redirect URI: `https://finvera-backend-production.up.railway.app/api/auth/google/callback`

**Razorpay Dashboard (if using):**
- Webhook URL: `https://finvera-backend-production.up.railway.app/api/razorpay/webhook`

---

## 💡 Pro Tip: Use Custom Domain

For production, it's better to use a custom domain:

1. Set up `api.finvera.solutions` or `finvera.illusiodesigns.agency` as custom domain
2. Add DNS records as Railway instructs
3. Railway automatically provisions SSL
4. Use the custom domain in all environment variables

This way, your URLs stay consistent and professional!

