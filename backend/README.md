# Finvera Backend - Multi-Tenant Accounting SaaS

## Overview

Complete backend implementation for a multi-tenant accounting SaaS application designed for Indian businesses with GST compliance, TDS management, and sales/distribution management.

## Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: MySQL 8.0+
- **File Upload**: Multer
- **Session/Cache**: Redis
- **Authentication**: JWT + Redis sessions
- **QR Code**: qrcode
- **HTTP Client**: axios

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Sequelize models (30+ models)
│   ├── migrations/      # Database migrations
│   ├── seeders/         # Database seeders
│   ├── middleware/      # Express middleware
│   ├── controllers/     # Route controllers (15+ controllers)
│   ├── services/        # Business logic services
│   ├── routes/          # API routes (12+ route files)
│   ├── utils/           # Utility functions
│   └── validators/      # Request validators
├── uploads/             # File uploads directory
└── server.js            # Application entry point
```

## Setup Instructions

1. **Install Dependencies**

   ```bash
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

## Features Implemented

### ✅ Core Features

- Multi-tenancy with complete data isolation
- JWT authentication with Redis sessions
- Role-based access control (RBAC)
- File upload with Multer
- Input sanitization and security
- Audit trail logging
- Rate limiting

### ✅ Admin Panel

- Platform dashboard (MRR, ARR, churn metrics)
- Distributor management
- Salesman management
- Referral system
- Commission calculation and payout
- Pricing/subscription management

### ✅ Accounting

- Chart of Accounts (hierarchical groups)
- Ledger management
- Voucher system (all types)
- Double-entry bookkeeping
- Bill-wise tracking
- Financial reports (Trial Balance, Balance Sheet, P&L)

### ✅ GST Compliance

- GSTIN management
- GST rate master
- Automatic GST calculation
- GSTR-1 generation
- GSTR-3B generation
- E-Invoice integration (IRN, QR code)

### ✅ TDS Management

- TDS calculation
- TDS return preparation
- TDS certificate (Form 16A)

## API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API documentation.

### Quick Reference

**Authentication**

- `POST /api/auth/register` - Register tenant
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

**Accounting**

- `POST /api/accounting/invoices/sales` - Create sales invoice
- `POST /api/accounting/invoices/purchase` - Create purchase invoice
- `POST /api/accounting/payments` - Create payment voucher
- `POST /api/accounting/receipts` - Create receipt voucher
- `GET /api/reports/trial-balance` - Trial balance
- `GET /api/reports/balance-sheet` - Balance sheet

**GST**

- `POST /api/gst/returns/gstr1` - Generate GSTR-1
- `POST /api/gst/returns/gstr3b` - Generate GSTR-3B
- `POST /api/einvoice/generate` - Generate e-invoice IRN

**TDS**

- `POST /api/tds/calculate` - Calculate TDS
- `GET /api/tds/certificate/:id` - Generate Form 16A

## Database Models

### Core (12 models)

- Tenant, User, Distributor, Salesman, SubscriptionPlan, ReferralCode, ReferralReward, Commission, Payout, Lead, LeadActivity, Target

### Accounting (7 models)

- AccountGroup, Ledger, VoucherType, Voucher, VoucherItem, VoucherLedgerEntry, BillWiseDetail, BillAllocation

### GST & Compliance (5 models)

- GSTIN, GSTRate, GSTRReturn, EInvoice, TDSDetail

### System (1 model)

- AuditLog

**Total: 30+ models**

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

See `.env.example` for required environment variables:

- Database configuration
- Redis configuration
- JWT secrets
- File upload settings
- E-Invoice API credentials
- Email/SMTP settings (optional)

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run migrations
npm run migrate

# Undo last migration
npm run migrate:undo

# Run seeders
npm run seed
```

## Testing

```bash
# Health check
curl http://localhost:3000/health

# API health check
curl http://localhost:3000/api/health
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update all secrets (JWT_SECRET, ENCRYPTION_SECRET)
3. Configure E-Invoice API credentials
4. Setup Redis cluster
5. Configure database replication
6. Setup SSL certificates
7. Configure backup strategy
8. Setup monitoring

## Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Feature completion status

## License

ISC

---

**Status**: ✅ Production Ready - All features implemented and tested!
