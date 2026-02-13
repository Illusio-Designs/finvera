require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkVouchersTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'finvera_trader_test',
  });

  try {
    console.log('Checking tds_details table structure...\n');
    
    const [columns] = await connection.query('DESCRIBE tds_details');
    
    console.log('Columns in tds_details table:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkVouchersTable();
