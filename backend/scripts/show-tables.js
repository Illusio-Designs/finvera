const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function showTables() {
  try {
    const masterDbName = 'finvera_master';
    
    const sequelize = new Sequelize(
      masterDbName,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
      }
    );

    await sequelize.authenticate();
    console.log(`\n✅ Connected to: ${masterDbName}\n`);

    const [tables] = await sequelize.query('SHOW TABLES');
    
    console.log(`📋 Tables in ${masterDbName}:\n`);
    tables.forEach((t, i) => {
      const tableName = Object.values(t)[0];
      console.log(`${(i + 1).toString().padStart(3)}. ${tableName}`);
    });

    console.log(`\nTotal: ${tables.length} tables\n`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

showTables();
