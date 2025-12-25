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
    { group_code: 'CA', name: 'Current Assets', parent_id: null, nature: 'asset', is_system: true },
    { group_code: 'CASH', name: 'Cash-in-Hand', parent_id: null, nature: 'asset', is_system: true },
    { group_code: 'BANK', name: 'Bank Accounts', parent_id: null, nature: 'asset', is_system: true },
    { group_code: 'SD', name: 'Sundry Debtors', parent_id: null, nature: 'asset', is_system: true },
    { group_code: 'FA', name: 'Fixed Assets', parent_id: null, nature: 'asset', is_system: true },
    { group_code: 'INV', name: 'Stock-in-Hand', parent_id: null, nature: 'asset', is_system: true },
    { group_code: 'LA', name: 'Loans & Advances (Asset)', parent_id: null, nature: 'asset', is_system: true },
    
    // Liabilities
    { group_code: 'CL', name: 'Current Liabilities', parent_id: null, nature: 'liability', is_system: true },
    { group_code: 'SC', name: 'Sundry Creditors', parent_id: null, nature: 'liability', is_system: true },
    { group_code: 'DT', name: 'Duties & Taxes', parent_id: null, nature: 'liability', is_system: true },
    { group_code: 'CAP', name: 'Capital Account', parent_id: null, nature: 'liability', is_system: true },
    { group_code: 'RES', name: 'Reserves & Surplus', parent_id: null, nature: 'liability', is_system: true },
    { group_code: 'LOAN', name: 'Loans (Liability)', parent_id: null, nature: 'liability', is_system: true },
    
    // Income
    { group_code: 'SAL', name: 'Sales Accounts', parent_id: null, nature: 'income', affects_gross_profit: true, is_system: true },
    { group_code: 'DIR_INC', name: 'Direct Income', parent_id: null, nature: 'income', affects_gross_profit: true, is_system: true },
    { group_code: 'IND_INC', name: 'Indirect Income', parent_id: null, nature: 'income', affects_gross_profit: false, is_system: true },
    
    // Expenses
    { group_code: 'PUR', name: 'Purchase Accounts', parent_id: null, nature: 'expense', affects_gross_profit: true, is_system: true },
    { group_code: 'DIR_EXP', name: 'Direct Expenses', parent_id: null, nature: 'expense', affects_gross_profit: true, is_system: true },
    { group_code: 'IND_EXP', name: 'Indirect Expenses', parent_id: null, nature: 'expense', affects_gross_profit: false, is_system: true },
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
 * Seed default GST rates
 */
async function seedGSTRates() {
  const gstRates = [
    { rate_name: 'GST 0%', cgst_rate: 0, sgst_rate: 0, igst_rate: 0, is_active: true },
    { rate_name: 'GST 0.25%', cgst_rate: 0.125, sgst_rate: 0.125, igst_rate: 0.25, is_active: true },
    { rate_name: 'GST 3%', cgst_rate: 1.5, sgst_rate: 1.5, igst_rate: 3, is_active: true },
    { rate_name: 'GST 5%', cgst_rate: 2.5, sgst_rate: 2.5, igst_rate: 5, is_active: true },
    { rate_name: 'GST 12%', cgst_rate: 6, sgst_rate: 6, igst_rate: 12, is_active: true },
    { rate_name: 'GST 18%', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, is_active: true },
    { rate_name: 'GST 28%', cgst_rate: 14, sgst_rate: 14, igst_rate: 28, is_active: true },
  ];

  await masterModels.GSTRate.bulkCreate(gstRates, { ignoreDuplicates: true });
  console.log(`✓ Seeded ${gstRates.length} GST rates`);
}

/**
 * Seed default TDS sections
 */
async function seedTDSSections() {
  const tdsSections = [
    { section_code: '194C', section_name: 'Payment to contractors', default_rate: 1.00, is_active: true },
    { section_code: '194J', section_name: 'Professional or technical services', default_rate: 10.00, is_active: true },
    { section_code: '194I', section_name: 'Rent', default_rate: 10.00, is_active: true },
    { section_code: '194H', section_name: 'Commission or brokerage', default_rate: 5.00, is_active: true },
    { section_code: '194A', section_name: 'Interest other than on securities', default_rate: 10.00, is_active: true },
    { section_code: '194D', section_name: 'Insurance commission', default_rate: 5.00, is_active: true },
    { section_code: '192', section_name: 'Salary', default_rate: 0.00, is_active: true },
  ];

  await masterModels.TDSSection.bulkCreate(tdsSections, { ignoreDuplicates: true });
  console.log(`✓ Seeded ${tdsSections.length} TDS sections`);
}

/**
 * Seed starter HSN/SAC master entries
 * Uses comprehensive seeder with commonly used codes
 * For complete official data, use: node src/scripts/importHSNData.js <csv-file>
 */
async function seedHSNSACMaster() {
  const { seedComprehensiveHSNSAC } = require('./hsnMasterData');
  await seedComprehensiveHSNSAC();
}

module.exports = {
  seedAccountGroups,
  seedVoucherTypes,
  seedGSTRates,
  seedTDSSections,
  seedHSNSACMaster,
};
