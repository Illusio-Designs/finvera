const { Op } = require('sequelize');

function toNum(v, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

async function getMasterGroupId(masterModels, groupCode) {
  const group = await masterModels.AccountGroup.findOne({ where: { group_code: groupCode } });
  if (!group) throw new Error(`Master AccountGroup not found for group_code=${groupCode}`);
  return group.id;
}

async function getOrCreateSystemLedger({ tenantModels, masterModels }, { ledgerCode, ledgerName, groupCode }) {
  const existing =
    (ledgerCode ? await tenantModels.Ledger.findOne({ where: { ledger_code: ledgerCode } }) : null) ||
    (ledgerName ? await tenantModels.Ledger.findOne({ where: { ledger_name: ledgerName } }) : null);
  if (existing) return existing;

  const groupId = await getMasterGroupId(masterModels, groupCode);
  return tenantModels.Ledger.create({
    ledger_name: ledgerName,
    ledger_code: ledgerCode || null,
    account_group_id: groupId,
    opening_balance: 0,
    opening_balance_type: 'Dr',
    balance_type: 'debit',
    is_active: true,
  });
}

function voucherPrefix(voucherType) {
  const map = {
    Sales: 'INV',
    Purchase: 'PUR',
    Payment: 'PAY',
    Receipt: 'REC',
    Journal: 'JV',
    Contra: 'CNT',
  };
  return map[voucherType] || 'VCH';
}

async function generateVoucherNumber(tenantModels, voucherType) {
  const prefix = voucherPrefix(voucherType);
  const like = `${prefix}-%`;
  const last = await tenantModels.Voucher.findOne({
    where: { voucher_type: voucherType, voucher_number: { [Op.like]: like } },
    order: [['createdAt', 'DESC']],
  });

  let next = 1;
  if (last?.voucher_number) {
    const m = String(last.voucher_number).match(/-(\d+)$/);
    const lastNum = m ? parseInt(m[1], 10) : NaN;
    if (Number.isFinite(lastNum)) next = lastNum + 1;
  }
  return `${prefix}-${String(next).padStart(6, '0')}`;
}

async function applyPurchaseInventory({ tenantModels }, voucher, voucherItems, t) {
  for (const it of voucherItems) {
    const qty = toNum(it.quantity, 0);
    if (qty <= 0) continue;
    const taxable = toNum(it.taxable_amount, 0);
    const costRate = qty ? taxable / qty : 0;
    const keyRaw = (it.item_code || it.item_description || '').trim();
    if (!keyRaw) continue;
    const itemKey = (it.item_code || it.item_description).trim().toLowerCase();

    const [inv] = await tenantModels.InventoryItem.findOrCreate({
      where: { item_key: itemKey },
      defaults: {
        item_key: itemKey,
        item_code: it.item_code || null,
        item_name: it.item_description || keyRaw,
        hsn_sac_code: it.hsn_sac_code || null,
        uqc: it.uqc || null,
        gst_rate: it.gst_rate || null,
        quantity_on_hand: 0,
        avg_cost: 0,
        is_active: true,
      },
      transaction: t,
    });

    const prevQty = toNum(inv.quantity_on_hand, 0);
    const prevAvg = toNum(inv.avg_cost, 0);
    const newQty = prevQty + qty;
    const newAvg = newQty > 0 ? ((prevQty * prevAvg) + (qty * costRate)) / newQty : 0;

    await inv.update({ quantity_on_hand: newQty, avg_cost: newAvg }, { transaction: t });
    await tenantModels.StockMovement.create(
      {
        inventory_item_id: inv.id,
        voucher_id: voucher.id,
        movement_type: 'IN',
        quantity: qty,
        rate: costRate,
        amount: taxable,
        narration: `Purchase ${voucher.voucher_number}`,
      },
      { transaction: t }
    );
  }
}

async function applySalesInventoryAndGetCogs({ tenantModels }, voucher, voucherItems, t) {
  let totalCogs = 0;
  for (const it of voucherItems) {
    const qty = toNum(it.quantity, 0);
    if (qty <= 0) continue;
    const keyRaw = (it.item_code || it.item_description || '').trim();
    if (!keyRaw) continue;
    const itemKey = (it.item_code || it.item_description).trim().toLowerCase();

    const inv = await tenantModels.InventoryItem.findOne({ where: { item_key: itemKey }, transaction: t });
    let invId = inv?.id;
    const prevQty = toNum(inv?.quantity_on_hand, 0);
    const avg = toNum(inv?.avg_cost, 0);
    const newQty = prevQty - qty;

    const cogs = qty * avg;
    totalCogs += cogs;

    if (inv) {
      await inv.update({ quantity_on_hand: newQty }, { transaction: t });
    } else {
      // Create negative stock record for visibility
      const created = await tenantModels.InventoryItem.create(
        {
          item_key: itemKey,
          item_code: it.item_code || null,
          item_name: it.item_description || keyRaw,
          hsn_sac_code: it.hsn_sac_code || null,
          uqc: it.uqc || null,
          gst_rate: it.gst_rate || null,
          quantity_on_hand: newQty,
          avg_cost: 0,
          is_active: true,
        },
        { transaction: t }
      );
      invId = created.id;
    }

    await tenantModels.StockMovement.create(
      {
        inventory_item_id: invId,
        voucher_id: voucher.id,
        movement_type: 'OUT',
        quantity: qty,
        rate: avg,
        amount: cogs,
        narration: `Sale ${voucher.voucher_number}`,
      },
      { transaction: t }
    );
  }
  return totalCogs;
}

module.exports = {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, voucher_type, status, startDate, endDate } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const where = {};

      if (voucher_type) where.voucher_type = voucher_type;
      if (status) where.status = status;
      if (startDate && endDate) {
        where.voucher_date = { [Op.between]: [startDate, endDate] };
      }

      const vouchers = await req.tenantModels.Voucher.findAndCountAll({
        where,
        include: [{ model: req.tenantModels.Ledger, as: 'partyLedger', attributes: ['id', 'ledger_name'] }],
        limit: parseInt(limit, 10),
        offset,
        order: [['voucher_date', 'DESC'], ['voucher_number', 'DESC']],
      });

      res.json({
        vouchers: vouchers.rows,
        pagination: {
          total: vouchers.count,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(vouchers.count / parseInt(limit, 10)),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    const t = await req.tenantDb.transaction();
    try {
      const {
        voucher_type_id = null,
        voucher_type = null,
        voucher_number,
        voucher_date,
        party_ledger_id = null,
        items = [],
        ledger_entries = [],
        status,
        narration,
        reference_number,
        reference_date,
        ...voucherData
      } = req.body || {};

      const resolvedType = voucher_type || 'VCH';
      const resolvedNumber = voucher_number || (await generateVoucherNumber(req.tenantModels, resolvedType));
      const resolvedStatus = status || 'posted';

      const voucher = await req.tenantModels.Voucher.create(
        {
          voucher_type_id,
          voucher_type: resolvedType,
          voucher_number: resolvedNumber,
          voucher_date,
          party_ledger_id,
          narration,
          reference_number,
          reference_date: reference_date || null,
          status: resolvedStatus,
          created_by: req.user?.id || null,
          ...voucherData,
        },
        { transaction: t }
      );

      let createdItems = [];
      if (items && items.length > 0) {
        const voucherItems = items.map((it) => ({ voucher_id: voucher.id, ...it }));
        createdItems = await req.tenantModels.VoucherItem.bulkCreate(voucherItems, { transaction: t });
      }

      // Inventory + COGS (only for posted vouchers)
      let cogsTotal = 0;
      if (resolvedStatus === 'posted') {
        if (resolvedType === 'Purchase') {
          await applyPurchaseInventory({ tenantModels: req.tenantModels }, voucher, createdItems, t);
        }
        if (resolvedType === 'Sales') {
          cogsTotal = await applySalesInventoryAndGetCogs({ tenantModels: req.tenantModels }, voucher, createdItems, t);
        }
      }

      const entriesClean = (ledger_entries || [])
        .map((e) => ({
          ledger_id: e.ledger_id,
          debit_amount: toNum(e.debit_amount, 0),
          credit_amount: toNum(e.credit_amount, 0),
          narration: e.narration || null,
        }))
        .filter((e) => e.ledger_id);

      // Add COGS entry (debit COGS, credit Inventory)
      if (resolvedStatus === 'posted' && resolvedType === 'Sales' && cogsTotal > 0) {
        const cogsLedger = await getOrCreateSystemLedger(
          { tenantModels: req.tenantModels, masterModels: req.masterModels },
          { ledgerCode: 'COGS', ledgerName: 'Cost of Goods Sold', groupCode: 'DIR_EXP' }
        );
        const inventoryLedger = await getOrCreateSystemLedger(
          { tenantModels: req.tenantModels, masterModels: req.masterModels },
          { ledgerCode: 'INVENTORY', ledgerName: 'Stock-in-Hand', groupCode: 'INV' }
        );
        entriesClean.push(
          { ledger_id: cogsLedger.id, debit_amount: cogsTotal, credit_amount: 0, narration: 'COGS' },
          { ledger_id: inventoryLedger.id, debit_amount: 0, credit_amount: cogsTotal, narration: 'COGS' }
        );
      }

      if (entriesClean.length > 0) {
        const totalDebit = entriesClean.reduce((sum, e) => sum + toNum(e.debit_amount, 0), 0);
        const totalCredit = entriesClean.reduce((sum, e) => sum + toNum(e.credit_amount, 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          await t.rollback();
          return res.status(400).json({
            message: 'Double-entry validation failed: Debit and Credit amounts must be equal',
            debit: totalDebit,
            credit: totalCredit,
          });
        }

        await req.tenantModels.VoucherLedgerEntry.bulkCreate(
          entriesClean.map((e) => ({ voucher_id: voucher.id, ...e })),
          { transaction: t }
        );
      }

      await t.commit();

      const createdVoucher = await req.tenantModels.Voucher.findByPk(voucher.id, {
        include: [
          { model: req.tenantModels.VoucherItem },
          { model: req.tenantModels.VoucherLedgerEntry, include: [{ model: req.tenantModels.Ledger }] },
          { model: req.tenantModels.Ledger, as: 'partyLedger' },
        ],
      });

      res.status(201).json({ voucher: createdVoucher });
    } catch (err) {
      await t.rollback();
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const voucher = await req.tenantModels.Voucher.findByPk(id, {
        include: [
          { model: req.tenantModels.VoucherItem },
          { model: req.tenantModels.VoucherLedgerEntry, include: [{ model: req.tenantModels.Ledger }] },
          { model: req.tenantModels.Ledger, as: 'partyLedger' },
        ],
      });
      if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
      res.json({ voucher });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    const t = await req.tenantDb.transaction();
    try {
      const { id } = req.params;
      const voucher = await req.tenantModels.Voucher.findByPk(id, { transaction: t });
      if (!voucher) {
        await t.rollback();
        return res.status(404).json({ message: 'Voucher not found' });
      }
      if (voucher.status === 'posted') {
        await t.rollback();
        return res.status(400).json({ message: 'Posted vouchers cannot be modified' });
      }

      const { items, ledger_entries, ...updateData } = req.body || {};
      await voucher.update(updateData, { transaction: t });

      if (items) {
        await req.tenantModels.VoucherItem.destroy({ where: { voucher_id: id }, transaction: t });
        if (items.length > 0) {
          await req.tenantModels.VoucherItem.bulkCreate(
            items.map((it) => ({ voucher_id: voucher.id, ...it })),
            { transaction: t }
          );
        }
      }

      if (ledger_entries) {
        await req.tenantModels.VoucherLedgerEntry.destroy({ where: { voucher_id: id }, transaction: t });
        const entriesClean = (ledger_entries || []).map((e) => ({
          ledger_id: e.ledger_id,
          debit_amount: toNum(e.debit_amount, 0),
          credit_amount: toNum(e.credit_amount, 0),
          narration: e.narration || null,
        }));
        const totalDebit = entriesClean.reduce((sum, e) => sum + toNum(e.debit_amount, 0), 0);
        const totalCredit = entriesClean.reduce((sum, e) => sum + toNum(e.credit_amount, 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          await t.rollback();
          return res.status(400).json({ message: 'Double-entry validation failed', debit: totalDebit, credit: totalCredit });
        }
        if (entriesClean.length > 0) {
          await req.tenantModels.VoucherLedgerEntry.bulkCreate(
            entriesClean.map((e) => ({ voucher_id: voucher.id, ...e })),
            { transaction: t }
          );
        }
      }

      await t.commit();
      const updatedVoucher = await req.tenantModels.Voucher.findByPk(voucher.id, {
        include: [
          { model: req.tenantModels.VoucherItem },
          { model: req.tenantModels.VoucherLedgerEntry, include: [{ model: req.tenantModels.Ledger }] },
          { model: req.tenantModels.Ledger, as: 'partyLedger' },
        ],
      });
      res.json({ voucher: updatedVoucher });
    } catch (err) {
      await t.rollback();
      next(err);
    }
  },

  async post(req, res, next) {
    const t = await req.tenantDb.transaction();
    try {
      const { id } = req.params;
      const voucher = await req.tenantModels.Voucher.findByPk(id, {
        include: [{ model: req.tenantModels.VoucherItem }, { model: req.tenantModels.VoucherLedgerEntry }],
        transaction: t,
      });
      if (!voucher) {
        await t.rollback();
        return res.status(404).json({ message: 'Voucher not found' });
      }
      if (voucher.status === 'posted') {
        await t.rollback();
        return res.status(400).json({ message: 'Voucher already posted' });
      }

      const entries = voucher.voucher_ledger_entries || [];
      const totalDebit = entries.reduce((sum, e) => sum + toNum(e.debit_amount, 0), 0);
      const totalCredit = entries.reduce((sum, e) => sum + toNum(e.credit_amount, 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        await t.rollback();
        return res.status(400).json({
          message: 'Cannot post voucher: Debit and Credit amounts must be equal',
          debit: totalDebit,
          credit: totalCredit,
        });
      }

      // Apply inventory on posting if needed
      if (voucher.voucher_type === 'Purchase') {
        await applyPurchaseInventory({ tenantModels: req.tenantModels }, voucher, voucher.voucher_items || [], t);
      } else if (voucher.voucher_type === 'Sales') {
        const cogsTotal = await applySalesInventoryAndGetCogs({ tenantModels: req.tenantModels }, voucher, voucher.voucher_items || [], t);
        if (cogsTotal > 0) {
          const cogsLedger = await getOrCreateSystemLedger(
            { tenantModels: req.tenantModels, masterModels: req.masterModels },
            { ledgerCode: 'COGS', ledgerName: 'Cost of Goods Sold', groupCode: 'DIR_EXP' }
          );
          const inventoryLedger = await getOrCreateSystemLedger(
            { tenantModels: req.tenantModels, masterModels: req.masterModels },
            { ledgerCode: 'INVENTORY', ledgerName: 'Stock-in-Hand', groupCode: 'INV' }
          );
          await req.tenantModels.VoucherLedgerEntry.bulkCreate(
            [
              { voucher_id: voucher.id, ledger_id: cogsLedger.id, debit_amount: cogsTotal, credit_amount: 0, narration: 'COGS' },
              { voucher_id: voucher.id, ledger_id: inventoryLedger.id, debit_amount: 0, credit_amount: cogsTotal, narration: 'COGS' },
            ],
            { transaction: t }
          );
        }
      }

      await voucher.update({ status: 'posted' }, { transaction: t });
      await t.commit();
      res.json({ voucher, message: 'Voucher posted successfully' });
    } catch (err) {
      await t.rollback();
      next(err);
    }
  },

  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const voucher = await req.tenantModels.Voucher.findByPk(id);
      if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
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

