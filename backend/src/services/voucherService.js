const GSTCalculationService = require('./gstCalculationService');
const NumberingService = require('./numberingService');
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

async function getOrCreateSystemLedger({ tenantModels, masterModels, tenant_id }, { ledgerCode, ledgerName, groupCode }) {
  // Ensure tenant_id is available
  if (!tenant_id) {
    throw new Error('tenant_id is required for creating system ledgers');
  }

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
    tenant_id: tenant_id, // Ensure tenant_id is set
  });
}

class VoucherService {
  /**
   * Create a new voucher with advanced numbering integration
   * @param {Object} ctx - Context containing tenantModels, masterModels, company, tenant_id
   * @param {Object} voucherData - Voucher data
   * @returns {Promise<Object>} Created voucher with items and ledger entries
   */
  async createVoucher(ctx, voucherData) {
    const { tenantModels, masterModels, company, tenant_id } = ctx;
    const transaction = await tenantModels.sequelize.transaction();
    
    try {
      logger.info(`Creating voucher of type: ${voucherData.voucher_type}`);
      
      // Validate voucher data
      await this.validateVoucherData(voucherData, ctx);
      
      // Generate voucher number using NumberingService
      let voucherNumber = voucherData.voucher_number;
      if (!voucherNumber) {
        // Set context for NumberingService
        NumberingService.context = { tenantModels };
        
        const numberResult = await NumberingService.generateVoucherNumber(
          tenant_id,
          voucherData.voucher_type,
          voucherData.series_id,
          voucherData.branch_id
        );
        voucherNumber = numberResult.voucherNumber;
        
        logger.info(`Generated voucher number: ${voucherNumber}`);
      }
      
      // Calculate GST amounts using GSTCalculationService
      let calculatedData = {};
      if (voucherData.items && voucherData.items.length > 0) {
        if (voucherData.voucher_type === 'sales' || voucherData.voucher_type === 'sales_invoice') {
          calculatedData = await this.createSalesInvoice(ctx, voucherData);
        } else if (voucherData.voucher_type === 'purchase' || voucherData.voucher_type === 'purchase_invoice') {
          calculatedData = await this.createPurchaseInvoice(ctx, voucherData);
        } else {
          // For other voucher types, use enhanced calculation with GST
          calculatedData = await this.calculateVoucherWithGST(ctx, voucherData);
        }
      }
      
      // Create voucher record
      const voucherRecord = {
        voucher_number: voucherNumber,
        voucher_type: voucherData.voucher_type,
        voucher_date: voucherData.voucher_date || new Date(),
        party_ledger_id: voucherData.party_ledger_id,
        place_of_supply: calculatedData.place_of_supply || voucherData.place_of_supply,
        is_reverse_charge: calculatedData.is_reverse_charge || voucherData.is_reverse_charge || false,
        subtotal: calculatedData.subtotal || voucherData.subtotal || 0,
        cgst_amount: calculatedData.cgst_amount || 0,
        sgst_amount: calculatedData.sgst_amount || 0,
        igst_amount: calculatedData.igst_amount || 0,
        cess_amount: calculatedData.cess_amount || 0,
        round_off: calculatedData.round_off || 0,
        total_amount: calculatedData.total_amount || voucherData.total_amount || 0,
        narration: voucherData.narration,
        reference_number: voucherData.reference_number,
        due_date: voucherData.due_date,
        status: voucherData.status || 'draft',
        tenant_id: tenant_id,
        created_by: voucherData.created_by,
      };
      
      const voucher = await tenantModels.Voucher.create(voucherRecord, { transaction });
      
      // Create voucher items
      if (calculatedData.items && calculatedData.items.length > 0) {
        const voucherItems = calculatedData.items.map(item => ({
          ...item,
          voucher_id: voucher.id,
          tenant_id: tenant_id,
        }));
        await tenantModels.VoucherItem.bulkCreate(voucherItems, { transaction });
      }
      
      // Create ledger entries
      if (calculatedData.ledger_entries && calculatedData.ledger_entries.length > 0) {
        const ledgerEntries = calculatedData.ledger_entries.map(entry => ({
          ...entry,
          voucher_id: voucher.id,
          tenant_id: tenant_id,
        }));
        await tenantModels.VoucherLedgerEntry.bulkCreate(ledgerEntries, { transaction });
      }
      
      await transaction.commit();
      
      // Return complete voucher with relations
      return await this.getVoucher(voucher.id, ctx);
      
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating voucher:', error);
      throw error;
    }
  }
  
  /**
   * Update existing voucher (only for draft status)
   * @param {string} voucherId - Voucher ID
   * @param {Object} updates - Update data
   * @param {Object} ctx - Context
   * @returns {Promise<Object>} Updated voucher
   */
  async updateVoucher(voucherId, updates, ctx) {
    const { tenantModels } = ctx;
    const transaction = await tenantModels.sequelize.transaction();
    
    try {
      const voucher = await tenantModels.Voucher.findByPk(voucherId, { transaction });
      
      if (!voucher) {
        throw new Error('Voucher not found');
      }
      
      if (voucher.status !== 'draft') {
        throw new Error('Only draft vouchers can be updated');
      }
      
      // Validate update data
      await this.validateVoucherData(updates, ctx, true);
      
      // Recalculate if items are updated
      let calculatedData = {};
      if (updates.items) {
        const voucherData = { ...voucher.toJSON(), ...updates };
        if (voucher.voucher_type === 'sales' || voucher.voucher_type === 'sales_invoice') {
          calculatedData = await this.createSalesInvoice(ctx, voucherData);
        } else if (voucher.voucher_type === 'purchase' || voucher.voucher_type === 'purchase_invoice') {
          calculatedData = await this.createPurchaseInvoice(ctx, voucherData);
        } else {
          calculatedData = await this.calculateBasicVoucher(ctx, voucherData);
        }
        
        // Update voucher with calculated amounts
        Object.assign(updates, {
          subtotal: calculatedData.subtotal,
          cgst_amount: calculatedData.cgst_amount,
          sgst_amount: calculatedData.sgst_amount,
          igst_amount: calculatedData.igst_amount,
          cess_amount: calculatedData.cess_amount,
          round_off: calculatedData.round_off,
          total_amount: calculatedData.total_amount,
        });
        
        // Delete existing items and create new ones
        await tenantModels.VoucherItem.destroy({
          where: { voucher_id: voucherId },
          transaction
        });
        
        if (calculatedData.items && calculatedData.items.length > 0) {
          const voucherItems = calculatedData.items.map(item => ({
            ...item,
            voucher_id: voucherId,
            tenant_id: ctx.tenant_id,
          }));
          await tenantModels.VoucherItem.bulkCreate(voucherItems, { transaction });
        }
        
        // Delete existing ledger entries and create new ones
        await tenantModels.VoucherLedgerEntry.destroy({
          where: { voucher_id: voucherId },
          transaction
        });
        
        if (calculatedData.ledger_entries && calculatedData.ledger_entries.length > 0) {
          const ledgerEntries = calculatedData.ledger_entries.map(entry => ({
            ...entry,
            voucher_id: voucherId,
            tenant_id: ctx.tenant_id,
          }));
          await tenantModels.VoucherLedgerEntry.bulkCreate(ledgerEntries, { transaction });
        }
      }
      
      // Update voucher
      await voucher.update(updates, { transaction });
      
      await transaction.commit();
      
      return await this.getVoucher(voucherId, ctx);
      
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating voucher:', error);
      throw error;
    }
  }
  
