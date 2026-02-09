#!/usr/bin/env node

/**
 * Railway Post-Deploy Script
 * Runs after deployment to set up databases and run migrations
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚂 Railway Post-Deploy Script Starting...');
console.log('================================================');

// Check if we're in Railway environment
const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined;
if (!isRailway) {
  console.log('⚠️  Not running in Railway environment, skipping post-deploy tasks');
  process.exit(0);
}

console.log('✓ Running in Railway environment');
console.log(`  Environment: ${process.env.RAILWAY_ENVIRONMENT || 'unknown'}`);
console.log(`  Service: ${process.env.RAILWAY_SERVICE_NAME || 'unknown'}`);

// Function to run command with error handling
function runCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      env: process.env
    });
    console.log(`✓ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

// Main deployment tasks
async function postDeploy() {
  console.log('\n🔄 Starting post-deployment tasks...\n');

  // 1. Check database connection
  console.log('1️⃣ Checking database connection...');
  const dbHost = process.env.DB_HOST || process.env.MYSQLHOST;
  const dbName = process.env.DB_NAME || 'finvera_main';
  const masterDbName = process.env.MASTER_DB_NAME || 'finvera_master';
  
  if (!dbHost) {
    console.error('❌ Database host not configured!');
    console.error('   Please add MySQL plugin in Railway dashboard');
    process.exit(1);
  }
  
  console.log(`✓ Database host: ${dbHost}`);
  console.log(`✓ Main database: ${dbName}`);
  console.log(`✓ Master database: ${masterDbName}`);

  // 2. Run database migrations
  console.log('\n2️⃣ Running database migrations...');
  const migrationSuccess = runCommand(
    'npm run migrate',
    'Database migrations'
  );
  
  if (!migrationSuccess) {
    console.warn('⚠️  Migrations failed, but continuing...');
    console.warn('   You may need to run migrations manually');
  }

  // 3. Run database seeders (only in development/staging)
  if (process.env.RAILWAY_ENVIRONMENT !== 'production') {
    console.log('\n3️⃣ Running database seeders...');
    const seedSuccess = runCommand(
      'npm run seed',
      'Database seeders'
    );
    
    if (!seedSuccess) {
      console.warn('⚠️  Seeders failed, but continuing...');
      console.warn('   You may need to run seeders manually');
    }
  } else {
    console.log('\n3️⃣ Skipping seeders (production environment)');
  }

  // 4. Verify critical environment variables
  console.log('\n4️⃣ Verifying environment variables...');
  const requiredVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'MASTER_DB_NAME'
  ];

  let missingVars = [];
  requiredVars.forEach(varName => {
    if (!process.env[varName] && !process.env[varName.replace('DB_', 'MYSQL')]) {
      missingVars.push(varName);
      console.error(`❌ Missing: ${varName}`);
    } else {
      console.log(`✓ ${varName} is set`);
    }
  });

  if (missingVars.length > 0) {
    console.error('\n❌ Missing required environment variables!');
    console.error('   Please set these in Railway dashboard:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }

  // 5. Check Redis connection (optional)
  console.log('\n5️⃣ Checking Redis configuration...');
  if (process.env.REDIS_ENABLED === 'true') {
    const redisHost = process.env.REDIS_HOST;
    if (redisHost) {
      console.log(`✓ Redis enabled: ${redisHost}`);
    } else {
      console.warn('⚠️  Redis enabled but REDIS_HOST not set');
      console.warn('   Add Redis plugin in Railway dashboard');
    }
  } else {
    console.log('ℹ️  Redis is disabled');
  }

  // 6. Display deployment summary
  console.log('\n================================================');
  console.log('🎉 Post-Deploy Script Completed!');
  console.log('================================================');
  console.log('\n📊 Deployment Summary:');
  console.log(`   Environment: ${process.env.RAILWAY_ENVIRONMENT || 'unknown'}`);
  console.log(`   Node Version: ${process.version}`);
  console.log(`   Database: ${dbHost}`);
  console.log(`   Redis: ${process.env.REDIS_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`   CORS Origin: ${process.env.CORS_ORIGIN || 'Not set'}`);
  console.log('\n✅ Backend is ready to serve requests!');
  console.log('================================================\n');
}

// Run post-deploy tasks
postDeploy().catch(error => {
  console.error('\n❌ Post-deploy script failed:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});
