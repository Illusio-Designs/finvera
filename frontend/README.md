# Finvera Frontend - Multi-Tenant Accounting SaaS

Next.js frontend application for Finvera accounting platform.

## Features

- **Public Website**: Marketing pages, pricing, features
- **Admin Panel**: Platform administration, distributor/salesman management
- **Client Portal**: Tenant accounting dashboard, invoicing, reports

## Web Application Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your API URL.

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
frontend/
├── pages/
│   ├── index.js            # Public homepage
│   ├── admin/              # Admin routes
│   │   ├── login.js
│   │   └── dashboard.js
│   └── client/             # Client routes
│       ├── login.js
│       └── dashboard.js
├── components/             # Reusable components
├── lib/                    # Utilities, API client
├── contexts/               # React contexts
└── styles/                 # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

