const { Sequelize } = require('sequelize');
const crypto = require('crypto');
const TenantMaster = require('../models/TenantMaster');
const tenantConnectionManager = require('../config/tenantConnectionManager');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Tenant Provisioning Service
 * Handles creation of new tenant databases and initialization
 */
class TenantProvisioningService {
  /**
   * Create a new tenant with separate database
   * @param {Object} tenantData - Tenant information
   * @returns {Promise<Object>} - Created tenant with database info
   */
  async createTenant(tenantData) {
    const {
      company_name,
      subdomain,
      email,
      gstin,
      pan,
      tan,
      subscription_plan,
      phone,
      address,
      city,
      state,
      pincode,
      salesman_id,
      distributor_id,
      referred_by,
      referral_type,
    } = tenantData;

    try {
      // Generate unique database name
      const dbName = this.generateDatabaseName(subdomain);
      
      // Generate database credentials
      const dbUser = this.generateDatabaseUser(subdomain);
      const dbPassword = this.generateSecurePassword();
      
      // Determine acquisition category
      let acquisitionCategory = 'organic'; // Default: direct from website
      if (distributor_id) {
        acquisitionCategory = 'distributor';
      } else if (salesman_id) {
        acquisitionCategory = 'salesman';
      } else if (referred_by || referral_type) {
        acquisitionCategory = 'referral';
      }

      // Create tenant record in master database
      const tenant = await TenantMaster.create({
        company_name,
        subdomain: subdomain.toLowerCase(),
        email,
        gstin,
        pan,
        tan,
        subscription_plan,
        subscription_start: new Date(),
        phone,
        address,
        city,
        state,
        pincode,
        salesman_id,
        distributor_id,
        referred_by,
        referral_type,
        acquisition_category: acquisitionCategory,
        db_name: dbName,
        db_host: process.env.DB_HOST || 'localhost',
        db_port: parseInt(process.env.DB_PORT) || 3306,
        db_user: dbUser,
        db_password: this.encryptPassword(dbPassword),
        db_provisioned: false,
        is_trial: true,
        trial_ends_at: this.calculateTrialEnd(),
      });

      // Provision the database
      await this.provisionDatabase(tenant, dbPassword);

      logger.info(`Tenant created successfully: ${tenant.id} (${subdomain})`);

      return {
        tenant,
        credentials: {
          dbName,
          dbUser,
          dbPassword, // Return plain password only during creation
        },
      };
    } catch (error) {
      logger.error('Failed to create tenant:', error);
      throw new Error(`Tenant creation failed: ${error.message}`);
    }
  }

