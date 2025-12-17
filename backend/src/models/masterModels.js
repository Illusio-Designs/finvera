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

// Company Model (stored in master DB; created by tenant users)
models.Company = masterSequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'TenantMaster.id',
  },
  created_by_user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'users.id (main database) who created this company',
  },

  // Basic Company Information
  company_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  company_type: {
    type: DataTypes.ENUM(
      'sole_proprietorship',
      'partnership_firm',
      'llp',
      'opc',
      'private_limited',
      'public_limited',
      'section_8'
    ),
    allowNull: false,
  },
  registration_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'CIN / LLPIN / other registration number',
  },
  incorporation_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  pan: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  tan: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  gstin: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },

  // Registered Office Details
  registered_address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  contact_number: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: { isEmail: true },
  },

  // Director/Partner/Proprietor Information (store as JSON array)
  principals: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of directors/partners/proprietor objects (name, din, pan, contact, address, etc.)',
  },

  // Financial Details
  financial_year_start: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  financial_year_end: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  authorized_capital: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
  },
  accounting_method: {
    type: DataTypes.ENUM('cash', 'accrual'),
    allowNull: true,
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR',
  },
  books_beginning_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },

  // Banking + Compliance (JSON blobs)
  bank_details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  compliance: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  // Track provisioning status at company level (mirrors tenant provisioning for now)
  db_provisioned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  db_provisioned_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'companies',
  timestamps: true,
});

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
  
  // Company model can evolve (tenant-controlled metadata)
  await models.Company.sync({ alter: true });

  await models.AccountGroup.sync({ alter: false });
  await models.VoucherType.sync({ alter: false });
  await models.GSTRate.sync({ alter: false });
  await models.TDSSection.sync({ alter: false });
  await models.AccountingYear.sync({ alter: false });
}

models.syncMasterModels = syncMasterModels;

module.exports = models;
