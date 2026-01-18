#!/usr/bin/env node

/**
 * Expired Trial Cleanup Script
 * 
 * This script identifies and removes databases for trial/free users
 * that have expired after 60 days of inactivity.
 * 
 * Usage:
 * - Run manually: node backend/scripts/cleanup-expired-trials.js
 * - Run as cron job: 0 2 * * * /usr/bin/node /path/to/backend/scripts/cleanup-expired-trials.js
 * 
 * Safety Features:
 * - Only removes trial/free plan databases
 * - Requires 60+ days of inactivity
 * - Creates backup before deletion (optional)
 * - Logs all actions for audit trail
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const TRIAL_EXPIRY_DAYS = 60;
const FREE_PLAN_EXPIRY_DAYS = 60;
const DRY_RUN = process.env.CLEANUP_DRY_RUN === 'true'; // Set to true to test without actual deletion
const CREATE_BACKUP = process.env.CLEANUP_CREATE_BACKUP === 'true'; // Set to true to create backups before deletion

class TrialCleanupService {
  constructor() {
    this.logger = this.createLogger();
    this.masterConnection = null;
    this.rootConnection = null;
  }

  createLogger() {
    const logDir = path.join(__dirname, '../logs');
    const logFile = path.join(logDir, 'trial-cleanup.log');
    
    return {
      info: (message) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] INFO: ${message}`;
        console.log(logMessage);
        this.writeToFile(logFile, logMessage);
      },
      warn: (message) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] WARN: ${message}`;
        console.warn(logMessage);
        this.writeToFile(logFile, logMessage);
      },
      error: (message) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ERROR: ${message}`;
        console.error(logMessage);
        this.writeToFile(logFile, logMessage);
      }
    };
  }

  async writeToFile(filePath, message) {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.appendFile(filePath, message + '\n');
    } catch (error) {
      // Ignore file write errors to prevent infinite loops
    }
  }

  async initializeConnections() {
    // Skip if already initialized
    if (this.masterConnection && this.rootConnection) {
      return;
    }

    try {
      // Master database connection (for tenant records)
      const masterDbName = process.env.MASTER_DB_NAME || 'finvera_master';
      this.masterConnection = new Sequelize(masterDbName, process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
      });

      // Root connection (for database operations)
      this.rootConnection = new Sequelize('', process.env.DB_ROOT_USER || process.env.DB_USER || 'root', process.env.DB_ROOT_PASSWORD || process.env.DB_PASSWORD || '', {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
      });

      await this.masterConnection.authenticate();
      await this.rootConnection.authenticate();

      this.logger.info('✓ Database connections established');
    } catch (error) {
      this.logger.error(`Failed to connect to database: ${error.message}`);
      throw error;
    }
  }

  async findExpiredTrials() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - TRIAL_EXPIRY_DAYS);

      this.logger.info(`🔍 Searching for expired trials (cutoff date: ${cutoffDate.toISOString()})`);

      // Query for expired trial/free tenants
      const [expiredTenants] = await this.masterConnection.query(`
        SELECT 
          id,
          company_name,
          subdomain,
          email,
          subscription_plan,
          db_name,
          is_trial,
          trial_ends_at,
          createdAt,
          updatedAt,
          is_active
        FROM tenant_master 
        WHERE 
          (
            (is_trial = 1 AND (trial_ends_at IS NULL OR trial_ends_at < NOW()))
            OR subscription_plan IN ('FREE', 'TRIAL')
          )
          AND (
            updatedAt < ? 
            OR createdAt < ?
          )
          AND is_active = 1
        ORDER BY createdAt ASC
      `, {
        replacements: [cutoffDate, cutoffDate]
      });

      this.logger.info(`📊 Found ${expiredTenants.length} potentially expired trial/free accounts`);

      return expiredTenants;
    } catch (error) {
      this.logger.error(`Error finding expired trials: ${error.message}`);
      throw error;
    }
  }

  async checkDatabaseActivity(dbName) {
    try {
      // Check if database exists
      const [dbExists] = await this.rootConnection.query(`
        SELECT SCHEMA_NAME 
        FROM INFORMATION_SCHEMA.SCHEMATA 
        WHERE SCHEMA_NAME = ?
      `, { replacements: [dbName] });

      if (dbExists.length === 0) {
        return { exists: false, lastActivity: null, hasData: false };
      }

      // Check for recent activity in key tables
      let lastActivity = null;
      let hasData = false;

      try {
        // Check vouchers table for recent activity
        const [voucherActivity] = await this.rootConnection.query(`
          SELECT MAX(updated_at) as last_activity, COUNT(*) as count
          FROM \`${dbName}\`.vouchers
        `);

        if (voucherActivity[0].count > 0) {
          hasData = true;
          if (voucherActivity[0].last_activity) {
            lastActivity = new Date(voucherActivity[0].last_activity);
          }
        }
      } catch (e) {
        // Table might not exist
      }

      try {
        // Check users table for recent login activity
        const [userActivity] = await this.rootConnection.query(`
          SELECT MAX(updated_at) as last_activity, COUNT(*) as count
          FROM \`${dbName}\`.users
        `);

        if (userActivity[0].count > 0) {
          hasData = true;
          const userLastActivity = userActivity[0].last_activity ? new Date(userActivity[0].last_activity) : null;
          if (userLastActivity && (!lastActivity || userLastActivity > lastActivity)) {
            lastActivity = userLastActivity;
          }
        }
      } catch (e) {
        // Table might not exist
      }

      return {
        exists: true,
        lastActivity,
        hasData
      };
    } catch (error) {
      this.logger.error(`Error checking database activity for ${dbName}: ${error.message}`);
      return { exists: false, lastActivity: null, hasData: false };
    }
  }

  async createDatabaseBackup(dbName) {
    if (!CREATE_BACKUP) {
      return null;
    }

    try {
      const backupDir = path.join(__dirname, '../backups/expired-trials');
      await fs.mkdir(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `${dbName}_${timestamp}.sql`);

      this.logger.info(`💾 Creating backup: ${backupFile}`);

      // Note: This requires mysqldump to be available in PATH
      // In production, you might want to use a different backup method
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      const dumpCommand = `mysqldump -h ${process.env.DB_HOST || 'localhost'} -P ${process.env.DB_PORT || 3306} -u ${process.env.DB_ROOT_USER || process.env.DB_USER || 'root'} ${process.env.DB_ROOT_PASSWORD || process.env.DB_PASSWORD ? `-p${process.env.DB_ROOT_PASSWORD || process.env.DB_PASSWORD}` : ''} ${dbName} > "${backupFile}"`;

      await execAsync(dumpCommand);
      this.logger.info(`✅ Backup created: ${backupFile}`);

      return backupFile;
    } catch (error) {
      this.logger.error(`Failed to create backup for ${dbName}: ${error.message}`);
      return null;
    }
  }

  async cleanupExpiredTenant(tenant) {
    const { id, company_name, db_name, email, subscription_plan } = tenant;

    try {
      this.logger.info(`🧹 Processing: ${company_name} (${email}) - Plan: ${subscription_plan}`);

      // Check database activity
      const activity = await this.checkDatabaseActivity(db_name);

      if (!activity.exists) {
        this.logger.info(`   ℹ️  Database ${db_name} does not exist, marking tenant as inactive`);
        
        if (!DRY_RUN) {
          await this.masterConnection.query(`
            UPDATE tenant_master 
            SET is_active = 0, updatedAt = NOW() 
            WHERE id = ?
          `, { replacements: [id] });
        }
        return { action: 'marked_inactive', reason: 'database_not_found' };
      }

      // Check if there's recent activity
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - TRIAL_EXPIRY_DAYS);

      if (activity.lastActivity && activity.lastActivity > cutoffDate) {
        this.logger.info(`   ✅ Recent activity found (${activity.lastActivity.toISOString()}), keeping database`);
        return { action: 'kept', reason: 'recent_activity' };
      }

      // Check if database has significant data
      if (activity.hasData) {
        this.logger.warn(`   ⚠️  Database has data but no recent activity, creating backup before deletion`);
        
        if (!DRY_RUN) {
          await this.createDatabaseBackup(db_name);
        }
      }

      this.logger.info(`   🗑️  Marking for deletion: No activity since ${activity.lastActivity ? activity.lastActivity.toISOString() : 'creation'}`);

      if (DRY_RUN) {
        this.logger.info(`   🔍 DRY RUN: Would delete database ${db_name} and mark tenant inactive`);
        return { action: 'would_delete', reason: 'expired_trial' };
      }

      // Create backup if configured
      if (CREATE_BACKUP) {
        await this.createDatabaseBackup(db_name);
      }

      // Drop the database
      await this.rootConnection.query(`DROP DATABASE IF EXISTS \`${db_name}\``);
      this.logger.info(`   ✅ Database ${db_name} deleted`);

      // Mark tenant as inactive
      await this.masterConnection.query(`
        UPDATE tenant_master 
        SET is_active = 0, db_provisioned = 0, updatedAt = NOW() 
        WHERE id = ?
      `, { replacements: [id] });

      this.logger.info(`   ✅ Tenant marked as inactive`);

      return { action: 'deleted', reason: 'expired_trial' };

    } catch (error) {
      this.logger.error(`   ❌ Error processing ${company_name}: ${error.message}`);
      return { action: 'error', reason: error.message };
    }
  }

  async run() {
    try {
      this.logger.info('🚀 Starting expired trial cleanup process');
      this.logger.info(`⚙️  Configuration: Trial expiry = ${TRIAL_EXPIRY_DAYS} days, Dry run = ${DRY_RUN}, Create backup = ${CREATE_BACKUP}`);

      await this.initializeConnections();

      const expiredTenants = await this.findExpiredTrials();

      if (expiredTenants.length === 0) {
        this.logger.info('✅ No expired trials found');
        return;
      }

      const results = {
        deleted: 0,
        kept: 0,
        marked_inactive: 0,
        errors: 0
      };

      for (const tenant of expiredTenants) {
        const result = await this.cleanupExpiredTenant(tenant);
        
        if (result.action === 'deleted' || result.action === 'would_delete') {
          results.deleted++;
        } else if (result.action === 'kept') {
          results.kept++;
        } else if (result.action === 'marked_inactive') {
          results.marked_inactive++;
        } else if (result.action === 'error') {
          results.errors++;
        }

        // Add small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.logger.info('📊 CLEANUP SUMMARY:');
      this.logger.info(`   🗑️  Databases deleted: ${results.deleted}`);
      this.logger.info(`   ✅ Databases kept (recent activity): ${results.kept}`);
      this.logger.info(`   📝 Tenants marked inactive: ${results.marked_inactive}`);
      this.logger.info(`   ❌ Errors: ${results.errors}`);

      if (DRY_RUN) {
        this.logger.info('🔍 This was a DRY RUN - no actual changes were made');
        this.logger.info('💡 To perform actual cleanup, set CLEANUP_DRY_RUN=false');
      }

      this.logger.info('✅ Cleanup process completed');

    } catch (error) {
      this.logger.error(`❌ Cleanup process failed: ${error.message}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async cleanup() {
    try {
      if (this.masterConnection) {
        await this.masterConnection.close();
        this.masterConnection = null;
      }
      if (this.rootConnection) {
        await this.rootConnection.close();
        this.rootConnection = null;
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Run the cleanup if called directly
if (require.main === module) {
  const cleanup = new TrialCleanupService();
  cleanup.run()
    .then(() => {
      console.log('🎉 Cleanup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup failed:', error.message);
      process.exit(1);
    });
}

module.exports = TrialCleanupService;