  /**
   * Provision database for a tenant
   * @param {Object} tenant - Tenant master record
   * @param {string} plainPassword - Plain text database password
   */
  async provisionDatabase(tenant, plainPassword) {
    const rootConnection = new Sequelize('', process.env.DB_USER, process.env.DB_PASSWORD, {
      host: tenant.db_host,
      port: tenant.db_port,
      dialect: 'mysql',
      logging: false,
    });

    try {
      // Create database
      await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${tenant.db_name}\``);
      logger.info(`Database created: ${tenant.db_name}`);

      // Create database user (if using separate credentials per tenant)
      if (process.env.USE_SEPARATE_DB_USERS === 'true') {
        await rootConnection.query(
          `CREATE USER IF NOT EXISTS '${tenant.db_user}'@'%' IDENTIFIED BY '${plainPassword}'`,
        );
        await rootConnection.query(
          `GRANT ALL PRIVILEGES ON \`${tenant.db_name}\`.* TO '${tenant.db_user}'@'%'`,
        );
        await rootConnection.query('FLUSH PRIVILEGES');
        logger.info(`Database user created: ${tenant.db_user}`);
      }

      await rootConnection.close();

      // Initialize database schema
      await this.initializeTenantSchema(tenant, plainPassword);

      // Mark as provisioned
      await tenant.update({
        db_provisioned: true,
        db_provisioned_at: new Date(),
      });

      logger.info(`Database provisioned successfully for tenant: ${tenant.id}`);
    } catch (error) {
      logger.error(`Failed to provision database for tenant ${tenant.id}:`, error);
      
      // Cleanup on failure
      try {
        await rootConnection.query(`DROP DATABASE IF EXISTS \`${tenant.db_name}\``);
        if (process.env.USE_SEPARATE_DB_USERS === 'true') {
          await rootConnection.query(`DROP USER IF EXISTS '${tenant.db_user}'@'%'`);
        }
      } catch (cleanupError) {
        logger.error('Cleanup failed:', cleanupError);
      }
      
      await rootConnection.close();
      throw error;
    }
  }

  /**
   * Initialize tenant database schema
   * @param {Object} tenant - Tenant master record
   * @param {string} plainPassword - Plain text database password
   */
  async initializeTenantSchema(tenant, plainPassword) {
    const tenantConnection = await tenantConnectionManager.getConnection({
      id: tenant.id,
      db_name: tenant.db_name,
      db_host: tenant.db_host,
      db_port: tenant.db_port,
      db_user: process.env.USE_SEPARATE_DB_USERS === 'true' ? tenant.db_user : process.env.DB_USER,
      db_password: process.env.USE_SEPARATE_DB_USERS === 'true' ? plainPassword : process.env.DB_PASSWORD,
    });

    try {
      // Run migrations for tenant database
      await this.runTenantMigrations(tenantConnection);
      
      // Seed default data
      await this.seedDefaultData(tenantConnection, tenant);

      logger.info(`Schema initialized for tenant: ${tenant.id}`);
    } catch (error) {
      logger.error(`Failed to initialize schema for tenant ${tenant.id}:`, error);
      throw error;
    }
  }

  /**
   * Run migrations on tenant database
   * @param {Sequelize} connection - Tenant database connection
   */
  async runTenantMigrations(connection) {
    // Import all tenant models
    const tenantModels = require('./tenantModels')(connection);
    
    // Sync all models (in production, use proper migrations)
    await connection.sync({ force: false });
    
    logger.info('Tenant migrations completed');
  }

  /**
   * Seed default data for new tenant
   * @param {Sequelize} connection - Tenant database connection
   * @param {Object} tenant - Tenant master record
   */
  async seedDefaultData(connection, tenant) {
    // Load tenant models
    const models = require('./tenantModels')(connection);

    // NOTE: Account groups and voucher types are in Master DB (shared)
    // No need to seed them per tenant

    // Create default admin user for the tenant
    await models.User.create({
      name: 'Admin',
      email: tenant.email,
      role: 'admin',
      is_active: true,
      password: require('bcrypt').hashSync('ChangeMe@123', 10),
    });

    // Create default GSTIN if provided
    if (tenant.gstin) {
      await models.GSTIN.create({
        gstin: tenant.gstin,
        legal_name: tenant.company_name,
        trade_name: tenant.company_name,
        state: tenant.state,
        address: tenant.address,
        gstin_status: 'active',
        is_primary: true,
      });
    }

    logger.info('Default data seeded for tenant (admin user created)');
  }

  /**
   * Delete a tenant and their database
   * @param {string} tenantId - Tenant ID
   */
  async deleteTenant(tenantId) {
    const tenant = await TenantMaster.findByPk(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const rootConnection = new Sequelize('', process.env.DB_USER, process.env.DB_PASSWORD, {
      host: tenant.db_host,
      port: tenant.db_port,
      dialect: 'mysql',
      logging: false,
    });

    try {
      // Close tenant connection if cached
      await tenantConnectionManager.closeConnection(tenantId);

      // Drop database
      await rootConnection.query(`DROP DATABASE IF EXISTS \`${tenant.db_name}\``);
      
      // Drop user if using separate credentials
      if (process.env.USE_SEPARATE_DB_USERS === 'true') {
        await rootConnection.query(`DROP USER IF EXISTS '${tenant.db_user}'@'%'`);
      }

      // Delete from master database
      await tenant.destroy();

      logger.info(`Tenant deleted successfully: ${tenantId}`);
    } catch (error) {
      logger.error(`Failed to delete tenant ${tenantId}:`, error);
      throw error;
    } finally {
      await rootConnection.close();
    }
  }

  /**
   * Suspend a tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} reason - Suspension reason
   */
  async suspendTenant(tenantId, reason) {
    const tenant = await TenantMaster.findByPk(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    await tenant.update({
      is_suspended: true,
      suspended_reason: reason,
    });

    // Close connection
    await tenantConnectionManager.closeConnection(tenantId);

    logger.info(`Tenant suspended: ${tenantId}`);
  }

  /**
   * Reactivate a suspended tenant
   * @param {string} tenantId - Tenant ID
   */
  async reactivateTenant(tenantId) {
    const tenant = await TenantMaster.findByPk(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    await tenant.update({
      is_suspended: false,
      suspended_reason: null,
    });

    logger.info(`Tenant reactivated: ${tenantId}`);
  }

  // Helper methods

  generateDatabaseName(subdomain) {
    const sanitized = subdomain.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `finvera_${sanitized}_${Date.now()}`;
  }

  generateDatabaseUser(subdomain) {
    const sanitized = subdomain.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `fv_${sanitized}`.substring(0, 32); // MySQL username limit
  }

  generateSecurePassword(length = 20) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  encryptPassword(password) {
    // In production, use proper encryption
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptPassword(encryptedPassword) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  calculateTrialEnd(days = 30) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  // Removed: getDefaultAccountGroups() - Now in Master DB
}

module.exports = new TenantProvisioningService();
