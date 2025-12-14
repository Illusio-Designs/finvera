/**
 * Consolidated Migration for Master Database
 * This single file contains all migrations for the master database (tenant_master)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Helper function to check if column exists
    const columnExists = async (tableName, columnName) => {
      try {
        const [results] = await queryInterface.sequelize.query(
          `SELECT COLUMN_NAME 
           FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = '${tableName}' 
           AND COLUMN_NAME = '${columnName}'`
        );
        return results.length > 0;
      } catch (error) {
        return false;
      }
    };

    // Helper function to safely add column
    const addColumnIfNotExists = async (tableName, columnName, columnDefinition) => {
      const exists = await columnExists(tableName, columnName);
      if (!exists) {
        await queryInterface.addColumn(tableName, columnName, columnDefinition);
        return true;
      }
      return false;
    };

    // Helper function to safely add index
    const addIndexIfNotExists = async (tableName, fields, options) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
        return true;
      } catch (error) {
        if (error.message.includes('Duplicate key name') || error.message.includes('already exists')) {
          return false;
        }
        throw error;
      }
    };

    // ============================================
    // CREATE TENANT_MASTER TABLE (from 20251213-create-master-database.js)
    // ============================================
    const [tables] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'tenant_master'");
    
    if (tables.length === 0) {
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

      // Create initial indexes
      await addIndexIfNotExists('tenant_master', ['subdomain']);
      await addIndexIfNotExists('tenant_master', ['db_name']);
      await addIndexIfNotExists('tenant_master', ['gstin']);
      await addIndexIfNotExists('tenant_master', ['email']);
      await addIndexIfNotExists('tenant_master', ['is_active']);
      await addIndexIfNotExists('tenant_master', ['subscription_end']);
    }

    // ============================================
    // ADD ACQUISITION_CATEGORY COLUMN (from 20251215-add-acquisition-category.js)
    // ============================================
    const added = await addColumnIfNotExists('tenant_master', 'acquisition_category', {
      type: Sequelize.ENUM('distributor', 'salesman', 'referral', 'organic'),
      defaultValue: 'organic',
      allowNull: false,
      comment: 'How the tenant was acquired: distributor (from distributor), salesman (from salesman), referral (from referral code), organic (direct from website)',
    });

    if (added) {
      await addIndexIfNotExists('tenant_master', ['acquisition_category'], {
        name: 'tenant_master_acquisition_category',
      });
      console.log('✅ Added acquisition_category column to tenant_master table');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove acquisition_category column and index
    try {
      await queryInterface.removeIndex('tenant_master', 'tenant_master_acquisition_category');
    } catch (error) {
      // Index might not exist
    }
    
    try {
      await queryInterface.removeColumn('tenant_master', 'acquisition_category');
    } catch (error) {
      // Column might not exist
    }
    
    // Drop table (only if you want to completely remove everything)
    // await queryInterface.dropTable('tenant_master');
  },
};
