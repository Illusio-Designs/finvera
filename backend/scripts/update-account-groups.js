/**
 * Update Account Groups with Proper Metadata
 * This script updates existing account groups with correct flags and categories
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const masterSequelize = require('../src/config/masterDatabase');
const masterModels = require('../src/models/masterModels');

async function updateAccountGroups() {
  try {
    console.log('\n🔧 === UPDATING ACCOUNT GROUPS ===\n');

    // Define complete account group metadata
    const groupMetadata = {
      // ASSETS
      'CA': {
        name: 'Current Assets',
        nature: 'asset',
        bs_category: 'current_asset',
        affects_pl: false,
        is_tax_group: false,
        description: 'Assets that can be converted to cash within one year'
      },
      'CASH': {
        name: 'Cash-in-Hand',
        nature: 'asset',
        bs_category: 'current_asset',
        affects_pl: false,
        is_tax_group: false,
        description: 'Physical cash available'
      },
      'BANK': {
        name: 'Bank Accounts',
        nature: 'asset',
        bs_category: 'current_asset',
        affects_pl: false,
        is_tax_group: false,
        description: 'Bank account balances'
      },
      'SD': {
        name: 'Sundry Debtors',
        nature: 'asset',
        bs_category: 'current_asset',
        affects_pl: false,
        is_tax_group: false,
        description: 'Accounts receivable from customers'
      },
      'INV': {
        name: 'Stock-in-Hand',
        nature: 'asset',
        bs_category: 'current_asset',
        affects_pl: false,
        is_tax_group: false,
        description: 'Inventory and stock'
      },
      'LA': {
        name: 'Loans & Advances (Asset)',
        nature: 'asset',
        bs_category: 'current_asset',
        affects_pl: false,
        is_tax_group: false,
        description: 'Loans given and advances paid'
      },
      'FA': {
        name: 'Fixed Assets',
        nature: 'asset',
        bs_category: 'fixed_asset',
        affects_pl: false,
        is_tax_group: false,
        description: 'Long-term tangible assets'
      },

      // LIABILITIES
      'CL': {
        name: 'Current Liabilities',
        nature: 'liability',
        bs_category: 'current_liability',
        affects_pl: false,
        is_tax_group: false,
        description: 'Obligations due within one year'
      },
      'SC': {
        name: 'Sundry Creditors',
        nature: 'liability',
        bs_category: 'current_liability',
        affects_pl: false,
        is_tax_group: false,
        description: 'Accounts payable to suppliers'
      },
      'DT': {
        name: 'Duties & Taxes',
        nature: 'liability',
        bs_category: 'tax_control',
        affects_pl: false,
        is_tax_group: true,
        description: 'GST, TDS, and other tax liabilities'
      },
      'LOAN': {
        name: 'Loans (Liability)',
        nature: 'liability',
        bs_category: 'noncurrent_liability',
        affects_pl: false,
        is_tax_group: false,
        description: 'Loans and borrowings'
      },

      // EQUITY
      'CAP': {
        name: 'Capital Account',
        nature: 'equity',
        bs_category: 'equity',
        affects_pl: false,
        is_tax_group: false,
        description: 'Owner\'s capital and equity'
      },
      'RES': {
        name: 'Reserves & Surplus',
        nature: 'equity',
        bs_category: 'equity',
        affects_pl: false,
        is_tax_group: false,
        description: 'Retained earnings and reserves'
      },

      // INCOME (P&L)
      'SAL': {
        name: 'Sales Accounts',
        nature: 'income',
        bs_category: null,
        affects_pl: true,
        is_tax_group: false,
        description: 'Revenue from sales'
      },
      'SALES': {
        name: 'Sales Accounts',
        nature: 'income',
        bs_category: null,
        affects_pl: true,
        is_tax_group: false,
        description: 'Revenue from sales'
      },
      'SAL_RET': {
        name: 'Sales Returns',
        nature: 'income',
        bs_category: null,
        affects_pl: true,
        is_tax_group: false,
        description: 'Returns and allowances on sales'
      },
      'SALES_RETURNS': {
        name: 'Sales Returns',
        nature: 'income',
        bs_category: null,
        affects_pl: true,
        is_tax_group: false,
        description: 'Returns and allowances on sales'
      },
      'DIR_INC': {
        name: 'Direct Income',
        nature: 'income',
        bs_category: null,
        affects_pl: true,
        is_tax_group: false,
        description: 'Income directly related to business operations'
      },
      'IND_INC': {
        name: 'Indirect Income',
        nature: 'income',
        bs_category: null,
        affects_pl: true,
        is_tax_group: false,
        description: 'Other income not from core operations'
      },

      // EXPENSES (P&L)
      'PUR': {
        name: 'Purchase Accounts',
        nature: 'expense',
        bs_category: null,
        affects_pl: true,
        is_tax_group: false,
        description: 'Cost of goods purchased'
      },
      'PURCHASE': {
        name: 'Purchase Accounts',
        nature: 'expense',
        bs_category: null,
        affects_pl: true,
        is_tax_group: false,
        description: 'Cost of goods purchased'
      },
      'PUR_RET': {
        name: 'Purchase Returns',
        nature: 'expense',
        bs_category: null,
        affects_pl: true,
        is_tax_group: false,
        description: 'Returns and allowances on purchases'
      },
      'PURCHASE_RETURNS': {
        name: 'Purchase Returns',
        nature: 'expense',
        bs_category: null,
        affects_pl: true,
        is_tax_group: false,
        description: 'Returns and allowances on purchases'
      },
      'DIR_EXP': {
        name: 'Direct Expenses',
        nature: 'expense',
        bs_category: null,
        affects_pl: true,
        is_tax_group: false,
        description: 'Expenses directly related to production'
      },
      'IND_EXP': {
        name: 'Indirect Expenses',
        nature: 'expense',
        bs_category: null,
        affects_pl: true,
        is_tax_group: false,
        description: 'Operating and administrative expenses'
      },
    };

    // Get all account groups
    const accountGroups = await masterModels.AccountGroup.findAll();
    console.log(`Total account groups: ${accountGroups.length}\n`);

    let updated = 0;

    for (const group of accountGroups) {
      const metadata = groupMetadata[group.group_code];
      
      if (metadata) {
        const updates = {};
        let hasChanges = false;

        // Check each field
        if (group.name !== metadata.name) {
          updates.name = metadata.name;
          hasChanges = true;
        }
        if (group.nature !== metadata.nature) {
          updates.nature = metadata.nature;
          hasChanges = true;
        }
        if (group.bs_category !== metadata.bs_category) {
          updates.bs_category = metadata.bs_category;
          hasChanges = true;
        }
        if (group.affects_pl !== metadata.affects_pl) {
          updates.affects_pl = metadata.affects_pl;
          hasChanges = true;
        }
        if (group.is_tax_group !== metadata.is_tax_group) {
          updates.is_tax_group = metadata.is_tax_group;
          hasChanges = true;
        }
        if (group.description !== metadata.description) {
          updates.description = metadata.description;
          hasChanges = true;
        }

        if (hasChanges) {
          await group.update(updates);
          console.log(`✅ Updated ${group.group_code}: ${metadata.name}`);
          console.log(`   Changes: ${Object.keys(updates).join(', ')}`);
          updated++;
        } else {
          console.log(`⏭️  Skipped ${group.group_code}: ${metadata.name} (no changes)`);
        }
      } else {
        console.log(`⚠️  No metadata for ${group.group_code}: ${group.name}`);
      }
    }

    console.log(`\n✅ Updated ${updated} account groups\n`);

    // Show summary
    const plGroups = await masterModels.AccountGroup.findAll({
      where: { affects_pl: true },
      order: [['group_code', 'ASC']]
    });

    console.log(`\n📊 P&L Affecting Groups (${plGroups.length}):`);
    plGroups.forEach(g => {
      console.log(`  - ${g.group_code}: ${g.name} (${g.nature})`);
    });

    const bsGroups = await masterModels.AccountGroup.findAll({
      where: { affects_pl: false },
      order: [['bs_category', 'ASC'], ['group_code', 'ASC']]
    });

    console.log(`\n🏛️  Balance Sheet Groups (${bsGroups.length}):`);
    let currentCategory = null;
    bsGroups.forEach(g => {
      if (g.bs_category !== currentCategory) {
        currentCategory = g.bs_category;
        console.log(`\n  ${currentCategory || 'uncategorized'}:`);
      }
      console.log(`    - ${g.group_code}: ${g.name}`);
    });

    await masterSequelize.close();
    console.log('\n✅ Done!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateAccountGroups();
