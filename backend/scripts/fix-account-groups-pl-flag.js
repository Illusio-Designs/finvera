/**
 * Fix Account Groups - Set affects_pl flag
 * This script updates the account groups to set the affects_pl flag correctly
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const masterSequelize = require('../src/config/masterDatabase');
const masterModels = require('../src/models/masterModels');

async function fixAccountGroups() {
  try {
    console.log('\n🔧 === FIXING ACCOUNT GROUPS P&L FLAGS ===\n');

    // Get all account groups
    const accountGroups = await masterModels.AccountGroup.findAll();
    console.log(`Total account groups: ${accountGroups.length}\n`);

    // Define which groups affect P&L
    const plAffectingGroups = [
      'SAL', 'SALES',           // Sales
      'SAL_RET', 'SALES_RETURNS', // Sales Returns
      'PUR', 'PURCHASE',        // Purchases
      'PUR_RET', 'PURCHASE_RETURNS', // Purchase Returns
      'DIR_EXP',                // Direct Expenses
      'IND_EXP',                // Indirect Expenses
      'DIR_INC',                // Direct Income
      'IND_INC'                 // Indirect Income
    ];

    let updated = 0;

    for (const group of accountGroups) {
      const shouldAffectPL = plAffectingGroups.includes(group.group_code);
      
      if (group.affects_pl !== shouldAffectPL) {
        await group.update({ affects_pl: shouldAffectPL });
        console.log(`✅ Updated ${group.group_code} (${group.group_name}): affects_pl = ${shouldAffectPL}`);
        updated++;
      } else {
        console.log(`⏭️  Skipped ${group.group_code} (${group.group_name}): already correct (${shouldAffectPL})`);
      }
    }

    console.log(`\n✅ Updated ${updated} account groups\n`);

    // Show P&L affecting groups
    const plGroups = await masterModels.AccountGroup.findAll({
      where: { affects_pl: true },
      order: [['group_code', 'ASC']]
    });

    console.log(`\n📊 P&L Affecting Groups (${plGroups.length}):`);
    plGroups.forEach(g => {
      console.log(`  - ${g.group_code}: ${g.group_name} (${g.nature})`);
    });

    await masterSequelize.close();
    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAccountGroups();
