const { SubscriptionPlan } = require('../models');

module.exports = {
  async listPlans(req, res, next) {
    try {
      const plans = await SubscriptionPlan.findAll({ where: { is_visible: true, is_active: true } });
      return res.json(plans);
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
};


