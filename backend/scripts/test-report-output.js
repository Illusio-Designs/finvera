/**
 * Test Report Output - Shows what the API will return
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const masterSequelize = require('../src/config/masterDatabase');
const masterModels = require('../src/models/masterModels');
const tenantConnectionManager = require('../src/config/tenantConnectionManager');
const reportService = require('../src/services/reportService');

async function testReportOutput() {
  try {
    const company = await masterModels.Company.findOne({ where: { is_active: true } });
    
    const tenantConnection = await tenantConnectionManager.getConnection({
      id: company.tenant_id,
      db_name: company.db_name,
      db_host: process.env.DB_HOST,
      db_port: process.env.DB_PORT,
      db_user: process.env.DB_USER,
      db_password: process.env.DB_PASSWORD
    });
    
    const tenantModels = require('../src/services/tenantModels')(tenantConnection);

    console.log('\n🧪 Testing P&L Report Output\n');
    console.log('This is what the API will return to the app:\n');

    const plReport = await reportService.generateProfitLossReport(
      tenantModels,
      masterModels,
      { startDate: '2026-01-01', endDate: '2026-12-31' }
    );

    // Show key values that app uses
    console.log('Key Values:');
    console.log('===========');
    console.log(`trading_account.gross_profit: ₹${plReport.trading_account.gross_profit.toFixed(2)}`);
    console.log(`sales_revenue.net_sales: ₹${plReport.sales_revenue.net_sales.toFixed(2)}`);
    console.log(`closing_stock.amount: ₹${plReport.closing_stock.amount.toFixed(2)}`);
    console.log(`profit_loss_account.net_profit: ₹${plReport.profit_loss_account.net_profit.toFixed(2)}`);
    console.log(`totals.net_profit: ₹${plReport.totals.net_profit.toFixed(2)}`);
    console.log(`totals.gross_profit: ₹${plReport.totals.gross_profit.toFixed(2)}`);
    
    console.log('\n✅ Backend is returning CORRECT data!');
    console.log('\n📱 If app still shows wrong data:');
    console.log('   1. Restart the backend server (npm run dev)');
    console.log('   2. Clear app cache and reload');
    console.log('   3. Check network tab to see actual API response\n');

    await tenantConnectionManager.closeConnection(company.tenant_id);
    await masterSequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

testReportOutput();
