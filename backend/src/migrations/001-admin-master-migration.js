/**
 * Consolidated Migration for Admin and Master Databases
 * 
 * This file contains all migrations for:
 * - Master Database (finvera_master): tenant_master, companies, tenant_reviews, subscriptions, payments
 * - Admin/Main Database (finvera_main): users, subscription_plans, distributors, salesmen, commissions, payouts, leads, referral tables, notifications
 * 
 * IMPORTANT: This migration should be run on BOTH master and main databases separately
 * - Master DB: Only the master-specific sections
 * - Main DB: Only the admin/main-specific sections
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Detect which database we're running on
    const detectDatabaseType = async () => {
      try {
        // First, check database name directly
        const [dbNameResult] = await queryInterface.sequelize.query("SELECT DATABASE() as db_name");
        const databaseName = (dbNameResult[0]?.db_name || '').toLowerCase();
        
        // Check if it's master database by name
        if (databaseName.includes('master') || databaseName === 'finvera_master') {
          return 'master';
        }
        
        // Check if it's admin/main database by name
        if (databaseName.includes('finvera') && !databaseName.includes('master')) {
          return 'admin';
        }
        
        // If database name doesn't help, check for existing tables
        // Check if tenant_master table exists (indicates master DB)
        try {
          const [tenantMasterCheck] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'tenant_master'");
          if (tenantMasterCheck && tenantMasterCheck.length > 0) {
            return 'master';
          }
        } catch (e) {
          // Table check failed, continue
        }
        
        // Check if users table exists but no tenant_master (indicates admin DB)
        try {
          const [usersCheck] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'users'");
          if (usersCheck && usersCheck.length > 0) {
            return 'admin';
          }
        } catch (e) {
          // Table check failed, continue
        }
        
        // Default: check database name or assume admin
        return databaseName.includes('master') ? 'master' : 'admin';
      } catch (error) {
        // Default to admin if detection fails
        console.warn('Could not detect database type, defaulting to admin:', error.message);
        return 'admin';
      }
    };

    const dbType = await detectDatabaseType();
    const isMasterDB = dbType === 'master';
    const isAdminDB = dbType === 'admin';

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
      try {
        const tableDescription = await queryInterface.describeTable(tableName);
        if (!tableDescription[columnName]) {
          await queryInterface.addColumn(tableName, columnName, columnDefinition);
          return true;
        }
      } catch (error) {
        if (error.message.includes('Duplicate column name') || error.message.includes('already exists')) {
          return false;
        }
        throw error;
      }
      return false;
    };

    // Helper function to safely add index
    const addIndexIfNotExists = async (tableName, fields, options = {}) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
        return true;
      } catch (error) {
        if (error.message.includes('Duplicate key name') || 
            error.message.includes('already exists') ||
            error.message.includes('Too many keys')) {
          if (error.message.includes('Too many keys')) {
            console.warn(`⚠️  Skipping index creation on ${tableName}: Too many keys (MySQL limit: 64)`);
          }
          return false;
        }
        throw error;
      }
    };

    // ============================================
    // MASTER DATABASE MIGRATIONS
    // ============================================
    
    if (isMasterDB) {
    // 1. TENANT_MASTER TABLE
    const [tenantMasterTables] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'tenant_master'");
    if (tenantMasterTables.length === 0) {
      await queryInterface.createTable('tenant_master', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        company_name: {
          type: Sequelize.TEXT,
          allowNull: false,
          comment: 'Changed to TEXT to reduce row size',
        },
        subdomain: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Unique subdomain for tenant (e.g., acme.finvera.com)',
        },
        
        // Database connection info
        db_name: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Legacy: previously used as tenant database name. Now databases are provisioned per company.',
        },
        db_host: {
          type: Sequelize.TEXT,
          defaultValue: process.env.DB_HOST || 'localhost',
          comment: 'Changed to TEXT to reduce row size',
        },
        db_port: {
          type: Sequelize.INTEGER,
          defaultValue: parseInt(process.env.DB_PORT) || 3306,
        },
        db_user: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        db_password: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Legacy: previously used for tenant database. Changed to TEXT to reduce row size.',
        },
        
        // Tenant metadata
        gstin: {
          type: Sequelize.STRING(15),
          comment: 'Primary GSTIN for the company',
        },
        pan: {
          type: Sequelize.STRING(10),
        },
        tan: {
          type: Sequelize.STRING(10),
          comment: 'TAN for TDS',
        },
        
        // Subscription info
        subscription_plan: {
          type: Sequelize.STRING(50),
        },
        subscription_start: {
          type: Sequelize.DATE,
        },
        subscription_end: {
          type: Sequelize.DATE,
        },
        is_trial: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        trial_ends_at: {
          type: Sequelize.DATE,
        },
        
        // Referral info
        salesman_id: {
          type: Sequelize.UUID,
          comment: 'ID of salesman who acquired this tenant',
        },
        distributor_id: {
          type: Sequelize.UUID,
          comment: 'ID of distributor who acquired this tenant',
        },
        referral_code: {
          type: Sequelize.STRING(20),
        },
        referred_by: {
          type: Sequelize.UUID,
          comment: 'Tenant ID who referred this tenant',
        },
        referral_type: {
          type: Sequelize.ENUM('salesman', 'distributor', 'tenant'),
        },
        acquisition_category: {
          type: Sequelize.ENUM('distributor', 'salesman', 'referral', 'organic'),
          defaultValue: 'organic',
          comment: 'How the tenant was acquired: distributor (from distributor), salesman (from salesman), referral (from referral code), organic (direct from website)',
        },
        
        // Contact info
        address: Sequelize.TEXT,
        city: Sequelize.STRING(100),
        state: Sequelize.STRING(100),
        pincode: Sequelize.STRING(10),
        phone: Sequelize.STRING(15),
        email: {
          type: Sequelize.STRING(255),
          allowNull: false,
          comment: 'Email address (VARCHAR for index compatibility)',
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
        
        // Database provisioning status
        db_provisioned: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether database has been created and initialized',
        },
        db_provisioned_at: {
          type: Sequelize.DATE,
        },
        
        // Storage and limits
        storage_limit_mb: {
          type: Sequelize.INTEGER,
          defaultValue: 1024, // 1GB default
        },
        storage_used_mb: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        
        // Razorpay integration
        razorpay_customer_id: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Razorpay customer ID for payment processing',
        },
        razorpay_subscription_id: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Razorpay subscription ID for recurring payments',
        },
        
        // Metadata
        settings: {
          type: Sequelize.JSON,
          defaultValue: {},
          comment: 'Additional tenant-specific settings',
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

      // Only keep essential unique indexes - these are critical for data integrity
      await addIndexIfNotExists('tenant_master', ['subdomain'], { unique: true, name: 'idx_tenant_master_subdomain_unique' });
      await addIndexIfNotExists('tenant_master', ['db_name'], { unique: true, name: 'idx_tenant_master_db_name_unique' });
      // Keep only most frequently queried non-unique indexes
      await addIndexIfNotExists('tenant_master', ['email'], { name: 'idx_tenant_master_email' });
      await addIndexIfNotExists('tenant_master', ['is_active'], { name: 'idx_tenant_master_is_active' });
      // Removed other indexes to stay under MySQL's 64-index limit
      // acquisition_category, gstin, subscription_end can be queried without dedicated indexes
    } else {
      // Add missing columns if table exists
      await addColumnIfNotExists('tenant_master', 'acquisition_category', {
        type: Sequelize.ENUM('distributor', 'salesman', 'referral', 'organic'),
        defaultValue: 'organic',
        allowNull: false,
      });
      await addColumnIfNotExists('tenant_master', 'razorpay_customer_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
      await addColumnIfNotExists('tenant_master', 'razorpay_subscription_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    // 2. COMPANIES TABLE (in master DB)
    const [companyTables] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'companies'");
    if (companyTables.length === 0) {
      await queryInterface.createTable('companies', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'TenantMaster.id',
        },
        created_by_user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'users.id (main database) who created this company',
        },
        
        // Basic Company Information
        company_name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        company_type: {
          type: Sequelize.ENUM(
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
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: 'CIN / LLPIN / other registration number',
        },
        incorporation_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        pan: {
          type: Sequelize.STRING(10),
          allowNull: true,
        },
        tan: {
          type: Sequelize.STRING(10),
          allowNull: true,
        },
        gstin: {
          type: Sequelize.STRING(15),
          allowNull: true,
        },
        is_composition_dealer: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Whether the company is registered as a composition dealer under GST',
        },
        
        // Registered Office Details
        registered_address: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        state: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        pincode: {
          type: Sequelize.STRING(10),
          allowNull: true,
        },
        contact_number: {
          type: Sequelize.STRING(15),
          allowNull: true,
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        logo_url: {
          type: Sequelize.STRING(500),
          allowNull: true,
          comment: 'URL path to company logo image',
        },
        
        // Director/Partner/Proprietor Information (store as JSON array)
        principals: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Array of directors/partners/proprietor objects (name, din, pan, contact, address, etc.)',
        },
        
        // Financial Details
        financial_year_start: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        financial_year_end: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        authorized_capital: {
          type: Sequelize.DECIMAL(18, 2),
          allowNull: true,
        },
        accounting_method: {
          type: Sequelize.ENUM('cash', 'accrual'),
          allowNull: true,
        },
        currency: {
          type: Sequelize.STRING(3),
          allowNull: false,
          defaultValue: 'INR',
        },
        books_beginning_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        
        // Banking + Compliance (JSON blobs)
        bank_details: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        compliance: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        
        // Track provisioning status at company level (mirrors tenant provisioning for now)
        // Database connection info (per company)
        db_name: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        db_host: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        db_port: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        db_user: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        db_password: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'Encrypted password for company database',
        },
        db_provisioned: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        db_provisioned_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        
        // TDS/TCS Settings (Phase 1: Foundation Layer)
        is_tds_enabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Enable TDS (Tax Deducted at Source) compliance',
        },
        is_tcs_enabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Enable TCS (Tax Collected at Source) compliance',
        },
        
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });

      await addIndexIfNotExists('companies', ['tenant_id'], { name: 'idx_companies_tenant_id' });
      await addIndexIfNotExists('companies', ['created_by_user_id'], { name: 'idx_companies_created_by' });
      await addIndexIfNotExists('companies', ['company_name'], { name: 'idx_companies_name' });
      await addIndexIfNotExists('companies', ['db_name'], { name: 'idx_companies_db_name' });
    } else {
      // Add is_composition_dealer column if it doesn't exist
      await addColumnIfNotExists('companies', 'is_composition_dealer', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether the company is registered as a composition dealer under GST',
      });
      
      // Add logo_url column if it doesn't exist
      await addColumnIfNotExists('companies', 'logo_url', {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL path to company logo image',
      });
      
      // Add TDS/TCS settings if they don't exist (Phase 1: Foundation Layer)
      await addColumnIfNotExists('companies', 'is_tds_enabled', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Enable TDS (Tax Deducted at Source) compliance',
      });
      
      await addColumnIfNotExists('companies', 'is_tcs_enabled', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Enable TCS (Tax Collected at Source) compliance',
      });
      
      // Add TDS/TCS configuration fields
      await addColumnIfNotExists('companies', 'tan_number', {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Tax Deduction and Collection Account Number (TAN)',
      });
      
      await addColumnIfNotExists('companies', 'tds_circle', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'TDS Circle/Ward',
      });
      
      await addColumnIfNotExists('companies', 'tds_ao_code', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'TDS Assessing Officer Code',
      });
      
      await addColumnIfNotExists('companies', 'tds_deductor_type', {
        type: Sequelize.ENUM('individual', 'company', 'government', 'others'),
        allowNull: true,
        defaultValue: 'company',
        comment: 'Type of TDS Deductor',
      });
      
      await addColumnIfNotExists('companies', 'tds_responsible_person', {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Person responsible for TDS compliance',
      });
      
      await addColumnIfNotExists('companies', 'tds_responsible_designation', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Designation of responsible person',
      });
    }

    // 3. TENANT_REVIEWS TABLE (in master DB)
    const [reviewTables] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'tenant_reviews'");
    if (reviewTables.length === 0) {
      await queryInterface.createTable('tenant_reviews', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'tenant_master',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: true,
        },
        rating: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
        comment: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        reviewer_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        reviewer_designation: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        reviewer_company: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
        is_approved: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        is_featured: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        helpful_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
      });

      await addIndexIfNotExists('tenant_reviews', ['tenant_id'], { name: 'idx_tenant_reviews_tenant_id' });
      await addIndexIfNotExists('tenant_reviews', ['is_approved', 'is_featured', 'created_at'], {
        name: 'idx_tenant_reviews_approved_featured_created',
      });
      await addIndexIfNotExists('tenant_reviews', ['rating'], { name: 'idx_tenant_reviews_rating' });
    }

    // 5. SUBSCRIPTIONS TABLE (in master DB for Razorpay)
    const [subscriptionsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'subscriptions'");
    if (subscriptionsTable.length === 0) {
      await queryInterface.createTable('subscriptions', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.literal('(UUID())'),
        },
        tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'tenant_master',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        subscription_plan_id: {
          type: Sequelize.UUID,
          allowNull: true,
        },
        razorpay_subscription_id: {
          type: Sequelize.STRING(255),
          allowNull: false,
          // Removed unique: true to avoid MySQL 64-index limit
          // Uniqueness is enforced at application level
        },
        razorpay_plan_id: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM('created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired'),
          defaultValue: 'created',
        },
        plan_code: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        plan_name: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        billing_cycle: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        base_price: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
        },
        discounted_price: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
        },
        amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
        },
        currency: {
          type: Sequelize.STRING(3),
          defaultValue: 'INR',
        },
        trial_days: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        max_users: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        max_invoices_per_month: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        max_companies: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
        },
        storage_limit_gb: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        features: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        salesman_commission_rate: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
        },
        distributor_commission_rate: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
        },
        renewal_commission_rate: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        is_visible: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        is_featured: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        display_order: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        valid_from: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        valid_until: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        start_date: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        end_date: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        current_period_start: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        current_period_end: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        cancelled_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });

      await addIndexIfNotExists('subscriptions', ['tenant_id'], { name: 'idx_subscriptions_tenant_id' });
      await addIndexIfNotExists('subscriptions', ['razorpay_subscription_id'], { name: 'idx_subscriptions_razorpay_id', unique: true });
      await addIndexIfNotExists('subscriptions', ['status'], { name: 'idx_subscriptions_status' });
    } else {
      // Table exists, add new columns if they don't exist
      const columnExists = async (column) => {
        const [results] = await queryInterface.sequelize.query(
          `SHOW COLUMNS FROM subscriptions LIKE '${column}'`
        );
        return results.length > 0;
      };

      // Add new columns
      if (!(await columnExists('plan_name'))) {
        await queryInterface.addColumn('subscriptions', 'plan_name', {
          type: Sequelize.STRING(255),
          allowNull: true,
        });
      }
      if (!(await columnExists('description'))) {
        await queryInterface.addColumn('subscriptions', 'description', {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }
      if (!(await columnExists('base_price'))) {
        await queryInterface.addColumn('subscriptions', 'base_price', {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
        });
      }
      if (!(await columnExists('discounted_price'))) {
        await queryInterface.addColumn('subscriptions', 'discounted_price', {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
        });
      }
      if (!(await columnExists('trial_days'))) {
        await queryInterface.addColumn('subscriptions', 'trial_days', {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        });
      }
      if (!(await columnExists('max_users'))) {
        await queryInterface.addColumn('subscriptions', 'max_users', {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
      if (!(await columnExists('max_invoices_per_month'))) {
        await queryInterface.addColumn('subscriptions', 'max_invoices_per_month', {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
      if (!(await columnExists('max_companies'))) {
        await queryInterface.addColumn('subscriptions', 'max_companies', {
          type: Sequelize.INTEGER,
          defaultValue: 1,
        });
      }
      if (!(await columnExists('storage_limit_gb'))) {
        await queryInterface.addColumn('subscriptions', 'storage_limit_gb', {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
      if (!(await columnExists('features'))) {
        await queryInterface.addColumn('subscriptions', 'features', {
          type: Sequelize.JSON,
          allowNull: true,
        });
      }
      if (!(await columnExists('salesman_commission_rate'))) {
        await queryInterface.addColumn('subscriptions', 'salesman_commission_rate', {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
        });
      }
      if (!(await columnExists('distributor_commission_rate'))) {
        await queryInterface.addColumn('subscriptions', 'distributor_commission_rate', {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
        });
      }
      if (!(await columnExists('renewal_commission_rate'))) {
        await queryInterface.addColumn('subscriptions', 'renewal_commission_rate', {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
        });
      }
      if (!(await columnExists('is_active'))) {
        await queryInterface.addColumn('subscriptions', 'is_active', {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        });
      }
      if (!(await columnExists('is_visible'))) {
        await queryInterface.addColumn('subscriptions', 'is_visible', {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        });
      }
      if (!(await columnExists('is_featured'))) {
        await queryInterface.addColumn('subscriptions', 'is_featured', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        });
      }
      if (!(await columnExists('display_order'))) {
        await queryInterface.addColumn('subscriptions', 'display_order', {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
      if (!(await columnExists('valid_from'))) {
        await queryInterface.addColumn('subscriptions', 'valid_from', {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }
      if (!(await columnExists('valid_until'))) {
        await queryInterface.addColumn('subscriptions', 'valid_until', {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }
    }

    // 6. ACCOUNT_GROUPS TABLE ENHANCEMENTS (in master DB)
    const [accountGroupsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'account_groups'");
    if (accountGroupsTable.length > 0) {
      console.log('🔧 Enhancing account_groups table...');
      
      // Check existing columns
      const [columns] = await queryInterface.sequelize.query(`SHOW COLUMNS FROM account_groups`);
      const existingColumns = columns.map(c => c.Field);
      
      // Add new columns if they don't exist
      if (!existingColumns.includes('nature')) {
        await queryInterface.sequelize.query(`
          ALTER TABLE account_groups 
          ADD COLUMN nature VARCHAR(20) COMMENT 'asset/liability/equity/income/expense'
        `);
        console.log('   ✓ Added: nature');
      } else {
        // Modify existing nature column to support 'equity'
        await queryInterface.sequelize.query(`
          ALTER TABLE account_groups 
          MODIFY COLUMN nature ENUM('asset','liability','equity','income','expense') NOT NULL
        `);
        console.log('   ✓ Modified: nature (added equity option)');
      }

      if (!existingColumns.includes('bs_category')) {
        await queryInterface.sequelize.query(`
          ALTER TABLE account_groups 
          ADD COLUMN bs_category VARCHAR(30) COMMENT 'Balance Sheet category'
        `);
        console.log('   ✓ Added: bs_category');
      }

      if (!existingColumns.includes('affects_pl')) {
        await queryInterface.sequelize.query(`
          ALTER TABLE account_groups 
          ADD COLUMN affects_pl BOOLEAN DEFAULT false COMMENT 'Affects Profit & Loss'
        `);
        console.log('   ✓ Added: affects_pl');
      }

      if (!existingColumns.includes('is_tax_group')) {
        await queryInterface.sequelize.query(`
          ALTER TABLE account_groups 
          ADD COLUMN is_tax_group BOOLEAN DEFAULT false COMMENT 'GST/Tax control group'
        `);
        console.log('   ✓ Added: is_tax_group');
      }

      if (!existingColumns.includes('ptoprt')) {
        await queryInterface.sequelize.query(`
          ALTER TABLE account_groups 
          ADD COLUMN ptoprt BOOLEAN DEFAULT false COMMENT 'Whether this group/category should be printed in reports'
        `);
        console.log('   ✓ Added: ptoprt');
      }

      // Update existing groups with proper metadata
      console.log('📋 Updating group metadata...');

      // ASSET GROUPS - Current Assets
      await queryInterface.sequelize.query(`
        UPDATE account_groups 
        SET nature='asset', bs_category='current_asset', affects_pl=false, ptoprt=true 
        WHERE group_code IN ('BANK','CASH','CA','LA','INV','SD')
      `);

      // ASSET GROUPS - Fixed Assets
      await queryInterface.sequelize.query(`
        UPDATE account_groups 
        SET nature='asset', bs_category='fixed_asset', affects_pl=false, ptoprt=true 
        WHERE group_code='FA'
      `);

      // LIABILITY GROUPS - Current Liabilities
      await queryInterface.sequelize.query(`
        UPDATE account_groups 
        SET nature='liability', bs_category='current_liability', affects_pl=false, ptoprt=true 
        WHERE group_code IN ('CL','SC')
      `);

      // LIABILITY GROUPS - Non-current Liabilities
      await queryInterface.sequelize.query(`
        UPDATE account_groups 
        SET nature='liability', bs_category='noncurrent_liability', affects_pl=false, ptoprt=true 
        WHERE group_code='LOAN'
      `);

      // EQUITY GROUPS
      await queryInterface.sequelize.query(`
        UPDATE account_groups 
        SET nature='equity', bs_category='equity', affects_pl=false, ptoprt=true 
        WHERE group_code IN ('CAP','RES')
      `);

      // TAX CONTROL GROUP (Special handling for GST)
      await queryInterface.sequelize.query(`
        UPDATE account_groups 
        SET nature='liability', bs_category='tax_control', is_tax_group=true, affects_pl=false, ptoprt=false 
        WHERE group_code='DT'
      `);

      // INCOME GROUPS (affects P&L)
      await queryInterface.sequelize.query(`
        UPDATE account_groups 
        SET nature='income', affects_pl=true, ptoprt=true 
        WHERE group_code IN ('DIR_INC','IND_INC','SAL')
      `);

      // EXPENSE GROUPS (affects P&L)
      await queryInterface.sequelize.query(`
        UPDATE account_groups 
        SET nature='expense', affects_pl=true, ptoprt=true 
        WHERE group_code IN ('DIR_EXP','IND_EXP','PUR')
      `);

      console.log('✅ Account groups enhancement complete');
    }

    // 7. PAYMENTS TABLE (in master DB for Razorpay)
    const [paymentsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'payments'");
    if (paymentsTable.length === 0) {
      await queryInterface.createTable('payments', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.literal('(UUID())'),
        },
        tenant_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'tenant_master',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        subscription_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'subscriptions',
            key: 'id',
          },
          onDelete: 'SET NULL',
        },
        razorpay_payment_id: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
        },
        razorpay_order_id: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        razorpay_invoice_id: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
        },
        currency: {
          type: Sequelize.STRING(3),
          defaultValue: 'INR',
        },
        status: {
          type: Sequelize.ENUM('created', 'authorized', 'captured', 'refunded', 'failed'),
          defaultValue: 'created',
        },
        method: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        notes: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        paid_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });

      await addIndexIfNotExists('payments', ['tenant_id'], { name: 'idx_payments_tenant_id' });
      await addIndexIfNotExists('payments', ['subscription_id'], { name: 'idx_payments_subscription_id' });
      await addIndexIfNotExists('payments', ['razorpay_payment_id'], { name: 'idx_payments_razorpay_id', unique: true });
      await addIndexIfNotExists('payments', ['status'], { name: 'idx_payments_status' });
    }
    
    // 7. TDS SECTION MASTER TABLE (in master DB - Phase 1: Foundation Layer)
    const [tdsSectionTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'tds_section_master'");
    if (tdsSectionTable.length === 0) {
      await queryInterface.createTable('tds_section_master', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        section_code: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true,
          comment: 'Section code (194C, 194J, etc.)',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: false,
          comment: 'Description of the section',
        },
        rate_individual: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          comment: 'TDS rate for individuals (%)',
        },
        rate_company: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          comment: 'TDS rate for companies (%)',
        },
        threshold_limit: {
          type: Sequelize.DECIMAL(18, 2),
          allowNull: true,
          comment: 'Threshold limit for TDS applicability',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
      });

      // Insert default TDS sections
      await queryInterface.bulkInsert('tds_section_master', [
        {
          section_code: '194C',
          description: 'Payment to contractors and sub-contractors',
          rate_individual: 1.00,
          rate_company: 2.00,
          threshold_limit: 30000.00,
        },
        {
          section_code: '194J',
          description: 'Fees for professional or technical services',
          rate_individual: 10.00,
          rate_company: 10.00,
          threshold_limit: 30000.00,
        },
        {
          section_code: '194H',
          description: 'Commission or brokerage',
          rate_individual: 5.00,
          rate_company: 5.00,
          threshold_limit: 15000.00,
        },
        {
          section_code: '194I',
          description: 'Rent',
          rate_individual: 10.00,
          rate_company: 10.00,
          threshold_limit: 240000.00,
        },
        {
          section_code: '194Q',
          description: 'Payment for purchase of goods',
          rate_individual: 0.10,
          rate_company: 0.10,
          threshold_limit: 5000000.00,
        },
      ]);
      
      await addIndexIfNotExists('tds_section_master', ['section_code'], { name: 'idx_tds_section_code', unique: true });
      await addIndexIfNotExists('tds_section_master', ['is_active'], { name: 'idx_tds_is_active' });
    }

    // 8. TCS SECTION MASTER TABLE (in master DB - Phase 1: Foundation Layer)
    const [tcsSectionTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'tcs_section_master'");
    if (tcsSectionTable.length === 0) {
      await queryInterface.createTable('tcs_section_master', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        section_code: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true,
          comment: 'Section code (206C1H, etc.)',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: false,
          comment: 'Description of the section',
        },
        rate: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          comment: 'TCS rate (%)',
        },
        threshold_limit: {
          type: Sequelize.DECIMAL(18, 2),
          allowNull: true,
          comment: 'Threshold limit for TCS applicability',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
      });

      // Insert default TCS sections
      await queryInterface.bulkInsert('tcs_section_master', [
        {
          section_code: '206C1H',
          description: 'Sale of goods',
          rate: 0.10,
          threshold_limit: 5000000.00,
        },
      ]);
      
      await addIndexIfNotExists('tcs_section_master', ['section_code'], { name: 'idx_tcs_section_code', unique: true });
      await addIndexIfNotExists('tcs_section_master', ['is_active'], { name: 'idx_tcs_is_active' });
    }
    
    } // End of Master DB section

    // ============================================
    // ADMIN/MAIN DATABASE MIGRATIONS
    // ============================================

    if (isAdminDB) {
    // 1. USERS TABLE
    const [usersTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'users'");
    if (usersTable.length === 0) {
      await queryInterface.createTable('users', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        tenant_id: { type: Sequelize.UUID, allowNull: true },
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        password: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Password hash (null for OAuth users)',
        },
        google_id: {
          type: Sequelize.STRING(255),
          allowNull: true,
          unique: true,
          comment: 'Google OAuth user ID',
        },
        name: Sequelize.STRING,
        role: Sequelize.STRING,
        phone: Sequelize.STRING(15),
        profile_image: Sequelize.STRING(500),
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        last_login: Sequelize.DATE,
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    } else {
      await addColumnIfNotExists('users', 'profile_image', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
      await addColumnIfNotExists('users', 'google_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'Google OAuth user ID',
      });
    }

    // 2. SUBSCRIPTION_PLANS TABLE
    const [plansTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'subscription_plans'");
    if (plansTable.length === 0) {
      await queryInterface.createTable('subscription_plans', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        plan_code: { type: Sequelize.STRING, allowNull: false, unique: true },
        plan_name: { type: Sequelize.STRING, allowNull: false },
        description: Sequelize.TEXT,
        billing_cycle: Sequelize.STRING,
        base_price: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        discounted_price: Sequelize.DECIMAL(15, 2),
        currency: { type: Sequelize.STRING(3), defaultValue: 'INR' },
        trial_days: { type: Sequelize.INTEGER, defaultValue: 0 },
        max_users: Sequelize.INTEGER,
        max_invoices_per_month: Sequelize.INTEGER,
        max_companies: { type: Sequelize.INTEGER, defaultValue: 1 },
        storage_limit_gb: Sequelize.INTEGER,
        features: Sequelize.JSON,
        salesman_commission_rate: Sequelize.DECIMAL(5, 2),
        distributor_commission_rate: Sequelize.DECIMAL(5, 2),
        renewal_commission_rate: Sequelize.DECIMAL(5, 2),
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        is_visible: { type: Sequelize.BOOLEAN, defaultValue: true },
        is_featured: { type: Sequelize.BOOLEAN, defaultValue: false },
        display_order: Sequelize.INTEGER,
        valid_from: Sequelize.DATE,
        valid_until: Sequelize.DATE,
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    } else {
      // Table exists, add new columns if they don't exist
      const columnExists = async (column) => {
        const [results] = await queryInterface.sequelize.query(
          `SHOW COLUMNS FROM subscription_plans LIKE '${column}'`
        );
        return results.length > 0;
      };

      // Add new columns if they don't exist
      if (!(await columnExists('is_visible'))) {
        await queryInterface.addColumn('subscription_plans', 'is_visible', {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        });
      }
      if (!(await columnExists('is_featured'))) {
        await queryInterface.addColumn('subscription_plans', 'is_featured', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        });
      }
      if (!(await columnExists('display_order'))) {
        await queryInterface.addColumn('subscription_plans', 'display_order', {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
      if (!(await columnExists('valid_from'))) {
        await queryInterface.addColumn('subscription_plans', 'valid_from', {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }
      if (!(await columnExists('valid_until'))) {
        await queryInterface.addColumn('subscription_plans', 'valid_until', {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }
    }

    // 3. DISTRIBUTORS TABLE
    const [distributorsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'distributors'");
    if (distributorsTable.length === 0) {
      await queryInterface.createTable('distributors', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        user_id: { type: Sequelize.UUID, allowNull: false },
        distributor_code: { type: Sequelize.STRING, allowNull: false, unique: true },
        company_name: Sequelize.STRING,
        territory: Sequelize.JSON,
        commission_rate: Sequelize.DECIMAL(5, 2),
        payment_terms: Sequelize.STRING,
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 4. SALESMEN TABLE
    const [salesmenTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'salesmen'");
    if (salesmenTable.length === 0) {
      await queryInterface.createTable('salesmen', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        user_id: { type: Sequelize.UUID, allowNull: false },
        distributor_id: { type: Sequelize.UUID, allowNull: true },
        salesman_code: { type: Sequelize.STRING, allowNull: false, unique: true },
        full_name: { type: Sequelize.STRING, allowNull: false },
        territory: Sequelize.JSON,
        commission_rate: Sequelize.DECIMAL(5, 2),
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 5. COMMISSIONS TABLE
    const [commissionsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'commissions'");
    if (commissionsTable.length === 0) {
      await queryInterface.createTable('commissions', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        tenant_id: { type: Sequelize.UUID, allowNull: false },
        distributor_id: Sequelize.UUID,
        salesman_id: Sequelize.UUID,
        commission_type: Sequelize.STRING,
        subscription_plan: Sequelize.STRING,
        amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        commission_rate: Sequelize.DECIMAL(5, 2),
        status: { type: Sequelize.STRING, defaultValue: 'pending' },
        payout_id: Sequelize.UUID,
        commission_date: Sequelize.DATE,
        notes: Sequelize.TEXT,
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 6. PAYOUTS TABLE
    const [payoutsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'payouts'");
    if (payoutsTable.length === 0) {
      await queryInterface.createTable('payouts', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        distributor_id: Sequelize.UUID,
        salesman_id: Sequelize.UUID,
        payout_type: Sequelize.STRING,
        total_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        status: { type: Sequelize.STRING, defaultValue: 'pending' },
        payment_method: Sequelize.STRING,
        payment_reference: Sequelize.STRING,
        paid_date: Sequelize.DATE,
        notes: Sequelize.TEXT,
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 7. LEADS TABLE
    const [leadsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'leads'");
    if (leadsTable.length === 0) {
      await queryInterface.createTable('leads', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        salesman_id: { type: Sequelize.UUID, allowNull: false },
        distributor_id: Sequelize.UUID,
        company_name: { type: Sequelize.STRING, allowNull: false },
        contact_person: Sequelize.STRING,
        email: Sequelize.STRING,
        phone: Sequelize.STRING(15),
        status: { type: Sequelize.STRING, defaultValue: 'new' },
        source: Sequelize.STRING,
        notes: Sequelize.TEXT,
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 8. LEAD_ACTIVITIES TABLE
    const [leadActivitiesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'lead_activities'");
    if (leadActivitiesTable.length === 0) {
      await queryInterface.createTable('lead_activities', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        lead_id: { type: Sequelize.UUID, allowNull: false },
        activity_type: Sequelize.STRING,
        description: Sequelize.TEXT,
        activity_date: Sequelize.DATE,
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 9. TARGETS TABLE
    const [targetsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'targets'");
    if (targetsTable.length === 0) {
      await queryInterface.createTable('targets', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        distributor_id: Sequelize.UUID,
        salesman_id: Sequelize.UUID,
        target_type: Sequelize.STRING,
        target_period: Sequelize.STRING,
        target_value: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
        achieved_value: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
        start_date: Sequelize.DATE,
        end_date: Sequelize.DATE,
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 10. REFERRAL_CODES TABLE
    const [referralCodesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'referral_codes'");
    if (referralCodesTable.length === 0) {
      await queryInterface.createTable('referral_codes', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        code: { type: Sequelize.STRING, allowNull: false, unique: true },
        owner_type: Sequelize.STRING,
        owner_id: { type: Sequelize.UUID, allowNull: false },
        discount_type: Sequelize.STRING,
        discount_value: Sequelize.DECIMAL(10, 2),
        free_trial_days: Sequelize.INTEGER,
        max_uses: Sequelize.INTEGER,
        current_uses: { type: Sequelize.INTEGER, defaultValue: 0 },
        valid_from: Sequelize.DATE,
        valid_until: Sequelize.DATE,
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 11. REFERRAL_REWARDS TABLE
    const [referralRewardsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'referral_rewards'");
    if (referralRewardsTable.length === 0) {
      await queryInterface.createTable('referral_rewards', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        referrer_type: Sequelize.STRING,
        referrer_id: { type: Sequelize.UUID, allowNull: false },
        referee_tenant_id: Sequelize.UUID,
        referral_code_id: Sequelize.UUID,
        reward_type: Sequelize.STRING,
        reward_amount: Sequelize.DECIMAL(15, 2),
        reward_status: Sequelize.STRING,
        subscription_plan: Sequelize.STRING,
        reward_date: Sequelize.DATE,
        payment_date: Sequelize.DATE,
        notes: Sequelize.TEXT,
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 12. REFERRAL_DISCOUNT_CONFIGS TABLE
    const [referralDiscountConfigsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'referral_discount_configs'");
    if (referralDiscountConfigsTable.length === 0) {
      await queryInterface.createTable('referral_discount_configs', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        discount_percentage: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 10.00 },
        effective_from: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        effective_until: { type: Sequelize.DATE, allowNull: true },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        notes: Sequelize.TEXT,
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 13. NOTIFICATIONS TABLE
    const [notificationsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'notifications'");
    if (notificationsTable.length === 0) {
      await queryInterface.createTable('notifications', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
        user_id: { type: Sequelize.UUID, allowNull: false },
        type: { type: Sequelize.STRING, allowNull: false },
        title: { type: Sequelize.STRING(255), allowNull: false },
        message: { type: Sequelize.TEXT, allowNull: false },
        priority: { type: Sequelize.ENUM('critical', 'high', 'medium', 'low'), defaultValue: 'medium' },
        is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
        read_at: { type: Sequelize.DATE, allowNull: true },
        action_url: { type: Sequelize.STRING(500), allowNull: true },
        metadata: { type: Sequelize.JSON, defaultValue: {} },
        sent_email: { type: Sequelize.BOOLEAN, defaultValue: false },
        sent_at: { type: Sequelize.DATE, allowNull: true },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      });
    }

    // 14. NOTIFICATION_PREFERENCES TABLE
    const [notificationPreferencesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'notification_preferences'");
    if (notificationPreferencesTable.length === 0) {
      await queryInterface.createTable('notification_preferences', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          unique: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        in_app_enabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        email_enabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        desktop_enabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        sound_enabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        type_preferences: {
          type: Sequelize.JSON,
          defaultValue: {},
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
      });

      await addIndexIfNotExists('notification_preferences', ['user_id'], {
        unique: true,
        name: 'idx_notification_preferences_user_id_unique',
      });
    }

    // Add indexes for admin/main DB tables
    await addIndexIfNotExists('users', ['tenant_id']);
    await addIndexIfNotExists('users', ['google_id'], { name: 'idx_users_google_id', unique: true });
    await addIndexIfNotExists('commissions', ['tenant_id', 'status'], { name: 'idx_commissions_tenant_status' });
    await addIndexIfNotExists('commissions', ['distributor_id'], { name: 'idx_commissions_distributor' });
    await addIndexIfNotExists('commissions', ['salesman_id'], { name: 'idx_commissions_salesman' });
    await addIndexIfNotExists('referral_rewards', ['referrer_id']);

    // ============================================
    // SUPPORT SYSTEM TABLES
    // ============================================

    // 15. SUPPORT_TICKETS TABLE
    const [supportTicketsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'support_tickets'");
    if (supportTicketsTable.length === 0) {
      await queryInterface.createTable('support_tickets', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        ticket_number: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true,
          comment: 'Auto-generated ticket number (e.g., TKT-2024-0001)',
        },
        tenant_id: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'Tenant who raised the ticket (null for non-tenant users)',
        },
        client_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        client_email: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        client_phone: {
          type: Sequelize.STRING(15),
          allowNull: true,
        },
        subject: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        category: {
          type: Sequelize.ENUM('technical', 'billing', 'feature_request', 'bug_report', 'general', 'other'),
          defaultValue: 'general',
        },
        priority: {
          type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
          defaultValue: 'medium',
        },
        status: {
          type: Sequelize.ENUM('open', 'assigned', 'in_progress', 'waiting_client', 'resolved', 'closed'),
          defaultValue: 'open',
        },
        assigned_to: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'Support agent assigned to this ticket',
        },
        attachments: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Array of attachment file paths',
        },
        resolution_notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        resolved_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        closed_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      });

      await addIndexIfNotExists('support_tickets', ['ticket_number'], { name: 'idx_support_tickets_number', unique: true });
      await addIndexIfNotExists('support_tickets', ['tenant_id'], { name: 'idx_support_tickets_tenant_id' });
      await addIndexIfNotExists('support_tickets', ['status'], { name: 'idx_support_tickets_status' });
      await addIndexIfNotExists('support_tickets', ['assigned_to'], { name: 'idx_support_tickets_assigned_to' });
      await addIndexIfNotExists('support_tickets', ['client_email'], { name: 'idx_support_tickets_client_email' });
      console.log('✓ Created table support_tickets');
    } else {
      console.log('ℹ️  Table support_tickets already exists');
    }

    // 16. TICKET_MESSAGES TABLE
    const [ticketMessagesTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'ticket_messages'");
    if (ticketMessagesTable.length === 0) {
      await queryInterface.createTable('ticket_messages', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        ticket_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'support_tickets',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        sender_type: {
          type: Sequelize.ENUM('client', 'agent', 'system'),
          allowNull: false,
        },
        sender_id: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'User ID if sender is agent, null for client/system',
        },
        sender_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        attachments: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Array of attachment file paths',
        },
        is_internal: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Internal notes visible only to agents',
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      });

      await addIndexIfNotExists('ticket_messages', ['ticket_id'], { name: 'idx_ticket_messages_ticket_id' });
      await addIndexIfNotExists('ticket_messages', ['sender_id'], { name: 'idx_ticket_messages_sender_id' });
      console.log('✓ Created table ticket_messages');
    } else {
      console.log('ℹ️  Table ticket_messages already exists');
    }

    // 17. SUPPORT_AGENT_REVIEWS TABLE
    const [supportAgentReviewsTable] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'support_agent_reviews'");
    if (supportAgentReviewsTable.length === 0) {
      await queryInterface.createTable('support_agent_reviews', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        ticket_id: {
          type: Sequelize.UUID,
          allowNull: false,
          unique: true,
          references: {
            model: 'support_tickets',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        agent_id: {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'Support agent being reviewed',
        },
        client_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        client_email: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        rating: {
          type: Sequelize.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
            max: 5,
          },
        },
        feedback: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        service_quality: {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: {
            min: 1,
            max: 5,
          },
        },
        response_time: {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: {
            min: 1,
            max: 5,
          },
        },
        problem_resolution: {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: {
            min: 1,
            max: 5,
          },
        },
        would_recommend: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      });

      await addIndexIfNotExists('support_agent_reviews', ['ticket_id'], { name: 'idx_support_agent_reviews_ticket_id', unique: true });
      await addIndexIfNotExists('support_agent_reviews', ['agent_id'], { name: 'idx_support_agent_reviews_agent_id' });
      await addIndexIfNotExists('support_agent_reviews', ['rating'], { name: 'idx_support_agent_reviews_rating' });
      console.log('✓ Created table support_agent_reviews');
    } else {
      console.log('ℹ️  Table support_agent_reviews already exists');
    }

    } // End of Admin DB section
  },

  async down(queryInterface, Sequelize) {
    // Drop admin/main DB tables (in reverse order of creation)
    await queryInterface.dropTable('support_agent_reviews');
    await queryInterface.dropTable('ticket_messages');
    await queryInterface.dropTable('support_tickets');
    await queryInterface.dropTable('notification_preferences');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('referral_discount_configs');
    await queryInterface.dropTable('referral_rewards');
    await queryInterface.dropTable('referral_codes');
    await queryInterface.dropTable('targets');
    await queryInterface.dropTable('lead_activities');
    await queryInterface.dropTable('leads');
    await queryInterface.dropTable('payouts');
    await queryInterface.dropTable('commissions');
    await queryInterface.dropTable('salesmen');
    await queryInterface.dropTable('distributors');
    await queryInterface.dropTable('subscription_plans');
    await queryInterface.dropTable('users');

    // Drop master DB tables
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('subscriptions');
    await queryInterface.dropTable('tenant_reviews');
    await queryInterface.dropTable('companies');
    await queryInterface.dropTable('tenant_master');
  },
};