  /**
   * Post voucher (finalize and create ledger entries)
   * @param {string} voucherId - Voucher ID
   * @param {Object} ctx - Context
   * @returns {Promise<Object>} Posted voucher
   */
  async postVoucher(voucherId, ctx) {
    const { tenantModels } = ctx;
    const transaction = await tenantModels.sequelize.transaction();
    
    try {
      const voucher = await tenantModels.Voucher.findByPk(voucherId, {
        include: [
          { model: tenantModels.VoucherItem, as: 'items' },
          { model: tenantModels.VoucherLedgerEntry, as: 'ledgerEntries' }
        ],
        transaction
      });
      
      if (!voucher) {
        throw new Error('Voucher not found');
      }
      
      if (voucher.status === 'posted') {
        throw new Error('Voucher is already posted');
      }
      
      if (voucher.status === 'cancelled') {
        throw new Error('Cannot post a cancelled voucher');
      }
      
      // Update voucher status to posted
      await voucher.update({ status: 'posted' }, { transaction });
      
      // Update ledger balances for all affected ledgers
      if (voucher.ledgerEntries && voucher.ledgerEntries.length > 0) {
        const uniqueLedgerIds = [...new Set(voucher.ledgerEntries.map(entry => entry.ledger_id))];
        for (const ledgerId of uniqueLedgerIds) {
          await this.updateLedgerBalance(tenantModels, ledgerId, transaction);
        }
      }
      
      await transaction.commit();
      
      logger.info(`Voucher ${voucher.voucher_number} posted successfully`);
      return await this.getVoucher(voucherId, ctx);
      
    } catch (error) {
      await transaction.rollback();
      logger.error('Error posting voucher:', error);
      throw error;
    }
  }
  
  /**
   * Cancel voucher (soft delete)
   * @param {string} voucherId - Voucher ID
   * @param {string} reason - Cancellation reason
   * @param {Object} ctx - Context
   * @returns {Promise<Object>} Cancelled voucher
   */
  async cancelVoucher(voucherId, reason, ctx) {
    const { tenantModels } = ctx;
    const transaction = await tenantModels.sequelize.transaction();
    
    try {
      const voucher = await tenantModels.Voucher.findByPk(voucherId, { transaction });
      
      if (!voucher) {
        throw new Error('Voucher not found');
      }
      
      if (voucher.status === 'cancelled') {
        throw new Error('Voucher is already cancelled');
      }
      
      // Update voucher status to cancelled (soft delete)
      await voucher.update({ 
        status: 'cancelled',
        narration: voucher.narration ? `${voucher.narration}\nCancelled: ${reason}` : `Cancelled: ${reason}`
      }, { transaction });
      
      await transaction.commit();
      
      logger.info(`Voucher ${voucher.voucher_number} cancelled: ${reason}`);
      return await this.getVoucher(voucherId, ctx);
      
    } catch (error) {
      await transaction.rollback();
      logger.error('Error cancelling voucher:', error);
      throw error;
    }
  }
  
  /**
   * Get voucher by ID with all relations
   * @param {string} voucherId - Voucher ID
   * @param {Object} ctx - Context
   * @returns {Promise<Object>} Voucher with relations
   */
  async getVoucher(voucherId, ctx) {
    const { tenantModels } = ctx;
    
    const voucher = await tenantModels.Voucher.findByPk(voucherId, {
      include: [
        { 
          model: tenantModels.Ledger, 
          as: 'partyLedger', 
          attributes: ['id', 'ledger_name', 'gstin', 'state'] 
        },
        { model: tenantModels.VoucherItem, as: 'items' },
        { model: tenantModels.VoucherLedgerEntry, as: 'ledgerEntries' }
      ]
    });
    
    if (!voucher) {
      throw new Error('Voucher not found');
    }
    
    return voucher;
  }
  
