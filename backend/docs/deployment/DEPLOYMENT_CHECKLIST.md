# ✅ Railway Deployment Checklist

Print this and check off as you go!

---

## 📋 Pre-Deployment (5 minutes)

- [ ] Code is working locally
- [ ] All changes committed to Git
- [ ] Code pushed to GitHub (main branch)
- [ ] Frontend domain/URL known
- [ ] Railway account created (https://railway.app)
- [ ] GitHub connected to Railway

---

## 🚀 Railway Setup (10 minutes)

### Project Creation
- [ ] New Railway project created
- [ ] GitHub repository connected
- [ ] Root directory set to `backend` (if monorepo)
- [ ] Initial deployment triggered

### Database Setup
- [ ] MySQL database added to project
- [ ] MySQL service is running (green status)
- [ ] MySQL variables auto-generated:
  - [ ] MYSQLHOST
  - [ ] MYSQLPORT
  - [ ] MYSQLUSER
  - [ ] MYSQLPASSWORD
  - [ ] MYSQL_URL

### Redis Setup (Optional but Recommended)
- [ ] Redis database added to project
- [ ] Redis service is running (green status)
- [ ] Redis variables auto-generated:
  - [ ] REDIS_HOST
  - [ ] REDIS_PORT
  - [ ] REDIS_PASSWORD

---

## ⚙️ Environment Variables (10 minutes)

### Generate Secrets First!

Run these commands in your terminal:

```bash
# JWT Secret (copy output)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Encryption Key (copy output)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Session Secret (copy output)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] JWT_SECRET generated and copied
- [ ] ENCRYPTION_KEY generated and copied
- [ ] SESSION_SECRET generated and copied

### Set Variables in Railway

Go to: Backend Service → Variables → RAW Editor

- [ ] NODE_ENV=production
- [ ] PORT=3000
- [ ] HOST=0.0.0.0

**Database:**
- [ ] DB_HOST=${{MYSQLHOST}}
- [ ] DB_PORT=${{MYSQLPORT}}
- [ ] DB_USER=${{MYSQLUSER}}
- [ ] DB_PASSWORD=${{MYSQLPASSWORD}}
- [ ] DB_NAME=finvera_main
- [ ] MASTER_DB_NAME=finvera_master
- [ ] DATABASE_URL=${{MYSQL_URL}}

**Security:**
- [ ] JWT_SECRET=<paste generated secret>
- [ ] ENCRYPTION_KEY=<paste generated secret>
- [ ] SESSION_SECRET=<paste generated secret>

**Redis:**
- [ ] REDIS_ENABLED=true
- [ ] REDIS_HOST=${{REDIS.REDIS_HOST}}
- [ ] REDIS_PORT=${{REDIS.REDIS_PORT}}
- [ ] REDIS_PASSWORD=${{REDIS.REDIS_PASSWORD}}

**Application:**
- [ ] MAX_TENANT_CONNECTIONS=30
- [ ] USE_SEPARATE_DB_USERS=false

**CORS (IMPORTANT - Replace with your actual domains!):**
- [ ] CORS_ORIGIN=https://your-frontend.com,https://www.your-frontend.com
- [ ] MAIN_DOMAIN=your-domain.com
- [ ] FRONTEND_URL=https://your-frontend.com
- [ ] NEXT_PUBLIC_MAIN_DOMAIN=your-domain.com

**Optional (Add if using):**
- [ ] RAZORPAY_KEY_ID=your_key
- [ ] RAZORPAY_KEY_SECRET=your_secret
- [ ] SANDBOX_API_KEY=your_key
- [ ] IRP_CLIENT_ID=your_id
- [ ] EWAY_USERNAME=your_username

- [ ] All variables saved in Railway

---

## 🌐 Domain Setup (2 minutes)

- [ ] Railway domain generated (Settings → Domains → Generate Domain)
- [ ] Backend URL copied (e.g., https://finvera-backend-production.up.railway.app)
- [ ] Backend URL saved for frontend configuration

---

## 🔄 Database Setup (5 minutes)

### Option 1: Temporary Start Command (Easier)
- [ ] Go to: Settings → Deploy → Custom Start Command
- [ ] Set to: `npm run migrate && npm start`
- [ ] Wait for deployment to complete
- [ ] Change back to: `npm start`
- [ ] Redeploy

### Option 2: Railway CLI (Advanced)
```bash
npm install -g @railway/cli
railway login
railway link
railway run npm run migrate
railway run npm run seed
```

- [ ] Railway CLI installed
- [ ] Logged in to Railway
- [ ] Project linked
- [ ] Migrations run successfully
- [ ] Seeders run successfully (optional)

---

## 🧪 Testing (5 minutes)

### Health Check
```bash
curl https://your-backend-url.railway.app/health
```
- [ ] Health endpoint returns `{"status":"ok"}`

### API Test
```bash
curl https://your-backend-url.railway.app/api
```
- [ ] API endpoint responds

### Login Test (if you have test user)
```bash
curl -X POST https://your-backend-url.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rishi@finvera.com","password":"Rishi@1995"}'
```
- [ ] Login returns JWT token

### Database Test
- [ ] Can create tenant
- [ ] Can create company
- [ ] Can create voucher
- [ ] Data persists after restart

---

## 📱 Frontend Integration (5 minutes)

### Update Frontend Environment Variables

**For Vercel/Netlify:**
- [ ] Go to frontend project settings
- [ ] Update environment variables:
  ```bash
  NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
  # or
  REACT_APP_API_URL=https://your-backend-url.railway.app/api
  ```
- [ ] Redeploy frontend

### Test Frontend Connection
- [ ] Frontend can reach backend
- [ ] Login works from frontend
- [ ] API calls successful
- [ ] No CORS errors in browser console

---

## 📊 Monitoring Setup (5 minutes)

### Railway Dashboard
- [ ] Deployments tab bookmarked
- [ ] Metrics tab checked
- [ ] Logs accessible

### Storage Monitoring
```bash
npm run railway:check-storage
```
- [ ] Storage check script works
- [ ] Current usage noted: _____ MB / 1024 MB
- [ ] Weekly reminder set to check storage

### Set Up Alerts
- [ ] Email notifications enabled in Railway
- [ ] Deployment notifications enabled
- [ ] Error notifications enabled

---

## 🔒 Security Checklist (5 minutes)

- [ ] JWT_SECRET is strong (64+ characters)
- [ ] ENCRYPTION_KEY is strong (32+ characters)
- [ ] No secrets in Git repository
- [ ] .env files in .gitignore
- [ ] CORS_ORIGIN set to actual frontend domain (not *)
- [ ] Rate limiting enabled (default: 1000 req/15min)
- [ ] HTTPS enabled (automatic with Railway)

---

## 📝 Documentation (5 minutes)

- [ ] Backend URL documented
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Team members notified
- [ ] Frontend team has new API URL

---

## 🎉 Post-Deployment (Ongoing)

### First 24 Hours
- [ ] Monitor logs for errors
- [ ] Check CPU/Memory usage
- [ ] Test all major features
- [ ] Verify database connections stable
- [ ] Check storage usage

### First Week
- [ ] Daily log checks
- [ ] Monitor storage growth
- [ ] Test under load
- [ ] Gather user feedback
- [ ] Fix any issues

### Ongoing
- [ ] Weekly storage checks
- [ ] Monthly cost review
- [ ] Update dependencies
- [ ] Review logs for errors
- [ ] Plan for scaling

---

## 🔄 Continuous Deployment

- [ ] GitHub Actions workflow working
- [ ] Auto-deploy on push to main
- [ ] Deployment notifications received
- [ ] Rollback process understood

---

## 📞 Support Resources

- [ ] Railway docs bookmarked: https://docs.railway.app
- [ ] Railway Discord joined: https://discord.gg/railway
- [ ] Deployment guides saved locally
- [ ] Team knows how to access Railway

---

## 💰 Cost Monitoring

- [ ] Current Railway usage checked
- [ ] Free tier limits understood:
  - Storage: 1GB
  - Credit: $5/month
  - Bandwidth: 100GB/month
- [ ] Upgrade plan identified if needed
- [ ] Migration to Oracle Cloud planned (when needed)

---

## 🎯 Success Criteria

All of these should be ✅:

- [ ] Backend is live and accessible
- [ ] Health check returns 200 OK
- [ ] Database is connected and working
- [ ] Redis is connected (if enabled)
- [ ] Frontend can communicate with backend
- [ ] Login/authentication works
- [ ] CRUD operations work
- [ ] No errors in logs
- [ ] CORS configured correctly
- [ ] HTTPS enabled
- [ ] Monitoring set up
- [ ] Team has access
- [ ] Documentation complete

---

## 🚨 Troubleshooting

If something doesn't work:

1. **Check Railway logs:**
   - Deployments → Latest → View Logs

2. **Verify environment variables:**
   - Variables tab → Check all are set

3. **Test database connection:**
   - MySQL service → Connect → Test connection

4. **Check CORS:**
   - Browser console → Look for CORS errors
   - Update CORS_ORIGIN if needed

5. **Restart services:**
   - Settings → Restart

6. **Check documentation:**
   - RAILWAY_DEPLOY.md
   - DEPLOYMENT_README.md

---

## ✅ Final Verification

Before marking as complete:

- [ ] All checklist items above are checked
- [ ] Backend is stable for 24 hours
- [ ] No critical errors in logs
- [ ] Frontend team confirms everything works
- [ ] Users can access the application
- [ ] Data is persisting correctly
- [ ] Monitoring is active

---

## 🎊 Congratulations!

Your backend is successfully deployed to Railway! 🚀

**Next steps:**
1. Monitor for first week
2. Gather user feedback
3. Plan for scaling
4. Keep documentation updated

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Backend URL:** _______________

**Notes:** 
_______________________________________________
_______________________________________________
_______________________________________________
