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

  // When using includes, Sequelize.col() needs the model name prefix with attribute name
  // The model maps debit_amount -> debit column, so we use the attribute name with model prefix
  const rows = await tenantModels.VoucherLedgerEntry.findAll({
    attributes: [
      'ledger_id',
      [Sequelize.fn('SUM', Sequelize.col('VoucherLedgerEntry.debit')), 'total_debit'],
      [Sequelize.fn('SUM', Sequelize.col('VoucherLedgerEntry.credit')), 'total_credit'],
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
  async getTrialBalance(req, res, next) {
    try {
      const { as_on_date, from_date } = req.query;
      const asOn = as_on_date || null;
      const from = from_date || null;
      const to = new Date().toISOString().slice(0, 10);

      const ledgers = await req.tenantModels.Ledger.findAll({ where: { is_active: true } });
      const groupMap = await loadGroupMap(req.masterModels, ledgers);

      const moveMap = await movementByLedger(req.tenantModels, {
        asOnDate: asOn,
        fromDate: !asOn && from ? from : null,
        toDate: !asOn && from ? to : null,
      });

      const trialBalance = [];
      for (const ledger of ledgers) {
        const move = moveMap.get(ledger.id) || { debit: 0, credit: 0 };
        const closingSigned = openingSigned(ledger) + (move.debit - move.credit);
        if (Math.abs(closingSigned) <= 0.009) continue;

        const group = groupMap.get(ledger.account_group_id);
        trialBalance.push({
          ledger_code: ledger.ledger_code,
          ledger_name: ledger.ledger_name,
          debit: closingSigned > 0 ? parseFloat(closingSigned.toFixed(2)) : 0,
          credit: closingSigned < 0 ? parseFloat(Math.abs(closingSigned).toFixed(2)) : 0,
          group_code: group?.group_code || null,
          group_name: group?.name || null,
          nature: group?.nature || null,
        });
      }

      const totalDebit = trialBalance.reduce((sum, i) => sum + toNum(i.debit, 0), 0);
      const totalCredit = trialBalance.reduce((sum, i) => sum + toNum(i.credit, 0), 0);

      res.json({
        trialBalance,
        totals: {
          totalDebit: parseFloat(totalDebit.toFixed(2)),
          totalCredit: parseFloat(totalCredit.toFixed(2)),
          difference: parseFloat(Math.abs(totalDebit - totalCredit).toFixed(2)),
        },
        as_on_date: asOn || to,
      });
    } catch (err) {
      next(err);
    }
  },

  async getProfitLoss(req, res, next) {
    try {
      const { from_date, to_date } = req.query;
      const from = from_date || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
      const to = to_date || new Date().toISOString().slice(0, 10);

      const ledgers = await req.tenantModels.Ledger.findAll({ where: { is_active: true } });
      const groupMap = await loadGroupMap(req.masterModels, ledgers);
      const moveMap = await movementByLedger(req.tenantModels, { fromDate: from, toDate: to });

      const incomeByGroup = new Map();
      const expenseByGroup = new Map();

      for (const ledger of ledgers) {
        const group = groupMap.get(ledger.account_group_id);
        if (!group) continue;

        const move = moveMap.get(ledger.id) || { debit: 0, credit: 0 };
        const movementSigned = move.debit - move.credit; // debit-positive convention

        if (group.nature === 'income') {
          const amt = -movementSigned; // income increases on credit
          if (amt <= 0.009) continue;
          incomeByGroup.set(group.id, (incomeByGroup.get(group.id) || 0) + amt);
        } else if (group.nature === 'expense') {
          const amt = movementSigned; // expense increases on debit
          if (amt <= 0.009) continue;
          expenseByGroup.set(group.id, (expenseByGroup.get(group.id) || 0) + amt);
        }
      }

      const income = [...incomeByGroup.entries()].map(([groupId, amount]) => {
        const g = groupMap.get(groupId);
        return {
          group_code: g?.group_code || null,
          group_name: g?.name || null,
          amount: parseFloat(amount.toFixed(2)),
        };
      });
      const expenses = [...expenseByGroup.entries()].map(([groupId, amount]) => {
        const g = groupMap.get(groupId);
        return {
          group_code: g?.group_code || null,
          group_name: g?.name || null,
          amount: parseFloat(amount.toFixed(2)),
        };
      });

      const totalIncome = income.reduce((s, i) => s + toNum(i.amount, 0), 0);
      const totalExpenses = expenses.reduce((s, i) => s + toNum(i.amount, 0), 0);
      const netProfit = totalIncome - totalExpenses;

      res.json({
        income,
        expenses,
        totals: {
          totalIncome: parseFloat(totalIncome.toFixed(2)),
          totalExpenses: parseFloat(totalExpenses.toFixed(2)),
          netProfit: parseFloat(netProfit.toFixed(2)),
        },
        period: { from_date: from, to_date: to },
      });
    } catch (err) {
      next(err);
    }
  },

  async getBalanceSheet(req, res, next) {
    try {
      const { as_on_date } = req.query;
      const asOn = as_on_date || new Date().toISOString().slice(0, 10);

      const ledgers = await req.tenantModels.Ledger.findAll({ where: { is_active: true } });
      const groupMap = await loadGroupMap(req.masterModels, ledgers);
      const moveMap = await movementByLedger(req.tenantModels, { asOnDate: asOn });

      const assets = new Map();
      const liabilities = new Map();

      for (const ledger of ledgers) {
        const group = groupMap.get(ledger.account_group_id);
        if (!group) continue;
        if (group.nature !== 'asset' && group.nature !== 'liability') continue;

        const move = moveMap.get(ledger.id) || { debit: 0, credit: 0 };
        const closingSigned = openingSigned(ledger) + (move.debit - move.credit);
        if (Math.abs(closingSigned) <= 0.009) continue;

        const amountAbs = Math.abs(closingSigned);
        if (group.nature === 'asset') {
          assets.set(group.id, (assets.get(group.id) || 0) + amountAbs);
        } else {
          liabilities.set(group.id, (liabilities.get(group.id) || 0) + amountAbs);
        }
      }

      const assetsArr = [...assets.entries()].map(([groupId, amount]) => {
        const g = groupMap.get(groupId);
        return { group_code: g?.group_code || null, group_name: g?.name || null, amount: parseFloat(amount.toFixed(2)) };
      });
      const liabilitiesArr = [...liabilities.entries()].map(([groupId, amount]) => {
        const g = groupMap.get(groupId);
        return { group_code: g?.group_code || null, group_name: g?.name || null, amount: parseFloat(amount.toFixed(2)) };
      });

      const totalAssets = assetsArr.reduce((s, i) => s + toNum(i.amount, 0), 0);
      const totalLiabilities = liabilitiesArr.reduce((s, i) => s + toNum(i.amount, 0), 0);

      res.json({
        balanceSheet: { assets: assetsArr, liabilities: liabilitiesArr },
        totals: {
          totalAssets: parseFloat(totalAssets.toFixed(2)),
          totalLiabilities: parseFloat(totalLiabilities.toFixed(2)),
        },
        as_on_date: asOn,
      });
    } catch (err) {
      next(err);
    }
  },

  async getLedgerStatement(req, res, next) {
    try {
      const { ledger_id, from_date, to_date } = req.query;
      if (!ledger_id) return res.status(400).json({ message: 'ledger_id is required' });

      const ledger = await req.tenantModels.Ledger.findByPk(ledger_id);
      if (!ledger) return res.status(404).json({ message: 'Ledger not found' });

      const from = from_date || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
      const to = to_date || new Date().toISOString().slice(0, 10);

      const beforeMoveMap = await movementByLedger(req.tenantModels, { beforeDate: from });
      const beforeMove = beforeMoveMap.get(ledger.id) || { debit: 0, credit: 0 };
      const openingBalSigned = openingSigned(ledger) + (beforeMove.debit - beforeMove.credit);

      // Find all voucher ledger entries for this ledger within the date range
      // DATEONLY fields work directly with date strings in YYYY-MM-DD format
      const entries = await req.tenantModels.VoucherLedgerEntry.findAll({
        where: { ledger_id },
        include: [
          {
            model: req.tenantModels.Voucher,
            where: { 
              status: 'posted',
              voucher_date: { [Op.between]: [from, to] }
            },
            required: true,
            attributes: ['id', 'voucher_date', 'voucher_number', 'voucher_type', 'narration'],
          },
        ],
        order: [[req.tenantModels.Voucher, 'voucher_date', 'ASC'], [req.tenantModels.Voucher, 'voucher_number', 'ASC'], ['createdAt', 'ASC']],
      });

      logger.info(`Found ${entries.length} voucher ledger entries for ledger ${ledger_id} (${ledger.ledger_name}) between ${from} and ${to}`);
      
      // Debug: Log first few entries if any
      if (entries.length > 0) {
        logger.info(`Sample entries:`, JSON.stringify(entries.slice(0, 5).map(e => ({
          voucher_number: e.voucher?.voucher_number,
          voucher_date: e.voucher?.voucher_date,
          voucher_type: e.voucher?.voucher_type,
          debit: parseFloat(e.debit_amount) || 0,
          credit: parseFloat(e.credit_amount) || 0,
          narration: e.narration
        })), null, 2));
      } else {
        // Check if there are any entries for this ledger at all (without date filter)
        const allEntriesCount = await req.tenantModels.VoucherLedgerEntry.count({
          where: { ledger_id },
          include: [{
            model: req.tenantModels.Voucher,
            where: { status: 'posted' },
            required: true,
          }],
        });
        logger.info(`Total posted voucher entries for ledger ${ledger_id} (${ledger.ledger_name}): ${allEntriesCount}`);
        
        if (allEntriesCount > 0) {
          // Get sample entries to see what dates they have
          const sampleEntries = await req.tenantModels.VoucherLedgerEntry.findAll({
            where: { ledger_id },
            include: [{
              model: req.tenantModels.Voucher,
              where: { status: 'posted' },
              required: true,
              attributes: ['voucher_date', 'voucher_number', 'voucher_type'],
            }],
            limit: 5,
            order: [[req.tenantModels.Voucher, 'voucher_date', 'DESC']],
          });
          logger.info(`Sample posted entries (any date):`, JSON.stringify(sampleEntries.map(e => ({
            voucher_number: e.voucher?.voucher_number,
            voucher_date: e.voucher?.voucher_date,
            voucher_type: e.voucher?.voucher_type,
            debit: parseFloat(e.debit_amount) || 0,
            credit: parseFloat(e.credit_amount) || 0,
          })), null, 2));
        }
        
        // Also check without status filter
        const allEntriesAnyStatus = await req.tenantModels.VoucherLedgerEntry.count({
          where: { ledger_id },
          include: [{
            model: req.tenantModels.Voucher,
            required: true,
          }],
        });
        logger.info(`Total voucher entries (any status) for ledger ${ledger_id}: ${allEntriesAnyStatus}`);
      }

      // Start with opening balance
      let running = openingBalSigned;
      const statement = [
        {
          date: from,
          voucher_number: 'Opening Balance',
          voucher_type: null,
          debit: openingBalSigned > 0 ? parseFloat(Math.abs(openingBalSigned).toFixed(2)) : 0,
          credit: openingBalSigned < 0 ? parseFloat(Math.abs(openingBalSigned).toFixed(2)) : 0,
          balance: parseFloat(running.toFixed(2)),
          narration: 'Opening Balance',
        },
      ];

      // Add all transactions within the period
      let periodTotalDebit = 0;
      let periodTotalCredit = 0;

      for (const e of entries) {
        // Ensure voucher is loaded
        if (!e.voucher) {
          logger.warn(`Voucher not found for entry ${e.id}`);
          continue;
        }

        const debit = toNum(e.debit_amount, 0);
        const credit = toNum(e.credit_amount, 0);
        
        // Update running balance: Debit increases balance (for asset/expense), Credit decreases (for liability/income)
        // For ledger statement: Debit = positive for asset accounts, Credit = negative
        // Running balance = Opening + Debits - Credits
        running += debit - credit;
        
        periodTotalDebit += debit;
        periodTotalCredit += credit;
        
        statement.push({
          date: e.voucher.voucher_date,
          voucher_number: e.voucher.voucher_number || '',
          voucher_type: e.voucher.voucher_type || null,
          debit: parseFloat(debit.toFixed(2)),
          credit: parseFloat(credit.toFixed(2)),
          balance: parseFloat(running.toFixed(2)),
          narration: e.narration || e.voucher.narration || null,
        });
      }

      // Add closing balance as final row
      const closingBalSigned = running;
      statement.push({
        date: to,
        voucher_number: 'Closing Balance',
        voucher_type: null,
        debit: closingBalSigned > 0 ? parseFloat(Math.abs(closingBalSigned).toFixed(2)) : 0,
        credit: closingBalSigned < 0 ? parseFloat(Math.abs(closingBalSigned).toFixed(2)) : 0,
        balance: parseFloat(closingBalSigned.toFixed(2)),
        narration: 'Closing Balance',
      });

      // Calculate totals for summary (excluding opening and closing balance rows)
      // Only count actual transaction entries, not the opening/closing balance placeholder rows
      const transactionEntries = statement.filter(
        (entry) => entry.voucher_number !== 'Opening Balance' && entry.voucher_number !== 'Closing Balance'
      );
      const totalDebit = transactionEntries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
      const totalCredit = transactionEntries.reduce((sum, entry) => sum + (entry.credit || 0), 0);

      res.json({
        ledger: {
          ledger_code: ledger.ledger_code,
          ledger_name: ledger.ledger_name,
          opening_balance: parseFloat(Math.abs(openingBalSigned).toFixed(2)),
          opening_balance_type: openingBalSigned < 0 ? 'Cr' : 'Dr',
        },
        statement, // Array of all transactions including opening balance and closing balance
        transactions: statement.slice(1, -1), // Only actual transactions (excluding opening/closing balance)
        closing_balance: parseFloat(Math.abs(closingBalSigned).toFixed(2)),
        closing_balance_type: closingBalSigned < 0 ? 'Cr' : 'Dr',
        period: { from_date: from, to_date: to },
        summary: {
          opening_balance: parseFloat(Math.abs(openingBalSigned).toFixed(2)),
          opening_balance_type: openingBalSigned < 0 ? 'Cr' : 'Dr',
          total_debit: parseFloat(totalDebit.toFixed(2)),
          total_credit: parseFloat(totalCredit.toFixed(2)),
          closing_balance: parseFloat(Math.abs(closingBalSigned).toFixed(2)),
          closing_balance_type: closingBalSigned < 0 ? 'Cr' : 'Dr',
          transaction_count: entries.length, // Only actual voucher transactions, not opening/closing balance rows
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getStockSummary(req, res, next) {
    try {
      const items = await req.tenantModels.InventoryItem.findAll({
        where: { is_active: true },
        order: [['item_name', 'ASC']],
      });

      const data = items.map((i) => {
        const qty = toNum(i.quantity_on_hand, 0);
        const avg = toNum(i.avg_cost, 0);
        return {
          item_key: i.item_key,
          item_code: i.item_code,
          item_name: i.item_name,
          hsn_sac_code: i.hsn_sac_code,
          uqc: i.uqc,
          gst_rate: i.gst_rate,
          quantity_on_hand: qty,
          avg_cost: avg,
          stock_value: parseFloat((qty * avg).toFixed(2)),
        };
      });

      const totalValue = data.reduce((s, r) => s + toNum(r.stock_value, 0), 0);
      res.json({ data, totals: { stock_value: parseFloat(totalValue.toFixed(2)) } });
    } catch (err) {
      next(err);
    }
  },

  async getStockLedger(req, res, next) {
    try {
      const { item_key, from_date, to_date } = req.query;
      const where = {};

      if (from_date && to_date) where.createdAt = { [Op.between]: [new Date(from_date), new Date(to_date)] };
      else if (from_date) where.createdAt = { [Op.gte]: new Date(from_date) };
      else if (to_date) where.createdAt = { [Op.lte]: new Date(to_date) };

      const include = [{ model: req.tenantModels.InventoryItem }];
      if (item_key) include[0].where = { item_key: String(item_key).toLowerCase() };

      const rows = await req.tenantModels.StockMovement.findAll({
        where,
        include,
        order: [['createdAt', 'ASC']],
      });

      const data = rows.map((r) => ({
        date: r.createdAt,
        item_key: r.inventory_item?.item_key,
        item_name: r.inventory_item?.item_name,
        movement_type: r.movement_type,
        quantity: toNum(r.quantity, 0),
        rate: toNum(r.rate, 0),
        amount: toNum(r.amount, 0),
        voucher_id: r.voucher_id,
        narration: r.narration,
      }));

      res.json({ data, period: { from_date: from_date || null, to_date: to_date || null } });
    } catch (err) {
      next(err);
    }
  },
};
