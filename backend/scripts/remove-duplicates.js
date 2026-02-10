#!/usr/bin/env node
/**
 * Script to remove duplicate entries from company databases
 * 
 * This script will:
 * 1. Find all company databases
 * 2. Remove duplicate ledgers (keeping the oldest one)
 * 3. Remove duplicate numbering series (keeping the oldest one)
 * 4. Remove duplicate users (keeping the oldest one)
 * 5. Remove duplicate GSTINs (keeping the oldest one)
 * 
 * Usage: node scripts/remove-duplicates.js [--dry-run] [--company-id=<id>]
 * 
 * Options:
 *   --dry-run: Show what would be deleted without actually deleting
 *   --company-id=<id>: Only process specific company (optional)
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const { Company } = require('../src/models/masterModels');
const tenantConnectionManager = require('../src/config/tenantConnectionManager');
const logger = require('../src/utils/logger');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const companyIdArg = args.find(arg => arg.startsWith('--company-id='));
const specificCompanyId = companyIdArg ? companyIdArg.split('=')[1] : null;

/**
 * Remove duplicate ledgers from a company database
 */
async function removeDuplicateLedgers(connection, companyId, isDryRun) {
  try {
    logger.info(`[LEDGERS] Checking for duplicate ledgers in company ${companyId}...`);
    
    // Find duplicates by ledger_code
    const [duplicatesByCode] = await connection.query(`
      SELECT ledger_code, COUNT(*) as count, GROUP_CONCAT(id ORDER BY createdAt) as ids
      FROM ledgers
      GROUP BY ledger_code
      HAVING count > 1
    `);
    
    // Find duplicates by ledger_name
    const [duplicatesByName] = await connection.query(`
      SELECT ledger_name, COUNT(*) as count, GROUP_CONCAT(id ORDER BY createdAt) as ids
      FROM ledgers
      GROUP BY ledger_name
      HAVING count > 1
    `);
    
    let totalDeleted = 0;
    
    // Process duplicates by code
    for (const dup of duplicatesByCode) {
      const ids = dup.ids.split(',');
      const keepId = ids[0]; // Keep the oldest
      const deleteIds = ids.slice(1); // Delete the rest
      
      logger.info(`[LEDGERS] Found ${dup.count} duplicates for code '${dup.ledger_code}'`);
      logger.info(`[LEDGERS] Keeping: ${keepId}, Deleting: ${deleteIds.join(', ')}`);
      
      if (!isDryRun) {
        await connection.query(`DELETE FROM ledgers WHERE id IN (?)`, {
          replacements: [deleteIds]
        });
        totalDeleted += deleteIds.length;
      }
    }
    
    // Process duplicates by name (only if not already processed by code)
    for (const dup of duplicatesByName) {
      const ids = dup.ids.split(',');
      const keepId = ids[0];
      const deleteIds = ids.slice(1);
      
      // Check if these weren't already processed
      const alreadyProcessed = duplicatesByCode.some(d => 
        d.ids.split(',').some(id => deleteIds.includes(id))
      );
      
      if (!alreadyProcessed) {
        logger.info(`[LEDGERS] Found ${dup.count} duplicates for name '${dup.ledger_name}'`);
        logger.info(`[LEDGERS] Keeping: ${keepId}, Deleting: ${deleteIds.join(', ')}`);
        
        if (!isDryRun) {
          await connection.query(`DELETE FROM ledgers WHERE id IN (?)`, {
            replacements: [deleteIds]
          });
          totalDeleted += deleteIds.length;
        }
      }
    }
    
    logger.info(`[LEDGERS] ${isDryRun ? 'Would delete' : 'Deleted'} ${totalDeleted} duplicate ledgers`);
    return totalDeleted;
  } catch (error) {
    logger.error(`[LEDGERS] Error removing duplicates:`, error.message);
    return 0;
  }
}

/**
 * Remove duplicate numbering series from a company database
 */
