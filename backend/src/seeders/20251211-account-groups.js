'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Get all existing tenants
    const tenants = await queryInterface.sequelize.query('SELECT id FROM tenants', {
      type: Sequelize.QueryTypes.SELECT,
    });

    if (tenants.length === 0) {
      console.log('No tenants found. Account groups will be seeded when tenants are created.');
      return;
    }

    // Helper function to generate UUID
    const generateUUID = (index) => {
      const base = '00000000-0000-0000-0000-';
      const suffix = String(index).padStart(12, '0');
      return base + suffix;
    };

    // Define all account groups with their hierarchy
    const accountGroups = [];

    // Track group IDs by code for parent references
    const groupIdMap = {};
    let uuidIndex = 1;

    // Helper to add group
    const addGroup = (code, name, parentCode, groupType, scheduleIIICategory = null) => {
      const id = generateUUID(uuidIndex++);
      groupIdMap[code] = id;
      return {
        id,
        group_code: code,
        group_name: name,
        parent_id: parentCode ? groupIdMap[parentCode] : null,
        group_type: groupType,
        schedule_iii_category: scheduleIIICategory,
        is_system: true,
        createdAt: now,
        updatedAt: now,
      };
    };

    // 1. ASSETS
    const assets1 = addGroup('1', 'ASSETS', null, 'Assets', 'Assets');
    const assets11 = addGroup('1.1', 'Non-Current Assets', '1', 'Assets', 'Non-Current Assets');
    const assets111 = addGroup('1.1.1', 'Fixed Assets', '1.1', 'Assets', 'Fixed Assets');
    const assets1111 = addGroup('1.1.1.1', 'Tangible Assets', '1.1.1', 'Assets', 'Tangible Assets');
    accountGroups.push(
      assets1,
      assets11,
      assets111,
      assets1111,
      addGroup('1.1.1.1.1', 'Land & Building', '1.1.1.1', 'Assets', 'Tangible Assets'),
      addGroup('1.1.1.1.2', 'Plant & Machinery', '1.1.1.1', 'Assets', 'Tangible Assets'),
      addGroup('1.1.1.1.3', 'Furniture & Fixtures', '1.1.1.1', 'Assets', 'Tangible Assets'),
      addGroup('1.1.1.1.4', 'Vehicles', '1.1.1.1', 'Assets', 'Tangible Assets'),
      addGroup('1.1.1.1.5', 'Office Equipment', '1.1.1.1', 'Assets', 'Tangible Assets'),
    );

    const assets1112 = addGroup(
      '1.1.1.2',
      'Intangible Assets',
      '1.1.1',
      'Assets',
      'Intangible Assets',
    );
    accountGroups.push(
      assets1112,
      addGroup('1.1.1.2.1', 'Goodwill', '1.1.1.2', 'Assets', 'Intangible Assets'),
      addGroup('1.1.1.2.2', 'Computer Software', '1.1.1.2', 'Assets', 'Intangible Assets'),
      addGroup('1.1.1.2.3', 'Patents & Trademarks', '1.1.1.2', 'Assets', 'Intangible Assets'),
      addGroup('1.1.1.2.4', 'Brand Value', '1.1.1.2', 'Assets', 'Intangible Assets'),
    );

    const assets112 = addGroup(
      '1.1.2',
      'Non-Current Investments',
      '1.1',
      'Assets',
      'Non-Current Investments',
    );
    accountGroups.push(
      assets112,
      addGroup('1.1.2.1', 'Investment in Shares', '1.1.2', 'Assets', 'Non-Current Investments'),
      addGroup('1.1.2.2', 'Investment in Debentures', '1.1.2', 'Assets', 'Non-Current Investments'),
      addGroup(
        '1.1.2.3',
        'Investment in Mutual Funds',
        '1.1.2',
        'Assets',
        'Non-Current Investments',
      ),
    );

    accountGroups.push(
      addGroup('1.1.3', 'Deferred Tax Assets', '1.1', 'Assets', 'Deferred Tax Assets'),
      addGroup(
        '1.1.4',
        'Long-term Loans & Advances',
        '1.1',
        'Assets',
        'Long-term Loans & Advances',
      ),
    );

    // 1.2 Current Assets
    const assets12 = addGroup('1.2', 'Current Assets', '1', 'Assets', 'Current Assets');
    accountGroups.push(assets12);

    const assets121 = addGroup('1.2.1', 'Inventories', '1.2', 'Assets', 'Inventories');
    accountGroups.push(
      assets121,
      addGroup('1.2.1.1', 'Raw Materials', '1.2.1', 'Assets', 'Inventories'),
      addGroup('1.2.1.2', 'Work in Progress', '1.2.1', 'Assets', 'Inventories'),
      addGroup('1.2.1.3', 'Finished Goods', '1.2.1', 'Assets', 'Inventories'),
      addGroup('1.2.1.4', 'Stock-in-Trade', '1.2.1', 'Assets', 'Inventories'),
      addGroup('1.2.1.5', 'Stores & Spares', '1.2.1', 'Assets', 'Inventories'),
    );

    const assets122 = addGroup('1.2.2', 'Trade Receivables', '1.2', 'Assets', 'Trade Receivables');
    accountGroups.push(
      assets122,
      addGroup('1.2.2.1', 'Sundry Debtors (Indian)', '1.2.2', 'Assets', 'Trade Receivables'),
      addGroup('1.2.2.2', 'Sundry Debtors (Foreign)', '1.2.2', 'Assets', 'Trade Receivables'),
      addGroup('1.2.2.3', 'Bills Receivable', '1.2.2', 'Assets', 'Trade Receivables'),
    );

    const assets123 = addGroup(
      '1.2.3',
      'Cash & Cash Equivalents',
      '1.2',
      'Assets',
      'Cash & Cash Equivalents',
    );
    accountGroups.push(
      assets123,
      addGroup('1.2.3.1', 'Cash in Hand', '1.2.3', 'Assets', 'Cash & Cash Equivalents'),
      addGroup('1.2.3.2', 'Cash at Bank', '1.2.3', 'Assets', 'Cash & Cash Equivalents'),
      addGroup('1.2.3.3', 'Cheques in Hand', '1.2.3', 'Assets', 'Cash & Cash Equivalents'),
      addGroup('1.2.3.4', 'Bank Deposits (FD)', '1.2.3', 'Assets', 'Cash & Cash Equivalents'),
    );

    accountGroups.push(
      addGroup(
        '1.2.4',
        'Short-term Loans & Advances',
        '1.2',
        'Assets',
        'Short-term Loans & Advances',
      ),
      addGroup(
        '1.2.4.1',
        'Advances to Suppliers',
        '1.2.4',
        'Assets',
        'Short-term Loans & Advances',
      ),
      addGroup('1.2.4.2', 'Prepaid Expenses', '1.2.4', 'Assets', 'Short-term Loans & Advances'),
      addGroup('1.2.4.3', 'Security Deposits', '1.2.4', 'Assets', 'Short-term Loans & Advances'),
      addGroup('1.2.4.4', 'Staff Advances', '1.2.4', 'Assets', 'Short-term Loans & Advances'),
    );

    const assets125 = addGroup(
      '1.2.5',
      'Other Current Assets',
      '1.2',
      'Assets',
      'Other Current Assets',
    );
    accountGroups.push(
      assets125,
      addGroup('1.2.5.1', 'GST Input Credit (CGST)', '1.2.5', 'Assets', 'Other Current Assets'),
      addGroup('1.2.5.2', 'GST Input Credit (SGST)', '1.2.5', 'Assets', 'Other Current Assets'),
      addGroup('1.2.5.3', 'GST Input Credit (IGST)', '1.2.5', 'Assets', 'Other Current Assets'),
      addGroup('1.2.5.4', 'TDS Receivable', '1.2.5', 'Assets', 'Other Current Assets'),
      addGroup('1.2.5.5', 'Interest Accrued', '1.2.5', 'Assets', 'Other Current Assets'),
    );

    // 2. LIABILITIES
    const liabilities2 = addGroup('2', 'LIABILITIES', null, 'Liabilities', 'Liabilities');
    accountGroups.push(liabilities2);

    const liabilities21 = addGroup(
      '2.1',
      'Equity & Reserves',
      '2',
      'Liabilities',
      'Equity & Reserves',
    );
    accountGroups.push(liabilities21);

    const liabilities211 = addGroup(
      '2.1.1',
      'Share Capital',
      '2.1',
      'Liabilities',
      'Share Capital',
    );
    accountGroups.push(
      liabilities211,
      addGroup('2.1.1.1', 'Equity Share Capital', '2.1.1', 'Liabilities', 'Share Capital'),
      addGroup('2.1.1.2', 'Preference Share Capital', '2.1.1', 'Liabilities', 'Share Capital'),
    );

    const liabilities212 = addGroup(
      '2.1.2',
      'Reserves & Surplus',
      '2.1',
      'Liabilities',
      'Reserves & Surplus',
    );
    accountGroups.push(
      liabilities212,
      addGroup('2.1.2.1', 'Capital Reserve', '2.1.2', 'Liabilities', 'Reserves & Surplus'),
      addGroup('2.1.2.2', 'Securities Premium', '2.1.2', 'Liabilities', 'Reserves & Surplus'),
      addGroup('2.1.2.3', 'General Reserve', '2.1.2', 'Liabilities', 'Reserves & Surplus'),
      addGroup('2.1.2.4', 'Retained Earnings', '2.1.2', 'Liabilities', 'Reserves & Surplus'),
      addGroup('2.1.2.5', 'Profit & Loss Account', '2.1.2', 'Liabilities', 'Reserves & Surplus'),
    );

    accountGroups.push(
      addGroup(
        '2.1.3',
        'Money Received Against Share Warrants',
        '2.1',
        'Liabilities',
        'Equity & Reserves',
      ),
    );

    const liabilities22 = addGroup(
      '2.2',
      'Non-Current Liabilities',
      '2',
      'Liabilities',
      'Non-Current Liabilities',
    );
    accountGroups.push(liabilities22);

    const liabilities221 = addGroup(
      '2.2.1',
      'Long-term Borrowings',
      '2.2',
      'Liabilities',
      'Long-term Borrowings',
    );
    accountGroups.push(
      liabilities221,
      addGroup('2.2.1.1', 'Term Loans from Banks', '2.2.1', 'Liabilities', 'Long-term Borrowings'),
      addGroup('2.2.1.2', 'Debentures', '2.2.1', 'Liabilities', 'Long-term Borrowings'),
      addGroup('2.2.1.3', 'Bonds Payable', '2.2.1', 'Liabilities', 'Long-term Borrowings'),
    );

    accountGroups.push(
      addGroup(
        '2.2.2',
        'Deferred Tax Liabilities',
        '2.2',
        'Liabilities',
        'Deferred Tax Liabilities',
      ),
    );

    const liabilities223 = addGroup(
      '2.2.3',
      'Long-term Provisions',
      '2.2',
      'Liabilities',
      'Long-term Provisions',
    );
    accountGroups.push(
      liabilities223,
      addGroup('2.2.3.1', 'Provision for Gratuity', '2.2.3', 'Liabilities', 'Long-term Provisions'),
      addGroup(
        '2.2.3.2',
        'Provision for Leave Encashment',
        '2.2.3',
        'Liabilities',
        'Long-term Provisions',
      ),
    );

    accountGroups.push(
      addGroup(
        '2.2.4',
        'Other Long-term Liabilities',
        '2.2',
        'Liabilities',
        'Other Long-term Liabilities',
      ),
    );

    const liabilities23 = addGroup(
      '2.3',
      'Current Liabilities',
      '2',
      'Liabilities',
      'Current Liabilities',
    );
    accountGroups.push(liabilities23);

    const liabilities231 = addGroup(
      '2.3.1',
      'Short-term Borrowings',
      '2.3',
      'Liabilities',
      'Short-term Borrowings',
    );
    accountGroups.push(
      liabilities231,
      addGroup('2.3.1.1', 'Bank Overdraft', '2.3.1', 'Liabilities', 'Short-term Borrowings'),
      addGroup('2.3.1.2', 'Cash Credit', '2.3.1', 'Liabilities', 'Short-term Borrowings'),
      addGroup('2.3.1.3', 'Short-term Loans', '2.3.1', 'Liabilities', 'Short-term Borrowings'),
    );

    const liabilities232 = addGroup(
      '2.3.2',
      'Trade Payables',
      '2.3',
      'Liabilities',
      'Trade Payables',
    );
    accountGroups.push(
      liabilities232,
      addGroup('2.3.2.1', 'Sundry Creditors (Indian)', '2.3.2', 'Liabilities', 'Trade Payables'),
      addGroup('2.3.2.2', 'Sundry Creditors (Foreign)', '2.3.2', 'Liabilities', 'Trade Payables'),
      addGroup('2.3.2.3', 'Bills Payable', '2.3.2', 'Liabilities', 'Trade Payables'),
    );

    const liabilities233 = addGroup(
      '2.3.3',
      'Other Current Liabilities',
      '2.3',
      'Liabilities',
      'Other Current Liabilities',
    );
    accountGroups.push(
      liabilities233,
      addGroup(
        '2.3.3.1',
        'GST Payable (CGST)',
        '2.3.3',
        'Liabilities',
        'Other Current Liabilities',
      ),
      addGroup(
        '2.3.3.2',
        'GST Payable (SGST)',
        '2.3.3',
        'Liabilities',
        'Other Current Liabilities',
      ),
      addGroup(
        '2.3.3.3',
        'GST Payable (IGST)',
        '2.3.3',
        'Liabilities',
        'Other Current Liabilities',
      ),
      addGroup('2.3.3.4', 'TDS Payable', '2.3.3', 'Liabilities', 'Other Current Liabilities'),
      addGroup(
        '2.3.3.5',
        'Professional Tax Payable',
        '2.3.3',
        'Liabilities',
        'Other Current Liabilities',
      ),
      addGroup('2.3.3.6', 'ESI Payable', '2.3.3', 'Liabilities', 'Other Current Liabilities'),
      addGroup('2.3.3.7', 'PF Payable', '2.3.3', 'Liabilities', 'Other Current Liabilities'),
      addGroup(
        '2.3.3.8',
        'Advance from Customers',
        '2.3.3',
        'Liabilities',
        'Other Current Liabilities',
      ),
      addGroup('2.3.3.9', 'Salary Payable', '2.3.3', 'Liabilities', 'Other Current Liabilities'),
      addGroup(
        '2.3.3.10',
        'Outstanding Expenses',
        '2.3.3',
        'Liabilities',
        'Other Current Liabilities',
      ),
    );

    const liabilities234 = addGroup(
      '2.3.4',
      'Short-term Provisions',
      '2.3',
      'Liabilities',
      'Short-term Provisions',
    );
    accountGroups.push(
      liabilities234,
      addGroup('2.3.4.1', 'Provision for Tax', '2.3.4', 'Liabilities', 'Short-term Provisions'),
      addGroup(
        '2.3.4.2',
        'Provision for Expenses',
        '2.3.4',
        'Liabilities',
        'Short-term Provisions',
      ),
      addGroup(
        '2.3.4.3',
        'Provision for Dividends',
        '2.3.4',
        'Liabilities',
        'Short-term Provisions',
      ),
    );

    // 3. INCOME
    const income3 = addGroup('3', 'INCOME', null, 'Income', 'Income');
    accountGroups.push(income3);

    const income31 = addGroup(
      '3.1',
      'Revenue from Operations',
      '3',
      'Income',
      'Revenue from Operations',
    );
    accountGroups.push(income31);

    const income311 = addGroup('3.1.1', 'Sales Accounts', '3.1', 'Income', 'Sales Accounts');
    accountGroups.push(
      income311,
      addGroup('3.1.1.1', 'Sales - Local (Intrastate)', '3.1.1', 'Income', 'Sales Accounts'),
      addGroup('3.1.1.2', 'Sales - Interstate', '3.1.1', 'Income', 'Sales Accounts'),
      addGroup('3.1.1.3', 'Sales - Exports', '3.1.1', 'Income', 'Sales Accounts'),
      addGroup('3.1.1.4', 'Sales - SEZ', '3.1.1', 'Income', 'Sales Accounts'),
      addGroup('3.1.1.5', 'Sales - Deemed Export', '3.1.1', 'Income', 'Sales Accounts'),
    );

    const income312 = addGroup('3.1.2', 'Service Income', '3.1', 'Income', 'Service Income');
    accountGroups.push(
      income312,
      addGroup('3.1.2.1', 'Consulting Services', '3.1.2', 'Income', 'Service Income'),
      addGroup('3.1.2.2', 'Professional Services', '3.1.2', 'Income', 'Service Income'),
      addGroup('3.1.2.3', 'Maintenance Services', '3.1.2', 'Income', 'Service Income'),
    );

    const income313 = addGroup(
      '3.1.3',
      'Other Operating Revenue',
      '3.1',
      'Income',
      'Other Operating Revenue',
    );
    accountGroups.push(
      income313,
      addGroup('3.1.3.1', 'Job Work Income', '3.1.3', 'Income', 'Other Operating Revenue'),
      addGroup('3.1.3.2', 'Scrap Sales', '3.1.3', 'Income', 'Other Operating Revenue'),
    );

    const income32 = addGroup('3.2', 'Other Income', '3', 'Income', 'Other Income');
    accountGroups.push(
      income32,
      addGroup('3.2.1', 'Interest Income', '3.2', 'Income', 'Other Income'),
      addGroup('3.2.2', 'Dividend Income', '3.2', 'Income', 'Other Income'),
      addGroup('3.2.3', 'Rental Income', '3.2', 'Income', 'Other Income'),
      addGroup('3.2.4', 'Commission Received', '3.2', 'Income', 'Other Income'),
      addGroup('3.2.5', 'Discount Received', '3.2', 'Income', 'Other Income'),
      addGroup('3.2.6', 'Profit on Sale of Assets', '3.2', 'Income', 'Other Income'),
      addGroup('3.2.7', 'Miscellaneous Income', '3.2', 'Income', 'Other Income'),
    );

    // 4. EXPENSES
    const expenses4 = addGroup('4', 'EXPENSES', null, 'Expenses', 'Expenses');
    accountGroups.push(expenses4);

    const expenses41 = addGroup(
      '4.1',
      'Direct Expenses (Cost of Revenue)',
      '4',
      'Expenses',
      'Direct Expenses',
    );
    accountGroups.push(expenses41);

    const expenses411 = addGroup(
      '4.1.1',
      'Purchase Accounts',
      '4.1',
      'Expenses',
      'Purchase Accounts',
    );
    accountGroups.push(
      expenses411,
      addGroup(
        '4.1.1.1',
        'Purchase - Local (Intrastate)',
        '4.1.1',
        'Expenses',
        'Purchase Accounts',
      ),
      addGroup('4.1.1.2', 'Purchase - Interstate', '4.1.1', 'Expenses', 'Purchase Accounts'),
      addGroup('4.1.1.3', 'Purchase - Imports', '4.1.1', 'Expenses', 'Purchase Accounts'),
      addGroup('4.1.1.4', 'Purchase - SEZ', '4.1.1', 'Expenses', 'Purchase Accounts'),
    );

    accountGroups.push(
      addGroup('4.1.2', 'Direct Material', '4.1', 'Expenses', 'Direct Expenses'),
      addGroup('4.1.3', 'Direct Labor', '4.1', 'Expenses', 'Direct Expenses'),
    );

    const expenses414 = addGroup(
      '4.1.4',
      'Manufacturing Expenses',
      '4.1',
      'Expenses',
      'Direct Expenses',
    );
    accountGroups.push(
      expenses414,
      addGroup('4.1.4.1', 'Power & Fuel', '4.1.4', 'Expenses', 'Direct Expenses'),
      addGroup('4.1.4.2', 'Factory Rent', '4.1.4', 'Expenses', 'Direct Expenses'),
      addGroup('4.1.4.3', 'Factory Maintenance', '4.1.4', 'Expenses', 'Direct Expenses'),
    );

    accountGroups.push(
      addGroup('4.1.5', 'Freight & Forwarding', '4.1', 'Expenses', 'Direct Expenses'),
    );

    const expenses42 = addGroup('4.2', 'Indirect Expenses', '4', 'Expenses', 'Indirect Expenses');
    accountGroups.push(expenses42);

    const expenses421 = addGroup(
      '4.2.1',
      'Employee Benefits',
      '4.2',
      'Expenses',
      'Indirect Expenses',
    );
    accountGroups.push(
      expenses421,
      addGroup('4.2.1.1', 'Salaries & Wages', '4.2.1', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.1.2', 'Bonus', '4.2.1', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.1.3', 'PF Contribution', '4.2.1', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.1.4', 'ESI Contribution', '4.2.1', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.1.5', 'Gratuity', '4.2.1', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.1.6', 'Staff Welfare', '4.2.1', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.1.7', 'Professional Tax', '4.2.1', 'Expenses', 'Indirect Expenses'),
    );

    const expenses422 = addGroup(
      '4.2.2',
      'Administrative Expenses',
      '4.2',
      'Expenses',
      'Indirect Expenses',
    );
    accountGroups.push(
      expenses422,
      addGroup('4.2.2.1', 'Office Rent', '4.2.2', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.2.2', 'Office Maintenance', '4.2.2', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.2.3', 'Electricity Charges', '4.2.2', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.2.4', 'Water Charges', '4.2.2', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.2.5', 'Telephone & Internet', '4.2.2', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.2.6', 'Printing & Stationery', '4.2.2', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.2.7', 'Postage & Courier', '4.2.2', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.2.8', 'Insurance', '4.2.2', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.2.9', 'Legal & Professional Fees', '4.2.2', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.2.10', 'Audit Fees', '4.2.2', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.2.11', 'Bank Charges', '4.2.2', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.2.12', 'Office Supplies', '4.2.2', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.2.13', 'Miscellaneous Expenses', '4.2.2', 'Expenses', 'Indirect Expenses'),
    );

    const expenses423 = addGroup(
      '4.2.3',
      'Selling & Distribution Expenses',
      '4.2',
      'Expenses',
      'Indirect Expenses',
    );
    accountGroups.push(
      expenses423,
      addGroup('4.2.3.1', 'Advertisement & Publicity', '4.2.3', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.3.2', 'Sales Commission', '4.2.3', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.3.3', 'Sales Promotion', '4.2.3', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.3.4', 'Freight Outward', '4.2.3', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.3.5', 'Delivery Charges', '4.2.3', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.3.6', 'Packaging Expenses', '4.2.3', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.3.7', 'Travelling Expenses', '4.2.3', 'Expenses', 'Indirect Expenses'),
    );

    const expenses424 = addGroup(
      '4.2.4',
      'Financial Expenses',
      '4.2',
      'Expenses',
      'Indirect Expenses',
    );
    accountGroups.push(
      expenses424,
      addGroup('4.2.4.1', 'Interest on Loans', '4.2.4', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.4.2', 'Interest on Overdraft', '4.2.4', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.4.3', 'Bank Interest', '4.2.4', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.4.4', 'Processing Fees', '4.2.4', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.4.5', 'Late Payment Charges', '4.2.4', 'Expenses', 'Indirect Expenses'),
    );

    const expenses425 = addGroup(
      '4.2.5',
      'Depreciation & Amortization',
      '4.2',
      'Expenses',
      'Indirect Expenses',
    );
    accountGroups.push(
      expenses425,
      addGroup('4.2.5.1', 'Depreciation on Building', '4.2.5', 'Expenses', 'Indirect Expenses'),
      addGroup(
        '4.2.5.2',
        'Depreciation on Plant & Machinery',
        '4.2.5',
        'Expenses',
        'Indirect Expenses',
      ),
      addGroup('4.2.5.3', 'Depreciation on Furniture', '4.2.5', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.5.4', 'Depreciation on Vehicles', '4.2.5', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.5.5', 'Amortization of Intangibles', '4.2.5', 'Expenses', 'Indirect Expenses'),
    );

    const expenses426 = addGroup('4.2.6', 'Tax Expenses', '4.2', 'Expenses', 'Indirect Expenses');
    accountGroups.push(
      expenses426,
      addGroup('4.2.6.1', 'Income Tax', '4.2.6', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.6.2', 'Deferred Tax', '4.2.6', 'Expenses', 'Indirect Expenses'),
      addGroup('4.2.6.3', 'Other Taxes', '4.2.6', 'Expenses', 'Indirect Expenses'),
    );

    // Insert account groups for each tenant
    for (const tenant of tenants) {
      const tenantGroups = accountGroups.map((group) => ({
        ...group,
        tenant_id: tenant.id,
        id: Sequelize.literal(`(UUID())`), // Generate new UUID for each tenant
      }));

      // We need to rebuild parent_id references for each tenant
      // First insert all groups, then update parent_ids
      const insertedGroups = [];
      for (const group of tenantGroups) {
        const [result] = await queryInterface.sequelize.query(
          `INSERT INTO account_groups (tenant_id, group_code, group_name, parent_id, group_type, schedule_iii_category, is_system, createdAt, updatedAt)
           VALUES (:tenant_id, :group_code, :group_name, NULL, :group_type, :schedule_iii_category, :is_system, :createdAt, :updatedAt)
           RETURNING id`,
          {
            replacements: {
              tenant_id: tenant.id,
              group_code: group.group_code,
              group_name: group.group_name,
              group_type: group.group_type,
              schedule_iii_category: group.schedule_iii_category,
              is_system: group.is_system,
              createdAt: group.createdAt,
              updatedAt: group.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          },
        );
        insertedGroups.push({
          code: group.group_code,
          id: result[0]?.id || result.id,
        });
      }

      // Now update parent_ids
      const idMap = {};
      insertedGroups.forEach((item) => {
        idMap[item.code] = item.id;
      });

      for (const group of accountGroups) {
        if (group.parent_id) {
          const parentCode = accountGroups.find((g) => g.id === group.parent_id)?.group_code;
          if (parentCode && idMap[parentCode]) {
            await queryInterface.sequelize.query(
              `UPDATE account_groups 
               SET parent_id = :parent_id 
               WHERE tenant_id = :tenant_id AND group_code = :group_code`,
              {
                replacements: {
                  parent_id: idMap[parentCode],
                  tenant_id: tenant.id,
                  group_code: group.group_code,
                },
                type: Sequelize.QueryTypes.UPDATE,
              },
            );
          }
        }
      }
    }

    console.log(`Account groups seeded for ${tenants.length} tenant(s).`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('account_groups', { is_system: true }, {});
  },
};
