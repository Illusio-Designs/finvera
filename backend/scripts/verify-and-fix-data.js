/**
 * Verify and Fix Existing Data
 * This script checks and fixes all data issues in the database
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Sequelize, Op } = require('sequelize');
const masterSequelize = require('../src/config/masterDatabase');
const masterModels = require('../src/models/masterModels');
const tenantConnectionManager = require('../src/config/tenantConnectionManager');

async function verifyAndFixData() {
  try {
    console.log('\n🔍 === VERIFYING AND FIXING DATA ===\n');

    // ========================================
    // STEP 1: Fix Master Database (Account Groups)
    // ========================================
    console.log('📋 STEP 1: Checking Account Groups in Master Database\n');
    
    const accountGroups = await masterModels.AccountGroup.findAll({
      order: [['group_code', 'ASC']]
    });
    
    console.log(`Total account groups: ${accountGroups.length}`);
    
    // Check for missing or incorrect data
    let fixedGroups = 0;
    
    for (const group of accountGroups) {
      let needsUpdate = false;
      const updates = {};
      
      // Check if affects_pl is null or incorrect
      if (group.affects_pl === null) {
        const plGroups = ['SAL', 'SALES', 'SAL_RET', 'SALES_RETURNS', 'PUR', 'PURCHASE', 'PUR_RET', 'PURCHASE_RETURNS', 'DIR_EXP', 'DIR_INC', 'IND_EXP', 'IND_INC'];
        updates.affects_pl = plGroups.includes(group.group_code);
        needsUpdate = true;
      }
      
      // Check if bs_category is null for balance sheet groups
      if (!group.affects_pl && !group.bs_category) {
        const categoryMap = {
          'BANK': 'current_asset',
          'CASH': 'current_asset',
          'CA': 'current_asset',
          'SD': 'current_asset',
          'INV': 'current_asset',
          'LA': 'current_asset',
          'FA': 'fixed_asset',
          'SC': 'current_liability',
          'CL': 'current_liability',
          'DT': 'tax_control',
          'LOAN': 'noncurrent_liability',
          'CAP': 'equity',
          'RES': 'equity'
        };
        if (categoryMap[group.group_code]) {
          updates.bs_category = categoryMap[group.group_code];
          needsUpdate = true;
        }
      }
      
      // Check if is_tax_group is null
      if (group.is_tax_group === null) {
        updates.is_tax_group = group.group_code === 'DT';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await group.update(updates);
        console.log(`✅ Fixed ${group.group_code}: ${group.name}`);
        fixedGroups++;
      }
    }
    
    console.log(`\n✅ Fixed ${fixedGroups} account groups\n`);
    
    // Show summary
    const plGroups = accountGroups.filter(g => g.affects_pl);
    const bsGroups = accountGroups.filter(g => !g.affects_pl);
    
    console.log(`📊 P&L Groups: ${plGroups.length}`);
    plGroups.forEach(g => console.log(`   - ${g.group_code}: ${g.name} (${g.nature})`));
    
    console.log(`\n🏛️  Balance Sheet Groups: ${bsGroups.length}`);
    const groupedByCategory = {};
    bsGroups.forEach(g => {
      const cat = g.bs_category || 'uncategorized';
      if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
      groupedByCategory[cat].push(g);
    });
    
    Object.keys(groupedByCategory).sort().forEach(cat => {
      console.log(`\n   ${cat}:`);
      groupedByCategory[cat].forEach(g => console.log(`     - ${g.group_code}: ${g.name}`));
    });

    // ========================================
    // STEP 2: Check Tenant Databases
    // ========================================
    console.log('\n\n📊 STEP 2: Checking Tenant Databases\n');
    
    const companies = await masterModels.Company.findAll({
      where: { is_active: true }
    });
    
    console.log(`Active companies: ${companies.length}\n`);
    
    for (const company of companies) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🏢 Company: ${company.company_name}`);
      console.log(`📊 Tenant ID: ${company.tenant_id}`);
      console.log(`🗄️  Database: ${company.db_name}`);
      console.log(`${'='.repeat(60)}\n`);
      
      try {
        // Connect to tenant database
        const tenantConnection = await tenantConnectionManager.getConnection({
          id: company.tenant_id,
          db_name: company.db_name,
          db_host: process.env.DB_HOST,
          db_port: process.env.DB_PORT,
          db_user: process.env.DB_USER,
          db_password: process.env.DB_PASSWORD
        });
        
        const tenantModels = require('../src/services/tenantModels')(tenantConnection);
        
        // Check Ledgers
        console.log('📒 Checking Ledgers...');
        const ledgers = await tenantModels.Ledger.findAll({
          where: { is_active: true }
        });
        console.log(`   Total active ledgers: ${ledgers.length}`);
        
        // Group by account group
        const ledgersByGroup = {};
        for (const ledger of ledgers) {
          const group = accountGroups.find(g => g.id === ledger.account_group_id);
          if (group) {
            if (!ledgersByGroup[group.group_code]) {
              ledgersByGroup[group.group_code] = [];
            }
            ledgersByGroup[group.group_code].push(ledger);
          } else {
            console.log(`   ⚠️  Ledger "${ledger.ledger_name}" has invalid account_group_id: ${ledger.account_group_id}`);
          }
        }
        
        console.log(`   Ledgers by group:`);
        Object.keys(ledgersByGroup).sort().forEach(code => {
          console.log(`     ${code}: ${ledgersByGroup[code].length} ledgers`);
        });
        
        // Check Vouchers
        console.log('\n📝 Checking Vouchers...');
        const voucherCounts = await tenantModels.Voucher.findAll({
          attributes: [
            'status',
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
          ],
          group: ['status'],
          raw: true
        });
        
        voucherCounts.forEach(v => {
          console.log(`   ${v.status}: ${v.count} vouchers`);
        });
        
        const postedVouchers = await tenantModels.Voucher.findAll({
          where: { status: 'posted' },
          order: [['voucher_date', 'ASC']]
        });
        
        if (postedVouchers.length > 0) {
          console.log(`\n   Posted vouchers:`);
          postedVouchers.forEach(v => {
            console.log(`     - ${v.voucher_number} (${v.voucher_type}) on ${v.voucher_date.toISOString().slice(0, 10)}`);
          });
        }
        
        // Check Voucher Ledger Entries
        console.log('\n💰 Checking Voucher Ledger Entries...');
        const totalEntries = await tenantModels.VoucherLedgerEntry.count();
        console.log(`   Total entries: ${totalEntries}`);
        
        if (postedVouchers.length > 0) {
          const voucherIds = postedVouchers.map(v => v.id);
          
          const entriesByLedger = await tenantModels.VoucherLedgerEntry.findAll({
            attributes: [
              'ledger_id',
              [Sequelize.fn('SUM', Sequelize.col('debit_amount')), 'total_debit'],
              [Sequelize.fn('SUM', Sequelize.col('credit_amount')), 'total_credit'],
            ],
            where: {
              voucher_id: { [Op.in]: voucherIds }
            },
            group: ['ledger_id'],
            raw: true,
          });
          
          console.log(`   Ledgers with movements: ${entriesByLedger.length}`);
          
          // Show P&L affecting ledgers
          console.log('\n   📊 P&L Affecting Ledgers:');
          let foundPlLedgers = false;
          
          for (const entry of entriesByLedger) {
            const ledger = ledgers.find(l => l.id === entry.ledger_id);
            if (ledger) {
              const group = accountGroups.find(g => g.id === ledger.account_group_id);
              if (group && group.affects_pl) {
                const dr = parseFloat(entry.total_debit) || 0;
                const cr = parseFloat(entry.total_credit) || 0;
                console.log(`     ${ledger.ledger_name} (${group.group_code}): Dr ₹${dr.toFixed(2)}, Cr ₹${cr.toFixed(2)}`);
                foundPlLedgers = true;
              }
            }
          }
          
          if (!foundPlLedgers) {
            console.log(`     ⚠️  No P&L affecting ledgers found with movements!`);
          }
        }
        
        // Check Inventory
        console.log('\n📦 Checking Inventory...');
        const inventoryItems = await tenantModels.InventoryItem.findAll({
          where: { is_active: true }
        });
        console.log(`   Active inventory items: ${inventoryItems.length}`);
        
        if (inventoryItems.length > 0) {
          inventoryItems.forEach(item => {
            const qty = parseFloat(item.quantity_on_hand) || 0;
            const cost = parseFloat(item.avg_cost) || 0;
            const value = qty * cost;
            console.log(`     ${item.item_name}: Qty ${qty} @ ₹${cost.toFixed(2)} = ₹${value.toFixed(2)}`);
          });
        }
        
        // Check for data integrity issues
        console.log('\n🔍 Checking Data Integrity...');
        
        // Check for orphaned ledger entries
        const allEntries = await tenantModels.VoucherLedgerEntry.findAll({
          attributes: ['voucher_id'],
          group: ['voucher_id'],
          raw: true
        });
        
        const allVouchers = await tenantModels.Voucher.findAll({
          attributes: ['id'],
          raw: true
        });
        
        const voucherIdSet = new Set(allVouchers.map(v => v.id));
        const orphanedEntries = allEntries.filter(e => !voucherIdSet.has(e.voucher_id));
        
        if (orphanedEntries.length > 0) {
          console.log(`   ⚠️  Found ${orphanedEntries.length} orphaned voucher entries (entries without vouchers)`);
        } else {
          console.log(`   ✅ No orphaned voucher entries`);
        }
        
        // Check for ledgers with invalid account groups
        const invalidLedgers = ledgers.filter(l => {
          return !accountGroups.find(g => g.id === l.account_group_id);
        });
        
        if (invalidLedgers.length > 0) {
          console.log(`   ⚠️  Found ${invalidLedgers.length} ledgers with invalid account groups`);
          invalidLedgers.forEach(l => {
            console.log(`       - ${l.ledger_name}: ${l.account_group_id}`);
          });
        } else {
          console.log(`   ✅ All ledgers have valid account groups`);
        }
        
        await tenantConnectionManager.closeConnection(company.tenant_id);
        
      } catch (error) {
        console.error(`   ❌ Error checking tenant database: ${error.message}`);
      }
    }
    
    console.log('\n\n✅ Data verification and fixes completed!\n');
    
    await masterSequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyAndFixData();
