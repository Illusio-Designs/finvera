'use strict';

/**
 * This seeder provisions the System tenant database
 * It creates the actual tenant database and all its tables
 */

const tenantProvisioningService = require('../services/tenantProvisioningService');

module.exports = {
  async up(queryInterface, Sequelize) {
    const masterDbName = process.env.MASTER_DB_NAME || 'finvera_master';

    try {
      // Get the System tenant from master database
      const systemTenant = await queryInterface.sequelize.query(
        `SELECT * FROM ${masterDbName}.tenant_master WHERE subdomain = 'system' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (systemTenant.length === 0) {
        console.log('⚠️  System tenant not found in master database');
        console.log('   Run 20251209-default-tenant seeder first');
        return;
      }

      const tenant = systemTenant[0];
      const tenantDbName = tenant.db_name;

      // Check if tenant database already exists
      const [databases] = await queryInterface.sequelize.query(
        `SHOW DATABASES LIKE '${tenantDbName}'`
      );

      if (databases.length > 0) {
        console.log('ℹ️  System tenant database already exists');
        return;
      }

      console.log('🔨 Provisioning System tenant database...');

      // Create the tenant database
      await queryInterface.sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${tenantDbName}\``);
      console.log(`✓ Created database: ${tenantDbName}`);

      // Import tenant models dynamically
      const Sequelize = require('sequelize');
      const tenantSequelize = new Sequelize(tenantDbName, process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
      });

      // Load tenant models
      const tenantModels = require('../services/tenantModels')(tenantSequelize);

      // Sync all tenant tables
      await tenantSequelize.sync({ force: false });
      console.log('✓ Created all tenant tables');

      // Create default GSTIN
      const now = new Date();
      const uuid = require('uuid');
      
      await tenantModels.GSTIN.create({
        id: uuid.v4(),
        gstin: '29AABCT1332L1ZJ', // Example GSTIN
        legal_name: 'System Private Limited',
        trade_name: 'System',
        state_code: '29',
        address: 'Bangalore, Karnataka',
        is_primary: true,
        is_active: true,
        registration_date: now,
      });
      console.log('✓ Created default GSTIN');

      await tenantSequelize.close();

      console.log('');
      console.log('✅ System tenant fully provisioned!');
      console.log('');
      console.log('📝 Tenant Details:');
      console.log(`   - Company: System`);
      console.log(`   - Subdomain: system.finvera.com`);
      console.log(`   - Database: ${tenantDbName}`);
      console.log('');
      console.log('👤 Admin User:');
      console.log('   - Email: Rishi@finvera.com');
      console.log('   - Password: Rishi@1995');
      console.log('');

    } catch (error) {
      console.error('❌ Error provisioning System tenant:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const masterDbName = process.env.MASTER_DB_NAME || 'finvera_master';

    try {
      const systemTenant = await queryInterface.sequelize.query(
        `SELECT db_name FROM ${masterDbName}.tenant_master WHERE subdomain = 'system' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (systemTenant.length > 0) {
        const tenantDbName = systemTenant[0].db_name;
        await queryInterface.sequelize.query(`DROP DATABASE IF EXISTS \`${tenantDbName}\``);
        console.log(`✓ Dropped database: ${tenantDbName}`);
      }
    } catch (error) {
      console.error('Error dropping tenant database:', error.message);
    }
  },
};
