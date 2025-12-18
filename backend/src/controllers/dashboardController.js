const { Op, Sequelize } = require('sequelize');
const logger = require('../utils/logger');

module.exports = {
  async getDashboard(req, res, next) {
    try {
      const { tenantModels, tenantDb } = req;

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

      // Get outstanding by type (receivables vs payables)
      // Receivables: Bills from Sales invoices
      const salesBills = await tenantModels.BillWiseDetail.findAll({
        where: {
          is_fully_paid: false,
          pending_amount: { [Op.gt]: 0 },
        },
        include: [
          {
            model: tenantModels.Voucher,
            where: { voucher_type: 'Sales' },
            attributes: ['id', 'voucher_type'],
            required: true,
          },
        ],
        attributes: ['pending_amount'],
      });
      const receivables = salesBills.reduce((sum, bill) => sum + parseFloat(bill.pending_amount || 0), 0);

      // Payables: Outstanding from Purchase invoices
      const purchaseBills = await tenantModels.BillWiseDetail.findAll({
        where: {
          is_fully_paid: false,
          pending_amount: { [Op.gt]: 0 },
        },
        include: [
          {
            model: tenantModels.Voucher,
            where: { voucher_type: 'Purchase' },
            attributes: ['id', 'voucher_type'],
            required: true,
          },
        ],
        attributes: ['pending_amount'],
      });
      const payables = purchaseBills.reduce((sum, bill) => sum + parseFloat(bill.pending_amount || 0), 0);

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

