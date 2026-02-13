# Test Data Seeding Complete

## Overview
Comprehensive test data has been created for `finvera_trader_test` database with all types of vouchers and TDS sections for report generation.

## Login Credentials

### Tenant Admin Account
- **Email**: `admin@tradertest.com`
- **Password**: `Admin@123`
- **Subdomain**: `trader-test`
- **Database**: `finvera_trader_test`

### Database Structure
- **User Account**: Created in `finvera_db` (admin database)
- **Company**: Created in `finvera_master` (master database)
- **Tenant Data**: Created in `finvera_trader_test` (tenant database)

## Test Data Included

### 1. Debtors (Sundry Debtors) - 5 entries
- ABC Enterprises (Mumbai, Maharashtra)
- XYZ Trading Co (Bangalore, Karnataka)
- PQR Industries (Chandigarh, Haryana)
- LMN Distributors (Delhi, Delhi)
- RST Wholesale (Ahmedabad, Gujarat)

### 2. Creditors (Sundry Creditors) - 5 entries with Different TDS Sections
1. **Supplier One Pvt Ltd** - TDS Section 194C @ 2% (Contractor)
2. **Vendor Two Industries** - TDS Section 194J @ 10% (Professional Services)
3. **Material Three Co** - TDS Section 194H @ 5% (Commission)
4. **Goods Four Trading** - No TDS
5. **Stock Five Suppliers** - TDS Section 194Q @ 0.10% (Goods Purchase)

### 3. Inventory Items - 5 entries
- Product A - Widget (HSN: 84159000, GST: 18%)
- Product B - Gadget (HSN: 85176200, GST: 18%)
- Product C - Tool (HSN: 82054000, GST: 12%)
- Product D - Component (HSN: 84099100, GST: 18%)
- Product E - Accessory (HSN: 39269099, GST: 12%)

### 4. Vouchers

#### Sales Invoices - 5 entries
- SI-2024-0001 to SI-2024-0005
- With GST calculations (CGST + SGST)
- Linked to debtors

#### Purchase Invoices - 5 entries with TDS
- PI-2024-0001 to PI-2024-0005
- With GST calculations
- TDS deductions as per creditor's section:
  - PI-2024-0001: TDS 194C @ 2%
  - PI-2024-0002: TDS 194J @ 10%
  - PI-2024-0003: TDS 194H @ 5%
  - PI-2024-0004: No TDS
  - PI-2024-0005: TDS 194Q @ 0.10%

#### Payment Vouchers - 3 entries
- PAY-2024-0001 to PAY-2024-0003
- Payments to creditors from bank

#### Receipt Vouchers - 3 entries
- REC-2024-0001 to REC-2024-0003
- Receipts from debtors to bank

#### Journal Vouchers - 2 entries
- JV-2024-0001 to JV-2024-0002
- Internal adjustments

#### Contra Vouchers - 2 entries
- CNT-2024-0001 to CNT-2024-0002
- Cash to bank and bank to cash transfers

#### Debit Notes - 3 entries
- DN-2024-0001 to DN-2024-0003
- Purchase returns with GST

#### Credit Notes - 3 entries
- CN-2024-0001 to CN-2024-0003
- Sales returns with GST

### 5. Warehouses - 2 entries
- Main Warehouse (Mumbai, Maharashtra)
- Branch Warehouse (Pune, Maharashtra)

### 6. Stock Management
- Stock movements for all 5 inventory items
- Warehouse stocks distributed across both warehouses
- Opening stock entries

### 7. GSTIN Records
- Company GSTIN: 27AABCT1234F1Z5
- Legal Name: Test Trader Company Pvt Ltd
- State: Maharashtra

## TDS Sections Covered

The test data includes all major TDS sections for comprehensive reporting:

1. **194C** - Payments to contractors (2%)
2. **194J** - Professional or technical services (10%)
3. **194H** - Commission or brokerage (5%)
4. **194Q** - Purchase of goods (0.10%)

## How to Use

### Run the Seeder
```bash
npm run seed:test-data
```
This command will:
1. Clear old test data
2. Seed fresh data with all voucher types
3. Create default system ledgers (GST, TDS, Cash, Bank, etc.)
4. Provision the company database
5. Set up user and company linking

### Verify Setup
```bash
npm run verify:test-user    # Check user and company setup
npm run verify:test-data    # Check vouchers and data
npm run verify:ledgers      # Check default ledgers
```

### Login to Test
1. Use subdomain: `trader-test`
2. Email: `admin@tradertest.com`
3. Password: `Admin@123`

## Reports You Can Generate

With this test data, you can generate:
- TDS reports by section (194C, 194J, 194H, 194Q)
- GST reports (Sales, Purchase)
- Ledger reports (Debtors, Creditors)
- Stock reports (Inventory, Warehouse-wise)
- Voucher reports (All types)
- Party-wise reports
- Date-wise reports

## Database Structure

- **Master Database**: `finvera_master` - Contains tenant_master entry
- **Tenant Database**: `finvera_trader_test` - Contains all test data
- **Admin Database**: `finvera_db` - Not used for this tenant

## Notes

- All vouchers are in "posted" status
- All dates are in January 2024
- All amounts include proper GST calculations
- TDS is calculated on taxable amount (before GST)
- All ledgers have opening balances
- All inventory items have opening stock
