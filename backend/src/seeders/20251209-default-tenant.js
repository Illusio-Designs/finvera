'use strict';

const crypto = require('crypto');

// Encryption helper (must match the one in tenant middleware)
function encrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!', 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const uuid = require('uuid');

    // Connect to master database
    const masterDbName = process.env.MASTER_DB_NAME || 'finvera_master';
    
    // Check if tenant already exists in master database
    const existingTenants = await queryInterface.sequelize.query(
      `SELECT id FROM ${masterDbName}.tenant_master WHERE subdomain = 'system' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingTenants.length > 0) {
      console.log('ℹ️  System tenant already exists');
      return;
    }

    const tenantId = uuid.v4();
    const dbPassword = encrypt(process.env.DB_PASSWORD || '');

    // Create tenant in master database
    await queryInterface.sequelize.query(
      `INSERT INTO ${masterDbName}.tenant_master 
       (id, company_name, subdomain, subscription_plan, email, db_name, db_host, db_user, db_password, is_active, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          tenantId,
          'System',
          'system',
          'STARTER',
          'system@finvera.com',
          `finvera_tenant_${tenantId.replace(/-/g, '_')}`,
          process.env.DB_HOST || 'localhost',
          process.env.DB_USER || 'root',
          dbPassword,
          true,
          now,
          now,
        ],
        type: Sequelize.QueryTypes.INSERT,
      }
    );

    console.log('✓ System tenant created in master database');
    console.log(`  - Tenant ID: ${tenantId}`);
    console.log(`  - Subdomain: system.finvera.com`);
    console.log('  - Note: Use tenant provisioning API to create the actual database');

    return tenantId;
  },

  async down(queryInterface, Sequelize) {
    const masterDbName = process.env.MASTER_DB_NAME || 'finvera_master';
    await queryInterface.sequelize.query(
      `DELETE FROM ${masterDbName}.tenant_master WHERE subdomain = 'system'`
    );
  },
};
