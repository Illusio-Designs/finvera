/**
 * Database Initializer
 * 
 * Automatically checks and initializes databases on server startup:
 * 1. Checks if databases exist
 * 2. Runs pending migrations
 * 3. Runs pending seeders
 * 
 * This ensures the application always has the correct database structure
 */

const { exec } = require('child_process');
const util = require('util');
const mysql = require('mysql2/promise');
const execPromise = util.promisify(exec);

class DatabaseInitializer {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_ROOT_USER || process.env.DB_USER || 'root',
      password: process.env.DB_ROOT_PASSWORD || process.env.DB_PASSWORD || '',
    };
    
    this.databases = {
      master: process.env.MASTER_DB_NAME || 'finvera_master',
      admin: process.env.DB_NAME || 'finvera_db',
    };
  }

  /**
   * Main initialization function
   */
  async initialize() {
    console.log('\n🚀 Starting Database Initialization...\n');
    
    try {
      // Step 1: Check database connection
      await this.checkConnection();
      
      // Step 2: Ensure databases exist
      await this.ensureDatabasesExist();
      
      // Step 3: Run migrations
      await this.runMigrations();
      
      // Step 4: Run seeders
      await this.runSeeders();
      
      console.log('\n✅ Database Initialization Complete!\n');
      return true;
    } catch (error) {
      console.error('\n❌ Database Initialization Failed:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Check database connection
   */
  async checkConnection() {
    console.log('📡 Checking database connection...');
    
    try {
      const connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
      });
      
      await connection.ping();
      await connection.end();
      
      console.log('   ✅ Database connection successful\n');
      return true;
    } catch (error) {
      console.error('   ❌ Database connection failed:', error.message);
      throw new Error('Cannot connect to database. Please check your database configuration.');
    }
  }

  /**
   * Ensure required databases exist
   */
  async ensureDatabasesExist() {
    console.log('🗄️  Checking required databases...');
    
    const connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
    });

    try {
      for (const [type, dbName] of Object.entries(this.databases)) {
        const [databases] = await connection.query(
          'SHOW DATABASES LIKE ?',
          [dbName]
        );

        if (databases.length === 0) {
          console.log(`   📝 Creating ${type} database: ${dbName}`);
          await connection.query(`CREATE DATABASE \`${dbName}\``);
          console.log(`   ✅ Database ${dbName} created`);
        } else {
          console.log(`   ✓ Database ${dbName} exists`);
        }
      }
      
      console.log('');
    } finally {
      await connection.end();
    }
  }

  /**
   * Check if migrations are needed for a database
   */
  async checkMigrationsNeeded(dbName) {
    const connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: dbName,
    });

    try {
      // Check if SequelizeMeta table exists
      const [tables] = await connection.query(
        "SHOW TABLES LIKE 'sequelizemeta'"
      );

      if (tables.length === 0) {
        // No migration table = needs migrations
        return true;
      }

      // Check if there are any migrations recorded
      const [migrations] = await connection.query(
        'SELECT COUNT(*) as count FROM sequelizemeta'
      );

      // If no migrations recorded, needs migrations
      return migrations[0].count === 0;
    } catch (error) {
      // If error checking, assume migrations needed
      return true;
    } finally {
      await connection.end();
    }
  }

  /**
   * Check if seeders are needed for a database
   */
  async checkSeedersNeeded(dbName) {
    const connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: dbName,
    });

    try {
      // Check if seeder_meta table exists
      const [tables] = await connection.query(
        "SHOW TABLES LIKE 'seeder_meta'"
      );

      if (tables.length === 0) {
        // No seeder table = needs seeders
        return true;
      }

      // Check if there are any seeders recorded
      const [seeders] = await connection.query(
        'SELECT COUNT(*) as count FROM seeder_meta'
      );

      // If no seeders recorded, needs seeders
      return seeders[0].count === 0;
    } catch (error) {
      // If error checking, assume seeders needed
      return true;
    } finally {
      await connection.end();
    }
  }

  /**
   * Run migrations for all databases
   */
  async runMigrations() {
    console.log('🔄 Running migrations...\n');

    for (const [type, dbName] of Object.entries(this.databases)) {
      try {
        const needsMigrations = await this.checkMigrationsNeeded(dbName);
        
        if (!needsMigrations) {
          console.log(`   ℹ️  ${type} database (${dbName}): Migrations up to date`);
          continue;
        }

        console.log(`   📋 Running migrations for ${type} database (${dbName})...`);
        
        // Run migrations using Sequelize CLI
        const { stdout, stderr } = await execPromise(
          `npx sequelize-cli db:migrate --env development`,
          {
            cwd: process.cwd(),
            env: { ...process.env, DB_NAME: dbName },
          }
        );

        if (stderr && !stderr.includes('DeprecationWarning')) {
          console.error(`   ⚠️  Migration warnings for ${dbName}:`, stderr);
        }

        console.log(`   ✅ Migrations completed for ${dbName}`);
      } catch (error) {
        console.error(`   ❌ Migration failed for ${dbName}:`, error.message);
        // Don't throw - continue with other databases
      }
    }
    
    console.log('');
  }

  /**
   * Run seeders for all databases
   */
  async runSeeders() {
    console.log('🌱 Running seeders...\n');

    for (const [type, dbName] of Object.entries(this.databases)) {
      try {
        const needsSeeders = await this.checkSeedersNeeded(dbName);
        
        if (!needsSeeders) {
          console.log(`   ℹ️  ${type} database (${dbName}): Seeders already run`);
          continue;
        }

        console.log(`   📋 Running seeders for ${type} database (${dbName})...`);
        
        // Run seeders using Sequelize CLI
        const { stdout, stderr } = await execPromise(
          `npx sequelize-cli db:seed:all --env development`,
          {
            cwd: process.cwd(),
            env: { ...process.env, DB_NAME: dbName },
          }
        );

        if (stderr && !stderr.includes('DeprecationWarning')) {
          console.error(`   ⚠️  Seeder warnings for ${dbName}:`, stderr);
        }

        console.log(`   ✅ Seeders completed for ${dbName}`);
      } catch (error) {
        console.error(`   ❌ Seeder failed for ${dbName}:`, error.message);
        // Don't throw - continue with other databases
      }
    }
    
    console.log('');
  }

  /**
   * Force re-run migrations (for development)
   */
  async forceMigrations() {
    console.log('🔄 Force running migrations...\n');

    for (const [type, dbName] of Object.entries(this.databases)) {
      try {
        console.log(`   📋 Running migrations for ${type} database (${dbName})...`);
        
        const { stdout, stderr } = await execPromise(
          `npx sequelize-cli db:migrate --env development`,
          {
            cwd: process.cwd(),
            env: { ...process.env, DB_NAME: dbName },
          }
        );

        console.log(`   ✅ Migrations completed for ${dbName}`);
      } catch (error) {
        console.error(`   ❌ Migration failed for ${dbName}:`, error.message);
      }
    }
    
    console.log('');
  }

  /**
   * Force re-run seeders (for development)
   */
  async forceSeeders() {
    console.log('🌱 Force running seeders...\n');

    for (const [type, dbName] of Object.entries(this.databases)) {
      try {
        console.log(`   📋 Running seeders for ${type} database (${dbName})...`);
        
        const { stdout, stderr } = await execPromise(
          `npx sequelize-cli db:seed:all --env development`,
          {
            cwd: process.cwd(),
            env: { ...process.env, DB_NAME: dbName },
          }
        );

        console.log(`   ✅ Seeders completed for ${dbName}`);
      } catch (error) {
        console.error(`   ❌ Seeder failed for ${dbName}:`, error.message);
      }
    }
    
    console.log('');
  }
}

// Export singleton instance
module.exports = new DatabaseInitializer();
