# Complete Database Tables List

## Overview

```
Total: 27 unique tables across 3 databases
├── finvera_db: 11 tables
├── finvera_master: 6 tables
└── finvera_tenant_xxx: 10 tables (per tenant)
```

---

## 1. Main Database (finvera_db)

**Purpose:** Platform/Admin/System data

| # | Table Name | Description | Key Fields |
|---|------------|-------------|------------|
| 1 | `users` | Admin users | id, name, email, role, password |
| 2 | `salesmen` | Sales team | id, name, email, phone, commission_rate |
| 3 | `distributors` | Distributors | id, name, email, phone, commission_rate |
| 4 | `subscription_plans` | Plans | id, name, price, features, duration |
| 5 | `referral_codes` | Referral codes | id, code, type, discount, valid_until |
| 6 | `referral_rewards` | Referral rewards | id, referrer_id, referee_id, reward_amount |
| 7 | `commissions` | Commissions | id, salesman_id, tenant_id, amount, status |
| 8 | `payouts` | Payout records | id, recipient_id, amount, status, paid_date |
| 9 | `leads` | Lead management | id, name, email, phone, status, source |
| 10 | `lead_activities` | Lead activities | id, lead_id, activity_type, notes |
| 11 | `targets` | Sales targets | id, salesman_id, target_amount, period |

**Total: 11 tables**

---

## 2. Master Database (finvera_master)

**Purpose:** Tenant metadata + Shared accounting structure

### Tenant Routing

| # | Table Name | Description | Key Fields |
|---|------------|-------------|------------|
| 1 | `tenant_master` | Tenant metadata | id, company_name, subdomain, db_name, db_host, db_user, db_password, subscription_plan, is_active |

### Shared Accounting Structure (Used by ALL tenants)

| # | Table Name | Description | Key Fields |
|---|------------|-------------|------------|
| 2 | `account_groups` | Chart of accounts | id, name, parent_id, nature, group_code |
| 3 | `voucher_types` | Voucher types | id, name, type_category, numbering_prefix |
| 4 | `gst_rates` | GST rate slabs | id, rate_name, cgst_rate, sgst_rate, igst_rate |
| 5 | `tds_sections` | TDS sections | id, section_code, section_name, default_rate |
| 6 | `accounting_years` | Financial years | id, year_name, start_date, end_date |

**Total: 6 tables**

---

## 3. Tenant Databases (finvera_tenant_xxx)

**Purpose:** Tenant-specific transactional data  
**Note:** Each tenant gets their own database with these 10 tables

| # | Table Name | Description | Key Fields |
|---|------------|-------------|------------|
| 1 | `users` | Tenant users | id, name, email, role, password |
| 2 | `ledgers` | Ledgers | id, name, account_group_id (→master), opening_balance, current_balance |
| 3 | `gstins` | GST registrations | id, gstin, legal_name, state, is_primary |
| 4 | `vouchers` | Transactions | id, voucher_type_id (→master), voucher_number, voucher_date, total_amount |
| 5 | `voucher_ledger_entries` | Debit/Credit entries | id, voucher_id, ledger_id, debit, credit |
| 6 | `bill_wise_details` | Bill tracking | id, voucher_id, ledger_id, bill_number, bill_amount, due_date |
| 7 | `gstr_returns` | GST returns | id, gstin_id, return_type, return_period, status |
| 8 | `tds_details` | TDS deductions | id, voucher_id, ledger_id, section, tds_amount |
| 9 | `e_invoices` | E-invoices | id, voucher_id, irn, ack_no, signed_invoice |
| 10 | `audit_logs` | Activity logs | id, user_id, action, entity_type, entity_id |

**Total: 10 tables per tenant**

---

## Detailed Table Descriptions

### Main Database Tables

#### 1. users
```sql
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- password (VARCHAR)
- role (ENUM: 'super_admin', 'admin')
- is_active (BOOLEAN)
- created_at, updated_at
```

#### 2. salesmen
```sql
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- phone (VARCHAR)
- commission_rate (DECIMAL)
- distributor_id (UUID, FK)
- is_active (BOOLEAN)
- created_at, updated_at
```

#### 3. distributors
```sql
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- phone (VARCHAR)
- commission_rate (DECIMAL)
- is_active (BOOLEAN)
- created_at, updated_at
```

#### 4. subscription_plans
```sql
- id (UUID, PK)
- name (VARCHAR)
- price (DECIMAL)
- features (JSON)
- duration_months (INTEGER)
- is_active (BOOLEAN)
- created_at, updated_at
```

#### 5. referral_codes
```sql
- id (UUID, PK)
- code (VARCHAR, UNIQUE)
- type (ENUM: 'salesman', 'distributor', 'tenant')
- owner_id (UUID)
- discount_percentage (DECIMAL)
- valid_until (DATE)
- created_at, updated_at
```

#### 6. referral_rewards
```sql
- id (UUID, PK)
- referrer_id (UUID)
- referee_tenant_id (UUID)
- reward_amount (DECIMAL)
- status (ENUM: 'pending', 'paid')
- created_at, updated_at
```

