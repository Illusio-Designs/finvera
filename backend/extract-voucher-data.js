const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(
  'finvera_illusio_designs',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

async function extractVoucherData() {
  try {
    console.log('📋 EXTRACTING VOUCHER DATA FOR RECREATION');
    console.log('=' .repeat(60));
    
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    const voucherNumber = 'PI260201896195';
    
    // Get voucher details
    const [voucherResults] = await sequelize.query(`
      SELECT v.*, l.ledger_name as party_name, l.gstin, l.contact_number, l.email, l.address
      FROM vouchers v
      LEFT JOIN ledgers l ON v.party_ledger_id = l.id
      WHERE v.voucher_number = '${voucherNumber}'
    `);
    
    if (voucherResults.length === 0) {
      console.log('❌ Voucher not found');
      return;
    }
    
    const voucher = voucherResults[0];
    
    console.log('📄 EXISTING VOUCHER DETAILS');
    console.log('-'.repeat(40));
    console.log(`Voucher ID: ${voucher.id}`);
    console.log(`Voucher Number: ${voucher.voucher_number}`);
    console.log(`Voucher Type: ${voucher.voucher_type}`);
    console.log(`Voucher Date: ${voucher.voucher_date?.toISOString().split('T')[0]}`);
    console.log(`Status: ${voucher.status}`);
    console.log(`Total Amount: ₹${parseFloat(voucher.total_amount).toLocaleString('en-IN')}`);
    console.log(`Reference: ${voucher.reference_number || 'None'}`);
    console.log(`Narration: ${voucher.narration || 'None'}`);
    console.log(`Created: ${voucher.createdAt}`);
    
    console.log('\n👤 SUPPLIER DETAILS');
    console.log('-'.repeat(40));
    console.log(`Party Ledger ID: ${voucher.party_ledger_id}`);
    console.log(`Party Name: ${voucher.party_name}`);
    console.log(`GSTIN: ${voucher.gstin || 'Not provided'}`);
    console.log(`Contact: ${voucher.contact_number || 'Not provided'}`);
    console.log(`Email: ${voucher.email || 'Not provided'}`);
    console.log(`Address: ${voucher.address || 'Not provided'}`);
    
    // Check for duplicate ledgers
    console.log('\n🔍 CHECKING FOR DUPLICATE LEDGERS');
    console.log('-'.repeat(40));
    
    const [duplicateResults] = await sequelize.query(`
      SELECT ledger_name, gstin, contact_number, COUNT(*) as count
      FROM ledgers 
      WHERE ledger_name = '${voucher.party_name}' 
         OR (gstin IS NOT NULL AND gstin = '${voucher.gstin}')
         OR (contact_number IS NOT NULL AND contact_number = '${voucher.contact_number}')
      GROUP BY ledger_name, gstin, contact_number
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateResults.length > 0) {
      console.log(`⚠️  Found ${duplicateResults.length} potential duplicate ledger group(s):`);
      
      for (let i = 0; i < duplicateResults.length; i++) {
        const dup = duplicateResults[i];
        console.log(`\n  Duplicate Group ${i + 1}:`);
        console.log(`    Name: ${dup.ledger_name}`);
        console.log(`    GSTIN: ${dup.gstin || 'None'}`);
        console.log(`    Contact: ${dup.contact_number || 'None'}`);
        console.log(`    Count: ${dup.count} entries`);
        
        // Get all entries in this duplicate group
        const [allDuplicates] = await sequelize.query(`
          SELECT id, ledger_name, gstin, contact_number, createdAt
          FROM ledgers 
          WHERE ledger_name = '${dup.ledger_name}' 
             OR (gstin IS NOT NULL AND gstin = '${dup.gstin}')
             OR (contact_number IS NOT NULL AND contact_number = '${dup.contact_number}')
          ORDER BY createdAt ASC
        `);
        
        console.log(`    All entries:`);
        allDuplicates.forEach((entry, index) => {
          console.log(`      ${index + 1}. ID: ${entry.id} | Created: ${entry.createdAt} ${index === 0 ? '(KEEP - Oldest)' : '(DELETE - Duplicate)'}`);
        });
      }
    } else {
      console.log('✅ No duplicate ledgers found');
    }
    
    // Generate the data structure for recreation
    const recreationData = {
      voucher_type: 'purchase_invoice',
      voucher_number: voucher.voucher_number, // Will be regenerated
      voucher_date: voucher.voucher_date?.toISOString().split('T')[0],
      party_ledger_id: voucher.party_ledger_id,
      party_name: voucher.party_name,
      reference_number: voucher.reference_number,
      narration: voucher.narration,
      total_amount: parseFloat(voucher.total_amount),
      status: 'draft', // Will be posted after creation
      tenant_id: voucher.tenant_id,
      // Items will need to be provided by user
      items: []
    };
    
    console.log('\n📦 MISSING INFORMATION NEEDED');
    console.log('-'.repeat(40));
    console.log('❌ Voucher Items: Not found in database');
    console.log('   We need you to provide:');
    console.log('   • Item names/descriptions');
    console.log('   • Quantities purchased');
    console.log('   • Rates per item');
    console.log('   • GST rates');
    console.log('   • HSN codes (if available)');
    
    console.log('\n💾 RECREATION DATA STRUCTURE');
    console.log('-'.repeat(40));
    console.log(JSON.stringify(recreationData, null, 2));
    
    return {
      voucher,
      recreationData,
      duplicateResults
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Run the extraction
if (require.main === module) {
  extractVoucherData().then(result => {
    if (result) {
      console.log('\n🎯 NEXT STEPS:');
      console.log('-'.repeat(40));
      console.log('1. ✅ Voucher data extracted');
      console.log('2. 📝 Please provide the missing item details');
      console.log('3. 🗑️  Remove duplicate ledgers (if any)');
      console.log('4. ❌ Delete the incomplete voucher');
      console.log('5. ✨ Create new voucher with full integration');
    }
  });
}

module.exports = { extractVoucherData };