# Profit & Loss (P&L) Statement - Correct Accounting Logic

## Overview

This document explains the correct implementation of Profit & Loss statement generation in the Finvera ERP system, following standard accounting principles and GST compliance.

## Core Principle

**P&L must use ONLY groups where `affects_pl = true`**

The system automatically excludes:
- Assets (Cash, Bank, Debtors, Fixed Assets, Stock)
- Liabilities (Creditors, Loans)
- GST Ledgers (Input/Output GST)
- Capital & Reserves
- Stock ledger balances (Stock is an asset, not an expense)

## Account Groups in P&L

### ✅ Income Groups (affects_pl = true)

| Group Code | Name | affects_gross_profit | Purpose |
|------------|------|---------------------|---------|
| SAL | Sales Accounts | true | Trading Account - Sales revenue |
| DIR_INC | Direct Income | true | Trading Account - Direct income |
| IND_INC | Indirect Income | false | P&L Account - Other income |

### ✅ Expense Groups (affects_pl = true)

| Group Code | Name | affects_gross_profit | Purpose |
|------------|------|---------------------|---------|
| PUR | Purchase Accounts | true | Trading Account - Purchases |
| DIR_EXP | Direct Expenses | true | Trading Account - Direct costs |
| IND_EXP | Indirect Expenses | false | P&L Account - Operating expenses |

### ❌ Groups Excluded from P&L

| Group | Reason |
|-------|--------|
| DT (GST) | Tax is recoverable/payable, not income/expense |
| SD / SC | Balance Sheet items (Debtors/Creditors) |
| Cash / Bank | Movement, not expense |
| Capital | Owner funds |
| Stock (INV) | Asset - used in COGS calculation only |

## P&L Generation Logic

### Step 1: Fetch Only P&L Ledgers

```sql
SELECT l.id, l.name, g.code, g.nature, g.affects_gross_profit
FROM ledgers l
JOIN account_groups g ON g.id = l.group_id
WHERE g.affects_pl = true;
```

### Step 2: Calculate Net Movement of Each Ledger

```sql
SELECT ledger_id, 
       SUM(debit_amount) as total_debit,
       SUM(credit_amount) as total_credit
FROM voucher_ledger_entries vle
JOIN vouchers v ON v.id = vle.voucher_id
WHERE v.status = 'posted'
  AND v.voucher_date BETWEEN :fromDate AND :toDate
GROUP BY ledger_id;
```

### Step 3: Interpret Based on Nature

**Income Accounts:**
- Credit increases profit
- Movement = Credit - Debit
- If `affects_gross_profit = true` → Trading Account
- If `affects_gross_profit = false` → P&L Account (Indirect Income)

**Expense Accounts:**
- Debit increases cost
- Movement = Debit - Credit
- If `affects_gross_profit = true` → Trading Account
- If `affects_gross_profit = false` → P&L Account (Indirect Expenses)

## Trading Account + P&L Structure

### 🔹 TRADING ACCOUNT (Gross Profit Calculation)

**Debit Side:**
```
Opening Stock                     xxx
Add: Purchases                    xxx
Less: Purchase Returns           (xxx)
                                 -----
Net Purchases                     xxx
Add: Direct Expenses              xxx
                                 -----
Cost of Goods Available           xxx
Less: Closing Stock              (xxx)
                                 -----
Cost of Goods Sold (COGS)         xxx
Add: Gross Profit (if profit)     xxx
                                 =====
Total                             xxx
```

**Credit Side:**
```
Sales                             xxx
Less: Sales Returns              (xxx)
                                 -----
Net Sales                         xxx
Add: Direct Income                xxx
Add: Gross Loss (if loss)         xxx
                                 =====
Total                             xxx
```

**Gross Profit Formula:**
```
Gross Profit = Net Sales + Direct Income - COGS

Where:
COGS = Opening Stock + Net Purchases + Direct Expenses - Closing Stock
```

### 🔹 PROFIT & LOSS ACCOUNT (Net Profit Calculation)

**Debit Side:**
```
Gross Profit B/F                  xxx
Add: Indirect Income              xxx
                                 -----
                                  xxx
Less: Indirect Expenses           xxx
      (including Round Off)
                                 -----
Net Profit                        xxx
```

**Net Profit Formula:**
```
Net Profit = Gross Profit + Indirect Income - Indirect Expenses
```

## GST Treatment

### ❗ GST NEVER Appears in P&L

| GST Type | Treatment |
|----------|-----------|
| Input GST | Asset (Tax Credit Available) |
| Output GST | Liability (Tax Collected) |
| GST Paid | Settlement of Liability |
| GST Collected | Government Liability |

**GST is not your expense or income.**

### Purchase Entry (Correct)

```
Purchase A/c Dr (Taxable Value)     10,000
Input CGST Dr                          900
Input SGST Dr                          900
    To Party Cr                              11,800
```

P&L receives NET purchase amount (₹10,000), not including GST.

## Round Off Treatment

### Ledger Configuration

```javascript
{
  ledger_code: 'ROUND_OFF',
  ledger_name: 'Round Off',
  group_code: 'IND_EXP',
  affects_pl: true,
  affects_gross_profit: false
}
```

### Why Round Off is an Expense?

Rounding difference is treated as:
- Small Loss → Expense (Debit)
- Small Gain → Income (Credit to same ledger)

ERP treats it as Indirect Expense ledger with +/- value.

### Example Entry

