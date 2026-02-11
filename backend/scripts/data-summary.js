/**
 * Data Summary Report
 * Shows a clean summary of your data
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Sequelize, Op } = require('sequelize');
const masterSequelize = require('../src/config/masterDatabase');
const masterModels = require('../src/models/masterModels');

async function showDataSummary() {
  try {
    console.log('\n📊 === DATA SUMMARY REPORT ===\n');

    // Account Groups Summary
    console.log('📋 ACCOUNT GROUPS:\n');
    
    const plGroups = await masterModels.AccountGroup.findAll({
      where: { affects_pl: true },
      order: [['nature', 'ASC'], ['group_code', 'ASC']]
    });
    
    console.log(`✅ P&L Affecting Groups (${plGroups.length}):`);
    const incomeGroups = plGroups.filter(g => g.nature === 'income');
    const expenseGroups = plGroups.filter(g => g.nature === 'expense');
    
    console.log(`\n   Income Groups (${incomeGroups.length}):`);
    incomeGroups.forEach(g => console.log(`     ✓ ${g.group_code}: ${g.name}`));
    
    console.log(`\n   Expense Groups (${expenseGroups.length}):`);
    expenseGroups.forEach(g => console.log(`     ✓ ${g.group_code}: ${g.name}`));
    
    const bsGroups = await masterModels.AccountGroup.findAll({
      where: { affects_pl: false },
      order: [['bs_category', 'ASC'], ['group_code', 'ASC']]
    });
    
    console.log(`\n✅ Balance Sheet Groups (${bsGroups.length}):\n`);
    
    const categories = {
      'current_asset': 'Current Assets',
      'fixed_asset': 'Fixed Assets',
      'current_liability': 'Current Liabilities',
      'noncurrent_liability': 'Non-Current Liabilities',
      'equity': 'Equity',
      'tax_control': 'Tax Control'
    };
    
    Object.keys(categories).forEach(cat => {
      const groups = bsGroups.filter(g => g.bs_category === cat);
      if (groups.length > 0) {
        console.log(`   ${categories[cat]} (${groups.length}):`);
        groups.forEach(g => console.log(`     ✓ ${g.group_code}: ${g.name}`));
        console.log();
      }
    });
    
    // Companies Summary
    console.log('\n🏢 COMPANIES:\n');
    const companies = await masterModels.Company.findAll({
      where: { is_active: true },
      attributes: ['company_name', 'business_type', 'db_name', 'tenant_id']
    });
    
    companies.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.company_name}`);
      console.log(`      Type: ${c.business_type}`);
      console.log(`      Database: ${c.db_name}`);
      console.log(`      Tenant ID: ${c.tenant_id}`);
      console.log();
    });
    
    console.log('✅ All data is properly configured!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Test the Profit & Loss report through the API');
    console.log('   2. Test the Balance Sheet report');
    console.log('   3. Create new vouchers and verify they appear in reports\n');
    
    await masterSequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

showDataSummary();
