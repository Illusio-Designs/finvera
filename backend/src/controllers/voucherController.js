
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { findOrCreateInventoryItem } = require('../services/inventoryService');

function toNum(v, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Update ledger balance based on ledger entries
 */
async function updateLedgerBalance(tenantModels, ledgerId, transaction) {
  try {
    const ledger = await tenantModels.Ledger.findByPk(ledgerId, { transaction });
    if (!ledger) {
      logger.warn(`Ledger not found: ${ledgerId}`);
      return;
    }

    // Calculate total debits and credits from ledger entries
    const entries = await tenantModels.VoucherLedgerEntry.findAll({
      where: { ledger_id: ledgerId },
      attributes: [
        [tenantModels.sequelize.fn('SUM', tenantModels.sequelize.col('debit_amount')), 'total_debit'],
        [tenantModels.sequelize.fn('SUM', tenantModels.sequelize.col('credit_amount')), 'total_credit']
      ],
      raw: true,
      transaction
    });

    const totalDebit = parseFloat(entries[0]?.total_debit || 0);
    const totalCredit = parseFloat(entries[0]?.total_credit || 0);
    const openingBalance = parseFloat(ledger.opening_balance || 0);

    // Calculate current balance based on ledger type
    let currentBalance = openingBalance;
    if (ledger.balance_type === 'debit' || ledger.opening_balance_type === 'Dr') {
      currentBalance = openingBalance + totalDebit - totalCredit;
    } else {
      currentBalance = openingBalance + totalCredit - totalDebit;
    }

    // Update the ledger's current balance
    await ledger.update({
      current_balance: Math.abs(currentBalance)
    }, { transaction });

    logger.info(`Updated ledger balance for ${ledger.ledger_name}: ${Math.abs(currentBalance)}`);
    return Math.abs(currentBalance);
  } catch (error) {
    logger.error(`Error updating ledger balance for ${ledgerId}:`, error);
    throw error;
  }
}

async function applyPurchaseInventory({ tenantModels }, voucher, voucherItems, t) {
  logger.info(`Applying purchase inventory for voucher ${voucher.id} with ${voucherItems.length} items`);
  
  // Check if barcode functionality is enabled for this tenant
  const TenantMaster = require('../models/TenantMaster');
  const tenant = await TenantMaster.findByPk(voucher.tenant_id);
  const barcodeEnabled = tenant?.settings?.barcode_enabled === true;
  const defaultBarcodeType = tenant?.settings?.default_barcode_type || 'EAN13';
  const defaultBarcodePrefix = tenant?.settings?.default_barcode_prefix || 'PRD';
  
  for (const it of voucherItems) {
    const qty = toNum(it.quantity, 0);
    if (qty <= 0) continue;
    
    const taxable = toNum(it.taxable_amount, 0);
    const costRate = qty > 0 ? taxable / qty : 0;

    // Find or create inventory item
    const { item: inv, created } = await findOrCreateInventoryItem(tenantModels, {
      inventory_item_id: it.inventory_item_id,
      barcode: it.barcode,
      item_code: it.item_code,
      item_name: it.item_description || it.item_name,
      hsn_sac_code: it.hsn_sac_code,
      uqc: it.uqc,
      gst_rate: it.gst_rate,
      variant_attributes: it.variant_attributes,
    }, t);

    if (created) {
      logger.info(`Created new inventory item: ${inv.item_name} (ID: ${inv.id})`);
      
      // Auto-generate barcode if enabled and item doesn't have one (for non-serialized items)
      if (barcodeEnabled && !inv.barcode && !inv.is_serialized) {
        try {
          const barcodeGenerator = require('../utils/barcodeGenerator');
          let generatedBarcode = null;
          
          switch (defaultBarcodeType) {
            case 'EAN13':
              generatedBarcode = barcodeGenerator.generateEAN13('890'); // 890 is India prefix
              break;
            case 'EAN8':
              generatedBarcode = barcodeGenerator.generateEAN8();
              break;
            case 'CUSTOM':
              const nextSeq = await barcodeGenerator.getNextSequence(tenantModels, defaultBarcodePrefix);
              generatedBarcode = barcodeGenerator.generateCustomBarcode(defaultBarcodePrefix, nextSeq, 13);
              break;
          }
          
          if (generatedBarcode) {
            // Check uniqueness
            const existingBarcode = await tenantModels.InventoryItem.findOne({
              where: { barcode: generatedBarcode },
              transaction: t,
            });
            
            if (!existingBarcode) {
              await inv.update({ barcode: generatedBarcode }, { transaction: t });
              logger.info(`Auto-generated barcode for ${inv.item_name}: ${generatedBarcode}`);
            }
          }
        } catch (barcodeError) {
          logger.error(`Failed to auto-generate barcode for ${inv.item_name}:`, barcodeError);
          // Don't fail the entire transaction, just log the error
        }
      }
    }

    // Check if this is a serialized item (requires individual unit tracking)
    if (inv.is_serialized && barcodeEnabled) {
      logger.info(`Processing serialized inventory for ${inv.item_name}: ${qty} units`);
      
      // Generate individual units with unique barcodes
      const barcodeGenerator = require('../utils/barcodeGenerator');
      
      for (let i = 0; i < qty; i++) {
        let unitBarcode = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        // Try to generate unique barcode
        while (!unitBarcode && attempts < maxAttempts) {
          attempts++;
          
          try {
            switch (defaultBarcodeType) {
              case 'EAN13':
                unitBarcode = barcodeGenerator.generateEAN13('890');
                break;
              case 'EAN8':
                unitBarcode = barcodeGenerator.generateEAN8();
                break;
              case 'CUSTOM':
                const nextSeq = await barcodeGenerator.getNextSequence(tenantModels, defaultBarcodePrefix);
                unitBarcode = barcodeGenerator.generateCustomBarcode(defaultBarcodePrefix, nextSeq, 13);
                break;
            }
            
            // Check uniqueness in both InventoryItem and InventoryUnit
            const [existingItem, existingUnit] = await Promise.all([
              tenantModels.InventoryItem.findOne({ where: { barcode: unitBarcode }, transaction: t }),
              tenantModels.InventoryUnit.findOne({ where: { unit_barcode: unitBarcode }, transaction: t }),
            ]);
            
            if (existingItem || existingUnit) {
              unitBarcode = null; // Try again
            }
          } catch (error) {
            logger.error(`Error generating unit barcode (attempt ${attempts}):`, error);
            unitBarcode = null;
          }
        }
        
        if (!unitBarcode) {
          throw new Error(`Failed to generate unique barcode for unit ${i + 1} of ${inv.item_name}`);
        }
        
        // Create individual unit
        await tenantModels.InventoryUnit.create({
          inventory_item_id: inv.id,
          unit_barcode: unitBarcode,
          status: 'in_stock',
          warehouse_id: voucher.warehouse_id || null,
          purchase_voucher_id: voucher.id,
          purchase_date: voucher.voucher_date,
          purchase_rate: costRate,
          tenant_id: voucher.tenant_id,
        }, { transaction: t });
        
        logger.info(`Created unit ${i + 1}/${qty} for ${inv.item_name}: ${unitBarcode}`);
      }
      
      // For serialized items, quantity_on_hand = count of units with status 'in_stock'
      const inStockCount = await tenantModels.InventoryUnit.count({
        where: {
          inventory_item_id: inv.id,
          status: 'in_stock',
        },
        transaction: t,
      });
      
      await inv.update({
        quantity_on_hand: inStockCount,
        avg_cost: costRate, // Use current purchase rate
      }, { transaction: t });
      
      logger.info(`Updated serialized item ${inv.item_name}: ${inStockCount} units in stock`);
      
    } else {
      // Non-serialized item: Use traditional quantity tracking
      // Non-serialized item: Use traditional quantity tracking
      // Update inventory quantities using weighted average cost
      const currentQty = toNum(inv.quantity_on_hand, 0);
      const currentAvgCost = toNum(inv.avg_cost, 0);
      const currentValue = currentQty * currentAvgCost;
      
      const newQty = currentQty + qty;
      const newValue = currentValue + taxable;
      const newAvgCost = newQty > 0 ? newValue / newQty : 0;

      await inv.update({
        quantity_on_hand: newQty,
        avg_cost: newAvgCost,
      }, { transaction: t });

      logger.info(`Updated inventory item ${inv.item_name}: qty ${currentQty} -> ${newQty}, avg_cost ${currentAvgCost} -> ${newAvgCost}`);
    }

    // Create stock movement record (for both serialized and non-serialized)
    await tenantModels.StockMovement.create({
      inventory_item_id: inv.id,
      voucher_id: voucher.id,
      movement_type: 'IN',
      quantity: qty,
      rate: costRate,
      amount: taxable,
      reference_number: voucher.voucher_number,
      narration: `Purchase from ${voucher.party_name || 'Supplier'}${inv.is_serialized ? ' (Serialized)' : ''}`,
      movement_date: voucher.voucher_date,
      tenant_id: voucher.tenant_id,
    }, { transaction: t });
  }
}

async function applySalesInventoryAndGetCogs({ tenantModels }, voucher, voucherItems, t) {
  logger.info(`Applying sales inventory for voucher ${voucher.id} with ${voucherItems.length} items`);
  
  // Simplified sales inventory - no COGS calculation or stock reduction
  // Just create stock movement records for tracking purposes
  for (const it of voucherItems) {
    const qty = toNum(it.quantity, 0);
    if (qty <= 0) continue;

    const { item: inv } = await findOrCreateInventoryItem(tenantModels, {
      inventory_item_id: it.inventory_item_id,
      barcode: it.barcode,
      item_code: it.item_code,
      item_name: it.item_description || it.item_name,
      variant_attributes: it.variant_attributes,
    }, t);
    
    if (inv) {
      // Create stock movement record for tracking (no balance update)
      await tenantModels.StockMovement.create({
        inventory_item_id: inv.id,
        voucher_id: voucher.id,
        movement_type: 'OUT',
        quantity: -qty, // Negative for outward movement
        rate: toNum(inv.avg_cost, 0),
        amount: -(qty * toNum(inv.avg_cost, 0)), // Negative for outward movement
        reference_number: voucher.voucher_number,
        narration: `Sale to ${voucher.party_name || 'Customer'}`,
        movement_date: voucher.voucher_date,
        tenant_id: voucher.tenant_id,
      }, { transaction: t });

      logger.info(`Created stock movement record for ${inv.item_name}: qty -${qty} (no balance update)`);
    }
  }
  
  return 0; // No COGS calculated
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
    // Check if tenantModels and sequelize are available
    if (!req.tenantModels || !req.tenantModels.sequelize) {
      console.error('❌ Tenant models or sequelize not available:', {
        tenantModels: !!req.tenantModels,
        sequelize: !!req.tenantModels?.sequelize,
        tenant_id: req.tenant_id
      });
      return res.status(500).json({
        success: false,
        message: 'Database connection not available. Please try again.'
      });
    }

    const transaction = await req.tenantModels.sequelize.transaction();
    
    try {
      console.log('\n🚀 === VOUCHER CREATION STARTED ===');
      console.log('📋 Request Body:', JSON.stringify(req.body, null, 2));
      console.log('🏢 Tenant Info:', {
        tenant_id: req.tenant_id,
        tenant: req.tenant?.id,
        company_tenant_id: req.company?.tenant_id
      });

      // Ensure required fields are set
      if (!req.body.tenant_id) {
        req.body.tenant_id = req.tenant_id;
      }
      
      // Generate voucher number if not provided
      if (!req.body.voucher_number) {
        console.log('🔢 Generating voucher number...');
        const voucherType = req.body.voucher_type || 'GEN';
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        // Get the next sequence number for this voucher type
        const lastVoucher = await req.tenantModels.Voucher.findOne({
          where: {
            voucher_type: voucherType,
            tenant_id: req.tenant_id,
          },
          order: [['createdAt', 'DESC']],
          transaction,
        });
        
        let sequence = 1;
        if (lastVoucher && lastVoucher.voucher_number) {
          const match = lastVoucher.voucher_number.match(/(\d+)$/);
          if (match) {
            sequence = parseInt(match[1]) + 1;
          }
        }
        
        req.body.voucher_number = `${voucherType}${year}${month}${String(sequence).padStart(4, '0')}`;
        console.log('✅ Generated voucher number:', req.body.voucher_number);
      }
      
      // Set default voucher_date if not provided
      if (!req.body.voucher_date) {
        req.body.voucher_date = new Date();
        console.log('📅 Set default voucher date:', req.body.voucher_date);
      }
      
      console.log('💾 Creating voucher record...');
      // Create the voucher
      const voucher = await req.tenantModels.Voucher.create(req.body, { transaction });
      console.log('✅ Voucher created:', {
        id: voucher.id,
        voucher_number: voucher.voucher_number,
        voucher_type: voucher.voucher_type,
        total_amount: voucher.total_amount
      });
      
      // Create voucher items if provided
      if (req.body.items && req.body.items.length > 0) {
        console.log('📦 Creating voucher items...', req.body.items.length, 'items');
        const voucherItems = req.body.items.map(item => {
          // Calculate amount (quantity × rate) if not provided
          const quantity = parseFloat(item.quantity || 0);
          const rate = parseFloat(item.rate || 0);
          const amount = item.amount || (quantity * rate);
          
          return {
            ...item,
            amount: amount, // Ensure amount field is present
            voucher_id: voucher.id,
            tenant_id: req.tenant_id,
          };
        });
        
        console.log('📦 Voucher items data:', JSON.stringify(voucherItems, null, 2));
        await req.tenantModels.VoucherItem.bulkCreate(voucherItems, { transaction });
        console.log('✅ Voucher items created successfully');
      }
      
      // Create ledger entries if provided
      if (req.body.ledger_entries && req.body.ledger_entries.length > 0) {
        console.log('📊 Creating ledger entries...', req.body.ledger_entries.length, 'entries');
        const ledgerEntries = req.body.ledger_entries.map(entry => ({
          ...entry,
          voucher_id: voucher.id,
          tenant_id: req.tenant_id,
        }));
        
        console.log('📊 Ledger entries data:', JSON.stringify(ledgerEntries, null, 2));
        await req.tenantModels.VoucherLedgerEntry.bulkCreate(ledgerEntries, { transaction });
        console.log('✅ Ledger entries created successfully');
        
        // Update ledger balances for all affected ledgers
        console.log('💰 Updating ledger balances...');
        const uniqueLedgerIds = [...new Set(ledgerEntries.map(entry => entry.ledger_id))];
        for (const ledgerId of uniqueLedgerIds) {
          await updateLedgerBalance(req.tenantModels, ledgerId, transaction);
        }
        console.log('✅ Ledger balances updated successfully');
      }
      
      // If voucher is being posted immediately, apply inventory updates
      if (req.body.status === 'posted') {
        console.log('🏭 Applying inventory updates for posted voucher...');
        await this.applyInventoryUpdates(req, voucher, transaction);
        console.log('✅ Inventory updates applied successfully');
      }
      
      await transaction.commit();
      console.log('✅ Transaction committed successfully');
      
      // Fetch the complete voucher with items and ledger entries
      const completeVoucher = await req.tenantModels.Voucher.findByPk(voucher.id, {
        include: [
          { model: req.tenantModels.Ledger, as: 'partyLedger', attributes: ['id', 'ledger_name'] },
          { model: req.tenantModels.VoucherItem, as: 'items' },
          { model: req.tenantModels.VoucherLedgerEntry, as: 'ledgerEntries' }
        ]
      });
      
      console.log('📤 Returning complete voucher:', {
        id: completeVoucher.id,
        voucher_number: completeVoucher.voucher_number,
        items_count: completeVoucher.items?.length || 0,
        ledger_entries_count: completeVoucher.ledgerEntries?.length || 0
      });
      console.log('🎉 === VOUCHER CREATION COMPLETED ===\n');
      
      res.status(201).json({ data: completeVoucher });
    } catch (err) {
      await transaction.rollback();
      console.error('❌ === VOUCHER CREATION FAILED ===');
      console.error('💥 Error details:', {
        message: err.message,
        stack: err.stack,
        tenant_id: req.tenant_id,
        voucher_type: req.body.voucher_type
      });
      console.error('🔄 Transaction rolled back\n');
      logger.error('Error creating voucher:', err);
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const voucher = await req.tenantModels.Voucher.findByPk(req.params.id, {
        include: [
          { model: req.tenantModels.Ledger, as: 'partyLedger', attributes: ['id', 'ledger_name'] },
          { model: req.tenantModels.VoucherItem, as: 'items' }
        ]
      });
      
      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
      }
      
      res.json(voucher);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const voucher = await req.tenantModels.Voucher.findByPk(req.params.id);
      
      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
      }
      
      await voucher.update(req.body);
      res.json(voucher);
    } catch (err) {
      next(err);
    }
  },

  async post(req, res, next) {
    const transaction = await req.tenantModels.sequelize.transaction();
    
    try {
      const voucher = await req.tenantModels.Voucher.findByPk(req.params.id, {
        include: [
          { model: req.tenantModels.VoucherItem, as: 'items' },
          { model: req.tenantModels.Ledger, as: 'partyLedger', attributes: ['id', 'ledger_name'] }
        ],
        transaction
      });
      
      if (!voucher) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Voucher not found' });
      }
      
      if (voucher.status === 'posted') {
        await transaction.rollback();
        return res.status(400).json({ message: 'Voucher is already posted' });
      }
      
      // Apply inventory updates before posting
      await this.applyInventoryUpdates(req, voucher, transaction);
      
      // Update voucher status to posted
      await voucher.update({ status: 'posted' }, { transaction });
      
      // Update ledger balances for all ledger entries of this voucher
      console.log('💰 Updating ledger balances for posted voucher...');
      const ledgerEntries = await req.tenantModels.VoucherLedgerEntry.findAll({
        where: { voucher_id: voucher.id },
        transaction
      });
      
      const uniqueLedgerIds = [...new Set(ledgerEntries.map(entry => entry.ledger_id))];
      for (const ledgerId of uniqueLedgerIds) {
        await updateLedgerBalance(req.tenantModels, ledgerId, transaction);
      }
      console.log('✅ Ledger balances updated for posted voucher');
      
      await transaction.commit();
      
      logger.info(`Voucher ${voucher.voucher_number} posted successfully with inventory updates`);
      res.json({ message: 'Voucher posted successfully', voucher });
    } catch (err) {
      await transaction.rollback();
      logger.error('Error posting voucher:', err);
      next(err);
    }
  },

  async applyInventoryUpdates(req, voucher, transaction) {
    const voucherItems = voucher.items || [];
    
    if (voucherItems.length === 0) {
      logger.info(`No items to process for voucher ${voucher.voucher_number}`);
      return;
    }
    
    const voucherType = voucher.voucher_type?.toLowerCase();
    
    try {
      if (voucherType === 'purchase' || voucherType === 'purchase_invoice') {
        logger.info(`Applying purchase inventory updates for voucher ${voucher.voucher_number}`);
        await applyPurchaseInventory({ tenantModels: req.tenantModels }, voucher, voucherItems, transaction);
      } else if (voucherType === 'sales' || voucherType === 'sales_invoice') {
        logger.info(`Applying simplified sales inventory updates for voucher ${voucher.voucher_number}`);
        await applySalesInventoryAndGetCogs({ tenantModels: req.tenantModels }, voucher, voucherItems, transaction);
      } else {
        logger.info(`No inventory updates needed for voucher type: ${voucherType}`);
      }
    } catch (error) {
      logger.error(`Error applying inventory updates for voucher ${voucher.voucher_number}:`, error);
      throw error;
    }
  },

  async cancel(req, res, next) {
    try {
      const voucher = await req.tenantModels.Voucher.findByPk(req.params.id);
      
      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
      }
      
      if (voucher.status === 'cancelled') {
        return res.status(400).json({ message: 'Voucher is already cancelled' });
      }
      
      await voucher.update({ status: 'cancelled' });
      res.json({ message: 'Voucher cancelled successfully', voucher });
    } catch (err) {
      next(err);
    }
  },

  async convert(req, res, next) {
    const transaction = await req.tenantModels.sequelize.transaction();
    
    try {
      const { target_type } = req.body;
      
      if (!target_type) {
        return res.status(400).json({ 
          message: 'target_type is required',
          details: 'Please specify the target voucher type (e.g., sales_invoice)'
        });
      }

      // Validate target type
      const validTargetTypes = ['sales_invoice', 'tax_invoice'];
      if (!validTargetTypes.includes(target_type.toLowerCase())) {
        return res.status(400).json({ 
          message: 'Invalid target_type',
          details: `target_type must be one of: ${validTargetTypes.join(', ')}`
        });
      }

      // Check if source voucher exists
      const sourceVoucher = await req.tenantModels.Voucher.findByPk(req.params.id, {
        include: [
          { model: req.tenantModels.VoucherItem, as: 'items' }
        ],
        transaction
      });
      
      if (!sourceVoucher) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Voucher not found' });
      }

      // Validate source voucher type
      const validSourceTypes = ['proforma_invoice', 'delivery_challan'];
      if (!validSourceTypes.includes(sourceVoucher.voucher_type.toLowerCase())) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: 'Invalid source voucher type',
          details: `Only ${validSourceTypes.join(' and ')} can be converted to sales invoice`
        });
      }

      // Check if already converted
      if (sourceVoucher.converted_to_invoice_id) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: 'Voucher has already been converted',
          details: `This voucher was already converted to invoice ID: ${sourceVoucher.converted_to_invoice_id}`
        });
      }

      // Import voucher service
      const voucherService = require('../services/voucherService');
      
      // Convert the voucher
      const convertedVoucher = await voucherService.convertVoucher(
        req.params.id,
        target_type,
        { 
          tenantModels: req.tenantModels, 
          masterModels: req.masterModels,
          company: req.company,
          tenant_id: req.tenant_id
        }
      );

      await transaction.commit();
      
      logger.info(`Voucher ${sourceVoucher.voucher_number} converted to ${target_type} successfully`);
      
      res.status(201).json({ 
        success: true,
        message: 'Voucher converted successfully',
        data: convertedVoucher,
        source_voucher_id: req.params.id,
        converted_voucher_id: convertedVoucher.id
      });
    } catch (err) {
      await transaction.rollback();
      logger.error('Error converting voucher:', err);
      next(err);
    }
  }
};
