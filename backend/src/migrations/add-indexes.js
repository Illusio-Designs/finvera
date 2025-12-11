'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add indexes for frequently queried fields
    await queryInterface.addIndex('vouchers', ['tenant_id', 'voucher_date'], {
      name: 'idx_vouchers_tenant_date',
    });
    await queryInterface.addIndex('vouchers', ['tenant_id', 'status'], {
      name: 'idx_vouchers_tenant_status',
    });
    await queryInterface.addIndex('voucher_ledger_entries', ['tenant_id', 'ledger_id'], {
      name: 'idx_vle_tenant_ledger',
    });
    await queryInterface.addIndex('voucher_ledger_entries', ['voucher_id'], {
      name: 'idx_vle_voucher',
    });
    await queryInterface.addIndex('ledgers', ['tenant_id', 'account_group_id'], {
      name: 'idx_ledgers_tenant_group',
    });
    await queryInterface.addIndex('ledgers', ['tenant_id', 'ledger_type'], {
      name: 'idx_ledgers_tenant_type',
    });
    await queryInterface.addIndex('bill_wise_details', ['tenant_id', 'ledger_id'], {
      name: 'idx_bills_tenant_ledger',
    });
    await queryInterface.addIndex('bill_wise_details', ['tenant_id', 'is_fully_paid'], {
      name: 'idx_bills_tenant_paid',
    });
    await queryInterface.addIndex('commissions', ['tenant_id', 'status'], {
      name: 'idx_commissions_tenant_status',
    });
    await queryInterface.addIndex('commissions', ['recipient_type', 'recipient_id'], {
      name: 'idx_commissions_recipient',
    });
    await queryInterface.addIndex('gstr_returns', ['tenant_id', 'return_period'], {
      name: 'idx_gstr_tenant_period',
    });
    await queryInterface.addIndex('tds_details', ['tenant_id', 'quarter', 'financial_year'], {
      name: 'idx_tds_tenant_quarter',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('vouchers', 'idx_vouchers_tenant_date');
    await queryInterface.removeIndex('vouchers', 'idx_vouchers_tenant_status');
    await queryInterface.removeIndex('voucher_ledger_entries', 'idx_vle_tenant_ledger');
    await queryInterface.removeIndex('voucher_ledger_entries', 'idx_vle_voucher');
    await queryInterface.removeIndex('ledgers', 'idx_ledgers_tenant_group');
    await queryInterface.removeIndex('ledgers', 'idx_ledgers_tenant_type');
    await queryInterface.removeIndex('bill_wise_details', 'idx_bills_tenant_ledger');
    await queryInterface.removeIndex('bill_wise_details', 'idx_bills_tenant_paid');
    await queryInterface.removeIndex('commissions', 'idx_commissions_tenant_status');
    await queryInterface.removeIndex('commissions', 'idx_commissions_recipient');
    await queryInterface.removeIndex('gstr_returns', 'idx_gstr_tenant_period');
    await queryInterface.removeIndex('tds_details', 'idx_tds_tenant_quarter');
  },
};

