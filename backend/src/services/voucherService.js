const { calculateGST, roundOff } = require('../utils/gstCalculator');

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
      const gst = calculateGST(taxableAmount, gstRate, supplierState, pos);

      totalCGST += gst.cgst;
      totalSGST += gst.sgst;
      totalIGST += gst.igst;
      totalCess += toNum(item.cess_amount, 0);

      const lineTotal = taxableAmount + gst.totalTax + toNum(item.cess_amount, 0);
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
        cgst_amount: gst.cgst,
        sgst_amount: gst.sgst,
        igst_amount: gst.igst,
        cess_amount: toNum(item.cess_amount, 0),
        total_amount: lineTotal,
      };
    });

    const totalTax = totalCGST + totalSGST + totalIGST + totalCess;
    const grandTotal = subtotal + totalTax;
    const roundedTotal = roundOff(grandTotal);
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
      
      const gst = calculateGST(taxableAmount, gstRate, supplierState, pos);
      console.log('  💰 GST Calculation Result:', gst);

      totalCGST += gst.cgst;
      totalSGST += gst.sgst;
      totalIGST += gst.igst;
      totalCess += toNum(item.cess_amount, 0);

      const lineTotal = taxableAmount + gst.totalTax + toNum(item.cess_amount, 0);
      
      console.log('  📋 Final Item Totals:', {
        taxableAmount,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
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
        cgst_amount: gst.cgst,
        sgst_amount: gst.sgst,
        igst_amount: gst.igst,
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
    const roundedTotal = roundOff(grandTotal);
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

