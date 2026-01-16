'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove foreign key constraint from subscriptions table
    // This is needed because subscription_plans is in main DB (finvera_db)
    // but subscriptions is in master DB (finvera_master)
    // Cross-database foreign keys are not supported in MySQL
    
    try {
      // Drop the foreign key constraint
      await queryInterface.removeConstraint('subscriptions', 'subscriptions_ibfk_30');
      console.log('Successfully removed foreign key constraint subscriptions_ibfk_30');
    } catch (error) {
      // If constraint doesn't exist or has different name, try to find and remove it
      console.log('Could not remove constraint subscriptions_ibfk_30, trying alternative approach...');
      
      try {
        // Get all foreign keys on subscriptions table
        const [foreignKeys] = await queryInterface.sequelize.query(`
          SELECT CONSTRAINT_NAME 
          FROM information_schema.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'subscriptions' 
          AND REFERENCED_TABLE_NAME = 'subscription_plans'
        `);
        
        // Remove each foreign key that references subscription_plans
        for (const fk of foreignKeys) {
          await queryInterface.removeConstraint('subscriptions', fk.CONSTRAINT_NAME);
          console.log(`Successfully removed foreign key constraint ${fk.CONSTRAINT_NAME}`);
        }
      } catch (innerError) {
        console.log('No foreign key constraints found or already removed');
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: We don't recreate the foreign key in down migration
    // because it references a table in a different database
    console.log('Foreign key constraint not recreated (cross-database reference not supported)');
  }
};
