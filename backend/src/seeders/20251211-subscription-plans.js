'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('subscription_plans', [
      {
        id: '00000000-0000-0000-0000-000000000001',
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
        id: '00000000-0000-0000-0000-000000000002',
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
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('subscription_plans', null, {});
  },
};


