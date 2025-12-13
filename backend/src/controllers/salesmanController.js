const { Salesman, Distributor, Lead, LeadActivity, Commission, Target, Tenant, User } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, distributor_id, status } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (distributor_id) where.distributor_id = distributor_id;
      if (status) where.is_active = status === 'active';
      if (search) {
        where[Op.or] = [
          { full_name: { [Op.like]: `%${search}%` } },
          { salesman_code: { [Op.like]: `%${search}%` } },
        ];
      }

      const salesmen = await Salesman.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          { model: User, attributes: ['id', 'email'] },
          { model: Distributor, attributes: ['id', 'distributor_code', 'company_name'] },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json({
        salesmen: salesmen.rows,
        pagination: {
          total: salesmen.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(salesmen.count / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const {
        email,
        password,
        salesman_code,
        full_name,
        distributor_id,
        territory,
        commission_rate,
        target_monthly,
        target_quarterly,
        target_annual,
      } = req.body;

      const bcrypt = require('bcryptjs');
      const password_hash = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        password_hash,
        role: 'salesman',
        full_name,
        tenant_id: req.tenant_id || null,
      });

      const salesman = await Salesman.create({
        user_id: user.id,
        distributor_id,
        salesman_code,
        full_name,
        territory: territory || [],
        commission_rate: parseFloat(commission_rate) || 0,
        target_monthly: parseFloat(target_monthly) || 0,
        target_quarterly: parseFloat(target_quarterly) || 0,
        target_annual: parseFloat(target_annual) || 0,
      });

      res.status(201).json({ salesman });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const salesman = await Salesman.findByPk(id, {
        include: [
          { model: User, attributes: ['id', 'email'] },
          { model: Distributor, attributes: ['id', 'distributor_code', 'company_name'] },
        ],
      });

      if (!salesman) {
        return res.status(404).json({ message: 'Salesman not found' });
      }

      res.json({ salesman });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const salesman = await Salesman.findByPk(id);

      if (!salesman) {
        return res.status(404).json({ message: 'Salesman not found' });
      }

      await salesman.update(req.body);
      res.json({ salesman });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const salesman = await Salesman.findByPk(id);

      if (!salesman) {
        return res.status(404).json({ message: 'Salesman not found' });
      }

      await salesman.update({ is_active: false });
      res.json({ message: 'Salesman deactivated' });
    } catch (err) {
      next(err);
    }
  },

  async getPerformance(req, res, next) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const where = { recipient_type: 'salesman', recipient_id: id };
      if (startDate && endDate) {
        where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate)] };
      }

      const commissions = await Commission.findAll({ where });
      const totalCommission = commissions.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0);

      const leads = await Lead.count({ where: { salesman_id: id } });
      const customers = await Tenant.count({ where: { salesman_id: id, is_active: true } });
      const conversionRate = leads > 0 ? (customers / leads) * 100 : 0;

      // Get targets vs achievement
      const currentMonth = new Date().toISOString().slice(0, 7);
      const target = await Target.findOne({
        where: { target_type: 'salesman', target_owner_id: id, period: currentMonth },
      });

      res.json({
        performance: {
          totalCommission,
          leads,
          customers,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          target: target ? {
            revenue: parseFloat(target.revenue_target),
            achieved: parseFloat(target.achieved_revenue),
            percentage: target.revenue_target > 0
              ? (target.achieved_revenue / target.revenue_target) * 100
              : 0,
          } : null,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getLeads(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.query;

      const where = { salesman_id: id };
      if (status) where.status = status;

      const leads = await Lead.findAll({
        where,
        include: [{ model: LeadActivity, limit: 5, order: [['activity_date', 'DESC']] }],
        order: [['created_at', 'DESC']],
      });

      res.json({ leads });
    } catch (err) {
      next(err);
    }
  },
};

