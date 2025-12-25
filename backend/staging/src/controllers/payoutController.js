const { Payout, Distributor, Salesman, Commission } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, distributor_id, salesman_id, status, payout_type } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (distributor_id) where.distributor_id = distributor_id;
      if (salesman_id) where.salesman_id = salesman_id;
      if (status) where.status = status;
      if (payout_type) where.payout_type = payout_type;

      const payouts = await Payout.findAndCountAll({
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
        total: payouts.count,
        page: parseInt(page),
        limit: parseInt(limit),
        data: payouts.rows,
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const payout = await Payout.findByPk(id, {
        include: [
          { model: Distributor, attributes: ['id', 'distributor_code', 'company_name'] },
          { model: Salesman, attributes: ['id', 'salesman_code', 'full_name'] },
        ],
      });

      if (!payout) {
        return res.status(404).json({ message: 'Payout not found' });
      }

      res.json(payout);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const {
        distributor_id,
        salesman_id,
        payout_type,
        total_amount,
        payment_method,
        payment_reference,
        notes,
      } = req.body;

      // Validate that either distributor_id or salesman_id is provided
      if (!distributor_id && !salesman_id) {
        return res.status(400).json({ message: 'Either distributor_id or salesman_id is required' });
      }

      const payout = await Payout.create({
        distributor_id,
        salesman_id,
        payout_type,
        total_amount: parseFloat(total_amount),
        payment_method,
        payment_reference,
        notes,
        status: 'pending',
      });

      res.status(201).json(payout);
    } catch (err) {
      next(err);
    }
  },

  async process(req, res, next) {
    try {
      const { id } = req.params;
      const { payment_method, payment_reference, paid_date } = req.body;

      const payout = await Payout.findByPk(id);
      if (!payout) {
        return res.status(404).json({ message: 'Payout not found' });
      }

      await payout.update({
        status: 'processing',
        payment_method,
        payment_reference,
        paid_date: paid_date || new Date(),
      });

      // Update related commissions to 'paid' status
      await Commission.update(
        { status: 'paid', payout_id: id },
        {
          where: {
            [Op.or]: [
              { distributor_id: payout.distributor_id },
              { salesman_id: payout.salesman_id },
            ],
            status: 'approved',
          },
        }
      );

      res.json(payout);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const payout = await Payout.findByPk(id);

      if (!payout) {
        return res.status(404).json({ message: 'Payout not found' });
      }

      await payout.update(req.body);
      res.json(payout);
    } catch (err) {
      next(err);
    }
  },
};

