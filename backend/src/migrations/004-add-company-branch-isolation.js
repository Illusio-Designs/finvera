/**
 * Migration: Add company_id and branch_id for explicit company/branch-level isolation
 * 
 * This migration adds company_id and branch_id columns to vouchers and numbering_series tables
 * to support explicit company-level and branch-level data isolation in multi-company scenarios.
 * 
 * Architecture: Tenant → Company → Branch
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting migration: Add company_id and branch_id for isolation...');
      
      // 1. Add company_id and branch_id to vouchers table
      console.log('Adding company_id and branch_id to vouchers table...');
      await queryInterface.addColumn('vouchers', 'company_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Company ID for explicit company-level isolation',
      }, { transaction });
      
      await queryInterface.addColumn('vouchers', 'branch_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Branch ID for explicit branch-level isolation',
      }, { transaction });
      
      // 2. Add company_id to numbering_series table
      console.log('Adding company_id to numbering_series table...');
      await queryInterface.addColumn('numbering_series', 'company_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Company ID for company-specific numbering sequences',
      }, { transaction });
      
      // 3. Add indexes for better query performance
      console.log('Adding indexes for company_id and branch_id...');
      
      // Vouchers indexes
      await queryInterface.addIndex('vouchers', ['tenant_id', 'company_id'], {
        name: 'idx_vouchers_tenant_company',
        transaction
      });
      
      await queryInterface.addIndex('vouchers', ['tenant_id', 'company_id', 'branch_id'], {
        name: 'idx_vouchers_tenant_company_branch',
        transaction
      });
      
      await queryInterface.addIndex('vouchers', ['company_id', 'voucher_date'], {
        name: 'idx_vouchers_company_date',
        transaction
      });
      
      await queryInterface.addIndex('vouchers', ['branch_id', 'voucher_date'], {
        name: 'idx_vouchers_branch_date',
        transaction
      });
      
      // NumberingSeries indexes
      await queryInterface.addIndex('numbering_series', ['tenant_id', 'company_id', 'voucher_type'], {
        name: 'idx_numbering_tenant_company_type',
        transaction
      });
      
      await queryInterface.addIndex('numbering_series', ['company_id', 'branch_id', 'voucher_type'], {
        name: 'idx_numbering_company_branch_type',
        transaction
      });
      
      console.log('Migration completed successfully!');
      await transaction.commit();
      
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Rolling back migration: Remove company_id and branch_id...');
      
      // Remove indexes first
      console.log('Removing indexes...');
      await queryInterface.removeIndex('vouchers', 'idx_vouchers_tenant_company', { transaction });
      await queryInterface.removeIndex('vouchers', 'idx_vouchers_tenant_company_branch', { transaction });
      await queryInterface.removeIndex('vouchers', 'idx_vouchers_company_date', { transaction });
      await queryInterface.removeIndex('vouchers', 'idx_vouchers_branch_date', { transaction });
      await queryInterface.removeIndex('numbering_series', 'idx_numbering_tenant_company_type', { transaction });
      await queryInterface.removeIndex('numbering_series', 'idx_numbering_company_branch_type', { transaction });
      
      // Remove columns
      console.log('Removing columns...');
      await queryInterface.removeColumn('vouchers', 'company_id', { transaction });
      await queryInterface.removeColumn('vouchers', 'branch_id', { transaction });
      await queryInterface.removeColumn('numbering_series', 'company_id', { transaction });
      
      console.log('Rollback completed successfully!');
      await transaction.commit();
      
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