async function removeDuplicateNumberingSeries(connection, companyId, isDryRun) {
  try {
    logger.info(`[NUMBERING] Checking for duplicate numbering series in company ${companyId}...`);
    
    // Find duplicates by voucher_type and prefix
    const [duplicates] = await connection.query(`
      SELECT voucher_type, prefix, COUNT(*) as count, GROUP_CONCAT(id ORDER BY createdAt) as ids
      FROM numbering_series
      GROUP BY voucher_type, prefix
      HAVING count > 1
    `);
    
    let totalDeleted = 0;
    
    for (const dup of duplicates) {
      const ids = dup.ids.split(',');
      const keepId = ids[0]; // Keep the oldest
      const deleteIds = ids.slice(1); // Delete the rest
      
      logger.info(`[NUMBERING] Found ${dup.count} duplicates for '${dup.voucher_type}' with prefix '${dup.prefix}'`);
      logger.info(`[NUMBERING] Keeping: ${keepId}, Deleting: ${deleteIds.join(', ')}`);
      
      if (!isDryRun) {
        await connection.query(`DELETE FROM numbering_series WHERE id IN (?)`, {
          replacements: [deleteIds]
        });
        totalDeleted += deleteIds.length;
      }
    }
    
    logger.info(`[NUMBERING] ${isDryRun ? 'Would delete' : 'Deleted'} ${totalDeleted} duplicate numbering series`);
    return totalDeleted;
  } catch (error) {
    logger.error(`[NUMBERING] Error removing duplicates:`, error.message);
    return 0;
  }
}

/**
 * Remove duplicate users from a company database
 */
async function removeDuplicateUsers(connection, companyId, isDryRun) {
  try {
    logger.info(`[USERS] Checking for duplicate users in company ${companyId}...`);
    
    // Find duplicates by email
    const [duplicates] = await connection.query(`
      SELECT email, COUNT(*) as count, GROUP_CONCAT(id ORDER BY createdAt) as ids
      FROM users
      GROUP BY email
      HAVING count > 1
    `);
    
    let totalDeleted = 0;
    
    for (const dup of duplicates) {
      const ids = dup.ids.split(',');
      const keepId = ids[0]; // Keep the oldest
      const deleteIds = ids.slice(1); // Delete the rest
      
      logger.info(`[USERS] Found ${dup.count} duplicates for email '${dup.email}'`);
      logger.info(`[USERS] Keeping: ${keepId}, Deleting: ${deleteIds.join(', ')}`);
      
      if (!isDryRun) {
        await connection.query(`DELETE FROM users WHERE id IN (?)`, {
          replacements: [deleteIds]
        });
        totalDeleted += deleteIds.length;
      }
    }
    
    logger.info(`[USERS] ${isDryRun ? 'Would delete' : 'Deleted'} ${totalDeleted} duplicate users`);
    return totalDeleted;
  } catch (error) {
    logger.error(`[USERS] Error removing duplicates:`, error.message);
    return 0;
  }
}

/**
 * Remove duplicate GSTINs from a company database
 */
async function removeDuplicateGSTINs(connection, companyId, isDryRun) {
  try {
    logger.info(`[GSTINS] Checking for duplicate GSTINs in company ${companyId}...`);
    
    // Check if gstins table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'gstins'");
    if (tables.length === 0) {
      logger.info(`[GSTINS] Table does not exist, skipping`);
      return 0;
    }
    
    // Find duplicates by gstin
    const [duplicates] = await connection.query(`
      SELECT gstin, COUNT(*) as count, GROUP_CONCAT(id ORDER BY createdAt) as ids
      FROM gstins
      GROUP BY gstin
      HAVING count > 1
    `);
    
    let totalDeleted = 0;
    
    for (const dup of duplicates) {
      const ids = dup.ids.split(',');
      const keepId = ids[0]; // Keep the oldest
      const deleteIds = ids.slice(1); // Delete the rest
      
      logger.info(`[GSTINS] Found ${dup.count} duplicates for GSTIN '${dup.gstin}'`);
      logger.info(`[GSTINS] Keeping: ${keepId}, Deleting: ${deleteIds.join(', ')}`);
      
      if (!isDryRun) {
        await connection.query(`DELETE FROM gstins WHERE id IN (?)`, {
          replacements: [deleteIds]
        });
        totalDeleted += deleteIds.length;
      }
    }
    
    logger.info(`[GSTINS] ${isDryRun ? 'Would delete' : 'Deleted'} ${totalDeleted} duplicate GSTINs`);
    return totalDeleted;
  } catch (error) {
    logger.error(`[GSTINS] Error removing duplicates:`, error.message);
    return 0;
  }
}

/**
 * Process a single company database
 */
