
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { findOrCreateInventoryItem } = require('../services/inventoryService');

// ... (toNum, getMasterGroupId, getOrCreateSystemLedger, voucherPrefix, etc. remain the same)

async function applyPurchaseInventory({ tenantModels }, voucher, voucherItems, t) {
  for (const it of voucherItems) {
    const qty = toNum(it.quantity, 0);
    if (qty <= 0) continue;
    const taxable = toNum(it.taxable_amount, 0);
    const costRate = qty > 0 ? taxable / qty : 0;

    const { item: inv } = await findOrCreateInventoryItem(tenantModels, {
      inventory_item_id: it.inventory_item_id,
      barcode: it.barcode,
      item_code: it.item_code,
      item_name: it.item_description,
      hsn_sac_code: it.hsn_sac_code,
      uqc: it.uqc,
      gst_rate: it.gst_rate,
      variant_attributes: it.variant_attributes,
    }, t);

    // ... (warehouse and aggregate stock update logic remains the same)
  }
}

async function applySalesInventoryAndGetCogs({ tenantModels }, voucher, voucherItems, t) {
  let totalCogs = 0;
  for (const it of voucherItems) {
    const qty = toNum(it.quantity, 0);
    if (qty <= 0) continue;

    const { item: inv } = await findOrCreateInventoryItem(tenantModels, {
      inventory_item_id: it.inventory_item_id,
      barcode: it.barcode,
      item_code: it.item_code,
      item_name: it.item_description,
      variant_attributes: it.variant_attributes,
    }, t);
    
    if (!inv) {
      // Create a negative stock record if the item is not found
      // This ensures that the sale is recorded even if the item is not in inventory
      const { item: createdInv } = await findOrCreateInventoryItem(tenantModels, {
        ...it,
        quantity_on_hand: -qty,
      }, t);
      // Since this is a new item, COGS is 0
    } else {
      // ... (rest of the COGS and stock update logic remains the same)
    }
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
// ... (rest of the file remains the same)
};
