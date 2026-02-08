#!/usr/bin/env node
/**
 * Script to reprovision an existing company database
 * This will drop and recreate the database with all correct columns
 * 
 * Usage: node scripts/reprovision-company.js <company_email>
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const { Company } = require('../src/models/masterModels');
const tenantProvisioningService = require('../src/services/tenantProvisioningService');
const logger = require('../src/utils/logger');

async function reprovisionCompany(companyEmail) {
  try {
    logger.info('========================================');
    logger.info('COMPANY DATABASE REPROVISIONING');
    logger.info('========================================');
    
    // Find company by email
    const company = await Company.findOne({ where: { email: companyEmail } });
    
    if (!company) {
      throw new Error(`Company not found with email: ${companyEmail}`);
    }
    
    logger.info(`Found company: ${company.company_name} (${company.email})`);
    logger.info(`Database: ${company.db_name}`);
    logger.info(`Current provisioning status: ${company.db_provisioned ? 'Provisioned' : 'Not provisioned'}`);
    
    // Confirm action
    logger.warn('⚠️  WARNING: This will DROP and RECREATE the company database!');
    logger.warn('⚠️  ALL DATA WILL BE LOST!');
    logger.warn('⚠️  Press Ctrl+C within 5 seconds to cancel...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    logger.info('Starting reprovisioning...');
    
    // Get database credentials
    const dbPassword = tenantProvisioningService.decryptPassword(company.db_password);
    const rootUser = process.env.DB_ROOT_USER || process.env.DB_USER || 'root';
    const rootPassword = process.env.DB_ROOT_PASSWORD !== undefined 
      ? process.env.DB_ROOT_PASSWORD 
      : (process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : null);
    
    if (rootPassword === null) {
      throw new Error('DB_ROOT_PASSWORD or DB_PASSWORD must be set');
    }
    
    const dbHost = company.db_host || process.env.DB_HOST || 'localhost';
    const dbPort = company.db_port || parseInt(process.env.DB_PORT) || 3306;
    
    // Connect as root
    logger.info(`Connecting as ${rootUser}@${dbHost}:${dbPort}...`);
    const rootConnection = new Sequelize('mysql', rootUser, rootPassword, {
      host: dbHost,
      port: dbPort,
      dialect: 'mysql',
      logging: false,
    });
    
    await rootConnection.authenticate();
    logger.info('✓ Connected as root user');
    
    // Drop existing database
    logger.info(`Dropping database: ${company.db_name}...`);
    await rootConnection.query(`DROP DATABASE IF EXISTS \`${company.db_name}\``);
    logger.info('✓ Database dropped');
    
    // Close root connection
    await rootConnection.close();
    
    // Mark as not provisioned
    await company.update({
      db_provisioned: false,
      db_provisioned_at: null,
    });
    
    logger.info('Starting fresh provisioning...');
    
    // Provision fresh database (using the same method as tenant)
    await tenantProvisioningService.provisionDatabase(company, dbPassword);
    
    // Reload company
    await company.reload();
    
    logger.info('========================================');
    logger.info('✅ REPROVISIONING COMPLETED SUCCESSFULLY');
    logger.info('========================================');
    logger.info(`Company: ${company.company_name}`);
    logger.info(`Database: ${company.db_name}`);
    logger.info(`Status: ${company.db_provisioned ? 'Provisioned' : 'Not provisioned'}`);
    logger.info(`Provisioned at: ${company.db_provisioned_at}`);
    logger.info('========================================');
    
    process.exit(0);
  } catch (error) {
    logger.error('========================================');
    logger.error('❌ REPROVISIONING FAILED');
    logger.error('========================================');
    logger.error('Error:', error.message);
    logger.error('Stack:', error.stack);
    logger.error('========================================');
    process.exit(1);
  }
}

// Get company email from command line
const companyEmail = process.argv[2];

if (!companyEmail) {
  console.error('Usage: node scripts/reprovision-company.js <company_email>');
  console.error('Example: node scripts/reprovision-company.js illusiodesigns@gmail.com');
  process.exit(1);
}

// Run the reprovisioning
reprovisionCompany(companyEmail);
