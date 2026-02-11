const { Op, Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const reportService = require('../services/reportService');

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
    // Use DATE() function to compare only the date part, ignoring time
    voucherWhere[Op.and] = [
      Sequelize.where(Sequelize.fn('DATE', Sequelize.col('voucher.voucher_date')), '>=', fromDate),
      Sequelize.where(Sequelize.fn('DATE', Sequelize.col('voucher.voucher_date')), '<=', toDate)
    ];
  } else if (fromDate) {
    voucherWhere[Op.and] = [
      Sequelize.where(Sequelize.fn('DATE', Sequelize.col('voucher.voucher_date')), '>=', fromDate)
    ];
  } else if (toDate) {
    voucherWhere[Op.and] = [
      Sequelize.where(Sequelize.fn('DATE', Sequelize.col('voucher.voucher_date')), '<=', toDate)
    ];
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
      const { as_on_date, from_date, format } = req.query;
      const asOn = as_on_date || null;
      const from = from_date || null;
      const to = new Date().toISOString().slice(0, 10);

      // Option 1: Use simplified report service (faster)
      if (format === 'simple') {
        const tbReport = await reportService.generateTrialBalanceReport(req.tenantModels, {
          asOnDate: asOn,
          fromDate: !asOn && from ? from : null,
          toDate: !asOn && from ? to : null
        });
        
        return res.json({
          trialBalance: tbReport.ledgers,
          totals: tbReport.totals,
          as_on_date: asOn || to,
          format: 'simple'
        });
      }

      // Option 2: Use detailed format with account groups (default)
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
      const { from_date, to_date, format } = req.query;
      const from = from_date || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
      const to = to_date || new Date().toISOString().slice(0, 10);

      // Option 1: Use simplified report service (faster, less detailed)
      if (format === 'simple') {
        const plReport = await reportService.generateProfitLossReport(
          req.tenantModels, 
          req.masterModels,
          { 
            startDate: from, 
            endDate: to 
          }
        );
        
        return res.json({
          revenue: plReport.revenue,
          cost_of_goods_sold: plReport.costOfGoodsSold,
          gross_profit: plReport.grossProfit,
          expenses: plReport.expenses,
          net_profit: plReport.netProfit,
          metrics: plReport.metrics,
          period: { from_date: from, to_date: to },
          format: 'simple'
        });
      }

      // Option 2: Use detailed Tally-style format (default)
      console.log(`\n📊 === GENERATING TRADING & PROFIT & LOSS ACCOUNT ===`);
      console.log(`📅 Period: ${from} to ${to}`);
      console.log(`🏢 Tenant: ${req.tenant_id}`);

      const ledgers = await req.tenantModels.Ledger.findAll({ where: { is_active: true } });
      console.log(`📊 Total active ledgers: ${ledgers.length}`);
      
      const groupMap = await loadGroupMap(req.masterModels, ledgers);
      console.log(`📊 Group map size: ${groupMap.size}`);
      
      const moveMap = await movementByLedger(req.tenantModels, { fromDate: from, toDate: to });
      console.log(`📊 Movement map size: ${moveMap.size}`);
      console.log(`📊 Movements:`, Array.from(moveMap.entries()).map(([id, move]) => {
        const ledger = ledgers.find(l => l.id === id);
        return {
          ledger_name: ledger?.ledger_name,
          debit: move.debit,
          credit: move.credit,
          net: move.debit - move.credit
        };
      }));

      // Check posted vouchers in the period
      const postedVouchers = await req.tenantModels.Voucher.findAll({
        where: {
          status: 'posted',
          [Op.and]: [
            Sequelize.where(Sequelize.fn('DATE', Sequelize.col('voucher_date')), '>=', from),
            Sequelize.where(Sequelize.fn('DATE', Sequelize.col('voucher_date')), '<=', to)
          ]
        }
      });
      console.log(`📊 Posted vouchers in period: ${postedVouchers.length}`);
      console.log(`📊 Voucher types:`, postedVouchers.map(v => ({ type: v.voucher_type, amount: v.total_amount, date: v.voucher_date })));

      // Also check ALL vouchers (including draft) for debugging
      const allVouchers = await req.tenantModels.Voucher.findAll({
        where: {
          [Op.and]: [
            Sequelize.where(Sequelize.fn('DATE', Sequelize.col('voucher_date')), '>=', from),
            Sequelize.where(Sequelize.fn('DATE', Sequelize.col('voucher_date')), '<=', to)
          ]
        }
      });
      console.log(`📊 ALL vouchers in period (including draft): ${allVouchers.length}`);
      if (allVouchers.length > 0) {
        console.log(`📊 All voucher details:`, allVouchers.map(v => ({ 
          number: v.voucher_number,
          type: v.voucher_type, 
          status: v.status,
          amount: v.total_amount, 
          date: v.voucher_date 
        })));
      }

      // Check if there are ANY vouchers at all
      const anyVouchers = await req.tenantModels.Voucher.findAll({ limit: 10 });
      console.log(`📊 Total vouchers in database (sample): ${anyVouchers.length}`);
      if (anyVouchers.length > 0) {
        console.log(`📊 Sample vouchers:`, anyVouchers.map(v => ({ 
          number: v.voucher_number,
          type: v.voucher_type, 
          status: v.status,
          amount: v.total_amount, 
          date: v.voucher_date?.toISOString().split('T')[0]
        })));
      }

      // Get opening and closing stock values
      const stockLedgers = ledgers.filter(l => {
        const group = groupMap.get(l.account_group_id);
        return group && group.group_code === 'INV'; // Stock-in-Hand group
      });

      let openingStock = 0;
      let closingStock = 0;
      
      // Calculate stock values from actual inventory items
      const inventoryItems = await req.tenantModels.InventoryItem.findAll({
        where: { is_active: true }
      });

      for (const item of inventoryItems) {
        const qty = toNum(item.quantity_on_hand, 0);
        const avgCost = toNum(item.avg_cost, 0);
        const stockValue = qty * avgCost;
        
        openingStock += toNum(item.opening_balance, 0);
        closingStock += stockValue;
      }

      // If no inventory items, fall back to ledger balances
      if (inventoryItems.length === 0) {
        for (const stockLedger of stockLedgers) {
          openingStock += toNum(stockLedger.opening_balance, 0);
          closingStock += toNum(stockLedger.current_balance, 0);
        }
      }

      // STEP 1: TRADING ACCOUNT CALCULATION
      // Categorize accounts according to standard accounting principles
      const salesAccounts = [];
      const salesReturns = [];
      const purchaseAccounts = [];
      const purchaseReturns = [];
      const directExpenses = [];
      const otherIncomes = [];
      const indirectExpenses = [];

      for (const ledger of ledgers) {
        const group = groupMap.get(ledger.account_group_id);
        if (!group) {
          console.log(`⚠️ No group found for ledger: ${ledger.ledger_name} (group_id: ${ledger.account_group_id})`);
          continue;
        }

        const move = moveMap.get(ledger.id) || { debit: 0, credit: 0 };
        const movementSigned = move.debit - move.credit;

        // Skip stock accounts - handled separately
        if (group.group_code === 'INV') continue;

        // INCOME ACCOUNTS
        if (group.nature === 'income') {
          const amt = -movementSigned; // income increases on credit
          if (amt <= 0.009) continue;

          console.log(`💰 Income ledger: ${ledger.ledger_name}, Group: ${group.group_code}, Amount: ${amt}`);

          const accountData = {
            ledger_name: ledger.ledger_name,
            ledger_code: ledger.ledger_code,
            amount: amt, // Remove rounding - use exact amount
            group_code: group.group_code,
            group_name: group.name
          };

          // Sales & Service Revenue
          if (['SAL', 'SALES'].includes(group.group_code)) {
            console.log(`  ✅ Added to Sales Accounts`);
            salesAccounts.push(accountData);
          }
          // Sales Returns (contra to sales)
          else if (['SAL_RET', 'SALES_RETURNS'].includes(group.group_code)) {
            console.log(`  ✅ Added to Sales Returns`);
            salesReturns.push(accountData);
          }
          // Other Incomes (Interest, Commission, Rent Received, etc.)
          else if (['INT_REC', 'COMM_REC', 'RENT_REC', 'DIV_REC', 'OTH_INC', 'IND_INC'].includes(group.group_code)) {
            console.log(`  ✅ Added to Other Incomes`);
            otherIncomes.push(accountData);
          }
          // Default to other income
          else {
            console.log(`  ✅ Added to Other Incomes (default)`);
            otherIncomes.push(accountData);
          }
        } 
        // EXPENSE ACCOUNTS
        else if (group.nature === 'expense') {
          const amt = movementSigned; // expense increases on debit
          
          // Handle Round Off specially
          if (ledger.ledger_name.toLowerCase().includes('round')) {
            if (Math.abs(amt) > 0.009) {
              const roundOffData = {
                ledger_name: ledger.ledger_name,
                ledger_code: ledger.ledger_code,
                amount: Math.abs(amt), // Use exact amount without rounding
                group_code: group.group_code,
                group_name: group.name,
                is_round_off: true,
                note: amt > 0 ? 'Round off expense' : 'Round off income'
              };
              
              if (amt > 0) {
                indirectExpenses.push(roundOffData);
              } else {
                roundOffData.amount = Math.abs(amt); // Use exact amount
                otherIncomes.push(roundOffData);
              }
            }
          } else if (amt > 0.009) {
            const accountData = {
              ledger_name: ledger.ledger_name,
              ledger_code: ledger.ledger_code,
              amount: amt, // Remove rounding - use exact amount
              group_code: group.group_code,
              group_name: group.name
            };

            // Purchase Accounts
            if (['PUR', 'PURCHASE'].includes(group.group_code)) {
              purchaseAccounts.push(accountData);
            }
            // Purchase Returns (contra to purchases)
            else if (['PUR_RET', 'PURCHASE_RETURNS'].includes(group.group_code)) {
              purchaseReturns.push(accountData);
            }
            // Direct Expenses (Manufacturing/Production costs - affects COGS)
            else if (['DIR_EXP', 'FREIGHT_IN', 'CARRIAGE', 'WAGES', 'MFG_EXP', 'PROD_EXP'].includes(group.group_code)) {
              directExpenses.push(accountData);
            }
            // Indirect Expenses (Operating expenses)
            else if ([
              'IND_EXP', 'SAL_WAG', 'RENT_PAY', 'ELEC_UTL', 'TEL_INT', 'PRINT_STA', 
              'REP_MAIN', 'INS', 'LEG_PRO', 'INT_PAY', 'BANK_CHG', 'DEPR', 'BAD_DEB',
              'TRANS_FRT', 'ADV_MKT', 'OFF_EXP', 'DISC_ALL', 'COMM_PAY'
            ].includes(group.group_code)) {
              indirectExpenses.push(accountData);
            }
            // Default to indirect expense
            else {
              indirectExpenses.push(accountData);
            }
          }
        }
      }

      // STEP 1: TRADING ACCOUNT CALCULATIONS (without rounding - show exact amounts)
      const totalSales = salesAccounts.reduce((s, a) => s + a.amount, 0);
      const totalSalesReturns = salesReturns.reduce((s, a) => s + a.amount, 0);
      const netSales = totalSales - totalSalesReturns;

      const totalPurchases = purchaseAccounts.reduce((s, a) => s + a.amount, 0);
      const totalPurchaseReturns = purchaseReturns.reduce((s, a) => s + a.amount, 0);
      const netPurchases = totalPurchases - totalPurchaseReturns;
      
      const totalDirectExpenses = directExpenses.reduce((s, a) => s + a.amount, 0);

      // COST OF GOODS SOLD (COGS) = Opening Stock + Net Purchases + Direct Expenses - Closing Stock
      const cogs = openingStock + netPurchases + totalDirectExpenses - closingStock;
      
      // GROSS PROFIT = Net Sales - COGS
      const grossProfit = netSales - cogs;

      // STEP 2: PROFIT & LOSS ACCOUNT CALCULATIONS
      const totalOtherIncomes = otherIncomes.reduce((s, a) => s + a.amount, 0);
      const totalIndirectExpenses = indirectExpenses.reduce((s, a) => s + a.amount, 0);

      // TOTAL INCOME = Gross Profit + Other Incomes
      const totalIncome = grossProfit + totalOtherIncomes;
      
      // NET PROFIT = Total Income - Indirect Expenses
      const netProfit = totalIncome - totalIndirectExpenses;

      // Calculate balanced totals for Tally format (without forced rounding)
      // Left Side: Opening Stock + Net Purchases + Direct Expenses + Indirect Expenses + Net Profit (if positive)
      let leftSideTotal = openingStock + netPurchases + totalDirectExpenses + totalIndirectExpenses;
      if (netProfit > 0) {
        leftSideTotal = leftSideTotal + netProfit;
      }
      
      // Right Side: Net Sales + Closing Stock + Other Incomes + Net Loss (if negative)
      let rightSideTotal = netSales + closingStock + totalOtherIncomes;
      if (netProfit < 0) {
        rightSideTotal = rightSideTotal + Math.abs(netProfit);
      }

      console.log(`📊 Trading & P&L Account Calculation:`);
      console.log(`  TRADING ACCOUNT:`);
      console.log(`    Net Sales: ₹${netSales.toFixed(2)} (Sales: ₹${totalSales.toFixed(2)} - Returns: ₹${totalSalesReturns.toFixed(2)})`);
      console.log(`    Opening Stock: ₹${openingStock.toFixed(2)}`);
      console.log(`    Net Purchases: ₹${netPurchases.toFixed(2)} (Purchases: ₹${totalPurchases.toFixed(2)} - Returns: ₹${totalPurchaseReturns.toFixed(2)})`);
      console.log(`    Direct Expenses: ₹${totalDirectExpenses.toFixed(2)}`);
      console.log(`    Closing Stock: ₹${closingStock.toFixed(2)}`);
      console.log(`    COGS: ₹${cogs.toFixed(2)}`);
      console.log(`    GROSS PROFIT: ₹${grossProfit.toFixed(2)}`);
      console.log(`  PROFIT & LOSS ACCOUNT:`);
      console.log(`    Total Income: ₹${totalIncome.toFixed(2)} (Gross Profit + Other Incomes)`);
      console.log(`    Other Incomes: ₹${totalOtherIncomes.toFixed(2)}`);
      console.log(`    Indirect Expenses: ₹${totalIndirectExpenses.toFixed(2)}`);
      console.log(`    NET PROFIT: ₹${netProfit.toFixed(2)}`);
      console.log(`  BALANCE VERIFICATION:`);
      console.log(`    Left Side Total: ₹${leftSideTotal.toFixed(2)}`);
      console.log(`    Right Side Total: ₹${rightSideTotal.toFixed(2)}`);
      console.log(`    Totals Match: ${Math.abs(leftSideTotal - rightSideTotal) < 0.01 ? 'YES' : 'NO'}`);
      
      // Log round off entries specifically
      const roundOffExpenses = indirectExpenses.filter(e => e.is_round_off);
      const roundOffIncomes = otherIncomes.filter(i => i.is_round_off);
      if (roundOffExpenses.length > 0 || roundOffIncomes.length > 0) {
        console.log(`🔄 Round Off Entries:`);
        roundOffExpenses.forEach(r => console.log(`  Round Off Expense: ₹${r.amount}`));
        roundOffIncomes.forEach(r => console.log(`  Round Off Income: ₹${r.amount}`));
      }

      // Structure response in Trading & P&L Account format
      res.json({
        // TRADING ACCOUNT (Left side - Expenses & Costs)
        trading_account: {
          opening_stock: {
            amount: openingStock,
            accounts: stockLedgers.map(l => ({
              ledger_name: l.ledger_name,
              opening_balance: l.opening_balance || 0
            }))
          },
          purchases: {
            gross_purchases: totalPurchases,
            purchase_returns: totalPurchaseReturns,
            net_purchases: netPurchases,
            accounts: purchaseAccounts
          },
          direct_expenses: {
            total: totalDirectExpenses,
            accounts: directExpenses,
            description: "Manufacturing/Production costs (Freight Inward, Carriage, Wages, etc.)"
          },
          gross_profit: grossProfit,
          cost_of_goods_sold: cogs
        },
        
        // SALES & REVENUE (Right side - Income)
        sales_revenue: {
          gross_sales: totalSales,
          sales_returns: totalSalesReturns,
          net_sales: netSales,
          accounts: salesAccounts
        },
        closing_stock: {
          amount: closingStock,
          accounts: stockLedgers.map(l => ({
            ledger_name: l.ledger_name,
            current_balance: l.current_balance || 0
          }))
        },

        // PROFIT & LOSS ACCOUNT
        profit_loss_account: {
          gross_profit_brought_forward: grossProfit,
          other_incomes: {
            total: totalOtherIncomes,
            accounts: otherIncomes,
            description: "Interest Received, Commission Received, Rent Received, etc."
          },
          total_income: totalIncome,
          indirect_expenses: {
            total: totalIndirectExpenses,
            accounts: indirectExpenses,
            description: "Operating expenses (Salaries, Rent, Utilities, etc.)"
          },
          net_profit: netProfit
        },

        // Summary totals without rounding
        totals: {
          gross_profit: grossProfit,
          net_profit: netProfit,
          total_left_side: leftSideTotal,
          total_right_side: rightSideTotal,
          profit_margin: netSales > 0 ? (netProfit / netSales * 100) : 0,
          gross_profit_margin: netSales > 0 ? (grossProfit / netSales * 100) : 0,
          is_balanced: Math.abs(leftSideTotal - rightSideTotal) < 0.01,
          difference: leftSideTotal - rightSideTotal,
          cogs: cogs,
          total_income: totalIncome
        },

        period: { from_date: from, to_date: to },
        format: "trading_and_profit_loss_account",
        notes: [
          'TRADING ACCOUNT: Shows Gross Profit calculation',
          'Opening Stock + Net Purchases + Direct Expenses - Closing Stock = COGS',
          'Net Sales - COGS = Gross Profit',
          'PROFIT & LOSS ACCOUNT: Shows Net Profit calculation', 
          'Gross Profit + Other Incomes - Indirect Expenses = Net Profit',
          'Left Side: Opening Stock + Purchases + Direct Expenses + Indirect Expenses + Net Profit (if profit)',
          'Right Side: Net Sales + Closing Stock + Other Incomes + Net Loss (if loss)',
          'Left Side Total = Right Side Total (balanced format)',
          'Round off entries properly categorized as income or expense',
          'Follows standard accounting principles for Trading & P&L Account'
        ]
      });
    } catch (err) {
      next(err);
    }
  },

  async getBalanceSheet(req, res, next) {
    try {
      const { as_on_date, format } = req.query;
      const asOn = as_on_date || new Date().toISOString().slice(0, 10);

      // Option 1: Use simplified report service (faster, less detailed)
      if (format === 'simple') {
        const bsReport = await reportService.generateBalanceSheetReport(
          req.tenantModels,
          req.masterModels,
          { 
            asOnDate: asOn 
          }
        );
        
        return res.json({
          capital: bsReport.capital,
          liabilities: bsReport.liabilities,
          assets: bsReport.assets,
          totals: bsReport.totals,
          as_on_date: asOn,
          format: 'simple'
        });
      }

      // Option 2: Use detailed Tally-style format with P&L integration (default)
      console.log(`\n🏛️ === GENERATING BALANCE SHEET ===`);
      console.log(`📅 As on: ${asOn}`);
      console.log(`🏢 Tenant: ${req.tenant_id}`);

      const ledgers = await req.tenantModels.Ledger.findAll({ where: { is_active: true } });
      const groupMap = await loadGroupMap(req.masterModels, ledgers);

      // Verify and correct cash balance
      console.log('🔍 Verifying Cash Balance...');
      const cashLedger = ledgers.find(l => l.ledger_name.toLowerCase().includes('cash'));
      if (cashLedger) {
        const [cashMovements] = await req.tenantModels.sequelize.query(`
          SELECT 
            SUM(vle.debit_amount) as total_debit,
            SUM(vle.credit_amount) as total_credit
          FROM voucher_ledger_entries vle
          JOIN vouchers v ON vle.voucher_id = v.id
          WHERE vle.ledger_id = ? AND v.status = 'posted'
        `, { replacements: [cashLedger.id] });
        
        const opening = toNum(cashLedger.opening_balance, 0);
        const totalDebit = toNum(cashMovements[0]?.total_debit, 0);
        const totalCredit = toNum(cashMovements[0]?.total_credit, 0);
        const calculatedBalance = opening + totalDebit - totalCredit;
        
        // Fix cash balance if incorrect
        if (calculatedBalance < 0 && cashLedger.balance_type === 'debit') {
          console.log(`  ⚠️  Correcting: Cash should be NEGATIVE (credit balance)`);
          cashLedger.current_balance = Math.abs(calculatedBalance);
          cashLedger.balance_type = 'credit';
        }
      }

      // Calculate P&L using the same logic as P&L report
      console.log('📊 Calculating Profit & Loss...');
      
      const from = '2026-01-31';
      const to = asOn;
      
      // Get ledger movements for P&L
      const [movements] = await req.tenantModels.sequelize.query(`
        SELECT 
          vle.ledger_id,
          SUM(vle.debit_amount) as total_debit,
          SUM(vle.credit_amount) as total_credit
        FROM voucher_ledger_entries vle
        JOIN vouchers v ON vle.voucher_id = v.id
        WHERE v.status = 'posted'
          AND v.voucher_date BETWEEN ? AND ?
        GROUP BY vle.ledger_id
      `, { replacements: [from, to] });

      const moveMap = new Map();
      movements.forEach(m => {
        moveMap.set(m.ledger_id, {
          debit: toNum(m.total_debit, 0),
          credit: toNum(m.total_credit, 0)
        });
      });

      // Get stock information
      const stockLedgers = ledgers.filter(l => {
        const group = groupMap.get(l.account_group_id);
        return group && group.group_code === 'INV';
      });

      let openingStock = 0;
      let closingStock = 0;

      const inventoryItems = await req.tenantModels.InventoryItem.findAll({
        where: { is_active: true }
      });

      if (inventoryItems.length > 0) {
        inventoryItems.forEach(item => {
          const qty = toNum(item.quantity_on_hand, 0);
          const avgCost = toNum(item.avg_cost, 0);
          closingStock += qty * avgCost;
        });
      } else {
        stockLedgers.forEach(ledger => {
          openingStock += toNum(ledger.opening_balance, 0);
          closingStock += toNum(ledger.current_balance, 0);
        });
      }

      // Calculate P&L components
      let totalSales = 0;
      let totalSalesReturns = 0;
      let totalPurchases = 0;
      let totalPurchaseReturns = 0;
      let totalDirectExpenses = 0;
      let totalIndirectExpenses = 0;
      let totalOtherIncomes = 0;

      ledgers.forEach(ledger => {
        const group = groupMap.get(ledger.account_group_id);
        if (!group) return;

        const move = moveMap.get(ledger.id) || { debit: 0, credit: 0 };
        const movementSigned = move.debit - move.credit;

        // Skip stock accounts
        if (group.group_code === 'INV') return;

        // INCOME ACCOUNTS
        if (group.nature === 'income') {
          const amt = -movementSigned;
          if (amt <= 0.009) return;

          if (['SAL', 'SALES'].includes(group.group_code)) {
            totalSales += amt;
          } else if (['SAL_RET', 'SALES_RETURNS'].includes(group.group_code)) {
            totalSalesReturns += amt;
          } else {
            totalOtherIncomes += amt;
          }
        }
        // EXPENSE ACCOUNTS
        else if (group.nature === 'expense') {
          const amt = movementSigned;
          if (amt <= 0.009) return;

          if (['PUR', 'PURCHASE'].includes(group.group_code)) {
            totalPurchases += amt;
          } else if (['PUR_RET', 'PURCHASE_RETURNS'].includes(group.group_code)) {
            totalPurchaseReturns += amt;
          } else if (['DIR_EXP', 'FREIGHT_IN', 'CARRIAGE', 'WAGES', 'MFG_EXP', 'PROD_EXP'].includes(group.group_code)) {
            totalDirectExpenses += amt;
          } else {
            totalIndirectExpenses += amt;
          }
        }
      });

      // Calculate P&L
      const netSales = totalSales - totalSalesReturns;
      const netPurchases = totalPurchases - totalPurchaseReturns;
      const cogs = openingStock + netPurchases + totalDirectExpenses - closingStock;
      const grossProfit = netSales - cogs;
      const netProfitLoss = grossProfit + totalOtherIncomes - totalIndirectExpenses;

      console.log(`  Net Profit/Loss: ₹${netProfitLoss.toFixed(2)}`);

      // Initialize balance sheet categories
      const assets = {
        fixed_assets: [],
        current_assets: [],
        investments: [],
        other_assets: []
      };

      const liabilities = {
        capital: [],
        reserves: [],
        profit_loss: netProfitLoss,
        current_liabilities: [],
        loans: [],
        other_liabilities: []
      };

      let totalAssets = 0;
      let totalLiabilities = netProfitLoss;

      // Process each ledger for balance sheet
      ledgers.forEach(ledger => {
        const group = groupMap.get(ledger.account_group_id);
        if (!group) return;

        // Skip P&L accounts (income/expense) - they don't appear in Balance Sheet
        if (group.affects_pl) return;

        const rawBalance = toNum(ledger.current_balance, 0);
        const balanceType = (ledger.balance_type || 'debit').toLowerCase();
        
        let signedBalance = 0;
        
        // Determine signed balance based on group nature
        if (group.nature === 'asset') {
          signedBalance = balanceType === 'debit' ? rawBalance : -rawBalance;
        } else if (group.nature === 'liability' || group.nature === 'equity') {
          signedBalance = balanceType === 'credit' ? rawBalance : -rawBalance;
        } else {
          return; // Skip if nature is not recognized
        }
        
        if (Math.abs(signedBalance) < 0.01) return;

        const ledgerInfo = {
          name: ledger.ledger_name,
          code: ledger.ledger_code,
          balance: signedBalance,
          balance_type: balanceType,
          group: group.name,
          bs_category: group.bs_category
        };

        // ASSETS - Use bs_category instead of hardcoded group codes
        if (group.nature === 'asset') {
          totalAssets += signedBalance;

          if (group.bs_category === 'fixed_asset') {
            assets.fixed_assets.push(ledgerInfo);
          } else if (group.bs_category === 'current_asset') {
            assets.current_assets.push(ledgerInfo);
          } else if (group.bs_category === 'investment') {
            assets.investments.push(ledgerInfo);
          } else {
            assets.other_assets.push(ledgerInfo);
          }
        }
        // LIABILITIES & EQUITY - Use bs_category instead of hardcoded group codes
        else if (group.nature === 'liability' || group.nature === 'equity') {
          totalLiabilities += signedBalance;

          if (group.nature === 'equity' || group.bs_category === 'equity') {
            // Capital and Reserves
            if (group.group_code === 'CAP') {
              liabilities.capital.push(ledgerInfo);
            } else {
              liabilities.reserves.push(ledgerInfo);
            }
          } else if (group.bs_category === 'current_liability') {
            liabilities.current_liabilities.push(ledgerInfo);
          } else if (group.bs_category === 'noncurrent_liability') {
            liabilities.loans.push(ledgerInfo);
          } else if (group.is_tax_group) {
            // GST/Tax ledgers - special handling
            // Input GST = Asset (debit), Output GST = Liability (credit)
            if (balanceType === 'debit') {
              // Input GST - treat as current asset
              totalAssets += signedBalance;
              totalLiabilities -= signedBalance; // Remove from liabilities
              assets.current_assets.push({
                ...ledgerInfo,
                group: `${group.name} (Input)`
              });
            } else {
              // Output GST - treat as current liability
              liabilities.current_liabilities.push({
                ...ledgerInfo,
                group: `${group.name} (Output)`
              });
            }
          } else {
            liabilities.other_liabilities.push(ledgerInfo);
          }
        }
      });

      // Calculate totals
      const fixedAssetsTotal = assets.fixed_assets.reduce((sum, a) => sum + a.balance, 0);
      const currentAssetsTotal = assets.current_assets.reduce((sum, a) => sum + a.balance, 0);
      const investmentsTotal = assets.investments.reduce((sum, a) => sum + a.balance, 0);
      const otherAssetsTotal = assets.other_assets.reduce((sum, a) => sum + a.balance, 0);

      const capitalTotal = liabilities.capital.reduce((sum, l) => sum + l.balance, 0);
      const reservesTotal = liabilities.reserves.reduce((sum, l) => sum + l.balance, 0);
      const currentLiabilitiesTotal = liabilities.current_liabilities.reduce((sum, l) => sum + l.balance, 0);
      const loansTotal = liabilities.loans.reduce((sum, l) => sum + l.balance, 0);
      const otherLiabilitiesTotal = liabilities.other_liabilities.reduce((sum, l) => sum + l.balance, 0);

      const difference = totalAssets - totalLiabilities;
      const isBalanced = Math.abs(difference) < 1.0;

      // Key ratios
      const currentRatio = currentLiabilitiesTotal > 0 ? (currentAssetsTotal / currentLiabilitiesTotal) : 0;
      const debtToEquity = (capitalTotal + reservesTotal) > 0 ? (loansTotal / (capitalTotal + reservesTotal)) : 0;
      const workingCapital = currentAssetsTotal - currentLiabilitiesTotal;

      console.log(`  Total Assets: ₹${totalAssets.toFixed(2)}`);
      console.log(`  Total Liabilities: ₹${totalLiabilities.toFixed(2)}`);
      console.log(`  Difference: ₹${difference.toFixed(2)} ${isBalanced ? '✓' : '✗'}`);

      res.json({
        liabilities_and_equity: {
          capital: {
            total: capitalTotal,
            accounts: liabilities.capital
          },
          reserves_and_surplus: {
            total: reservesTotal,
            accounts: liabilities.reserves
          },
          profit_and_loss: {
            amount: netProfitLoss,
            type: netProfitLoss >= 0 ? 'profit' : 'loss',
            as_of_date: asOn
          },
          loans_and_borrowings: {
            total: loansTotal,
            accounts: liabilities.loans
          },
          current_liabilities: {
            total: currentLiabilitiesTotal,
            accounts: liabilities.current_liabilities
          },
          other_liabilities: {
            total: otherLiabilitiesTotal,
            accounts: liabilities.other_liabilities
          },
          total: totalLiabilities
        },
        assets: {
          fixed_assets: {
            total: fixedAssetsTotal,
            accounts: assets.fixed_assets
          },
          investments: {
            total: investmentsTotal,
            accounts: assets.investments
          },
          current_assets: {
            total: currentAssetsTotal,
            accounts: assets.current_assets
          },
          other_assets: {
            total: otherAssetsTotal,
            accounts: assets.other_assets
          },
          total: totalAssets
        },
        balance_check: {
          total_assets: totalAssets,
          total_liabilities_and_equity: totalLiabilities,
          difference: difference,
          is_balanced: isBalanced
        },
        financial_ratios: {
          current_ratio: currentRatio,
          debt_to_equity_ratio: debtToEquity,
          working_capital: workingCapital
        },
        as_on_date: asOn,
        format: "balance_sheet"
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