#### 7. commissions
```sql
- id (UUID, PK)
- salesman_id (UUID, FK)
- tenant_id (UUID)
- amount (DECIMAL)
- calculation_date (DATE)
- status (ENUM: 'pending', 'paid')
- created_at, updated_at
```

#### 8. payouts
```sql
- id (UUID, PK)
- recipient_type (ENUM: 'salesman', 'distributor')
- recipient_id (UUID)
- amount (DECIMAL)
- status (ENUM: 'pending', 'paid')
- paid_date (DATE)
- created_at, updated_at
```

#### 9. leads
```sql
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- company_name (VARCHAR)
- status (ENUM: 'new', 'contacted', 'qualified', 'converted')
- source (VARCHAR)
- salesman_id (UUID, FK)
- created_at, updated_at
```

#### 10. lead_activities
```sql
- id (UUID, PK)
- lead_id (UUID, FK)
- activity_type (VARCHAR)
- notes (TEXT)
- created_by (UUID)
- created_at
```

#### 11. targets
```sql
- id (UUID, PK)
- salesman_id (UUID, FK)
- target_amount (DECIMAL)
- achieved_amount (DECIMAL)
- period (VARCHAR)
- start_date (DATE)
- end_date (DATE)
- created_at, updated_at
```

---

### Master Database Tables

#### 1. tenant_master
```sql
- id (UUID, PK)
- company_name (VARCHAR)
- subdomain (VARCHAR, UNIQUE)
- db_name (VARCHAR, UNIQUE)
- db_host (VARCHAR)
- db_port (INTEGER)
- db_user (VARCHAR)
- db_password (VARCHAR) -- encrypted
- gstin (VARCHAR, UNIQUE)
- pan (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- subscription_plan (VARCHAR)
- subscription_start (DATE)
- subscription_end (DATE)
- is_active (BOOLEAN)
- is_suspended (BOOLEAN)
- db_provisioned (BOOLEAN)
- storage_limit_mb (INTEGER)
- created_at, updated_at
```

#### 2. account_groups
```sql
- id (UUID, PK)
- group_code (VARCHAR, UNIQUE)
- name (VARCHAR)
- parent_id (UUID, FK)
- nature (ENUM: 'asset', 'liability', 'income', 'expense')
- affects_gross_profit (BOOLEAN)
- is_system (BOOLEAN)
- description (TEXT)
- created_at, updated_at
```

#### 3. voucher_types
```sql
- id (UUID, PK)
- name (VARCHAR, UNIQUE)
- type_category (ENUM: 'sales', 'purchase', 'payment', 'receipt', 'journal', 'contra', 'debit_note', 'credit_note')
- numbering_prefix (VARCHAR)
- affects_stock (BOOLEAN)
- is_system (BOOLEAN)
- description (TEXT)
- created_at, updated_at
```

#### 4. gst_rates
```sql
- id (UUID, PK)
- rate_name (VARCHAR)
- cgst_rate (DECIMAL)
- sgst_rate (DECIMAL)
- igst_rate (DECIMAL)
- cess_rate (DECIMAL)
- is_active (BOOLEAN)
- effective_from (DATE)
- effective_to (DATE)
- created_at, updated_at
```

#### 5. tds_sections
```sql
- id (UUID, PK)
- section_code (VARCHAR, UNIQUE)
- section_name (VARCHAR)
- default_rate (DECIMAL)
- description (TEXT)
- is_active (BOOLEAN)
- created_at, updated_at
```

#### 6. accounting_years
```sql
- id (UUID, PK)
- year_name (VARCHAR)
- start_date (DATE)
- end_date (DATE)
- is_current (BOOLEAN)
- created_at, updated_at
```

---

### Tenant Database Tables

#### 1. users (tenant-specific)
```sql
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- password (VARCHAR)
- role (ENUM: 'admin', 'accountant', 'viewer')
- phone (VARCHAR)
- is_active (BOOLEAN)
- last_login (DATETIME)
- created_at, updated_at
```

#### 2. ledgers
```sql
- id (UUID, PK)
- name (VARCHAR, UNIQUE)
- account_group_id (UUID) -- References master.account_groups
- opening_balance (DECIMAL)
- current_balance (DECIMAL)
- gstin (VARCHAR)
- pan (VARCHAR)
- address (TEXT)
- city, state, pincode
- phone, email
- is_active (BOOLEAN)
- created_at, updated_at
```

#### 3. gstins
```sql
- id (UUID, PK)
- gstin (VARCHAR, UNIQUE)
- legal_name (VARCHAR)
- trade_name (VARCHAR)
- state (VARCHAR)
- address (TEXT)
- registration_date (DATE)
- gstin_status (ENUM: 'active', 'cancelled', 'suspended')
- is_primary (BOOLEAN)
- created_at, updated_at
```

#### 4. vouchers
```sql
- id (UUID, PK)
- voucher_type_id (UUID) -- References master.voucher_types
- voucher_number (VARCHAR)
- voucher_date (DATE)
- reference_number (VARCHAR)
- reference_date (DATE)
- narration (TEXT)
- total_amount (DECIMAL)
- status (ENUM: 'draft', 'posted', 'cancelled')
- created_by (UUID)
- created_at, updated_at
```

