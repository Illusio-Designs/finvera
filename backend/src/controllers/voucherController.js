const { Voucher, VoucherType, VoucherItem, VoucherLedgerEntry, Ledger, AccountGroup } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

module.exports = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, voucher_type, status, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;

      const where = { tenant_id: req.tenant_id };
      if (voucher_type) where.voucher_type_id = voucher_type;
      if (status) where.status = status;
      if (startDate && endDate) {
        where.voucher_date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
      }

      const vouchers = await Voucher.findAndCountAll({
        where,
        include: [
          { model: VoucherType, attributes: ['voucher_code', 'voucher_name'] },
          { model: Ledger, as: 'partyLedger', attributes: ['ledger_name'] },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['voucher_date', 'DESC'], ['voucher_number', 'DESC']],
      });

      res.json({
        vouchers: vouchers.rows,
        pagination: {
          total: vouchers.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(vouchers.count / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const {
        voucher_type_id,
        voucher_date,
        party_ledger_id,
        items,
        ledger_entries,
        narration,
        reference_number,
        reference_date,
        ...voucherData
      } = req.body;

      // Get voucher type for numbering
      const voucherType = await VoucherType.findByPk(voucher_type_id);
      if (!voucherType) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Voucher type not found' });
      }

      // Generate voucher number
      const voucherNumber = await generateVoucherNumber(voucherType, req.tenant_id);

      // Create voucher
      const voucher = await Voucher.create(
        {
          tenant_id: req.tenant_id,
          voucher_type_id,
          voucher_number,
          voucher_date: new Date(voucher_date),
          party_ledger_id,
          narration,
          reference_number,
          reference_date: reference_date ? new Date(reference_date) : null,
          status: 'draft',
          created_by: req.user.id,
          ...voucherData,
        },
        { transaction }
      );

      // Create voucher items
      if (items && items.length > 0) {
        const voucherItems = items.map((item) => ({
          tenant_id: req.tenant_id,
          voucher_id: voucher.id,
          ...item,
        }));
        await VoucherItem.bulkCreate(voucherItems, { transaction });
      }

      // Create ledger entries (double-entry)
      if (ledger_entries && ledger_entries.length > 0) {
        const entries = ledger_entries.map((entry) => ({
          tenant_id: req.tenant_id,
          voucher_id: voucher.id,
          ...entry,
        }));
        await VoucherLedgerEntry.bulkCreate(entries, { transaction });

        // Validate double-entry balance
        const totalDebit = entries.reduce((sum, e) => sum + parseFloat(e.debit_amount || 0), 0);
        const totalCredit = entries.reduce((sum, e) => sum + parseFloat(e.credit_amount || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Double-entry validation failed: Debit and Credit amounts must be equal',
            debit: totalDebit,
            credit: totalCredit,
          });
        }
      }

      await transaction.commit();

      const createdVoucher = await Voucher.findByPk(voucher.id, {
        include: [
          { model: VoucherType },
          { model: VoucherItem },
          { model: VoucherLedgerEntry, include: [{ model: Ledger }] },
        ],
      });

      res.status(201).json({ voucher: createdVoucher });
    } catch (err) {
      await transaction.rollback();
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const voucher = await Voucher.findOne({
        where: { id, tenant_id: req.tenant_id },
        include: [
          { model: VoucherType },
          { model: VoucherItem },
          { model: VoucherLedgerEntry, include: [{ model: Ledger }] },
          { model: Ledger, as: 'partyLedger' },
        ],
      });

      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
      }

      res.json({ voucher });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const voucher = await Voucher.findOne({
        where: { id, tenant_id: req.tenant_id },
      });

      if (!voucher) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Voucher not found' });
      }

      if (voucher.status === 'posted') {
        await transaction.rollback();
        return res.status(400).json({ message: 'Posted vouchers cannot be modified' });
      }

      const { items, ledger_entries, ...updateData } = req.body;

      await voucher.update(updateData, { transaction });

      // Update items if provided
      if (items) {
        await VoucherItem.destroy({ where: { voucher_id: id }, transaction });
        if (items.length > 0) {
          const voucherItems = items.map((item) => ({
            tenant_id: req.tenant_id,
            voucher_id: voucher.id,
            ...item,
          }));
          await VoucherItem.bulkCreate(voucherItems, { transaction });
        }
      }

      // Update ledger entries if provided
      if (ledger_entries) {
        await VoucherLedgerEntry.destroy({ where: { voucher_id: id }, transaction });
        if (ledger_entries.length > 0) {
          const entries = ledger_entries.map((entry) => ({
            tenant_id: req.tenant_id,
            voucher_id: voucher.id,
            ...entry,
          }));
          await VoucherLedgerEntry.bulkCreate(entries, { transaction });

          // Validate double-entry
          const totalDebit = entries.reduce((sum, e) => sum + parseFloat(e.debit_amount || 0), 0);
          const totalCredit = entries.reduce((sum, e) => sum + parseFloat(e.credit_amount || 0), 0);

          if (Math.abs(totalDebit - totalCredit) > 0.01) {
            await transaction.rollback();
            return res.status(400).json({
              message: 'Double-entry validation failed',
              debit: totalDebit,
              credit: totalCredit,
            });
          }
        }
      }

      await transaction.commit();
      const updatedVoucher = await Voucher.findByPk(voucher.id, {
        include: [
          { model: VoucherType },
          { model: VoucherItem },
          { model: VoucherLedgerEntry, include: [{ model: Ledger }] },
        ],
      });

      res.json({ voucher: updatedVoucher });
    } catch (err) {
      await transaction.rollback();
      next(err);
    }
  },

  async post(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const voucher = await Voucher.findOne({
        where: { id, tenant_id: req.tenant_id },
        include: [{ model: VoucherLedgerEntry }],
      });

      if (!voucher) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Voucher not found' });
      }

      if (voucher.status === 'posted') {
        await transaction.rollback();
        return res.status(400).json({ message: 'Voucher already posted' });
      }

      // Validate double-entry balance
      const entries = voucher.voucher_ledger_entries || [];
      const totalDebit = entries.reduce((sum, e) => sum + parseFloat(e.debit_amount || 0), 0);
      const totalCredit = entries.reduce((sum, e) => sum + parseFloat(e.credit_amount || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Cannot post voucher: Debit and Credit amounts must be equal',
          debit: totalDebit,
          credit: totalCredit,
        });
      }

      await voucher.update(
        {
          status: 'posted',
          posted_by: req.user.id,
          posted_at: new Date(),
        },
        { transaction }
      );

      await transaction.commit();
      res.json({ voucher, message: 'Voucher posted successfully' });
    } catch (err) {
      await transaction.rollback();
      next(err);
    }
  },

  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const voucher = await Voucher.findOne({
        where: { id, tenant_id: req.tenant_id },
      });

      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
      }

      if (voucher.status === 'posted') {
        return res.status(400).json({ message: 'Posted vouchers cannot be cancelled. Create reversal entry instead.' });
      }

      await voucher.update({ status: 'cancelled' });
      res.json({ voucher, message: 'Voucher cancelled' });
    } catch (err) {
      next(err);
    }
  },
};

async function generateVoucherNumber(voucherType, tenantId) {
  if (voucherType.numbering_method === 'manual') {
    return null; // Will be set manually
  }

  const prefix = voucherType.prefix || '';
  const suffix = voucherType.suffix || '';
  const startNumber = voucherType.starting_number || 1;

  // Get last voucher number for this type and tenant
  const lastVoucher = await Voucher.findOne({
    where: {
      tenant_id: tenantId,
      voucher_type_id: voucherType.id,
    },
    order: [['created_at', 'DESC']],
  });

  let nextNumber = startNumber;
  if (lastVoucher && lastVoucher.voucher_number) {
    const lastNumber = parseInt(lastVoucher.voucher_number.replace(prefix, '').replace(suffix, '')) || startNumber - 1;
    nextNumber = lastNumber + 1;
  }

  // Update current number in voucher type
  await VoucherType.update(
    { current_number: nextNumber },
    { where: { id: voucherType.id } }
  );

  return `${prefix}${nextNumber.toString().padStart(6, '0')}${suffix}`;
}

