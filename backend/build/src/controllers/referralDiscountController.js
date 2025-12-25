const { ReferralDiscountConfig } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

module.exports = {
  /**
   * Get current active discount configuration
   */
  async getCurrentConfig(req, res, next) {
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

      if (!currentConfig) {
        // Return default if no config exists
        return res.json({
          data: {
            discount_percentage: 10.00,
            effective_from: new Date(),
            effective_until: null,
            is_active: true,
          },
        });
      }

      res.json({ data: currentConfig });
    } catch (error) {
      logger.error('Get current referral discount config error:', error);
      next(error);
    }
  },

  /**
   * Get all discount configurations
   */
  async listConfigs(req, res, next) {
    try {
      const configs = await ReferralDiscountConfig.findAll({
        order: [['effective_from', 'DESC']],
      });

      res.json({ data: configs });
    } catch (error) {
      logger.error('List referral discount configs error:', error);
      next(error);
    }
  },

  /**
   * Create new discount configuration
   */
  async createConfig(req, res, next) {
    try {
      const { discount_percentage, effective_from, effective_until, notes } = req.body;

      // Deactivate all previous configs that overlap
      if (effective_from) {
        await ReferralDiscountConfig.update(
          { is_active: false },
          {
            where: {
              is_active: true,
              [Op.or]: [
                {
                  effective_from: { [Op.lte]: new Date(effective_until || '2099-12-31') },
                  effective_until: { [Op.gte]: new Date(effective_from) },
                },
                {
                  effective_until: null,
                  effective_from: { [Op.lte]: new Date(effective_until || '2099-12-31') },
                },
              ],
            },
          }
        );
      }

      const config = await ReferralDiscountConfig.create({
        discount_percentage: parseFloat(discount_percentage) || 10.00,
        effective_from: effective_from ? new Date(effective_from) : new Date(),
        effective_until: effective_until ? new Date(effective_until) : null,
        is_active: true,
        notes: notes || null,
      });

      // Update all existing referral codes with the new discount percentage
      const ReferralCode = require('../models').ReferralCode;
      await ReferralCode.update(
        { discount_value: parseFloat(discount_percentage) || 10.00 },
        {
          where: {
            is_active: true,
            owner_type: 'customer',
          },
        }
      );

      res.status(201).json({ data: config });
    } catch (error) {
      logger.error('Create referral discount config error:', error);
      next(error);
    }
  },

  /**
   * Update discount configuration
   */
  async updateConfig(req, res, next) {
    try {
      const { id } = req.params;
      const { discount_percentage, effective_from, effective_until, is_active, notes } = req.body;

      const config = await ReferralDiscountConfig.findByPk(id);
      if (!config) {
        return res.status(404).json({ message: 'Configuration not found' });
      }

      await config.update({
        discount_percentage: discount_percentage !== undefined ? parseFloat(discount_percentage) : config.discount_percentage,
        effective_from: effective_from ? new Date(effective_from) : config.effective_from,
        effective_until: effective_until !== undefined ? (effective_until ? new Date(effective_until) : null) : config.effective_until,
        is_active: is_active !== undefined ? is_active : config.is_active,
        notes: notes !== undefined ? notes : config.notes,
      });

      res.json({ data: config });
    } catch (error) {
      logger.error('Update referral discount config error:', error);
      next(error);
    }
  },

  /**
   * Delete discount configuration
   */
  async deleteConfig(req, res, next) {
    try {
      const { id } = req.params;

      const config = await ReferralDiscountConfig.findByPk(id);
      if (!config) {
        return res.status(404).json({ message: 'Configuration not found' });
      }

      await config.destroy();
      res.json({ message: 'Configuration deleted successfully' });
    } catch (error) {
      logger.error('Delete referral discount config error:', error);
      next(error);
    }
  },
};
