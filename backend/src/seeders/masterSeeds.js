/**
 * Master Database Seeds
 * Default data shared across ALL tenants
 */

const masterModels = require('../models/masterModels');

/**
 * Seed default account groups (Chart of Accounts)
 */
async function seedAccountGroups() {
  const groups = [
    // Assets
    { group_code: 'CA', name: 'Current Assets', parent_id: null, nature: 'asset', bs_category: 'current_asset', affects_pl: false, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'CASH', name: 'Cash-in-Hand', parent_id: null, nature: 'asset', bs_category: 'current_asset', affects_pl: false, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'BANK', name: 'Bank Accounts', parent_id: null, nature: 'asset', bs_category: 'current_asset', affects_pl: false, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'SD', name: 'Sundry Debtors', parent_id: null, nature: 'asset', bs_category: 'current_asset', affects_pl: false, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'FA', name: 'Fixed Assets', parent_id: null, nature: 'asset', bs_category: 'fixed_asset', affects_pl: false, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'INV', name: 'Stock-in-Hand', parent_id: null, nature: 'asset', bs_category: 'current_asset', affects_pl: false, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'LA', name: 'Loans & Advances (Asset)', parent_id: null, nature: 'asset', bs_category: 'current_asset', affects_pl: false, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
    
    // Liabilities
    { group_code: 'CL', name: 'Current Liabilities', parent_id: null, nature: 'liability', bs_category: 'current_liability', affects_pl: false, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'SC', name: 'Sundry Creditors', parent_id: null, nature: 'liability', bs_category: 'current_liability', affects_pl: false, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'DT', name: 'Duties & Taxes', parent_id: null, nature: 'liability', bs_category: 'tax_control', affects_pl: false, affects_gross_profit: false, is_tax_group: true, ptoprt: false, is_system: true },
    { group_code: 'CAP', name: 'Capital Account', parent_id: null, nature: 'equity', bs_category: 'equity', affects_pl: false, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'RES', name: 'Reserves & Surplus', parent_id: null, nature: 'equity', bs_category: 'equity', affects_pl: false, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'LOAN', name: 'Loans (Liability)', parent_id: null, nature: 'liability', bs_category: 'noncurrent_liability', affects_pl: false, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
    
    // Income
    { group_code: 'SAL', name: 'Sales Accounts', parent_id: null, nature: 'income', bs_category: null, affects_pl: true, affects_gross_profit: true, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'DIR_INC', name: 'Direct Income', parent_id: null, nature: 'income', bs_category: null, affects_pl: true, affects_gross_profit: true, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'IND_INC', name: 'Indirect Income', parent_id: null, nature: 'income', bs_category: null, affects_pl: true, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
    
    // Expenses
    { group_code: 'PUR', name: 'Purchase Accounts', parent_id: null, nature: 'expense', bs_category: null, affects_pl: true, affects_gross_profit: true, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'DIR_EXP', name: 'Direct Expenses', parent_id: null, nature: 'expense', bs_category: null, affects_pl: true, affects_gross_profit: true, is_tax_group: false, ptoprt: true, is_system: true },
    { group_code: 'IND_EXP', name: 'Indirect Expenses', parent_id: null, nature: 'expense', bs_category: null, affects_pl: true, affects_gross_profit: false, is_tax_group: false, ptoprt: true, is_system: true },
  ];

  await masterModels.AccountGroup.bulkCreate(groups, { ignoreDuplicates: true });
  console.log(`✓ Seeded ${groups.length} account groups`);
}

/**
 * Seed default voucher types
 */
async function seedVoucherTypes() {
  const voucherTypes = [
    { name: 'Sales', type_category: 'sales', numbering_prefix: 'INV', is_system: true, description: 'Sales invoice' },
    { name: 'Purchase', type_category: 'purchase', numbering_prefix: 'PUR', is_system: true, description: 'Purchase invoice' },
    { name: 'Payment', type_category: 'payment', numbering_prefix: 'PAY', is_system: true, description: 'Payment voucher' },
    { name: 'Receipt', type_category: 'receipt', numbering_prefix: 'REC', is_system: true, description: 'Receipt voucher' },
    { name: 'Journal', type_category: 'journal', numbering_prefix: 'JV', is_system: true, description: 'Journal voucher' },
    { name: 'Contra', type_category: 'contra', numbering_prefix: 'CNT', is_system: true, description: 'Contra voucher' },
    { name: 'Debit Note', type_category: 'debit_note', numbering_prefix: 'DN', is_system: true, description: 'Debit note' },
    { name: 'Credit Note', type_category: 'credit_note', numbering_prefix: 'CN', is_system: true, description: 'Credit note' },
  ];

  await masterModels.VoucherType.bulkCreate(voucherTypes, { ignoreDuplicates: true });
  console.log(`✓ Seeded ${voucherTypes.length} voucher types`);
}

/**
 * GST rates, TDS sections, and HSN/SAC master data removed - now using Sandbox API for live data
 * These functions are deprecated and no longer used
 */

/**
 * GST rates, TDS sections, and HSN/SAC master data removed - now using Sandbox API for live data
 * These functions are deprecated and no longer used
 */

module.exports = {
  seedAccountGroups,
  seedVoucherTypes,
  // seedGSTRates, // Removed - using Sandbox API
  // seedTDSSections, // Removed - using Sandbox API
  // seedHSNSACMaster, // Removed - using Sandbox API
};
