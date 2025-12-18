const { Op, Sequelize } = require('sequelize');
const logger = require('../utils/logger');

function toNum(v, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function openingSigned(ledger) {
  const amt = toNum(ledger?.opening_balance, 0);
  return ledger?.opening_balance_type === 'Cr' ? -amt : amt;
}

async function loadGroupMap(masterModels, ledgers) {
  const groupIds = [...new Set((ledgers || []).map((l) => l.account_group_id).filter(Boolean))];
  const groups = groupIds.length > 0 ? await masterModels.AccountGroup.findAll({ where: { id: groupIds } }) : [];
  return new Map(groups.map((g) => [g.id, g]));
}

async function movementByLedger(tenantModels, { fromDate, toDate, asOnDate, beforeDate } = {}) {
  const voucherWhere = { status: 'posted' };
  if (beforeDate) {
    voucherWhere.voucher_date = { [Op.lt]: beforeDate };
  } else if (asOnDate) {
    voucherWhere.voucher_date = { [Op.lte]: asOnDate };
  } else if (fromDate && toDate) {
    voucherWhere.voucher_date = { [Op.between]: [fromDate, toDate] };
  } else if (fromDate) {
    voucherWhere.voucher_date = { [Op.gte]: fromDate };
  } else if (toDate) {
    voucherWhere.voucher_date = { [Op.lte]: toDate };
  }

  const rows = await tenantModels.VoucherLedgerEntry.findAll({
    attributes: [
      'ledger_id',
      [Sequelize.fn('SUM', Sequelize.col('debit')), 'total_debit'],
      [Sequelize.fn('SUM', Sequelize.col('credit')), 'total_credit'],
    ],
    include: [{ model: tenantModels.Voucher, attributes: [], where: voucherWhere, required: true }],
    group: ['ledger_id'],
    raw: true,
  });

  const map = new Map();
  for (const r of rows) {
    map.set(r.ledger_id, {
      debit: toNum(r.total_debit, 0),
      credit: toNum(r.total_credit, 0),
    });
  }
  return map;
}

module.exports = {
  async getDashboard(req, res, next) {
    try {
      const { tenantModels, tenantDb, masterModels } = req;
      
      if (!tenantModels) {
        return res.status(500).json({
          success: false,
          message: 'Tenant models not available',
        });
      }
      
      if (!masterModels) {
        return res.status(500).json({
          success: false,
          message: 'Master models not available',
        });
      }

      // Calculate date ranges
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentYearStart = new Date(now.getFullYear(), 0, 1);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch all stats in parallel
      const [
        totalVouchers,
        totalLedgers,
        totalSalesInvoices,
        totalPurchaseInvoices,
        totalPayments,
        totalReceipts,
        pendingBills,
        totalOutstanding,
        currentMonthSales,
        currentMonthPurchase,
        recentVouchers,
        activeLedgers,
      ] = await Promise.all([
        // Total vouchers
        tenantModels.Voucher.count(),

        // Total ledgers
        tenantModels.Ledger.count({ where: { is_active: true } }),

        // Sales invoices
        tenantModels.Voucher.count({ where: { voucher_type: 'Sales', status: 'posted' } }),

        // Purchase invoices
        tenantModels.Voucher.count({ where: { voucher_type: 'Purchase', status: 'posted' } }),

        // Payments
        tenantModels.Voucher.count({ where: { voucher_type: 'Payment', status: 'posted' } }),

        // Receipts
        tenantModels.Voucher.count({ where: { voucher_type: 'Receipt', status: 'posted' } }),

        // Pending bills (outstanding)
        tenantModels.BillWiseDetail.count({
          where: {
            is_fully_paid: false,
            pending_amount: { [Op.gt]: 0 },
          },
        }),

        // Total outstanding amount
        tenantModels.BillWiseDetail.sum('pending_amount', {
          where: {
            is_fully_paid: false,
            pending_amount: { [Op.gt]: 0 },
          },
        }),

        // Current month sales total
        tenantModels.Voucher.sum('total_amount', {
          where: {
            voucher_type: 'Sales',
            status: 'posted',
            voucher_date: { [Op.gte]: currentMonthStart },
          },
        }),

        // Current month purchase total
        tenantModels.Voucher.sum('total_amount', {
          where: {
            voucher_type: 'Purchase',
            status: 'posted',
            voucher_date: { [Op.gte]: currentMonthStart },
          },
        }),

        // Recent vouchers (last 10)
        tenantModels.Voucher.findAll({
          limit: 10,
          order: [['voucher_date', 'DESC'], ['createdAt', 'DESC']],
          include: [
            {
              model: tenantModels.Ledger,
              as: 'partyLedger',
              attributes: ['id', 'ledger_name', 'ledger_code'],
              required: false,
            },
          ],
          attributes: [
            'id',
            'voucher_type',
            'voucher_number',
            'voucher_date',
            'total_amount',
            'status',
            'narration',
            'createdAt',
          ],
        }),

        // Active ledgers count (with transactions in last 30 days)
        tenantModels.VoucherLedgerEntry.count({
          distinct: true,
          col: 'ledger_id',
          where: {
            createdAt: { [Op.gte]: last30Days },
          },
        }),
      ]);

      // Get voucher type breakdown
      const voucherTypeBreakdown = await tenantModels.Voucher.findAll({
        attributes: [
          'voucher_type',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_amount'],
        ],
        where: { status: 'posted' },
        group: ['voucher_type'],
        raw: true,
      });

      // Calculate receivables and payables from ledger balances
      // Get all ledgers and their account groups
      let allLedgers = [];
      let groupMap = new Map();
      let moveMap = new Map();
      
      try {
        allLedgers = await tenantModels.Ledger.findAll({ where: { is_active: true } });
        groupMap = await loadGroupMap(masterModels, allLedgers);
        moveMap = await movementByLedger(tenantModels, {});
      } catch (err) {
        logger.error('Error loading ledgers for dashboard:', err);
        // Continue with empty data if ledger loading fails
        allLedgers = [];
        groupMap = new Map();
        moveMap = new Map();
      }

      let receivables = 0;
      let payables = 0;

      // Calculate receivables from Sundry Debtors (debit balance)
      // Calculate payables from Sundry Creditors (credit balance)
      for (const ledger of allLedgers) {
        const group = groupMap.get(ledger.account_group_id);
        if (!group) continue;

        const groupName = (group.name || '').toLowerCase();
        const isSundryDebtor = groupName.includes('sundry debtor') || groupName.includes('debtor');
        const isSundryCreditor = groupName.includes('sundry creditor') || groupName.includes('creditor');

        if (isSundryDebtor || isSundryCreditor) {
          const move = moveMap.get(ledger.id) || { debit: 0, credit: 0 };
          const closingSigned = openingSigned(ledger) + (move.debit - move.credit);

          if (isSundryDebtor && closingSigned > 0) {
            // Debit balance = receivables (amount to receive)
            receivables += closingSigned;
          } else if (isSundryCreditor && closingSigned < 0) {
            // Credit balance = payables (amount to pay)
            payables += Math.abs(closingSigned);
          }
        }
      }

      receivables = parseFloat(receivables.toFixed(2));
      payables = parseFloat(payables.toFixed(2));

      // Calculate GST Credit (Input Tax Credit - ITC)
      // GST Input ledgers: CGST_INPUT, SGST_INPUT, IGST_INPUT
      // These are asset accounts with debit balances representing available ITC
      let gstCredit = 0;
      const gstInputLedgerCodes = ['CGST_INPUT', 'SGST_INPUT', 'IGST_INPUT'];
      
      for (const ledger of allLedgers) {
        const ledgerCode = (ledger.ledger_code || '').toUpperCase();
        const ledgerName = (ledger.ledger_name || '').toLowerCase();
        
        // Check by ledger code or by ledger name pattern
        const isGstInputLedger = 
          gstInputLedgerCodes.includes(ledgerCode) ||
          (ledgerName.includes('gst input') && (
            ledgerName.includes('cgst') || 
            ledgerName.includes('sgst') || 
            ledgerName.includes('igst')
          ));
        
        if (isGstInputLedger) {
          const move = moveMap.get(ledger.id) || { debit: 0, credit: 0 };
          const closingSigned = openingSigned(ledger) + (move.debit - move.credit);
          
          // GST Input ledgers are asset accounts, so debit balance = available credit
          if (closingSigned > 0) {
            gstCredit += closingSigned;
          }
        }
      }

      gstCredit = parseFloat(gstCredit.toFixed(2));

      // Format voucher type breakdown
      const voucherTypes = {};
      voucherTypeBreakdown.forEach((item) => {
        voucherTypes[item.voucher_type] = {
          count: parseInt(item.count || 0),
          total_amount: parseFloat(item.total_amount || 0),
        };
      });

      // Get active ledgers count (already a number from count query)
      const activeLedgersCount = activeLedgers || 0;

      // Format recent vouchers
      const recentActivity = recentVouchers.map((v) => ({
        id: v.id,
        type: v.voucher_type,
        number: v.voucher_number,
        date: v.voucher_date,
        amount: parseFloat(v.total_amount || 0),
        status: v.status,
        narration: v.narration,
        party: v.partyLedger ? v.partyLedger.ledger_name : null,
        created_at: v.createdAt,
      }));

      // Calculate total invoices (sales + purchase)
      const totalInvoices = (totalSalesInvoices || 0) + (totalPurchaseInvoices || 0);

      const response = {
        stats: {
          total_vouchers: totalVouchers || 0,
          total_ledgers: totalLedgers || 0,
          total_invoices: totalInvoices,
          total_sales_invoices: totalSalesInvoices || 0,
          total_purchase_invoices: totalPurchaseInvoices || 0,
          total_payments: totalPayments || 0,
          total_receipts: totalReceipts || 0,
          pending_bills: pendingBills || 0,
          total_outstanding: parseFloat(totalOutstanding || 0),
          receivables: receivables,
          payables: payables,
          gst_credit: gstCredit,
          current_month_sales: parseFloat(currentMonthSales || 0),
          current_month_purchase: parseFloat(currentMonthPurchase || 0),
          active_ledgers: activeLedgersCount,
        },
        voucher_types: voucherTypes,
        recent_activity: recentActivity,
      };

      res.json({ success: true, data: response });
    } catch (err) {
      logger.error('Dashboard error:', err);
      next(err);
    }
  },
};

