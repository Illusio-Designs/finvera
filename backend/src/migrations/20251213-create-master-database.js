/**
 * Migration to create master database tables
 * Run this on the master database
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create tenant_master table
    await queryInterface.createTable('tenant_master', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      subdomain: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false,
      },
      
      // Database connection info
      db_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      db_host: {
        type: Sequelize.STRING(255),
        defaultValue: 'localhost',
      },
      db_port: {
        type: Sequelize.INTEGER,
        defaultValue: 3306,
      },
      db_user: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      db_password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      
      // Tenant metadata
      gstin: {
        type: Sequelize.STRING(15),
        unique: true,
      },
      pan: Sequelize.STRING(10),
      tan: Sequelize.STRING(10),
      
      // Subscription
      subscription_plan: Sequelize.STRING(50),
      subscription_start: Sequelize.DATE,
      subscription_end: Sequelize.DATE,
      is_trial: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      trial_ends_at: Sequelize.DATE,
      
      // Referral
      salesman_id: Sequelize.UUID,
      distributor_id: Sequelize.UUID,
      referral_code: Sequelize.STRING(20),
      referred_by: Sequelize.UUID,
      referral_type: Sequelize.ENUM('salesman', 'distributor', 'tenant'),
      
      // Contact
      address: Sequelize.TEXT,
      city: Sequelize.STRING(100),
      state: Sequelize.STRING(100),
      pincode: Sequelize.STRING(10),
      phone: Sequelize.STRING(15),
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      
      // Status
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_suspended: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      suspended_reason: Sequelize.TEXT,
      
      // Provisioning
      db_provisioned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      db_provisioned_at: Sequelize.DATE,
      
      // Storage
      storage_limit_mb: {
        type: Sequelize.INTEGER,
        defaultValue: 1024,
      },
      storage_used_mb: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      
      // Metadata
      settings: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create indexes
    await queryInterface.addIndex('tenant_master', ['subdomain']);
    await queryInterface.addIndex('tenant_master', ['db_name']);
    await queryInterface.addIndex('tenant_master', ['gstin']);
    await queryInterface.addIndex('tenant_master', ['email']);
    await queryInterface.addIndex('tenant_master', ['is_active']);
    await queryInterface.addIndex('tenant_master', ['subscription_end']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tenant_master');
  },
};
