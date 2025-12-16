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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    current_balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
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
    voucher_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'References master DB voucher_types table',
    },
    voucher_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    voucher_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reference_number: DataTypes.STRING(100),
    reference_date: DataTypes.DATEONLY,
    narration: DataTypes.TEXT,
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
    debit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
    },
    credit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
    },
    narration: DataTypes.TEXT,
  }, {
    tableName: 'voucher_ledger_entries',
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
    due_date: DataTypes.DATEONLY,
    is_open: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'bill_wise_details',
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

  models.Voucher.hasMany(models.VoucherLedgerEntry, { foreignKey: 'voucher_id' });
  models.VoucherLedgerEntry.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });
  models.VoucherLedgerEntry.belongsTo(models.Ledger, { foreignKey: 'ledger_id' });

  models.Voucher.hasMany(models.BillWiseDetail, { foreignKey: 'voucher_id' });
  models.BillWiseDetail.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });

  models.GSTIN.hasMany(models.GSTRReturn, { foreignKey: 'gstin_id' });
  models.GSTRReturn.belongsTo(models.GSTIN, { foreignKey: 'gstin_id' });

  models.Voucher.hasOne(models.EInvoice, { foreignKey: 'voucher_id' });
  models.EInvoice.belongsTo(models.Voucher, { foreignKey: 'voucher_id' });

  return models;
};
