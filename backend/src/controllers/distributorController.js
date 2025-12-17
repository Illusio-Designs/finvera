const { Distributor, User, Salesman, Commission, Payout, Lead, Target, sequelize } = require('../models');
const { TenantMaster } = require('../models/masterModels');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const {
  normalizeOptionalCode,
  generateNextSequentialCode,
  isUniqueConstraintOnField,
} = require('../utils/codeGenerator');

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
          { model: User, attributes: ['id', 'email', 'name'] },
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
        distributor_code: distributorCodeInput,
        company_name,
        territory,
        commission_rate,
        payment_terms,
      } = req.body;

      const distributor_code = normalizeOptionalCode(distributorCodeInput);

      const tx = await sequelize.transaction();
      try {
        // Create user first
        const password_hash = await bcrypt.hash(password, 10);
        const user = await User.create(
          {
            email,
            password: password_hash,
            name: full_name,
            role: 'distributor',
            tenant_id: req.tenant_id || null, // Distributors might not have a tenant_id
          },
          { transaction: tx }
        );

        // Create distributor (auto-generate code if not provided)
        let distributor = null;
        const maxAttempts = 5;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const codeToUse =
            distributor_code ||
            (await generateNextSequentialCode({
              model: Distributor,
              field: 'distributor_code',
              prefix: 'DIST',
              padLength: 3,
              transaction: tx,
            }));

          try {
            distributor = await Distributor.create(
              {
                user_id: user.id,
                distributor_code: codeToUse,
                company_name,
                territory: territory || [],
                commission_rate: parseFloat(commission_rate) || 0,
                payment_terms,
              },
              { transaction: tx }
            );
            break;
          } catch (err) {
            // If auto-generated code collided (concurrency), retry with a new code.
            if (!distributor_code && isUniqueConstraintOnField(err, 'distributor_code')) {
              continue;
            }
            throw err;
          }
        }

        if (!distributor) {
          throw new Error('Failed to generate a unique distributor_code');
        }

        await tx.commit();
        res.status(201).json({ distributor });
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
      const distributor = await Distributor.findByPk(id, {
        include: [
          { model: User, attributes: ['id', 'email', 'name'] },
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
      const tenants = await TenantMaster.count({ where: { distributor_id: id, is_active: true } });

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

  async dashboard(req, res, next) {
    try {
      const userId = req.user_id;
      const distributor = await Distributor.findOne({ where: { user_id: userId } });

      if (!distributor) {
        return res.status(404).json({ message: 'Distributor not found' });
      }

      const distributorId = distributor.id;
      const now = new Date();

      // Get active targets
      const targets = await Target.findAll({
        where: {
          distributor_id: distributorId,
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
        where: { distributor_id: distributorId },
      });

      const pendingCommissions = await Commission.sum('amount', {
        where: { distributor_id: distributorId, status: 'pending' },
      });

      const approvedCommissions = await Commission.sum('amount', {
        where: { distributor_id: distributorId, status: 'approved' },
      });

      // Get commission list
      const commissions = await Commission.findAll({
        where: { distributor_id: distributorId },
        order: [['createdAt', 'DESC']],
        limit: 10,
      });

      // Get tenants count
      const totalTenants = await TenantMaster.count({
        where: { distributor_id: distributorId },
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

