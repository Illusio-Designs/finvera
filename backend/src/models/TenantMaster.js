const { DataTypes } = require('sequelize');
const masterSequelize = require('../config/masterDatabase');

/**
 * Tenant Master Model
 * Stored in the master database
 * Contains metadata and database connection info for each tenant
 */
const TenantMaster = masterSequelize.define(
  'TenantMaster',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subdomain: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      comment: 'Unique subdomain for tenant (e.g., acme.finvera.com)',
    },
    
    // Database connection info
    db_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Name of tenant database',
    },
    db_host: {
      type: DataTypes.STRING(255),
      defaultValue: process.env.DB_HOST || 'localhost',
    },
    db_port: {
      type: DataTypes.INTEGER,
      defaultValue: parseInt(process.env.DB_PORT) || 3306,
    },
    db_user: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    db_password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Encrypted password for tenant database',
    },
    
    // Tenant metadata
    gstin: {
      type: DataTypes.STRING(15),
      unique: true,
      comment: 'Primary GSTIN for the company',
    },
    pan: {
      type: DataTypes.STRING(10),
    },
    tan: {
      type: DataTypes.STRING(10),
      comment: 'TAN for TDS',
    },
    
    // Subscription info
    subscription_plan: {
      type: DataTypes.STRING(50),
    },
    subscription_start: {
      type: DataTypes.DATE,
    },
    subscription_end: {
      type: DataTypes.DATE,
    },
    is_trial: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    trial_ends_at: {
      type: DataTypes.DATE,
    },
    
    // Referral info
    salesman_id: {
      type: DataTypes.UUID,
      comment: 'ID of salesman who acquired this tenant',
    },
    distributor_id: {
      type: DataTypes.UUID,
      comment: 'ID of distributor who acquired this tenant',
    },
    referral_code: {
      type: DataTypes.STRING(20),
    },
    referred_by: {
      type: DataTypes.UUID,
      comment: 'Tenant ID who referred this tenant',
    },
    referral_type: {
      type: DataTypes.ENUM('salesman', 'distributor', 'tenant'),
    },
    
    // Contact info
    address: DataTypes.TEXT,
    city: DataTypes.STRING(100),
    state: DataTypes.STRING(100),
    pincode: DataTypes.STRING(10),
    phone: DataTypes.STRING(15),
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    
    // Status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_suspended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    suspended_reason: DataTypes.TEXT,
    
    // Database provisioning status
    db_provisioned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether database has been created and initialized',
    },
    db_provisioned_at: {
      type: DataTypes.DATE,
    },
    
    // Storage and limits
    storage_limit_mb: {
      type: DataTypes.INTEGER,
      defaultValue: 1024, // 1GB default
    },
    storage_used_mb: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    
    // Metadata
    settings: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Additional tenant-specific settings',
    },
  },
  {
    tableName: 'tenant_master',
    timestamps: true,
    indexes: [
      { fields: ['subdomain'] },
      { fields: ['db_name'] },
      { fields: ['gstin'] },
      { fields: ['email'] },
      { fields: ['is_active'] },
      { fields: ['subscription_end'] },
    ],
  },
);

module.exports = TenantMaster;
