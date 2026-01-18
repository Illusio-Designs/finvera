
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

// Tenant Review Model (stored in master DB)
models.TenantReview = require('./TenantReview');

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
  logo_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL path to company logo image',
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
  // Database connection info (per company)
  db_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  db_host: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  db_port: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  db_user: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  db_password: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Encrypted password for company database',
  },
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

models.Branch = require('./Branch');

models.Company.hasMany(models.Branch, { foreignKey: 'company_id', as: 'branches' });
models.Branch.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });


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
    const logger = require('../utils/logger');
    
    // Handle MySQL's 64-index limit error
    if (syncError.original && syncError.original.code === 'ER_TOO_MANY_KEYS') {
      logger.warn('⚠️  tenant_master table has too many indexes (MySQL limit: 64)');
    } else if (syncError.original && syncError.original.code === 'ER_TOO_BIG_ROWSIZE') {
      logger.warn('⚠️  tenant_master table row size too large. Skipping alter sync.');
      logger.warn('   This usually means the table already exists with the correct structure.');
      logger.warn('   If you need to add columns, do it manually via migration.');
      logger.warn('   This is usually safe to ignore if the table already exists.');
      logger.warn('   The table structure is correct, just too many indexes.');
      // Continue with other models
    } else if (syncError.original && syncError.original.code === 'ER_BLOB_KEY_WITHOUT_LENGTH') {
      // Handle TEXT/BLOB column in index error - need to drop index, alter column, recreate index
      logger.warn('⚠️  TEXT/BLOB column used in index. Attempting to fix...');
      try {
        const masterSequelize = require('../config/masterDatabase');
        // Drop the email index
        await masterSequelize.query('DROP INDEX idx_tenant_master_email ON tenant_master');
        logger.info('✓ Dropped email index');
        
        // Alter email column from TEXT to VARCHAR(255)
        await masterSequelize.query('ALTER TABLE tenant_master MODIFY COLUMN email VARCHAR(255) NOT NULL');
        logger.info('✓ Changed email column to VARCHAR(255)');
        
        // Recreate the index
        await masterSequelize.query('CREATE INDEX idx_tenant_master_email ON tenant_master(email)');
        logger.info('✓ Recreated email index');
        
        logger.info('✅ Successfully fixed email column and index');
      } catch (fixError) {
        logger.error('❌ Failed to fix email column:', fixError);
        // If the column/index doesn't exist, that's okay - table might be new
        if (fixError.original && fixError.original.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
          throw fixError;
        }
        logger.warn('⚠️  Index or column may not exist yet. Continuing...');
      }
    } else {
      throw syncError;
    }
  }
  
  // Company model can evolve (tenant-controlled metadata)
  await models.Company.sync({ alter: true });
  await models.Branch.sync({ alter: true });

  await models.AccountGroup.sync({ alter: false });
  await models.VoucherType.sync({ alter: false });
  await models.GSTRate.sync({ alter: false });
  await models.TDSSection.sync({ alter: false });
  await models.AccountingYear.sync({ alter: false });
  
  // Create subscription_plans table in master DB if it doesn't exist (needed for Subscription FK)
  const logger = require('../utils/logger');
  try {
    const [tables] = await masterSequelize.query("SHOW TABLES LIKE 'subscription_plans'");
    if (tables.length === 0) {
      await masterSequelize.query(`
        CREATE TABLE IF NOT EXISTS subscription_plans (
          id CHAR(36) BINARY PRIMARY KEY,
          plan_code VARCHAR(50) NOT NULL UNIQUE,
          plan_name VARCHAR(255) NOT NULL,
          description TEXT,
          plan_type ENUM('multi-company', 'multi-branch') DEFAULT 'multi-company',
          billing_cycle VARCHAR(50),
          base_price DECIMAL(15,2) NOT NULL,
          discounted_price DECIMAL(15,2),
          currency VARCHAR(3) DEFAULT 'INR',
          trial_days INT DEFAULT 0,
          max_users INT,
          max_invoices_per_month INT,
          max_companies INT DEFAULT 1,
          max_branches INT DEFAULT 0,
          storage_limit_gb INT,
          features JSON,
          salesman_commission_rate DECIMAL(5,2),
          distributor_commission_rate DECIMAL(5,2),
          renewal_commission_rate DECIMAL(5,2),
          is_active BOOLEAN DEFAULT TRUE,
          is_visible BOOLEAN DEFAULT TRUE,
          is_featured BOOLEAN DEFAULT FALSE,
          display_order INT,
          valid_from DATETIME,
          valid_until DATETIME,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL
        ) ENGINE=InnoDB;
      `);
      logger.info('✓ Created subscription_plans table in master database');
    }
  } catch (error) {
    logger.warn('Could not create subscription_plans table:', error.message);
    // Continue - table might already exist or FK will be optional
  }
  
  // Sync Subscription and Payment
  try {
    await models.Subscription.sync({ alter: true });
  } catch (syncError) {
    // Handle MySQL's 64-index limit error
    if (syncError.original && syncError.original.code === 'ER_TOO_MANY_KEYS') {
      logger.warn('⚠️  subscriptions table has too many indexes (MySQL limit: 64)');
      logger.warn('   This is usually safe to ignore if the table already exists.');
      logger.warn('   The table structure is correct, just too many indexes.');
      // Continue with other models
    } else if (syncError.message.includes('subscription_plans') || syncError.original?.code === 'ER_FK_CANNOT_OPEN_PARENT') {
      logger.warn('⚠️  subscription_plans table not found, syncing Subscription without FK constraint');
      // Try to create table manually without FK constraint
      try {
        await masterSequelize.query(`
          CREATE TABLE IF NOT EXISTS subscriptions (
            id CHAR(36) BINARY PRIMARY KEY,
            tenant_id CHAR(36) BINARY NOT NULL,
            subscription_plan_id CHAR(36) BINARY,
            razorpay_subscription_id VARCHAR(255) NOT NULL,
            razorpay_plan_id VARCHAR(255),
            status ENUM('created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired') DEFAULT 'created',
            plan_code VARCHAR(50) NOT NULL,
            plan_name VARCHAR(255),
            description TEXT,
            plan_type ENUM('multi-company', 'multi-branch') DEFAULT 'multi-company',
            billing_cycle VARCHAR(20) NOT NULL,
            base_price DECIMAL(15,2),
            discounted_price DECIMAL(15,2),
            amount DECIMAL(15,2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'INR',
            trial_days INT DEFAULT 0,
            max_users INT,
            max_invoices_per_month INT,
            max_companies INT DEFAULT 1,
            max_branches INT DEFAULT 0,
            storage_limit_gb INT,
            features JSON,
            salesman_commission_rate DECIMAL(5,2),
            distributor_commission_rate DECIMAL(5,2),
            renewal_commission_rate DECIMAL(5,2),
            is_active BOOLEAN DEFAULT TRUE,
            is_visible BOOLEAN DEFAULT TRUE,
            is_featured BOOLEAN DEFAULT FALSE,
            display_order INT,
            valid_from DATETIME,
            valid_until DATETIME,
            start_date DATETIME NOT NULL,
            end_date DATETIME,
            current_period_start DATETIME,
            current_period_end DATETIME,
            cancelled_at DATETIME,
            notes TEXT,
            metadata JSON,
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL,
            FOREIGN KEY (tenant_id) REFERENCES tenant_master(id) ON DELETE NO ACTION ON UPDATE CASCADE
          ) ENGINE=InnoDB;
        `);
        logger.info('✓ Created subscriptions table without subscription_plans FK');
      } catch (createError) {
        logger.warn('Could not create subscriptions table:', createError.message);
      }
    } else {
      throw syncError;
    }
  }
  
  try {
    await models.Payment.sync({ alter: true });
  } catch (syncError) {
    logger.warn('⚠️  Payment sync error:', syncError.message);
    // Continue with other models
  }
  
  // Sync TenantReview
  try {
    await models.TenantReview.sync({ alter: true });
  } catch (syncError) {
    logger.warn('⚠️  TenantReview sync error:', syncError.message);
    // Continue with other models
  }
}

// Subscription and Payment Models (linked to TenantMaster)
models.Subscription = require('./Subscription');
models.Payment = require('./Payment');

// Define associations for Subscription and Payment
models.Subscription.belongsTo(models.TenantMaster, { foreignKey: 'tenant_id', as: 'tenant' });
models.Subscription.hasMany(models.Payment, { foreignKey: 'subscription_id', as: 'payments' });
models.Payment.belongsTo(models.TenantMaster, { foreignKey: 'tenant_id', as: 'tenant' });
models.Payment.belongsTo(models.Subscription, { foreignKey: 'subscription_id', as: 'subscription' });

// Define associations for TenantReview
models.TenantReview.belongsTo(models.TenantMaster, { foreignKey: 'tenant_id', as: 'tenant' });

models.syncMasterModels = syncMasterModels;

module.exports = models;
