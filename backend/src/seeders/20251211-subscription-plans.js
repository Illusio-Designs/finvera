'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Check if subscription plans already exist
    const existingPlans = await queryInterface.sequelize.query(
      "SELECT id FROM subscription_plans WHERE plan_code IN ('FREE', 'STARTER')",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingPlans.length > 0) {
      return;
    }

    await queryInterface.bulkInsert('subscription_plans', [
      {
        plan_code: 'FREE',
        plan_name: 'Free',
        description: 'Free tier',
        billing_cycle: 'monthly',
        base_price: 0,
        currency: 'INR',
        trial_days: 0,
        max_users: 1,
        max_invoices_per_month: 50,
        features: JSON.stringify({ gst_filing: false, e_invoicing: false }),
        is_active: true,
        is_visible: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        plan_code: 'STARTER',
        plan_name: 'Starter',
        description: 'Starter plan',
        billing_cycle: 'monthly',
        base_price: 999,
        currency: 'INR',
        trial_days: 30,
        max_users: 3,
        max_invoices_per_month: 200,
        features: JSON.stringify({ gst_filing: true, e_invoicing: false }),
        salesman_commission_rate: 15,
        distributor_commission_rate: 5,
        is_active: true,
        is_visible: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    console.log('✓ Subscription plans: FREE, STARTER');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('subscription_plans', null, {});
  },
};


