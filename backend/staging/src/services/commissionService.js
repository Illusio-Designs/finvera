const { Commission, SubscriptionPlan } = require('../models');
const { TenantMaster } = require('../models/masterModels');
const logger = require('../utils/logger');

/**
 * Calculate and create commissions for a tenant subscription
 * @param {string} tenantId - Tenant ID
 * @param {string} subscriptionPlan - Subscription plan code
 * @param {string} commissionType - Type of commission (subscription, renewal)
 * @returns {Promise<Array>} - Array of created commissions
 */
async function calculateAndCreateCommissions(tenantId, subscriptionPlan, commissionType = 'subscription') {
  try {
    const tenant = await TenantMaster.findByPk(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (!subscriptionPlan) {
      throw new Error('Subscription plan is required');
    }

    // Get subscription plan details
    const plan = await SubscriptionPlan.findOne({
      where: { plan_code: subscriptionPlan, is_active: true },
    });

    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    // Calculate total value (use discounted_price if available, otherwise base_price)
    const totalValue = parseFloat(plan.discounted_price || plan.base_price || 0);

    // Get commission rates from subscription plan
    let distributorCommissionRate = parseFloat(plan.distributor_commission_rate || 0);
    let salesmanCommissionRate = parseFloat(plan.salesman_commission_rate || 0);

    // If renewal, use renewal_commission_rate if available
    if (commissionType === 'renewal' && plan.renewal_commission_rate) {
      distributorCommissionRate = parseFloat(plan.renewal_commission_rate || distributorCommissionRate);
      salesmanCommissionRate = parseFloat(plan.renewal_commission_rate || salesmanCommissionRate);
    }

    const commissions = [];

    // Create commission for distributor if exists
    if (tenant.distributor_id && distributorCommissionRate > 0) {
      const distributorAmount = (totalValue * distributorCommissionRate) / 100;
      
      const distributorCommission = await Commission.create({
        tenant_id: tenant.id,
        distributor_id: tenant.distributor_id,
        commission_type: commissionType,
        subscription_plan: subscriptionPlan,
        amount: parseFloat(distributorAmount.toFixed(2)),
        commission_rate: distributorCommissionRate,
        status: 'pending',
        commission_date: new Date(),
      });

      commissions.push(distributorCommission);
    }

    // Create commission for salesman if exists
    if (tenant.salesman_id && salesmanCommissionRate > 0) {
      const salesmanAmount = (totalValue * salesmanCommissionRate) / 100;
      
      const salesmanCommission = await Commission.create({
        tenant_id: tenant.id,
        salesman_id: tenant.salesman_id,
        commission_type: commissionType,
        subscription_plan: subscriptionPlan,
        amount: parseFloat(salesmanAmount.toFixed(2)),
        commission_rate: salesmanCommissionRate,
        status: 'pending',
        commission_date: new Date(),
      });

      commissions.push(salesmanCommission);
    }

    // Automatically update target achievement when commission is created
    if (tenant.distributor_id || tenant.salesman_id) {
      const adminController = require('../controllers/adminController');
      if (adminController.updateTargetAchievement) {
        await adminController.updateTargetAchievement(tenant.distributor_id, tenant.salesman_id, tenant);
      }
    }

    return commissions;
  } catch (error) {
    logger.error('Commission calculation error:', error);
    throw error;
  }
}

module.exports = {
  calculateAndCreateCommissions,
};
