const { SubscriptionPlan } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  async listPlans(req, res, next) {
    try {
      const { page = 1, limit = 20, search, is_active, is_visible } = req.query;
      const offset = (page - 1) * limit;
      const where = {};

      if (search) {
        where[Op.or] = [
          { plan_name: { [Op.like]: `%${search}%` } },
          { plan_code: { [Op.like]: `%${search}%` } },
        ];
      }

      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }

      if (is_visible !== undefined) {
        where.is_visible = is_visible === 'true';
      }

      const { count, rows } = await SubscriptionPlan.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
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
      if (!plan) return res.status(404).json({ message: 'Plan not found' });
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


