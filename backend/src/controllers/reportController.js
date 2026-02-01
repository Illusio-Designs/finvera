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
  // The model has debit_amount and credit_amount columns
  const rows = await tenantModels.VoucherLedgerEntry.findAll({
    attributes: [
      'ledger_id',
      [Sequelize.fn('SUM', Sequelize.col('VoucherLedgerEntry.debit_amount')), 'total_debit'],
      [Sequelize.fn('SUM', Sequelize.col('VoucherLedgerEntry.credit_amount')), 'total_credit'],
    ],
    include: [{ model: tenantModels.Voucher, as: 'voucher', attributes: [], where: voucherWhere, required: true }],
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

      console.log(`\n📊 === GENERATING TALLY-STYLE PROFIT & LOSS STATEMENT ===`);
      console.log(`📅 Period: ${from} to ${to}`);
      console.log(`🏢 Tenant: ${req.tenant_id}`);

      const ledgers = await req.tenantModels.Ledger.findAll({ where: { is_active: true } });
      const groupMap = await loadGroupMap(req.masterModels, ledgers);
      const moveMap = await movementByLedger(req.tenantModels, { fromDate: from, toDate: to });

      // Get opening and closing stock values
      const stockLedgers = ledgers.filter(l => {
        const group = groupMap.get(l.account_group_id);
        return group && group.group_code === 'INV'; // Stock-in-Hand group
      });

      let openingStock = 0;
      let closingStock = 0;
      
      for (const stockLedger of stockLedgers) {
        // Opening stock = opening balance
        openingStock += toNum(stockLedger.opening_balance, 0);
        // Closing stock = current balance
        closingStock += toNum(stockLedger.current_balance, 0);
      }

      // Categorize accounts by group
      const salesAccounts = [];
      const purchaseAccounts = [];
      const directIncomes = [];
      const directExpenses = [];
      const indirectIncomes = [];
      const indirectExpenses = [];

      for (const ledger of ledgers) {
        const group = groupMap.get(ledger.account_group_id);
        if (!group) continue;

        const move = moveMap.get(ledger.id) || { debit: 0, credit: 0 };
        const movementSigned = move.debit - move.credit;

        // Skip stock accounts - handled separately
        if (group.group_code === 'INV') continue;

        if (group.nature === 'income') {
          const amt = -movementSigned; // income increases on credit
          if (amt <= 0.009) continue;

          const accountData = {
            ledger_name: ledger.ledger_name,
            ledger_code: ledger.ledger_code,
            amount: parseFloat(amt.toFixed(2)),
            group_code: group.group_code,
            group_name: group.name
          };

          if (group.group_code === 'SAL') {
            salesAccounts.push(accountData);
          } else if (group.group_code === 'DIR_INC') {
            directIncomes.push(accountData);
          } else if (group.group_code === 'IND_INC') {
            indirectIncomes.push(accountData);
          }
        } else if (group.nature === 'expense') {
          const amt = movementSigned; // expense increases on debit
          
          // Handle Round Off specially (can be positive or negative)
          if (ledger.ledger_name.toLowerCase().includes('round')) {
            if (Math.abs(amt) > 0.009) {
              const roundOffData = {
                ledger_name: ledger.ledger_name,
                ledger_code: ledger.ledger_code,
                amount: parseFloat(amt.toFixed(2)),
                group_code: group.group_code,
                group_name: group.name,
                is_round_off: true,
                note: amt > 0 ? 'Round off expense' : 'Round off income'
              };
              indirectExpenses.push(roundOffData);
            }
          } else if (amt > 0.009) {
            const accountData = {
              ledger_name: ledger.ledger_name,
              ledger_code: ledger.ledger_code,
              amount: parseFloat(amt.toFixed(2)),
              group_code: group.group_code,
              group_name: group.name
            };

            if (group.group_code === 'PUR') {
              purchaseAccounts.push(accountData);
            } else if (group.group_code === 'DIR_EXP') {
              directExpenses.push(accountData);
            } else if (group.group_code === 'IND_EXP') {
              indirectExpenses.push(accountData);
            }
          }
        }
      }

      // Calculate totals following Tally's method
      const totalSales = salesAccounts.reduce((s, a) => s + a.amount, 0);
      const totalPurchases = purchaseAccounts.reduce((s, a) => s + a.amount, 0);
      const totalDirectIncomes = directIncomes.reduce((s, a) => s + a.amount, 0);
      const totalDirectExpenses = directExpenses.reduce((s, a) => s + a.amount, 0);
      const totalIndirectIncomes = indirectIncomes.reduce((s, a) => s + a.amount, 0);
      const totalIndirectExpenses = indirectExpenses.reduce((s, a) => s + a.amount, 0);

      // Gross Profit Calculation (Tally style)
      // Sales + Closing Stock - Opening Stock - Purchases - Direct Expenses + Direct Incomes
      const grossProfit = totalSales + closingStock - openingStock - totalPurchases - totalDirectExpenses + totalDirectIncomes;
      
      // Add closing stock to right side (income side) - Tally style
      const rightSideTotal = totalSales + closingStock + totalIndirectIncomes;
      const leftSideTotal = openingStock + totalPurchases + totalDirectExpenses + totalIndirectExpenses - totalDirectIncomes;
      
      // Net Profit = Right Side - Left Side
      const netProfit = rightSideTotal - leftSideTotal;

      console.log(`📊 Tally-style P&L Calculation:`);
      console.log(`  Sales: ₹${totalSales.toFixed(2)}`);
      console.log(`  Opening Stock: ₹${openingStock.toFixed(2)}`);
      console.log(`  Purchases: ₹${totalPurchases.toFixed(2)}`);
      console.log(`  Closing Stock: ₹${closingStock.toFixed(2)}`);
      console.log(`  Gross Profit: ₹${grossProfit.toFixed(2)}`);
      console.log(`  Net Profit: ₹${netProfit.toFixed(2)}`);

      // Structure response in Tally format
      res.json({
        // Left side (Expenses & Costs)
        expenses_and_costs: {
          opening_stock: {
            amount: parseFloat(openingStock.toFixed(2)),
            accounts: stockLedgers.map(l => ({
              ledger_name: l.ledger_name,
              opening_balance: parseFloat(l.opening_balance || 0)
            }))
          },
          purchase_accounts: {
            total: parseFloat(totalPurchases.toFixed(2)),
            accounts: purchaseAccounts
          },
          direct_incomes: {
            total: parseFloat(totalDirectIncomes.toFixed(2)),
            accounts: directIncomes,
            note: "Shown as reduction in costs"
          },
          direct_expenses: {
            total: parseFloat(totalDirectExpenses.toFixed(2)),
            accounts: directExpenses
          },
          gross_profit_carried_over: parseFloat(grossProfit.toFixed(2)),
          indirect_expenses: {
            total: parseFloat(totalIndirectExpenses.toFixed(2)),
            accounts: indirectExpenses
          },
          net_profit: parseFloat(netProfit.toFixed(2))
        },
        
        // Right side (Income & Revenue)
        income_and_revenue: {
          sales_accounts: {
            total: parseFloat(totalSales.toFixed(2)),
            accounts: salesAccounts
          },
          closing_stock: {
            amount: parseFloat(closingStock.toFixed(2)),
            accounts: stockLedgers.map(l => ({
              ledger_name: l.ledger_name,
              current_balance: parseFloat(l.current_balance || 0)
            }))
          },
          gross_profit_brought_forward: parseFloat(grossProfit.toFixed(2)),
          indirect_incomes: {
            total: parseFloat(totalIndirectIncomes.toFixed(2)),
            accounts: indirectIncomes
          }
        },

        // Summary totals
        totals: {
          gross_profit: parseFloat(grossProfit.toFixed(2)),
          net_profit: parseFloat(netProfit.toFixed(2)),
          total_left_side: parseFloat(leftSideTotal.toFixed(2)),
          total_right_side: parseFloat(rightSideTotal.toFixed(2)),
          profit_margin: totalSales > 0 ? parseFloat((netProfit / totalSales * 100).toFixed(2)) : 0,
          gross_profit_margin: totalSales > 0 ? parseFloat((grossProfit / totalSales * 100).toFixed(2)) : 0,
          is_balanced: Math.abs(rightSideTotal - leftSideTotal - netProfit) < 0.01
        },

        period: { from_date: from, to_date: to },
        format: "tally_trading_account",
        notes: [
          'P&L follows Tally Trading Account format',
          'Opening Stock treated as expense (cost)',
          'Closing Stock treated as income (asset value)',
          'Gross Profit = Sales + Closing Stock - Opening Stock - Purchases - Direct Expenses + Direct Incomes',
          'Net Profit = Gross Profit + Indirect Incomes - Indirect Expenses',
          'Stock movements are explicitly shown in P&L (not just Balance Sheet)'
        ]
      });
    } catch (err) {
      next(err);
    }
  },

  async getBalanceSheet(req, res, next) {
    try {
      const { as_on_date } = req.query;
      const asOn = as_on_date || new Date().toISOString().slice(0, 10);

      console.log(`\n🏛️ === GENERATING TALLY-STYLE BALANCE SHEET ===`);
      console.log(`📅 As on: ${asOn}`);
      console.log(`🏢 Tenant: ${req.tenant_id}`);

      const ledgers = await req.tenantModels.Ledger.findAll({ where: { is_active: true } });
      const groupMap = await loadGroupMap(req.masterModels, ledgers);
      const moveMap = await movementByLedger(req.tenantModels, { asOnDate: asOn });

      // Get current period P&L for retained earnings
      const currentYearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
      const plMoveMap = await movementByLedger(req.tenantModels, { fromDate: currentYearStart, toDate: asOn });

      // Calculate current period profit/loss
      let currentPeriodPL = 0;
      for (const ledger of ledgers) {
        const group = groupMap.get(ledger.account_group_id);
        if (!group) continue;

        const plMove = plMoveMap.get(ledger.id) || { debit: 0, credit: 0 };
        const plMovementSigned = plMove.debit - plMove.credit;

        if (group.nature === 'income') {
          currentPeriodPL += -plMovementSigned; // income increases P&L
        } else if (group.nature === 'expense') {
          currentPeriodPL -= plMovementSigned; // expense decreases P&L
        }
      }

      // Group assets and liabilities by account groups (Tally style)
      const assetGroups = new Map();
      const liabilityGroups = new Map();
      const assetDetails = [];
      const liabilityDetails = [];

      for (const ledger of ledgers) {
        const group = groupMap.get(ledger.account_group_id);
        if (!group) continue;

        const move = moveMap.get(ledger.id) || { debit: 0, credit: 0 };
        const closingSigned = openingSigned(ledger) + (move.debit - move.credit);
        if (Math.abs(closingSigned) <= 0.009) continue;

        const amountAbs = Math.abs(closingSigned);
        
        if (group.nature === 'asset') {
          console.log(`📊 Asset: ${ledger.ledger_name} (${group.group_code}) = ₹${amountAbs.toFixed(2)}`);
          
          // Group assets by account group
          const groupKey = `${group.group_code}_${group.name}`;
          assetGroups.set(groupKey, (assetGroups.get(groupKey) || 0) + amountAbs);
          
          assetDetails.push({
            ledger_name: ledger.ledger_name,
            ledger_code: ledger.ledger_code,
            amount: parseFloat(amountAbs.toFixed(2)),
            group_code: group.group_code,
            group_name: group.name,
            balance_type: closingSigned >= 0 ? 'Dr' : 'Cr'
          });
        } else if (group.nature === 'liability') {
          console.log(`📋 Liability: ${ledger.ledger_name} (${group.group_code}) = ₹${amountAbs.toFixed(2)}`);
          
          // Group liabilities by account group
          const groupKey = `${group.group_code}_${group.name}`;
          liabilityGroups.set(groupKey, (liabilityGroups.get(groupKey) || 0) + amountAbs);
          
          liabilityDetails.push({
            ledger_name: ledger.ledger_name,
            ledger_code: ledger.ledger_code,
            amount: parseFloat(amountAbs.toFixed(2)),
            group_code: group.group_code,
            group_name: group.name,
            balance_type: closingSigned >= 0 ? 'Dr' : 'Cr'
          });
        }
      }

      // Convert grouped data to arrays (Tally format)
      const assetsArr = [...assetGroups.entries()].map(([groupKey, amount]) => {
        const [group_code, group_name] = groupKey.split('_');
        return { 
          group_code, 
          group_name, 
          amount: parseFloat(amount.toFixed(2)) 
        };
      });
      
      const liabilitiesArr = [...liabilityGroups.entries()].map(([groupKey, amount]) => {
        const [group_code, group_name] = groupKey.split('_');
        return { 
          group_code, 
          group_name, 
          amount: parseFloat(amount.toFixed(2)) 
        };
      });

      // Add current period P&L to liabilities (as retained earnings)
      if (Math.abs(currentPeriodPL) > 0.009) {
        liabilitiesArr.push({
          group_code: 'PL',
          group_name: 'Profit & Loss A/c',
          amount: parseFloat(Math.abs(currentPeriodPL).toFixed(2)),
          note: currentPeriodPL >= 0 ? 'Current Period Profit' : 'Current Period Loss'
        });
      }

      const totalAssets = assetsArr.reduce((s, i) => s + toNum(i.amount, 0), 0);
      const totalLiabilities = liabilitiesArr.reduce((s, i) => s + toNum(i.amount, 0), 0);
      const difference = totalAssets - totalLiabilities;

      console.log(`📊 Total Assets: ₹${totalAssets.toFixed(2)}`);
      console.log(`📋 Total Liabilities: ₹${totalLiabilities.toFixed(2)}`);
      console.log(`💰 Current Period P&L: ₹${currentPeriodPL.toFixed(2)}`);
      console.log(`⚖️  Difference: ₹${difference.toFixed(2)}`);

      // Structure response in Tally format
      res.json({
        // Tally-style two-column format
        balance_sheet: {
          liabilities: liabilitiesArr.sort((a, b) => {
            // Sort order: Capital, Loans, Current Liabilities, P&L
            const order = { 'CAP': 1, 'LOAN': 2, 'CL': 3, 'SC': 4, 'DT': 5, 'PL': 6 };
            return (order[a.group_code] || 99) - (order[b.group_code] || 99);
          }),
          assets: assetsArr.sort((a, b) => {
            // Sort order: Fixed Assets, Investments, Current Assets, Stock
            const order = { 'FA': 1, 'INV': 2, 'CA': 3, 'CASH': 4, 'BANK': 5, 'SD': 6 };
            return (order[a.group_code] || 99) - (order[b.group_code] || 99);
          })
        },
        
        // Detailed breakdown
        asset_details: assetDetails.sort((a, b) => a.group_code.localeCompare(b.group_code)),
        liability_details: liabilityDetails.sort((a, b) => a.group_code.localeCompare(b.group_code)),
        
        // Summary totals
        totals: {
          total_assets: parseFloat(totalAssets.toFixed(2)),
          total_liabilities: parseFloat(totalLiabilities.toFixed(2)),
          current_period_pl: parseFloat(currentPeriodPL.toFixed(2)),
          difference: parseFloat(difference.toFixed(2)),
          is_balanced: Math.abs(difference) < 0.01
        },
        
        as_on_date: asOn,
        format: "tally_balance_sheet",
        notes: [
          'Balance Sheet follows Tally format with two-column layout',
          'Left side: Liabilities (Capital, Loans, Current Liabilities, P&L A/c)',
          'Right side: Assets (Fixed Assets, Current Assets, Stock, etc.)',
          'Current Period P&L shown as retained earnings on Liabilities side',
          'Account groups are consolidated (not individual ledgers)',
          'Totals must balance: Total Assets = Total Liabilities'
        ]
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

      // Determine if this is a debit or credit ledger for balance calculation (same logic as getBalance)
      const isDebitLedger = ledger.balance_type === 'debit' || ledger.opening_balance_type === 'Dr';
      const openingBalanceUnsigned = parseFloat(ledger.opening_balance || 0);
      
      // Calculate opening balance as of 'from' date (transactions before the period)
      const beforeMoveMap = await movementByLedger(req.tenantModels, { beforeDate: from });
      const beforeMove = beforeMoveMap.get(ledger.id) || { debit: 0, credit: 0 };
      const beforeDebit = beforeMove.debit || 0;
      const beforeCredit = beforeMove.credit || 0;
      
      // Calculate opening balance using ledger-type-aware logic
      let openingBalSigned;
      if (isDebitLedger) {
        // For debit-ledger: Opening + Debits - Credits (all transactions before 'from' date)
        openingBalSigned = openingBalanceUnsigned + beforeDebit - beforeCredit;
      } else {
        // For credit-ledger: Opening + Credits - Debits, then negate for signed representation
        openingBalSigned = -(openingBalanceUnsigned + beforeCredit - beforeDebit);
      }

      // Find all voucher ledger entries for this ledger within the date range
      const entries = await req.tenantModels.VoucherLedgerEntry.findAll({
        where: { ledger_id },
        include: [
          {
            model: req.tenantModels.Voucher,
            as: 'voucher', // Use the alias defined in the association
            where: { 
              status: 'posted',
              voucher_date: {
                [Op.gte]: from,
                [Op.lte]: to,
              },
            },
            required: true,
            attributes: ['id', 'voucher_date', 'voucher_number', 'voucher_type', 'narration'],
          },
        ],
        order: [
          [{ model: req.tenantModels.Voucher, as: 'voucher' }, 'voucher_date', 'ASC'],
          [{ model: req.tenantModels.Voucher, as: 'voucher' }, 'voucher_number', 'ASC'],
          ['createdAt', 'ASC']
        ],
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
            as: 'voucher',
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
              as: 'voucher',
              where: { status: 'posted' },
              required: true,
              attributes: ['voucher_date', 'voucher_number', 'voucher_type'],
            }],
            limit: 5,
            order: [[{ model: req.tenantModels.Voucher, as: 'voucher' }, 'voucher_date', 'DESC']],
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
            as: 'voucher',
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
        
        periodTotalDebit += debit;
        periodTotalCredit += credit;
        
        // Update running balance incrementally:
        // For debit-ledger: debit increases balance, credit decreases it
        // For credit-ledger: credit increases balance, debit decreases it
        // We use signed values where Cr balances are negative
        if (isDebitLedger) {
          running += debit - credit; // Standard: debits increase, credits decrease
        } else {
          running += credit - debit; // Reversed for credit-ledger: credits increase, debits decrease
        }
        
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

      // Calculate closing balance as of the 'to' date using movementByLedger
      // This ensures it matches getBalance and shows correct balance even if query doesn't find entries
      const asOnMoveMap = await movementByLedger(req.tenantModels, { asOnDate: to });
      const asOnMove = asOnMoveMap.get(ledger.id) || { debit: 0, credit: 0 };
      
      let closingBalSigned;
      if (isDebitLedger) {
        // For debit-ledger: Opening + Debits - Credits (all transactions up to 'to' date)
        closingBalSigned = openingBalanceUnsigned + asOnMove.debit - asOnMove.credit;
      } else {
        // For credit-ledger: Opening + Credits - Debits, then negate for signed representation
        closingBalSigned = -(openingBalanceUnsigned + asOnMove.credit - asOnMove.debit);
      }

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
