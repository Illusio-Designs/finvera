const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

module.exports = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search, account_group_id } = req.query;
      const offset = (page - 1) * limit;
      const where = {};

      if (search) {
        where[Op.or] = [
          { ledger_name: { [Op.like]: `%${search}%` } },
          { ledger_code: { [Op.like]: `%${search}%` } },
        ];
      }

      if (account_group_id) {
        where.account_group_id = account_group_id;
      }

      const { count, rows } = await req.tenantModels.Ledger.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['ledger_code', 'ASC']],
      });

      // Enrich account group details from master DB
      const groupIds = [...new Set(rows.map((r) => r.account_group_id).filter(Boolean))];
      const groups = await req.masterModels.AccountGroup.findAll({ where: { id: groupIds } });
      const groupMap = new Map(groups.map((g) => [g.id, g]));
      const data = rows.map((l) => ({
        ...l.toJSON(),
        account_group: groupMap.get(l.account_group_id)
          ? {
              id: groupMap.get(l.account_group_id).id,
              group_name: groupMap.get(l.account_group_id).name,
              group_code: groupMap.get(l.account_group_id).group_code,
              nature: groupMap.get(l.account_group_id).nature,
            }
          : null,
      }));

      res.json({
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      logger.error('Ledger list error:', error);
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const {
        ledger_name,
        ledger_code,
        account_group_id,
        opening_balance = 0,
        balance_type = 'debit',
        gstin,
        pan,
        address,
        city,
        state,
        pincode,
        phone,
        email,
      } = req.body;

      const ledger = await req.tenantModels.Ledger.create({
        ledger_name,
        ledger_code,
        account_group_id,
        opening_balance: parseFloat(opening_balance) || 0,
        opening_balance_type: balance_type === 'debit' ? 'Dr' : 'Cr',
        balance_type,
        gstin,
        pan,
        address,
        city,
        state,
        pincode,
        phone,
        email,
      });

      res.status(201).json({ data: ledger });
    } catch (error) {
      logger.error('Ledger create error:', error);
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const ledger = await req.tenantModels.Ledger.findByPk(id);

      if (!ledger) {
        return res.status(404).json({ message: 'Ledger not found' });
      }

      const group = ledger.account_group_id
        ? await req.masterModels.AccountGroup.findByPk(ledger.account_group_id)
        : null;

      res.json({
        data: {
          ...ledger.toJSON(),
          account_group: group
            ? { id: group.id, group_name: group.name, group_code: group.group_code, nature: group.nature }
            : null,
        },
      });
    } catch (error) {
      logger.error('Ledger getById error:', error);
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const {
        ledger_name,
        ledger_code,
        account_group_id,
        opening_balance,
        balance_type,
        gstin,
        pan,
        address,
        city,
        state,
        pincode,
        phone,
        email,
        is_active,
      } = req.body;

      const ledger = await req.tenantModels.Ledger.findByPk(id);

      if (!ledger) {
        return res.status(404).json({ message: 'Ledger not found' });
      }

      const updateData = {};
      if (ledger_name) updateData.ledger_name = ledger_name;
      if (ledger_code) updateData.ledger_code = ledger_code;
      if (account_group_id) updateData.account_group_id = account_group_id;
      if (opening_balance !== undefined) updateData.opening_balance = parseFloat(opening_balance);
      if (balance_type) {
        updateData.balance_type = balance_type;
        updateData.opening_balance_type = balance_type === 'debit' ? 'Dr' : 'Cr';
      }
      if (gstin !== undefined) updateData.gstin = gstin;
      if (pan !== undefined) updateData.pan = pan;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      if (pincode !== undefined) updateData.pincode = pincode;
      if (phone !== undefined) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (is_active !== undefined) updateData.is_active = is_active;

      await ledger.update(updateData);

      res.json({ data: ledger });
    } catch (error) {
      logger.error('Ledger update error:', error);
      next(error);
    }
  },

  async getBalance(req, res, next) {
    try {
      const { id } = req.params;
      const { from_date, to_date } = req.query;

      const ledger = await req.tenantModels.Ledger.findByPk(id);

      if (!ledger) {
        return res.status(404).json({ message: 'Ledger not found' });
      }

      // Calculate balance from voucher ledger entries
      const where = {
        ledger_id: id,
      };

      // If date range provided, join with Voucher to filter by date
      let queryOptions = {
        where,
        attributes: [
          // Stored as DB columns `debit`/`credit` (mapped to debit_amount/credit_amount in model)
          [Sequelize.fn('SUM', Sequelize.col('VoucherLedgerEntry.debit')), 'total_debit'],
          [Sequelize.fn('SUM', Sequelize.col('VoucherLedgerEntry.credit')), 'total_credit'],
        ],
        raw: true,
      };

      if (from_date || to_date) {
        const Voucher = req.tenantModels.Voucher;
        queryOptions.include = [
          {
            model: Voucher,
            attributes: [],
            where: {},
            required: true,
          },
        ];
        if (from_date) {
          queryOptions.include[0].where.voucher_date = { [Op.gte]: from_date };
        }
        if (to_date) {
          if (queryOptions.include[0].where.voucher_date) {
            queryOptions.include[0].where.voucher_date[Op.lte] = to_date;
          } else {
            queryOptions.include[0].where.voucher_date = { [Op.lte]: to_date };
          }
        }
      }

      const entries = await req.tenantModels.VoucherLedgerEntry.findAll(queryOptions);

      const totalDebit = parseFloat(entries[0]?.total_debit || 0);
      const totalCredit = parseFloat(entries[0]?.total_credit || 0);
      const openingBalance = parseFloat(ledger.opening_balance || 0);

      let currentBalance = openingBalance;
      if (ledger.balance_type === 'debit' || ledger.opening_balance_type === 'Dr') {
        currentBalance = openingBalance + totalDebit - totalCredit;
      } else {
        currentBalance = openingBalance + totalCredit - totalDebit;
      }

      res.json({
        data: {
          ledger_id: id,
          opening_balance: openingBalance,
          total_debit: totalDebit,
          total_credit: totalCredit,
          current_balance: Math.abs(currentBalance),
          balance_type: currentBalance >= 0 ? 'debit' : 'credit',
        },
      });
    } catch (error) {
      logger.error('Ledger getBalance error:', error);
      next(error);
    }
  },
};

