module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tenants', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      company_name: { type: Sequelize.STRING, allowNull: false },
      gstin: Sequelize.STRING(15),
      pan: Sequelize.STRING(10),
      subscription_plan: Sequelize.STRING,
      subscription_start: Sequelize.DATE,
      subscription_end: Sequelize.DATE,
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: Sequelize.STRING,
      full_name: Sequelize.STRING,
      role: Sequelize.STRING,
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('distributors', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      user_id: { type: Sequelize.UUID, allowNull: false },
      distributor_code: { type: Sequelize.STRING, allowNull: false, unique: true },
      company_name: Sequelize.STRING,
      territory: Sequelize.JSON,
      commission_rate: Sequelize.DECIMAL(5, 2),
      payment_terms: Sequelize.STRING,
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('salesmen', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      user_id: { type: Sequelize.UUID, allowNull: false },
      distributor_id: { type: Sequelize.UUID, allowNull: true },
      salesman_code: { type: Sequelize.STRING, allowNull: false, unique: true },
      full_name: { type: Sequelize.STRING, allowNull: false },
      territory: Sequelize.JSON,
      commission_rate: Sequelize.DECIMAL(5, 2),
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('subscription_plans', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      plan_code: { type: Sequelize.STRING, allowNull: false, unique: true },
      plan_name: { type: Sequelize.STRING, allowNull: false },
      description: Sequelize.TEXT,
      billing_cycle: Sequelize.STRING,
      base_price: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      discounted_price: Sequelize.DECIMAL(15, 2),
      currency: { type: Sequelize.STRING(3), defaultValue: 'INR' },
      trial_days: { type: Sequelize.INTEGER, defaultValue: 0 },
      max_users: Sequelize.INTEGER,
      max_invoices_per_month: Sequelize.INTEGER,
      max_companies: { type: Sequelize.INTEGER, defaultValue: 1 },
      storage_limit_gb: Sequelize.INTEGER,
      features: Sequelize.JSON,
      salesman_commission_rate: Sequelize.DECIMAL(5, 2),
      distributor_commission_rate: Sequelize.DECIMAL(5, 2),
      renewal_commission_rate: Sequelize.DECIMAL(5, 2),
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      is_visible: { type: Sequelize.BOOLEAN, defaultValue: true },
      is_featured: { type: Sequelize.BOOLEAN, defaultValue: false },
      display_order: Sequelize.INTEGER,
      valid_from: Sequelize.DATE,
      valid_until: Sequelize.DATE,
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('referral_codes', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      owner_type: Sequelize.STRING,
      owner_id: { type: Sequelize.UUID, allowNull: false },
      discount_type: Sequelize.STRING,
      discount_value: Sequelize.DECIMAL(10, 2),
      free_trial_days: Sequelize.INTEGER,
      max_uses: Sequelize.INTEGER,
      current_uses: { type: Sequelize.INTEGER, defaultValue: 0 },
      valid_from: Sequelize.DATE,
      valid_until: Sequelize.DATE,
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('referral_rewards', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('(UUID())') },
      referrer_type: Sequelize.STRING,
      referrer_id: { type: Sequelize.UUID, allowNull: false },
      referee_tenant_id: Sequelize.UUID,
      referral_code_id: Sequelize.UUID,
      reward_type: Sequelize.STRING,
      reward_amount: Sequelize.DECIMAL(15, 2),
      reward_status: Sequelize.STRING,
      subscription_plan: Sequelize.STRING,
      reward_date: Sequelize.DATE,
      payment_date: Sequelize.DATE,
      notes: Sequelize.TEXT,
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('users', ['tenant_id']);
    await queryInterface.addIndex('referral_rewards', ['referrer_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('referral_rewards');
    await queryInterface.dropTable('referral_codes');
    await queryInterface.dropTable('subscription_plans');
    await queryInterface.dropTable('salesmen');
    await queryInterface.dropTable('distributors');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('tenants');
  },
};


