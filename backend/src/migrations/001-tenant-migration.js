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
 * - Product Attributes: product_attributes, product_attribute_values
 * - Audit: audit_logs
 * 
 * IMPORTANT: This migration runs on each tenant database separately
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to safely add column
    const addColumnIfNotExists = async (tableName, columnName, columnDefinition) => {
      try {
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

    // ... (existing user management, accounting, bill management, GST/TDS tables)
    
    // ============================================
    // USER MANAGEMENT TABLE
    // ============================================

    // USERS TABLE (tenant-specific users: accountants, viewers, etc.)
    const [usersTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'users'");
    if (usersTable.length === 0) {
      await queryInterface.createTable('users', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        password: { type: Sequelize.STRING, allowNull: false },
        name: { type: Sequelize.STRING, allowNull: true }, // Add name field
        first_name: { type: Sequelize.STRING, allowNull: false },
        last_name: { type: Sequelize.STRING, allowNull: false },
        role: { type: Sequelize.ENUM('tenant_admin', 'user', 'accountant'), defaultValue: 'user' },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        last_login: { type: Sequelize.DATE, allowNull: true },
        email_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
        email_verified_at: { type: Sequelize.DATE, allowNull: true },
        phone: { type: Sequelize.STRING, allowNull: true },
        profile_image: { type: Sequelize.STRING, allowNull: true },
        preferences: { type: Sequelize.JSON, allowNull: true },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        created_by: { type: Sequelize.UUID, allowNull: true },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('users', ['email'], { name: 'idx_users_email', unique: true });
      await addIndexIfNotExists('users', ['tenant_id'], { name: 'idx_users_tenant_id' });
      console.log('✓ Created table users');
    } else {
      console.log('ℹ️  Table users already exists');
    }

    // ============================================
    // ACCOUNTING TABLES
    // ============================================

    // LEDGERS TABLE
    const [ledgersTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'ledgers'");
    if (ledgersTable.length === 0) {
      await queryInterface.createTable('ledgers', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        ledger_name: { type: Sequelize.STRING, allowNull: false },
        ledger_code: { type: Sequelize.STRING, allowNull: true },
        account_group_id: { type: Sequelize.UUID, allowNull: false },
        opening_balance: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        opening_balance_type: { type: Sequelize.ENUM('Dr', 'Cr'), defaultValue: 'Dr' },
        balance_type: { type: Sequelize.ENUM('debit', 'credit'), defaultValue: 'debit' },
        current_balance: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        credit_limit: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        credit_days: { type: Sequelize.INTEGER, defaultValue: 0 },
        address: { type: Sequelize.TEXT, allowNull: true },
        city: { type: Sequelize.STRING, allowNull: true },
        state: { type: Sequelize.STRING, allowNull: true },
        pincode: { type: Sequelize.STRING, allowNull: true },
        country: { type: Sequelize.STRING, defaultValue: 'India' },
        gstin: { type: Sequelize.STRING, allowNull: true },
        pan: { type: Sequelize.STRING, allowNull: true },
        email: { type: Sequelize.STRING, allowNull: true },
        contact_number: { type: Sequelize.STRING, allowNull: true },
        bank_name: { type: Sequelize.STRING, allowNull: true },
        bank_account_number: { type: Sequelize.STRING(100), allowNull: true },
        bank_ifsc: { type: Sequelize.STRING(20), allowNull: true },
        bank_branch: { type: Sequelize.STRING, allowNull: true },
        is_default: { type: Sequelize.BOOLEAN, defaultValue: false },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('ledgers', ['tenant_id'], { name: 'idx_ledgers_tenant_id' });
      await addIndexIfNotExists('ledgers', ['account_group_id'], { name: 'idx_ledgers_account_group_id' });
      console.log('✓ Created table ledgers');
    } else {
      console.log('ℹ️  Table ledgers already exists');
      
      // Add missing columns if they don't exist
      try {
        const tableDesc = await queryInterface.describeTable('ledgers');
        
        if (!tableDesc.opening_balance_type) {
          await queryInterface.addColumn('ledgers', 'opening_balance_type', {
            type: Sequelize.ENUM('Dr', 'Cr'),
            defaultValue: 'Dr',
          });
          console.log('✓ Added opening_balance_type column to ledgers');
        }
        
        if (!tableDesc.balance_type) {
          await queryInterface.addColumn('ledgers', 'balance_type', {
            type: Sequelize.ENUM('debit', 'credit'),
            defaultValue: 'debit',
          });
          console.log('✓ Added balance_type column to ledgers');
        }

        if (!tableDesc.credit_limit) {
          await queryInterface.addColumn('ledgers', 'credit_limit', {
            type: Sequelize.DECIMAL(15, 2),
            defaultValue: 0,
          });
          console.log('✓ Added credit_limit column to ledgers');
        }

        if (!tableDesc.credit_days) {
          await queryInterface.addColumn('ledgers', 'credit_days', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
          });
          console.log('✓ Added credit_days column to ledgers');
        }

        if (!tableDesc.bank_name) {
          await queryInterface.addColumn('ledgers', 'bank_name', {
            type: Sequelize.STRING,
            allowNull: true,
          });
          console.log('✓ Added bank_name column to ledgers');
        }

        if (!tableDesc.bank_account_number) {
          await queryInterface.addColumn('ledgers', 'bank_account_number', {
            type: Sequelize.STRING(100),
            allowNull: true,
          });
          console.log('✓ Added bank_account_number column to ledgers');
        }

        if (!tableDesc.bank_ifsc) {
          await queryInterface.addColumn('ledgers', 'bank_ifsc', {
            type: Sequelize.STRING(20),
            allowNull: true,
          });
          console.log('✓ Added bank_ifsc column to ledgers');
        }

        if (!tableDesc.bank_branch) {
          await queryInterface.addColumn('ledgers', 'bank_branch', {
            type: Sequelize.STRING,
            allowNull: true,
          });
          console.log('✓ Added bank_branch column to ledgers');
        }
      } catch (error) {
        console.log('⚠️  Could not check/add columns to ledgers:', error.message);
      }
    }

    // VOUCHERS TABLE
    const [vouchersTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'vouchers'");
    if (vouchersTable.length === 0) {
      await queryInterface.createTable('vouchers', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        voucher_number: { type: Sequelize.STRING, allowNull: false },
        voucher_type: { type: Sequelize.STRING, allowNull: false },
        voucher_date: { type: Sequelize.DATE, allowNull: false },
        party_ledger_id: { type: Sequelize.UUID, allowNull: true },
        total_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        narration: { type: Sequelize.TEXT, allowNull: true },
        status: { type: Sequelize.ENUM('draft', 'posted', 'cancelled'), defaultValue: 'draft' },
        reference_number: { type: Sequelize.STRING, allowNull: true },
        due_date: { type: Sequelize.DATE, allowNull: true },
        // Export Invoice fields
        currency_code: { type: Sequelize.STRING(3), allowNull: true, defaultValue: 'INR', comment: 'Currency code for foreign currency invoices (ISO 4217 format: USD, EUR, GBP, etc.)' },
        exchange_rate: { type: Sequelize.DECIMAL(15, 6), allowNull: true, defaultValue: 1.0, comment: 'Exchange rate to convert foreign currency to base currency (INR)' },
        shipping_bill_number: { type: Sequelize.STRING(50), allowNull: true, comment: 'Shipping bill number for export invoices' },
        shipping_bill_date: { type: Sequelize.DATE, allowNull: true, comment: 'Date of shipping bill for export invoices' },
        port_of_loading: { type: Sequelize.STRING(100), allowNull: true, comment: 'Port from which goods are shipped for export' },
        destination_country: { type: Sequelize.STRING(100), allowNull: true, comment: 'Destination country for export invoices' },
        has_lut: { type: Sequelize.BOOLEAN, defaultValue: false, comment: 'Whether LUT (Letter of Undertaking) is present for zero-rated GST on exports' },
        // Delivery Challan fields
        purpose: { type: Sequelize.ENUM('job_work', 'stock_transfer', 'sample'), allowNull: true, comment: 'Purpose of delivery challan (job_work, stock_transfer, sample)' },
        converted_to_invoice_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'vouchers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL', comment: 'Reference to sales invoice if this voucher was converted' },
        // Proforma Invoice fields
        validity_period: { type: Sequelize.INTEGER, allowNull: true, comment: 'Number of days the proforma invoice is valid (e.g., 30, 60, 90 days)' },
        valid_until: { type: Sequelize.DATE, allowNull: true, comment: 'Calculated date when the proforma invoice expires (voucher_date + validity_period)' },
        // Supplier Invoice fields (for purchase invoices)
        supplier_invoice_number: { type: Sequelize.STRING(100), allowNull: true, comment: 'Supplier invoice number for purchase invoices' },
        supplier_invoice_date: { type: Sequelize.DATE, allowNull: true, comment: 'Supplier invoice date for purchase invoices' },
        // Company and Branch isolation
        company_id: { type: Sequelize.UUID, allowNull: true, comment: 'Company ID for explicit company-level isolation' },
        branch_id: { type: Sequelize.UUID, allowNull: true, comment: 'Branch ID for explicit branch-level isolation' },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        created_by: { type: Sequelize.UUID, allowNull: true },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('vouchers', ['tenant_id'], { name: 'idx_vouchers_tenant_id' });
      await addIndexIfNotExists('vouchers', ['voucher_number', 'tenant_id'], { name: 'idx_vouchers_number_tenant', unique: true });
      await addIndexIfNotExists('vouchers', ['converted_to_invoice_id'], { name: 'idx_vouchers_converted_to_invoice_id' });
      await addIndexIfNotExists('vouchers', ['purpose'], { name: 'idx_vouchers_purpose' });
      await addIndexIfNotExists('vouchers', ['valid_until'], { name: 'idx_vouchers_valid_until' });
      await addIndexIfNotExists('vouchers', ['tenant_id', 'company_id'], { name: 'idx_vouchers_tenant_company' });
      await addIndexIfNotExists('vouchers', ['tenant_id', 'company_id', 'branch_id'], { name: 'idx_vouchers_tenant_company_branch' });
      await addIndexIfNotExists('vouchers', ['company_id', 'voucher_date'], { name: 'idx_vouchers_company_date' });
      await addIndexIfNotExists('vouchers', ['branch_id', 'voucher_date'], { name: 'idx_vouchers_branch_date' });
      console.log('✓ Created table vouchers');
    } else {
      console.log('ℹ️  Table vouchers already exists');
      
      // Add export invoice fields if they don't exist
      await addColumnIfNotExists('vouchers', 'currency_code', { type: Sequelize.STRING(3), allowNull: true, defaultValue: 'INR', comment: 'Currency code for foreign currency invoices (ISO 4217 format: USD, EUR, GBP, etc.)' });
      await addColumnIfNotExists('vouchers', 'exchange_rate', { type: Sequelize.DECIMAL(15, 6), allowNull: true, defaultValue: 1.0, comment: 'Exchange rate to convert foreign currency to base currency (INR)' });
      await addColumnIfNotExists('vouchers', 'shipping_bill_number', { type: Sequelize.STRING(50), allowNull: true, comment: 'Shipping bill number for export invoices' });
      await addColumnIfNotExists('vouchers', 'shipping_bill_date', { type: Sequelize.DATE, allowNull: true, comment: 'Date of shipping bill for export invoices' });
      await addColumnIfNotExists('vouchers', 'port_of_loading', { type: Sequelize.STRING(100), allowNull: true, comment: 'Port from which goods are shipped for export' });
      await addColumnIfNotExists('vouchers', 'destination_country', { type: Sequelize.STRING(100), allowNull: true, comment: 'Destination country for export invoices' });
      await addColumnIfNotExists('vouchers', 'has_lut', { type: Sequelize.BOOLEAN, defaultValue: false, comment: 'Whether LUT (Letter of Undertaking) is present for zero-rated GST on exports' });
      
      // Add delivery challan fields if they don't exist
      await addColumnIfNotExists('vouchers', 'purpose', { type: Sequelize.ENUM('job_work', 'stock_transfer', 'sample'), allowNull: true, comment: 'Purpose of delivery challan (job_work, stock_transfer, sample)' });
      await addColumnIfNotExists('vouchers', 'converted_to_invoice_id', { type: Sequelize.UUID, allowNull: true, references: { model: 'vouchers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL', comment: 'Reference to sales invoice if this voucher was converted' });
      
      // Add proforma invoice fields if they don't exist
      await addColumnIfNotExists('vouchers', 'validity_period', { type: Sequelize.INTEGER, allowNull: true, comment: 'Number of days the proforma invoice is valid (e.g., 30, 60, 90 days)' });
      await addColumnIfNotExists('vouchers', 'valid_until', { type: Sequelize.DATE, allowNull: true, comment: 'Calculated date when the proforma invoice expires (voucher_date + validity_period)' });
      
      // Add supplier invoice fields if they don't exist
      await addColumnIfNotExists('vouchers', 'supplier_invoice_number', { type: Sequelize.STRING(100), allowNull: true, comment: 'Supplier invoice number for purchase invoices' });
      await addColumnIfNotExists('vouchers', 'supplier_invoice_date', { type: Sequelize.DATE, allowNull: true, comment: 'Supplier invoice date for purchase invoices' });
      
      // Add company and branch isolation fields if they don't exist
      await addColumnIfNotExists('vouchers', 'company_id', { type: Sequelize.UUID, allowNull: true, comment: 'Company ID for explicit company-level isolation' });
      await addColumnIfNotExists('vouchers', 'branch_id', { type: Sequelize.UUID, allowNull: true, comment: 'Branch ID for explicit branch-level isolation' });
      
      // Add indexes if they don't exist
      await addIndexIfNotExists('vouchers', ['converted_to_invoice_id'], { name: 'idx_vouchers_converted_to_invoice_id' });
      await addIndexIfNotExists('vouchers', ['purpose'], { name: 'idx_vouchers_purpose' });
      await addIndexIfNotExists('vouchers', ['valid_until'], { name: 'idx_vouchers_valid_until' });
      await addIndexIfNotExists('vouchers', ['tenant_id', 'company_id'], { name: 'idx_vouchers_tenant_company' });
      await addIndexIfNotExists('vouchers', ['tenant_id', 'company_id', 'branch_id'], { name: 'idx_vouchers_tenant_company_branch' });
      await addIndexIfNotExists('vouchers', ['company_id', 'voucher_date'], { name: 'idx_vouchers_company_date' });
      await addIndexIfNotExists('vouchers', ['branch_id', 'voucher_date'], { name: 'idx_vouchers_branch_date' });
    }

    // VOUCHER_ITEMS TABLE
    const [voucherItemsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'voucher_items'");
    if (voucherItemsTable.length === 0) {
      await queryInterface.createTable('voucher_items', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        voucher_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vouchers', key: 'id' }, onDelete: 'CASCADE' },
        inventory_item_id: { type: Sequelize.UUID, allowNull: true },
        barcode: { type: Sequelize.STRING(100), allowNull: true },
        item_code: { type: Sequelize.STRING(100), allowNull: true },
        item_name: { type: Sequelize.STRING(500), allowNull: true },
        item_description: { type: Sequelize.STRING, allowNull: false },
        quantity: { type: Sequelize.DECIMAL(15, 3), defaultValue: 1 },
        uqc: { type: Sequelize.STRING(20), allowNull: true },
        rate: { type: Sequelize.DECIMAL(15, 4), allowNull: false },
        discount_percentage: { type: Sequelize.DECIMAL(6, 2), defaultValue: 0 },
        discount_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        taxable_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        hsn_sac_code: { type: Sequelize.STRING, allowNull: true },
        gst_rate: { type: Sequelize.DECIMAL(6, 2), defaultValue: 0 },
        cgst_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        sgst_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        igst_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        cess_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        variant_attributes: { type: Sequelize.JSON, allowNull: true, comment: 'Variant attributes for the item' },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('voucher_items', ['voucher_id'], { name: 'idx_voucher_items_voucher_id' });
      await addIndexIfNotExists('voucher_items', ['tenant_id'], { name: 'idx_voucher_items_tenant_id' });
      console.log('✓ Created table voucher_items');
    } else {
      console.log('ℹ️  Table voucher_items already exists');
    }

    // VOUCHER_LEDGER_ENTRIES TABLE
    const [voucherLedgerEntriesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'voucher_ledger_entries'");
    if (voucherLedgerEntriesTable.length === 0) {
      await queryInterface.createTable('voucher_ledger_entries', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        voucher_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vouchers', key: 'id' }, onDelete: 'CASCADE' },
        ledger_id: { type: Sequelize.UUID, allowNull: false },
        debit_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        credit_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        narration: { type: Sequelize.TEXT, allowNull: true },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('voucher_ledger_entries', ['voucher_id'], { name: 'idx_voucher_ledger_entries_voucher_id' });
      await addIndexIfNotExists('voucher_ledger_entries', ['ledger_id'], { name: 'idx_voucher_ledger_entries_ledger_id' });
      await addIndexIfNotExists('voucher_ledger_entries', ['tenant_id'], { name: 'idx_voucher_ledger_entries_tenant_id' });
      console.log('✓ Created table voucher_ledger_entries');
    } else {
      console.log('ℹ️  Table voucher_ledger_entries already exists');
    }

    // ============================================
    // INVENTORY & PRODUCT TABLES
    // ============================================

    // INVENTORY_ITEMS TABLE
    const [inventoryItemsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'inventory_items'");
    if (inventoryItemsTable.length === 0) {
      await queryInterface.createTable('inventory_items', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        item_key: { type: Sequelize.STRING(300), allowNull: false, unique: true },
        item_code: Sequelize.STRING(100),
        item_name: { type: Sequelize.STRING(500), allowNull: false },
        barcode: { type: Sequelize.STRING(100), allowNull: true, unique: true, comment: 'Product barcode (EAN-13, UPC, etc.)' },
        parent_item_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'inventory_items', key: 'id' }, onDelete: 'SET NULL' },
        attributes: { type: Sequelize.JSON, allowNull: true, comment: 'JSON object for variant attributes, e.g. {"Size": "M", "Color": "Blue"}' },
        hsn_sac_code: Sequelize.STRING(20),
        uqc: Sequelize.STRING(20),
        gst_rate: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
        quantity_on_hand: { type: Sequelize.DECIMAL(15, 3), defaultValue: 0 },
        avg_cost: { type: Sequelize.DECIMAL(15, 4), defaultValue: 0 },
        mrp: { type: Sequelize.DECIMAL(15, 2), allowNull: true, comment: 'Maximum Retail Price' },
        selling_price: { type: Sequelize.DECIMAL(15, 2), allowNull: true, comment: 'Default selling price' },
        purchase_price: { type: Sequelize.DECIMAL(15, 2), allowNull: true, comment: 'Last purchase price' },
        reorder_level: { type: Sequelize.DECIMAL(15, 3), defaultValue: 0, comment: 'Minimum stock level before reorder' },
        reorder_quantity: { type: Sequelize.DECIMAL(15, 3), defaultValue: 0, comment: 'Quantity to reorder when stock falls below reorder level' },
        is_serialized: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Whether this item requires individual unit tracking with unique barcodes' },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      console.log('✓ Created table inventory_items');
    } else {
      await addColumnIfNotExists('inventory_items', 'barcode', { type: Sequelize.STRING(100), allowNull: true, unique: true, comment: 'Product barcode (EAN-13, UPC, etc.)'});
      await addColumnIfNotExists('inventory_items', 'attributes', { type: Sequelize.JSON, allowNull: true, comment: 'JSON object for variant attributes, e.g. {"Size": "M", "Color": "Blue"}' });
      await addColumnIfNotExists('inventory_items', 'parent_item_id', { type: Sequelize.UUID, allowNull: true, references: { model: 'inventory_items', key: 'id' }, onDelete: 'SET NULL' });
      await addColumnIfNotExists('inventory_items', 'is_serialized', { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Whether this item requires individual unit tracking with unique barcodes' });
      await addColumnIfNotExists('inventory_items', 'mrp', { type: Sequelize.DECIMAL(15, 2), allowNull: true, comment: 'Maximum Retail Price' });
      await addColumnIfNotExists('inventory_items', 'selling_price', { type: Sequelize.DECIMAL(15, 2), allowNull: true, comment: 'Default selling price' });
      await addColumnIfNotExists('inventory_items', 'purchase_price', { type: Sequelize.DECIMAL(15, 2), allowNull: true, comment: 'Last purchase price' });
      await addColumnIfNotExists('inventory_items', 'reorder_level', { type: Sequelize.DECIMAL(15, 3), defaultValue: 0, comment: 'Minimum stock level before reorder' });
      await addColumnIfNotExists('inventory_items', 'reorder_quantity', { type: Sequelize.DECIMAL(15, 3), defaultValue: 0, comment: 'Quantity to reorder when stock falls below reorder level' });
      
      // Remove old column names if they exist
      try {
        const tableDesc = await queryInterface.describeTable('inventory_items');
        
        if (tableDesc.variant_attributes && !tableDesc.attributes) {
          // Rename variant_attributes to attributes
          await queryInterface.renameColumn('inventory_items', 'variant_attributes', 'attributes');
          console.log('✓ Renamed variant_attributes to attributes in inventory_items');
        }
        
        if (tableDesc.variant_of_id && !tableDesc.parent_item_id) {
          // Rename variant_of_id to parent_item_id
          await queryInterface.renameColumn('inventory_items', 'variant_of_id', 'parent_item_id');
          console.log('✓ Renamed variant_of_id to parent_item_id in inventory_items');
        }
      } catch (error) {
        console.log('⚠️  Could not rename columns in inventory_items:', error.message);
      }
    }

    // INVENTORY_UNITS TABLE (for serialized inventory tracking)
    const [inventoryUnitsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'inventory_units'");
    if (inventoryUnitsTable.length === 0) {
      await queryInterface.createTable('inventory_units', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        inventory_item_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'inventory_items', key: 'id' }, onDelete: 'CASCADE' },
        unit_barcode: { type: Sequelize.STRING(100), allowNull: false, unique: true, comment: 'Unique barcode for this individual unit' },
        serial_number: { type: Sequelize.STRING(100), allowNull: true, comment: 'Manufacturer serial number (optional)' },
        imei_number: { type: Sequelize.STRING(50), allowNull: true, comment: 'IMEI for mobile devices (optional)' },
        status: { type: Sequelize.ENUM('in_stock', 'sold', 'damaged', 'returned', 'transferred'), defaultValue: 'in_stock', allowNull: false },
        warehouse_id: { type: Sequelize.UUID, allowNull: true }, // Foreign key will be added after warehouses table is created
        purchase_voucher_id: { type: Sequelize.UUID, allowNull: true, comment: 'Voucher ID when this unit was purchased' },
        purchase_date: { type: Sequelize.DATE, allowNull: true },
        purchase_rate: { type: Sequelize.DECIMAL(15, 2), allowNull: true, comment: 'Purchase price of this specific unit' },
        sales_voucher_id: { type: Sequelize.UUID, allowNull: true, comment: 'Voucher ID when this unit was sold' },
        sales_date: { type: Sequelize.DATE, allowNull: true },
        sales_rate: { type: Sequelize.DECIMAL(15, 2), allowNull: true, comment: 'Sales price of this specific unit' },
        warranty_expiry: { type: Sequelize.DATE, allowNull: true, comment: 'Warranty expiry date' },
        notes: { type: Sequelize.TEXT, allowNull: true, comment: 'Additional notes about this unit' },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('inventory_units', ['inventory_item_id'], { name: 'idx_inventory_units_item_id' });
      await addIndexIfNotExists('inventory_units', ['status'], { name: 'idx_inventory_units_status' });
      await addIndexIfNotExists('inventory_units', ['warehouse_id'], { name: 'idx_inventory_units_warehouse_id' });
      await addIndexIfNotExists('inventory_units', ['purchase_voucher_id'], { name: 'idx_inventory_units_purchase_voucher_id' });
      await addIndexIfNotExists('inventory_units', ['sales_voucher_id'], { name: 'idx_inventory_units_sales_voucher_id' });
      await addIndexIfNotExists('inventory_units', ['tenant_id'], { name: 'idx_inventory_units_tenant_id' });
      console.log('✓ Created table inventory_units');
    } else {
      console.log('ℹ️  Table inventory_units already exists');
    }

    // PRODUCT_ATTRIBUTES TABLE
    const [productAttributesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'product_attributes'");
    if (productAttributesTable.length === 0) {
      await queryInterface.createTable('product_attributes', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        name: { type: Sequelize.STRING, allowNull: false },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('product_attributes', ['tenant_id', 'name'], { name: 'idx_tenant_attribute_name_unique', unique: true });
      console.log('✓ Created table product_attributes');
    } else {
      console.log('ℹ️  Table product_attributes already exists');
    }

    // PRODUCT_ATTRIBUTE_VALUES TABLE
    const [productAttributeValuesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'product_attribute_values'");
    if (productAttributeValuesTable.length === 0) {
      await queryInterface.createTable('product_attribute_values', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        product_attribute_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'product_attributes', key: 'id' }, onDelete: 'CASCADE' },
        value: { type: Sequelize.STRING, allowNull: false },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('product_attribute_values', ['product_attribute_id', 'value', 'tenant_id'], { name: 'idx_attribute_value_tenant_unique', unique: true });
      console.log('✓ Created table product_attribute_values');
    } else {
      console.log('ℹ️  Table product_attribute_values already exists');
    }
    
    // ============================================
    // ADDITIONAL TABLES
    // ============================================

    // WAREHOUSES TABLE
    const [warehousesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'warehouses'");
    if (warehousesTable.length === 0) {
      await queryInterface.createTable('warehouses', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        warehouse_name: { type: Sequelize.STRING, allowNull: false },
        warehouse_code: { type: Sequelize.STRING, allowNull: true },
        address: { type: Sequelize.TEXT, allowNull: true },
        city: { type: Sequelize.STRING, allowNull: true },
        state: { type: Sequelize.STRING, allowNull: true },
        pincode: { type: Sequelize.STRING, allowNull: true },
        is_default: { type: Sequelize.BOOLEAN, defaultValue: false },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('warehouses', ['tenant_id'], { name: 'idx_warehouses_tenant_id' });
      console.log('✓ Created table warehouses');
      
      // Now add foreign key constraint to inventory_units table
      try {
        const [inventoryUnitsExists] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'inventory_units'");
        if (inventoryUnitsExists.length > 0) {
          await queryInterface.addConstraint('inventory_units', {
            fields: ['warehouse_id'],
            type: 'foreign key',
            name: 'fk_inventory_units_warehouse',
            references: {
              table: 'warehouses',
              field: 'id'
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
          });
          console.log('✓ Added foreign key constraint from inventory_units to warehouses');
        }
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error('⚠️  Warning: Could not add foreign key constraint:', error.message);
        }
      }
    } else {
      console.log('ℹ️  Table warehouses already exists');
    }

    // STOCK_MOVEMENTS TABLE
    const [stockMovementsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'stock_movements'");
    if (stockMovementsTable.length === 0) {
      await queryInterface.createTable('stock_movements', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        inventory_item_id: { type: Sequelize.UUID, allowNull: false },
        warehouse_id: { type: Sequelize.UUID, allowNull: true },
        voucher_id: { type: Sequelize.UUID, allowNull: true },
        movement_type: { type: Sequelize.ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'), allowNull: false }, // Fixed: uppercase enum values
        quantity: { type: Sequelize.DECIMAL(15, 3), allowNull: false },
        rate: { type: Sequelize.DECIMAL(15, 4), defaultValue: 0 },
        amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 }, // Added: missing amount column
        reference_number: { type: Sequelize.STRING, allowNull: true },
        narration: { type: Sequelize.TEXT, allowNull: true },
        movement_date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('stock_movements', ['inventory_item_id'], { name: 'idx_stock_movements_item_id' });
      await addIndexIfNotExists('stock_movements', ['tenant_id'], { name: 'idx_stock_movements_tenant_id' });
      console.log('✓ Created table stock_movements');
    } else {
      console.log('ℹ️  Table stock_movements already exists');
      
      // Add missing amount column if it doesn't exist
      await addColumnIfNotExists('stock_movements', 'amount', {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      });
      
      // Fix movement_type enum values if needed
      try {
        const [enumInfo] = await queryInterface.sequelize.query(`
          SELECT COLUMN_TYPE 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'stock_movements' 
          AND COLUMN_NAME = 'movement_type'
          AND TABLE_SCHEMA = DATABASE()
        `);
        
        if (enumInfo.length > 0) {
          const currentEnum = enumInfo[0].COLUMN_TYPE;
          if (currentEnum.includes("'in'") || currentEnum.includes("'out'")) {
            await queryInterface.changeColumn('stock_movements', 'movement_type', {
              type: Sequelize.ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'),
              allowNull: false,
            });
            console.log('✓ Updated movement_type enum values to uppercase in stock_movements');
          }
        }
      } catch (error) {
        console.log('⚠️  Could not update movement_type enum in stock_movements:', error.message);
      }
    }

    // WAREHOUSE_STOCKS TABLE
    const [warehouseStocksTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'warehouse_stocks'");
    if (warehouseStocksTable.length === 0) {
      await queryInterface.createTable('warehouse_stocks', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        warehouse_id: { type: Sequelize.UUID, allowNull: false },
        inventory_item_id: { type: Sequelize.UUID, allowNull: false },
        quantity: { type: Sequelize.DECIMAL(15, 3), defaultValue: 0 }, // Fixed: use 'quantity' instead of 'quantity_on_hand'
        avg_cost: { type: Sequelize.DECIMAL(15, 4), defaultValue: 0 },
        last_updated: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('warehouse_stocks', ['warehouse_id', 'inventory_item_id'], { name: 'idx_warehouse_stocks_unique', unique: true });
      await addIndexIfNotExists('warehouse_stocks', ['tenant_id'], { name: 'idx_warehouse_stocks_tenant_id' });
      console.log('✓ Created table warehouse_stocks');
    } else {
      console.log('ℹ️  Table warehouse_stocks already exists');
      
      // Fix existing table: rename quantity_on_hand to quantity if needed
      try {
        const tableDesc = await queryInterface.describeTable('warehouse_stocks');
        if (tableDesc.quantity_on_hand && !tableDesc.quantity) {
          await queryInterface.renameColumn('warehouse_stocks', 'quantity_on_hand', 'quantity');
          console.log('✓ Renamed quantity_on_hand to quantity in warehouse_stocks');
        }
      } catch (error) {
        console.log('⚠️  Could not rename column in warehouse_stocks:', error.message);
      }
    }

    // AUDIT_LOGS TABLE
    const [auditLogsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'audit_logs'");
    if (auditLogsTable.length === 0) {
      await queryInterface.createTable('audit_logs', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        table_name: { type: Sequelize.STRING, allowNull: false },
        record_id: { type: Sequelize.STRING, allowNull: false },
        action: { type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE'), allowNull: false },
        old_values: { type: Sequelize.JSON, allowNull: true },
        new_values: { type: Sequelize.JSON, allowNull: true },
        user_id: { type: Sequelize.UUID, allowNull: true },
        ip_address: { type: Sequelize.STRING, allowNull: true },
        user_agent: { type: Sequelize.TEXT, allowNull: true },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('audit_logs', ['table_name', 'record_id'], { name: 'idx_audit_logs_table_record' });
      await addIndexIfNotExists('audit_logs', ['tenant_id'], { name: 'idx_audit_logs_tenant_id' });
      console.log('✓ Created table audit_logs');
    } else {
      console.log('ℹ️  Table audit_logs already exists');
    }

    // ============================================
    // GST & COMPLIANCE TABLES
    // ============================================

    // GSTINS TABLE
    const [gstinsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'gstins'");
    if (gstinsTable.length === 0) {
      await queryInterface.createTable('gstins', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        gstin: { type: Sequelize.STRING(15), allowNull: false, unique: true },
        legal_name: { type: Sequelize.STRING, allowNull: false },
        trade_name: { type: Sequelize.STRING, allowNull: true },
        address: { type: Sequelize.TEXT, allowNull: true },
        state: { type: Sequelize.STRING, allowNull: true },
        state_code: { type: Sequelize.STRING(2), allowNull: false },
        gstin_status: { type: Sequelize.STRING, allowNull: true, comment: 'GSTIN status (active, cancelled, etc.)' },
        is_primary: { type: Sequelize.BOOLEAN, defaultValue: false, comment: 'Whether this is the primary GSTIN for the tenant' },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('gstins', ['gstin'], { name: 'idx_gstins_gstin', unique: true });
      await addIndexIfNotExists('gstins', ['tenant_id'], { name: 'idx_gstins_tenant_id' });
      console.log('✓ Created table gstins');
    } else {
      console.log('ℹ️  Table gstins already exists');
      
      // Add missing columns if they don't exist
      try {
        const tableDesc = await queryInterface.describeTable('gstins');
        
        if (!tableDesc.state) {
          await queryInterface.addColumn('gstins', 'state', {
            type: Sequelize.STRING,
            allowNull: true,
          });
          console.log('✓ Added state column to gstins');
        }
        
        if (!tableDesc.gstin_status) {
          await queryInterface.addColumn('gstins', 'gstin_status', {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'GSTIN status (active, cancelled, etc.)',
          });
          console.log('✓ Added gstin_status column to gstins');
        }
        
        if (!tableDesc.is_primary) {
          await queryInterface.addColumn('gstins', 'is_primary', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this is the primary GSTIN for the tenant',
          });
          console.log('✓ Added is_primary column to gstins');
        }
        
        if (!tableDesc.is_active) {
          await queryInterface.addColumn('gstins', 'is_active', {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
          });
          console.log('✓ Added is_active column to gstins');
        }
        
        // Remove status column if it exists (replaced by is_active)
        if (tableDesc.status) {
          await queryInterface.removeColumn('gstins', 'status');
          console.log('✓ Removed status column from gstins (replaced by is_active)');
        }
        
        // Remove registration_date column if it exists (not in model)
        if (tableDesc.registration_date) {
          await queryInterface.removeColumn('gstins', 'registration_date');
          console.log('✓ Removed registration_date column from gstins (not in model)');
        }
      } catch (error) {
        console.log('⚠️  Could not check/modify columns in gstins:', error.message);
      }
    }

    // BILLWISE_DETAILS TABLE
    const [billwiseDetailsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'billwise_details'");
    if (billwiseDetailsTable.length === 0) {
      await queryInterface.createTable('billwise_details', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        voucher_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vouchers', key: 'id' }, onDelete: 'CASCADE' },
        ledger_id: { type: Sequelize.UUID, allowNull: false },
        bill_number: { type: Sequelize.STRING, allowNull: true },
        bill_date: { type: Sequelize.DATE, allowNull: true },
        bill_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        pending_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        is_fully_paid: { type: Sequelize.BOOLEAN, defaultValue: false },
        due_date: { type: Sequelize.DATE, allowNull: true },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('billwise_details', ['voucher_id'], { name: 'idx_billwise_details_voucher_id' });
      await addIndexIfNotExists('billwise_details', ['ledger_id'], { name: 'idx_billwise_details_ledger_id' });
      await addIndexIfNotExists('billwise_details', ['tenant_id'], { name: 'idx_billwise_details_tenant_id' });
      console.log('✓ Created table billwise_details');
    } else {
      console.log('ℹ️  Table billwise_details already exists');
      
      // Add missing columns if they don't exist
      try {
        const tableDesc = await queryInterface.describeTable('billwise_details');
        
        if (!tableDesc.is_fully_paid) {
          await queryInterface.addColumn('billwise_details', 'is_fully_paid', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          });
          console.log('✓ Added is_fully_paid column to billwise_details');
        }
      } catch (error) {
        console.log('⚠️  Could not check/add columns to billwise_details:', error.message);
      }
    }

    // BILL_ALLOCATIONS TABLE
    const [billAllocationsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'bill_allocations'");
    if (billAllocationsTable.length === 0) {
      await queryInterface.createTable('bill_allocations', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        payment_voucher_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vouchers', key: 'id' }, onDelete: 'CASCADE' },
        bill_detail_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'billwise_details', key: 'id' }, onDelete: 'CASCADE' },
        allocated_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        allocation_date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('bill_allocations', ['payment_voucher_id'], { name: 'idx_bill_allocations_payment_voucher_id' });
      await addIndexIfNotExists('bill_allocations', ['bill_detail_id'], { name: 'idx_bill_allocations_bill_detail_id' });
      await addIndexIfNotExists('bill_allocations', ['tenant_id'], { name: 'idx_bill_allocations_tenant_id' });
      console.log('✓ Created table bill_allocations');
    } else {
      console.log('ℹ️  Table bill_allocations already exists');
    }

    // GSTR_RETURNS TABLE
    const [gstrReturnsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'gstr_returns'");
    if (gstrReturnsTable.length === 0) {
      await queryInterface.createTable('gstr_returns', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        return_type: { type: Sequelize.STRING, allowNull: false },
        return_period: { type: Sequelize.STRING, allowNull: false },
        gstin: { type: Sequelize.STRING, allowNull: false },
        status: { type: Sequelize.ENUM('draft', 'filed', 'cancelled'), defaultValue: 'draft' },
        filing_date: { type: Sequelize.DATE, allowNull: true },
        acknowledgment_number: { type: Sequelize.STRING, allowNull: true },
        return_data: { type: Sequelize.JSON, allowNull: true },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('gstr_returns', ['return_type', 'return_period', 'gstin'], { name: 'idx_gstr_returns_unique', unique: true });
      await addIndexIfNotExists('gstr_returns', ['tenant_id'], { name: 'idx_gstr_returns_tenant_id' });
      console.log('✓ Created table gstr_returns');
    } else {
      console.log('ℹ️  Table gstr_returns already exists');
    }

    // TDS_DETAILS TABLE
    const [tdsDetailsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'tds_details'");
    if (tdsDetailsTable.length === 0) {
      await queryInterface.createTable('tds_details', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        voucher_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vouchers', key: 'id' }, onDelete: 'CASCADE' },
        tds_section: { type: Sequelize.STRING, allowNull: false },
        tds_rate: { type: Sequelize.DECIMAL(6, 2), allowNull: false },
        tds_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        quarter: { type: Sequelize.STRING, allowNull: true }, // Added: missing quarter column
        financial_year: { type: Sequelize.STRING, allowNull: true }, // Added: missing financial_year column
        deductee_pan: { type: Sequelize.STRING, allowNull: true },
        certificate_number: { type: Sequelize.STRING, allowNull: true },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('tds_details', ['voucher_id'], { name: 'idx_tds_details_voucher_id' });
      await addIndexIfNotExists('tds_details', ['tenant_id'], { name: 'idx_tds_details_tenant_id' });
      console.log('✓ Created table tds_details');
    } else {
      console.log('ℹ️  Table tds_details already exists');
      
      // Add missing columns if they don't exist
      await addColumnIfNotExists('tds_details', 'quarter', {
        type: Sequelize.STRING,
        allowNull: true,
      });
      
      await addColumnIfNotExists('tds_details', 'financial_year', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // EINVOICES TABLE
    const [einvoicesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'einvoices'");
    if (einvoicesTable.length === 0) {
      await queryInterface.createTable('einvoices', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        voucher_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vouchers', key: 'id' }, onDelete: 'CASCADE' },
        irn: { type: Sequelize.STRING, allowNull: true },
        ack_number: { type: Sequelize.STRING, allowNull: true },
        ack_date: { type: Sequelize.DATE, allowNull: true },
        signed_invoice: { type: Sequelize.TEXT, allowNull: true },
        signed_qr_code: { type: Sequelize.TEXT, allowNull: true },
        status: { type: Sequelize.ENUM('generated', 'cancelled'), defaultValue: 'generated' },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('einvoices', ['voucher_id'], { name: 'idx_einvoices_voucher_id', unique: true });
      await addIndexIfNotExists('einvoices', ['irn'], { name: 'idx_einvoices_irn' });
      await addIndexIfNotExists('einvoices', ['tenant_id'], { name: 'idx_einvoices_tenant_id' });
      console.log('✓ Created table einvoices');
    } else {
      console.log('ℹ️  Table einvoices already exists');
    }

    // EWAY_BILLS TABLE
    const [ewayBillsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'eway_bills'");
    if (ewayBillsTable.length === 0) {
      await queryInterface.createTable('eway_bills', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        voucher_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'vouchers', key: 'id' }, onDelete: 'CASCADE' },
        ewb_number: { type: Sequelize.STRING, allowNull: true },
        ewb_date: { type: Sequelize.DATE, allowNull: true },
        valid_until: { type: Sequelize.DATE, allowNull: true },
        vehicle_number: { type: Sequelize.STRING, allowNull: true },
        transporter_id: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.ENUM('generated', 'cancelled', 'expired'), defaultValue: 'generated' },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('eway_bills', ['voucher_id'], { name: 'idx_eway_bills_voucher_id', unique: true });
      await addIndexIfNotExists('eway_bills', ['ewb_number'], { name: 'idx_eway_bills_ewb_number' });
      await addIndexIfNotExists('eway_bills', ['tenant_id'], { name: 'idx_eway_bills_tenant_id' });
      console.log('✓ Created table eway_bills');
    } else {
      console.log('ℹ️  Table eway_bills already exists');
    }

    // FINBOX_CONSENTS TABLE
    const [finboxConsentsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'finbox_consents'");
    if (finboxConsentsTable.length === 0) {
      await queryInterface.createTable('finbox_consents', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
        consent_given: { type: Sequelize.BOOLEAN, defaultValue: false },
        consent_date: { type: Sequelize.DATE, allowNull: true },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true }, // Added: missing is_active column
        consent_type: { type: Sequelize.STRING, allowNull: true },
        consent_data: { type: Sequelize.JSON, allowNull: true },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('finbox_consents', ['user_id'], { name: 'idx_finbox_consents_user_id' });
      await addIndexIfNotExists('finbox_consents', ['tenant_id'], { name: 'idx_finbox_consents_tenant_id' });
      console.log('✓ Created table finbox_consents');
    } else {
      console.log('ℹ️  Table finbox_consents already exists');
      
      // Add missing is_active column if it doesn't exist
      await addColumnIfNotExists('finbox_consents', 'is_active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      });
    }

    // ============================================
    // INDIAN INVOICE SYSTEM ENHANCEMENTS
    // ============================================
    console.log('Adding Indian Invoice System enhancements...');

    // ============================================
    // 1. NUMBERING_SERIES TABLE
    // ============================================
    console.log('Creating numbering_series table...');
    const [numberingSeriesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'numbering_series'");
    if (numberingSeriesTable.length === 0) {
      await queryInterface.createTable('numbering_series', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        tenant_id: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        company_id: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'Company ID for company-specific numbering sequences',
        },
        branch_id: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'Optional branch association for branch-specific numbering',
        },
        voucher_type: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Type of voucher (Sales Invoice, Purchase Invoice, etc.)',
        },
        series_name: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'User-friendly name for the series',
        },
        prefix: {
          type: Sequelize.STRING(10),
          allowNull: false,
          comment: 'Prefix for voucher numbers (e.g., INV, EXP)',
        },
        format: {
          type: Sequelize.STRING(100),
          allowNull: false,
          defaultValue: '{PREFIX}{YEAR}{MONTH}{SEQUENCE}',
          comment: 'Format string with tokens like {PREFIX}{YEAR}{MONTH}{SEQUENCE}',
        },
        separator: {
          type: Sequelize.STRING(5),
          defaultValue: '',
          comment: 'Separator character between format tokens',
        },
        sequence_length: {
          type: Sequelize.INTEGER,
          defaultValue: 4,
          comment: 'Number of digits for sequence padding (e.g., 4 = 0001)',
        },
        current_sequence: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Current sequence number',
        },
        start_number: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          comment: 'Starting sequence number',
        },
        end_number: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Optional ending sequence number',
        },
        reset_frequency: {
          type: Sequelize.ENUM('never', 'monthly', 'yearly', 'financial_year'),
          defaultValue: 'yearly',
          comment: 'When to reset the sequence',
        },
        last_reset_date: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Last date when sequence was reset',
        },
        is_default: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether this is the default series for the voucher type',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          comment: 'Whether this series is active',
        },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });

      // Add indexes for performance
      await addIndexIfNotExists('numbering_series', ['tenant_id'], { 
        name: 'idx_numbering_series_tenant_id' 
      });
      await addIndexIfNotExists('numbering_series', ['voucher_type'], { 
        name: 'idx_numbering_series_voucher_type' 
      });
      await addIndexIfNotExists('numbering_series', ['tenant_id', 'voucher_type'], { 
        name: 'idx_numbering_series_tenant_voucher_type' 
      });
      await addIndexIfNotExists('numbering_series', ['tenant_id', 'voucher_type', 'is_default'], { 
        name: 'idx_numbering_series_default' 
      });
      await addIndexIfNotExists('numbering_series', ['tenant_id', 'company_id', 'voucher_type'], {
        name: 'idx_numbering_tenant_company_type'
      });
      await addIndexIfNotExists('numbering_series', ['company_id', 'branch_id', 'voucher_type'], {
        name: 'idx_numbering_company_branch_type'
      });

      console.log('✓ Created table numbering_series');
    } else {
      console.log('ℹ️  Table numbering_series already exists');
      
      // Add company_id and branch_id if they don't exist
      await addColumnIfNotExists('numbering_series', 'company_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Company ID for company-specific numbering sequences',
      });
      
      // Add indexes if they don't exist
      await addIndexIfNotExists('numbering_series', ['tenant_id', 'company_id', 'voucher_type'], {
        name: 'idx_numbering_tenant_company_type'
      });
      await addIndexIfNotExists('numbering_series', ['company_id', 'branch_id', 'voucher_type'], {
        name: 'idx_numbering_company_branch_type'
      });
    }

    // ============================================
    // 2. NUMBERING_HISTORY TABLE
    // ============================================
    console.log('Creating numbering_history table...');
    const [numberingHistoryTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'numbering_history'");
    if (numberingHistoryTable.length === 0) {
      await queryInterface.createTable('numbering_history', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        series_id: {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'Reference to numbering series',
        },
        voucher_id: {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'Reference to voucher',
        },
        generated_number: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'The generated voucher number',
        },
        sequence_used: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'The sequence number used',
        },
        generated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
          comment: 'Timestamp when number was generated',
        },
        tenant_id: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });

      // Add indexes for performance
      await addIndexIfNotExists('numbering_history', ['series_id'], { 
        name: 'idx_numbering_history_series_id' 
      });
      await addIndexIfNotExists('numbering_history', ['voucher_id'], { 
        name: 'idx_numbering_history_voucher_id',
        unique: true 
      });
      await addIndexIfNotExists('numbering_history', ['tenant_id'], { 
        name: 'idx_numbering_history_tenant_id' 
      });
      await addIndexIfNotExists('numbering_history', ['generated_number', 'tenant_id'], { 
        name: 'idx_numbering_history_number_tenant',
        unique: true 
      });

      console.log('✓ Created table numbering_history');
    } else {
      console.log('ℹ️  Table numbering_history already exists');
    }

    // ============================================
    // 3. ENHANCE EXISTING TABLES
    // ============================================
    
    // Enhance E-Invoices table
    console.log('Enhancing einvoices table...');
    await addColumnIfNotExists('einvoices', 'retry_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'Number of retry attempts for E-Invoice generation',
    });
    await addColumnIfNotExists('einvoices', 'last_retry_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of last retry attempt',
    });
    await addColumnIfNotExists('einvoices', 'error_message', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Error message from failed E-Invoice generation',
    });

    // Enhance E-Way Bills table
    console.log('Enhancing eway_bills table...');
    await addColumnIfNotExists('eway_bills', 'distance', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Distance in kilometers for E-Way Bill validity calculation',
    });
    await addColumnIfNotExists('eway_bills', 'transport_mode', {
      type: Sequelize.ENUM('road', 'rail', 'air', 'ship'),
      allowNull: true,
      defaultValue: 'road',
      comment: 'Mode of transport',
    });
    await addColumnIfNotExists('eway_bills', 'vehicle_no', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Vehicle number',
    });
    await addColumnIfNotExists('eway_bills', 'transporter_name', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Name of the transporter',
    });

    // Enhance TDS Details table
    console.log('Enhancing tds_details table...');
    await addColumnIfNotExists('tds_details', 'deductee_name', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Name of the deductee',
    });
    await addColumnIfNotExists('tds_details', 'certificate_date', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date of TDS certificate issuance',
    });
    await addColumnIfNotExists('tds_details', 'taxable_amount', {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0,
      comment: 'Taxable amount on which TDS is calculated',
    });

    console.log('✓ Enhanced existing tables for Indian Invoice System');

    // ============================================
    // 4. CREATE DEFAULT NUMBERING SERIES
    // ============================================
    console.log('Creating default numbering series...');
    
    // Get tenant_id from the database name or context
    const [dbResult] = await queryInterface.sequelize.query('SELECT DATABASE() as db_name');
    const dbName = dbResult[0].db_name;
    const tenantId = dbName.replace('tenant_', ''); // Extract tenant ID from database name
    
    // Check and create Delivery Challan numbering series
    const [existingDC] = await queryInterface.sequelize.query(
      `SELECT id FROM numbering_series WHERE tenant_id = :tenantId AND voucher_type = 'delivery_challan' AND is_default = true`,
      { replacements: { tenantId }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    if (!existingDC) {
      await queryInterface.bulkInsert('numbering_series', [{
        id: Sequelize.literal('UUID()'),
        tenant_id: tenantId,
        voucher_type: 'delivery_challan',
        series_name: 'Delivery Challan Default',
        prefix: 'DC',
        format: 'PREFIX-SEPARATOR-YEAR-SEPARATOR-SEQUENCE',
        separator: '-',
        sequence_length: 4,
        current_sequence: 0,
        start_number: 1,
        end_number: null,
        reset_frequency: 'yearly',
        last_reset_date: null,
        is_default: true,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);
      console.log('✓ Created default Delivery Challan numbering series');
    } else {
      console.log('ℹ️  Delivery Challan numbering series already exists');
    }
    
    // Check and create Proforma Invoice numbering series
    const [existingPI] = await queryInterface.sequelize.query(
      `SELECT id FROM numbering_series WHERE tenant_id = :tenantId AND voucher_type = 'proforma_invoice' AND is_default = true`,
      { replacements: { tenantId }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    if (!existingPI) {
      await queryInterface.bulkInsert('numbering_series', [{
        id: Sequelize.literal('UUID()'),
        tenant_id: tenantId,
        voucher_type: 'proforma_invoice',
        series_name: 'Proforma Invoice Default',
        prefix: 'PI',
        format: 'PREFIX-SEPARATOR-YEAR-SEPARATOR-SEQUENCE',
        separator: '-',
        sequence_length: 4,
        current_sequence: 0,
        start_number: 1,
        end_number: null,
        reset_frequency: 'yearly',
        last_reset_date: null,
        is_default: true,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);
      console.log('✓ Created default Proforma Invoice numbering series');
    } else {
      console.log('ℹ️  Proforma Invoice numbering series already exists');
    }

    console.log('✅ All tenant tables created successfully');

  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order of creation to respect foreign keys
    await queryInterface.dropTable('numbering_history');
    await queryInterface.dropTable('numbering_series');
    await queryInterface.dropTable('finbox_consents');
    await queryInterface.dropTable('eway_bills');
    await queryInterface.dropTable('einvoices');
    await queryInterface.dropTable('tds_details');
    await queryInterface.dropTable('gstr_returns');
    await queryInterface.dropTable('bill_allocations');
    await queryInterface.dropTable('billwise_details');
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('warehouse_stocks');
    await queryInterface.dropTable('stock_movements');
    await queryInterface.dropTable('warehouses');
    await queryInterface.dropTable('gstins');
    await queryInterface.dropTable('product_attribute_values');
    await queryInterface.dropTable('product_attributes');
    await queryInterface.dropTable('inventory_units'); // Drop inventory_units before inventory_items
    await queryInterface.dropTable('inventory_items');
    await queryInterface.dropTable('voucher_ledger_entries');
    await queryInterface.dropTable('voucher_items');
    await queryInterface.dropTable('vouchers');
    await queryInterface.dropTable('ledgers');
    await queryInterface.dropTable('users');
  },
};
