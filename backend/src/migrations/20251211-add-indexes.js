'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to safely add index
    const addIndexIfNotExists = async (tableName, fields, options) => {
      try {
        await queryInterface.addIndex(tableName, fields, options);
      } catch (error) {
        // Ignore error if index already exists
        if (!error.message.includes('Duplicate key name') && !error.message.includes('already exists')) {
          throw error;
        }
      }
    };

    // Add indexes for frequently queried fields
    await addIndexIfNotExists('vouchers', ['tenant_id', 'voucher_date'], {
      name: 'idx_vouchers_tenant_date',
    });
    await addIndexIfNotExists('vouchers', ['tenant_id', 'status'], {
      name: 'idx_vouchers_tenant_status',
    });
    await addIndexIfNotExists('voucher_ledger_entries', ['tenant_id', 'ledger_id'], {
      name: 'idx_vle_tenant_ledger',
    });
    await addIndexIfNotExists('voucher_ledger_entries', ['voucher_id'], {
      name: 'idx_vle_voucher',
    });
    await addIndexIfNotExists('ledgers', ['tenant_id', 'account_group_id'], {
      name: 'idx_ledgers_tenant_group',
    });
    await addIndexIfNotExists('ledgers', ['tenant_id', 'ledger_code'], {
      name: 'idx_ledgers_tenant_code',
    });
    await addIndexIfNotExists('bill_wise_details', ['tenant_id', 'ledger_id'], {
      name: 'idx_bills_tenant_ledger',
    });
    await addIndexIfNotExists('bill_wise_details', ['tenant_id', 'status'], {
      name: 'idx_bills_tenant_status',
    });
    await addIndexIfNotExists('commissions', ['tenant_id', 'status'], {
      name: 'idx_commissions_tenant_status',
    });
    await addIndexIfNotExists('commissions', ['distributor_id'], {
      name: 'idx_commissions_distributor',
    });
    await addIndexIfNotExists('commissions', ['salesman_id'], {
      name: 'idx_commissions_salesman',
    });
    await addIndexIfNotExists('gstr_returns', ['tenant_id', 'return_period'], {
      name: 'idx_gstr_tenant_period',
    });
    await addIndexIfNotExists('tds_details', ['tenant_id', 'tds_section'], {
      name: 'idx_tds_tenant_section',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('vouchers', 'idx_vouchers_tenant_date');
    await queryInterface.removeIndex('vouchers', 'idx_vouchers_tenant_status');
    await queryInterface.removeIndex('voucher_ledger_entries', 'idx_vle_tenant_ledger');
    await queryInterface.removeIndex('voucher_ledger_entries', 'idx_vle_voucher');
    await queryInterface.removeIndex('ledgers', 'idx_ledgers_tenant_group');
    await queryInterface.removeIndex('ledgers', 'idx_ledgers_tenant_code');
    await queryInterface.removeIndex('bill_wise_details', 'idx_bills_tenant_ledger');
    await queryInterface.removeIndex('bill_wise_details', 'idx_bills_tenant_status');
    await queryInterface.removeIndex('commissions', 'idx_commissions_tenant_status');
    await queryInterface.removeIndex('commissions', 'idx_commissions_distributor');
    await queryInterface.removeIndex('commissions', 'idx_commissions_salesman');
    await queryInterface.removeIndex('gstr_returns', 'idx_gstr_tenant_period');
    await queryInterface.removeIndex('tds_details', 'idx_tds_tenant_section');
  },
};