**Invoice total = ₹1,000.32, Rounded = ₹1,000.00**

```
Round Off A/c Dr  0.32
    To Party Cr         0.32
```

**If gain (Invoice = ₹999.80, Rounded = ₹1,000.00):**

```
Party A/c Dr      1,000.00
    To Round Off Cr        0.20
    To Sales Cr          999.80
```

System automatically adjusts in P&L under Indirect Expenses.

## Implementation Checklist

- [x] Use `affects_pl = true` filter
- [x] Use `affects_gross_profit` to separate Trading Account from P&L Account
- [x] Ignore GST group completely (`is_tax_group = true`)
- [x] Use ledger movement from journal entries, not closing balance
- [x] Add Round Off ledger under IND_EXP
- [x] Calculate COGS using formula: Opening + Purchases + Direct Exp - Closing
- [x] Do NOT derive P&L from Balance Sheet
- [x] Always compute fresh from journal entries within period

## Common Mistakes to Avoid

### ❌ WRONG: Using Ledger Closing Balance

```javascript
// DON'T DO THIS
const sales = ledger.current_balance;
```

### ✅ CORRECT: Using Journal Movement

```javascript
// DO THIS
const movement = await getMovementForPeriod(ledger_id, fromDate, toDate);
const sales = movement.credit - movement.debit;
```

### ❌ WRONG: Including GST in P&L

```javascript
// DON'T DO THIS
if (group.group_code === 'DT') {
  totalExpenses += amount;
}
```

### ✅ CORRECT: Excluding GST

```javascript
// DO THIS
if (!group.affects_pl || group.is_tax_group) return;
```

### ❌ WRONG: Using Stock Credit as COGS

```javascript
// DON'T DO THIS
const cogs = stockMovement.credit;
```

### ✅ CORRECT: Using COGS Formula

```javascript
// DO THIS
const cogs = openingStock + netPurchases + directExpenses - closingStock;
```

## Example Output

```
TRADING ACCOUNT
--------------------------------
Opening Stock                  50,000
Purchases              1,00,000
Less: Purchase Returns  (5,000)
                       --------
Net Purchases                  95,000
Direct Expenses                 5,000
                       --------
Cost of Goods Available      1,50,000
Less: Closing Stock          (60,000)
                       --------
Cost of Goods Sold             90,000

Sales                  1,40,000
Less: Sales Returns     (2,000)
                       --------
Net Sales                    1,38,000
Direct Income                  2,000
                       --------
Total Revenue                1,40,000

Gross Profit = 1,40,000 - 90,000 = 50,000

PROFIT & LOSS ACCOUNT
--------------------------------
Gross Profit B/F               50,000
Add: Indirect Income            1,000
                       --------
                               51,000
Less: Indirect Expenses        15,000
      Round Off                   0.32
                       --------
Net Profit                     35,999.68
```

## Database Schema

### account_groups Table

```sql
CREATE TABLE account_groups (
  id INT PRIMARY KEY,
  group_code VARCHAR(20),
  name VARCHAR(100),
  nature ENUM('asset', 'liability', 'equity', 'income', 'expense'),
  bs_category VARCHAR(30),  -- Balance Sheet category
  affects_pl BOOLEAN DEFAULT false,  -- Affects Profit & Loss
  affects_gross_profit BOOLEAN DEFAULT false,  -- Affects Trading Account
  is_tax_group BOOLEAN DEFAULT false,  -- Is GST/Tax group
  ptoprt BOOLEAN DEFAULT true,  -- Print to report
  is_system BOOLEAN DEFAULT false
);
```

### Key Flags

- **affects_pl**: If true, ledgers in this group appear in P&L
- **affects_gross_profit**: If true, appears in Trading Account; if false, appears in P&L Account
- **is_tax_group**: If true, this is a tax control group (GST/TDS) - excluded from P&L
- **bs_category**: Used for Balance Sheet categorization only

## API Response Structure

```json
{
  "period": {
    "from": "2026-01-01",
    "to": "2026-01-31"
  },
  "trading_account": {
    "opening_stock": { "amount": 50000 },
    "purchases": {
      "gross_purchases": 100000,
      "purchase_returns": 5000,
      "net_purchases": 95000
    },
    "direct_expenses": { "total": 5000 },
    "direct_incomes": { "total": 2000 },
    "closing_stock": { "amount": 60000 },
    "cost_of_goods_sold": { "amount": 90000 },
    "gross_profit": { "amount": 50000 }
  },
  "sales_revenue": {
    "gross_sales": 140000,
    "sales_returns": 2000,
    "net_sales": 138000
  },
  "profit_loss_account": {
    "gross_profit_brought_forward": 50000,
    "indirect_incomes": { "total": 1000 },
    "indirect_expenses": { "total": 15000.32 },
    "net_profit": { "amount": 35999.68, "type": "profit" }
  },
  "totals": {
    "gross_profit": 50000,
    "net_profit": 35999.68,
    "gross_profit_margin": 36.23,
    "net_profit_margin": 26.09
  }
}
```

## References

- [Indian Accounting Standards](https://www.mca.gov.in/content/mca/global/en/acts-rules/ebooks/ind-as.html)
- [GST Law](https://www.cbic.gov.in/resources//htdocs-cbec/gst/index.html)
- [Tally ERP Documentation](https://tallysolutions.com/)

---

**Last Updated:** February 12, 2026
**Version:** 1.0
