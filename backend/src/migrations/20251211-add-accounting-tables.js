'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Commission table
    await queryInterface.createTable('commissions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      distributor_id: Sequelize.UUID,
      salesman_id: Sequelize.UUID,
      commission_type: Sequelize.STRING, // subscription, renewal, referral
      subscription_plan: Sequelize.STRING,
      amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      commission_rate: Sequelize.DECIMAL(5, 2),
      status: { type: Sequelize.STRING, defaultValue: 'pending' },
      payout_id: Sequelize.UUID,
      commission_date: Sequelize.DATE,
      notes: Sequelize.TEXT,
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Payout table
    await queryInterface.createTable('payouts', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      distributor_id: Sequelize.UUID,
      salesman_id: Sequelize.UUID,
      payout_type: Sequelize.STRING, // distributor, salesman
      total_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      status: { type: Sequelize.STRING, defaultValue: 'pending' },
      payment_method: Sequelize.STRING,
      payment_reference: Sequelize.STRING,
      paid_date: Sequelize.DATE,
      notes: Sequelize.TEXT,
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Lead table
    await queryInterface.createTable('leads', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      salesman_id: { type: Sequelize.UUID, allowNull: false },
      distributor_id: Sequelize.UUID,
      company_name: { type: Sequelize.STRING, allowNull: false },
      contact_person: Sequelize.STRING,
      email: Sequelize.STRING,
      phone: Sequelize.STRING(15),
      status: { type: Sequelize.STRING, defaultValue: 'new' },
      source: Sequelize.STRING,
      notes: Sequelize.TEXT,
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Lead Activity table
    await queryInterface.createTable('lead_activities', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      lead_id: { type: Sequelize.UUID, allowNull: false },
      activity_type: Sequelize.STRING,
      description: Sequelize.TEXT,
      activity_date: Sequelize.DATE,
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Target table
    await queryInterface.createTable('targets', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      distributor_id: Sequelize.UUID,
      salesman_id: Sequelize.UUID,
      target_type: Sequelize.STRING, // subscription, revenue
      target_period: Sequelize.STRING, // monthly, quarterly, yearly
      target_value: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      achieved_value: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      start_date: Sequelize.DATE,
      end_date: Sequelize.DATE,
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Account Group table
    await queryInterface.createTable('account_groups', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      group_code: { type: Sequelize.STRING, allowNull: false },
      group_name: { type: Sequelize.STRING, allowNull: false },
      parent_id: Sequelize.UUID,
      group_type: Sequelize.STRING, // Assets, Liabilities, Income, Expenses
      schedule_iii_category: Sequelize.STRING,
      is_system: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Ledger table
    await queryInterface.createTable('ledgers', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      account_group_id: { type: Sequelize.UUID, allowNull: false },
      ledger_code: { type: Sequelize.STRING, allowNull: false },
      ledger_name: { type: Sequelize.STRING, allowNull: false },
      opening_balance: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      opening_balance_type: Sequelize.STRING, // Dr, Cr
      gstin: Sequelize.STRING(15),
      pan: Sequelize.STRING(10),
      address: Sequelize.TEXT,
      city: Sequelize.STRING(100),
      state: Sequelize.STRING(100),
      pincode: Sequelize.STRING(10),
      phone: Sequelize.STRING(15),
      email: Sequelize.STRING(255),
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Voucher Type table
    await queryInterface.createTable('voucher_types', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      type_code: { type: Sequelize.STRING, allowNull: false, unique: true },
      type_name: { type: Sequelize.STRING, allowNull: false },
      prefix: Sequelize.STRING(10),
      numbering_method: Sequelize.STRING,
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Voucher table
    await queryInterface.createTable('vouchers', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      voucher_type_id: { type: Sequelize.UUID, allowNull: false },
      voucher_number: { type: Sequelize.STRING, allowNull: false },
      voucher_date: { type: Sequelize.DATE, allowNull: false },
      reference_number: Sequelize.STRING,
      narration: Sequelize.TEXT,
      total_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      status: { type: Sequelize.STRING, defaultValue: 'draft' },
      posted_at: Sequelize.DATE,
      posted_by: Sequelize.UUID,
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Voucher Item table
    await queryInterface.createTable('voucher_items', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      voucher_id: { type: Sequelize.UUID, allowNull: false },
      item_name: Sequelize.STRING,
      hsn_sac: Sequelize.STRING(10),
      quantity: Sequelize.DECIMAL(10, 3),
      unit: Sequelize.STRING(20),
      rate: Sequelize.DECIMAL(15, 2),
      amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      cgst_rate: Sequelize.DECIMAL(5, 2),
      sgst_rate: Sequelize.DECIMAL(5, 2),
      igst_rate: Sequelize.DECIMAL(5, 2),
      cess_rate: Sequelize.DECIMAL(5, 2),
      cgst_amount: Sequelize.DECIMAL(15, 2),
      sgst_amount: Sequelize.DECIMAL(15, 2),
      igst_amount: Sequelize.DECIMAL(15, 2),
      cess_amount: Sequelize.DECIMAL(15, 2),
      total_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Voucher Ledger Entry table
    await queryInterface.createTable('voucher_ledger_entries', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      voucher_id: { type: Sequelize.UUID, allowNull: false },
      ledger_id: { type: Sequelize.UUID, allowNull: false },
      debit_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      credit_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Bill Wise Detail table
    await queryInterface.createTable('bill_wise_details', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      voucher_id: { type: Sequelize.UUID, allowNull: false },
      ledger_id: { type: Sequelize.UUID, allowNull: false },
      bill_number: Sequelize.STRING,
      bill_date: Sequelize.DATE,
      bill_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      due_date: Sequelize.DATE,
      status: { type: Sequelize.STRING, defaultValue: 'open' },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Bill Allocation table
    await queryInterface.createTable('bill_allocations', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      bill_wise_detail_id: { type: Sequelize.UUID, allowNull: false },
      voucher_id: { type: Sequelize.UUID, allowNull: false },
      allocated_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      allocation_date: Sequelize.DATE,
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // GST Rate table
    await queryInterface.createTable('gst_rates', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      hsn_sac: { type: Sequelize.STRING(10), allowNull: false },
      description: Sequelize.TEXT,
      cgst_rate: Sequelize.DECIMAL(5, 2),
      sgst_rate: Sequelize.DECIMAL(5, 2),
      igst_rate: Sequelize.DECIMAL(5, 2),
      cess_rate: Sequelize.DECIMAL(5, 2),
      effective_from: Sequelize.DATE,
      effective_to: Sequelize.DATE,
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // GSTIN table
    await queryInterface.createTable('gstins', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      gstin: { type: Sequelize.STRING(15), allowNull: false, unique: true },
      legal_name: { type: Sequelize.STRING(255), allowNull: false },
      trade_name: Sequelize.STRING(255),
      registration_type: { type: Sequelize.STRING(50), defaultValue: 'Regular' },
      state: { type: Sequelize.STRING(100), allowNull: false },
      state_code: { type: Sequelize.STRING(2), allowNull: false },
      registration_date: Sequelize.DATE,
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      is_primary: { type: Sequelize.BOOLEAN, defaultValue: false },
      e_invoice_applicable: { type: Sequelize.BOOLEAN, defaultValue: false },
      e_way_bill_applicable: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // GSTR Return table
    await queryInterface.createTable('gstr_returns', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      gstin: { type: Sequelize.STRING(15), allowNull: false },
      return_type: { type: Sequelize.STRING(10), allowNull: false },
      return_period: { type: Sequelize.STRING(7), allowNull: false },
      filing_status: { type: Sequelize.STRING(20), defaultValue: 'draft' },
      total_taxable_value: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      total_tax: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      json_data: Sequelize.JSON,
      filed_date: Sequelize.DATE,
      acknowledgment_number: Sequelize.STRING(50),
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // TDS Detail table
    await queryInterface.createTable('tds_details', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      voucher_id: Sequelize.UUID,
      ledger_id: Sequelize.UUID,
      tds_section: Sequelize.STRING(10),
      tds_rate: Sequelize.DECIMAL(5, 2),
      tds_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      tds_deducted_date: Sequelize.DATE,
      challan_number: Sequelize.STRING(50),
      challan_date: Sequelize.DATE,
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // E-Invoice table
    await queryInterface.createTable('e_invoices', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      voucher_id: { type: Sequelize.UUID, allowNull: false },
      irn: Sequelize.STRING(100),
      ack_no: Sequelize.STRING(50),
      ack_date: Sequelize.DATE,
      qr_code: Sequelize.TEXT,
      signed_invoice: Sequelize.TEXT,
      cancel_reason: Sequelize.STRING(100),
      cancel_remark: Sequelize.TEXT,
      canceled_at: Sequelize.DATE,
      status: { type: Sequelize.STRING(20), defaultValue: 'pending' },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Audit Log table
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      tenant_id: Sequelize.UUID,
      user_id: { type: Sequelize.UUID, allowNull: false },
      action: { type: Sequelize.STRING(50), allowNull: false },
      entity_type: { type: Sequelize.STRING(50), allowNull: false },
      entity_id: Sequelize.UUID,
      old_values: Sequelize.JSON,
      new_values: Sequelize.JSON,
      ip_address: Sequelize.STRING(45),
      user_agent: Sequelize.TEXT,
      description: Sequelize.TEXT,
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // Add foreign key constraints
    await queryInterface.addConstraint('commissions', {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_commissions_tenant',
      references: { table: 'tenants', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('payouts', {
      fields: ['distributor_id'],
      type: 'foreign key',
      name: 'fk_payouts_distributor',
      references: { table: 'distributors', field: 'id' },
      onDelete: 'SET NULL',
    });

    await queryInterface.addConstraint('leads', {
      fields: ['salesman_id'],
      type: 'foreign key',
      name: 'fk_leads_salesman',
      references: { table: 'salesmen', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('account_groups', {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_account_groups_tenant',
      references: { table: 'tenants', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('ledgers', {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_ledgers_tenant',
      references: { table: 'tenants', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('ledgers', {
      fields: ['account_group_id'],
      type: 'foreign key',
      name: 'fk_ledgers_account_group',
      references: { table: 'account_groups', field: 'id' },
      onDelete: 'RESTRICT',
    });

    await queryInterface.addConstraint('vouchers', {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_vouchers_tenant',
      references: { table: 'tenants', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('vouchers', {
      fields: ['voucher_type_id'],
      type: 'foreign key',
      name: 'fk_vouchers_voucher_type',
      references: { table: 'voucher_types', field: 'id' },
      onDelete: 'RESTRICT',
    });

    await queryInterface.addConstraint('voucher_items', {
      fields: ['voucher_id'],
      type: 'foreign key',
      name: 'fk_voucher_items_voucher',
      references: { table: 'vouchers', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('voucher_ledger_entries', {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_vle_tenant',
      references: { table: 'tenants', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('voucher_ledger_entries', {
      fields: ['voucher_id'],
      type: 'foreign key',
      name: 'fk_vle_voucher',
      references: { table: 'vouchers', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('voucher_ledger_entries', {
      fields: ['ledger_id'],
      type: 'foreign key',
      name: 'fk_vle_ledger',
      references: { table: 'ledgers', field: 'id' },
      onDelete: 'RESTRICT',
    });

    await queryInterface.addConstraint('bill_wise_details', {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_bill_wise_tenant',
      references: { table: 'tenants', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('bill_wise_details', {
      fields: ['voucher_id'],
      type: 'foreign key',
      name: 'fk_bill_wise_voucher',
      references: { table: 'vouchers', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('bill_wise_details', {
      fields: ['ledger_id'],
      type: 'foreign key',
      name: 'fk_bill_wise_ledger',
      references: { table: 'ledgers', field: 'id' },
      onDelete: 'RESTRICT',
    });

    await queryInterface.addConstraint('bill_allocations', {
      fields: ['bill_wise_detail_id'],
      type: 'foreign key',
      name: 'fk_bill_allocations_bill_wise',
      references: { table: 'bill_wise_details', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('bill_allocations', {
      fields: ['voucher_id'],
      type: 'foreign key',
      name: 'fk_bill_allocations_voucher',
      references: { table: 'vouchers', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('gstins', {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_gstins_tenant',
      references: { table: 'tenants', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('gstr_returns', {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_gstr_returns_tenant',
      references: { table: 'tenants', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('tds_details', {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_tds_details_tenant',
      references: { table: 'tenants', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('e_invoices', {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_e_invoices_tenant',
      references: { table: 'tenants', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('e_invoices', {
      fields: ['voucher_id'],
      type: 'foreign key',
      name: 'fk_e_invoices_voucher',
      references: { table: 'vouchers', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('audit_logs', {
      fields: ['tenant_id'],
      type: 'foreign key',
      name: 'fk_audit_logs_tenant',
      references: { table: 'tenants', field: 'id' },
      onDelete: 'SET NULL',
    });

    await queryInterface.addConstraint('audit_logs', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_audit_logs_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('e_invoices');
    await queryInterface.dropTable('tds_details');
    await queryInterface.dropTable('gstr_returns');
    await queryInterface.dropTable('gstins');
    await queryInterface.dropTable('gst_rates');
    await queryInterface.dropTable('bill_allocations');
    await queryInterface.dropTable('bill_wise_details');
    await queryInterface.dropTable('voucher_ledger_entries');
    await queryInterface.dropTable('voucher_items');
    await queryInterface.dropTable('vouchers');
    await queryInterface.dropTable('voucher_types');
    await queryInterface.dropTable('ledgers');
    await queryInterface.dropTable('account_groups');
    await queryInterface.dropTable('targets');
    await queryInterface.dropTable('lead_activities');
    await queryInterface.dropTable('leads');
    await queryInterface.dropTable('payouts');
    await queryInterface.dropTable('commissions');
  },
};