async function processCompany(company, isDryRun) {
  logger.info(`\n========================================`);
  logger.info(`Processing Company: ${company.company_name} (${company.id})`);
  logger.info(`Database: ${company.db_name}`);
  logger.info(`========================================`);
  
  try {
    // Get connection to company database
    const dbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : null;
    const dbUser = process.env.DB_USER || 'informative_finvera';
    
    if (dbPassword === null) {
      throw new Error('DB_PASSWORD environment variable must be set');
    }
    
    const connection = await tenantConnectionManager.getConnection({
      id: company.id,
      db_name: company.db_name,
      db_host: company.db_host,
      db_port: company.db_port,
      db_user: dbUser,
      db_password: dbPassword,
    });
    
    // Remove duplicates
    const ledgersDeleted = await removeDuplicateLedgers(connection, company.id, isDryRun);
    const seriesDeleted = await removeDuplicateNumberingSeries(connection, company.id, isDryRun);
    const usersDeleted = await removeDuplicateUsers(connection, company.id, isDryRun);
    const gstinsDeleted = await removeDuplicateGSTINs(connection, company.id, isDryRun);
    
    const totalDeleted = ledgersDeleted + seriesDeleted + usersDeleted + gstinsDeleted;
    
    logger.info(`\n✅ Company ${company.company_name} processed successfully`);
    logger.info(`Total duplicates ${isDryRun ? 'found' : 'removed'}: ${totalDeleted}`);
    
    return {
      companyId: company.id,
      companyName: company.company_name,
      ledgersDeleted,
      seriesDeleted,
      usersDeleted,
      gstinsDeleted,
      totalDeleted,
    };
  } catch (error) {
    logger.error(`❌ Error processing company ${company.company_name}:`, error.message);
    return {
      companyId: company.id,
      companyName: company.company_name,
      error: error.message,
    };
  }
}

/**
 * Main function
 */
async function removeDuplicates() {
  try {
    logger.info('========================================');
    logger.info('DUPLICATE REMOVAL SCRIPT');
    logger.info('========================================');
    logger.info(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (duplicates will be deleted)'}`);
    if (specificCompanyId) {
      logger.info(`Target: Specific company ${specificCompanyId}`);
    } else {
      logger.info(`Target: All companies`);
    }
    logger.info('========================================\n');
    
    // Get companies to process
    let companies;
    if (specificCompanyId) {
      const company = await Company.findByPk(specificCompanyId);
      if (!company) {
        throw new Error(`Company ${specificCompanyId} not found`);
      }
      companies = [company];
    } else {
      companies = await Company.findAll({
        where: {
          db_provisioned: true,
          is_active: true,
        },
      });
    }
    
    logger.info(`Found ${companies.length} company(ies) to process\n`);
    
    // Process each company
    const results = [];
    for (const company of companies) {
      const result = await processCompany(company, isDryRun);
      results.push(result);
    }
    
    // Summary
    logger.info('\n========================================');
    logger.info('SUMMARY');
    logger.info('========================================');
    
    const totalLedgers = results.reduce((sum, r) => sum + (r.ledgersDeleted || 0), 0);
    const totalSeries = results.reduce((sum, r) => sum + (r.seriesDeleted || 0), 0);
    const totalUsers = results.reduce((sum, r) => sum + (r.usersDeleted || 0), 0);
    const totalGstins = results.reduce((sum, r) => sum + (r.gstinsDeleted || 0), 0);
    const totalAll = results.reduce((sum, r) => sum + (r.totalDeleted || 0), 0);
    const errors = results.filter(r => r.error).length;
    
    logger.info(`Companies processed: ${results.length}`);
    logger.info(`Duplicate ledgers ${isDryRun ? 'found' : 'removed'}: ${totalLedgers}`);
    logger.info(`Duplicate numbering series ${isDryRun ? 'found' : 'removed'}: ${totalSeries}`);
    logger.info(`Duplicate users ${isDryRun ? 'found' : 'removed'}: ${totalUsers}`);
    logger.info(`Duplicate GSTINs ${isDryRun ? 'found' : 'removed'}: ${totalGstins}`);
    logger.info(`Total duplicates ${isDryRun ? 'found' : 'removed'}: ${totalAll}`);
    logger.info(`Errors: ${errors}`);
    
    if (isDryRun) {
      logger.info('\n⚠️  This was a DRY RUN. No changes were made.');
      logger.info('Run without --dry-run to actually remove duplicates.');
    } else {
      logger.info('\n✅ Duplicate removal completed successfully!');
    }
    
    logger.info('========================================');
    
    process.exit(0);
  } catch (error) {
    logger.error('\n========================================');
    logger.error('❌ DUPLICATE REMOVAL FAILED');
    logger.error('========================================');
    logger.error('Error:', error.message);
    logger.error('Stack:', error.stack);
    logger.error('========================================');
    process.exit(1);
  }
}

// Run the script
removeDuplicates();
