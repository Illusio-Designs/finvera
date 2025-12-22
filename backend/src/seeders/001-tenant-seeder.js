/**
 * Consolidated Seeder for Tenant Databases
 * 
 * This file contains all seeders for tenant-specific databases.
 * These seeders run on each tenant's individual database.
 * 
 * IMPORTANT: This seeder runs on each tenant database separately
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // ============================================
    // TENANT-SPECIFIC DEFAULT DATA
    // ============================================

    // Note: Most tenant-specific data is created dynamically when:
    // - Tenant is provisioned
    // - User creates companies/ledgers/vouchers
    // 
    // This seeder can be extended to add default voucher types,
    // default account groups, or other tenant-specific defaults
    // that should be present in every tenant database.

    console.log('✓ Tenant seeder completed (no default data to seed)');
  },

  async down(queryInterface, Sequelize) {
    // Remove any tenant-specific default data if needed
    // Currently no data to remove
  },
};
