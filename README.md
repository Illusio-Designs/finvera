# Finvera - Multi-Tenant Accounting SaaS

Complete full-stack accounting SaaS application designed for Indian businesses with GST compliance, TDS management, and sales/distribution management.

## Technology Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: MySQL 8.0+
- **File Upload**: Multer
- **Session/Cache**: Redis
- **Authentication**: JWT + Redis sessions
- **WebSocket**: Socket.IO (v4.7.2) - Real-time notifications
- **QR Code**: qrcode
- **HTTP Client**: axios

### Frontend
- **Framework**: Next.js
- **UI**: React components
- **State Management**: React Context API
- **WebSocket**: Socket.IO client for real-time updates

## Project Structure

```
finvera/
├── backend/              # Express.js backend API
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── models/       # Sequelize models (32+ models)
│   │   ├── migrations/   # Database migrations
│   │   ├── seeders/      # Database seeders
│   │   ├── middleware/    # Express middleware
│   │   ├── controllers/  # Route controllers
│   │   ├── services/     # Business logic services
│   │   ├── websocket/    # WebSocket server
│   │   ├── routes/       # API routes
│   │   ├── utils/        # Utility functions
│   │   └── validators/   # Request validators
│   ├── uploads/          # File uploads directory
│   └── server.js         # Application entry point
└── frontend/             # Next.js frontend
    ├── pages/            # Next.js pages
    ├── components/       # React components
    ├── lib/              # Utilities, API client
    ├── contexts/         # React contexts
    └── styles/           # Global styles
```

## Setup Instructions

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your database, Redis, and JWT credentials.

3. **Database Setup**
   ```bash
   # Run migrations
   npm run migrate

   # Seed initial data
   npm run seed
   ```

4. **Start Server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
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

## Features

### Core Features
- Multi-tenancy with complete data isolation
- JWT authentication with Redis sessions
- Role-based access control (RBAC)
- File upload with Multer
- Input sanitization and security
- Audit trail logging
- Rate limiting

### Admin Panel
- Platform dashboard (MRR, ARR, churn metrics)
- Distributor management
- Salesman management
- Referral system
- Commission calculation and payout
- Pricing/subscription management

### Accounting
- Chart of Accounts (hierarchical groups)
- Ledger management
- Voucher system (all types)
- Double-entry bookkeeping
- Bill-wise tracking
- Financial reports (Trial Balance, Balance Sheet, P&L)

### GST Compliance
- GSTIN management
- GST rate master
- Automatic GST calculation
- GSTR-1 generation
- GSTR-3B generation
- E-Invoice integration (IRN, QR code)

### TDS Management
- TDS calculation
- TDS return preparation
- TDS certificate (Form 16A)

### Notification System
- Real-time WebSocket notifications
- User notification preferences
- Email notifications with templates
- Sound alerts (unique per notification type)
- Desktop browser notifications
- Notification management UI

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register tenant
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Accounting
- `POST /api/accounting/invoices/sales` - Create sales invoice
- `POST /api/accounting/invoices/purchase` - Create purchase invoice
- `POST /api/accounting/payments` - Create payment voucher
- `POST /api/accounting/receipts` - Create receipt voucher
- `GET /api/reports/trial-balance` - Trial balance
- `GET /api/reports/balance-sheet` - Balance sheet

### GST
- `POST /api/gst/returns/gstr1` - Generate GSTR-1
- `POST /api/gst/returns/gstr3b` - Generate GSTR-3B
- `POST /api/einvoice/generate` - Generate e-invoice IRN

### TDS
- `POST /api/tds/calculate` - Calculate TDS
- `GET /api/tds/certificate/:id` - Generate Form 16A

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/preferences` - Get user preferences
- `PUT /api/notifications/preferences` - Update preferences

## Database Models

### Core (14 models)
Tenant, User, Distributor, Salesman, SubscriptionPlan, ReferralCode, ReferralReward, Commission, Payout, Lead, LeadActivity, Target, Notification, NotificationPreference

### Accounting (7 models)
AccountGroup, Ledger, VoucherType, Voucher, VoucherItem, VoucherLedgerEntry, BillWiseDetail, BillAllocation

### GST & Compliance (5 models)
GSTIN, GSTRate, GSTRReturn, EInvoice, TDSDetail

### System (1 model)
AuditLog

**Total: 32+ models**

## Security Features

- JWT token-based authentication
- Redis session management
- Password hashing with bcrypt
- Data encryption for sensitive fields (PAN, Aadhaar, bank details)
- Role-based access control
- Tenant data isolation
- Input validation and sanitization
- Rate limiting
- Helmet.js security headers
- Audit trail

## Performance Optimizations

- Database indexes on frequently queried fields
- Redis caching utilities
- Connection pooling
- Query optimization
- Lazy loading for large datasets

## Environment Variables

### Backend (.env)
- Database configuration
- Redis configuration
- JWT secrets
- File upload settings
- E-Invoice API credentials
- Email/SMTP settings (optional)

### Frontend (.env)
- API URL configuration

## Development

### Backend
```bash
cd backend
npm run dev          # Development mode with auto-reload
npm run migrate      # Run migrations
npm run migrate:undo # Undo last migration
npm run seed         # Run seeders
```

### Frontend
```bash
cd frontend
npm run dev    # Development server
npm run build  # Build for production
npm start      # Production server
npm run lint   # Run ESLint
```

## Testing

```bash
# Backend health check
curl http://localhost:3000/health
curl http://localhost:3000/api/health
```

## Production Deployment

1. Set `NODE_ENV=production` in both backend and frontend `.env` files
2. Update all secrets (JWT_SECRET, ENCRYPTION_SECRET)
3. Configure E-Invoice API credentials
4. Setup Redis cluster
5. Configure database replication
6. Setup SSL certificates
7. Configure backup strategy
8. Setup monitoring

## License

ISC

---

**Status**: ✅ Production Ready - All features implemented and tested!
