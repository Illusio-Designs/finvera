const { Commission, Distributor, Salesman, Tenant, Payout } = require('../models');
const { Op } = require('sequelize');

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
          { model: Tenant, attributes: ['id', 'company_name'] },
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
          { model: Tenant, attributes: ['id', 'company_name'] },
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

      // This is a simplified calculation - you would implement actual commission logic here
      const tenant = await Tenant.findByPk(tenant_id);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Get commission rates from subscription plan or default
      const commissionRate = 5; // Default 5%
      const amount = 1000; // This would be calculated based on subscription plan price

      const commission = await Commission.create({
        tenant_id,
        distributor_id: tenant.distributor_id,
        salesman_id: tenant.salesman_id,
        commission_type: commission_type || 'subscription',
        subscription_plan,
        amount,
        commission_rate: commissionRate,
        status: 'pending',
      });

      res.status(201).json(commission);
    } catch (err) {
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

