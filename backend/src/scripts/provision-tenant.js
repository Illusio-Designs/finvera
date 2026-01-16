/**
 * Script to provision a new tenant
 * Usage: node provision-tenant.js
 */
require('dotenv').config();
const tenantProvisioningService = require('../services/tenantProvisioningService');
const logger = require('../utils/logger');

async function provisionTenant() {
  try {
    logger.info('========================================');
    logger.info('Tenant Provisioning Script');
    logger.info('========================================\n');

    // Tenant data - you can modify this
    const tenantData = {
      company_name: 'Ajay Sales and Services',
      subdomain: 'ajay_sales_and_services',
      email: 'admin@ajaysales.com',
      gstin: '27AABCU9603R1ZM', // Example GSTIN for Maharashtra
      pan: 'AABCU9603R',
      tan: null,
      subscription_plan: 'basic',
      phone: '9876543210',
      address: '123 Business Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      salesman_id: null,
      distributor_id: null,
      referred_by: null,
      referral_type: null,
    };

    logger.info('Creating tenant with the following details:');
    logger.info(`Company Name: ${tenantData.company_name}`);
    logger.info(`Subdomain: ${tenantData.subdomain}`);
    logger.info(`Email: ${tenantData.email}`);
    logger.info(`GSTIN: ${tenantData.gstin}`);
    logger.info(`State: ${tenantData.state}\n`);

    logger.info('Starting tenant provisioning...\n');

    const result = await tenantProvisioningService.createTenant(tenantData);

    logger.info('\n========================================');
    logger.info('✅ Tenant Provisioned Successfully!');
    logger.info('========================================');
    logger.info(`Tenant ID: ${result.tenant.id}`);
    logger.info(`Company: ${result.tenant.company_name}`);
    logger.info(`Database: ${result.tenant.db_name}`);
    logger.info(`Subdomain: ${result.tenant.subdomain}`);
    logger.info(`Email: ${result.tenant.email}`);
    logger.info('\nDefault Admin Credentials:');
    logger.info(`Email: ${result.tenant.email}`);
    logger.info(`Password: ChangeMe@123`);
    logger.info('========================================\n');

    process.exit(0);

  } catch (error) {
    logger.error('\n========================================');
    logger.error('❌ Tenant Provisioning Failed');
    logger.error('========================================');
    logger.error(`Error: ${error.message}`);
    if (error.stack) {
      logger.error(`Stack: ${error.stack}`);
    }
    logger.error('========================================\n');
    process.exit(1);
  }
}

// Run the provisioning
provisionTenant();