#### 5. voucher_ledger_entries
```sql
- id (UUID, PK)
- voucher_id (UUID, FK)
- ledger_id (UUID, FK)
- debit (DECIMAL)
- credit (DECIMAL)
- narration (TEXT)
- created_at, updated_at
```

#### 6. bill_wise_details
```sql
- id (UUID, PK)
- voucher_id (UUID, FK)
- ledger_id (UUID, FK)
- bill_number (VARCHAR)
- bill_date (DATE)
- bill_amount (DECIMAL)
- due_date (DATE)
- is_open (BOOLEAN)
- created_at, updated_at
```

#### 7. gstr_returns
```sql
- id (UUID, PK)
- gstin_id (UUID, FK)
- return_type (ENUM: 'GSTR1', 'GSTR3B', 'GSTR4', 'GSTR9')
- return_period (VARCHAR)
- financial_year (VARCHAR)
- filing_date (DATE)
- status (ENUM: 'draft', 'filed', 'revised')
- arn (VARCHAR)
- return_data (JSON)
- created_at, updated_at
```

#### 8. tds_details
```sql
- id (UUID, PK)
- voucher_id (UUID, FK)
- ledger_id (UUID, FK)
- section (VARCHAR) -- References master.tds_sections
- tds_rate (DECIMAL)
- taxable_amount (DECIMAL)
- tds_amount (DECIMAL)
- quarter (VARCHAR)
- financial_year (VARCHAR)
- created_at, updated_at
```

#### 9. e_invoices
```sql
- id (UUID, PK)
- voucher_id (UUID, FK)
- irn (VARCHAR)
- ack_no (VARCHAR)
- ack_date (DATETIME)
- signed_invoice (TEXT)
- signed_qr_code (TEXT)
- status (ENUM: 'pending', 'generated', 'cancelled', 'failed')
- error_message (TEXT)
- created_at, updated_at
```

#### 10. audit_logs
```sql
- id (UUID, PK)
- user_id (UUID)
- action (VARCHAR)
- entity_type (VARCHAR)
- entity_id (UUID)
- old_values (JSON)
- new_values (JSON)
- ip_address (VARCHAR)
- user_agent (TEXT)
- created_at
```

---

## Summary by Database

```
┌─────────────────────────────────────────────────────┐
│  Main DB (finvera_db) - 11 tables                   │
├─────────────────────────────────────────────────────┤
│  1. users (admin)                                   │
│  2. salesmen                                        │
│  3. distributors                                    │
│  4. subscription_plans                              │
│  5. referral_codes                                  │
│  6. referral_rewards                                │
│  7. commissions                                     │
│  8. payouts                                         │
│  9. leads                                           │
│  10. lead_activities                                │
│  11. targets                                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Master DB (finvera_master) - 6 tables              │
├─────────────────────────────────────────────────────┤
│  Routing:                                           │
│  1. tenant_master                                   │
│                                                      │
│  Shared Structure:                                  │
│  2. account_groups                                  │
│  3. voucher_types                                   │
│  4. gst_rates                                       │
│  5. tds_sections                                    │
│  6. accounting_years                                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Tenant DB (finvera_tenant_xxx) - 10 tables         │
├─────────────────────────────────────────────────────┤
│  1. users (tenant users)                            │
│  2. ledgers                                         │
│  3. gstins                                          │
│  4. vouchers                                        │
│  5. voucher_ledger_entries                          │
│  6. bill_wise_details                               │
│  7. gstr_returns                                    │
│  8. tds_details                                     │
│  9. e_invoices                                      │
│  10. audit_logs                                     │
└─────────────────────────────────────────────────────┘

Total Unique Tables: 27
```

---

## Cross-Database References

Some tenant tables reference master database tables:

| Tenant Table | Field | References |
|--------------|-------|------------|
| `ledgers` | `account_group_id` | `master.account_groups.id` |
| `vouchers` | `voucher_type_id` | `master.voucher_types.id` |
| `tds_details` | `section` | `master.tds_sections.section_code` |

**Note:** These are logical references (stored as UUID/VARCHAR), not foreign key constraints across databases.

---

## Example: 3 Tenants Setup

```
Main DB:        11 tables (shared)
Master DB:       6 tables (shared)

Tenant 1 DB:    10 tables (isolated)
Tenant 2 DB:    10 tables (isolated)
Tenant 3 DB:    10 tables (isolated)

Total Tables:   47 tables across 5 databases
Storage:        Main + Master + (Tenants × 10 tables each)
```

---

## Quick Verification Commands

```sql
-- Check Main DB
USE finvera_db;
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'finvera_db';
-- Result: 11

-- Check Master DB
USE finvera_master;
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'finvera_master';
-- Result: 6

-- Check Tenant DB
USE finvera_acme_1702459200000;
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'finvera_acme_1702459200000';
-- Result: 10

-- List all tenant databases
SHOW DATABASES LIKE 'finvera_tenant_%';
```

---

This is the complete, clean separation of tables across all databases! 🎉
