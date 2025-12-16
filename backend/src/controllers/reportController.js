const { Ledger, AccountGroup, VoucherLedgerEntry, Voucher } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

module.exports = {
  async getTrialBalance(req, res, next) {
    try {
      const { as_on_date, from_date } = req.query;
      const where = { tenant_id: req.tenant_id };

      // Get all active ledgers
      const ledgers = await Ledger.findAll({
        where: { ...where, is_active: true },
        include: [{ model: AccountGroup, attributes: ['nature', 'primary_group'] }],
      });

      const trialBalance = [];

      for (const ledger of ledgers) {
        const entryWhere = {
          tenant_id: req.tenant_id,
          ledger_id: ledger.id,
        };

        if (as_on_date) {
          entryWhere.created_at = { [Op.lte]: new Date(as_on_date) };
        } else if (from_date) {
          entryWhere.created_at = { [Op.gte]: new Date(from_date) };
        }

        const entries = await VoucherLedgerEntry.findAll({ where: entryWhere });

        let totalDebit = parseFloat(ledger.opening_balance_type === 'Debit' ? ledger.opening_balance : 0);
        let totalCredit = parseFloat(ledger.opening_balance_type === 'Credit' ? ledger.opening_balance : 0);

        entries.forEach((entry) => {
          totalDebit += parseFloat(entry.debit_amount);
          totalCredit += parseFloat(entry.credit_amount);
        });

        const balance = ledger.account_group.nature === 'Debit'
          ? totalDebit - totalCredit
          : totalCredit - totalDebit;

        if (Math.abs(balance) > 0.01) {
          trialBalance.push({
            ledger_code: ledger.ledger_code,
            ledger_name: ledger.ledger_name,
            debit: balance > 0 && ledger.account_group.nature === 'Debit' ? Math.abs(balance) : 0,
            credit: balance > 0 && ledger.account_group.nature === 'Credit' ? Math.abs(balance) : 0,
            group: ledger.account_group.primary_group,
          });
        }
      }

      const totalDebit = trialBalance.reduce((sum, item) => sum + parseFloat(item.debit), 0);
      const totalCredit = trialBalance.reduce((sum, item) => sum + parseFloat(item.credit), 0);

      res.json({
        trialBalance,
        totals: {
          totalDebit: parseFloat(totalDebit.toFixed(2)),
          totalCredit: parseFloat(totalCredit.toFixed(2)),
          difference: parseFloat(Math.abs(totalDebit - totalCredit).toFixed(2)),
        },
        as_on_date: as_on_date || new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  async getBalanceSheet(req, res, next) {
    try {
      const { as_on_date } = req.query;
      const date = as_on_date ? new Date(as_on_date) : new Date();

      // Get all account groups
      const groups = await AccountGroup.findAll({
        where: { tenant_id: req.tenant_id, is_active: true },
        include: [{ model: Ledger, where: { is_active: true }, required: false }],
        order: [['balance_sheet_order', 'ASC']],
      });

      const balanceSheet = {
        assets: { current: [], nonCurrent: [] },
        liabilities: { current: [], nonCurrent: [] },
        equity: [],
      };

      for (const group of groups) {
        let groupBalance = 0;

        for (const ledger of group.ledgers || []) {
          const balance = await this.calculateLedgerBalance(ledger.id, date);
          groupBalance += balance;
        }

        if (Math.abs(groupBalance) > 0.01) {
          const item = {
            group_code: group.group_code,
            group_name: group.group_name,
            amount: Math.abs(groupBalance),
          };

          if (group.primary_group === 'Asset') {
            if (group.group_type === 'Current Asset') {
              balanceSheet.assets.current.push(item);
            } else {
              balanceSheet.assets.nonCurrent.push(item);
            }
          } else if (group.primary_group === 'Liability') {
            if (group.group_type === 'Current Liability') {
              balanceSheet.liabilities.current.push(item);
            } else {
              balanceSheet.liabilities.nonCurrent.push(item);
            }
          } else if (group.primary_group === 'Equity') {
            balanceSheet.equity.push(item);
          }
        }
      }

      // Calculate totals
      const totalAssets =
        balanceSheet.assets.current.reduce((sum, a) => sum + a.amount, 0) +
        balanceSheet.assets.nonCurrent.reduce((sum, a) => sum + a.amount, 0);

      const totalLiabilities =
        balanceSheet.liabilities.current.reduce((sum, l) => sum + l.amount, 0) +
        balanceSheet.liabilities.nonCurrent.reduce((sum, l) => sum + l.amount, 0);

      const totalEquity = balanceSheet.equity.reduce((sum, e) => sum + e.amount, 0);

      res.json({
        balanceSheet,
        totals: {
          totalAssets: parseFloat(totalAssets.toFixed(2)),
          totalLiabilities: parseFloat(totalLiabilities.toFixed(2)),
          totalEquity: parseFloat(totalEquity.toFixed(2)),
          totalLiabilitiesAndEquity: parseFloat((totalLiabilities + totalEquity).toFixed(2)),
        },
        as_on_date: date.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  async getProfitLoss(req, res, next) {
    try {
      const { from_date, to_date } = req.query;
      const from = from_date ? new Date(from_date) : new Date(new Date().getFullYear(), 0, 1);
      const to = to_date ? new Date(to_date) : new Date();

      // Get Income groups
      const incomeGroups = await AccountGroup.findAll({
        where: {
          tenant_id: req.tenant_id,
          primary_group: 'Income',
          is_active: true,
        },
        include: [{ model: Ledger, where: { is_active: true }, required: false }],
      });

      // Get Expense groups
      const expenseGroups = await AccountGroup.findAll({
        where: {
          tenant_id: req.tenant_id,
          primary_group: 'Expense',
          is_active: true,
        },
        include: [{ model: Ledger, where: { is_active: true }, required: false }],
      });

      let totalIncome = 0;
      let totalExpenses = 0;

      const income = [];
      const expenses = [];

      // Calculate income
      for (const group of incomeGroups) {
        let groupTotal = 0;
        for (const ledger of group.ledgers || []) {
          const balance = await this.calculateLedgerBalance(ledger.id, to, from);
          groupTotal += balance;
        }
        if (groupTotal > 0) {
          income.push({
            group_name: group.group_name,
            amount: groupTotal,
          });
          totalIncome += groupTotal;
        }
      }

      // Calculate expenses
      for (const group of expenseGroups) {
        let groupTotal = 0;
        for (const ledger of group.ledgers || []) {
          const balance = await this.calculateLedgerBalance(ledger.id, to, from);
          groupTotal += Math.abs(balance);
        }
        if (groupTotal > 0) {
          expenses.push({
            group_name: group.group_name,
            amount: groupTotal,
          });
          totalExpenses += groupTotal;
        }
      }

      const grossProfit = totalIncome - totalExpenses;
      const netProfit = grossProfit; // Simplified - in reality, there are more calculations

      res.json({
        income,
        expenses,
        totals: {
          totalIncome: parseFloat(totalIncome.toFixed(2)),
          totalExpenses: parseFloat(totalExpenses.toFixed(2)),
          grossProfit: parseFloat(grossProfit.toFixed(2)),
          netProfit: parseFloat(netProfit.toFixed(2)),
        },
        period: {
          from_date: from.toISOString(),
          to_date: to.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getLedgerStatement(req, res, next) {
    try {
      const { ledger_id, from_date, to_date } = req.query;

      if (!ledger_id) {
        return res.status(400).json({ message: 'ledger_id is required' });
      }

      const ledger = await Ledger.findOne({
        where: { id: ledger_id, tenant_id: req.tenant_id },
        include: [{ model: AccountGroup }],
      });

      if (!ledger) {
        return res.status(404).json({ message: 'Ledger not found' });
      }

      const from = from_date ? new Date(from_date) : new Date(new Date().getFullYear(), 0, 1);
      const to = to_date ? new Date(to_date) : new Date();

      const entries = await VoucherLedgerEntry.findAll({
        where: {
          tenant_id: req.tenant_id,
          ledger_id,
          created_at: { [Op.between]: [from, to] },
        },
        include: [
          {
            model: Voucher,
            attributes: ['voucher_number', 'voucher_date', 'voucher_type_id'],
            include: [{ model: VoucherType, attributes: ['voucher_name'] }],
          },
        ],
        order: [['created_at', 'ASC']],
      });

      let runningBalance = parseFloat(ledger.opening_balance || 0);
      const statement = [];

      // Opening balance entry
      statement.push({
        date: from,
        voucher_number: 'Opening Balance',
        voucher_type: null,
        debit: ledger.opening_balance_type === 'Debit' ? runningBalance : 0,
        credit: ledger.opening_balance_type === 'Credit' ? runningBalance : 0,
        balance: runningBalance,
        narration: 'Opening Balance',
      });

      // Process entries
      entries.forEach((entry) => {
        if (ledger.account_group.nature === 'Debit') {
          runningBalance += parseFloat(entry.debit_amount) - parseFloat(entry.credit_amount);
        } else {
          runningBalance += parseFloat(entry.credit_amount) - parseFloat(entry.debit_amount);
        }

        statement.push({
          date: entry.voucher.voucher_date,
          voucher_number: entry.voucher.voucher_number,
          voucher_type: entry.voucher.voucher_type?.voucher_name,
          debit: parseFloat(entry.debit_amount),
          credit: parseFloat(entry.credit_amount),
          balance: runningBalance,
          narration: entry.narration,
        });
      });

      res.json({
        ledger: {
          ledger_code: ledger.ledger_code,
          ledger_name: ledger.ledger_name,
          opening_balance: parseFloat(ledger.opening_balance || 0),
          opening_balance_type: ledger.opening_balance_type,
        },
        statement,
        closing_balance: parseFloat(runningBalance.toFixed(2)),
        period: {
          from_date: from.toISOString(),
          to_date: to.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async calculateLedgerBalance(ledgerId, asOnDate, fromDate = null) {
    const ledger = await Ledger.findByPk(ledgerId, {
      include: [{ model: AccountGroup }],
    });

    if (!ledger) return 0;

    const where = {
      ledger_id: ledgerId,
      tenant_id: ledger.tenant_id,
    };

    if (fromDate) {
      where.created_at = { [Op.between]: [fromDate, asOnDate] };
    } else {
      where.created_at = { [Op.lte]: asOnDate };
    }

    const entries = await VoucherLedgerEntry.findAll({ where });

    let balance = parseFloat(ledger.opening_balance_type === 'Debit' ? ledger.opening_balance : 0) -
      parseFloat(ledger.opening_balance_type === 'Credit' ? ledger.opening_balance : 0);

    entries.forEach((entry) => {
      if (ledger.account_group.nature === 'Debit') {
        balance += parseFloat(entry.debit_amount) - parseFloat(entry.credit_amount);
      } else {
        balance += parseFloat(entry.credit_amount) - parseFloat(entry.debit_amount);
      }
    });

    return balance;
  },
};

