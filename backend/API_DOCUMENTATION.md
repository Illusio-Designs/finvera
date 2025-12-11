# Finvera API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### Register Tenant
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "SecurePass123",
  "company_name": "ABC Company"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@company.com",
    "tenant_id": "uuid"
  },
  "accessToken": "jwt_token",
  "refreshToken": "jwt_refresh_token",
  "jti": "session_id"
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "jwt_refresh_token"
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
Content-Type: application/json

{
  "jti": "session_id"
}
```

---

## Accounting Endpoints

### Create Sales Invoice
```http
POST /api/accounting/invoices/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "voucher_date": "2025-01-15",
  "party_ledger_id": "uuid",
  "place_of_supply": "Maharashtra",
  "items": [
    {
      "item_description": "Product A",
      "hsn_sac_code": "12345678",
      "quantity": 10,
      "rate": 1000,
      "gst_rate": 18
    }
  ],
  "narration": "Sales invoice"
}
```

### Create Purchase Invoice
```http
POST /api/accounting/invoices/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "voucher_date": "2025-01-15",
  "party_ledger_id": "uuid",
  "place_of_supply": "Maharashtra",
  "items": [
    {
      "item_description": "Raw Material",
      "hsn_sac_code": "12345678",
      "quantity": 50,
      "rate": 500,
      "gst_rate": 18
    }
  ]
}
```

### Create Payment Voucher
```http
POST /api/accounting/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "voucher_date": "2025-01-15",
  "party_ledger_id": "uuid",
  "amount": 5000,
  "payment_mode": "Bank Transfer",
  "bank_ledger_id": "uuid",
  "narration": "Payment to supplier"
}
```

### Create Receipt Voucher
```http
POST /api/accounting/receipts
Authorization: Bearer <token>
Content-Type: application/json

{
  "voucher_date": "2025-01-15",
  "party_ledger_id": "uuid",
  "amount": 10000,
  "payment_mode": "Bank Transfer",
  "bank_ledger_id": "uuid",
  "narration": "Receipt from customer"
}
```

### Create Journal Entry
```http
POST /api/accounting/journals
Authorization: Bearer <token>
Content-Type: application/json

{
  "voucher_date": "2025-01-15",
  "ledger_entries": [
    {
      "ledger_id": "uuid",
      "debit_amount": 1000,
      "credit_amount": 0,
      "narration": "Debit entry"
    },
    {
      "ledger_id": "uuid",
      "debit_amount": 0,
      "credit_amount": 1000,
      "narration": "Credit entry"
    }
  ],
  "narration": "Adjustment entry"
}
```

### Post Voucher
```http
POST /api/accounting/vouchers/:id/post
Authorization: Bearer <token>
```

### List Vouchers
```http
GET /api/accounting/vouchers?page=1&limit=20&status=posted&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

---

## Ledger Management

### Create Ledger
```http
POST /api/accounting/ledgers
Authorization: Bearer <token>
Content-Type: application/json

{
  "ledger_code": "CUST001",
  "ledger_name": "Acme Corporation",
  "account_group_id": "uuid",
  "ledger_type": "Customer",
  "email": "contact@acme.com",
  "phone": "1234567890",
  "gstin": "27ABCDE1234F1Z5",
  "pan": "ABCDE1234F",
  "opening_balance": 0,
  "opening_balance_type": "Debit"
}
```

### Get Ledger Balance
```http
GET /api/accounting/ledgers/:id/balance?as_on_date=2025-01-31
Authorization: Bearer <token>
```

---

## Reports

### Trial Balance
```http
GET /api/reports/trial-balance?as_on_date=2025-01-31
Authorization: Bearer <token>
```

### Balance Sheet
```http
GET /api/reports/balance-sheet?as_on_date=2025-01-31
Authorization: Bearer <token>
```

### Profit & Loss
```http
GET /api/reports/profit-loss?from_date=2025-01-01&to_date=2025-01-31
Authorization: Bearer <token>
```

### Ledger Statement
```http
GET /api/reports/ledger-statement?ledger_id=uuid&from_date=2025-01-01&to_date=2025-01-31
Authorization: Bearer <token>
```

---

## GST Management

