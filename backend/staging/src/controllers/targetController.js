const { Target, Distributor, Salesman, User, Commission } = require('../models');
const { TenantMaster } = require('../models/masterModels');
const { Op } = require('sequelize');

module.exports = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, target_type, target_period, distributor_id, salesman_id, recalculate } = req.query;
      const offset = (page - 1) * limit;
      const where = {};

      if (target_type) where.target_type = target_type;
      if (target_period) where.target_period = target_period;
      if (distributor_id) where.distributor_id = distributor_id;
      if (salesman_id) where.salesman_id = salesman_id;

      if (search) {
        where[Op.or] = [
          { target_type: { [Op.like]: `%${search}%` } },
          { target_period: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Target.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          { 
            model: Distributor, 
            attributes: ['id', 'distributor_code', 'company_name'],
            include: [{ model: User, attributes: ['name'] }]
          },
          { 
            model: Salesman, 
            attributes: ['id', 'salesman_code', 'full_name'],
            include: [{ model: User, attributes: ['email'] }]
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Optionally recalculate achieved values for all targets in the result
      if (recalculate === 'true') {
        for (const target of rows) {
          const achievedValue = await calculateAchievedValue(target);
          await target.update({ achieved_value: achievedValue });
          // Update the row data with new achieved value
          target.achieved_value = achievedValue;
        }
      }

      res.json({
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        data: rows,
      });
    } catch (err) {
      next(err);
    }
  },

  async get(req, res, next) {
    try {
      const { id } = req.params;
      const target = await Target.findByPk(id, {
        include: [
          { 
            model: Distributor, 
            attributes: ['id', 'distributor_code', 'company_name'],
            include: [{ model: User, attributes: ['name'] }]
          },
          { 
            model: Salesman, 
            attributes: ['id', 'salesman_code', 'full_name'],
            include: [{ model: User, attributes: ['email'] }]
          },
        ],
      });

      if (!target) {
        return res.status(404).json({ message: 'Target not found' });
      }

      res.json(target);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const {
        distributor_id,
        salesman_id,
        target_type,
        target_period,
        target_value,
        start_date,
        end_date,
      } = req.body;

      // Validate that either distributor_id or salesman_id is provided
      if (!distributor_id && !salesman_id) {
        return res.status(400).json({ message: 'Either distributor_id or salesman_id is required' });
      }

      if (distributor_id && salesman_id) {
        return res.status(400).json({ message: 'Cannot assign target to both distributor and salesman' });
      }

      const target = await Target.create({
        distributor_id,
        salesman_id,
        target_type,
        target_period,
        target_value: parseFloat(target_value),
        achieved_value: 0,
        start_date,
        end_date,
      });

      res.status(201).json(target);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const target = await Target.findByPk(id);

      if (!target) {
        return res.status(404).json({ message: 'Target not found' });
      }

      const {
        target_type,
        target_period,
        target_value,
        achieved_value,
        start_date,
        end_date,
      } = req.body;

      await target.update({
        target_type,
        target_period,
        target_value: target_value ? parseFloat(target_value) : target.target_value,
        achieved_value: achieved_value !== undefined ? parseFloat(achieved_value) : target.achieved_value,
        start_date,
        end_date,
      });

      res.json(target);
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const target = await Target.findByPk(id);

      if (!target) {
        return res.status(404).json({ message: 'Target not found' });
      }

      await target.destroy();
      res.json({ message: 'Target deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async getDistributorTargets(req, res, next) {
    try {
      const { id } = req.params;
      const { recalculate } = req.query;
      
      const targets = await Target.findAll({
        where: { distributor_id: id },
        order: [['createdAt', 'DESC']],
      });

      // Optionally recalculate achieved values
      if (recalculate === 'true') {
        for (const target of targets) {
          const achievedValue = await calculateAchievedValue(target);
          await target.update({ achieved_value: achievedValue });
        }
        // Reload targets with updated values
        const updatedTargets = await Target.findAll({
          where: { distributor_id: id },
          order: [['createdAt', 'DESC']],
        });
        return res.json({ data: updatedTargets });
      }

      res.json({ data: targets });
    } catch (err) {
      next(err);
    }
  },

  async getSalesmanTargets(req, res, next) {
    try {
      const { id } = req.params;
      const { recalculate } = req.query;
      
      const targets = await Target.findAll({
        where: { salesman_id: id },
        order: [['createdAt', 'DESC']],
      });

      // Optionally recalculate achieved values
      if (recalculate === 'true') {
        for (const target of targets) {
          const achievedValue = await calculateAchievedValue(target);
          await target.update({ achieved_value: achievedValue });
        }
        // Reload targets with updated values
        const updatedTargets = await Target.findAll({
          where: { salesman_id: id },
          order: [['createdAt', 'DESC']],
        });
        return res.json({ data: updatedTargets });
      }

      res.json({ data: targets });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Recalculate and update achieved value for a specific target
   */
  async recalculateAchieved(req, res, next) {
    try {
      const { id } = req.params;
      const target = await Target.findByPk(id);

      if (!target) {
        return res.status(404).json({ message: 'Target not found' });
      }

      const achievedValue = await calculateAchievedValue(target);
      await target.update({ achieved_value: achievedValue });

      res.json({
        message: 'Achieved value recalculated successfully',
        target: {
          ...target.toJSON(),
          achieved_value: achievedValue,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Recalculate achieved values for all active targets
   */
  async recalculateAll(req, res, next) {
    try {
      const { distributor_id, salesman_id } = req.query;
      
      const where = {};
      if (distributor_id) where.distributor_id = distributor_id;
      if (salesman_id) where.salesman_id = salesman_id;

      // Get all active targets (within date range or no end date)
      const now = new Date();
      const targets = await Target.findAll({
        where: {
          ...where,
          [Op.or]: [
            { end_date: { [Op.gte]: now } },
            { end_date: null },
          ],
        },
      });

      const results = [];
      for (const target of targets) {
        const achievedValue = await calculateAchievedValue(target);
        await target.update({ achieved_value: achievedValue });
        results.push({
          id: target.id,
          target_value: target.target_value,
          achieved_value: achievedValue,
          progress: target.target_value > 0 
            ? ((achievedValue / target.target_value) * 100).toFixed(2) + '%'
            : '0%',
        });
      }

      res.json({
        message: `Recalculated ${results.length} targets`,
        results,
      });
    } catch (err) {
      next(err);
    }
  },
};

/**
 * Calculate achieved value for a target based on target_type
 * - For "revenue" targets: Sum of commission amounts within target period
 * - For "subscription" targets: Count of tenants created within target period
 */
async function calculateAchievedValue(target) {
  try {
    const startDate = target.start_date ? new Date(target.start_date) : null;
    const endDate = target.end_date ? new Date(target.end_date) : null;
    
    let achievedValue = 0;

    if (target.target_type === 'revenue') {
      // Calculate based on commission amounts
      const where = {};
      
      if (target.distributor_id) {
        where.distributor_id = target.distributor_id;
      } else if (target.salesman_id) {
        where.salesman_id = target.salesman_id;
      }

      // Filter by date if target has date range
      if (startDate && endDate) {
        where[Op.or] = [
          { commission_date: { [Op.between]: [startDate, endDate] } },
          { createdAt: { [Op.between]: [startDate, endDate] } },
        ];
      }

      const commissions = await Commission.findAll({ where });
      achievedValue = commissions.reduce((sum, c) => {
        return sum + parseFloat(c.amount || 0);
      }, 0);

    } else if (target.target_type === 'subscription') {
      // Calculate based on tenant count
      const where = {};
      
      if (target.distributor_id) {
        where.distributor_id = target.distributor_id;
      } else if (target.salesman_id) {
        where.salesman_id = target.salesman_id;
      }

      // Filter by creation date if target has date range
      if (startDate && endDate) {
        where.createdAt = { [Op.between]: [startDate, endDate] };
      }

      achievedValue = await TenantMaster.count({ where });
    }

    return parseFloat(achievedValue.toFixed(2));
  } catch (error) {
    console.error('Error calculating achieved value:', error);
    return 0;
  }
}