  /**
   * List vouchers with filters and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} ctx - Context
   * @returns {Promise<Object>} Paginated voucher list
   */
  async listVouchers(filters, ctx) {
    const { tenantModels, tenant_id } = ctx;
    const { 
      page = 1, 
      limit = 20, 
      voucher_type, 
      status, 
      startDate, 
      endDate,
      party_ledger_id,
      search 
    } = filters;
    
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = { tenant_id };
    
    if (voucher_type) where.voucher_type = voucher_type;
    if (status) where.status = status;
    if (party_ledger_id) where.party_ledger_id = party_ledger_id;
    
    if (startDate && endDate) {
      where.voucher_date = { [Op.between]: [startDate, endDate] };
    }
    
    if (search) {
      where[Op.or] = [
        { voucher_number: { [Op.iLike]: `%${search}%` } },
        { reference_number: { [Op.iLike]: `%${search}%` } },
        { narration: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const result = await tenantModels.Voucher.findAndCountAll({
      where,
      include: [
        { 
          model: tenantModels.Ledger, 
          as: 'partyLedger', 
          attributes: ['id', 'ledger_name'] 
        }
      ],
      limit: parseInt(limit, 10),
      offset,
      order: [['voucher_date', 'DESC'], ['voucher_number', 'DESC']],
    });
    
    return {
      data: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(result.count / parseInt(limit, 10)),
      },
    };
  }
  
  /**
   * Convert voucher from one type to another
   * @param {string} sourceVoucherId - Source voucher ID
   * @param {string} targetType - Target voucher type
   * @param {Object} ctx - Context
   * @returns {Promise<Object>} New converted voucher
   */
  async convertVoucher(sourceVoucherId, targetType, ctx) {
    const { tenantModels } = ctx;
    
    const sourceVoucher = await this.getVoucher(sourceVoucherId, ctx);
    
    if (!sourceVoucher) {
      throw new Error('Source voucher not found');
    }
    
    // Create new voucher data based on source
    const newVoucherData = {
      voucher_type: targetType,
      voucher_date: new Date(), // Use current date for conversion
      party_ledger_id: sourceVoucher.party_ledger_id,
      place_of_supply: sourceVoucher.place_of_supply,
      is_reverse_charge: sourceVoucher.is_reverse_charge,
      narration: `Converted from ${sourceVoucher.voucher_type} ${sourceVoucher.voucher_number}`,
      reference_number: sourceVoucher.voucher_number,
      items: sourceVoucher.items ? sourceVoucher.items.map(item => ({
        inventory_item_id: item.inventory_item_id,
        warehouse_id: item.warehouse_id,
        item_code: item.item_code,
        item_description: item.item_description,
        hsn_sac_code: item.hsn_sac_code,
        uqc: item.uqc,
        quantity: item.quantity,
        rate: item.rate,
        discount_percent: item.discount_percent,
        gst_rate: item.gst_rate,
      })) : [],
    };
    
    return await this.createVoucher(ctx, newVoucherData);
  }
  
  /**
   * Update ledger balance based on ledger entries
   * @private
   */
  async updateLedgerBalance(tenantModels, ledgerId, transaction) {
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
  
  /**
   * Calculate basic voucher amounts (for non-sales/purchase vouchers)
   * @private
   */
  async calculateBasicVoucher(ctx, voucherData) {
    const { items = [] } = voucherData;
    
    let subtotal = 0;
    const processedItems = items.map(item => {
      const quantity = toNum(item.quantity, 1);
      const rate = toNum(item.rate, 0);
      const amount = quantity * rate;
      subtotal += amount;
      
      return {
        inventory_item_id: item.inventory_item_id || null,
        warehouse_id: item.warehouse_id || null,
        item_code: item.item_code || null,
        item_description: item.item_description || item.description || item.item_name || 'Item',
        hsn_sac_code: item.hsn_sac_code || item.hsn || null,
        uqc: item.uqc || null,
        quantity,
        rate,
        discount_percent: 0,
        discount_amount: 0,
        taxable_amount: amount,
        gst_rate: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 0,
        cess_amount: 0,
        total_amount: amount,
      };
    });
    
    return {
      subtotal,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      cess_amount: 0,
      round_off: 0,
      total_amount: subtotal,
      items: processedItems,
      ledger_entries: [], // Basic vouchers don't auto-generate ledger entries
    };
  }
  
  /**
   * Calculate voucher with GST using GSTCalculationService
   * @param {Object} ctx - Context
   * @param {Object} voucherData - Voucher data
   * @returns {Promise<Object>} Calculated voucher data
   */
  async calculateVoucherWithGST(ctx, voucherData) {
    const { tenantModels, company } = ctx;
    const { party_ledger_id, items = [], place_of_supply, is_reverse_charge = false } = voucherData;

    // Get party ledger for state information
    const partyLedger = await tenantModels.Ledger.findByPk(party_ledger_id);
    if (!partyLedger) throw new Error('Party ledger not found');

    const supplierState = company?.state || 'Maharashtra';
    const pos = place_of_supply || partyLedger?.state || supplierState;

    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalCess = 0;

    const processedItems = items.map((item) => {
      const quantity = toNum(item.quantity, 1);
      const rate = toNum(item.rate, 0);
      const discountPercent = toNum(item.discount_percent, 0);
      const discountAmount = (quantity * rate * discountPercent) / 100;
      const taxableAmount = quantity * rate - discountAmount;

      subtotal += taxableAmount;

      const gstRate = toNum(item.gst_rate, 0);
      
      // Use GSTCalculationService for GST calculation
      const gst = GSTCalculationService.calculateItemGST(
        taxableAmount, 
        gstRate, 
        supplierState, 
        pos, 
        is_reverse_charge
      );

      totalCGST += gst.cgstAmount;
      totalSGST += gst.sgstAmount;
      totalIGST += gst.igstAmount;
      totalCess += toNum(item.cess_amount, 0);

      const lineTotal = taxableAmount + gst.totalGSTAmount + toNum(item.cess_amount, 0);
      
      return {
        inventory_item_id: item.inventory_item_id || null,
        warehouse_id: item.warehouse_id || null,
        item_code: item.item_code || null,
        item_description: item.item_description || item.description || item.item_name || 'Item',
        hsn_sac_code: item.hsn_sac_code || item.hsn || null,
        uqc: item.uqc || null,
        quantity,
        rate,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        taxable_amount: taxableAmount,
        gst_rate: gstRate,
        cgst_amount: gst.cgstAmount,
        sgst_amount: gst.sgstAmount,
        igst_amount: gst.igstAmount,
        cess_amount: toNum(item.cess_amount, 0),
        total_amount: lineTotal,
      };
    });

    const totalTax = totalCGST + totalSGST + totalIGST + totalCess;
    const grandTotal = subtotal + totalTax;
    const roundedTotal = GSTCalculationService.roundOff(grandTotal);
    const roundOffAmount = roundedTotal - grandTotal;

    // Generate ledger entries for this voucher type
    const ledgerEntries = await this.generateLedgerEntries(ctx, {
      voucher_type: voucherData.voucher_type,
      party_ledger_id,
      partyLedger,
      subtotal,
      cgst_amount: totalCGST,
      sgst_amount: totalSGST,
      igst_amount: totalIGST,
      cess_amount: totalCess,
      round_off: roundOffAmount,
      total_amount: roundedTotal,
      is_reverse_charge,
      narration: voucherData.narration
    });

    return {
      subtotal,
      cgst_amount: totalCGST,
      sgst_amount: totalSGST,
      igst_amount: totalIGST,
      cess_amount: totalCess,
      round_off: roundOffAmount,
      total_amount: roundedTotal,
      place_of_supply: pos,
      is_reverse_charge: !!is_reverse_charge,
      items: processedItems,
      ledger_entries: ledgerEntries,
    };
  }
  
  /**
   * Generate ledger entries for different invoice types
   * @param {Object} ctx - Context
   * @param {Object} voucherData - Voucher calculation data
   * @returns {Promise<Array>} Array of ledger entries
   */
  async generateLedgerEntries(ctx, voucherData) {
    const { tenantModels, masterModels, tenant_id } = ctx;
    const {
      voucher_type,
      party_ledger_id,
      partyLedger,
      subtotal,
      cgst_amount,
      sgst_amount,
      igst_amount,
      cess_amount,
      round_off,
      total_amount,
      is_reverse_charge,
      narration
    } = voucherData;

    const ledgerEntries = [];
    const voucherTypeLower = voucher_type.toLowerCase();

    try {
      // Handle different voucher types
      switch (voucherTypeLower) {
        case 'sales':
        case 'sales_invoice':
        case 'tax_invoice':
        case 'retail_invoice':
          await this.generateSalesLedgerEntries(ctx, voucherData, ledgerEntries);
          break;
          
        case 'purchase':
        case 'purchase_invoice':
          await this.generatePurchaseLedgerEntries(ctx, voucherData, ledgerEntries);
          break;
          
        case 'bill_of_supply':
          await this.generateBillOfSupplyLedgerEntries(ctx, voucherData, ledgerEntries);
          break;
          
        case 'export_invoice':
          await this.generateExportInvoiceLedgerEntries(ctx, voucherData, ledgerEntries);
          break;
          
        case 'delivery_challan':
          // Delivery Challan doesn't create sales ledger entries
          await this.generateDeliveryChallanLedgerEntries(ctx, voucherData, ledgerEntries);
          break;
          
        case 'proforma_invoice':
          // Proforma Invoice doesn't create any ledger entries
          break;
          
        default:
          // For other voucher types, create basic entries
          await this.generateBasicLedgerEntries(ctx, voucherData, ledgerEntries);
          break;
      }

      return ledgerEntries;
      
    } catch (error) {
      logger.error('Error generating ledger entries:', error);
      throw error;
    }
  }
  
  /**
   * Generate sales ledger entries
   * @private
   */
  async generateSalesLedgerEntries(ctx, voucherData, ledgerEntries) {
    const { tenantModels, masterModels, tenant_id } = ctx;
    const {
      party_ledger_id,
      partyLedger,
      subtotal,
      cgst_amount,
      sgst_amount,
      igst_amount,
      cess_amount,
      round_off,
      total_amount,
      narration
    } = voucherData;

    // Customer debit entry
    ledgerEntries.push({
      ledger_id: party_ledger_id,
      debit_amount: total_amount,
      credit_amount: 0,
      narration: narration || `Sales invoice to ${partyLedger.ledger_name}`,
    });

    // Sales credit entry
    const salesLedger = await getOrCreateSystemLedger(
      { tenantModels, masterModels, tenant_id },
      { ledgerCode: 'SALES', ledgerName: 'Sales', groupCode: 'SAL' }
    );
    ledgerEntries.push({
      ledger_id: salesLedger.id,
      debit_amount: 0,
      credit_amount: subtotal,
      narration: 'Sales revenue',
    });

    // GST output ledger entries
    await this.addGSTOutputLedgerEntries(ctx, {
      cgst_amount,
      sgst_amount,
      igst_amount,
      cess_amount
    }, ledgerEntries);

    // Round-off entry
    await this.addRoundOffLedgerEntry(ctx, round_off, ledgerEntries);
  }
  
  /**
   * Generate purchase ledger entries
   * @private
   */
  async generatePurchaseLedgerEntries(ctx, voucherData, ledgerEntries) {
    const { tenantModels, masterModels, tenant_id } = ctx;
    const {
      party_ledger_id,
      partyLedger,
      subtotal,
      cgst_amount,
      sgst_amount,
      igst_amount,
      cess_amount,
      round_off,
      total_amount,
      is_reverse_charge,
      narration
    } = voucherData;

    // Inventory debit entry
    const inventoryLedger = await getOrCreateSystemLedger(
      { tenantModels, masterModels, tenant_id },
      { ledgerCode: 'INVENTORY', ledgerName: 'Stock in Hand', groupCode: 'INV' }
    );
    ledgerEntries.push({
      ledger_id: inventoryLedger.id,
      debit_amount: subtotal,
      credit_amount: 0,
      narration: 'Inventory purchase',
    });

    // GST input ledger entries (different for reverse charge)
    if (is_reverse_charge) {
      await this.addGSTReverseChargeLedgerEntries(ctx, {
        cgst_amount,
        sgst_amount,
        igst_amount,
        cess_amount
      }, ledgerEntries);
    } else {
      await this.addGSTInputLedgerEntries(ctx, {
        cgst_amount,
        sgst_amount,
        igst_amount,
        cess_amount
      }, ledgerEntries);
    }

    // Supplier credit entry
    ledgerEntries.push({
      ledger_id: party_ledger_id,
      debit_amount: 0,
      credit_amount: total_amount,
      narration: narration || `Purchase invoice from ${partyLedger.ledger_name}`,
    });

    // Round-off entry
    await this.addRoundOffLedgerEntry(ctx, round_off, ledgerEntries);
  }
  
  /**
   * Generate Bill of Supply ledger entries (no GST)
   * @private
   */
  async generateBillOfSupplyLedgerEntries(ctx, voucherData, ledgerEntries) {
    const { tenantModels, masterModels, tenant_id } = ctx;
    const {
      party_ledger_id,
      partyLedger,
      subtotal,
      round_off,
      total_amount,
      narration
    } = voucherData;

    // Customer debit entry
    ledgerEntries.push({
      ledger_id: party_ledger_id,
      debit_amount: total_amount,
      credit_amount: 0,
      narration: narration || `Bill of Supply to ${partyLedger.ledger_name}`,
    });

    // Sales credit entry (no GST for Bill of Supply)
    const salesLedger = await getOrCreateSystemLedger(
      { tenantModels, masterModels, tenant_id },
      { ledgerCode: 'SALES', ledgerName: 'Sales', groupCode: 'SAL' }
    );
    ledgerEntries.push({
      ledger_id: salesLedger.id,
      debit_amount: 0,
      credit_amount: subtotal,
      narration: 'Bill of Supply revenue',
    });

    // Round-off entry
    await this.addRoundOffLedgerEntry(ctx, round_off, ledgerEntries);
  }
  
  /**
   * Generate Export Invoice ledger entries
   * @private
   */
  async generateExportInvoiceLedgerEntries(ctx, voucherData, ledgerEntries) {
    const { tenantModels, masterModels, tenant_id } = ctx;
    const {
      party_ledger_id,
      partyLedger,
      subtotal,
      cgst_amount,
      sgst_amount,
      igst_amount,
      cess_amount,
      round_off,
      total_amount,
      has_lut,
      narration
    } = voucherData;

    // Customer debit entry
    ledgerEntries.push({
      ledger_id: party_ledger_id,
      debit_amount: total_amount,
      credit_amount: 0,
      narration: narration || `Export invoice to ${partyLedger.ledger_name}`,
    });

    // Export sales credit entry
    const exportSalesLedger = await getOrCreateSystemLedger(
      { tenantModels, masterModels, tenant_id },
      { ledgerCode: 'EXPORT_SALES', ledgerName: 'Export Sales', groupCode: 'SAL' }
    );
    ledgerEntries.push({
      ledger_id: exportSalesLedger.id,
      debit_amount: 0,
      credit_amount: subtotal,
      narration: 'Export sales revenue',
    });

    // GST entries (only if no LUT)
    if (!has_lut && (cgst_amount > 0 || sgst_amount > 0 || igst_amount > 0)) {
      await this.addGSTOutputLedgerEntries(ctx, {
        cgst_amount,
        sgst_amount,
        igst_amount,
        cess_amount
      }, ledgerEntries);
    }

    // Round-off entry
    await this.addRoundOffLedgerEntry(ctx, round_off, ledgerEntries);
  }
  
  /**
   * Generate Delivery Challan ledger entries (no sales entries)
   * @private
   */
  async generateDeliveryChallanLedgerEntries(ctx, voucherData, ledgerEntries) {
    // Delivery Challan doesn't create any ledger entries
    // It only tracks inventory movement without affecting accounts
    return;
  }
  
  /**
   * Generate basic ledger entries for other voucher types
   * @private
   */
  async generateBasicLedgerEntries(ctx, voucherData, ledgerEntries) {
    const {
      party_ledger_id,
      partyLedger,
      total_amount,
      narration
    } = voucherData;

    // Basic debit/credit entries
    ledgerEntries.push({
      ledger_id: party_ledger_id,
      debit_amount: total_amount,
      credit_amount: 0,
      narration: narration || `Transaction with ${partyLedger.ledger_name}`,
    });
  }
  
  /**
   * Add GST output ledger entries
   * @private
   */
  async addGSTOutputLedgerEntries(ctx, gstAmounts, ledgerEntries) {
    const { tenantModels, masterModels, tenant_id } = ctx;
    const { cgst_amount, sgst_amount, igst_amount, cess_amount } = gstAmounts;

    if (cgst_amount > 0) {
      const cgstLedger = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'CGST_OUTPUT', ledgerName: 'CGST Output', groupCode: 'DT' }
      );
      ledgerEntries.push({
        ledger_id: cgstLedger.id,
        debit_amount: 0,
        credit_amount: cgst_amount,
        narration: 'CGST Output',
      });
    }

    if (sgst_amount > 0) {
      const sgstLedger = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'SGST_OUTPUT', ledgerName: 'SGST Output', groupCode: 'DT' }
      );
      ledgerEntries.push({
        ledger_id: sgstLedger.id,
        debit_amount: 0,
        credit_amount: sgst_amount,
        narration: 'SGST Output',
      });
    }

