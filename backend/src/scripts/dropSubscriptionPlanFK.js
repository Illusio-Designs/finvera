const masterSequelize = require('../config/masterDatabase');

async function dropForeignKey() {
  try {
    console.log('Checking for foreign key constraints on subscriptions table...');
    
    // Get all foreign keys that reference subscription_plans
    const [foreignKeys] = await masterSequelize.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'subscriptions' 
      AND REFERENCED_TABLE_NAME = 'subscription_plans'
    `);
    
    if (foreignKeys.length === 0) {
      console.log('✓ No foreign key constraints found referencing subscription_plans');
      process.exit(0);
    }
    
    console.log(`Found ${foreignKeys.length} foreign key constraint(s):`);
    foreignKeys.forEach(fk => console.log(`  - ${fk.CONSTRAINT_NAME}`));
    
    // Drop each foreign key
    for (const fk of foreignKeys) {
      console.log(`\nDropping constraint: ${fk.CONSTRAINT_NAME}...`);
      await masterSequelize.query(`
        ALTER TABLE subscriptions 
        DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}
      `);
      console.log(`✓ Successfully dropped ${fk.CONSTRAINT_NAME}`);
    }
    
    console.log('\n✅ All foreign key constraints removed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropForeignKey();
