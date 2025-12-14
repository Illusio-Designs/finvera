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
 * @returns {Promise<{discountedPrice: number, discountAmount: number, discountPercentage: number}>}
 */
async function applyReferralDiscount(referralCode, basePrice) {
  try {
    if (!referralCode || !basePrice) {
      return {
        discountedPrice: basePrice,
        discountAmount: 0,
        discountPercentage: 0,
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
      };
    }

    // Get discount percentage from code or current config
    let discountPercentage = parseFloat(code.discount_value || 0);
    
    // If code doesn't have discount value, get from current config
    if (!discountPercentage || discountPercentage === 0) {
      discountPercentage = await getCurrentDiscountPercentage();
    }

    // Calculate discount
    const discountAmount = (basePrice * discountPercentage) / 100;
    const discountedPrice = basePrice - discountAmount;

    // Increment usage count
    await code.increment('current_uses');

    logger.info(`Applied ${discountPercentage}% referral discount (${discountAmount}) to price ${basePrice}`);

    return {
      discountedPrice: parseFloat(discountedPrice.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      discountPercentage: parseFloat(discountPercentage.toFixed(2)),
    };
  } catch (error) {
    logger.error('Error applying referral discount:', error);
    // Return original price if discount application fails
    return {
      discountedPrice: basePrice,
      discountAmount: 0,
      discountPercentage: 0,
    };
  }
}

module.exports = {
  getCurrentDiscountPercentage,
  applyReferralDiscount,
};
