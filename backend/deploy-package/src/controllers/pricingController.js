const { SubscriptionPlan } = require('../models');
const { Op, Sequelize } = require('sequelize');

module.exports = {
  async listPlans(req, res, next) {
    try {
      const { page = 1, limit = 20, search, is_active, is_visible } = req.query;
      const offset = (page - 1) * limit;
      const now = new Date();

      // Build where conditions
      const conditions = [];

      // Search conditions
      if (search) {
        conditions.push({
          [Op.or]: [
            { plan_name: { [Op.like]: `%${search}%` } },
            { plan_code: { [Op.like]: `%${search}%` } },
          ]
        });
      }

      // For public access, default to showing only active and visible plans
      // But allow override via query params
      if (is_active !== undefined) {
        conditions.push({ is_active: is_active === 'true' });
      } else {
        // Default to active plans for public access
        conditions.push({ is_active: true });
      }

      if (is_visible !== undefined) {
        conditions.push({ is_visible: is_visible === 'true' });
      } else {
        // Default to visible plans for public access
        conditions.push({ is_visible: true });
      }

      // Filter by validity dates - plans must be within valid date range
      conditions.push({
        [Op.or]: [
          { valid_from: null },
          { valid_from: { [Op.lte]: now } }
        ]
      });
      conditions.push({
        [Op.or]: [
          { valid_until: null },
          { valid_until: { [Op.gte]: now } }
        ]
      });

      const where = conditions.length > 0 ? { [Op.and]: conditions } : {};

      const { count, rows } = await SubscriptionPlan.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        // Order by: display_order (asc with nulls last), then is_featured (desc), then base_price (asc), then createdAt (desc)
        // For MySQL, we use a CASE statement to handle nulls in display_order
        order: [
          [Sequelize.literal('CASE WHEN display_order IS NULL THEN 1 ELSE 0 END'), 'ASC'],
          ['display_order', 'ASC'],
          ['is_featured', 'DESC'],
          ['base_price', 'ASC'],
          ['createdAt', 'DESC']
        ],
      });

      return res.json({
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        data: rows,
      });
    } catch (err) {
      return next(err);
    }
  },

  async getPlan(req, res, next) {
    try {
      const plan = await SubscriptionPlan.findByPk(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      
      // Check if plan is active and visible (for public access)
      // Admin can still access via direct ID, but we check validity dates
      const now = new Date();
      if (plan.valid_from && new Date(plan.valid_from) > now) {
        return res.status(404).json({ message: 'Plan not available yet' });
      }
      if (plan.valid_until && new Date(plan.valid_until) < now) {
        return res.status(404).json({ message: 'Plan has expired' });
      }
      
      return res.json(plan);
    } catch (err) {
      return next(err);
    }
  },

  async createPlan(req, res, next) {
    try {
      const plan = await SubscriptionPlan.create(req.body);
      return res.status(201).json(plan);
    } catch (err) {
      return next(err);
    }
  },

  async updatePlan(req, res, next) {
    try {
      const plan = await SubscriptionPlan.findByPk(req.params.id);
      if (!plan) return res.status(404).json({ message: 'Plan not found' });
      await plan.update(req.body);
      return res.json(plan);
    } catch (err) {
      return next(err);
    }
  },

  async deletePlan(req, res, next) {
    try {
      const plan = await SubscriptionPlan.findByPk(req.params.id);
      if (!plan) return res.status(404).json({ message: 'Plan not found' });
      
      // Soft delete by setting is_active to false
      await plan.update({ is_active: false, is_visible: false });
      return res.json({ message: 'Plan deactivated successfully' });
    } catch (err) {
      return next(err);
    }
  },
};


