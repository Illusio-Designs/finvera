const { Salesman, Distributor, Lead, LeadActivity, Commission, Target, User, sequelize } = require('../models');
const { TenantMaster } = require('../models/masterModels');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const {
  normalizeOptionalCode,
  generateNextSequentialCode,
  isUniqueConstraintOnField,
} = require('../utils/codeGenerator');

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
        total: salesmen.count,
        page: parseInt(page),
        limit: parseInt(limit),
        data: salesmen.rows,
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
        salesman_code: salesmanCodeInput,
        full_name,
        distributor_id,
        territory,
        commission_rate,
        target_monthly,
        target_quarterly,
        target_annual,
      } = req.body;

      const salesman_code = normalizeOptionalCode(salesmanCodeInput);

      const tx = await sequelize.transaction();
      try {
        const bcrypt = require('bcryptjs');
        const password_hash = await bcrypt.hash(password, 10);
        const user = await User.create(
          {
            email,
            password: password_hash,
            role: 'salesman',
            name: full_name,
            tenant_id: req.tenant_id || null,
          },
          { transaction: tx }
        );

        let salesman = null;
        const maxAttempts = 5;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const codeToUse =
            salesman_code ||
            (await generateNextSequentialCode({
              model: Salesman,
              field: 'salesman_code',
              prefix: 'SALE',
              padLength: 3,
              transaction: tx,
            }));

          try {
            salesman = await Salesman.create(
              {
                user_id: user.id,
                distributor_id,
                salesman_code: codeToUse,
                full_name,
                territory: territory || [],
                commission_rate: parseFloat(commission_rate) || 0,
                target_monthly: parseFloat(target_monthly) || 0,
                target_quarterly: parseFloat(target_quarterly) || 0,
                target_annual: parseFloat(target_annual) || 0,
              },
              { transaction: tx }
            );
            break;
          } catch (err) {
            if (!salesman_code && isUniqueConstraintOnField(err, 'salesman_code')) {
              continue;
            }
            throw err;
          }
        }

        if (!salesman) {
          throw new Error('Failed to generate a unique salesman_code');
        }

        await tx.commit();
        res.status(201).json(salesman);
      } catch (err) {
        await tx.rollback();
        throw err;
      }
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const salesman = await Salesman.findByPk(id, {
        include: [
          { model: User, attributes: ['id', 'email', 'name'] },
          { model: Distributor, attributes: ['id', 'distributor_code', 'company_name'] },
        ],
      });

      if (!salesman) {
        return res.status(404).json({ message: 'Salesman not found' });
      }

      res.json(salesman);
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

      // Codes are immutable after creation
      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'salesman_code')) {
        return res.status(400).json({ message: 'salesman_code cannot be changed' });
      }

      await salesman.update(req.body);
      res.json(salesman);
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
      const customers = await TenantMaster.count({ where: { salesman_id: id, is_active: true } });
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

  async dashboard(req, res, next) {
    try {
      const userId = req.user_id;
      const salesman = await Salesman.findOne({ where: { user_id: userId } });

      if (!salesman) {
        return res.status(404).json({ message: 'Salesman not found' });
      }

      const salesmanId = salesman.id;
      const now = new Date();

      // Get active targets
      const targets = await Target.findAll({
        where: {
          salesman_id: salesmanId,
          [Op.or]: [
            { end_date: { [Op.gte]: now } },
            { end_date: null },
          ],
        },
        order: [['createdAt', 'DESC']],
      });

      // Calculate total target, achieved, and left
      let totalTarget = 0;
      let totalAchieved = 0;
      targets.forEach(target => {
        totalTarget += parseFloat(target.target_value || 0);
        totalAchieved += parseFloat(target.achieved_value || 0);
      });
      const totalLeft = totalTarget - totalAchieved;

      // Get commissions
      const totalCommissions = await Commission.sum('amount', {
        where: { salesman_id: salesmanId },
      });

      const pendingCommissions = await Commission.sum('amount', {
        where: { salesman_id: salesmanId, status: 'pending' },
      });

      const approvedCommissions = await Commission.sum('amount', {
        where: { salesman_id: salesmanId, status: 'approved' },
      });

      // Get commission list
      const commissions = await Commission.findAll({
        where: { salesman_id: salesmanId },
        order: [['createdAt', 'DESC']],
        limit: 10,
      });

      // Get tenants count
      const totalTenants = await TenantMaster.count({
        where: { salesman_id: salesmanId },
      });

      res.json({
        data: {
          targets: {
            total: parseFloat(totalTarget.toFixed(2)),
            achieved: parseFloat(totalAchieved.toFixed(2)),
            left: parseFloat(totalLeft.toFixed(2)),
            percentage: totalTarget > 0 ? parseFloat(((totalAchieved / totalTarget) * 100).toFixed(2)) : 0,
            list: targets,
          },
          commissions: {
            total: parseFloat(totalCommissions || 0),
            pending: parseFloat(pendingCommissions || 0),
            approved: parseFloat(approvedCommissions || 0),
            list: commissions,
          },
          tenants: {
            total: totalTenants,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

