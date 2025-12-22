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
- **Desktop App**: Electron (macOS and Windows)

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
    ├── lib/              # Utilities, API client, encryption
    ├── contexts/         # React contexts
    ├── electron/         # Electron main process and preload scripts
    ├── styles/           # Global styles
    └── dist/             # Electron build output (gitignored)
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
   Update `.env` with your:
   - Database credentials (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, etc.)
   - Redis configuration
   - JWT secrets (JWT_SECRET, JWT_REFRESH_SECRET)
   - **ENCRYPTION_KEY** - For database password encryption (32+ characters)
   - **PAYLOAD_ENCRYPTION_KEY** - For API payload encryption (must match frontend)
   - Other optional settings (email, Razorpay, etc.)

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
   Update `.env` with:
   - `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., http://localhost:3000/api)
   - `NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY` - For API payload encryption (must match backend)

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
- **Database password encryption** (AES-256-CBC) - All tenant/company database passwords encrypted at rest
- **API payload encryption** (Optional CryptoJS AES) - End-to-end encryption for sensitive API requests/responses
- Data encryption for sensitive fields (PAN, Aadhaar, bank details)
- Role-based access control
- Tenant data isolation
- Input validation and sanitization
- Rate limiting
- Helmet.js security headers
- Audit trail

### Encryption

The application uses two separate encryption systems:

1. **Database Password Encryption** (Automatic)
   - Encrypts database passwords before storing in database
   - Uses AES-256-CBC encryption
   - Key: `ENCRYPTION_KEY` environment variable
   - Always active - all DB passwords are encrypted

2. **API Payload Encryption** (Optional)
   - Encrypts API request/response payloads for additional security
   - Uses CryptoJS AES encryption
   - Keys: `PAYLOAD_ENCRYPTION_KEY` (backend) and `NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY` (frontend)
   - Activated when client sends encrypted data or requests encrypted response

For detailed encryption information, see the Encryption section above.

### Testing Encryption

```bash
# Backend - Test encryption functionality
cd backend
node src/utils/testEncryption.js
```

## Performance Optimizations

- Database indexes on frequently queried fields
- Redis caching utilities
- Connection pooling
- Query optimization
- Lazy loading for large datasets

## Environment Variables

### Backend (.env)

**Required:**
- Database configuration (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, MASTER_DB_NAME)
- Redis configuration (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD)
- JWT secrets (JWT_SECRET, JWT_REFRESH_SECRET)
- **ENCRYPTION_KEY** - For database password encryption (32+ characters, keep secret)
- **PAYLOAD_ENCRYPTION_KEY** - For API payload encryption (must match frontend)

**Optional:**
- File upload settings (UPLOAD_DIR, MAX_FILE_SIZE)
- E-Invoice API credentials (E_INVOICE_API_URL, E_INVOICE_API_KEY)
- Email/SMTP settings (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
- Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_SECRET_KEY, RAZORPAY_WEBHOOK_SECRET)
- Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)

### Frontend (.env)

**Required:**
- **NEXT_PUBLIC_API_URL** - Backend API URL
- **NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY** - For API payload encryption (must match backend)

**Optional:**
- NEXT_PUBLIC_WS_URL - WebSocket URL (defaults to API URL)
- NEXT_PUBLIC_APP_NAME - Application name

### Encryption Keys Setup

```bash
# Backend .env
ENCRYPTION_KEY=your-32-character-secret-key-change-in-production-must-be-32-chars
PAYLOAD_ENCRYPTION_KEY=your-very-strong-secret-key-at-least-32-characters-long

# Frontend .env
NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY=your-very-strong-secret-key-at-least-32-characters-long
```

**Important:**
- `ENCRYPTION_KEY` - Used for database password encryption (backend only)
- `PAYLOAD_ENCRYPTION_KEY` and `NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY` must match
- Never commit `.env` files to version control
- Use strong, random keys in production
- Rotate keys carefully (requires re-encrypting data)

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

## Desktop Application (Electron)

Finvera is available as a desktop application for macOS and Windows using Electron.

### Development

```bash
cd frontend
npm run electron:dev
```

This starts the Next.js dev server and launches Electron.

### Building

```bash
# Build for current platform
npm run electron:build

# Build for macOS only
npm run electron:build:mac

# Build for Windows only
npm run electron:build:win

# Build for all platforms
npm run electron:build:all
```

Build outputs are in the `frontend/dist/` directory:
- **macOS**: DMG installer and ZIP archive (universal binary - Intel + Apple Silicon)
- **Windows**: NSIS installer (.exe) and portable executable

For detailed setup instructions, see the Desktop Application (Electron) section above.

### Electron Features

- Native desktop application
- Auto-updater support (configured)
- Code signing ready (macOS and Windows)
- Universal macOS binaries (x64 + arm64)
- Windows installer and portable versions
- Secure preload scripts
- DevTools in development mode

## Testing

```bash
# Backend health check
curl http://localhost:3000/health
curl http://localhost:3000/api/health

# Test encryption (backend)
cd backend
node src/utils/testEncryption.js
```

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Update all secrets:
   - `JWT_SECRET` and `JWT_REFRESH_SECRET`
   - `ENCRYPTION_KEY` (for database password encryption)
   - `PAYLOAD_ENCRYPTION_KEY` (must match frontend)
3. Configure database credentials
4. Configure Redis cluster
5. Setup SSL certificates
6. Configure E-Invoice API credentials
7. Configure backup strategy
8. Setup monitoring and logging

### Frontend
1. Set `NODE_ENV=production` in `.env`
2. Set `NEXT_PUBLIC_API_URL` to production backend URL
3. Set `NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY` (must match backend)
4. Build and deploy:
   ```bash
   npm run build
   npm start
   ```

### Desktop Application (Electron)
1. Set `NEXT_PUBLIC_API_URL` in `.env` to production backend URL
2. Set `NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY` (must match backend)
3. Build for distribution:
   ```bash
   npm run electron:build:all
   ```
4. Code sign applications (required for distribution)
5. Test installers on clean systems
6. Distribute DMG (macOS) or EXE (Windows) files

## License

ISC

### Buy License

For commercial use or extended licensing options, please contact us to purchase a license.

**Contact Information:**
- Email: info@illusiodesigns.agency
- Website: https://illusiodesigns.agency
- Phone: 7600046416

### Legal Notice

**⚠️ WARNING: Unauthorized Use Prohibited**

This software is protected by copyright and licensing laws. Any use of this software without a valid license is strictly prohibited and constitutes a violation of intellectual property rights.

**Legal Consequences:**
- Unauthorized use, distribution, or modification of this software without a proper license will result in legal action
- Violators will be prosecuted to the full extent of the law
- This includes but is not limited to: civil lawsuits, monetary damages, and criminal prosecution where applicable

**To avoid legal action, please:**
1. Purchase an appropriate license before using this software
2. Contact us at info@illusiodesigns.agency for licensing inquiries
3. Ensure all team members and users are properly licensed

By using this software, you acknowledge that you have read, understood, and agree to comply with all licensing terms and conditions.

---


**Status**: ✅ Production Ready - All features implemented and tested!

