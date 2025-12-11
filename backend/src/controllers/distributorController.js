const { Distributor, User, Salesman, Commission, Payout, Lead, Target, Tenant } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, status } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.is_active = status === 'active';
      if (search) {
        where[Op.or] = [
          { company_name: { [Op.like]: `%${search}%` } },
          { distributor_code: { [Op.like]: `%${search}%` } },
        ];
      }

      const distributors = await Distributor.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          { model: User, attributes: ['id', 'email', 'full_name'] },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json({
        total: distributors.count,
        page: parseInt(page),
        limit: parseInt(limit),
        data: distributors.rows,
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
        full_name,
        distributor_code,
        company_name,
        territory,
        commission_rate,
        payment_terms,
      } = req.body;

      // Create user first
      const password_hash = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        password_hash,
        full_name,
        role: 'distributor',
        tenant_id: req.tenant_id || null, // Distributors might not have a tenant_id
      });

      // Create distributor
      const distributor = await Distributor.create({
        user_id: user.id,
        distributor_code,
        company_name,
        territory: territory || [],
        commission_rate: parseFloat(commission_rate) || 0,
        payment_terms,
      });

      res.status(201).json({ distributor });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const distributor = await Distributor.findByPk(id, {
        include: [
          { model: User, attributes: ['id', 'email', 'full_name'] },
          { model: Salesman, attributes: ['id', 'salesman_code', 'full_name', 'is_active'] },
        ],
      });

      if (!distributor) {
        return res.status(404).json({ message: 'Distributor not found' });
      }

      res.json(distributor);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const distributor = await Distributor.findByPk(id);

      if (!distributor) {
        return res.status(404).json({ message: 'Distributor not found' });
      }

      await distributor.update(req.body);
      res.json(distributor);
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const distributor = await Distributor.findByPk(id);

      if (!distributor) {
        return res.status(404).json({ message: 'Distributor not found' });
      }

      await distributor.update({ is_active: false });
      res.json({ message: 'Distributor deactivated' });
    } catch (err) {
      next(err);
    }
  },

  async getPerformance(req, res, next) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const where = { distributor_id: id };
      if (startDate && endDate) {
        where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
      }

      const commissions = await Commission.findAll({ where });
      const totalCommission = commissions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

      const salesmen = await Salesman.count({ where: { distributor_id: id, is_active: true } });
      const tenants = await Tenant.count({ where: { distributor_id: id, is_active: true } });

      res.json({
        performance: {
          totalCommission,
          salesmen,
          tenants,
          commissions: commissions.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

