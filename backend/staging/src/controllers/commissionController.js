const { Commission, Distributor, Salesman, Payout, SubscriptionPlan } = require('../models');
const { TenantMaster } = require('../models/masterModels');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const commissionService = require('../services/commissionService');

module.exports = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, distributor_id, salesman_id, status, commission_type } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (distributor_id) where.distributor_id = distributor_id;
      if (salesman_id) where.salesman_id = salesman_id;
      if (status) where.status = status;
      if (commission_type) where.commission_type = commission_type;

      const commissions = await Commission.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          { model: Distributor, attributes: ['id', 'distributor_code', 'company_name'] },
          { model: Salesman, attributes: ['id', 'salesman_code', 'full_name'] },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json({
        total: commissions.count,
        page: parseInt(page),
        limit: parseInt(limit),
        data: commissions.rows,
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const commission = await Commission.findByPk(id, {
        include: [
          { model: Distributor, attributes: ['id', 'distributor_code', 'company_name'] },
          { model: Salesman, attributes: ['id', 'salesman_code', 'full_name'] },
          { model: Payout, attributes: ['id', 'status', 'paid_date'] },
        ],
      });

      if (!commission) {
        return res.status(404).json({ message: 'Commission not found' });
      }

      res.json(commission);
    } catch (err) {
      next(err);
    }
  },

  async calculate(req, res, next) {
    try {
      const { tenant_id, subscription_plan, commission_type } = req.body;

      const commissions = await commissionService.calculateAndCreateCommissions(
        tenant_id,
        subscription_plan,
        commission_type || 'subscription'
      );

      // Get plan to return total value
      const plan = await SubscriptionPlan.findOne({
        where: { plan_code: subscription_plan, is_active: true },
      });
      const totalValue = plan ? parseFloat(plan.discounted_price || plan.base_price || 0) : 0;

      res.status(201).json({
        message: 'Commissions calculated and created',
        commissions,
        total_value: totalValue,
      });
    } catch (err) {
      logger.error('Commission calculation error:', err);
      if (err.message === 'Tenant not found') {
        return res.status(404).json({ message: err.message });
      }
      if (err.message === 'Subscription plan is required' || err.message === 'Subscription plan not found') {
        return res.status(400).json({ message: err.message });
      }
      next(err);
    }
  },

  async approve(req, res, next) {
    try {
      const { id } = req.params;
      const commission = await Commission.findByPk(id);

      if (!commission) {
        return res.status(404).json({ message: 'Commission not found' });
      }

      await commission.update({ status: 'approved' });
      res.json(commission);
    } catch (err) {
      next(err);
    }
  },

  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const commission = await Commission.findByPk(id);

      if (!commission) {
        return res.status(404).json({ message: 'Commission not found' });
      }

      await commission.update({ status: 'cancelled' });
      res.json(commission);
    } catch (err) {
      next(err);
    }
  },
};

