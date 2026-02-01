const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Tenant database configuration
const tenantSequelize = new Sequelize(
  'finvera_illusio_designs',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

// Master database configuration
const masterSequelize = new Sequelize(
  'finvera_master',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

async function checkLedgerPostings() {
  try {
    console.log('🔍 CHECKING LEDGER POSTINGS AND BALANCES');
    console.log('=' .repeat(60));
    
    await tenantSequelize.authenticate();
    await masterSequelize.authenticate();
    console.log('✅ Database connections established (tenant + master)\n');
    
    const voucherNumber = 'PI260201922502';
    const voucherId = '11feef2d-b92c-4f7c-ad43-8de9132a1547';
    
    // Step 1: Get voucher details
    console.log('1️⃣ VOUCHER SUMMARY');
    console.log('-'.repeat(40));
    
    const [voucherDetails] = await tenantSequelize.query(`
      SELECT v.*, l.ledger_name as party_name
      FROM vouchers v
      LEFT JOIN ledgers l ON v.party_ledger_id = l.id
      WHERE v.voucher_number = '${voucherNumber}'
    `);
    
    if (voucherDetails.length === 0) {
      console.log('❌ Voucher not found');
      return;
    }
    
    const voucher = voucherDetails[0];
    console.log(`Voucher: ${voucher.voucher_number}`);
    console.log(`Date: ${voucher.voucher_date?.toISOString().split('T')[0]}`);
    console.log(`Party: ${voucher.party_name}`);
    console.log(`Total: ₹${parseFloat(voucher.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`Status: ${voucher.status}`);
    
    // Step 2: Get all account groups from master database
    console.log('\n2️⃣ LOADING ACCOUNT GROUPS FROM MASTER DATABASE');
    console.log('-'.repeat(40));
    
    const [allAccountGroups] = await masterSequelize.query(`
      SELECT id, name, group_code FROM account_groups ORDER BY name
    `);
    
    const accountGroups = {};
    allAccountGroups.forEach(group => {
      accountGroups[group.id] = {
        name: group.name,
        code: group.group_code
      };
    });
    
    console.log(`✅ Loaded ${allAccountGroups.length} account groups from master database`);
    
    // Step 3: Check all ledger entries for this voucher
    console.log('\n3️⃣ VOUCHER LEDGER ENTRIES');
    console.log('-'.repeat(40));
    
    const [ledgerEntries] = await tenantSequelize.query(`
      SELECT vle.*, l.ledger_name, l.ledger_code, l.account_group_id
      FROM voucher_ledger_entries vle
      JOIN ledgers l ON vle.ledger_id = l.id
      WHERE vle.voucher_id = '${voucherId}'
      ORDER BY vle.debit_amount DESC, vle.credit_amount DESC
    `);
    
    if (ledgerEntries.length === 0) {
      console.log('❌ No ledger entries found for this voucher');
      return;
    }
    
    console.log(`Found ${ledgerEntries.length} ledger entries:`);
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    ledgerEntries.forEach((entry, index) => {
      const debit = parseFloat(entry.debit_amount || 0);
      const credit = parseFloat(entry.credit_amount || 0);
      const accountGroup = accountGroups[entry.account_group_id];
      
      totalDebit += debit;
      totalCredit += credit;
      
      console.log(`\n  Entry ${index + 1}:`);
      console.log(`    Ledger: ${entry.ledger_name}`);
      console.log(`    Code: ${entry.ledger_code || 'N/A'}`);
      console.log(`    Group: ${accountGroup ? `${accountGroup.name} (${accountGroup.code})` : 'N/A'}`);
      console.log(`    Debit: ₹${debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      console.log(`    Credit: ₹${credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      console.log(`    Narration: ${entry.narration}`);
    });
    
    console.log(`\n  Summary:`);
    console.log(`    Total Debit: ₹${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`    Total Credit: ₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`    Difference: ₹${Math.abs(totalDebit - totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    console.log(`    Balanced: ${Math.abs(totalDebit - totalCredit) < 0.01 ? '✅ Yes' : '❌ No'}`);
    
    // Step 4: Check GST ledgers specifically
    console.log('\n4️⃣ GST LEDGERS ANALYSIS');
    console.log('-'.repeat(40));
    
    const [gstLedgers] = await tenantSequelize.query(`
      SELECT 
        l.id,
        l.ledger_name,
        l.ledger_code,
        l.current_balance,
        l.account_group_id,
        COALESCE(SUM(vle.debit_amount), 0) as total_debits,
        COALESCE(SUM(vle.credit_amount), 0) as total_credits,
        COUNT(vle.id) as entry_count
      FROM ledgers l
      LEFT JOIN voucher_ledger_entries vle ON l.id = vle.ledger_id
      WHERE l.ledger_name LIKE '%GST%' 
         OR l.ledger_name LIKE '%CGST%' 
         OR l.ledger_name LIKE '%SGST%' 
         OR l.ledger_name LIKE '%IGST%'
         OR l.ledger_code LIKE '%GST%'
      GROUP BY l.id, l.ledger_name, l.ledger_code, l.current_balance, l.account_group_id
      ORDER BY l.ledger_name
    `);
    
    if (gstLedgers.length === 0) {
      console.log('❌ No GST ledgers found in the system');
    } else {
      console.log(`Found ${gstLedgers.length} GST-related ledgers:`);
      
      gstLedgers.forEach((ledger, index) => {
        const currentBalance = parseFloat(ledger.current_balance || 0);
        const totalDebits = parseFloat(ledger.total_debits || 0);
        const totalCredits = parseFloat(ledger.total_credits || 0);
        const entryCount = parseInt(ledger.entry_count || 0);
        const accountGroup = accountGroups[ledger.account_group_id];
        
        console.log(`\n  GST Ledger ${index + 1}: ${ledger.ledger_name}`);
        console.log(`    Code: ${ledger.ledger_code || 'N/A'}`);
        console.log(`    Group: ${accountGroup ? `${accountGroup.name} (${accountGroup.code})` : 'N/A'}`);
        console.log(`    Current Balance: ₹${currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
        console.log(`    Total Debits: ₹${totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
        console.log(`    Total Credits: ₹${totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
        console.log(`    Entry Count: ${entryCount}`);
        
        if (entryCount === 0) {
          console.log(`    Status: ⚠️  No transactions recorded`);
        } else {
          console.log(`    Status: ✅ Active with transactions`);
        }
      });
    }
    
    // Step 5: Check inventory ledgers
    console.log('\n5️⃣ INVENTORY LEDGERS ANALYSIS');
    console.log('-'.repeat(40));
    
    const [inventoryLedgers] = await tenantSequelize.query(`
      SELECT 
        l.id,
        l.ledger_name,
        l.ledger_code,
        l.current_balance,
        l.account_group_id,
        COALESCE(SUM(vle.debit_amount), 0) as total_debits,
        COALESCE(SUM(vle.credit_amount), 0) as total_credits,
        COUNT(vle.id) as entry_count
      FROM ledgers l
      LEFT JOIN voucher_ledger_entries vle ON l.id = vle.ledger_id
      WHERE l.ledger_name LIKE '%Stock%' 
         OR l.ledger_name LIKE '%Inventory%' 
         OR l.ledger_code LIKE '%INV%'
         OR l.ledger_code = 'INVENTORY'
      GROUP BY l.id, l.ledger_name, l.ledger_code, l.current_balance, l.account_group_id
      ORDER BY l.ledger_name
    `);
    
    if (inventoryLedgers.length === 0) {
      console.log('❌ No inventory ledgers found in the system');
      console.log('   This might explain why inventory ledger entries are missing');
    } else {
      console.log(`Found ${inventoryLedgers.length} inventory-related ledgers:`);
      
      inventoryLedgers.forEach((ledger, index) => {
        const currentBalance = parseFloat(ledger.current_balance || 0);
        const totalDebits = parseFloat(ledger.total_debits || 0);
        const totalCredits = parseFloat(ledger.total_credits || 0);
        const entryCount = parseInt(ledger.entry_count || 0);
        const accountGroup = accountGroups[ledger.account_group_id];
        
        console.log(`\n  Inventory Ledger ${index + 1}: ${ledger.ledger_name}`);
        console.log(`    Code: ${ledger.ledger_code || 'N/A'}`);
        console.log(`    Group: ${accountGroup ? `${accountGroup.name} (${accountGroup.code})` : 'N/A'}`);
        console.log(`    Current Balance: ₹${currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
        console.log(`    Total Debits: ₹${totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
        console.log(`    Total Credits: ₹${totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
        console.log(`    Entry Count: ${entryCount}`);
      });
    }
    
    // Step 6: Check what account groups are being used
    console.log('\n6️⃣ ACCOUNT GROUPS USAGE ANALYSIS');
    console.log('-'.repeat(40));
    
    const [usedGroups] = await tenantSequelize.query(`
      SELECT 
        l.account_group_id,
        COUNT(*) as ledger_count,
        COALESCE(SUM(vle.debit_amount), 0) as total_debits,
        COALESCE(SUM(vle.credit_amount), 0) as total_credits,
        COUNT(vle.id) as entry_count
      FROM ledgers l
      LEFT JOIN voucher_ledger_entries vle ON l.id = vle.ledger_id
      WHERE l.account_group_id IS NOT NULL
      GROUP BY l.account_group_id
      HAVING ledger_count > 0
      ORDER BY entry_count DESC
    `);
    
    console.log(`Account groups in use:`);
    
    usedGroups.forEach((usage, index) => {
      const accountGroup = accountGroups[usage.account_group_id];
      const totalDebits = parseFloat(usage.total_debits || 0);
      const totalCredits = parseFloat(usage.total_credits || 0);
      const ledgerCount = parseInt(usage.ledger_count || 0);
      const entryCount = parseInt(usage.entry_count || 0);
      
      console.log(`\n  Group ${index + 1}: ${accountGroup ? accountGroup.name : 'Unknown'}`);
      console.log(`    Code: ${accountGroup ? accountGroup.code : 'N/A'}`);
      console.log(`    Ledgers: ${ledgerCount}`);
      console.log(`    Entries: ${entryCount}`);
      console.log(`    Total Debits: ₹${totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      console.log(`    Total Credits: ₹${totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    });
    
    // Step 7: Overall assessment
    console.log('\n7️⃣ LEDGER POSTING ASSESSMENT');
    console.log('-'.repeat(40));
    
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    const hasGSTEntries = ledgerEntries.some(entry => 
      entry.ledger_name.toLowerCase().includes('gst') ||
      entry.ledger_name.toLowerCase().includes('cgst') ||
      entry.ledger_name.toLowerCase().includes('sgst') ||
      entry.ledger_name.toLowerCase().includes('igst')
    );
    
    console.log(`Double Entry Balanced: ${isBalanced ? '✅ Yes' : '❌ No'}`);
    console.log(`GST Entries Present: ${hasGSTEntries ? '✅ Yes' : '❌ No'}`);
    console.log(`Total Ledger Entries: ${ledgerEntries.length}`);
    console.log(`GST Ledgers in System: ${gstLedgers.length}`);
    console.log(`Inventory Ledgers in System: ${inventoryLedgers.length}`);
    console.log(`Account Groups Available: ${allAccountGroups.length}`);
    console.log(`Account Groups in Use: ${usedGroups.length}`);
    
    if (!isBalanced) {
      const difference = Math.abs(totalDebit - totalCredit);
      console.log('\n⚠️  ISSUE: Ledger entries are not balanced');
      console.log(`   Difference: ₹${difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      console.log('   This indicates missing ledger entries for proper double-entry bookkeeping');
    }
    
    if (!hasGSTEntries && gstLedgers.length > 0) {
      console.log('\n⚠️  ISSUE: No GST entries found for this voucher');
      console.log('   GST ledgers exist but were not used in this transaction');
    }
    
    if (inventoryLedgers.length === 0) {
      console.log('\n⚠️  ISSUE: No inventory ledgers found');
      console.log('   Inventory transactions should post to inventory ledgers');
    }
    
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(40));
    
    if (!isBalanced) {
      const difference = Math.abs(totalDebit - totalCredit);
      console.log(`• Add missing ledger entry for ₹${difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      console.log('• Check voucher service for complete ledger entry creation');
    }
    
    if (inventoryLedgers.length === 0) {
      console.log('• Create inventory ledgers (Stock-in-Hand, Inventory, etc.)');
      console.log('• Update voucher service to post to inventory ledgers');
    }
    
    if (isBalanced && hasGSTEntries) {
      console.log('✅ Ledger postings appear to be working correctly');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await tenantSequelize.close();
    await masterSequelize.close();
  }
}

// Run the check
if (require.main === module) {
  checkLedgerPostings();
}

module.exports = { checkLedgerPostings };