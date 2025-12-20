/**
 * Field configuration for ledger creation based on account groups
 * Maps account group types to their required/optional fields
 */

export const getLedgerFieldsForGroup = (groupName, groupNature) => {
  const groupNameLower = (groupName || '').toLowerCase();
  const nature = groupNature || '';

  // Common mandatory fields for all ledgers
  const commonFields = {
    ledger_name: { type: 'text', label: 'Ledger Name', required: true },
    account_group: { type: 'display', label: 'Account Group', value: groupName },
    opening_balance: { type: 'number', label: 'Opening Balance', required: false },
    opening_balance_date: { type: 'date', label: 'Opening Balance Date', required: false },
    currency: { type: 'text', label: 'Currency', required: false, defaultValue: 'INR' },
    description: { type: 'textarea', label: 'Description/Notes', required: false },
  };

  // Field configurations by group type
  const fieldConfigs = {
    // ASSETS - Current Assets
    'current assets': {
      ...commonFields,
      bank_account_details: { type: 'textarea', label: 'Bank Account Details (if applicable)', required: false },
      tax_classification: { type: 'text', label: 'Tax Classification', required: false },
    },
    'cash and cash equivalents': {
      ...commonFields,
      bank_account_details: { type: 'textarea', label: 'Bank Account Details', required: false },
      tax_classification: { type: 'text', label: 'Tax Classification', required: false },
    },
    'accounts receivable': {
      ...commonFields,
      tax_classification: { type: 'text', label: 'Tax Classification', required: false },
    },
    'prepaid expenses': {
      ...commonFields,
      tax_classification: { type: 'text', label: 'Tax Classification', required: false },
    },
    'other current assets': {
      ...commonFields,
      tax_classification: { type: 'text', label: 'Tax Classification', required: false },
    },

    // ASSETS - Non-Current Assets
    'non-current assets': {
      ...commonFields,
      purchase_date: { type: 'date', label: 'Purchase Date', required: false },
      purchase_value: { type: 'number', label: 'Purchase Value', required: false },
      depreciation_method: { type: 'select', label: 'Depreciation Method', required: false, options: [
        { value: 'straight_line', label: 'Straight Line' },
        { value: 'declining_balance', label: 'Declining Balance' },
        { value: 'units_of_production', label: 'Units of Production' },
      ]},
      useful_life_years: { type: 'number', label: 'Useful Life (years)', required: false },
      salvage_value: { type: 'number', label: 'Salvage Value', required: false },
      accumulated_depreciation: { type: 'number', label: 'Accumulated Depreciation', required: false },
    },
    'fixed assets': {
      ...commonFields,
      purchase_date: { type: 'date', label: 'Purchase Date', required: false },
      purchase_value: { type: 'number', label: 'Purchase Value', required: false },
      depreciation_method: { type: 'select', label: 'Depreciation Method', required: false, options: [
        { value: 'straight_line', label: 'Straight Line' },
        { value: 'declining_balance', label: 'Declining Balance' },
      ]},
      useful_life_years: { type: 'number', label: 'Useful Life (years)', required: false },
      salvage_value: { type: 'number', label: 'Salvage Value', required: false },
      accumulated_depreciation: { type: 'number', label: 'Accumulated Depreciation', required: false },
    },
    'intangible assets': {
      ...commonFields,
      purchase_date: { type: 'date', label: 'Purchase Date', required: false },
      purchase_value: { type: 'number', label: 'Purchase Value', required: false },
      useful_life_years: { type: 'number', label: 'Useful Life (years)', required: false },
      accumulated_depreciation: { type: 'number', label: 'Accumulated Depreciation', required: false },
    },
    'investments': {
      ...commonFields,
      purchase_date: { type: 'date', label: 'Purchase Date', required: false },
      purchase_value: { type: 'number', label: 'Purchase Value', required: false },
    },

    // LIABILITIES - Current Liabilities
    'current liabilities': {
      ...commonFields,
      vendor_creditor_details: { type: 'textarea', label: 'Vendor/Creditor Details', required: false },
      payment_terms: { type: 'text', label: 'Payment Terms', required: false },
      due_date: { type: 'date', label: 'Due Date', required: false },
      tax_liability_type: { type: 'text', label: 'Tax Liability Type', required: false },
    },
    'accounts payable': {
      ...commonFields,
      vendor_creditor_details: { type: 'textarea', label: 'Vendor/Creditor Details', required: false },
      payment_terms: { type: 'text', label: 'Payment Terms', required: false },
      due_date: { type: 'date', label: 'Due Date', required: false },
      tax_liability_type: { type: 'text', label: 'Tax Liability Type', required: false },
    },
    'deferred revenue': {
      ...commonFields,
      tax_liability_type: { type: 'text', label: 'Tax Liability Type', required: false },
    },
    'short-term loans': {
      ...commonFields,
      principal_amount: { type: 'number', label: 'Principal Amount', required: false },
      interest_rate: { type: 'number', label: 'Interest Rate (%)', required: false },
      loan_start_date: { type: 'date', label: 'Loan Start Date', required: false },
      maturity_date: { type: 'date', label: 'Maturity Date', required: false },
      lender_details: { type: 'textarea', label: 'Lender Details', required: false },
    },
    'accrued expenses': {
      ...commonFields,
      tax_liability_type: { type: 'text', label: 'Tax Liability Type', required: false },
    },
    'sales tax payable': {
      ...commonFields,
      tax_liability_type: { type: 'text', label: 'Tax Liability Type', required: false },
    },

    // LIABILITIES - Non-Current Liabilities
    'non-current liabilities': {
      ...commonFields,
      principal_amount: { type: 'number', label: 'Principal Amount', required: false },
      interest_rate: { type: 'number', label: 'Interest Rate (%)', required: false },
      loan_start_date: { type: 'date', label: 'Loan Start Date', required: false },
      maturity_date: { type: 'date', label: 'Maturity Date', required: false },
      lender_details: { type: 'textarea', label: 'Lender Details', required: false },
      collateral: { type: 'text', label: 'Collateral (if any)', required: false },
    },
    'long-term loans': {
      ...commonFields,
      principal_amount: { type: 'number', label: 'Principal Amount', required: false },
      interest_rate: { type: 'number', label: 'Interest Rate (%)', required: false },
      loan_start_date: { type: 'date', label: 'Loan Start Date', required: false },
      maturity_date: { type: 'date', label: 'Maturity Date', required: false },
      lender_details: { type: 'textarea', label: 'Lender Details', required: false },
      collateral: { type: 'text', label: 'Collateral (if any)', required: false },
    },
    'deferred tax liability': {
      ...commonFields,
      tax_liability_type: { type: 'text', label: 'Tax Liability Type', required: false },
    },

    // EQUITY
    'equity': {
      ...commonFields,
      shareholder_name: { type: 'text', label: 'Shareholder Name (if applicable)', required: false },
      share_class: { type: 'text', label: 'Share Class', required: false },
      number_of_shares: { type: 'number', label: 'Number of Shares', required: false },
    },
    'share capital': {
      ...commonFields,
      shareholder_name: { type: 'text', label: 'Shareholder Name (if applicable)', required: false },
      share_class: { type: 'select', label: 'Share Class', required: false, options: [
        { value: 'common', label: 'Common Stock' },
        { value: 'preferred', label: 'Preferred Stock' },
      ]},
      number_of_shares: { type: 'number', label: 'Number of Shares', required: false },
    },
    'retained earnings': {
      ...commonFields,
    },
    'current year profit/loss': {
      ...commonFields,
    },
    'reserves and surplus': {
      ...commonFields,
    },
    'owners equity': {
      ...commonFields,
    },

    // REVENUE/INCOME
    'revenue': {
      ...commonFields,
      revenue_type: { type: 'select', label: 'Revenue Type', required: false, options: [
        { value: 'subscription', label: 'Subscription' },
        { value: 'professional_services', label: 'Professional Services' },
        { value: 'other', label: 'Other Income' },
      ]},
      tax_rate: { type: 'number', label: 'Tax Rate (applicable)', required: false },
      revenue_recognition_method: { type: 'select', label: 'Revenue Recognition Method', required: false, options: [
        { value: 'accrual', label: 'Accrual Basis' },
        { value: 'cash', label: 'Cash Basis' },
      ]},
      service_product_category: { type: 'text', label: 'Service/Product Category', required: false },
      default_currency: { type: 'text', label: 'Default Currency', required: false, defaultValue: 'INR' },
    },
    'subscription revenue': {
      ...commonFields,
      revenue_type: { type: 'select', label: 'Revenue Type', required: false, options: [
        { value: 'monthly_recurring', label: 'Monthly Recurring Revenue' },
        { value: 'annual_subscription', label: 'Annual Subscriptions' },
        { value: 'usage_based', label: 'Usage-based Revenue' },
      ]},
      tax_rate: { type: 'number', label: 'Tax Rate (applicable)', required: false },
      revenue_recognition_method: { type: 'select', label: 'Revenue Recognition Method', required: false, options: [
        { value: 'accrual', label: 'Accrual Basis' },
        { value: 'cash', label: 'Cash Basis' },
      ]},
      default_currency: { type: 'text', label: 'Default Currency', required: false, defaultValue: 'INR' },
    },
    'professional services revenue': {
      ...commonFields,
      revenue_type: { type: 'select', label: 'Revenue Type', required: false, options: [
        { value: 'implementation', label: 'Implementation Fees' },
        { value: 'consulting', label: 'Consulting Fees' },
        { value: 'training', label: 'Training Fees' },
      ]},
      tax_rate: { type: 'number', label: 'Tax Rate (applicable)', required: false },
      revenue_recognition_method: { type: 'select', label: 'Revenue Recognition Method', required: false, options: [
        { value: 'accrual', label: 'Accrual Basis' },
        { value: 'cash', label: 'Cash Basis' },
      ]},
      default_currency: { type: 'text', label: 'Default Currency', required: false, defaultValue: 'INR' },
    },
    'other income': {
      ...commonFields,
      revenue_type: { type: 'select', label: 'Revenue Type', required: false, options: [
        { value: 'interest', label: 'Interest Income' },
        { value: 'foreign_exchange', label: 'Foreign Exchange Gains' },
        { value: 'referral', label: 'Referral Income' },
      ]},
      tax_rate: { type: 'number', label: 'Tax Rate (applicable)', required: false },
      default_currency: { type: 'text', label: 'Default Currency', required: false, defaultValue: 'INR' },
    },

    // COST OF REVENUE (COGS)
    'cost of revenue': {
      ...commonFields,
      cost_type: { type: 'select', label: 'Cost Type', required: false, options: [
        { value: 'hosting', label: 'Hosting & Infrastructure' },
        { value: 'third_party_software', label: 'Third-party Software' },
        { value: 'customer_support', label: 'Customer Support' },
      ]},
      allocation_method: { type: 'text', label: 'Allocation Method', required: false },
      default_tax_treatment: { type: 'text', label: 'Default Tax Treatment', required: false },
    },
    'hosting & infrastructure costs': {
      ...commonFields,
      cost_type: { type: 'select', label: 'Cost Type', required: false, options: [
        { value: 'cloud_hosting', label: 'Cloud Hosting (AWS/Azure/GCP)' },
        { value: 'cdn', label: 'CDN Costs' },
        { value: 'server', label: 'Server Costs' },
      ]},
      allocation_method: { type: 'text', label: 'Allocation Method', required: false },
      default_tax_treatment: { type: 'text', label: 'Default Tax Treatment', required: false },
    },
    'third-party software costs': {
      ...commonFields,
      cost_type: { type: 'select', label: 'Cost Type', required: false, options: [
        { value: 'api', label: 'API Costs' },
        { value: 'licenses', label: 'Third-party Licenses' },
        { value: 'payment_gateway', label: 'Payment Gateway Fees' },
      ]},
      allocation_method: { type: 'text', label: 'Allocation Method', required: false },
      default_tax_treatment: { type: 'text', label: 'Default Tax Treatment', required: false },
    },
    'customer support costs': {
      ...commonFields,
      cost_type: { type: 'select', label: 'Cost Type', required: false, options: [
        { value: 'salaries', label: 'Support Staff Salaries' },
        { value: 'tools', label: 'Support Tools' },
      ]},
      allocation_method: { type: 'text', label: 'Allocation Method', required: false },
      default_tax_treatment: { type: 'text', label: 'Default Tax Treatment', required: false },
    },

    // OPERATING EXPENSES - Sales & Marketing
    'sales & marketing expenses': {
      ...commonFields,
      expense_category: { type: 'select', label: 'Expense Category', required: false, options: [
        { value: 'advertising', label: 'Advertising Expenses' },
        { value: 'sales_commissions', label: 'Sales Commissions' },
        { value: 'marketing_tools', label: 'Marketing Tools' },
        { value: 'events', label: 'Events & Conferences' },
        { value: 'salaries', label: 'Sales Team Salaries' },
      ]},
      department: { type: 'text', label: 'Department', required: false },
      tax_deductibility_status: { type: 'select', label: 'Tax Deductibility Status', required: false, options: [
        { value: 'deductible', label: 'Deductible' },
        { value: 'non_deductible', label: 'Non-Deductible' },
        { value: 'partial', label: 'Partial' },
      ]},
      approval_required: { type: 'select', label: 'Approval Required', required: false, options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ]},
    },

    // OPERATING EXPENSES - R&D
    'research & development expenses': {
      ...commonFields,
      project_code: { type: 'text', label: 'Project Code (if applicable)', required: false },
      capitalization_eligible: { type: 'select', label: 'Capitalization Eligible', required: false, options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ]},
      department: { type: 'text', label: 'Department', required: false },
    },

    // OPERATING EXPENSES - G&A
    'general & administrative expenses': {
      ...commonFields,
      expense_type: { type: 'select', label: 'Expense Type', required: false, options: [
        { value: 'salaries', label: 'Salaries & Wages' },
        { value: 'rent_utilities', label: 'Rent & Utilities' },
        { value: 'office_supplies', label: 'Office Supplies' },
        { value: 'professional_fees', label: 'Professional Fees' },
        { value: 'insurance', label: 'Insurance' },
        { value: 'bank_charges', label: 'Bank Charges' },
        { value: 'depreciation', label: 'Depreciation & Amortization' },
        { value: 'travel', label: 'Travel & Entertainment' },
        { value: 'recruitment', label: 'Recruitment Costs' },
        { value: 'employee_benefits', label: 'Employee Benefits' },
      ]},
      recurring_one_time: { type: 'select', label: 'Recurring/One-time', required: false, options: [
        { value: 'recurring', label: 'Recurring' },
        { value: 'one_time', label: 'One-time' },
      ]},
      department: { type: 'text', label: 'Department', required: false },
      vendor_details: { type: 'textarea', label: 'Vendor Details', required: false },
    },

    // OTHER INCOME & EXPENSES
    'other income & expenses': {
      ...commonFields,
      transaction_type: { type: 'select', label: 'Transaction Type', required: false, options: [
        { value: 'interest_income', label: 'Interest Income' },
        { value: 'interest_expense', label: 'Interest Expense' },
        { value: 'foreign_exchange_gain', label: 'Foreign Exchange Gains' },
        { value: 'foreign_exchange_loss', label: 'Foreign Exchange Losses' },
        { value: 'investment_income', label: 'Investment Income' },
        { value: 'investment_loss', label: 'Investment Losses' },
        { value: 'miscellaneous', label: 'Miscellaneous Income/Expenses' },
      ]},
      tax_treatment: { type: 'text', label: 'Tax Treatment', required: false },
    },

    // TAX ACCOUNTS
    'tax accounts': {
      ...commonFields,
      tax_type: { type: 'select', label: 'Tax Type', required: false, options: [
        { value: 'income_tax', label: 'Income Tax' },
        { value: 'deferred_tax', label: 'Deferred Tax' },
        { value: 'sales_tax', label: 'Sales Tax/GST/VAT' },
        { value: 'withholding_tax', label: 'Withholding Tax' },
      ]},
      tax_rate: { type: 'number', label: 'Tax Rate', required: false },
      tax_authority: { type: 'text', label: 'Tax Authority', required: false },
      filing_frequency: { type: 'select', label: 'Filing Frequency', required: false, options: [
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'annually', label: 'Annually' },
      ]},
    },
  };

  // Try to find exact match first
  if (fieldConfigs[groupNameLower]) {
    return fieldConfigs[groupNameLower];
  }

  // Try partial matches
  for (const [key, config] of Object.entries(fieldConfigs)) {
    if (groupNameLower.includes(key) || key.includes(groupNameLower)) {
      return config;
    }
  }

  // Return common fields based on nature if no specific match
  if (nature === 'asset') {
    return {
      ...commonFields,
      bank_account_details: { type: 'textarea', label: 'Bank Account Details (if applicable)', required: false },
      tax_classification: { type: 'text', label: 'Tax Classification', required: false },
    };
  } else if (nature === 'liability') {
    return {
      ...commonFields,
      vendor_creditor_details: { type: 'textarea', label: 'Vendor/Creditor Details', required: false },
      payment_terms: { type: 'text', label: 'Payment Terms', required: false },
      tax_liability_type: { type: 'text', label: 'Tax Liability Type', required: false },
    };
  } else if (nature === 'income') {
    return {
      ...commonFields,
      revenue_type: { type: 'text', label: 'Revenue Type', required: false },
      tax_rate: { type: 'number', label: 'Tax Rate (applicable)', required: false },
    };
  } else if (nature === 'expense') {
    return {
      ...commonFields,
      expense_category: { type: 'text', label: 'Expense Category', required: false },
      department: { type: 'text', label: 'Department', required: false },
    };
  }

  // Default to common fields
  return commonFields;
};



