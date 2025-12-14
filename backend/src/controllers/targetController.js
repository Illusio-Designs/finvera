const { Target, Distributor, Salesman, User } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, target_type, target_period, distributor_id, salesman_id } = req.query;
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
            include: [{ model: User, attributes: ['full_name'] }]
          },
          { 
            model: Salesman, 
            attributes: ['id', 'salesman_code', 'full_name'],
            include: [{ model: User, attributes: ['email'] }]
          },
        ],
        order: [['createdAt', 'DESC']],
      });

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
            include: [{ model: User, attributes: ['full_name'] }]
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
      const targets = await Target.findAll({
        where: { distributor_id: id },
        order: [['createdAt', 'DESC']],
      });

      res.json({ data: targets });
    } catch (err) {
      next(err);
    }
  },

  async getSalesmanTargets(req, res, next) {
    try {
      const { id } = req.params;
      const targets = await Target.findAll({
        where: { salesman_id: id },
        order: [['createdAt', 'DESC']],
      });

      res.json({ data: targets });
    } catch (err) {
      next(err);
    }
  },
};
