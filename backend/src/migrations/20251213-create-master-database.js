/**
 * Migration to create master database tables
 * Run this on the master database
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Helper function to safely add index
    const addIndexIfNotExists = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        // Handle duplicate key errors
        if (error.message.includes('Duplicate key name') || 
            error.message.includes('already exists') ||
            error.original?.code === 'ER_DUP_KEYNAME') {
          console.warn(`⚠️  Index already exists on ${tableName}, skipping...`);
          return;
        }
        // Handle "Too many keys" error
        if (error.message.includes('Too many keys') || 
            error.message.includes('ER_TOO_MANY_KEYS') ||
            error.original?.code === 'ER_TOO_MANY_KEYS') {
          console.warn(`⚠️  Skipping index creation on ${tableName}: Too many keys (MySQL limit: 64)`);
          return;
        }
        throw error;
      }
    };

    // Check if table already exists
    const [tables] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'tenant_master'");
    const tableExists = tables.length > 0;

    if (!tableExists) {
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
      console.log('✓ Created tenant_master table');
    } else {
      console.log('✓ tenant_master table already exists, skipping creation');
    }

    // Create indexes (safe - will skip if already exist)
    await addIndexIfNotExists('tenant_master', ['subdomain'], { name: 'idx_tenant_master_subdomain' });
    await addIndexIfNotExists('tenant_master', ['db_name'], { name: 'idx_tenant_master_db_name' });
    await addIndexIfNotExists('tenant_master', ['gstin'], { name: 'idx_tenant_master_gstin' });
    await addIndexIfNotExists('tenant_master', ['email'], { name: 'idx_tenant_master_email' });
    await addIndexIfNotExists('tenant_master', ['is_active'], { name: 'idx_tenant_master_is_active' });
    await addIndexIfNotExists('tenant_master', ['subscription_end'], { name: 'idx_tenant_master_subscription_end' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tenant_master');
  },
};
