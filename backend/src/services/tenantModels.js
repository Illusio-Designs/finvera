const { DataTypes } = require('sequelize');

/**
 * Tenant Database Models
 * ONLY transactional/operational data specific to each tenant
 * Accounting structure (account groups, voucher types) comes from master DB
 * 
 * @param {Sequelize} sequelize - Tenant-specific Sequelize instance
 * @returns {Object} - Object containing all tenant models
 */
module.exports = (sequelize) => {
  const models = {};

  // User model (tenant-specific users)
  models.User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'accountant', 'viewer'),
      defaultValue: 'viewer',
    },
    phone: DataTypes.STRING(15),
    profile_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Path to user profile image',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: DataTypes.DATE,
  }, {
    tableName: 'users',
    timestamps: true,
  });

  // NOTE: AccountGroup is now in Master DB (shared across all tenants)
  // Tenants reference account_group_id from master database

  // Ledger model (Tenant-specific ledgers with balances)
  models.Ledger = sequelize.define('Ledger', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Keep DB column name as `name` for backward compatibility,
    // but expose as ledger_name to match controllers/UI.
    ledger_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'name',
    },
    ledger_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: false,
    },
    account_group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'References master DB account_groups table',
    },
    opening_balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
    },
    opening_balance_type: {
      type: DataTypes.ENUM('Dr', 'Cr'),
      defaultValue: 'Dr',
    },
    // Optional hint used by some screens; do not rely on it for reporting.
    balance_type: {
      type: DataTypes.ENUM('debit', 'credit'),
      defaultValue: 'debit',
    },
    gstin: DataTypes.STRING(15),
    pan: DataTypes.STRING(10),
    address: DataTypes.TEXT,
    city: DataTypes.STRING(100),
    state: DataTypes.STRING(100),
    pincode: DataTypes.STRING(10),
    phone: DataTypes.STRING(15),
    email: DataTypes.STRING(255),
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'ledgers',
    timestamps: true,
  });

  // GSTIN model
  models.GSTIN = sequelize.define('GSTIN', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    gstin: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
    legal_name: DataTypes.STRING,
    trade_name: DataTypes.STRING,
    state: DataTypes.STRING(100),
    address: DataTypes.TEXT,
    registration_date: DataTypes.DATE,
    gstin_status: {
      type: DataTypes.ENUM('active', 'cancelled', 'suspended'),
      defaultValue: 'active',
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'gstins',
    timestamps: true,
  });

  // NOTE: VoucherType is now in Master DB (shared across all tenants)
  // Vouchers reference voucher_type_id from master database

  // Voucher model (Tenant-specific transactions)
  models.Voucher = sequelize.define('Voucher', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Optional FK to a master voucher type (kept nullable because older flows
    // and current multi-company refactor may use `voucher_type` string).
    voucher_type_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'References master DB voucher_types table',
    },
    voucher_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Logical voucher category (Sales/Purchase/Payment/Receipt/Journal/Contra)',
    },
    voucher_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    voucher_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    party_ledger_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Customer/Supplier ledger id (in tenant DB)',
    },
    reference_number: DataTypes.STRING(100),
    reference_date: DataTypes.DATEONLY,
    narration: DataTypes.TEXT,
    place_of_supply: DataTypes.STRING(100),
    is_reverse_charge: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    cgst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    sgst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    igst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    cess_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    round_off: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'posted', 'cancelled'),
      defaultValue: 'posted',
    },
    created_by: DataTypes.UUID,
  }, {
    tableName: 'vouchers',
    timestamps: true,
  });

  // Voucher Item model (invoice line items)
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
    item_code: DataTypes.STRING(100),
    item_description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    hsn_sac_code: DataTypes.STRING(20),
    uqc: DataTypes.STRING(20),
    quantity: {
      type: DataTypes.DECIMAL(15, 3),
      defaultValue: 1,
    },
    rate: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    discount_percent: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    taxable_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
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
    cess_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
  }, {
    tableName: 'voucher_items',
    timestamps: true,
  });

  // Voucher Ledger Entry model
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
    // Map to legacy DB columns `debit`/`credit` when they exist.
    debit_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      field: 'debit',
    },
    credit_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      field: 'credit',
    },
    narration: DataTypes.TEXT,
  }, {
    tableName: 'voucher_ledger_entries',
    timestamps: true,
  });

  // Basic inventory (avg-cost) for stock reporting and COGS.
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
    voucher_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    movement_type: {
      type: DataTypes.ENUM('IN', 'OUT', 'ADJ'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
    },
    rate: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    narration: DataTypes.STRING(500),
  }, {
    tableName: 'stock_movements',
    timestamps: true,
  });

  // Bill-wise Details model
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
    bill_number: DataTypes.STRING(100),
    bill_date: DataTypes.DATEONLY,
    bill_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    pending_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    due_date: DataTypes.DATEONLY,
    is_open: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_fully_paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'bill_wise_details',
    timestamps: true,
  });

  // Bill allocation details (payments/receipts allocations against bills)
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
    bill_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    allocated_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
  }, {
    tableName: 'bill_allocations',
    timestamps: true,
  });

  // GSTR Return model
  models.GSTRReturn = sequelize.define('GSTRReturn', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    gstin_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    return_type: {
      type: DataTypes.ENUM('GSTR1', 'GSTR3B', 'GSTR4', 'GSTR9'),
      allowNull: false,
    },
    return_period: DataTypes.STRING(10),
    financial_year: DataTypes.STRING(10),
    filing_date: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM('draft', 'filed', 'revised'),
      defaultValue: 'draft',
    },
    arn: DataTypes.STRING(50),
    return_data: DataTypes.JSON,
  }, {
    tableName: 'gstr_returns',
    timestamps: true,
  });

  // TDS Detail model
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
    ledger_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    section: DataTypes.STRING(20),
    tds_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    taxable_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    tds_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    quarter: DataTypes.STRING(10),
    financial_year: DataTypes.STRING(10),
  }, {
    tableName: 'tds_details',
    timestamps: true,
  });

  // E-Invoice model
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
    irn: DataTypes.STRING(64),
    ack_no: DataTypes.STRING(20),
    ack_date: DataTypes.DATE,
    signed_invoice: DataTypes.TEXT,
    signed_qr_code: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('pending', 'generated', 'cancelled', 'failed'),
      defaultValue: 'pending',
    },
    error_message: DataTypes.TEXT,
  }, {
    tableName: 'e_invoices',
    timestamps: true,
  });

  // Audit Log model
  models.AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: DataTypes.UUID,
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entity_type: DataTypes.STRING(50),
    entity_id: DataTypes.UUID,
    old_values: DataTypes.JSON,
    new_values: DataTypes.JSON,
    ip_address: DataTypes.STRING(45),
    user_agent: DataTypes.TEXT,
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
  });

  // Define associations (within tenant DB)
  // NOTE: AccountGroup and VoucherType are in Master DB, so no foreign key constraints

  models.Voucher.hasMany(models.VoucherItem, { foreignKey: 'voucher_id' });
  models.VoucherItem.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });

  models.Voucher.belongsTo(models.Ledger, { foreignKey: 'party_ledger_id', as: 'partyLedger' });

  models.Voucher.hasMany(models.VoucherLedgerEntry, { foreignKey: 'voucher_id' });
  models.VoucherLedgerEntry.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });
  models.VoucherLedgerEntry.belongsTo(models.Ledger, { foreignKey: 'ledger_id' });

  models.Voucher.hasMany(models.BillWiseDetail, { foreignKey: 'voucher_id' });
  models.BillWiseDetail.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });
  models.BillWiseDetail.belongsTo(models.Ledger, { foreignKey: 'ledger_id' });

  models.BillWiseDetail.hasMany(models.BillAllocation, { foreignKey: 'bill_id' });
  models.BillAllocation.belongsTo(models.BillWiseDetail, { foreignKey: 'bill_id' });
  models.BillAllocation.belongsTo(models.Voucher, { foreignKey: 'payment_voucher_id', as: 'paymentVoucher' });

  models.GSTIN.hasMany(models.GSTRReturn, { foreignKey: 'gstin_id' });
  models.GSTRReturn.belongsTo(models.GSTIN, { foreignKey: 'gstin_id' });

  models.Voucher.hasOne(models.EInvoice, { foreignKey: 'voucher_id' });
  models.EInvoice.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });

  models.InventoryItem.hasMany(models.StockMovement, { foreignKey: 'inventory_item_id' });
  models.StockMovement.belongsTo(models.InventoryItem, { foreignKey: 'inventory_item_id' });
  models.StockMovement.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });

  return models;
};