### Create GSTIN
```http
POST /api/gst/gstins
Authorization: Bearer <token>
Content-Type: application/json

{
  "gstin": "27ABCDE1234F1Z5",
  "legal_name": "ABC Company Pvt Ltd",
  "state": "Maharashtra",
  "state_code": "27",
  "registration_type": "Regular",
  "is_primary": true,
  "e_invoice_applicable": true
}
```

### Generate GSTR-1
```http
POST /api/gst/returns/gstr1
Authorization: Bearer <token>
Content-Type: application/json

{
  "gstin": "27ABCDE1234F1Z5",
  "period": "01-2025"
}
```

### Generate GSTR-3B
```http
POST /api/gst/returns/gstr3b
Authorization: Bearer <token>
Content-Type: application/json

{
  "gstin": "27ABCDE1234F1Z5",
  "period": "01-2025"
}
```

---

## TDS Management

### Calculate TDS
```http
POST /api/tds/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "voucher_id": "uuid",
  "tds_section": "194C",
  "tds_rate": 10
}
```

### Generate TDS Return
```http
POST /api/tds/return
Authorization: Bearer <token>
Content-Type: application/json

{
  "quarter": "Q1-2025",
  "financial_year": "2024-2025"
}
```

### Generate TDS Certificate (Form 16A)
```http
GET /api/tds/certificate/:id
Authorization: Bearer <token>
```

---

## Bill-wise Management

### Get Outstanding Bills
```http
GET /api/accounting/outstanding?ledger_id=uuid&as_on_date=2025-01-31
Authorization: Bearer <token>
```

### Allocate Payment to Bills
```http
POST /api/accounting/bills/allocate
Authorization: Bearer <token>
Content-Type: application/json

{
  "payment_voucher_id": "uuid",
  "allocations": [
    {
      "bill_id": "uuid",
      "allocated_amount": 5000
    }
  ]
}
```

### Aging Report
```http
GET /api/accounting/bills/aging?ledger_id=uuid&as_on_date=2025-01-31
Authorization: Bearer <token>
```

---

## Admin Endpoints (Super Admin Only)

### Platform Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer <token>
```

### Revenue Analytics
```http
GET /api/admin/analytics/revenue?period=monthly&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

### List Distributors
```http
GET /api/admin/distributors?page=1&limit=20&status=active
Authorization: Bearer <token>
```

### Create Distributor
```http
POST /api/admin/distributors
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "distributor@example.com",
  "password": "Password123",
  "distributor_code": "DIST001",
  "company_name": "Distributor Company",
  "contact_person": "John Doe",
  "phone": "1234567890",
  "territory": ["Maharashtra", "Gujarat"],
  "commission_rate": 5
}
```

### List Salesmen
```http
GET /api/admin/salesmen?distributor_id=uuid&page=1&limit=20
Authorization: Bearer <token>
```

### Commission Summary
```http
GET /api/admin/commissions/summary?period=01-2025&recipient_type=salesman
Authorization: Bearer <token>
```

### Generate Payouts
```http
POST /api/admin/payouts/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "period": "01-2025",
  "recipient_type": "salesman"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [...]
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Authentication endpoints: 10 requests per 15 minutes per IP

---

## E-Invoice Endpoints

### Generate IRN (Invoice Reference Number)
```http
POST /api/einvoice/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "voucher_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "eInvoice": {
    "id": "uuid",
    "irn": "IRN1234567890ABCDEF",
    "ack_number": "ACK123456",
    "ack_date": "2025-01-15",
    "qr_code": "data:image/png;base64,...",
    "status": "generated"
  }
}
```

### Cancel E-Invoice
```http
POST /api/einvoice/cancel/:voucher_id
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "1"
}
```

**Cancellation Reasons:**
- 1: Duplicate
- 2: Data entry mistake
- 3: Order cancelled
- 4: Other

### Get E-Invoice Details
```http
GET /api/einvoice/voucher/:voucher_id
Authorization: Bearer <token>
```

### List E-Invoices
```http
GET /api/einvoice?page=1&limit=20&status=generated
Authorization: Bearer <token>
```

---

## Notes

1. All dates should be in ISO 8601 format (YYYY-MM-DD)
2. All monetary amounts are in INR (Indian Rupees)
3. GST rates are percentages (e.g., 18 for 18%)
4. All UUIDs are in standard UUID v4 format
5. Pagination: Default page=1, limit=20
6. E-Invoice integration requires NIC IRP portal credentials (configure in .env)

