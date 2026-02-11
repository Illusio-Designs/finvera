const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function toNum(v, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

async function generatePLReport() {
  try {
    const tenantDbName = 'finvera_trader_test';
    const masterDbName = 'finvera_master';
    const { Op } = Sequelize;
    
    console.log('\n📊 === PROFIT & LOSS REPORT GENERATOR ===\n');

    // Connect to master database for account groups
    const masterSequelize = new Sequelize(
      masterDbName,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
      }
    );

    // Connect to tenant database
    const tenantSequelize = new Sequelize(
      tenantDbName,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
      }
    );

    await masterSequelize.authenticate();
    await tenantSequelize.authenticate();
    console.log('✅ Connected to databases\n');

    // Get date range
    const from = '2026-01-31';
    const to = '2026-02-11';
    console.log(`📅 Period: ${from} to ${to}\n`);
    console.log('='.repeat(100));

    // Get account groups
    const [accountGroups] = await masterSequelize.query(`
      SELECT id, group_code, name, nature, affects_gross_profit
      FROM account_groups
    `);
    
    const groupMap = new Map();
    accountGroups.forEach(g => groupMap.set(g.id, g));
    console.log(`\n📋 Loaded ${accountGroups.length} account groups`);

    // Get ledgers
    const [ledgers] = await tenantSequelize.query(`
      SELECT id, ledger_name, ledger_code, account_group_id, opening_balance, current_balance, balance_type
      FROM ledgers
      WHERE is_active = 1
    `);
    console.log(`📋 Loaded ${ledgers.length} active ledgers`);

    // Get ledger movements
    const [movements] = await tenantSequelize.query(`
      SELECT 
        vle.ledger_id,
        SUM(vle.debit_amount) as total_debit,
        SUM(vle.credit_amount) as total_credit
      FROM voucher_ledger_entries vle
      JOIN vouchers v ON vle.voucher_id = v.id
      WHERE v.status = 'posted'
        AND v.voucher_date BETWEEN ? AND ?
      GROUP BY vle.ledger_id
    `, {
      replacements: [from, to]
    });

    const moveMap = new Map();
    movements.forEach(m => {
      moveMap.set(m.ledger_id, {
        debit: toNum(m.total_debit, 0),
        credit: toNum(m.total_credit, 0)
      });
    });
    console.log(`📋 Loaded movements for ${movements.length} ledgers\n`);

    // Get stock information
    const stockLedgers = ledgers.filter(l => {
      const group = groupMap.get(l.account_group_id);
      return group && group.group_code === 'INV';
    });

    let openingStock = 0;
    let closingStock = 0;

    // Get inventory items
    const [inventoryItems] = await tenantSequelize.query(`
      SELECT quantity_on_hand, avg_cost
      FROM inventory_items
      WHERE is_active = 1
    `);

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

    console.log(`📦 Opening Stock: ₹${openingStock.toFixed(2)}`);
    console.log(`📦 Closing Stock: ₹${closingStock.toFixed(2)}\n`);

    // Initialize totals
    let totalSales = 0;
    let totalSalesReturns = 0;
    let totalPurchases = 0;
    let totalPurchaseReturns = 0;
    let totalDirectExpenses = 0;
    let totalIndirectExpenses = 0;
    let totalOtherIncomes = 0;

    const salesAccounts = [];
    const purchaseAccounts = [];
    const directExpenseAccounts = [];
    const indirectExpenseAccounts = [];
    const otherIncomeAccounts = [];

    // Process each ledger
    ledgers.forEach(ledger => {
      const group = groupMap.get(ledger.account_group_id);
      if (!group) return;

      const move = moveMap.get(ledger.id) || { debit: 0, credit: 0 };
      const movementSigned = move.debit - move.credit;

      // Skip stock accounts
      if (group.group_code === 'INV') return;

      // INCOME ACCOUNTS
      if (group.nature === 'income') {
        const amt = -movementSigned; // income increases on credit
        if (amt <= 0.009) return;

        // Sales
        if (['SAL', 'SALES'].includes(group.group_code)) {
          totalSales += amt;
          salesAccounts.push({ name: ledger.ledger_name, amount: amt, group: group.name });
        }
        // Sales Returns
        else if (['SAL_RET', 'SALES_RETURNS'].includes(group.group_code)) {
          totalSalesReturns += amt;
        }
        // Other Incomes
        else {
          totalOtherIncomes += amt;
          otherIncomeAccounts.push({ name: ledger.ledger_name, amount: amt, group: group.name });
        }
      }
      // EXPENSE ACCOUNTS
      else if (group.nature === 'expense') {
        const amt = movementSigned; // expense increases on debit
        if (amt <= 0.009) return;

        // Purchases
        if (['PUR', 'PURCHASE'].includes(group.group_code)) {
          totalPurchases += amt;
          purchaseAccounts.push({ name: ledger.ledger_name, amount: amt, group: group.name });
        }
        // Purchase Returns
        else if (['PUR_RET', 'PURCHASE_RETURNS'].includes(group.group_code)) {
          totalPurchaseReturns += amt;
        }
        // Direct Expenses
        else if (['DIR_EXP', 'FREIGHT_IN', 'CARRIAGE', 'WAGES', 'MFG_EXP', 'PROD_EXP'].includes(group.group_code)) {
          totalDirectExpenses += amt;
          directExpenseAccounts.push({ name: ledger.ledger_name, amount: amt, group: group.name });
        }
        // Indirect Expenses
        else {
          totalIndirectExpenses += amt;
          indirectExpenseAccounts.push({ name: ledger.ledger_name, amount: amt, group: group.name });
        }
      }
    });

    // Calculate P&L components
    const netSales = totalSales - totalSalesReturns;
    const netPurchases = totalPurchases - totalPurchaseReturns;
    const cogs = openingStock + netPurchases + totalDirectExpenses - closingStock;
    const grossProfit = netSales - cogs;
    const netProfit = grossProfit + totalOtherIncomes - totalIndirectExpenses;

    // Calculate margins
    const grossProfitMargin = netSales > 0 ? (grossProfit / netSales * 100) : 0;
    const netProfitMargin = netSales > 0 ? (netProfit / netSales * 100) : 0;

    // Display report
    console.log('='.repeat(100));
    console.log('\n📊 TRADING & PROFIT & LOSS ACCOUNT');
    console.log(`For the period ${from} to ${to}\n`);
    console.log('='.repeat(100));

    console.log('\n🔷 TRADING ACCOUNT\n');
    console.log('Left Side (Expenses & Costs):');
    console.log(`  Opening Stock                    ₹${openingStock.toFixed(2).padStart(15)}`);
    if (purchaseAccounts.length > 0) {
      console.log(`  Purchases:`);
      purchaseAccounts.forEach(acc => {
        console.log(`    ${acc.name.padEnd(30)} ₹${acc.amount.toFixed(2).padStart(15)}`);
      });
      console.log(`  Total Purchases                  ₹${totalPurchases.toFixed(2).padStart(15)}`);
    }
    if (directExpenseAccounts.length > 0) {
      console.log(`  Direct Expenses:`);
      directExpenseAccounts.forEach(acc => {
        console.log(`    ${acc.name.padEnd(30)} ₹${acc.amount.toFixed(2).padStart(15)}`);
      });
      console.log(`  Total Direct Expenses            ₹${totalDirectExpenses.toFixed(2).padStart(15)}`);
    }
    if (grossProfit > 0) {
      console.log(`  Gross Profit c/d                 ₹${grossProfit.toFixed(2).padStart(15)} ✓`);
    }

    console.log('\nRight Side (Sales & Income):');
    if (salesAccounts.length > 0) {
      console.log(`  Sales:`);
      salesAccounts.forEach(acc => {
        console.log(`    ${acc.name.padEnd(30)} ₹${acc.amount.toFixed(2).padStart(15)}`);
      });
      console.log(`  Total Sales                      ₹${totalSales.toFixed(2).padStart(15)}`);
    }
    console.log(`  Closing Stock                    ₹${closingStock.toFixed(2).padStart(15)}`);
    if (grossProfit < 0) {
      console.log(`  Gross Loss c/d                   ₹${Math.abs(grossProfit).toFixed(2).padStart(15)} ✗`);
    }

    console.log('\n' + '-'.repeat(100));
    console.log(`COGS: ₹${cogs.toFixed(2)} | Gross Profit: ₹${grossProfit.toFixed(2)} | Gross Profit Margin: ${grossProfitMargin.toFixed(2)}%`);
    console.log('-'.repeat(100));

    console.log('\n🔷 PROFIT & LOSS ACCOUNT\n');
    console.log('Left Side (Expenses):');
    if (grossProfit > 0) {
      console.log(`  Gross Profit b/d                 ₹${grossProfit.toFixed(2).padStart(15)} ✓`);
    }
    if (indirectExpenseAccounts.length > 0) {
      console.log(`  Indirect Expenses:`);
      indirectExpenseAccounts.forEach(acc => {
        console.log(`    ${acc.name.padEnd(30)} ₹${acc.amount.toFixed(2).padStart(15)}`);
      });
      console.log(`  Total Indirect Expenses          ₹${totalIndirectExpenses.toFixed(2).padStart(15)}`);
    }
    if (netProfit > 0) {
      console.log(`  Net Profit                       ₹${netProfit.toFixed(2).padStart(15)} ✓✓`);
    }

    console.log('\nRight Side (Other Incomes):');
    if (grossProfit < 0) {
      console.log(`  Gross Loss b/d                   ₹${Math.abs(grossProfit).toFixed(2).padStart(15)} ✗`);
    }
    if (otherIncomeAccounts.length > 0) {
      console.log(`  Other Incomes:`);
      otherIncomeAccounts.forEach(acc => {
        console.log(`    ${acc.name.padEnd(30)} ₹${acc.amount.toFixed(2).padStart(15)}`);
      });
      console.log(`  Total Other Incomes              ₹${totalOtherIncomes.toFixed(2).padStart(15)}`);
    }
    if (netProfit < 0) {
      console.log(`  Net Loss                         ₹${Math.abs(netProfit).toFixed(2).padStart(15)} ✗✗`);
    }

    console.log('\n' + '='.repeat(100));
    console.log('\n📈 SUMMARY\n');
    console.log(`  Net Sales:                       ₹${netSales.toFixed(2).padStart(15)}`);
    console.log(`  Cost of Goods Sold:              ₹${cogs.toFixed(2).padStart(15)}`);
    console.log(`  Gross Profit:                    ₹${grossProfit.toFixed(2).padStart(15)} (${grossProfitMargin.toFixed(2)}%)`);
    console.log(`  Other Incomes:                   ₹${totalOtherIncomes.toFixed(2).padStart(15)}`);
    console.log(`  Indirect Expenses:               ₹${totalIndirectExpenses.toFixed(2).padStart(15)}`);
    console.log(`  Net Profit:                      ₹${netProfit.toFixed(2).padStart(15)} (${netProfitMargin.toFixed(2)}%)`);
    console.log('\n' + '='.repeat(100));

    // Generate JSON output
    const report = {
      trading_account: {
        opening_stock: {
          amount: openingStock,
          accounts: stockLedgers.map(l => ({ ledger_name: l.ledger_name, opening_balance: l.opening_balance }))
        },
        purchases: {
          gross_purchases: totalPurchases,
          purchase_returns: totalPurchaseReturns,
          net_purchases: netPurchases,
          accounts: purchaseAccounts
        },
        direct_expenses: {
          total: totalDirectExpenses,
          accounts: directExpenseAccounts,
          description: "Manufacturing/Production costs"
        },
        gross_profit: grossProfit,
        cost_of_goods_sold: cogs
      },
      sales_revenue: {
        gross_sales: totalSales,
        sales_returns: totalSalesReturns,
        net_sales: netSales,
        accounts: salesAccounts
      },
      closing_stock: {
        amount: closingStock,
        accounts: stockLedgers.map(l => ({ ledger_name: l.ledger_name, current_balance: l.current_balance }))
      },
      profit_loss_account: {
        gross_profit_brought_forward: grossProfit,
        other_incomes: {
          total: totalOtherIncomes,
          accounts: otherIncomeAccounts,
          description: "Interest, Commission, Rent Received, etc."
        },
        total_income: grossProfit + totalOtherIncomes,
        indirect_expenses: {
          total: totalIndirectExpenses,
          accounts: indirectExpenseAccounts,
          description: "Operating expenses"
        },
        net_profit: netProfit
      },
      totals: {
        gross_profit: grossProfit,
        net_profit: netProfit,
        total_left_side: openingStock + netPurchases + totalDirectExpenses + totalIndirectExpenses + (netProfit > 0 ? netProfit : 0),
        total_right_side: netSales + closingStock + totalOtherIncomes + (netProfit < 0 ? Math.abs(netProfit) : 0),
        profit_margin: netProfitMargin,
        gross_profit_margin: grossProfitMargin,
        cogs: cogs,
        total_income: grossProfit + totalOtherIncomes
      },
      period: { from_date: from, to_date: to },
      format: "trading_and_profit_loss_account"
    };

    console.log('\n📄 JSON Output:\n');
    console.log(JSON.stringify(report, null, 2));

    await tenantSequelize.close();
    await masterSequelize.close();

    console.log('\n✅ Report generation complete\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

generatePLReport();
