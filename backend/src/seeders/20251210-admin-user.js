'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const uuid = require('uuid');
    const masterDbName = process.env.MASTER_DB_NAME || 'finvera_master';

    // Check if admin user already exists in main database (platform admin)
    const existingAdmin = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'Rishi@finvera.com'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingAdmin.length > 0) {
      console.log('ℹ️  Admin user already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('Rishi@1995', 10);

    // Create platform admin user in main database (finvera_db)
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

    // Also create tenant admin if System tenant exists
    try {
      const systemTenant = await queryInterface.sequelize.query(
        `SELECT id, db_name FROM ${masterDbName}.tenant_master WHERE subdomain = 'system' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (systemTenant.length > 0) {
        const tenantDbName = systemTenant[0].db_name;
        
        // Check if tenant database exists
        const [databases] = await queryInterface.sequelize.query(
          `SHOW DATABASES LIKE '${tenantDbName}'`
        );

        if (databases.length > 0) {
          // Check if users table exists in tenant database
          const [tables] = await queryInterface.sequelize.query(
            `SHOW TABLES IN ${tenantDbName} LIKE 'users'`
          );

          if (tables.length > 0) {
            // Check if user already exists in tenant database
            const existingTenantUser = await queryInterface.sequelize.query(
              `SELECT id FROM ${tenantDbName}.users WHERE email = 'Rishi@finvera.com'`,
              { type: Sequelize.QueryTypes.SELECT }
            );

            if (existingTenantUser.length === 0) {
              // Create tenant admin user in tenant database
              await queryInterface.sequelize.query(
                `INSERT INTO ${tenantDbName}.users 
                 (id, email, password, name, role, is_active, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                {
                  replacements: [
                    uuid.v4(),
                    'Rishi@finvera.com',
                    hashedPassword,
                    'Rishi Kumar',
                    'admin',
                    true,
                    now,
                    now,
                  ],
                  type: Sequelize.QueryTypes.INSERT,
                }
              );

              console.log('✓ Tenant Admin User Created:');
              console.log('  - Tenant: System');
              console.log('  - Email: Rishi@finvera.com');
              console.log('  - Role: admin (tenant-level)');
            }
          } else {
            console.log('ℹ️  Tenant database exists but users table not created yet');
            console.log('   Run tenant provisioning to complete setup');
          }
        } else {
          console.log('ℹ️  Tenant database not created yet');
          console.log('   Use: POST /api/tenants/management/provision');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not create tenant admin:', error.message);
      console.log('   Platform admin created successfully, tenant admin can be created later');
    }
  },

  async down(queryInterface, Sequelize) {
    const masterDbName = process.env.MASTER_DB_NAME || 'finvera_master';
    
    // Remove from main database
    await queryInterface.bulkDelete('users', { email: 'Rishi@finvera.com' }, {});

    // Try to remove from tenant database if exists
    try {
      const systemTenant = await queryInterface.sequelize.query(
        `SELECT db_name FROM ${masterDbName}.tenant_master WHERE subdomain = 'system' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (systemTenant.length > 0) {
        const tenantDbName = systemTenant[0].db_name;
        await queryInterface.sequelize.query(
          `DELETE FROM ${tenantDbName}.users WHERE email = 'Rishi@finvera.com'`
        );
      }
    } catch (error) {
      // Ignore errors if tenant database doesn't exist
    }
  },
};
