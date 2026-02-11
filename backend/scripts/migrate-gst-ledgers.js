require('dotenv').config();
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// Connect to master database
const masterDb = new Sequelize(
  process.env.MASTER_DB_NAME || 'finvera_master',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

async function migrateGSTLedgers() {
  try {
    console.log('\n🔧 === MIGRATING GST LEDGERS ===\n');

    // Get all tenant databases
    const [tenants] = await masterDb.query(`
      SELECT id as tenant_id, db_name, company_name 
      FROM tenant_master 
      WHERE is_active = 1
    `);

    console.log(`📋 Found ${tenants.length} active tenants\n`);

    // Get the Duties & Taxes group ID
    const [dtGroup] = await masterDb.query(`
      SELECT id FROM account_groups WHERE group_code = 'DT' LIMIT 1
    `);

    if (!dtGroup || dtGroup.length === 0) {
      console.error('❌ Duties & Taxes group not found!');
      return;
    }

    const dutiesTaxesGroupId = dtGroup[0].id;
    console.log(`✓ Duties & Taxes Group ID: ${dutiesTaxesGroupId}\n`);

    // Process each tenant
    for (const tenant of tenants) {
      console.log(`\n📊 Processing: ${tenant.company_name} (${tenant.db_name})`);
      console.log('─'.repeat(80));

      // Connect to tenant database
      const tenantDb = new Sequelize(
        tenant.db_name,
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '',
        {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 3306,
          dialect: 'mysql',
          logging: false,
        }
      );

      try {
        // Check existing GST ledgers
        const [existingGST] = await tenantDb.query(`
          SELECT id, ledger_name, ledger_code, balance_type, current_balance 
          FROM ledgers 
          WHERE ledger_name LIKE '%GST%'
        `);

        console.log(`  Found ${existingGST.length} existing GST ledgers:`);
        existingGST.forEach(l => {
          console.log(`    - ${l.ledger_name} (${l.ledger_code}): ₹${l.current_balance} ${l.balance_type}`);
        });

        // Create new GST ledgers if they don't exist
        const gstLedgers = [
          // INPUT GST (Asset - Debit balance)
          {
            name: 'Input CGST',
            code: 'CGST-INPUT',
            type: 'input',
            balance_type: 'debit',
            description: 'Central GST paid on purchases (Input Tax Credit)'
          },
          {
            name: 'Input SGST',
            code: 'SGST-INPUT',
            type: 'input',
            balance_type: 'debit',
            description: 'State GST paid on purchases (Input Tax Credit)'
          },
          {
            name: 'Input IGST',
            code: 'IGST-INPUT',
            type: 'input',
            balance_type: 'debit',
            description: 'Integrated GST paid on inter-state purchases (Input Tax Credit)'
          },
          // OUTPUT GST (Liability - Credit balance)
          {
            name: 'Output CGST',
            code: 'CGST-OUTPUT',
            type: 'output',
            balance_type: 'credit',
            description: 'Central GST collected on sales (Output Tax Liability)'
          },
          {
            name: 'Output SGST',
            code: 'SGST-OUTPUT',
            type: 'output',
            balance_type: 'credit',
            description: 'State GST collected on sales (Output Tax Liability)'
          },
          {
            name: 'Output IGST',
            code: 'IGST-OUTPUT',
            type: 'output',
            balance_type: 'credit',
            description: 'Integrated GST collected on inter-state sales (Output Tax Liability)'
          }
        ];

        console.log(`\n  Creating new GST ledgers...`);

        for (const gst of gstLedgers) {
          // Check if ledger already exists
          const [existing] = await tenantDb.query(`
            SELECT id FROM ledgers WHERE ledger_code = ? LIMIT 1
          `, { replacements: [gst.code] });

          if (existing.length > 0) {
            console.log(`    ⚠️  ${gst.name} already exists, skipping...`);
            continue;
          }

          // Create ledger
          const ledgerId = uuidv4();
          await tenantDb.query(`
            INSERT INTO ledgers (
              id, 
              ledger_name, 
              ledger_code, 
              account_group_id,
              opening_balance,
              opening_balance_type,
              balance_type,
              current_balance,
              is_active,
              tenant_id,
              createdAt,
              updatedAt
            ) VALUES (?, ?, ?, ?, 0.00, ?, ?, 0.00, 1, ?, NOW(), NOW())
          `, {
            replacements: [
              ledgerId,
              gst.name,
              gst.code,
              dutiesTaxesGroupId,
              gst.balance_type === 'debit' ? 'Dr' : 'Cr',
              gst.balance_type,
              tenant.tenant_id
            ]
          });

          console.log(`    ✓ Created: ${gst.name} (${gst.code}) - ${gst.balance_type}`);
        }

        // Mark old GST ledgers as inactive (optional - keep for historical data)
        console.log(`\n  Marking old GST ledgers as inactive...`);
        await tenantDb.query(`
          UPDATE ledgers 
          SET is_active = 0 
          WHERE ledger_code IN ('CGST-001', 'SGST-001', 'IGST-001')
        `);
        console.log(`    ✓ Old GST ledgers marked inactive`);

        // Verify new ledgers
        const [newGST] = await tenantDb.query(`
          SELECT ledger_name, ledger_code, balance_type 
          FROM ledgers 
          WHERE ledger_code LIKE '%INPUT' OR ledger_code LIKE '%OUTPUT'
          ORDER BY ledger_code
        `);

        console.log(`\n  ✅ New GST Ledgers (${newGST.length}):`);
        newGST.forEach(l => {
          const icon = l.balance_type === 'debit' ? '📥' : '📤';
          console.log(`    ${icon} ${l.ledger_name} (${l.ledger_code}) - ${l.balance_type}`);
        });

      } catch (error) {
        console.error(`  ❌ Error processing ${tenant.company_name}:`, error.message);
      } finally {
        await tenantDb.close();
      }
    }

    console.log('\n\n✅ GST LEDGER MIGRATION COMPLETE!\n');
    console.log('📊 Summary:');
    console.log('  ✓ Input GST ledgers created (Asset - Debit balance)');
    console.log('  ✓ Output GST ledgers created (Liability - Credit balance)');
    console.log('  ✓ Old GST ledgers marked inactive');
    console.log('\n🎯 Next Steps:');
    console.log('  1. Update voucher creation logic to use new GST ledgers');
    console.log('  2. Update invoice generation to use correct GST ledgers');
    console.log('  3. Update reports to separate Input/Output GST');
    console.log('  4. Test purchase vouchers (should use Input GST)');
    console.log('  5. Test sales vouchers (should use Output GST)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await masterDb.close();
  }
}

migrateGSTLedgers();
