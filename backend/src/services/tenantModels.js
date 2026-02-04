const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const models = {};

  models.User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: DataTypes.STRING,
    phone: DataTypes.STRING,
    profile_image: DataTypes.STRING, // Add profile_image field
    role: {
      type: DataTypes.ENUM('tenant_admin', 'user', 'accountant'),
      defaultValue: 'user',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: DataTypes.DATE, // Add last_login field
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'users',
    timestamps: true,
  });

  models.Ledger = sequelize.define('Ledger', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ledger_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ledger_code: DataTypes.STRING,
    account_group_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    opening_balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    opening_balance_type: {
      type: DataTypes.ENUM('Dr', 'Cr'),
      defaultValue: 'Dr',
    },
    balance_type: {
      type: DataTypes.ENUM('debit', 'credit'),
      defaultValue: 'debit',
    },
    current_balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    address: DataTypes.TEXT,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    pincode: DataTypes.STRING,
    country: {
      type: DataTypes.STRING,
      defaultValue: 'India',
    },
    gstin: DataTypes.STRING,
    pan: DataTypes.STRING,
    email: DataTypes.STRING,
    contact_number: DataTypes.STRING,
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'ledgers',
    timestamps: true,
  });

  models.GSTIN = sequelize.define('GSTIN', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    gstin: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    legal_name: DataTypes.STRING,
    trade_name: DataTypes.STRING,
    address: DataTypes.TEXT,
    state_code: DataTypes.STRING,
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'gstins',
    timestamps: true,
  });

  models.Voucher = sequelize.define('Voucher', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    voucher_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    voucher_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    voucher_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    party_ledger_id: DataTypes.UUID,
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    narration: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('draft', 'posted', 'cancelled'),
      defaultValue: 'draft',
    },
    reference_number: DataTypes.STRING,
    due_date: DataTypes.DATE,
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_by: DataTypes.UUID,
  }, {
    tableName: 'vouchers',
    timestamps: true,
  });

  models.VoucherItem = sequelize.define('VoucherItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    voucher_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    inventory_item_id: DataTypes.UUID,
    item_description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 3),
      defaultValue: 1,
    },
    rate: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    hsn_sac_code: DataTypes.STRING,
    gst_rate: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0,
    },
    cgst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    sgst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    igst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'voucher_items',
    timestamps: true,
  });

  models.VoucherLedgerEntry = sequelize.define('VoucherLedgerEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    voucher_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    ledger_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    debit_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    credit_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    narration: DataTypes.TEXT,
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'voucher_ledger_entries',
    timestamps: true,
  });

  models.InventoryItem = sequelize.define('InventoryItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    item_key: {
      type: DataTypes.STRING(300),
      allowNull: false,
      unique: true,
      comment: 'Stable key (item_code if present else item_description)',
    },
    item_code: DataTypes.STRING(100),
    item_name: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: 'Product barcode (EAN-13, UPC, etc.)',
    },
    parent_item_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'inventory_items',
        key: 'id',
      },
      comment: 'FK to self for product variants. NULL indicates a parent/template product.',
    },
    attributes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON object for variant attributes, e.g. {"Size": "M", "Color": "Blue"}',
    },
    hsn_sac_code: DataTypes.STRING(20),
    uqc: DataTypes.STRING(20),
    gst_rate: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    quantity_on_hand: {
      type: DataTypes.DECIMAL(15, 3),
      defaultValue: 0,
    },
    avg_cost: {
      type: DataTypes.DECIMAL(15, 4),
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'inventory_items',
    timestamps: true,
  });

  models.StockMovement = sequelize.define('StockMovement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    inventory_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    warehouse_id: DataTypes.UUID,
    voucher_id: DataTypes.UUID,
    movement_type: {
      type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
    },
    rate: {
      type: DataTypes.DECIMAL(15, 4),
      defaultValue: 0,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    reference_number: DataTypes.STRING,
    narration: DataTypes.TEXT,
    movement_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'stock_movements',
    timestamps: true,
  });

  models.Warehouse = sequelize.define('Warehouse', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    warehouse_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    warehouse_code: DataTypes.STRING,
    address: DataTypes.TEXT,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    pincode: DataTypes.STRING,
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'warehouses',
    timestamps: true,
  });

  models.WarehouseStock = sequelize.define('WarehouseStock', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    warehouse_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    inventory_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 3),
      defaultValue: 0,
    },
    avg_cost: {
      type: DataTypes.DECIMAL(15, 4),
      defaultValue: 0,
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'warehouse_stocks',
    timestamps: true,
  });

  models.EWayBill = sequelize.define('EWayBill', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    voucher_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    ewb_number: DataTypes.STRING,
    ewb_date: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM('generated', 'cancelled'),
      defaultValue: 'generated',
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'eway_bills',
    timestamps: true,
  });

  models.BillWiseDetail = sequelize.define('BillWiseDetail', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    voucher_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    ledger_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    bill_number: DataTypes.STRING,
    bill_date: DataTypes.DATE,
    bill_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    pending_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    is_fully_paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'billwise_details',
    timestamps: true,
  });

  models.BillAllocation = sequelize.define('BillAllocation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    payment_voucher_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    bill_detail_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    allocated_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'bill_allocations',
    timestamps: true,
  });

  models.GSTRReturn = sequelize.define('GSTRReturn', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    return_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    return_period: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gstin: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'filed'),
      defaultValue: 'draft',
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'gstr_returns',
    timestamps: true,
  });

  models.TDSDetail = sequelize.define('TDSDetail', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    voucher_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tds_section: DataTypes.STRING,
    tds_rate: DataTypes.DECIMAL(6, 2),
    tds_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    quarter: DataTypes.STRING, // Add missing quarter field
    financial_year: DataTypes.STRING, // Add missing financial_year field
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'tds_details',
    timestamps: true,
  });

  models.EInvoice = sequelize.define('EInvoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    voucher_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    irn: DataTypes.STRING,
    ack_number: DataTypes.STRING,
    ack_date: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM('generated', 'cancelled'),
      defaultValue: 'generated',
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'einvoices',
    timestamps: true,
  });

  models.AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    table_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    record_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM('create', 'update', 'delete'),
      allowNull: false,
    },
    old_values: DataTypes.JSON,
    new_values: DataTypes.JSON,
    user_id: DataTypes.UUID,
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'audit_logs',
    timestamps: true,
  });

  models.FinBoxConsent = sequelize.define('FinBoxConsent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    consent_given: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    consent_date: DataTypes.DATE,
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'finbox_consents',
    timestamps: true,
  });

  // NumberingSeries model for advanced invoice numbering
  models.NumberingSeries = sequelize.define('NumberingSeries', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    voucher_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    series_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    prefix: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isUppercaseAlphanumeric(value) {
          if (!/^[A-Z0-9]+$/.test(value)) {
            throw new Error('Prefix must contain only uppercase letters and numbers');
          }
        },
      },
    },
    format: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        containsRequiredTokens(value) {
          if (!value.includes('PREFIX') || !value.includes('SEQUENCE')) {
            throw new Error('Format must contain both PREFIX and SEQUENCE tokens');
          }
        },
      },
    },
    separator: {
      type: DataTypes.STRING(5),
      defaultValue: '-',
    },
    sequence_length: {
      type: DataTypes.INTEGER,
      defaultValue: 4,
    },
    current_sequence: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    start_number: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    end_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reset_frequency: {
      type: DataTypes.ENUM('never', 'monthly', 'yearly', 'financial_year'),
      defaultValue: 'never',
    },
    last_reset_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'numbering_series',
    timestamps: true,
  });

  // NEW: Product Attribute models
  models.ProductAttribute = require('../models/ProductAttribute')(sequelize);
  models.ProductAttributeValue = require('../models/ProductAttributeValue')(sequelize);

  // Define associations
  // Voucher associations
  models.Voucher.hasMany(models.VoucherLedgerEntry, { foreignKey: 'voucher_id', as: 'ledgerEntries' });
  models.VoucherLedgerEntry.belongsTo(models.Voucher, { foreignKey: 'voucher_id', as: 'voucher' });
  
  models.Voucher.hasMany(models.VoucherItem, { foreignKey: 'voucher_id', as: 'items' });
  models.VoucherItem.belongsTo(models.Voucher, { foreignKey: 'voucher_id', as: 'voucher' });
  
  // Party Ledger association for Voucher
  models.Voucher.belongsTo(models.Ledger, { foreignKey: 'party_ledger_id', as: 'partyLedger' });
  models.Ledger.hasMany(models.Voucher, { foreignKey: 'party_ledger_id', as: 'partyVouchers' });
  
  // Ledger associations
  models.Ledger.hasMany(models.VoucherLedgerEntry, { foreignKey: 'ledger_id', as: 'ledgerEntries' });
  models.VoucherLedgerEntry.belongsTo(models.Ledger, { foreignKey: 'ledger_id', as: 'ledger' });
  
  // Warehouse associations
  models.Warehouse.hasMany(models.WarehouseStock, { foreignKey: 'warehouse_id', as: 'stock' });
  models.WarehouseStock.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
  
  // Inventory associations
  models.InventoryItem.hasMany(models.WarehouseStock, { foreignKey: 'inventory_item_id', as: 'warehouseStock' });
  models.WarehouseStock.belongsTo(models.InventoryItem, { foreignKey: 'inventory_item_id', as: 'item' });
  
  models.InventoryItem.hasMany(models.StockMovement, { foreignKey: 'inventory_item_id', as: 'movements' });
  models.StockMovement.belongsTo(models.InventoryItem, { foreignKey: 'inventory_item_id', as: 'item' });
  
  models.Warehouse.hasMany(models.StockMovement, { foreignKey: 'warehouse_id', as: 'movements' });
  models.StockMovement.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
  
  // Bill-wise associations
  models.Voucher.hasMany(models.BillWiseDetail, { foreignKey: 'voucher_id', as: 'billDetails' });
  models.BillWiseDetail.belongsTo(models.Voucher, { foreignKey: 'voucher_id', as: 'voucher' });
  
  models.Ledger.hasMany(models.BillWiseDetail, { foreignKey: 'ledger_id', as: 'billDetails' });
  models.BillWiseDetail.belongsTo(models.Ledger, { foreignKey: 'ledger_id', as: 'ledger' });
  
  models.BillWiseDetail.hasMany(models.BillAllocation, { foreignKey: 'bill_detail_id', as: 'allocations' });
  models.BillAllocation.belongsTo(models.BillWiseDetail, { foreignKey: 'bill_detail_id', as: 'billDetail' });
  
  // E-Invoice and E-Way Bill associations
  models.Voucher.hasOne(models.EInvoice, { foreignKey: 'voucher_id', as: 'eInvoice' });
  models.EInvoice.belongsTo(models.Voucher, { foreignKey: 'voucher_id', as: 'voucher' });
  
  models.Voucher.hasOne(models.EWayBill, { foreignKey: 'voucher_id', as: 'eWayBill' });
  models.EWayBill.belongsTo(models.Voucher, { foreignKey: 'voucher_id', as: 'voucher' });
  
  // TDS associations
  models.Voucher.hasMany(models.TDSDetail, { foreignKey: 'voucher_id', as: 'tdsDetails' });
  models.TDSDetail.belongsTo(models.Voucher, { foreignKey: 'voucher_id', as: 'voucher' });

  // NumberingSeries associations
  // Note: Branch model doesn't exist yet, so we'll skip that association for now
  // When Branch model is added, uncomment the following:
  // models.NumberingSeries.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
  // models.Branch.hasMany(models.NumberingSeries, { foreignKey: 'branch_id', as: 'numberingSeries' });

  // NEW: Inventory Item self-referencing for variants
  models.InventoryItem.belongsTo(models.InventoryItem, { as: 'ParentItem', foreignKey: 'parent_item_id' });
  models.InventoryItem.hasMany(models.InventoryItem, { as: 'Variants', foreignKey: 'parent_item_id' });

  // NEW: Product Attribute Associations
  if (models.ProductAttribute.associate) {
    models.ProductAttribute.associate(models);
  }
  if (models.ProductAttributeValue.associate) {
    models.ProductAttributeValue.associate(models);
  }

  models.FinBoxConsent.belongsTo(models.User, { foreignKey: 'user_id' });

  // Attach sequelize instance to models for transaction support
  models.sequelize = sequelize;

  return models;
};