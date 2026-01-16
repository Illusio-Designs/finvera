const { Op } = require('sequelize');
const logger = require('../utils/logger');

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

function voucherPrefix(voucherType, company = null) {
  // Check company configuration first
  if (company?.compliance?.invoice_numbering) {
    const config = company.compliance.invoice_numbering;
    if (voucherType === 'Sales' && config.sales?.prefix) {
      return config.sales.prefix;
    }
    if (voucherType === 'Purchase' && config.purchase?.prefix) {
      return config.purchase.prefix;
    }
  }
  
  // Fallback to defaults
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

function getVoucherSuffix(voucherType, company = null) {
  if (company?.compliance?.invoice_numbering) {
    const config = company.compliance.invoice_numbering;
    if (voucherType === 'Sales' && config.sales?.suffix) {
      return config.sales.suffix;
    }
    if (voucherType === 'Purchase' && config.purchase?.suffix) {
      return config.purchase.suffix;
    }
  }
  return '';
}

function getVoucherPadding(voucherType, company = null) {
  if (company?.compliance?.invoice_numbering) {
    const config = company.compliance.invoice_numbering;
    if (voucherType === 'Sales' && config.sales?.padding) {
      return parseInt(config.sales.padding, 10) || 6;
    }
    if (voucherType === 'Purchase' && config.purchase?.padding) {
      return parseInt(config.purchase.padding, 10) || 6;
    }
  }
  return 6;
}

async function generateVoucherNumber(tenantModels, voucherType, company = null) {
  const prefix = voucherPrefix(voucherType, company);
  const suffix = getVoucherSuffix(voucherType, company);
  const padding = getVoucherPadding(voucherType, company);
  
  // Build search pattern - handle both with and without suffix
  const likePattern = suffix ? `${prefix}-%${suffix}` : `${prefix}-%`;
  const last = await tenantModels.Voucher.findOne({
    where: {
      voucher_type: voucherType,
      voucher_number: { [Op.like]: likePattern },
    },
    order: [['createdAt', 'DESC']],
  });

  let next = 1;
  if (last?.voucher_number) {
    // Extract number between prefix and suffix
    const pattern = suffix 
      ? new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
      : new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`);
    const m = String(last.voucher_number).match(pattern);
    const lastNum = m ? parseInt(m[1], 10) : NaN;
    if (Number.isFinite(lastNum)) next = lastNum + 1;
  }
  
  const numberPart = String(next).padStart(padding, '0');
  return suffix ? `${prefix}-${numberPart}${suffix}` : `${prefix}-${numberPart}`;
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
    const warehouseId = it.warehouse_id || null;

    // Try to find inventory item by ID first (if provided), then by item_key
    let inv = null;
    if (it.inventory_item_id) {
      inv = await tenantModels.InventoryItem.findByPk(it.inventory_item_id, { transaction: t });
    }
    if (!inv) {
      // Auto-create inventory item from purchase invoice
      const [foundInv, created] = await tenantModels.InventoryItem.findOrCreate({
        where: { item_key: itemKey },
        defaults: {
          item_key: itemKey,
          item_code: it.item_code || null,
          item_name: it.item_description || keyRaw,
          barcode: null, // Barcode will be generated separately if needed
          hsn_sac_code: it.hsn_sac_code || null,
          uqc: it.uqc || null,
          gst_rate: it.gst_rate || null,
          quantity_on_hand: 0,
          avg_cost: 0,
          is_active: true,
        },
        transaction: t,
      });
      inv = foundInv;
      
      // Log if new item was created
      if (created) {
        logger.info(`Auto-created inventory item: ${inv.item_name} (${inv.id}) from purchase invoice`);
      }
    }

    // Handle warehouse-specific stock if warehouse is specified
    if (warehouseId && inv.id) {
      const [warehouseStock] = await tenantModels.WarehouseStock.findOrCreate({
        where: {
          inventory_item_id: inv.id,
          warehouse_id: warehouseId,
        },
        defaults: {
          inventory_item_id: inv.id,
          warehouse_id: warehouseId,
          quantity: 0,
          avg_cost: 0,
        },
        transaction: t,
      });

      const prevQty = toNum(warehouseStock.quantity, 0);
      const prevAvg = toNum(warehouseStock.avg_cost, 0);
      const newQty = prevQty + qty;
      const newAvg = newQty > 0 ? ((prevQty * prevAvg) + (qty * costRate)) / newQty : 0;

      await warehouseStock.update({ quantity: newQty, avg_cost: newAvg }, { transaction: t });
    }

    // Update aggregate inventory
    const prevQty = toNum(inv.quantity_on_hand, 0);
    const prevAvg = toNum(inv.avg_cost, 0);
    const newQty = prevQty + qty;
    const newAvg = newQty > 0 ? ((prevQty * prevAvg) + (qty * costRate)) / newQty : 0;

    await inv.update({ quantity_on_hand: newQty, avg_cost: newAvg }, { transaction: t });
    await tenantModels.StockMovement.create(
      {
        inventory_item_id: inv.id,
        warehouse_id: warehouseId,
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
    const warehouseId = it.warehouse_id || null;

    // Try to find inventory item by ID first (if provided), then by item_key
    let inv = null;
    let invId = it.inventory_item_id || null;
    if (invId) {
      inv = await tenantModels.InventoryItem.findByPk(invId, { transaction: t });
    }
    if (!inv) {
      inv = await tenantModels.InventoryItem.findOne({ where: { item_key: itemKey }, transaction: t });
      invId = inv?.id;
    }
    let avg = toNum(inv?.avg_cost, 0);

    // Handle warehouse-specific stock if warehouse is specified
    if (warehouseId && invId) {
      const warehouseStock = await tenantModels.WarehouseStock.findOne({
        where: {
          inventory_item_id: invId,
          warehouse_id: warehouseId,
        },
        transaction: t,
      });

      if (warehouseStock) {
        const prevQty = toNum(warehouseStock.quantity, 0);
    const newQty = prevQty - qty;

        if (newQty < 0) {
          throw new Error(`Insufficient stock in warehouse. Available: ${prevQty}, Requested: ${qty}`);
        }

        avg = toNum(warehouseStock.avg_cost, 0);
        await warehouseStock.update({ quantity: newQty }, { transaction: t });
      } else {
        // Warehouse stock doesn't exist - create with negative quantity
        await tenantModels.WarehouseStock.create(
          {
            inventory_item_id: invId,
            warehouse_id: warehouseId,
            quantity: -qty,
            avg_cost: avg,
          },
          { transaction: t }
        );
      }
    }

    // Update aggregate inventory
    if (inv) {
      const prevQty = toNum(inv.quantity_on_hand, 0);
      const newQty = prevQty - qty;
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
          quantity_on_hand: -qty,
          avg_cost: 0,
          is_active: true,
        },
        { transaction: t }
      );
      invId = created.id;
    }

    const cogs = qty * avg;
    totalCogs += cogs;

    await tenantModels.StockMovement.create(
      {
        inventory_item_id: invId,
        warehouse_id: warehouseId,
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
        data: vouchers.rows,
        vouchers: vouchers.rows, // Keep for backward compatibility
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
      const resolvedNumber = voucher_number || (await generateVoucherNumber(req.tenantModels, resolvedType, req.company));
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
        const voucherItems = items.map((it) => ({
          voucher_id: voucher.id,
          inventory_item_id: it.inventory_item_id || null,
          warehouse_id: it.warehouse_id || null,
          item_code: it.item_code || null,
          item_description: it.item_description || it.description || 'Item',
          hsn_sac_code: it.hsn_sac_code || null,
          uqc: it.uqc || null,
          quantity: toNum(it.quantity, 1),
          rate: toNum(it.rate, 0),
          discount_percent: toNum(it.discount_percent, 0),
          discount_amount: toNum(it.discount_amount, 0),
          taxable_amount: toNum(it.taxable_amount, 0),
          gst_rate: toNum(it.gst_rate, 0),
          cgst_amount: toNum(it.cgst_amount, 0),
          sgst_amount: toNum(it.sgst_amount, 0),
          igst_amount: toNum(it.igst_amount, 0),
          cess_amount: toNum(it.cess_amount, 0),
          total_amount: toNum(it.total_amount, 0),
        }));
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

      // Optional: auto-generate E-Way Bill for Sales vouchers if requested.
      // Note: real NIC API integration is not implemented; this stores a stub in company DB.
      if (resolvedStatus === 'posted' && resolvedType === 'Sales' && req.body?.auto_generate_ewaybill) {
        const eWayBillService = require('../services/eWayBillService');
        try {
          await eWayBillService.generate(
            { tenantModels: req.tenantModels, masterModels: req.masterModels, company: req.company },
            voucher.id,
            req.body?.ewaybill_details || {}
          );
        } catch (e) {
          // Do not fail invoice creation if EWB generation fails
        }
      }

      await t.commit();

      const createdVoucher = await req.tenantModels.Voucher.findByPk(voucher.id, {
        include: [
          { model: req.tenantModels.VoucherItem, required: false },
          { 
            model: req.tenantModels.VoucherLedgerEntry, 
            required: false,
            include: [{ model: req.tenantModels.Ledger, required: false }] 
          },
          { model: req.tenantModels.Ledger, as: 'partyLedger', required: false },
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
      
      // Try to get voucher with all includes
      let voucher;
      try {
        voucher = await req.tenantModels.Voucher.findByPk(id, {
        include: [
            { model: req.tenantModels.VoucherItem, required: false },
            { 
              model: req.tenantModels.VoucherLedgerEntry, 
              required: false,
              include: [{ 
                model: req.tenantModels.Ledger,
                required: false,
              }] 
            },
            { model: req.tenantModels.Ledger, as: 'partyLedger', required: false },
        ],
      });
      } catch (includeError) {
        // If include fails (e.g., missing columns), try without includes first
        logger.warn('Error with includes, retrying without:', includeError.message);
        voucher = await req.tenantModels.Voucher.findByPk(id);
        if (voucher) {
          // Manually load related data
          voucher.voucher_items = await req.tenantModels.VoucherItem.findAll({ 
            where: { voucher_id: id } 
          }).catch(() => []);
          voucher.voucher_ledger_entries = await req.tenantModels.VoucherLedgerEntry.findAll({ 
            where: { voucher_id: id },
            include: [{ model: req.tenantModels.Ledger, required: false }]
          }).catch(() => []);
          if (voucher.party_ledger_id) {
            voucher.partyLedger = await req.tenantModels.Ledger.findByPk(voucher.party_ledger_id)
              .catch(() => null);
          }
        }
      }
      
      if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
      
      res.json({ voucher });
    } catch (err) {
      logger.error('Error in voucher getById:', err);
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
          const voucherItems = items.map((it) => ({
            voucher_id: voucher.id,
            inventory_item_id: it.inventory_item_id || null,
            warehouse_id: it.warehouse_id || null,
            item_code: it.item_code || null,
            item_description: it.item_description || it.description || 'Item',
            hsn_sac_code: it.hsn_sac_code || null,
            uqc: it.uqc || null,
            quantity: toNum(it.quantity, 1),
            rate: toNum(it.rate, 0),
            discount_percent: toNum(it.discount_percent, 0),
            discount_amount: toNum(it.discount_amount, 0),
            taxable_amount: toNum(it.taxable_amount, 0),
            gst_rate: toNum(it.gst_rate, 0),
            cgst_amount: toNum(it.cgst_amount, 0),
            sgst_amount: toNum(it.sgst_amount, 0),
            igst_amount: toNum(it.igst_amount, 0),
            cess_amount: toNum(it.cess_amount, 0),
            total_amount: toNum(it.total_amount, 0),
          }));
          await req.tenantModels.VoucherItem.bulkCreate(voucherItems, { transaction: t });
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
          { model: req.tenantModels.VoucherItem, required: false },
          { 
            model: req.tenantModels.VoucherLedgerEntry, 
            required: false,
            include: [{ model: req.tenantModels.Ledger, required: false }] 
          },
          { model: req.tenantModels.Ledger, as: 'partyLedger', required: false },
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

