const { ReferralCode, ReferralDiscountConfig } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Get the current active discount percentage from config
 */
async function getCurrentDiscountPercentage() {
  try {
    const currentConfig = await ReferralDiscountConfig.findOne({
      where: {
        is_active: true,
        effective_from: { [Op.lte]: new Date() },
        [Op.or]: [
          { effective_until: null },
          { effective_until: { [Op.gte]: new Date() } },
        ],
      },
      order: [['effective_from', 'DESC']],
    });

    return currentConfig ? parseFloat(currentConfig.discount_percentage) : 10.00;
  } catch (error) {
    logger.warn('Failed to get current discount percentage, using default 10%:', error.message);
    return 10.00;
  }
}

/**
 * Apply referral discount to subscription price
 * @param {string} referralCode - The referral code used
 * @param {number} basePrice - The base price of the subscription plan
 * @returns {Promise<{discountedPrice: number, discountAmount: number, discountPercentage: number, code: Object}>}
 */
async function applyReferralDiscount(referralCode, basePrice) {
  try {
    if (!referralCode || !basePrice) {
      return {
        discountedPrice: basePrice,
        discountAmount: 0,
        discountPercentage: 0,
        code: null,
      };
    }

    // Find the referral code
    const code = await ReferralCode.findOne({
      where: {
        code: referralCode,
        is_active: true,
        [Op.or]: [
          { valid_until: null },
          { valid_until: { [Op.gte]: new Date() } },
        ],
      },
    });

    if (!code) {
      logger.warn(`Referral code ${referralCode} not found or inactive`);
      return {
        discountedPrice: basePrice,
        discountAmount: 0,
        discountPercentage: 0,
        code: null,
      };
    }

    // Get discount percentage from code or current config (default to 10%)
    let discountPercentage = parseFloat(code.discount_value || 0);
    
    // If code doesn't have discount value, get from current config
    if (!discountPercentage || discountPercentage === 0) {
      discountPercentage = await getCurrentDiscountPercentage();
    }

    // Ensure discount is always 10% (as per requirement)
    // Override any other value to maintain consistency
    discountPercentage = 10.00;

    // Calculate discount for the user (10% off)
    const discountAmount = (basePrice * discountPercentage) / 100;
    const discountedPrice = basePrice - discountAmount;

    // Increment usage count
    await code.increment('current_uses');

    logger.info(`Applied ${discountPercentage}% referral discount (${discountAmount}) to price ${basePrice}`);

    // Note: Reward creation is handled in the controller after tenant creation
    // because we need the tenant.id which is only available after tenant is created
    // Return the code object so controller can use it for reward creation
    return {
      discountedPrice: parseFloat(discountedPrice.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      discountPercentage: parseFloat(discountPercentage.toFixed(2)),
      code: code, // Return code object for reward creation
    };
  } catch (error) {
    logger.error('Error applying referral discount:', error);
    // Return original price if discount application fails
    return {
      discountedPrice: basePrice,
      discountAmount: 0,
      discountPercentage: 0,
      code: null,
    };
  }
}

/**
 * Create referral reward for code owner when subscription is purchased
 * @param {string} tenantId - The tenant ID that purchased the subscription
 * @param {string} subscriptionPlan - The subscription plan code
 * @param {number} basePrice - The base price of the subscription plan
 * @returns {Promise<boolean>} - Returns true if reward was created
 */
async function createReferralReward(tenantId, subscriptionPlan, basePrice) {
  try {
    if (!tenantId || !subscriptionPlan || !basePrice) {
      return false;
    }

    const masterModels = require('../models/masterModels');
    const ReferralCode = require('../models').ReferralCode;
    const ReferralReward = require('../models').ReferralReward;

    // Get tenant to check for referral code
    const tenant = await masterModels.TenantMaster.findByPk(tenantId);
    if (!tenant || !tenant.referral_code) {
      return false; // No referral code used
    }

    // Find the referral code that was used
    const usedCode = await ReferralCode.findOne({
      where: {
        code: tenant.referral_code,
        is_active: true,
      },
    });

    if (!usedCode || !usedCode.owner_type || !usedCode.owner_id) {
      logger.warn(`Referral code ${tenant.referral_code} not found or invalid for reward creation`);
      return false;
    }

    // Check if reward already exists for this tenant and subscription (avoid duplicates)
    const existingReward = await ReferralReward.findOne({
      where: {
        referee_tenant_id: tenantId,
        subscription_plan: subscriptionPlan,
        reward_status: { [Op.ne]: 'cancelled' }, // Exclude cancelled rewards
      },
    });

    if (existingReward) {
      logger.info(`Referral reward already exists for tenant ${tenantId} and plan ${subscriptionPlan}`);
      return false; // Reward already created
    }

    // Calculate reward (10% of base price)
    const rewardPercentage = 10.00;
    const rewardAmount = (basePrice * rewardPercentage) / 100;

    // Create reward record
    await ReferralReward.create({
      referrer_type: usedCode.owner_type, // 'customer' for tenant owners
      referrer_id: usedCode.owner_id, // The tenant ID who owns the code
      referee_tenant_id: tenantId, // The tenant who used the code
      referral_code_id: usedCode.id,
      reward_type: 'percentage',
      reward_amount: parseFloat(rewardAmount.toFixed(2)),
      reward_status: 'pending', // Will be approved/paid later by admin
      subscription_plan: subscriptionPlan,
      reward_date: new Date(),
      notes: `Reward for referral code ${tenant.referral_code} usage. Subscription purchase.`,
    });

    logger.info(`Created referral reward for code owner: ${rewardAmount} (10% of ${basePrice})`);
    return true;
  } catch (error) {
    logger.error('Error creating referral reward:', error);
    return false;
  }
}

module.exports = {
  getCurrentDiscountPercentage,
  applyReferralDiscount,
  createReferralReward,
};
