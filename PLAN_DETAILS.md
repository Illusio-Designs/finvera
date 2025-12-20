# Subscription Plan Details - Add to Database

## Plan 1: Starter Plan

```json
{
  "plan_code": "STARTER",
  "plan_name": "Starter",
  "description": "Perfect for small businesses getting started with accounting and GST compliance",
  "billing_cycle": "monthly",
  "base_price": 999,
  "discounted_price": null,
  "currency": "INR",
  "trial_days": 14,
  "max_users": 1,
  "max_invoices_per_month": 100,
  "max_companies": 1,
  "storage_limit_gb": 5,
  "features": [
    "Up to 100 invoices per month",
    "GST filing (GSTR-1 & GSTR-3B)",
    "Basic accounting with ledgers",
    "Financial reports (Trial Balance, P&L, Balance Sheet)",
    "Chart of Accounts management",
    "Voucher entry (Sales, Purchase, Payment, Receipt)",
    "Email support",
    "1 user account",
    "5 GB storage",
    "Basic dashboard"
  ],
  "is_active": true,
  "is_visible": true,
  "is_featured": false,
  "display_order": 1
}
```

## Plan 2: Professional Plan (Most Popular)

```json
{
  "plan_code": "PROFESSIONAL",
  "plan_name": "Professional",
  "description": "Ideal for growing businesses with advanced accounting needs and e-invoicing",
  "billing_cycle": "monthly",
  "base_price": 2999,
  "discounted_price": 2499,
  "currency": "INR",
  "trial_days": 14,
  "max_users": 5,
  "max_invoices_per_month": -1,
  "max_companies": 3,
  "storage_limit_gb": 50,
  "features": [
    "Unlimited invoices per month",
    "GST filing (GSTR-1 & GSTR-3B)",
    "E-invoicing with IRN generation",
    "QR code generation for invoices",
    "Complete accounting system",
    "Advanced financial reports",
    "Multi-tenant support (up to 3 companies)",
    "Bill-wise tracking",
    "TDS calculation and management",
    "TDS certificate (Form 16A)",
    "Up to 5 user accounts",
    "Email & phone support",
    "Data export (Excel, PDF)",
    "50 GB storage",
    "Advanced dashboard with analytics",
    "Real-time notifications",
    "Audit trail"
  ],
  "is_active": true,
  "is_visible": true,
  "is_featured": true,
  "display_order": 2
}
```

## Plan 3: Enterprise Plan

```json
{
  "plan_code": "ENTERPRISE",
  "plan_name": "Enterprise",
  "description": "For large organizations and accounting firms with custom requirements",
  "billing_cycle": "monthly",
  "base_price": null,
  "discounted_price": null,
  "currency": "INR",
  "trial_days": 30,
  "max_users": -1,
  "max_invoices_per_month": -1,
  "max_companies": -1,
  "storage_limit_gb": -1,
  "features": [
    "Everything in Professional plan",
    "Unlimited users",
    "Unlimited companies",
    "Unlimited storage",
    "API access",
    "White-label options",
    "Custom integrations",
    "Dedicated account manager",
    "Priority 24/7 support",
    "Custom training sessions",
    "SLA guarantee (99.9% uptime)",
    "On-premise deployment option",
    "Custom feature development",
    "Advanced security features",
    "SSO (Single Sign-On)",
    "Custom reporting",
    "Dedicated support channel"
  ],
  "is_active": true,
  "is_visible": true,
  "is_featured": false,
  "display_order": 3
}
```

## Database Insert Instructions

### Option 1: Using Admin Panel
Go to Admin Panel → Pricing Management → Add New Plan and fill in the details above.

### Option 2: Direct SQL Insert
```sql
-- Starter Plan
INSERT INTO subscription_plans (
  id, plan_code, plan_name, description, billing_cycle, base_price, currency,
  trial_days, max_users, max_invoices_per_month, max_companies, storage_limit_gb,
  features, is_active, is_visible, is_featured, display_order, createdAt, updatedAt
) VALUES (
  UUID(), 'STARTER', 'Starter', 'Perfect for small businesses getting started with accounting and GST compliance',
  'monthly', 999, 'INR', 14, 1, 100, 1, 5,
  '["Up to 100 invoices per month","GST filing (GSTR-1 & GSTR-3B)","Basic accounting with ledgers","Financial reports (Trial Balance, P&L, Balance Sheet)","Chart of Accounts management","Voucher entry (Sales, Purchase, Payment, Receipt)","Email support","1 user account","5 GB storage","Basic dashboard"]',
  true, true, false, 1, NOW(), NOW()
);

-- Professional Plan
INSERT INTO subscription_plans (
  id, plan_code, plan_name, description, billing_cycle, base_price, discounted_price, currency,
  trial_days, max_users, max_invoices_per_month, max_companies, storage_limit_gb,
  features, is_active, is_visible, is_featured, display_order, createdAt, updatedAt
) VALUES (
  UUID(), 'PROFESSIONAL', 'Professional', 'Ideal for growing businesses with advanced accounting needs and e-invoicing',
  'monthly', 2999, 2499, 'INR', 14, 5, -1, 3, 50,
  '["Unlimited invoices per month","GST filing (GSTR-1 & GSTR-3B)","E-invoicing with IRN generation","QR code generation for invoices","Complete accounting system","Advanced financial reports","Multi-tenant support (up to 3 companies)","Bill-wise tracking","TDS calculation and management","TDS certificate (Form 16A)","Up to 5 user accounts","Email & phone support","Data export (Excel, PDF)","50 GB storage","Advanced dashboard with analytics","Real-time notifications","Audit trail"]',
  true, true, true, 2, NOW(), NOW()
);

-- Enterprise Plan
INSERT INTO subscription_plans (
  id, plan_code, plan_name, description, billing_cycle, base_price, currency,
  trial_days, max_users, max_invoices_per_month, max_companies, storage_limit_gb,
  features, is_active, is_visible, is_featured, display_order, createdAt, updatedAt
) VALUES (
  UUID(), 'ENTERPRISE', 'Enterprise', 'For large organizations and accounting firms with custom requirements',
  'monthly', NULL, 'INR', 30, -1, -1, -1, -1,
  '["Everything in Professional plan","Unlimited users","Unlimited companies","Unlimited storage","API access","White-label options","Custom integrations","Dedicated account manager","Priority 24/7 support","Custom training sessions","SLA guarantee (99.9% uptime)","On-premise deployment option","Custom feature development","Advanced security features","SSO (Single Sign-On)","Custom reporting","Dedicated support channel"]',
  true, true, false, 3, NOW(), NOW()
);
```

## Notes:
- `-1` means unlimited
- `features` should be stored as JSON array
- `is_featured: true` marks the plan as "Most Popular"
- `display_order` controls the order of display (1, 2, 3)
- `trial_days` is the number of free trial days
- `discounted_price` is optional (null if no discount)