    if (igst_amount > 0) {
      const igstLedger = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'IGST_OUTPUT', ledgerName: 'IGST Output', groupCode: 'DT' }
      );
      ledgerEntries.push({
        ledger_id: igstLedger.id,
        debit_amount: 0,
        credit_amount: igst_amount,
        narration: 'IGST Output',
      });
    }

    if (cess_amount > 0) {
      const cessLedger = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'CESS_OUTPUT', ledgerName: 'Cess Output', groupCode: 'DT' }
      );
      ledgerEntries.push({
        ledger_id: cessLedger.id,
        debit_amount: 0,
        credit_amount: cess_amount,
        narration: 'Cess Output',
      });
    }
  }
  
  /**
   * Add GST input ledger entries
   * @private
   */
  async addGSTInputLedgerEntries(ctx, gstAmounts, ledgerEntries) {
    const { tenantModels, masterModels, tenant_id } = ctx;
    const { cgst_amount, sgst_amount, igst_amount, cess_amount } = gstAmounts;

    if (cgst_amount > 0) {
      const cgstLedger = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'CGST_INPUT', ledgerName: 'CGST Input', groupCode: 'CA' }
      );
      ledgerEntries.push({
        ledger_id: cgstLedger.id,
        debit_amount: cgst_amount,
        credit_amount: 0,
        narration: 'CGST Input',
      });
    }

    if (sgst_amount > 0) {
      const sgstLedger = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'SGST_INPUT', ledgerName: 'SGST Input', groupCode: 'CA' }
      );
      ledgerEntries.push({
        ledger_id: sgstLedger.id,
        debit_amount: sgst_amount,
        credit_amount: 0,
        narration: 'SGST Input',
      });
    }

    if (igst_amount > 0) {
      const igstLedger = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'IGST_INPUT', ledgerName: 'IGST Input', groupCode: 'CA' }
      );
      ledgerEntries.push({
        ledger_id: igstLedger.id,
        debit_amount: igst_amount,
        credit_amount: 0,
        narration: 'IGST Input',
      });
    }

    if (cess_amount > 0) {
      const cessLedger = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'CESS_INPUT', ledgerName: 'Cess Input', groupCode: 'CA' }
      );
      ledgerEntries.push({
        ledger_id: cessLedger.id,
        debit_amount: cess_amount,
        credit_amount: 0,
        narration: 'Cess Input',
      });
    }
  }
  
  /**
   * Add GST reverse charge ledger entries
   * @private
   */
  async addGSTReverseChargeLedgerEntries(ctx, gstAmounts, ledgerEntries) {
    const { tenantModels, masterModels, tenant_id } = ctx;
    const { cgst_amount, sgst_amount, igst_amount, cess_amount } = gstAmounts;

    // For reverse charge, create both output (liability) and input (asset) entries
    if (cgst_amount > 0) {
      // RCM Output (liability)
      const cgstRcmOutput = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'CGST_RCM_OUTPUT', ledgerName: 'GST RCM Output - CGST', groupCode: 'DT' }
      );
      ledgerEntries.push({
        ledger_id: cgstRcmOutput.id,
        debit_amount: 0,
        credit_amount: cgst_amount,
        narration: 'CGST RCM Output',
      });
      
      // RCM Input (asset/ITC)
      const cgstRcmInput = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'CGST_RCM_INPUT', ledgerName: 'GST RCM Input - CGST', groupCode: 'CA' }
      );
      ledgerEntries.push({
        ledger_id: cgstRcmInput.id,
        debit_amount: cgst_amount,
        credit_amount: 0,
        narration: 'CGST RCM Input',
      });
    }

    if (sgst_amount > 0) {
      // RCM Output (liability)
      const sgstRcmOutput = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'SGST_RCM_OUTPUT', ledgerName: 'GST RCM Output - SGST', groupCode: 'DT' }
      );
      ledgerEntries.push({
        ledger_id: sgstRcmOutput.id,
        debit_amount: 0,
        credit_amount: sgst_amount,
        narration: 'SGST RCM Output',
      });
      
      // RCM Input (asset/ITC)
      const sgstRcmInput = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'SGST_RCM_INPUT', ledgerName: 'GST RCM Input - SGST', groupCode: 'CA' }
      );
      ledgerEntries.push({
        ledger_id: sgstRcmInput.id,
        debit_amount: sgst_amount,
        credit_amount: 0,
        narration: 'SGST RCM Input',
      });
    }

    if (igst_amount > 0) {
      // RCM Output (liability)
      const igstRcmOutput = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'IGST_RCM_OUTPUT', ledgerName: 'GST RCM Output - IGST', groupCode: 'DT' }
      );
      ledgerEntries.push({
        ledger_id: igstRcmOutput.id,
        debit_amount: 0,
        credit_amount: igst_amount,
        narration: 'IGST RCM Output',
      });
      
      // RCM Input (asset/ITC)
      const igstRcmInput = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'IGST_RCM_INPUT', ledgerName: 'GST RCM Input - IGST', groupCode: 'CA' }
      );
      ledgerEntries.push({
        ledger_id: igstRcmInput.id,
        debit_amount: igst_amount,
        credit_amount: 0,
        narration: 'IGST RCM Input',
      });
    }
  }
  
  /**
   * Add round-off ledger entry
   * @private
   */
  async addRoundOffLedgerEntry(ctx, roundOffAmount, ledgerEntries) {
    if (Math.abs(roundOffAmount) > 0.000001) {
      const { tenantModels, masterModels, tenant_id } = ctx;
      
      const roundOffLedger = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'ROUND_OFF', ledgerName: 'Round Off', groupCode: 'IND_EXP' }
      );
      
      ledgerEntries.push({
        ledger_id: roundOffLedger.id,
        debit_amount: roundOffAmount > 0 ? roundOffAmount : 0,
        credit_amount: roundOffAmount < 0 ? Math.abs(roundOffAmount) : 0,
        narration: 'Round off',
      });
    }
  }
  
  /**
   * Validate voucher data
   * @param {Object} voucherData - Voucher data to validate
   * @param {Object} ctx - Context
   * @param {boolean} isUpdate - Whether this is an update operation
   * @throws {Error} Validation error
   */
  async validateVoucherData(voucherData, ctx, isUpdate = false) {
    const errors = [];
    
    // Basic required fields validation
    if (!isUpdate) {
      if (!voucherData.voucher_type) {
        errors.push('Voucher type is required');
      }
      
      if (!voucherData.party_ledger_id) {
        errors.push('Party ledger is required');
      }
    }
    
    // Validate invoice date
    if (voucherData.voucher_date) {
      const validationResult = this.validateInvoiceDate(voucherData.voucher_date);
      if (!validationResult.isValid) {
        errors.push(validationResult.error);
      }
    }
    
    // Validate party details
    if (voucherData.party_ledger_id) {
      try {
        await this.validatePartyDetails(voucherData.party_ledger_id, ctx);
      } catch (error) {
        errors.push(error.message);
      }
    }
    
    // Validate items
    if (voucherData.items && voucherData.items.length > 0) {
      const itemValidationResult = this.validateItems(voucherData.items, ctx);
      if (!itemValidationResult.isValid) {
        errors.push(...itemValidationResult.errors);
      }
    }
    
    // Validate voucher type specific rules
    await this.validateVoucherTypeRules(voucherData, ctx, errors);
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
  
  /**
   * Validate invoice date (not future, within FY)
   * @param {Date|string} invoiceDate - Invoice date to validate
   * @returns {Object} Validation result
   */
  validateInvoiceDate(invoiceDate) {
    const date = new Date(invoiceDate);
    const now = new Date();
    
    // Check if date is in future
    if (date > now) {
      return {
        isValid: false,
        error: 'Invoice date cannot be in the future'
      };
    }
    
    // Check if date is within current or previous financial year
    const currentFY = this.getCurrentFinancialYear();
    const previousFY = this.getPreviousFinancialYear();
    
    const isInCurrentFY = date >= currentFY.start && date <= currentFY.end;
    const isInPreviousFY = date >= previousFY.start && date <= previousFY.end;
    
    if (!isInCurrentFY && !isInPreviousFY) {
      return {
        isValid: false,
        error: 'Invoice date must be within current or previous financial year'
      };
    }
    
    return { isValid: true };
  }
  
  /**
   * Validate party details with GSTIN validation
   * @param {string} partyLedgerId - Party ledger ID
   * @param {Object} ctx - Context
   * @throws {Error} Validation error
   */
  async validatePartyDetails(partyLedgerId, ctx) {
    const { tenantModels } = ctx;
    
    const partyLedger = await tenantModels.Ledger.findByPk(partyLedgerId);
    if (!partyLedger) {
      throw new Error('Party ledger not found');
    }
    
    // Validate GSTIN if provided
    if (partyLedger.gstin) {
      const isValidGSTIN = GSTCalculationService.validateGSTIN(partyLedger.gstin);
      if (!isValidGSTIN) {
        throw new Error(`Invalid GSTIN format for party: ${partyLedger.gstin}`);
      }
    }
    
    return true;
  }
  
  /**
   * Validate items (HSN codes, quantities, rates)
   * @param {Array} items - Items to validate
   * @param {Object} ctx - Context
   * @returns {Object} Validation result
   */
  validateItems(items, ctx) {
    const errors = [];
    const { company } = ctx;
    
    // Check if HSN codes are required (for businesses with turnover > ₹5 crores)
    const requiresDetailedHSN = company?.turnover > 50000000; // ₹5 crores
    
    items.forEach((item, index) => {
      // Validate quantity
      const quantity = toNum(item.quantity, 0);
      if (quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      
      // Validate rate
      const rate = toNum(item.rate, 0);
      if (rate < 0) {
        errors.push(`Item ${index + 1}: Rate cannot be negative`);
      }
      
      // Validate HSN code
      if (item.hsn_sac_code) {
        const hsnCode = item.hsn_sac_code.toString();
        if (requiresDetailedHSN && hsnCode.length < 6) {
          errors.push(`Item ${index + 1}: HSN code must be at least 6 digits for your business turnover`);
        }
        
        // Basic HSN format validation (should be numeric)
        if (!/^\d+$/.test(hsnCode)) {
          errors.push(`Item ${index + 1}: HSN code must contain only digits`);
        }
      } else if (requiresDetailedHSN) {
        errors.push(`Item ${index + 1}: HSN code is required for your business turnover`);
      }
      
      // Validate GST rate
      const gstRate = toNum(item.gst_rate, 0);
      const validGSTRates = [0, 5, 12, 18, 28];
      if (!validGSTRates.includes(gstRate)) {
        errors.push(`Item ${index + 1}: Invalid GST rate. Valid rates are: ${validGSTRates.join(', ')}%`);
      }
      
      // Validate item description
      if (!item.item_description && !item.description && !item.item_name) {
        errors.push(`Item ${index + 1}: Item description is required`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate voucher type specific rules
   * @param {Object} voucherData - Voucher data
   * @param {Object} ctx - Context
   * @param {Array} errors - Errors array to append to
   */
  async validateVoucherTypeRules(voucherData, ctx, errors) {
    const voucherType = voucherData.voucher_type?.toLowerCase();
    
    switch (voucherType) {
      case 'bill_of_supply':
        // Bill of Supply should only have exempt/nil-rated items
        if (voucherData.items) {
          const taxableItems = voucherData.items.filter(item => toNum(item.gst_rate, 0) > 0);
          if (taxableItems.length > 0) {
            errors.push('Bill of Supply cannot contain taxable items');
          }
        }
        break;
        
      case 'export_invoice':
        // Export Invoice requires shipping details
        if (!voucherData.shipping_bill_number) {
          errors.push('Export Invoice requires shipping bill number');
        }
        if (!voucherData.shipping_bill_date) {
          errors.push('Export Invoice requires shipping bill date');
        }
        if (!voucherData.port_of_loading) {
          errors.push('Export Invoice requires port of loading');
        }
        if (!voucherData.destination_country) {
          errors.push('Export Invoice requires destination country');
        }
        if (voucherData.place_of_supply !== 'Export') {
          errors.push('Export Invoice must have place of supply as "Export"');
        }
        break;
        
      case 'delivery_challan':
        // Delivery Challan requires purpose
        const validPurposes = ['job_work', 'stock_transfer', 'sample'];
        if (!voucherData.purpose || !validPurposes.includes(voucherData.purpose)) {
          errors.push(`Delivery Challan requires purpose. Valid values: ${validPurposes.join(', ')}`);
        }
        break;
        
      case 'retail_invoice':
        // High value retail invoices require customer GSTIN
        const totalAmount = toNum(voucherData.total_amount, 0);
        if (totalAmount > 50000) {
          const { tenantModels } = ctx;
          if (voucherData.party_ledger_id) {
            const partyLedger = await tenantModels.Ledger.findByPk(voucherData.party_ledger_id);
            if (!partyLedger?.gstin) {
              errors.push('Customer GSTIN is required for invoices above ₹50,000');
            }
          }
        }
        break;
    }
  }
  
  /**
   * Get current financial year
   * @returns {Object} Financial year start and end dates
   */
  getCurrentFinancialYear() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based
    
    let fyStart, fyEnd;
    
    if (currentMonth >= 3) { // April onwards
      fyStart = new Date(currentYear, 3, 1); // April 1st
      fyEnd = new Date(currentYear + 1, 2, 31); // March 31st next year
    } else { // January to March
      fyStart = new Date(currentYear - 1, 3, 1); // April 1st previous year
      fyEnd = new Date(currentYear, 2, 31); // March 31st current year
    }
    
    return { start: fyStart, end: fyEnd };
  }
  
  /**
   * Get previous financial year
   * @returns {Object} Previous financial year start and end dates
   */
  getPreviousFinancialYear() {
    const currentFY = this.getCurrentFinancialYear();
    return {
      start: new Date(currentFY.start.getFullYear() - 1, 3, 1),
      end: new Date(currentFY.end.getFullYear() - 1, 2, 31)
    };
  }
  async createSalesInvoice(ctx, invoiceData) {
    const { tenantModels, masterModels, company, tenant_id } = ctx;
    const { party_ledger_id, items = [], place_of_supply, is_reverse_charge = false, narration } = invoiceData || {};

    const partyLedger = await tenantModels.Ledger.findByPk(party_ledger_id);
    if (!partyLedger) throw new Error('Party ledger not found');

    const supplierState = company?.state || partyLedger?.state || 'Maharashtra';
    const pos = place_of_supply || partyLedger?.state || supplierState;

    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalCess = 0;

    const processedItems = (items || []).map((item) => {
      const quantity = toNum(item.quantity, 1);
      const rate = toNum(item.rate, 0);
      const discountPercent = toNum(item.discount_percent, 0);
      const discountAmount = (quantity * rate * discountPercent) / 100;
      const taxableAmount = quantity * rate - discountAmount;

      subtotal += taxableAmount;

      const gstRate = toNum(item.gst_rate, 18);
      const gst = GSTCalculationService.calculateItemGST(taxableAmount, gstRate, supplierState, pos);

      totalCGST += gst.cgstAmount;
      totalSGST += gst.sgstAmount;
      totalIGST += gst.igstAmount;
      totalCess += toNum(item.cess_amount, 0);

      const lineTotal = taxableAmount + gst.totalGSTAmount + toNum(item.cess_amount, 0);
      return {
        inventory_item_id: item.inventory_item_id || null,
        warehouse_id: item.warehouse_id || null,
        item_code: item.item_code || null,
        item_description: item.item_description || item.description || item.item_name || 'Item',
        hsn_sac_code: item.hsn_sac_code || item.hsn || null,
        uqc: item.uqc || null,
        quantity,
        rate,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        taxable_amount: taxableAmount,
        gst_rate: gstRate,
        cgst_amount: gst.cgstAmount,
        sgst_amount: gst.sgstAmount,
        igst_amount: gst.igstAmount,
        cess_amount: toNum(item.cess_amount, 0),
        total_amount: lineTotal,
      };
    });

    const totalTax = totalCGST + totalSGST + totalIGST + totalCess;
    const grandTotal = subtotal + totalTax;
    const roundedTotal = GSTCalculationService.roundOff(grandTotal);
    const roundOffAmount = roundedTotal - grandTotal;

    const salesLedger = await getOrCreateSystemLedger(
      { tenantModels, masterModels, tenant_id },
      { ledgerCode: 'SALES', ledgerName: 'Sales', groupCode: 'SAL' }
    );

    const ledgerEntries = [
      {
        ledger_id: party_ledger_id,
        debit_amount: roundedTotal,
        credit_amount: 0,
        narration: narration || `Sales invoice to ${partyLedger.ledger_name}`,
      },
      {
        ledger_id: salesLedger.id,
        debit_amount: 0,
        credit_amount: subtotal,
        narration: 'Sales revenue',
      },
    ];

    if (totalCGST > 0) {
      const cgst = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'CGST', ledgerName: 'CGST', groupCode: 'DT' }
      );
      ledgerEntries.push({ ledger_id: cgst.id, debit_amount: 0, credit_amount: totalCGST, narration: 'CGST Output' });
    }
    if (totalSGST > 0) {
      const sgst = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'SGST', ledgerName: 'SGST', groupCode: 'DT' }
      );
      ledgerEntries.push({ ledger_id: sgst.id, debit_amount: 0, credit_amount: totalSGST, narration: 'SGST Output' });
    }
    if (totalIGST > 0) {
      const igst = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'IGST', ledgerName: 'IGST', groupCode: 'DT' }
      );
      ledgerEntries.push({ ledger_id: igst.id, debit_amount: 0, credit_amount: totalIGST, narration: 'IGST Output' });
    }

    // Default round-off handling (computed always; posted only if non-zero)
    if (Math.abs(roundOffAmount) > 0.000001) {
      const roundOffLedger = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'ROUND_OFF', ledgerName: 'Round Off', groupCode: 'IND_EXP' }
      );
      ledgerEntries.push({
        ledger_id: roundOffLedger.id,
        debit_amount: roundOffAmount > 0 ? roundOffAmount : 0,
        credit_amount: roundOffAmount < 0 ? Math.abs(roundOffAmount) : 0,
        narration: 'Round off',
      });
    }

    return {
      subtotal,
      cgst_amount: totalCGST,
      sgst_amount: totalSGST,
      igst_amount: totalIGST,
      cess_amount: totalCess,
      round_off: roundOffAmount,
      total_amount: roundedTotal,
      place_of_supply: pos,
      is_reverse_charge: !!is_reverse_charge,
      items: processedItems,
      ledger_entries: ledgerEntries,
    };
  }

  async createPurchaseInvoice(ctx, invoiceData) {
    console.log('\n💼 === VOUCHER SERVICE: CREATE PURCHASE INVOICE ===');
    console.log('📋 Input Data:', JSON.stringify(invoiceData, null, 2));
    
    const { tenantModels, masterModels, company, tenant_id } = ctx;
    const { party_ledger_id, items = [], place_of_supply, is_reverse_charge = false, narration } = invoiceData || {};

    console.log('🏢 Context:', {
      tenant_id,
      company_state: company?.state,
      party_ledger_id,
      items_count: items.length,
      place_of_supply,
      is_reverse_charge
    });

    const partyLedger = await tenantModels.Ledger.findByPk(party_ledger_id);
    if (!partyLedger) throw new Error('Party ledger not found');
    
    console.log('👤 Party Ledger:', {
      id: partyLedger.id,
      ledger_name: partyLedger.ledger_name,
      state: partyLedger.state
    });

    const supplierState = partyLedger?.state || place_of_supply || 'Maharashtra';
    const recipientState = company?.state || 'Maharashtra';
    const pos = place_of_supply || recipientState;
    
    console.log('🌍 State Information:', {
      supplierState,
      recipientState,
      place_of_supply: pos,
      is_interstate: supplierState !== pos
    });

    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalCess = 0;

    console.log('\n📦 Processing Items:');
    const processedItems = (items || []).map((item, index) => {
      console.log(`\nItem ${index + 1}: ${item.item_name || item.item_description}`);
      
      const quantity = toNum(item.quantity, 1);
      const rate = toNum(item.rate, 0);
      const discountPercent = toNum(item.discount_percent, 0);
      const discountAmount = (quantity * rate * discountPercent) / 100;
      const taxableAmount = quantity * rate - discountAmount;

      console.log('  📊 Basic Calculations:', {
        quantity,
        rate,
        discountPercent,
        discountAmount,
        taxableAmount
      });

      subtotal += taxableAmount;

      const gstRate = toNum(item.gst_rate, 18);
      console.log('  🧮 GST Calculation Input:', {
        taxableAmount,
        gstRate,
        supplierState,
        pos
      });
      
      const gst = GSTCalculationService.calculateItemGST(taxableAmount, gstRate, supplierState, pos);
      console.log('  💰 GST Calculation Result:', gst);

      totalCGST += gst.cgstAmount;
      totalSGST += gst.sgstAmount;
      totalIGST += gst.igstAmount;
      totalCess += toNum(item.cess_amount, 0);

      const lineTotal = taxableAmount + gst.totalGSTAmount + toNum(item.cess_amount, 0);
      
      console.log('  📋 Final Item Totals:', {
        taxableAmount,
        cgst: gst.cgstAmount,
        sgst: gst.sgstAmount,
        igst: gst.igstAmount,
        lineTotal
      });
      
      return {
        inventory_item_id: item.inventory_item_id || null,
        warehouse_id: item.warehouse_id || null,
        item_code: item.item_code || null,
        item_description: item.item_description || item.description || item.item_name || 'Item',
        hsn_sac_code: item.hsn_sac_code || item.hsn || null,
        uqc: item.uqc || null,
        quantity,
        rate,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        taxable_amount: taxableAmount,
        gst_rate: gstRate,
        cgst_amount: gst.cgstAmount,
        sgst_amount: gst.sgstAmount,
        igst_amount: gst.igstAmount,
        cess_amount: toNum(item.cess_amount, 0),
        total_amount: lineTotal,
      };
    });

    console.log('\n💰 Invoice Totals:', {
      subtotal,
      totalCGST,
      totalSGST,
      totalIGST,
      totalCess
    });

    const totalTax = totalCGST + totalSGST + totalIGST + totalCess;
    const grandTotal = subtotal + totalTax;
    const roundedTotal = GSTCalculationService.roundOff(grandTotal);
    const roundOffAmount = roundedTotal - grandTotal;

    // Perpetual inventory: debit inventory for taxable subtotal.
    const inventoryLedger = await getOrCreateSystemLedger(
      { tenantModels, masterModels, tenant_id },
      { ledgerCode: 'INVENTORY', ledgerName: 'Stock in Hand', groupCode: 'INV' }
    );

    const ledgerEntries = [
      { ledger_id: inventoryLedger.id, debit_amount: subtotal, credit_amount: 0, narration: 'Inventory purchase' },
    ];

    // Handle GST based on reverse charge mechanism
    if (is_reverse_charge) {
      // Reverse Charge Mechanism (RCM):
      // - RCM Output: Liability (DT group, credit) - tax you owe
      // - RCM Input: Asset (CA group, debit) - input credit you can claim
      if (totalCGST > 0) {
        // RCM Output (liability)
        const cgstRcmOutput = await getOrCreateSystemLedger(
          { tenantModels, masterModels, tenant_id },
          { ledgerCode: 'CGST_RCM_OUTPUT', ledgerName: 'GST RCM Output - CGST', groupCode: 'DT' }
        );
        ledgerEntries.push({ ledger_id: cgstRcmOutput.id, debit_amount: 0, credit_amount: totalCGST, narration: 'CGST RCM Output' });
        
        // RCM Input (asset/ITC)
        const cgstRcmInput = await getOrCreateSystemLedger(
          { tenantModels, masterModels, tenant_id },
          { ledgerCode: 'CGST_RCM_INPUT', ledgerName: 'GST RCM Input - CGST', groupCode: 'CA' }
        );
        ledgerEntries.push({ ledger_id: cgstRcmInput.id, debit_amount: totalCGST, credit_amount: 0, narration: 'CGST RCM Input' });
      }
      if (totalSGST > 0) {
        // RCM Output (liability)
        const sgstRcmOutput = await getOrCreateSystemLedger(
          { tenantModels, masterModels, tenant_id },
          { ledgerCode: 'SGST_RCM_OUTPUT', ledgerName: 'GST RCM Output - SGST', groupCode: 'DT' }
        );
        ledgerEntries.push({ ledger_id: sgstRcmOutput.id, debit_amount: 0, credit_amount: totalSGST, narration: 'SGST RCM Output' });
        
        // RCM Input (asset/ITC)
        const sgstRcmInput = await getOrCreateSystemLedger(
          { tenantModels, masterModels, tenant_id },
          { ledgerCode: 'SGST_RCM_INPUT', ledgerName: 'GST RCM Input - SGST', groupCode: 'CA' }
        );
        ledgerEntries.push({ ledger_id: sgstRcmInput.id, debit_amount: totalSGST, credit_amount: 0, narration: 'SGST RCM Input' });
      }
      if (totalIGST > 0) {
        // RCM Output (liability)
        const igstRcmOutput = await getOrCreateSystemLedger(
          { tenantModels, masterModels, tenant_id },
          { ledgerCode: 'IGST_RCM_OUTPUT', ledgerName: 'GST RCM Output - IGST', groupCode: 'DT' }
        );
        ledgerEntries.push({ ledger_id: igstRcmOutput.id, debit_amount: 0, credit_amount: totalIGST, narration: 'IGST RCM Output' });
        
        // RCM Input (asset/ITC)
        const igstRcmInput = await getOrCreateSystemLedger(
          { tenantModels, masterModels, tenant_id },
          { ledgerCode: 'IGST_RCM_INPUT', ledgerName: 'GST RCM Input - IGST', groupCode: 'CA' }
        );
        ledgerEntries.push({ ledger_id: igstRcmInput.id, debit_amount: totalIGST, credit_amount: 0, narration: 'IGST RCM Input' });
      }
    } else {
      // Normal GST Input ledgers (asset/ITC) - only when NOT reverse charge
      if (totalCGST > 0) {
        const cgst = await getOrCreateSystemLedger(
          { tenantModels, masterModels, tenant_id },
          { ledgerCode: 'CGST', ledgerName: 'CGST', groupCode: 'DT' }
        );
        ledgerEntries.push({ ledger_id: cgst.id, debit_amount: totalCGST, credit_amount: 0, narration: 'CGST Input' });
      }
      if (totalSGST > 0) {
        const sgst = await getOrCreateSystemLedger(
          { tenantModels, masterModels, tenant_id },
          { ledgerCode: 'SGST', ledgerName: 'SGST', groupCode: 'DT' }
        );
        ledgerEntries.push({ ledger_id: sgst.id, debit_amount: totalSGST, credit_amount: 0, narration: 'SGST Input' });
      }
      if (totalIGST > 0) {
        const igst = await getOrCreateSystemLedger(
          { tenantModels, masterModels, tenant_id },
          { ledgerCode: 'IGST', ledgerName: 'IGST', groupCode: 'DT' }
        );
        ledgerEntries.push({ ledger_id: igst.id, debit_amount: totalIGST, credit_amount: 0, narration: 'IGST Input' });
      }
    }

    // Credit party (Creditor)
    ledgerEntries.push({
      ledger_id: party_ledger_id,
      debit_amount: 0,
      credit_amount: roundedTotal,
      narration: narration || `Purchase invoice from ${partyLedger.ledger_name}`,
    });

    if (Math.abs(roundOffAmount) > 0.000001) {
      const roundOffLedger = await getOrCreateSystemLedger(
        { tenantModels, masterModels, tenant_id },
        { ledgerCode: 'ROUND_OFF', ledgerName: 'Round Off', groupCode: 'IND_EXP' }
      );
      ledgerEntries.push({
        ledger_id: roundOffLedger.id,
        debit_amount: roundOffAmount < 0 ? Math.abs(roundOffAmount) : 0,
        credit_amount: roundOffAmount > 0 ? roundOffAmount : 0,
        narration: 'Round off',
      });
    }

    return {
      subtotal,
      cgst_amount: totalCGST,
      sgst_amount: totalSGST,
      igst_amount: totalIGST,
      cess_amount: totalCess,
      round_off: roundOffAmount,
      total_amount: roundedTotal,
      place_of_supply: pos,
      is_reverse_charge: !!is_reverse_charge,
      items: processedItems,
      ledger_entries: ledgerEntries,
    };
  }
}

module.exports = new VoucherService();

