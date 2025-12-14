/**
 * Consolidated Seeder for Main Database
 * This single file contains all seeders for the main platform database
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const uuid = require('uuid');

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
    const masterDbName = process.env.MASTER_DB_NAME || 'finvera_master';

    // ============================================
    // 1. CREATE SYSTEM TENANT (from 20251209-default-tenant.js)
    // ============================================
    try {
      const existingTenants = await queryInterface.sequelize.query(
        `SELECT id FROM ${masterDbName}.tenant_master WHERE subdomain = 'system' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingTenants.length === 0) {
        const tenantId = uuid.v4();
        const dbPassword = encrypt(process.env.DB_PASSWORD || '');

        await queryInterface.sequelize.query(
          `INSERT INTO ${masterDbName}.tenant_master 
           (id, company_name, subdomain, subscription_plan, email, db_name, db_host, db_user, db_password, is_active, acquisition_category, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
              'organic',
              now,
              now,
            ],
            type: Sequelize.QueryTypes.INSERT,
          }
        );

        console.log('✓ System tenant created in master database');
      } else {
        console.log('ℹ️  System tenant already exists');
      }
    } catch (error) {
      console.log('⚠️  Could not create system tenant:', error.message);
    }

    // ============================================
    // 2. CREATE ADMIN USER (from 20251210-admin-user.js)
    // ============================================
    try {
      const existingAdmin = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = 'Rishi@finvera.com'`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingAdmin.length === 0) {
        const hashedPassword = await bcrypt.hash('Rishi@1995', 10);

        await queryInterface.bulkInsert('users', [
          {
            id: uuid.v4(),
            email: 'Rishi@finvera.com',
            password: hashedPassword,
            name: 'Rishi Kumar',
            role: 'super_admin',
            phone: null,
            is_active: true,
            last_login: null,
            createdAt: now,
            updatedAt: now,
          },
        ]);

        console.log('✓ Platform Admin User Created:');
        console.log('  - Email: Rishi@finvera.com');
        console.log('  - Password: Rishi@1995');
        console.log('  - Role: super_admin (platform-wide)');
      } else {
        console.log('ℹ️  Admin user already exists');
      }
    } catch (error) {
      console.log('⚠️  Could not create admin user:', error.message);
    }

    // ============================================
    // 3. CREATE SUBSCRIPTION PLANS (from 20251211-subscription-plans.js)
    // ============================================
    try {
      const existingPlans = await queryInterface.sequelize.query(
        "SELECT id FROM subscription_plans WHERE plan_code IN ('FREE', 'STARTER')",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingPlans.length === 0) {
        await queryInterface.bulkInsert('subscription_plans', [
          {
            id: uuid.v4(),
            plan_code: 'FREE',
            plan_name: 'Free',
            description: 'Free tier',
            billing_cycle: 'monthly',
            base_price: 0,
            currency: 'INR',
            trial_days: 0,
            max_users: 1,
            max_invoices_per_month: 50,
            features: JSON.stringify({ gst_filing: false, e_invoicing: false }),
            is_active: true,
            is_visible: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: uuid.v4(),
            plan_code: 'STARTER',
            plan_name: 'Starter',
            description: 'Starter plan',
            billing_cycle: 'monthly',
            base_price: 999,
            currency: 'INR',
            trial_days: 30,
            max_users: 3,
            max_invoices_per_month: 200,
            features: JSON.stringify({ gst_filing: true, e_invoicing: false }),
            salesman_commission_rate: 15,
            distributor_commission_rate: 5,
            is_active: true,
            is_visible: true,
            createdAt: now,
            updatedAt: now,
          },
        ]);

        console.log('✓ Subscription plans: FREE, STARTER');
      } else {
        console.log('ℹ️  Subscription plans already exist');
      }
    } catch (error) {
      console.log('⚠️  Could not create subscription plans:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    const masterDbName = process.env.MASTER_DB_NAME || 'finvera_master';
    
    // Remove subscription plans
    await queryInterface.bulkDelete('subscription_plans', null, {});
    
    // Remove admin user
    await queryInterface.bulkDelete('users', { email: 'Rishi@finvera.com' }, {});
    
    // Remove system tenant
    try {
      await queryInterface.sequelize.query(
        `DELETE FROM ${masterDbName}.tenant_master WHERE subdomain = 'system'`
      );
    } catch (error) {
      // Ignore if table doesn't exist
    }
  },
};
