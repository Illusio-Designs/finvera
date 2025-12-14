#!/usr/bin/env node

/**
 * Database Reset Script
 * 
 * This script will drop and recreate the databases to fix schema issues.
 * USE WITH CAUTION - This will delete all data!
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

async function resetDatabase() {
  const rootConnection = new Sequelize({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: 'mysql',
    logging: console.log,
  });

  try {
    console.log('🔄 Connecting to MySQL...');
    await rootConnection.authenticate();
    console.log('✅ Connected to MySQL');

    const dbName = process.env.DB_NAME || 'finvera_db';
    const masterDbName = process.env.MASTER_DB_NAME || 'finvera_master';

    console.log(`\n⚠️  WARNING: This will delete the following databases:`);
    console.log(`   - ${dbName}`);
    console.log(`   - ${masterDbName}`);
    console.log(`   - All tenant databases (finvera_tenant_*)`);
    
    // Get all tenant databases
    const [tenantDbs] = await rootConnection.query(
      `SHOW DATABASES LIKE 'finvera_tenant_%'`
    );
    
    if (tenantDbs.length > 0) {
      console.log(`\n   Found ${tenantDbs.length} tenant database(s):`);
      tenantDbs.forEach(db => console.log(`   - ${Object.values(db)[0]}`));
    }

    console.log(`\n⏳ Dropping databases in 3 seconds... Press Ctrl+C to cancel`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Drop tenant databases
    for (const db of tenantDbs) {
      const dbName = Object.values(db)[0];
      console.log(`\n🗑️  Dropping ${dbName}...`);
      await rootConnection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
      console.log(`✅ Dropped ${dbName}`);
    }

    // Drop main databases
    console.log(`\n🗑️  Dropping ${dbName}...`);
    await rootConnection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`✅ Dropped ${dbName}`);

    console.log(`\n🗑️  Dropping ${masterDbName}...`);
    await rootConnection.query(`DROP DATABASE IF EXISTS \`${masterDbName}\``);
    console.log(`✅ Dropped ${masterDbName}`);

    // Recreate databases
    console.log(`\n🔨 Creating ${dbName}...`);
    await rootConnection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Created ${dbName}`);

    console.log(`\n🔨 Creating ${masterDbName}...`);
    await rootConnection.query(`CREATE DATABASE \`${masterDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Created ${masterDbName}`);

    console.log(`\n✅ Database reset complete!`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Start your server: npm start`);
    console.log(`   2. The server will automatically create all tables`);
    console.log(`   3. Create new tenants using the API`);

  } catch (error) {
    console.error('\n❌ Error resetting database:', error.message);
    process.exit(1);
  } finally {
    await rootConnection.close();
  }
}

// Run if called directly
if (require.main === module) {
  resetDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = resetDatabase;
