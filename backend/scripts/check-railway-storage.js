#!/usr/bin/env node

/**
 * Railway Storage Monitor
 * Checks MySQL database storage usage and warns when approaching limits
 * Railway free tier: 1GB storage limit
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const STORAGE_LIMIT_MB = 1024; // 1GB in MB
const WARNING_THRESHOLD = 0.8; // Warn at 80%
const CRITICAL_THRESHOLD = 0.9; // Critical at 90%

async function checkStorageUsage() {
  console.log('🔍 Railway Storage Monitor');
  console.log('================================================\n');

  // Connect to MySQL
  const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
  const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
  const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
  const dbPort = process.env.DB_PORT || process.env.MYSQLPORT || 3306;

  console.log(`📡 Connecting to: ${dbHost}:${dbPort}`);

  const sequelize = new Sequelize('', dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log('✓ Connected to MySQL\n');

    // Get all databases
    const [databases] = await sequelize.query('SHOW DATABASES');
    
    console.log('📊 Database Storage Usage:\n');
    console.log('Database Name                    | Size (MB) | Tables | Status');
    console.log('--------------------------------|-----------|--------|----------');

    let totalSizeMB = 0;
    const dbSizes = [];

    for (const db of databases) {
      const dbName = db.Database;
      
      // Skip system databases
      if (['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName)) {
        continue;
      }

      try {
        // Get database size
        const [sizeResult] = await sequelize.query(`
          SELECT 
            table_schema AS 'database',
            COUNT(*) AS tables,
            ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'size_mb'
          FROM information_schema.tables
          WHERE table_schema = '${dbName}'
          GROUP BY table_schema
        `);

        if (sizeResult.length > 0) {
          const sizeMB = parseFloat(sizeResult[0].size_mb) || 0;
          const tables = parseInt(sizeResult[0].tables) || 0;
          totalSizeMB += sizeMB;

          dbSizes.push({
            name: dbName,
            sizeMB,
            tables
          });

          // Determine status
          let status = '✓ OK';
          if (dbName.includes('tenant') || dbName.includes('company')) {
            if (sizeMB > 50) status = '⚠️  Large';
            if (sizeMB > 100) status = '🔴 Very Large';
          }

          console.log(
            `${dbName.padEnd(32)}| ${sizeMB.toFixed(2).padStart(9)} | ${tables.toString().padStart(6)} | ${status}`
          );
        }
      } catch (err) {
        console.log(`${dbName.padEnd(32)}| Error: ${err.message}`);
      }
    }

    console.log('--------------------------------|-----------|--------|----------');
    console.log(`${'TOTAL'.padEnd(32)}| ${totalSizeMB.toFixed(2).padStart(9)} | ${dbSizes.reduce((sum, db) => sum + db.tables, 0).toString().padStart(6)} |`);
    console.log('\n================================================\n');

    // Calculate usage percentage
    const usagePercent = (totalSizeMB / STORAGE_LIMIT_MB) * 100;
    const remainingMB = STORAGE_LIMIT_MB - totalSizeMB;

    console.log('📈 Storage Summary:');
    console.log(`   Total Used: ${totalSizeMB.toFixed(2)} MB`);
    console.log(`   Limit: ${STORAGE_LIMIT_MB} MB (Railway free tier)`);
    console.log(`   Remaining: ${remainingMB.toFixed(2)} MB`);
    console.log(`   Usage: ${usagePercent.toFixed(1)}%`);
    console.log('');

    // Status and recommendations
    if (usagePercent >= CRITICAL_THRESHOLD * 100) {
      console.log('🔴 CRITICAL: Storage usage is very high!');
      console.log('');
      console.log('⚠️  Immediate Actions Required:');
      console.log('   1. Upgrade Railway plan or migrate to Oracle Cloud');
      console.log('   2. Delete unused tenant databases');
      console.log('   3. Archive old data');
      console.log('   4. Optimize database tables (run OPTIMIZE TABLE)');
      console.log('');
    } else if (usagePercent >= WARNING_THRESHOLD * 100) {
      console.log('⚠️  WARNING: Storage usage is high!');
      console.log('');
      console.log('📋 Recommended Actions:');
      console.log('   1. Monitor storage daily');
      console.log('   2. Plan to upgrade or migrate soon');
      console.log('   3. Review and clean up old data');
      console.log('   4. Consider implementing data archival');
      console.log('');
    } else {
      console.log('✅ Storage usage is healthy');
      console.log('');
    }

    // Tenant database analysis
    const tenantDbs = dbSizes.filter(db => 
      db.name.includes('tenant') || db.name.includes('company')
    );

    if (tenantDbs.length > 0) {
      console.log('👥 Tenant Database Analysis:');
      console.log(`   Total Tenants: ${tenantDbs.length}`);
      console.log(`   Average Size: ${(tenantDbs.reduce((sum, db) => sum + db.sizeMB, 0) / tenantDbs.length).toFixed(2)} MB`);
      console.log(`   Largest: ${Math.max(...tenantDbs.map(db => db.sizeMB)).toFixed(2)} MB`);
      console.log(`   Smallest: ${Math.min(...tenantDbs.map(db => db.sizeMB)).toFixed(2)} MB`);
      console.log('');

      // Show largest tenants
      const largestTenants = tenantDbs
        .sort((a, b) => b.sizeMB - a.sizeMB)
        .slice(0, 5);

      if (largestTenants.length > 0) {
        console.log('📊 Top 5 Largest Tenant Databases:');
        largestTenants.forEach((db, index) => {
          console.log(`   ${index + 1}. ${db.name}: ${db.sizeMB.toFixed(2)} MB (${db.tables} tables)`);
        });
        console.log('');
      }
    }

    // Recommendations based on tenant count
    const tenantCount = tenantDbs.length;
    console.log('💡 Recommendations:');
    
    if (tenantCount === 0) {
      console.log('   • No tenant databases found - system is ready for tenants');
    } else if (tenantCount < 10) {
      console.log('   • Current scale: Small (< 10 tenants)');
      console.log('   • Railway free tier is sufficient');
      console.log('   • Monitor storage as you add more tenants');
    } else if (tenantCount < 30) {
      console.log('   • Current scale: Medium (10-30 tenants)');
      console.log('   • Consider upgrading Railway plan soon');
      console.log('   • Implement data cleanup policies');
    } else if (tenantCount < 50) {
      console.log('   • Current scale: Large (30-50 tenants)');
      console.log('   • Upgrade Railway plan or migrate to Oracle Cloud');
      console.log('   • Implement database sharding strategy');
    } else {
      console.log('   • Current scale: Very Large (50+ tenants)');
      console.log('   • Migrate to Oracle Cloud or dedicated infrastructure');
      console.log('   • Implement multi-database architecture');
    }

    console.log('\n================================================\n');

    await sequelize.close();
    
    // Exit with appropriate code
    if (usagePercent >= CRITICAL_THRESHOLD * 100) {
      process.exit(2); // Critical
    } else if (usagePercent >= WARNING_THRESHOLD * 100) {
      process.exit(1); // Warning
    } else {
      process.exit(0); // OK
    }

  } catch (error) {
    console.error('❌ Error checking storage:', error.message);
    console.error('Stack:', error.stack);
    process.exit(3);
  }
}

// Run the check
checkStorageUsage();
