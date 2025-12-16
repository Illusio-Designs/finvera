# Subdomain Routing Setup

## Overview

The frontend uses subdomain-based routing to separate admin, client, and main website:

- `finvera.com` - Landing page
- `admin.finvera.com` - Admin portal
- `client.finvera.com` - Client portal

## Local Development

For local development, you need to configure subdomain routing:

### Option 1: Using /etc/hosts (Recommended)

Add these lines to your `/etc/hosts` file:

**On Windows:** `C:\Windows\System32\drivers\etc\hosts`
**On Mac/Linux:** `/etc/hosts`

```
127.0.0.1 finvera.local
127.0.0.1 admin.finvera.local
127.0.0.1 client.finvera.local
```

Then access:
- http://finvera.local:3000 - Landing page
- http://admin.finvera.local:3000 - Admin portal
- http://client.finvera.local:3000 - Client portal

### Option 2: Using localhost subdomains (Easier)

Most browsers support `localhost` subdomains out of the box:

- http://localhost:3000 - Landing page
- http://admin.localhost:3000 - Admin portal
- http://client.localhost:3000 - Client portal

## Production Setup

### DNS Configuration

Add A records for your subdomains:

```
@           A       YOUR_SERVER_IP
admin       A       YOUR_SERVER_IP
client      A       YOUR_SERVER_IP
www         CNAME   finvera.com
```

### Environment Variables

Update your `.env.local`:

```env
NEXT_PUBLIC_MAIN_DOMAIN=finvera.com
API_BASE_URL=https://api.finvera.com/api
```

### Nginx Configuration (if using Nginx)

```nginx
server {
    server_name finvera.com www.finvera.com admin.finvera.com client.finvera.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## How It Works

1. **Middleware Detection**: The `middleware.js` file intercepts all requests
2. **Subdomain Extraction**: Extracts subdomain from hostname
3. **Path Rewriting**: Rewrites URLs based on subdomain:
   - `admin.finvera.com/` → `/admin/dashboard`
   - `client.finvera.com/` → `/client/dashboard`
   - `finvera.com/` → `/` (landing page)
4. **Protection**: Prevents direct access to /admin or /client on main domain

## Testing

```bash
# Start the development server
npm run dev

# Test URLs
curl -H "Host: admin.localhost" http://localhost:3000
curl -H "Host: client.localhost" http://localhost:3000
curl http://localhost:3000
```
