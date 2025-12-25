/**
 * Script to fix missing columns in existing tenant databases
 * Run with: node src/scripts/fixTenantDatabaseColumns.js [tenant_db_name]
 * If no db_name provided, it will fix all tenant databases
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Helper function to safely add column
async function addColumnIfNotExists(queryInterface, tableName, columnName, columnDefinition) {
  try {
    const tableDescription = await queryInterface.describeTable(tableName);
    if (!tableDescription[columnName]) {
      await queryInterface.addColumn(tableName, columnName, columnDefinition);
      console.log(`✓ Added column ${columnName} to ${tableName}`);
      return true;
    } else {
      console.log(`ℹ️  Column ${columnName} already exists in ${tableName}`);
      return false;
    }
  } catch (error) {
    if (error.message.includes('Duplicate column name') || error.message.includes('already exists')) {
      console.log(`ℹ️  Column ${columnName} already exists in ${tableName}`);
      return false;
    }
    throw error;
  }
}

async function fixTenantDatabase(dbName) {
  const connection = new Sequelize(
    dbName,
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
    await connection.authenticate();
    console.log(`\n✓ Connected to database: ${dbName}`);

    const queryInterface = connection.getQueryInterface();
    const { Sequelize: SequelizeType } = require('sequelize');

    // Fix bill_wise_details table
    console.log('\n📋 Fixing bill_wise_details table...');
    await addColumnIfNotExists(queryInterface, 'bill_wise_details', 'pending_amount', {
      type: SequelizeType.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await addColumnIfNotExists(queryInterface, 'bill_wise_details', 'is_open', {
      type: SequelizeType.BOOLEAN,
      defaultValue: true,
    });
    await addColumnIfNotExists(queryInterface, 'bill_wise_details', 'is_fully_paid', {
      type: SequelizeType.BOOLEAN,
      defaultValue: false,
    });

    // Fix vouchers table
    console.log('\n📋 Fixing vouchers table...');
    await addColumnIfNotExists(queryInterface, 'vouchers', 'voucher_type', {
      type: SequelizeType.STRING(50),
      allowNull: true,
      comment: 'Logical voucher category (Sales/Purchase/Payment/Receipt/Journal/Contra)',
    });
    await addColumnIfNotExists(queryInterface, 'vouchers', 'party_ledger_id', {
      type: SequelizeType.UUID,
      allowNull: true,
      comment: 'Customer/Supplier ledger id',
    });
    await addColumnIfNotExists(queryInterface, 'vouchers', 'reference_date', {
      type: SequelizeType.DATE,
      allowNull: true,
    });
    await addColumnIfNotExists(queryInterface, 'vouchers', 'place_of_supply', {
      type: SequelizeType.STRING(100),
      allowNull: true,
    });
    await addColumnIfNotExists(queryInterface, 'vouchers', 'is_reverse_charge', {
      type: SequelizeType.BOOLEAN,
      defaultValue: false,
    });
    await addColumnIfNotExists(queryInterface, 'vouchers', 'subtotal', {
      type: SequelizeType.DECIMAL(15, 2),
      allowNull: true,
    });
    await addColumnIfNotExists(queryInterface, 'vouchers', 'cgst_amount', {
      type: SequelizeType.DECIMAL(15, 2),
      allowNull: true,
    });
    await addColumnIfNotExists(queryInterface, 'vouchers', 'sgst_amount', {
      type: SequelizeType.DECIMAL(15, 2),
      allowNull: true,
    });
    await addColumnIfNotExists(queryInterface, 'vouchers', 'igst_amount', {
      type: SequelizeType.DECIMAL(15, 2),
      allowNull: true,
    });
    await addColumnIfNotExists(queryInterface, 'vouchers', 'cess_amount', {
      type: SequelizeType.DECIMAL(15, 2),
      allowNull: true,
    });
    await addColumnIfNotExists(queryInterface, 'vouchers', 'round_off', {
      type: SequelizeType.DECIMAL(15, 2),
      allowNull: true,
    });
    await addColumnIfNotExists(queryInterface, 'vouchers', 'created_by', {
      type: SequelizeType.UUID,
      allowNull: true,
    });

    // Fix gstins table
    console.log('\n📋 Fixing gstins table...');
    await addColumnIfNotExists(queryInterface, 'gstins', 'address', {
      type: SequelizeType.TEXT,
      allowNull: true,
    });
    await addColumnIfNotExists(queryInterface, 'gstins', 'gstin_status', {
      type: SequelizeType.ENUM('active', 'cancelled', 'suspended'),
      defaultValue: 'active',
      allowNull: true,
    });
    await addColumnIfNotExists(queryInterface, 'gstins', 'state_code', {
      type: SequelizeType.STRING(2),
      allowNull: true,
      comment: '2-digit state code (first 2 digits of GSTIN)',
    });

    // Fix bill_allocations table
    console.log('\n📋 Fixing bill_allocations table...');
    try {
      const tableDescription = await queryInterface.describeTable('bill_allocations');
      if (tableDescription.bill_wise_detail_id && !tableDescription.bill_id) {
        await queryInterface.renameColumn('bill_allocations', 'bill_wise_detail_id', 'bill_id');
        console.log('✓ Renamed bill_wise_detail_id to bill_id');
      }
      if (tableDescription.voucher_id && !tableDescription.payment_voucher_id) {
        await queryInterface.renameColumn('bill_allocations', 'voucher_id', 'payment_voucher_id');
        console.log('✓ Renamed voucher_id to payment_voucher_id');
      }
      if (tableDescription.allocation_date) {
        await queryInterface.removeColumn('bill_allocations', 'allocation_date');
        console.log('✓ Removed allocation_date column');
      }
    } catch (error) {
      console.log(`⚠️  Could not fix bill_allocations: ${error.message}`);
    }

    // Make voucher_type_id nullable in vouchers
    try {
      const vouchersDesc = await queryInterface.describeTable('vouchers');
      if (vouchersDesc.voucher_type_id && vouchersDesc.voucher_type_id.allowNull === false) {
        await queryInterface.changeColumn('vouchers', 'voucher_type_id', {
          type: SequelizeType.UUID,
          allowNull: true,
          comment: 'References master DB voucher_types table',
        });
        console.log('✓ Made voucher_type_id nullable');
      }
    } catch (error) {
      console.log(`⚠️  Could not update voucher_type_id: ${error.message}`);
    }

    console.log(`\n✅ Successfully fixed database: ${dbName}`);
    await connection.close();
  } catch (error) {
    console.error(`❌ Error fixing database ${dbName}:`, error.message);
    await connection.close();
    throw error;
  }
}

async function main() {
  const dbName = process.argv[2];

  if (dbName) {
    // Fix specific database
    await fixTenantDatabase(dbName);
  } else {
    // Fix all tenant databases
    const masterConnection = new Sequelize(
      '',
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
      // Get all databases that match tenant pattern
      const [databases] = await masterConnection.query(
        "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME LIKE 'finvera_%' OR SCHEMA_NAME LIKE '%tenant%'"
      );

      console.log(`Found ${databases.length} tenant databases to fix\n`);

      for (const db of databases) {
        const dbName = db.SCHEMA_NAME;
        // Skip master and main databases
        if (dbName.includes('master') || dbName === process.env.DB_NAME) {
          continue;
        }
        await fixTenantDatabase(dbName);
      }

      console.log('\n✅ All tenant databases fixed!');
    } catch (error) {
      console.error('❌ Error listing databases:', error);
    } finally {
      await masterConnection.close();
    }
  }
}

main().catch(console.error);
