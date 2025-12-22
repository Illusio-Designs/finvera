/**
 * Consolidated Migration for Tenant Databases
 * 
 * This file contains all migrations for tenant-specific databases.
 * These tables are created in each tenant's individual database.
 * 
 * Tables included:
 * - User Management: users (tenant-specific users: accountants, viewers, etc.)
 * - Accounting: account_groups, ledgers, voucher_types, vouchers, voucher_items, voucher_ledger_entries
 * - Bill Management: bill_wise_details, bill_allocations
 * - GST/TDS: gst_rates, gstins, gstr_returns, tds_details, e_invoices
 * - Inventory: inventory_items, stock_movements, warehouses, warehouse_stocks
 * - Audit: audit_logs
 * 
 * IMPORTANT: This migration runs on each tenant database separately
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to safely add column
    const addColumnIfNotExists = async (tableName, columnName, columnDefinition) => {
      try {
        // Check if table exists first
        const [tables] = await queryInterface.sequelize.query(`SHOW TABLES LIKE '${tableName}'`);
        if (tables.length === 0) {
          console.log(`⚠️  Table ${tableName} does not exist, skipping column addition`);
          return false;
        }

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
        if (error.message.includes('Duplicate column name') || 
            error.message.includes('already exists') ||
            error.message.includes('Duplicate column')) {
          console.log(`ℹ️  Column ${columnName} already exists in ${tableName}`);
          return false;
        }
        console.error(`❌ Error adding column ${columnName} to ${tableName}:`, error.message);
        throw error;
      }
    };

    // Helper function to safely add index
    const addIndexIfNotExists = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
        return true;
      } catch (error) {
        if (error.message.includes('Duplicate key name') || 
            error.message.includes('already exists') ||
            error.message.includes('Too many keys')) {
          if (error.message.includes('Too many keys')) {
            console.warn(`⚠️  Skipping index creation on ${tableName}: Too many keys (MySQL limit: 64)`);
          }
          return false;
        }
        throw error;
      }
    };

    // ============================================
    // USER MANAGEMENT TABLE
    // ============================================

    // 1. USERS TABLE (Tenant-specific users: accountants, viewers, etc.)
    const [usersTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'users'");
    if (usersTable.length === 0) {
      await queryInterface.createTable('users', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        name: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        password: { type: Sequelize.STRING, allowNull: false },
        role: { 
          type: Sequelize.ENUM('admin', 'accountant', 'viewer'),
          defaultValue: 'viewer',
          allowNull: false,
        },
        phone: Sequelize.STRING(15),
        profile_image: { type: Sequelize.STRING(500), allowNull: true },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        last_login: Sequelize.DATE,
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      
      // Add index on email for faster lookups
      await addIndexIfNotExists('users', ['email'], { name: 'idx_users_email', unique: true });
    } else {
      // Add missing columns if table exists
      await addColumnIfNotExists('users', 'profile_image', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    // ============================================
    // ACCOUNTING TABLES
    // ============================================

    // 2. ACCOUNT_GROUPS TABLE
    const [accountGroupsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'account_groups'");
    if (accountGroupsTable.length === 0) {
      await queryInterface.createTable('account_groups', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        tenant_id: { type: Sequelize.UUID, allowNull: false },
        group_code: { type: Sequelize.STRING, allowNull: false },
        group_name: { type: Sequelize.STRING, allowNull: false },
        parent_id: Sequelize.UUID,
        group_type: Sequelize.STRING,
        schedule_iii_category: Sequelize.STRING,
        is_system: { type: Sequelize.BOOLEAN, defaultValue: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 3. LEDGERS TABLE
    const [ledgersTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'ledgers'");
    if (ledgersTable.length === 0) {
      await queryInterface.createTable('ledgers', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        tenant_id: { type: Sequelize.UUID, allowNull: false },
        account_group_id: { type: Sequelize.UUID, allowNull: false },
        ledger_code: { type: Sequelize.STRING, allowNull: false },
        ledger_name: { type: Sequelize.STRING, allowNull: false },
        opening_balance: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        opening_balance_type: Sequelize.STRING,
        gstin: Sequelize.STRING(15),
        pan: Sequelize.STRING(10),
        address: Sequelize.TEXT,
        city: Sequelize.STRING(100),
        state: Sequelize.STRING(100),
        pincode: Sequelize.STRING(10),
        phone: Sequelize.STRING(15),
        email: Sequelize.STRING(255),
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    } else {
      // Check if old 'name' column exists and migrate to 'ledger_name'
      try {
        const tableDescription = await queryInterface.describeTable('ledgers');
        if (tableDescription.name && !tableDescription.ledger_name) {
          // Rename 'name' column to 'ledger_name' for consistency
          await queryInterface.renameColumn('ledgers', 'name', 'ledger_name');
          console.log('✓ Renamed ledgers.name to ledgers.ledger_name');
        }
      } catch (error) {
        // Column might not exist or already renamed - ignore
        console.log(`ℹ️  Could not check/rename name column: ${error.message}`);
      }

      // Add missing columns from 20251218-add-ledger-fields.js
      await addColumnIfNotExists('ledgers', 'currency', {
        type: Sequelize.STRING(3),
        allowNull: true,
        defaultValue: 'INR',
      });
      await addColumnIfNotExists('ledgers', 'opening_balance_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
      await addColumnIfNotExists('ledgers', 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      await addColumnIfNotExists('ledgers', 'additional_fields', {
        type: Sequelize.JSON,
        allowNull: true,
      });
      await addColumnIfNotExists('ledgers', 'country', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    // 4. VOUCHER_TYPES TABLE
    const [voucherTypesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'voucher_types'");
    if (voucherTypesTable.length === 0) {
      await queryInterface.createTable('voucher_types', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        type_code: { type: Sequelize.STRING, allowNull: false, unique: true },
        type_name: { type: Sequelize.STRING, allowNull: false },
        prefix: Sequelize.STRING(10),
        numbering_method: Sequelize.STRING,
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 5. VOUCHERS TABLE
    const [vouchersTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'vouchers'");
    if (vouchersTable.length === 0) {
      await queryInterface.createTable('vouchers', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        tenant_id: { type: Sequelize.UUID, allowNull: false },
        voucher_type_id: { type: Sequelize.UUID, allowNull: true, comment: 'References master DB voucher_types table' },
        voucher_type: { type: Sequelize.STRING(50), allowNull: true, comment: 'Logical voucher category (Sales/Purchase/Payment/Receipt/Journal/Contra)' },
        voucher_number: { type: Sequelize.STRING, allowNull: false },
        voucher_date: { type: Sequelize.DATE, allowNull: false },
        party_ledger_id: { type: Sequelize.UUID, allowNull: true, comment: 'Customer/Supplier ledger id' },
        reference_number: Sequelize.STRING,
        reference_date: Sequelize.DATE,
        narration: Sequelize.TEXT,
        place_of_supply: Sequelize.STRING(100),
        is_reverse_charge: { type: Sequelize.BOOLEAN, defaultValue: false },
        subtotal: Sequelize.DECIMAL(15, 2),
        cgst_amount: Sequelize.DECIMAL(15, 2),
        sgst_amount: Sequelize.DECIMAL(15, 2),
        igst_amount: Sequelize.DECIMAL(15, 2),
        cess_amount: Sequelize.DECIMAL(15, 2),
        round_off: Sequelize.DECIMAL(15, 2),
        total_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        status: { type: Sequelize.ENUM('draft', 'posted', 'cancelled'), defaultValue: 'posted' },
        posted_at: Sequelize.DATE,
        posted_by: Sequelize.UUID,
        created_by: Sequelize.UUID,
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    } else {
      // Add missing columns if table exists
      await addColumnIfNotExists('vouchers', 'voucher_type', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Logical voucher category (Sales/Purchase/Payment/Receipt/Journal/Contra)',
      });
      await addColumnIfNotExists('vouchers', 'party_ledger_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Customer/Supplier ledger id',
      });
      await addColumnIfNotExists('vouchers', 'reference_date', {
        type: Sequelize.DATE,
        allowNull: true,
      });
      await addColumnIfNotExists('vouchers', 'place_of_supply', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
      await addColumnIfNotExists('vouchers', 'is_reverse_charge', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      });
      await addColumnIfNotExists('vouchers', 'subtotal', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      });
      await addColumnIfNotExists('vouchers', 'cgst_amount', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      });
      await addColumnIfNotExists('vouchers', 'sgst_amount', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      });
      await addColumnIfNotExists('vouchers', 'igst_amount', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      });
      await addColumnIfNotExists('vouchers', 'cess_amount', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      });
      await addColumnIfNotExists('vouchers', 'round_off', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      });
      await addColumnIfNotExists('vouchers', 'created_by', {
        type: Sequelize.UUID,
        allowNull: true,
      });
      // Update voucher_type_id to be nullable if it's currently required
      try {
        await queryInterface.changeColumn('vouchers', 'voucher_type_id', {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'References master DB voucher_types table',
        });
      } catch (error) {
        // Column might already be nullable or change might fail - ignore
      }
      // Update status to ENUM if it's currently STRING
      try {
        await queryInterface.changeColumn('vouchers', 'status', {
          type: Sequelize.ENUM('draft', 'posted', 'cancelled'),
          defaultValue: 'posted',
        });
      } catch (error) {
        // ENUM change might fail if column already exists - ignore
      }
    }

    // 6. VOUCHER_ITEMS TABLE
    const [voucherItemsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'voucher_items'");
    if (voucherItemsTable.length === 0) {
      await queryInterface.createTable('voucher_items', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        voucher_id: { type: Sequelize.UUID, allowNull: false },
        item_name: Sequelize.STRING,
        hsn_sac: Sequelize.STRING(10),
        quantity: Sequelize.DECIMAL(10, 3),
        unit: Sequelize.STRING(20),
        rate: Sequelize.DECIMAL(15, 2),
        amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        cgst_rate: Sequelize.DECIMAL(5, 2),
        sgst_rate: Sequelize.DECIMAL(5, 2),
        igst_rate: Sequelize.DECIMAL(5, 2),
        cess_rate: Sequelize.DECIMAL(5, 2),
        cgst_amount: Sequelize.DECIMAL(15, 2),
        sgst_amount: Sequelize.DECIMAL(15, 2),
        igst_amount: Sequelize.DECIMAL(15, 2),
        cess_amount: Sequelize.DECIMAL(15, 2),
        total_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    } else {
      // Add missing columns from 20251219-add-voucher-item-warehouse-fields.js
      await addColumnIfNotExists('voucher_items', 'inventory_item_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
      await addColumnIfNotExists('voucher_items', 'warehouse_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }

    // 7. VOUCHER_LEDGER_ENTRIES TABLE
    const [voucherLedgerEntriesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'voucher_ledger_entries'");
    if (voucherLedgerEntriesTable.length === 0) {
      await queryInterface.createTable('voucher_ledger_entries', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        tenant_id: { type: Sequelize.UUID, allowNull: false },
        voucher_id: { type: Sequelize.UUID, allowNull: false },
        ledger_id: { type: Sequelize.UUID, allowNull: false },
        debit_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        credit_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // ============================================
    // BILL MANAGEMENT TABLES
    // ============================================

    // 8. BILL_WISE_DETAILS TABLE
    const [billWiseDetailsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'bill_wise_details'");
    if (billWiseDetailsTable.length === 0) {
      await queryInterface.createTable('bill_wise_details', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        tenant_id: { type: Sequelize.UUID, allowNull: false },
        voucher_id: { type: Sequelize.UUID, allowNull: false },
        ledger_id: { type: Sequelize.UUID, allowNull: false },
        bill_number: Sequelize.STRING(100),
        bill_date: Sequelize.DATEONLY,
        bill_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        pending_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
        due_date: Sequelize.DATEONLY,
        is_open: { type: Sequelize.BOOLEAN, defaultValue: true },
        is_fully_paid: { type: Sequelize.BOOLEAN, defaultValue: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    } else {
      // Add missing columns if table exists
      await addColumnIfNotExists('bill_wise_details', 'pending_amount', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      });
      await addColumnIfNotExists('bill_wise_details', 'is_open', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      });
      await addColumnIfNotExists('bill_wise_details', 'is_fully_paid', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      });
      // Update bill_date to DATEONLY if it's currently DATE
      try {
        await queryInterface.changeColumn('bill_wise_details', 'bill_date', {
          type: Sequelize.DATEONLY,
          allowNull: true,
        });
      } catch (error) {
        // Column change might fail - ignore
      }
      // Update due_date to DATEONLY if it's currently DATE
      try {
        await queryInterface.changeColumn('bill_wise_details', 'due_date', {
          type: Sequelize.DATEONLY,
          allowNull: true,
        });
      } catch (error) {
        // Column change might fail - ignore
      }
      // Remove old status column if it exists (replaced by is_open and is_fully_paid)
      try {
        const tableDescription = await queryInterface.describeTable('bill_wise_details');
        if (tableDescription.status) {
          await queryInterface.removeColumn('bill_wise_details', 'status');
          console.log('✓ Removed old status column from bill_wise_details');
        }
      } catch (error) {
        // Column might not exist or removal might fail - ignore
        console.log(`ℹ️  Could not remove status column: ${error.message}`);
      }
      
      // Initialize pending_amount for existing rows if it was just added
      try {
        const [result] = await queryInterface.sequelize.query(
          `UPDATE bill_wise_details SET pending_amount = bill_amount WHERE pending_amount IS NULL OR pending_amount = 0`
        );
        if (result.affectedRows > 0) {
          console.log(`✓ Initialized pending_amount for ${result.affectedRows} existing rows`);
        }
      } catch (error) {
        console.log(`ℹ️  Could not initialize pending_amount: ${error.message}`);
      }
    }

    // 9. BILL_ALLOCATIONS TABLE
    const [billAllocationsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'bill_allocations'");
    if (billAllocationsTable.length === 0) {
      await queryInterface.createTable('bill_allocations', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        bill_id: { type: Sequelize.UUID, allowNull: false, comment: 'References bill_wise_details.id' },
        payment_voucher_id: { type: Sequelize.UUID, allowNull: false, comment: 'References vouchers.id (payment/receipt voucher)' },
        allocated_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    } else {
      // Add missing columns or update if table exists
      // Check if old column names exist and update them
      try {
        const tableDescription = await queryInterface.describeTable('bill_allocations');
        // If old column names exist, we might need to rename them
        if (tableDescription.bill_wise_detail_id && !tableDescription.bill_id) {
          await queryInterface.renameColumn('bill_allocations', 'bill_wise_detail_id', 'bill_id');
        }
        if (tableDescription.voucher_id && !tableDescription.payment_voucher_id) {
          await queryInterface.renameColumn('bill_allocations', 'voucher_id', 'payment_voucher_id');
        }
        if (tableDescription.allocation_date) {
          // Remove allocation_date if it exists (not in model)
          await queryInterface.removeColumn('bill_allocations', 'allocation_date');
        }
      } catch (error) {
        // Column operations might fail - ignore
      }
    }

    // ============================================
    // GST/TDS TABLES
    // ============================================

    // 10. GST_RATES TABLE
    const [gstRatesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'gst_rates'");
    if (gstRatesTable.length === 0) {
      await queryInterface.createTable('gst_rates', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        hsn_sac: { type: Sequelize.STRING(10), allowNull: false },
        description: Sequelize.TEXT,
        cgst_rate: Sequelize.DECIMAL(5, 2),
        sgst_rate: Sequelize.DECIMAL(5, 2),
        igst_rate: Sequelize.DECIMAL(5, 2),
        cess_rate: Sequelize.DECIMAL(5, 2),
        effective_from: Sequelize.DATE,
        effective_to: Sequelize.DATE,
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 11. GSTINS TABLE
    const [gstinsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'gstins'");
    if (gstinsTable.length === 0) {
      await queryInterface.createTable('gstins', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        tenant_id: { type: Sequelize.UUID, allowNull: false },
        gstin: { type: Sequelize.STRING(15), allowNull: false, unique: true },
        legal_name: { type: Sequelize.STRING(255), allowNull: false },
        trade_name: Sequelize.STRING(255),
        registration_type: { type: Sequelize.STRING(50), defaultValue: 'Regular' },
        state: { type: Sequelize.STRING(100), allowNull: false },
        state_code: { type: Sequelize.STRING(2), allowNull: false },
        address: Sequelize.TEXT,
        registration_date: Sequelize.DATE,
        gstin_status: {
          type: Sequelize.ENUM('active', 'cancelled', 'suspended'),
          defaultValue: 'active',
        },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        is_primary: { type: Sequelize.BOOLEAN, defaultValue: false },
        e_invoice_applicable: { type: Sequelize.BOOLEAN, defaultValue: false },
        e_way_bill_applicable: { type: Sequelize.BOOLEAN, defaultValue: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    } else {
      // Add missing columns if table exists
      await addColumnIfNotExists('gstins', 'address', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      await addColumnIfNotExists('gstins', 'gstin_status', {
        type: Sequelize.ENUM('active', 'cancelled', 'suspended'),
        defaultValue: 'active',
        allowNull: true,
      });
    }

    // 12. GSTR_RETURNS TABLE
    const [gstrReturnsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'gstr_returns'");
    if (gstrReturnsTable.length === 0) {
      await queryInterface.createTable('gstr_returns', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        tenant_id: { type: Sequelize.UUID, allowNull: false },
        gstin: { type: Sequelize.STRING(15), allowNull: false },
        return_type: { type: Sequelize.STRING(10), allowNull: false },
        return_period: { type: Sequelize.STRING(7), allowNull: false },
        filing_status: { type: Sequelize.STRING(20), defaultValue: 'draft' },
        total_taxable_value: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        total_tax: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        json_data: Sequelize.JSON,
        filed_date: Sequelize.DATE,
        acknowledgment_number: Sequelize.STRING(50),
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 13. TDS_DETAILS TABLE
    const [tdsDetailsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'tds_details'");
    if (tdsDetailsTable.length === 0) {
      await queryInterface.createTable('tds_details', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        tenant_id: { type: Sequelize.UUID, allowNull: false },
        voucher_id: Sequelize.UUID,
        ledger_id: Sequelize.UUID,
        tds_section: Sequelize.STRING(10),
        tds_rate: Sequelize.DECIMAL(5, 2),
        tds_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        tds_deducted_date: Sequelize.DATE,
        challan_number: Sequelize.STRING(50),
        challan_date: Sequelize.DATE,
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 14. E_INVOICES TABLE
    const [eInvoicesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'e_invoices'");
    if (eInvoicesTable.length === 0) {
      await queryInterface.createTable('e_invoices', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        tenant_id: { type: Sequelize.UUID, allowNull: false },
        voucher_id: { type: Sequelize.UUID, allowNull: false },
        irn: Sequelize.STRING(100),
        ack_no: Sequelize.STRING(50),
        ack_date: Sequelize.DATE,
        qr_code: Sequelize.TEXT,
        signed_invoice: Sequelize.TEXT,
        cancel_reason: Sequelize.STRING(100),
        cancel_remark: Sequelize.TEXT,
        canceled_at: Sequelize.DATE,
        status: { type: Sequelize.STRING(20), defaultValue: 'pending' },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // ============================================
    // INVENTORY TABLES
    // ============================================

    // 15. INVENTORY_ITEMS TABLE
    const [inventoryItemsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'inventory_items'");
    if (inventoryItemsTable.length === 0) {
      await queryInterface.createTable('inventory_items', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        item_key: {
          type: Sequelize.STRING(300),
          allowNull: false,
          unique: true,
        },
        item_code: Sequelize.STRING(100),
        item_name: {
          type: Sequelize.STRING(500),
          allowNull: false,
        },
        hsn_sac_code: Sequelize.STRING(20),
        uqc: Sequelize.STRING(20),
        gst_rate: {
          type: Sequelize.DECIMAL(6, 2),
          allowNull: true,
        },
        quantity_on_hand: {
          type: Sequelize.DECIMAL(15, 3),
          defaultValue: 0,
        },
        avg_cost: {
          type: Sequelize.DECIMAL(15, 4),
          defaultValue: 0,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 16. STOCK_MOVEMENTS TABLE
    const [stockMovementsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'stock_movements'");
    if (stockMovementsTable.length === 0) {
      await queryInterface.createTable('stock_movements', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        inventory_item_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        warehouse_id: {
          type: Sequelize.UUID,
          allowNull: true,
        },
        voucher_id: {
          type: Sequelize.UUID,
          allowNull: true,
        },
        movement_type: {
          type: Sequelize.ENUM('IN', 'OUT', 'ADJ'),
          allowNull: false,
        },
        quantity: {
          type: Sequelize.DECIMAL(15, 3),
          allowNull: false,
        },
        rate: {
          type: Sequelize.DECIMAL(15, 4),
          allowNull: false,
        },
        amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
        },
        narration: Sequelize.STRING(500),
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    } else {
      // Add warehouse_id column if it doesn't exist (from 20251220-add-warehouse-tables.js)
      await addColumnIfNotExists('stock_movements', 'warehouse_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }

    // 17. WAREHOUSES TABLE
    const [warehousesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'warehouses'");
    if (warehousesTable.length === 0) {
      await queryInterface.createTable('warehouses', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        warehouse_code: {
          type: Sequelize.STRING(100),
          allowNull: true,
          unique: true,
        },
        warehouse_name: {
          type: Sequelize.STRING(500),
          allowNull: false,
        },
        address: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        city: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        state: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        pincode: {
          type: Sequelize.STRING(10),
          allowNull: true,
        },
        contact_person: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        contact_phone: {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        contact_email: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      });
    }

    // 18. WAREHOUSE_STOCKS TABLE
    const [warehouseStocksTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'warehouse_stocks'");
    if (warehouseStocksTable.length === 0) {
      await queryInterface.createTable('warehouse_stocks', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        inventory_item_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        warehouse_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        quantity: {
          type: Sequelize.DECIMAL(15, 3),
          defaultValue: 0,
          allowNull: false,
        },
        avg_cost: {
          type: Sequelize.DECIMAL(15, 4),
          defaultValue: 0,
          allowNull: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      });

      // Add unique index for inventory_item_id + warehouse_id
      await addIndexIfNotExists('warehouse_stocks', ['inventory_item_id', 'warehouse_id'], {
        unique: true,
        name: 'warehouse_stocks_item_warehouse_unique',
      });
    }

    // ============================================
    // AUDIT TABLES
    // ============================================

    // 19. AUDIT_LOGS TABLE
    const [auditLogsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'audit_logs'");
    if (auditLogsTable.length === 0) {
      await queryInterface.createTable('audit_logs', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        tenant_id: Sequelize.UUID,
        user_id: { type: Sequelize.UUID, allowNull: false },
        action: { type: Sequelize.STRING(50), allowNull: false },
        entity_type: { type: Sequelize.STRING(50), allowNull: false },
        entity_id: Sequelize.UUID,
        old_values: Sequelize.JSON,
        new_values: Sequelize.JSON,
        ip_address: Sequelize.STRING(45),
        user_agent: Sequelize.TEXT,
        description: Sequelize.TEXT,
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // ============================================
    // ADD INDEXES
    // ============================================

    // Indexes on vouchers - check if tenant_id exists
    try {
      const vouchersTableDesc = await queryInterface.describeTable('vouchers');
      if (vouchersTableDesc.tenant_id && vouchersTableDesc.voucher_date) {
        await addIndexIfNotExists('vouchers', ['tenant_id', 'voucher_date'], {
          name: 'idx_vouchers_tenant_date',
        });
      } else if (vouchersTableDesc.voucher_date) {
        await addIndexIfNotExists('vouchers', ['voucher_date'], {
          name: 'idx_vouchers_date',
        });
      }
      if (vouchersTableDesc.tenant_id && vouchersTableDesc.status) {
        await addIndexIfNotExists('vouchers', ['tenant_id', 'status'], {
          name: 'idx_vouchers_tenant_status',
        });
      } else if (vouchersTableDesc.status) {
        await addIndexIfNotExists('vouchers', ['status'], {
          name: 'idx_vouchers_status',
        });
      }
    } catch (error) {
      console.log(`ℹ️  Could not add indexes on vouchers: ${error.message}`);
    }

    // Indexes on voucher_ledger_entries - check if tenant_id exists
    try {
      const vleTableDesc = await queryInterface.describeTable('voucher_ledger_entries');
      if (vleTableDesc.tenant_id && vleTableDesc.ledger_id) {
        await addIndexIfNotExists('voucher_ledger_entries', ['tenant_id', 'ledger_id'], {
          name: 'idx_vle_tenant_ledger',
        });
      } else if (vleTableDesc.ledger_id) {
        await addIndexIfNotExists('voucher_ledger_entries', ['ledger_id'], {
          name: 'idx_vle_ledger',
        });
      }
    } catch (error) {
      console.log(`ℹ️  Could not add indexes on voucher_ledger_entries: ${error.message}`);
    }
    // Indexes on ledgers - check if tenant_id exists (may not exist in tenant DBs)
    try {
      const ledgersTableDesc = await queryInterface.describeTable('ledgers');
      if (ledgersTableDesc.tenant_id && ledgersTableDesc.account_group_id) {
        await addIndexIfNotExists('ledgers', ['tenant_id', 'account_group_id'], {
          name: 'idx_ledgers_tenant_group',
        });
      } else if (ledgersTableDesc.account_group_id) {
        await addIndexIfNotExists('ledgers', ['account_group_id'], {
          name: 'idx_ledgers_group',
        });
      }
      if (ledgersTableDesc.tenant_id && ledgersTableDesc.ledger_code) {
        await addIndexIfNotExists('ledgers', ['tenant_id', 'ledger_code'], {
          name: 'idx_ledgers_tenant_code',
        });
      } else if (ledgersTableDesc.ledger_code) {
        await addIndexIfNotExists('ledgers', ['ledger_code'], {
          name: 'idx_ledgers_code',
        });
      }
    } catch (error) {
      console.log(`ℹ️  Could not add indexes on ledgers: ${error.message}`);
    }
    // Indexes on bill_wise_details - check if columns exist first
    try {
      const tableDescription = await queryInterface.describeTable('bill_wise_details');
      if (tableDescription.tenant_id && tableDescription.ledger_id) {
        await addIndexIfNotExists('bill_wise_details', ['tenant_id', 'ledger_id'], {
          name: 'idx_bills_tenant_ledger',
        });
      }
      // Use is_fully_paid instead of status (status column was removed)
      if (tableDescription.tenant_id && tableDescription.is_fully_paid) {
        await addIndexIfNotExists('bill_wise_details', ['tenant_id', 'is_fully_paid'], {
          name: 'idx_bills_tenant_status',
        });
      } else if (tableDescription.tenant_id && tableDescription.status) {
        // Fallback to status if is_fully_paid doesn't exist yet
        await addIndexIfNotExists('bill_wise_details', ['tenant_id', 'status'], {
          name: 'idx_bills_tenant_status',
        });
      }
    } catch (error) {
      console.log(`ℹ️  Could not add indexes on bill_wise_details: ${error.message}`);
    }
    // Indexes on gstr_returns - check if columns exist (tenant_id may not exist in tenant DBs)
    try {
      const gstrTableDesc = await queryInterface.describeTable('gstr_returns');
      if (gstrTableDesc.tenant_id && gstrTableDesc.return_period) {
        await addIndexIfNotExists('gstr_returns', ['tenant_id', 'return_period'], {
          name: 'idx_gstr_tenant_period',
        });
      } else if (gstrTableDesc.return_period) {
        await addIndexIfNotExists('gstr_returns', ['return_period'], {
          name: 'idx_gstr_period',
        });
      }
    } catch (error) {
      console.log(`ℹ️  Could not add index on gstr_returns: ${error.message}`);
    }

    // Indexes on tds_details - check if columns exist
    try {
      const tdsTableDesc = await queryInterface.describeTable('tds_details');
      if (tdsTableDesc.tenant_id && tdsTableDesc.tds_section) {
        await addIndexIfNotExists('tds_details', ['tenant_id', 'tds_section'], {
          name: 'idx_tds_tenant_section',
        });
      } else if (tdsTableDesc.tds_section) {
        await addIndexIfNotExists('tds_details', ['tds_section'], {
          name: 'idx_tds_section',
        });
      }
    } catch (error) {
      console.log(`ℹ️  Could not add index on tds_details: ${error.message}`);
    }

    // ============================================
    // CREATE DEFAULT LEDGERS
    // ============================================
    try {
      console.log('\n📋 Creating default ledgers...');
      
      // Ensure ledger_name column exists (rename from 'name' if needed)
      try {
        const ledgersTableDesc = await queryInterface.describeTable('ledgers');
        if (ledgersTableDesc.name && !ledgersTableDesc.ledger_name) {
          await queryInterface.renameColumn('ledgers', 'name', 'ledger_name');
          console.log('✓ Renamed ledgers.name to ledgers.ledger_name');
        }
      } catch (renameError) {
        console.log(`ℹ️  Column rename check: ${renameError.message}`);
      }
      
      // Get master database connection to fetch account groups
      const masterSequelize = require('../config/masterDatabase');
      const masterModels = require('../models/masterModels');
      
      // Get account groups from master DB
      const accountGroups = await masterModels.AccountGroup.findAll({
        where: { is_system: true },
      });

      // Create a map of group codes to IDs
      const groupMap = new Map();
      accountGroups.forEach((group) => {
        groupMap.set(group.group_code, group.id);
      });

      // Default ledgers to create
      const defaultLedgers = [
        {
          ledger_name: 'CGST',
          ledger_code: 'CGST-001',
          account_group_code: 'DT', // Duties & Taxes
          balance_type: 'credit',
          opening_balance: 0,
        },
        {
          ledger_name: 'SGST',
          ledger_code: 'SGST-001',
          account_group_code: 'DT', // Duties & Taxes
          balance_type: 'credit',
          opening_balance: 0,
        },
        {
          ledger_name: 'IGST',
          ledger_code: 'IGST-001',
          account_group_code: 'DT', // Duties & Taxes
          balance_type: 'credit',
          opening_balance: 0,
        },
        {
          ledger_name: 'Cash on Hand',
          ledger_code: 'CASH-001',
          account_group_code: 'CASH', // Cash-in-Hand
          balance_type: 'debit',
          opening_balance: 0,
        },
        {
          ledger_name: 'Stock in Hand',
          ledger_code: 'INV-001',
          account_group_code: 'INV', // Stock-in-Hand
          balance_type: 'debit',
          opening_balance: 0,
        },
        {
          ledger_name: 'Sales',
          ledger_code: 'SAL-001',
          account_group_code: 'SAL', // Sales Accounts
          balance_type: 'credit',
          opening_balance: 0,
        },
        {
          ledger_name: 'Purchase',
          ledger_code: 'PUR-001',
          account_group_code: 'PUR', // Purchase Accounts
          balance_type: 'debit',
          opening_balance: 0,
        },
      ];

      // Create each default ledger
      for (const ledgerData of defaultLedgers) {
        const groupId = groupMap.get(ledgerData.account_group_code);
        if (!groupId) {
          console.log(`⚠️  Account group ${ledgerData.account_group_code} not found, skipping ledger ${ledgerData.ledger_name}`);
          continue;
        }

        // Check if ledger already exists - handle both 'name' and 'ledger_name' columns
        let existing = null;
        try {
          const tableDesc = await queryInterface.describeTable('ledgers');
          const nameColumn = tableDesc.ledger_name ? 'ledger_name' : (tableDesc.name ? 'name' : null);
          
          if (nameColumn) {
            // Check by ledger_code first (more reliable)
            const [existingByCode] = await queryInterface.sequelize.query(
              `SELECT id FROM ledgers WHERE ledger_code = :ledger_code LIMIT 1`,
              {
                replacements: { ledger_code: ledgerData.ledger_code },
                type: Sequelize.QueryTypes.SELECT,
              }
            );
            existing = existingByCode;
            
            // Also check by name if code doesn't match
            if (!existing) {
              const [existingByName] = await queryInterface.sequelize.query(
                `SELECT id FROM ledgers WHERE ${nameColumn} = :ledger_name LIMIT 1`,
                {
                  replacements: { ledger_name: ledgerData.ledger_name },
                  type: Sequelize.QueryTypes.SELECT,
                }
              );
              existing = existingByName;
            }
          }
        } catch (e) {
          console.log(`⚠️  Could not check for existing ledger: ${e.message}`);
        }

        if (!existing) {
          // Get table structure
          const tableDesc = await queryInterface.describeTable('ledgers');
          
          // Determine column names - check what actually exists
          let nameColumn = 'ledger_name'; // default
          if (tableDesc.ledger_name) {
            nameColumn = 'ledger_name';
          } else if (tableDesc.name) {
            nameColumn = 'name';
          } else {
            // Neither exists - this shouldn't happen, but try to add ledger_name
            console.log(`⚠️  Neither 'name' nor 'ledger_name' column found, attempting to add ledger_name`);
            try {
              await addColumnIfNotExists('ledgers', 'ledger_name', {
                type: Sequelize.STRING,
                allowNull: false,
              });
              nameColumn = 'ledger_name';
            } catch (addError) {
              console.log(`⚠️  Could not add ledger_name column: ${addError.message}`);
              throw new Error('Cannot create default ledgers: ledger_name column does not exist');
            }
          }
          const hasTenantId = !!tableDesc.tenant_id;
          const hasBalanceType = !!tableDesc.balance_type;
          const hasCurrency = !!tableDesc.currency;

          // Get tenant_id if needed
          let tenantIdValue = null;
          if (hasTenantId) {
            try {
              const [tenantRecord] = await queryInterface.sequelize.query(
                `SELECT tenant_id FROM ledgers LIMIT 1`,
                { type: Sequelize.QueryTypes.SELECT }
              );
              if (tenantRecord && tenantRecord.tenant_id) {
                tenantIdValue = tenantRecord.tenant_id;
              }
            } catch (e) {
              // Ignore
            }
          }

          const now = new Date();

          // Build INSERT query dynamically based on available columns
          const insertFields = ['id', nameColumn, 'ledger_code', 'account_group_id', 'opening_balance', 'opening_balance_type'];
          const insertValues = [
            'UUID()',
            `'${ledgerData.ledger_name.replace(/'/g, "''")}'`,
            `'${ledgerData.ledger_code.replace(/'/g, "''")}'`,
            `'${groupId}'`,
            ledgerData.opening_balance,
            `'${ledgerData.balance_type === 'debit' ? 'Dr' : 'Cr'}'`,
          ];

          // Add optional columns
          if (hasBalanceType) {
            insertFields.push('balance_type');
            insertValues.push(`'${ledgerData.balance_type}'`);
          }
          if (hasCurrency) {
            insertFields.push('currency');
            insertValues.push(`'INR'`);
          }
          
          insertFields.push('is_active', 'createdAt', 'updatedAt');
          insertValues.push('1', `'${now.toISOString().slice(0, 19).replace('T', ' ')}'`, `'${now.toISOString().slice(0, 19).replace('T', ' ')}'`);

          // Add tenant_id if column exists
          if (hasTenantId) {
            insertFields.push('tenant_id');
            if (tenantIdValue) {
              insertValues.push(`'${tenantIdValue}'`);
            } else {
              insertValues.push('UUID()');
            }
          }

          const insertQuery = `INSERT INTO ledgers (${insertFields.map(f => `\`${f}\``).join(', ')}) VALUES (${insertValues.join(', ')})`;

          await queryInterface.sequelize.query(insertQuery, {
            type: Sequelize.QueryTypes.INSERT,
          });

          console.log(`✓ Created default ledger: ${ledgerData.ledger_name}`);
        } else {
          console.log(`ℹ️  Default ledger ${ledgerData.ledger_name} already exists`);
        }
      }

      console.log('✅ Default ledgers creation completed');
    } catch (error) {
      console.log(`⚠️  Could not create default ledgers: ${error.message}`);
      // Don't fail migration if default ledgers fail
    }
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('warehouse_stocks');
    await queryInterface.dropTable('warehouses');
    await queryInterface.dropTable('stock_movements');
    await queryInterface.dropTable('inventory_items');
    await queryInterface.dropTable('e_invoices');
    await queryInterface.dropTable('tds_details');
    await queryInterface.dropTable('gstr_returns');
    await queryInterface.dropTable('gstins');
    await queryInterface.dropTable('gst_rates');
    await queryInterface.dropTable('bill_allocations');
    await queryInterface.dropTable('bill_wise_details');
    await queryInterface.dropTable('voucher_ledger_entries');
    await queryInterface.dropTable('voucher_items');
    await queryInterface.dropTable('vouchers');
    await queryInterface.dropTable('voucher_types');
    await queryInterface.dropTable('ledgers');
    await queryInterface.dropTable('account_groups');
  },
};
