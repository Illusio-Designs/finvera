const { DataTypes } = require('sequelize');
const masterSequelize = require('../config/masterDatabase');

/**
 * Master Database Models
 * These are SHARED across ALL tenants
 * Contains accounting structure/templates that all tenants use
 */

const models = {};

// Tenant Master Model (already exists)
models.TenantMaster = require('./TenantMaster');

// Account Group Model (SHARED - Same chart of accounts for all tenants)
models.AccountGroup = masterSequelize.define('AccountGroup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'For hierarchical chart of accounts',
  },
  nature: {
    type: DataTypes.ENUM('asset', 'liability', 'income', 'expense'),
    allowNull: false,
  },
  affects_gross_profit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'System groups cannot be deleted',
  },
  description: {
    type: DataTypes.TEXT,
  },
  group_code: {
    type: DataTypes.STRING(20),
    unique: true,
    comment: 'Unique code for the group',
  },
}, {
  tableName: 'account_groups',
  timestamps: true,
});

// Voucher Type Model (SHARED - Same voucher types for all tenants)
models.VoucherType = masterSequelize.define('VoucherType', {
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
  type_category: {
    type: DataTypes.ENUM('sales', 'purchase', 'payment', 'receipt', 'journal', 'contra', 'debit_note', 'credit_note'),
    allowNull: false,
  },
  affects_stock: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  numbering_prefix: {
    type: DataTypes.STRING(10),
    comment: 'Prefix for voucher numbers (e.g., INV, RCPT)',
  },
  description: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'voucher_types',
  timestamps: true,
});

// GST Rate Model (SHARED - GST rates are same for all tenants)
models.GSTRate = masterSequelize.define('GSTRate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  rate_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'E.g., GST 5%, GST 12%, GST 18%, GST 28%',
  },
  cgst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  sgst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  igst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  cess_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  effective_from: {
    type: DataTypes.DATE,
  },
  effective_to: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'gst_rates',
  timestamps: true,
});

// TDS Section Model (SHARED - TDS sections are same for all)
models.TDSSection = masterSequelize.define('TDSSection', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  section_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'E.g., 194C, 194J, 194I',
  },
  section_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  default_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'tds_sections',
  timestamps: true,
});

// Accounting Year Template (SHARED)
models.AccountingYear = masterSequelize.define('AccountingYear', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  year_name: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'E.g., 2023-24, 2024-25',
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  is_current: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'accounting_years',
  timestamps: true,
});

// Define associations
models.AccountGroup.hasMany(models.AccountGroup, { 
  foreignKey: 'parent_id', 
  as: 'children' 
});

models.AccountGroup.belongsTo(models.AccountGroup, { 
  foreignKey: 'parent_id', 
  as: 'parent' 
});

// Sync all master models
async function syncMasterModels() {
  // Use alter: true for TenantMaster to allow adding new columns
  // Other models use alter: false to prevent accidental changes
  try {
    await models.TenantMaster.sync({ alter: true });
  } catch (syncError) {
    // Handle MySQL's 64-index limit error
    if (syncError.original && syncError.original.code === 'ER_TOO_MANY_KEYS') {
      const logger = require('../utils/logger');
      logger.warn('⚠️  tenant_master table has too many indexes (MySQL limit: 64)');
      logger.warn('   This is usually safe to ignore if the table already exists.');
      logger.warn('   The table structure is correct, just too many indexes.');
      // Continue with other models
    } else {
      throw syncError;
    }
  }
  
  await models.AccountGroup.sync({ alter: false });
  await models.VoucherType.sync({ alter: false });
  await models.GSTRate.sync({ alter: false });
  await models.TDSSection.sync({ alter: false });
  await models.AccountingYear.sync({ alter: false });
}

models.syncMasterModels = syncMasterModels;

module.exports = models;
