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
        hsn_sac_code: Sequelize.STRING(20),
        uqc: Sequelize.STRING(20),
        gst_rate: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
        quantity_on_hand: { type: Sequelize.DECIMAL(15, 3), defaultValue: 0 },
        avg_cost: { type: Sequelize.DECIMAL(15, 4), defaultValue: 0 },
        variant_attributes: { type: Sequelize.JSON, allowNull: true, comment: 'JSON object storing variant attributes like {"Color": "Red", "Size": "M"}' },
        variant_of_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'inventory_items', key: 'id' }, onDelete: 'SET NULL' },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
      console.log('✓ Created table inventory_items');
    } else {
      await addColumnIfNotExists('inventory_items', 'barcode', { type: Sequelize.STRING(100), allowNull: true, unique: true, comment: 'Product barcode (EAN-13, UPC, etc.)'});
      await addColumnIfNotExists('inventory_items', 'variant_attributes', { type: Sequelize.JSON, allowNull: true, comment: 'JSON object storing variant attributes like {"Color": "Red", "Size": "M"}' });
      await addColumnIfNotExists('inventory_items', 'variant_of_id', { type: Sequelize.UUID, allowNull: true, references: { model: 'inventory_items', key: 'id' }, onDelete: 'SET NULL' });
    }

    // PRODUCT_ATTRIBUTES TABLE
    const [productAttributesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'product_attributes'");
    if (productAttributesTable.length === 0) {
      await queryInterface.createTable('product_attributes', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        name: { type: Sequelize.STRING, allowNull: false, unique: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      });
      console.log('✓ Created table product_attributes');
    } else {
      console.log('ℹ️  Table product_attributes already exists');
    }

    // PRODUCT_ATTRIBUTE_VALUES TABLE
    const [productAttributeValuesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'product_attribute_values'");
    if (productAttributeValuesTable.length === 0) {
      await queryInterface.createTable('product_attribute_values', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        attribute_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'product_attributes', key: 'id' }, onDelete: 'CASCADE' },
        value: { type: Sequelize.STRING, allowNull: false },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      });
      await addIndexIfNotExists('product_attribute_values', ['attribute_id', 'value'], { name: 'idx_attribute_value_unique', unique: true });
      console.log('✓ Created table product_attribute_values');
    } else {
      console.log('ℹ️  Table product_attribute_values already exists');
    }
    
    // ... (existing stock_movements, warehouses, warehouse_stocks, audit_logs tables)
    // ... (existing index creation and default ledger creation)

  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order of creation to respect foreign keys
    await queryInterface.dropTable('product_attribute_values');
    await queryInterface.dropTable('product_attributes');
    
    // The rest of the existing down method
    await queryInterface.dropTable('finbox_consents');
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
