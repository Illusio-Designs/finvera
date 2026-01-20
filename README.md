<div align="center">

# 💼 Finvera

### Multi-Tenant Accounting SaaS Platform

**Complete full-stack accounting solution designed for Indian businesses with GST compliance, TDS management, and sales/distribution management.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-blue.svg)](https://nextjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-Latest-red.svg)](https://redis.io/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)]()

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [License](#-license)

---

</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [✨ Features](#-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [⚙️ Configuration](#️-configuration)
- [🔐 Security](#-security)
- [📡 API Documentation](#-api-documentation)
- [💻 Development](#-development)
- [🖥️ Desktop Application](#️-desktop-application)
- [🚢 Deployment](#-deployment)
- [📄 License](#-license)

---

## 🎯 Overview

**Finvera** is a comprehensive, multi-tenant accounting SaaS platform built specifically for Indian businesses. It provides complete financial management with built-in GST compliance, TDS management, and advanced sales/distribution tracking.

### Key Highlights

- 🏢 **Multi-Tenant Architecture** - Complete data isolation per tenant
- 📊 **Full Accounting Suite** - Double-entry bookkeeping, vouchers, reports
- 🇮🇳 **GST Compliance** - E-Invoice, GSTR-1, GSTR-3B generation
- 💰 **TDS Management** - Automatic calculation and Form 16A generation
- 📈 **Sales & Distribution** - Distributor/salesman management with commissions
- 🔔 **Real-Time Notifications** - WebSocket-powered instant updates
- 🖥️ **Desktop App** - Native macOS and Windows applications
- 🔒 **Enterprise Security** - End-to-end encryption, RBAC, audit trails

---

## ✨ Features

### 🔐 Authentication & Security
- ✅ JWT-based authentication with Redis sessions
- ✅ Google OAuth 2.0 sign-up/login
- ✅ Role-based access control (RBAC)
- ✅ Database password encryption (AES-256-CBC)
- ✅ API payload encryption (optional)
- ✅ Audit trail logging
- ✅ Rate limiting & security headers

### 📊 Accounting & Finance
- ✅ **Chart of Accounts** - Hierarchical account groups
- ✅ **Ledger Management** - Complete ledger system
- ✅ **Voucher System** - All voucher types (Sales, Purchase, Payment, Receipt, Journal, etc.)
- ✅ **Double-Entry Bookkeeping** - Automatic debit/credit balancing
- ✅ **Bill-Wise Tracking** - Advanced bill allocation system
- ✅ **Financial Reports** - Trial Balance, Balance Sheet, P&L Statement

### 🇮🇳 GST Compliance
- ✅ **GSTIN Management** - Multiple GSTIN support
- ✅ **GST Rate Master** - Configurable tax rates
- ✅ **Automatic GST Calculation** - CGST, SGST, IGST, Cess
- ✅ **GSTR-1 Generation** - Export-ready JSON format
- ✅ **GSTR-3B Generation** - Monthly return preparation
- ✅ **E-Invoice Integration** - IRN generation with QR code
- ✅ **E-Way Bill** - Transportation document management

### 💼 TDS Management
- ✅ **TDS Calculation** - Automatic TDS computation
- ✅ **TDS Return Preparation** - Quarterly returns
- ✅ **Form 16A Generation** - TDS certificates

### 📦 Sales & Distribution
- ✅ **Distributor Management** - Complete distributor lifecycle
- ✅ **Salesman Management** - Sales team tracking
- ✅ **Referral System** - Referral codes and rewards
- ✅ **Commission Calculation** - Automated commission processing
- ✅ **Payout Management** - Commission payout tracking
- ✅ **Target Management** - Sales target setting and tracking

### 🔔 Notification System
- ✅ **Real-Time WebSocket** - Instant notifications
- ✅ **Email Notifications** - Template-based emails
- ✅ **Desktop Notifications** - Browser notifications
- ✅ **Sound Alerts** - Unique sounds per notification type
- ✅ **Notification Preferences** - User-customizable settings
- ✅ **Notification Management UI** - Complete notification center

### 🎨 Invoice Templates
- ✅ **Multiple Templates** - Professional invoice designs
- ✅ **Template Selection** - Tenant-configurable templates
- ✅ **PDF Generation** - Client-side PDF export
- ✅ **Print Size Options** - A4, Letter, Custom sizes
- ✅ **Company Logo** - Logo integration
- ✅ **Digital Signature** - DSC certificate support

### 🖥️ Desktop Application
- ✅ **Native Apps** - macOS and Windows
- ✅ **Auto-Updater** - Automatic update mechanism
- ✅ **Code Signing Ready** - Production-ready signing
- ✅ **Universal Binaries** - macOS Intel + Apple Silicon

---

## 🛠️ Technology Stack

### Backend
| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js (v18+) |
| **Framework** | Express.js |
| **ORM** | Sequelize |
| **Database** | MySQL 8.0+ |
| **Cache/Session** | Redis |
| **File Upload** | Multer |
| **WebSocket** | Socket.IO (v4.7.2) |
| **Authentication** | JWT + Redis Sessions |
| **QR Code** | qrcode |
| **HTTP Client** | axios |

### Frontend
| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15.5 |
| **UI Library** | React |
| **State Management** | React Context API |
| **WebSocket Client** | Socket.IO Client |
| **Desktop App** | Electron |
| **PDF Generation** | jsPDF + html2canvas |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Redis (for sessions and caching)
- Git

### Backend Setup

   ```bash
# Clone repository
git clone https://github.com/Illusio-Designs/finvera.git
cd finvera/backend

# Install dependencies
   npm install

# Configure environment
   cp .env.example .env
# Edit .env with your configuration

# Setup database
   npm run migrate
   npm run seed

# Start development server
   npm run dev
   ```

### Frontend Setup

   ```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
   npm install

# Configure environment
   cp .env.example .env
# Edit .env with your configuration

# Start development server
   npm run dev
   ```

Visit `http://localhost:3001` to see the application.

---

## 📁 Project Structure

```
finvera/
├── 📂 backend/                    # Express.js Backend API
│   ├── 📂 src/
│   │   ├── 📂 config/             # Configuration files
│   │   ├── 📂 models/             # Sequelize models (32+ models)
│   │   ├── 📂 migrations/         # Database migrations
│   │   ├── 📂 seeders/           # Database seeders
│   │   ├── 📂 middleware/        # Express middleware
│   │   ├── 📂 controllers/       # Route controllers
│   │   ├── 📂 services/          # Business logic services
│   │   ├── 📂 websocket/         # WebSocket server
│   │   ├── 📂 routes/           # API routes
│   │   ├── 📂 utils/            # Utility functions
│   │   └── 📂 validators/       # Request validators
│   ├── 📂 uploads/              # File uploads directory
│   └── 📄 server.js             # Application entry point
│
└── 📂 frontend/                  # Next.js Frontend
    ├── 📂 pages/                # Next.js pages
    ├── 📂 components/           # React components
    ├── 📂 lib/                 # Utilities, API client, encryption
    ├── 📂 contexts/            # React contexts
    ├── 📂 electron/           # Electron main process
    ├── 📂 styles/             # Global styles
    └── 📂 dist/              # Electron build output
```

---

## ⚙️ Configuration

### Backend Environment Variables

#### Required Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=finvera_db
MASTER_DB_NAME=finvera_master

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Encryption
ENCRYPTION_KEY=your-32-character-secret-key-for-db-encryption
PAYLOAD_ENCRYPTION_KEY=your-very-strong-secret-key-at-least-32-chars
```

#### Optional Variables

```env
# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# E-Invoice API
E_INVOICE_API_URL=https://api.example.com
E_INVOICE_API_KEY=your-api-key

# Email/SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Razorpay
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_SECRET_KEY=your-secret-key
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
SESSION_SECRET=your-session-secret
```

### Frontend Environment Variables

#### Required Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY=your-very-strong-secret-key-at-least-32-chars
```

#### Optional Variables

```env
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_APP_NAME=Finvera
```

### 🔑 Encryption Keys Setup

**Important:** The encryption keys must be configured correctly for security.

```bash
# Backend .env
ENCRYPTION_KEY=your-32-character-secret-key-change-in-production-must-be-32-chars
PAYLOAD_ENCRYPTION_KEY=your-very-strong-secret-key-at-least-32-characters-long

# Frontend .env
NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY=your-very-strong-secret-key-at-least-32-characters-long
```

**⚠️ Security Notes:**
- `ENCRYPTION_KEY` - Used for database password encryption (backend only)
- `PAYLOAD_ENCRYPTION_KEY` and `NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY` **must match**
- Never commit `.env` files to version control
- Use strong, random keys in production
- Rotate keys carefully (requires re-encrypting data)

---

## 🔐 Security

### Security Features

- 🔒 **JWT Authentication** - Secure token-based authentication
- 🔐 **Redis Sessions** - Scalable session management
- 🛡️ **Password Hashing** - bcrypt with salt rounds
- 🔑 **Database Password Encryption** - AES-256-CBC encryption at rest
- 📦 **API Payload Encryption** - Optional end-to-end encryption
- 🔐 **Data Encryption** - Sensitive fields (PAN, Aadhaar, bank details)
- 👥 **Role-Based Access Control** - Granular permissions
- 🏢 **Tenant Data Isolation** - Complete multi-tenant security
- ✅ **Input Validation** - Comprehensive sanitization
- 🚦 **Rate Limiting** - DDoS protection
- 🛡️ **Security Headers** - Helmet.js integration
- 📝 **Audit Trail** - Complete activity logging

### Encryption Systems

The application uses two separate encryption systems:

#### 1. Database Password Encryption (Automatic)
- **Purpose:** Encrypts database passwords before storing
- **Algorithm:** AES-256-CBC
- **Key:** `ENCRYPTION_KEY` environment variable
- **Status:** Always active - all DB passwords are encrypted

#### 2. API Payload Encryption (Optional)
- **Purpose:** Encrypts API request/response payloads
- **Algorithm:** CryptoJS AES encryption
- **Keys:** `PAYLOAD_ENCRYPTION_KEY` (backend) and `NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY` (frontend)
- **Status:** Activated when client sends encrypted data

### Testing Encryption

```bash
# Test encryption functionality
cd backend
node src/utils/testEncryption.js
```

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new tenant |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/auth/google` | Initiate Google OAuth |
| `GET` | `/api/auth/google/callback` | Google OAuth callback |

### Accounting Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/accounting/invoices/sales` | Create sales invoice |
| `POST` | `/api/accounting/invoices/purchase` | Create purchase invoice |
| `POST` | `/api/accounting/payments` | Create payment voucher |
| `POST` | `/api/accounting/receipts` | Create receipt voucher |
| `GET` | `/api/reports/trial-balance` | Get trial balance |
| `GET` | `/api/reports/balance-sheet` | Get balance sheet |
| `GET` | `/api/reports/profit-loss` | Get P&L statement |

### GST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/gst/returns/gstr1` | Generate GSTR-1 |
| `POST` | `/api/gst/returns/gstr3b` | Generate GSTR-3B |
| `POST` | `/api/einvoice/generate` | Generate e-invoice IRN |
| `GET` | `/api/ewaybill/generate` | Generate e-way bill |

### TDS Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tds/calculate` | Calculate TDS |
| `GET` | `/api/tds/certificate/:id` | Generate Form 16A |

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Get user notifications |
| `GET` | `/api/notifications/unread-count` | Get unread count |
| `PUT` | `/api/notifications/:id/read` | Mark as read |
| `PUT` | `/api/notifications/read-all` | Mark all as read |
| `DELETE` | `/api/notifications/:id` | Delete notification |
| `GET` | `/api/notifications/preferences` | Get preferences |
| `PUT` | `/api/notifications/preferences` | Update preferences |

### Company Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/companies/:id/upload-logo` | Upload company logo |
| `POST` | `/api/companies/:id/upload-signature` | Upload signature |
| `POST` | `/api/companies/:id/upload-dsc-certificate` | Upload DSC certificate |
| `PUT` | `/api/companies/:id/dsc-config` | Update DSC configuration |

---

## 💻 Development

### Backend Development

```bash
cd backend

# Development mode with auto-reload
npm run dev

# Run database migrations
npm run migrate

# Undo last migration
npm run migrate:undo

# Run seeders
npm run seed

# Production mode
npm start
```

### Frontend Development

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Production server
npm start

# Run ESLint
npm run lint
```

### Health Checks

```bash
# Backend health check
curl http://localhost:3000/health
curl http://localhost:3000/api/health
```

---

## 🖥️ Desktop Application

Finvera is available as a native desktop application for **macOS** and **Windows** using Electron.

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

### Build Outputs

Build outputs are in the `frontend/dist/` directory:

- **macOS**: DMG installer and ZIP archive (universal binary - Intel + Apple Silicon)
- **Windows**: NSIS installer (.exe) and portable executable

### Electron Features

- ✅ Native desktop application
- ✅ Auto-updater support (configured)
- ✅ Code signing ready (macOS and Windows)
- ✅ Universal macOS binaries (x64 + arm64)
- ✅ Windows installer and portable versions
- ✅ Secure preload scripts
- ✅ DevTools in development mode

---

## 🚢 Deployment

### Backend Deployment

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

### Frontend Deployment

1. Set `NODE_ENV=production` in `.env`
2. Set `NEXT_PUBLIC_API_URL` to production backend URL
3. Set `NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY` (must match backend)
4. Build and deploy:
   ```bash
   npm run build
   npm start
   ```

### Desktop Application Deployment

1. Set `NEXT_PUBLIC_API_URL` in `.env` to production backend URL
2. Set `NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY` (must match backend)
3. Build for distribution:
   ```bash
   npm run electron:build:all
   ```
4. Code sign applications (required for distribution)
5. Test installers on clean systems
6. Distribute DMG (macOS) or EXE (Windows) files

---

## 📊 Database Models

### Core Models (14)
- Tenant, User, Distributor, Salesman
- SubscriptionPlan, ReferralCode, ReferralReward
- Commission, Payout, Lead, LeadActivity
- Target, Notification, NotificationPreference

### Accounting Models (8)
- AccountGroup, Ledger, VoucherType, Voucher
- VoucherItem, VoucherLedgerEntry
- BillWiseDetail, BillAllocation

### GST & Compliance Models (3)
- GSTIN, GSTRReturn, EInvoice
- **Note**: GST rates now fetched from Sandbox API (removed GSTRate model)
- TDSDetail (TDS sections now fetched from Sandbox API)

### System Models (1)
- AuditLog

**Total: 32+ models**

---

## 📄 License

### ISC License

This project is licensed under the ISC License.

### Commercial License

For commercial use or extended licensing options, please contact us to purchase a license.

**Contact Information:**
- 📧 Email: [info@illusiodesigns.agency](mailto:info@illusiodesigns.agency)
- 🌐 Website: [https://illusiodesigns.agency](https://illusiodesigns.agency)
- 📞 Phone: 7600046416

### ⚠️ Legal Notice

**WARNING: Unauthorized Use Prohibited**

This software is protected by copyright and licensing laws. Any use of this software without a valid license is strictly prohibited and constitutes a violation of intellectual property rights.

**Legal Consequences:**
- Unauthorized use, distribution, or modification of this software without a proper license will result in legal action
- Violators will be prosecuted to the full extent of the law
- This includes but is not limited to: civil lawsuits, monetary damages, and criminal prosecution where applicable

**To avoid legal action, please:**
1. Purchase an appropriate license before using this software
2. Contact us at [info@illusiodesigns.agency](mailto:info@illusiodesigns.agency) for licensing inquiries
3. Ensure all team members and users are properly licensed

By using this software, you acknowledge that you have read, understood, and agree to comply with all licensing terms and conditions.

---

<div align="center">

### 🎉 Status: Production Ready

**All features implemented and tested!**

---

**Made with ❤️ by [Illusio Designs](https://illusiodesigns.agency)**

[⬆ Back to Top](#-finvera)

</div>
