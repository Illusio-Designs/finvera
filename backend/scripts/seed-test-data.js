/**
 * Seed Test Data for finvera_trader_test
 * 
 * Creates comprehensive test data including:
 * - 5 Debtors (Sundry Debtors)
 * - 5 Creditors (Sundry Creditors)
 * - Sales invoices with TDS
 * - Purchase invoices with TDS
 * - Payment vouchers
 * - Receipt vouchers
 * - Journal entries
 * - Inventory items
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const DB_NAME = 'finvera_trader_test';
const bcrypt = require('bcryptjs');

async function seedTestData() {
  console.log('🌱 Seeding Test Data for finvera_trader_test...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
  });

  try {
    const now = new Date();
    
    // Use current financial year dates (FY 2025-26: April 1, 2025 to March 31, 2026)
    // Create vouchers in recent months (January-February 2026)
    const currentYear = 2026;
    const currentMonth = 1; // February (0-indexed, so 1 = February)
    
    // ============================================
    // STEP 0: Create Tenant Admin Account
    // ============================================
    console.log('📋 Step 0: Creating Tenant Admin Account & Company...');
    
    // Connect to master database
    const masterConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.MASTER_DB_NAME || 'finvera_master',
    });
    
    // Connect to admin database (finvera_db)
    const adminConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.ADMIN_DB_NAME || 'finvera_db',
    });
    
    // Check if tenant exists in master database
    const [existingTenant] = await masterConnection.query(
      'SELECT id FROM tenant_master WHERE subdomain = ?',
      ['trader-test']
    );
    
    let tenantMasterId;
    
    if (existingTenant.length === 0) {
      // Create tenant in master database
      tenantMasterId = uuidv4();
      await masterConnection.query(
        `INSERT INTO tenant_master (id, company_name, subdomain, email, db_name, db_host, db_port,
         subscription_plan, is_active, is_trial, trial_ends_at, acquisition_category, createdAt, updatedAt)
         VALUES (?, 'Test Trader Company', 'trader-test', 'admin@tradertest.com', ?, ?, ?,
         'STARTER', true, true, DATE_ADD(NOW(), INTERVAL 30 DAY), 'organic', ?, ?)`,
        [tenantMasterId, DB_NAME, process.env.DB_HOST || 'localhost', 
         parseInt(process.env.DB_PORT) || 3306, now, now]
      );
      console.log('   ✓ Created tenant in master database: Test Trader Company');
    } else {
      tenantMasterId = existingTenant[0].id;
      console.log('   ℹ️  Tenant already exists in master database');
    }
    
    // Create or get user in admin database (finvera_db)
    const [existingAdminUser] = await adminConnection.query(
      'SELECT id FROM users WHERE email = ?',
      ['admin@tradertest.com']
    );
    
    let adminUserId;
    
    if (existingAdminUser.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      adminUserId = uuidv4();
      
      await adminConnection.query(
        `INSERT INTO users (id, email, password, name, role, is_active, phone, createdAt, updatedAt)
         VALUES (?, 'admin@tradertest.com', ?, 'Admin User', 'tenant_admin', true, '+91-9876543210', ?, ?)`,
        [adminUserId, hashedPassword, now, now]
      );
      console.log('   ✓ Created admin user in finvera_db: admin@tradertest.com (Password: Admin@123)');
    } else {
      adminUserId = existingAdminUser[0].id;
      console.log('   ℹ️  Admin user already exists in finvera_db');
    }
    
    // Create company in master database
    const [existingCompany] = await masterConnection.query(
      'SELECT id FROM companies WHERE tenant_id = ?',
      [tenantMasterId]
    );
    
    let companyId;
    
    if (existingCompany.length === 0) {
      companyId = uuidv4();
      await masterConnection.query(
        `INSERT INTO companies (id, tenant_id, created_by_user_id, company_name, company_type,
         pan, gstin, registered_address, state, pincode, contact_number, email, financial_year_start,
         books_beginning_date, is_active, db_provisioned, db_name, db_host, db_port, createdAt, updatedAt)
         VALUES (?, ?, ?, 'Test Trader Company Pvt Ltd', 'private_limited', 'AABCT1234F',
         '27AABCT1234F1Z5', 'Test Address, Mumbai', 'Maharashtra', '400001', '+91-9876543210',
         'admin@tradertest.com', '2024-04-01', '2024-04-01', true, true, ?, ?, ?, ?, ?)`,
        [companyId, tenantMasterId, adminUserId, DB_NAME, 
         process.env.DB_HOST || 'localhost', parseInt(process.env.DB_PORT) || 3306, now, now]
      );
      console.log('   ✓ Created company in master database: Test Trader Company Pvt Ltd');
    } else {
      companyId = existingCompany[0].id;
      console.log('   ℹ️  Company already exists in master database');
    }
    
    // Create tenant admin user in tenant database
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      ['admin@tradertest.com']
    );
    
    if (existingUser.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const userId = uuidv4();
      
      await connection.query(
        `INSERT INTO users (id, email, password, name, first_name, last_name, role, is_active,
         email_verified, phone, tenant_id, createdAt, updatedAt)
         VALUES (?, 'admin@tradertest.com', ?, 'Admin User', 'Admin', 'User', 'tenant_admin',
         true, true, '+91-9876543210', ?, ?, ?)`,
        [userId, hashedPassword, tenantMasterId, now, now]
      );
      console.log('   ✓ Created tenant admin user in tenant database');
    } else {
      // Update tenant_id if it's different
      await connection.query(
        'UPDATE users SET tenant_id = ? WHERE email = ?',
        [tenantMasterId, 'admin@tradertest.com']
      );
      console.log('   ℹ️  Tenant admin user already exists in tenant database (updated tenant_id)');
    }
    
    // Get account group IDs from master database
    const [accountGroups] = await masterConnection.query(
      'SELECT id, group_code FROM account_groups WHERE group_code IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['SD', 'SC', 'SAL', 'PUR', 'BANK', 'CASH', 'DT', 'CA', 'CAP', 'INV']
    );
    
    const groupMap = {};
    accountGroups.forEach(g => {
      groupMap[g.group_code] = g.id;
    });
    
    await masterConnection.end();
    await adminConnection.end();
    
    // Store company_id for use in vouchers
    const COMPANY_ID = companyId;
    
    console.log('\n📋 Step 1: Creating Debtors (Sundry Debtors)...');
    
    const debtors = [
      { name: 'ABC Enterprises', gstin: '27AABCU9603R1ZM', city: 'Mumbai', state: 'Maharashtra', opening: 50000 },
      { name: 'XYZ Trading Co', gstin: '29AABCU9603R1ZN', city: 'Bangalore', state: 'Karnataka', opening: 75000 },
      { name: 'PQR Industries', gstin: '06AABCU9603R1ZO', city: 'Chandigarh', state: 'Haryana', opening: 100000 },
      { name: 'LMN Distributors', gstin: '09AABCU9603R1ZP', city: 'Delhi', state: 'Delhi', opening: 60000 },
      { name: 'RST Wholesale', gstin: '24AABCU9603R1ZQ', city: 'Ahmedabad', state: 'Gujarat', opening: 85000 },
    ];
    
    const debtorIds = [];
    for (const debtor of debtors) {
      const id = uuidv4();
      debtorIds.push(id);
      
      await connection.query(
        `INSERT INTO ledgers (id, ledger_name, ledger_code, account_group_id, opening_balance, opening_balance_type, 
         balance_type, current_balance, gstin, pan_no, city, state, contact_number, email, is_active, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'Dr', 'debit', ?, ?, ?, ?, ?, ?, ?, true, ?, ?, ?)`,
        [
          id,
          debtor.name,
          `DEB-${String(debtorIds.length).padStart(3, '0')}`,
          groupMap['SD'],
          debtor.opening,
          debtor.opening,
          debtor.gstin,
          debtor.gstin.substring(2, 12), // Extract PAN from GSTIN
          debtor.city,
          debtor.state,
          `+91-98765${43210 + debtorIds.length}`,
          `contact@${debtor.name.toLowerCase().replace(/\s+/g, '')}.com`,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      console.log(`   ✓ Created debtor: ${debtor.name}`);
    }
    
    console.log('\n📋 Step 2: Creating Creditors (Sundry Creditors)...');
    
    const creditors = [
      { name: 'Supplier One Pvt Ltd', gstin: '27AABCS9603R1ZA', city: 'Mumbai', state: 'Maharashtra', opening: 40000, pan: 'AABCS9603R', tds: true, section: '194C', rate: 2.00, type: 'Company' },
      { name: 'Vendor Two Industries', gstin: '29AABCS9603R1ZB', city: 'Bangalore', state: 'Karnataka', opening: 55000, pan: 'AABCS9603S', tds: true, section: '194J', rate: 10.00, type: 'Company' },
      { name: 'Material Three Co', gstin: '06AABCS9603R1ZC', city: 'Chandigarh', state: 'Haryana', opening: 70000, pan: 'AABCS9603T', tds: true, section: '194H', rate: 5.00, type: 'Individual' },
      { name: 'Goods Four Trading', gstin: '09AABCS9603R1ZD', city: 'Delhi', state: 'Delhi', opening: 45000, pan: 'AABCS9603U', tds: false, section: null, rate: 0, type: null },
      { name: 'Stock Five Suppliers', gstin: '24AABCS9603R1ZE', city: 'Ahmedabad', state: 'Gujarat', opening: 65000, pan: 'AABCS9603V', tds: true, section: '194Q', rate: 0.10, type: 'Company' },
    ];
    
    const creditorIds = [];
    for (const creditor of creditors) {
      const id = uuidv4();
      creditorIds.push(id);
      
      await connection.query(
        `INSERT INTO ledgers (id, ledger_name, ledger_code, account_group_id, opening_balance, opening_balance_type,
         balance_type, current_balance, gstin, pan_no, city, state, contact_number, email, is_tds_applicable, 
         tds_section_code, tds_deductor_type, is_active, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'Cr', 'credit', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, ?, ?, ?)`,
        [
          id,
          creditor.name,
          `CRE-${String(creditorIds.length).padStart(3, '0')}`,
          groupMap['SC'],
          creditor.opening,
          creditor.opening,
          creditor.gstin,
          creditor.pan,
          creditor.city,
          creditor.state,
          `+91-98765${54320 + creditorIds.length}`,
          `accounts@${creditor.name.toLowerCase().replace(/\s+/g, '')}.com`,
          creditor.tds,
          creditor.section,
          creditor.type,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      console.log(`   ✓ Created creditor: ${creditor.name} ${creditor.tds ? `(TDS ${creditor.section} @ ${creditor.rate}%)` : ''}`);
    }

    
    console.log('\n📋 Step 3: Creating Inventory Items...');
    
    const items = [
      { name: 'Product A - Widget', hsn: '84159000', rate: 1000, gst: 18 },
      { name: 'Product B - Gadget', hsn: '85176200', rate: 1500, gst: 18 },
      { name: 'Product C - Tool', hsn: '82054000', rate: 800, gst: 12 },
      { name: 'Product D - Component', hsn: '84099100', rate: 2000, gst: 18 },
      { name: 'Product E - Accessory', hsn: '39269099', rate: 500, gst: 12 },
    ];
    
    const itemIds = [];
    for (const item of items) {
      const id = uuidv4();
      itemIds.push(id);
      
      await connection.query(
        `INSERT INTO inventory_items (id, item_key, item_code, item_name, hsn_sac_code, uqc, gst_rate, 
         quantity_on_hand, avg_cost, selling_price, purchase_price, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'PCS', ?, 100, ?, ?, ?, ?, ?)`,
        [
          id,
          `${tenantMasterId}_${item.name.replace(/\s+/g, '_').toUpperCase()}`,
          `ITEM-${String(itemIds.length).padStart(3, '0')}`,
          item.name,
          item.hsn,
          item.gst,
          item.rate * 0.8,
          item.rate,
          item.rate * 0.8,
          now,
          now,
        ]
      );
      
      console.log(`   ✓ Created item: ${item.name}`);
    }
    
    console.log('\n📋 Step 3.5: Creating Default System Ledgers...');
    
    // Define default ledgers
    const defaultLedgers = [
      { code: 'CASH-001', name: 'Cash on Hand', group: 'CASH', balance: 'Dr', system: true },
      { code: 'BANK-001', name: 'Bank Account', group: 'BANK', balance: 'Dr', system: true },
      { code: 'SAL-001', name: 'Sales', group: 'SAL', balance: 'Cr', system: true },
      { code: 'PUR-001', name: 'Purchase', group: 'PUR', balance: 'Dr', system: true },
      { code: 'CAP-001', name: 'Capital Account', group: 'CAP', balance: 'Cr', system: true },
      { code: 'INV-001', name: 'Stock in Hand', group: 'INV', balance: 'Dr', system: true },
      { code: 'CGST-INPUT', name: 'Input CGST', group: 'CA', balance: 'Dr', system: true },
      { code: 'SGST-INPUT', name: 'Input SGST', group: 'CA', balance: 'Dr', system: true },
      { code: 'IGST-INPUT', name: 'Input IGST', group: 'CA', balance: 'Dr', system: true },
      { code: 'CGST-OUTPUT', name: 'Output CGST', group: 'DT', balance: 'Cr', system: true },
      { code: 'SGST-OUTPUT', name: 'Output SGST', group: 'DT', balance: 'Cr', system: true },
      { code: 'IGST-OUTPUT', name: 'Output IGST', group: 'DT', balance: 'Cr', system: true },
      { code: 'TDS-PAYABLE', name: 'TDS Payable', group: 'DT', balance: 'Cr', system: true },
      { code: 'TDS-RECEIVABLE', name: 'TDS Receivable', group: 'CA', balance: 'Dr', system: true },
    ];
    
    for (const ledger of defaultLedgers) {
      const [existing] = await connection.query(
        'SELECT id FROM ledgers WHERE ledger_code = ? AND tenant_id = ?',
        [ledger.code, tenantMasterId]
      );
      
      if (existing.length === 0) {
        const groupId = groupMap[ledger.group];
        if (groupId) {
          await connection.query(
            `INSERT INTO ledgers (id, ledger_code, ledger_name, account_group_id, opening_balance,
             opening_balance_type, balance_type, current_balance, is_system_generated, is_active,
             tenant_id, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, 0, ?, ?, 0, ?, true, ?, ?, ?)`,
            [
              uuidv4(),
              ledger.code,
              ledger.name,
              groupId,
              ledger.balance,
              ledger.balance === 'Dr' ? 'debit' : 'credit',
              ledger.system,
              tenantMasterId,
              now,
              now,
            ]
          );
          console.log(`   ✓ Created system ledger: ${ledger.name}`);
        }
      }
    }
    
    console.log('\n📋 Step 4: Creating Sales Invoices...');
    
    // Create 5 sales invoices (spread across January-February 2026)
    for (let i = 0; i < 5; i++) {
      const voucherId = uuidv4();
      const debtorId = debtorIds[i];
      const itemId = itemIds[i];
      const item = items[i];
      
      const quantity = 20; // Increased from 10 to 20
      const rate = item.rate;
      const taxableAmount = quantity * rate;
      const gstAmount = (taxableAmount * item.gst) / 100;
      const totalAmount = taxableAmount + gstAmount;
      
      // Create vouchers in January 2026 (dates: Jan 5, 10, 15, 20, 25)
      const voucherDate = new Date(currentYear, 0, 5 + (i * 5)); // January 2026
      
      // Create voucher
      await connection.query(
        `INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, party_ledger_id, 
         total_amount, narration, status, company_id, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, 'sales_invoice', ?, ?, ?, ?, 'posted', ?, ?, ?, ?)`,
        [
          voucherId,
          `SI-2026-${String(i + 1).padStart(4, '0')}`,
          voucherDate,
          debtorId,
          totalAmount,
          `Sales invoice for ${item.name}`,
          COMPANY_ID,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      // Create voucher item
      await connection.query(
        `INSERT INTO voucher_items (id, voucher_id, inventory_item_id, item_code, item_name, item_description,
         quantity, uqc, rate, taxable_amount, amount, hsn_sac_code, gst_rate, cgst_amount, sgst_amount, 
         igst_amount, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PCS', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [
          uuidv4(),
          voucherId,
          itemId,
          `ITEM-${String(i + 1).padStart(3, '0')}`,
          item.name,
          item.name,
          quantity,
          rate,
          taxableAmount,
          totalAmount,
          item.hsn,
          item.gst,
          gstAmount / 2,
          gstAmount / 2,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      // Create ledger entries for Sales Invoice
      // Get ledger IDs
      const [salesLedger] = await connection.query('SELECT id FROM ledgers WHERE ledger_code = ? AND tenant_id = ?', ['SAL-001', tenantMasterId]);
      const [cgstOutputLedger] = await connection.query('SELECT id FROM ledgers WHERE ledger_code = ? AND tenant_id = ?', ['CGST-OUTPUT', tenantMasterId]);
      const [sgstOutputLedger] = await connection.query('SELECT id FROM ledgers WHERE ledger_code = ? AND tenant_id = ?', ['SGST-OUTPUT', tenantMasterId]);
      
      // Debtor Dr (Total Amount)
      await connection.query(
        `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 0, 'Sales to customer', ?, ?, ?)`,
        [uuidv4(), voucherId, debtorId, totalAmount, tenantMasterId, now, now]
      );
      
      // Sales Cr (Taxable Amount)
      await connection.query(
        `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, ?, 'Sales', ?, ?, ?)`,
        [uuidv4(), voucherId, salesLedger[0].id, taxableAmount, tenantMasterId, now, now]
      );
      
      // Output CGST Cr
      await connection.query(
        `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, ?, 'Output CGST', ?, ?, ?)`,
        [uuidv4(), voucherId, cgstOutputLedger[0].id, gstAmount / 2, tenantMasterId, now, now]
      );
      
      // Output SGST Cr
      await connection.query(
        `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, ?, 'Output SGST', ?, ?, ?)`,
        [uuidv4(), voucherId, sgstOutputLedger[0].id, gstAmount / 2, tenantMasterId, now, now]
      );
      
      console.log(`   ✓ Created sales invoice: SI-2024-${String(i + 1).padStart(4, '0')} - ₹${totalAmount.toFixed(2)}`);
    }

    
    console.log('\n📋 Step 5: Creating Purchase Invoices with TDS...');
    
    // Create 5 purchase invoices with TDS (spread across December 2025 - January 2026)
    for (let i = 0; i < 5; i++) {
      const voucherId = uuidv4();
      const creditorId = creditorIds[i];
      const itemId = itemIds[i];
      const item = items[i];
      const creditor = creditors[i];
      
      const quantity = 15;
      const rate = item.rate * 0.8; // Purchase at lower rate
      const taxableAmount = quantity * rate;
      const gstAmount = (taxableAmount * item.gst) / 100;
      const subtotal = taxableAmount + gstAmount;
      
      // Calculate TDS if applicable
      let tdsAmount = 0;
      if (creditor.tds) {
        // TDS based on section and rate
        tdsAmount = (taxableAmount * creditor.rate) / 100;
      }
      
      const totalAmount = subtotal - tdsAmount;
      
      // Create vouchers in December 2025 (dates: Dec 20, 22, 24, 26, 28)
      const voucherDate = new Date(currentYear - 1, 11, 20 + (i * 2)); // December 2025
      const supplierInvoiceDate = new Date(voucherDate);
      supplierInvoiceDate.setDate(supplierInvoiceDate.getDate() - 1);
      
      // Create voucher
      await connection.query(
        `INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, party_ledger_id,
         total_amount, narration, status, supplier_invoice_number, supplier_invoice_date, 
         company_id, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, 'purchase_invoice', ?, ?, ?, ?, 'posted', ?, ?, ?, ?, ?, ?)`,
        [
          voucherId,
          `PI-2026-${String(i + 1).padStart(4, '0')}`,
          voucherDate,
          creditorId,
          totalAmount,
          `Purchase invoice for ${item.name}${creditor.tds ? ' (TDS deducted)' : ''}`,
          `SUP-INV-${String(i + 1).padStart(4, '0')}`,
          supplierInvoiceDate,
          COMPANY_ID,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      // Create voucher item
      await connection.query(
        `INSERT INTO voucher_items (id, voucher_id, inventory_item_id, item_code, item_name, item_description,
         quantity, uqc, rate, taxable_amount, amount, hsn_sac_code, gst_rate, cgst_amount, sgst_amount,
         igst_amount, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PCS', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [
          uuidv4(),
          voucherId,
          itemId,
          `ITEM-${String(i + 1).padStart(3, '0')}`,
          item.name,
          item.name,
          quantity,
          rate,
          taxableAmount,
          subtotal,
          item.hsn,
          item.gst,
          gstAmount / 2,
          gstAmount / 2,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      // Create TDS entry if applicable
      if (creditor.tds) {
        await connection.query(
          `INSERT INTO tds_details (id, voucher_id, tds_section, tds_rate, tds_amount, taxable_amount,
           deductee_name, deductee_pan, quarter, financial_year, tenant_id, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Q4', '2023-24', ?, ?, ?)`,
          [
            uuidv4(),
            voucherId,
            creditor.section,
            creditor.rate,
            tdsAmount,
            taxableAmount,
            creditor.name,
            creditor.pan,
            tenantMasterId,
            now,
            now,
          ]
        );
      }
      
      // Create ledger entries for Purchase Invoice
      // Get ledger IDs
      const [purchaseLedger] = await connection.query('SELECT id FROM ledgers WHERE ledger_code = ? AND tenant_id = ?', ['PUR-001', tenantMasterId]);
      const [cgstInputLedger] = await connection.query('SELECT id FROM ledgers WHERE ledger_code = ? AND tenant_id = ?', ['CGST-INPUT', tenantMasterId]);
      const [sgstInputLedger] = await connection.query('SELECT id FROM ledgers WHERE ledger_code = ? AND tenant_id = ?', ['SGST-INPUT', tenantMasterId]);
      const [tdsPayableLedger] = await connection.query('SELECT id FROM ledgers WHERE ledger_code = ? AND tenant_id = ?', ['TDS-PAYABLE', tenantMasterId]);
      
      if (!purchaseLedger[0] || !cgstInputLedger[0] || !sgstInputLedger[0] || !tdsPayableLedger[0]) {
        console.error('   ❌ Missing ledgers for purchase invoice. Skipping ledger entries.');
        console.error(`      Purchase: ${purchaseLedger[0] ? 'Found' : 'Missing'}`);
        console.error(`      CGST Input: ${cgstInputLedger[0] ? 'Found' : 'Missing'}`);
        console.error(`      SGST Input: ${sgstInputLedger[0] ? 'Found' : 'Missing'}`);
        console.error(`      TDS Payable: ${tdsPayableLedger[0] ? 'Found' : 'Missing'}`);
        console.log(`   ✓ Created purchase invoice: PI-2024-${String(i + 1).padStart(4, '0')} - ₹${totalAmount.toFixed(2)}${creditor.tds ? ` (TDS ${creditor.section}: ₹${tdsAmount.toFixed(2)})` : ''}`);
        continue;
      }
      
      // Purchase Dr (Taxable Amount)
      await connection.query(
        `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 0, 'Purchase', ?, ?, ?)`,
        [uuidv4(), voucherId, purchaseLedger[0].id, taxableAmount, tenantMasterId, now, now]
      );
      
      // Input CGST Dr
      await connection.query(
        `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 0, 'Input CGST', ?, ?, ?)`,
        [uuidv4(), voucherId, cgstInputLedger[0].id, gstAmount / 2, tenantMasterId, now, now]
      );
      
      // Input SGST Dr
      await connection.query(
        `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 0, 'Input SGST', ?, ?, ?)`,
        [uuidv4(), voucherId, sgstInputLedger[0].id, gstAmount / 2, tenantMasterId, now, now]
      );
      
      // Creditor Cr (Total Amount paid to supplier)
      await connection.query(
        `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, ?, 'Purchase from supplier', ?, ?, ?)`,
        [uuidv4(), voucherId, creditorId, totalAmount, tenantMasterId, now, now]
      );
      
      // TDS Payable Cr (if TDS applicable)
      if (creditor.tds && tdsAmount > 0) {
        await connection.query(
          `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
           VALUES (?, ?, ?, 0, ?, 'TDS Deducted', ?, ?, ?)`,
          [uuidv4(), voucherId, tdsPayableLedger[0].id, tdsAmount, tenantMasterId, now, now]
        );
      }
      
      console.log(`   ✓ Created purchase invoice: PI-2024-${String(i + 1).padStart(4, '0')} - ₹${totalAmount.toFixed(2)}${creditor.tds ? ` (TDS ${creditor.section}: ₹${tdsAmount.toFixed(2)})` : ''}`);
    }

    
    console.log('\n📋 Step 6: Creating Payment Vouchers...');
    
    // Get bank ledger
    const [bankLedgers] = await connection.query(
      'SELECT id FROM ledgers WHERE ledger_code = ? AND tenant_id = ?',
      ['BANK-001', tenantMasterId]
    );
    const bankLedgerId = bankLedgers[0]?.id;
    
    // Create 3 payment vouchers to creditors (in January 2026)
    for (let i = 0; i < 3; i++) {
      const voucherId = uuidv4();
      const creditorId = creditorIds[i];
      const amount = 20000 + (i * 5000);
      
      // Create payments in January 2026 (dates: Jan 28, 30, Feb 1)
      const paymentDate = new Date(currentYear, 0, 28 + (i * 2)); // Late January 2026
      
      await connection.query(
        `INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, party_ledger_id,
         total_amount, narration, status, reference_number, company_id, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, 'payment', ?, ?, ?, ?, 'posted', ?, ?, ?, ?, ?)`,
        [
          voucherId,
          `PAY-2026-${String(i + 1).padStart(4, '0')}`,
          paymentDate,
          creditorId,
          amount,
          `Payment to ${creditors[i].name}`,
          `CHQ-${String(100001 + i)}`,
          COMPANY_ID,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      // Create ledger entries (Bank Cr, Creditor Dr)
      await connection.query(
        `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, 
         narration, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, ?, 'Payment made', ?, ?, ?), (?, ?, ?, ?, 0, 'Payment received', ?, ?, ?)`,
        [
          uuidv4(), voucherId, bankLedgerId, amount, tenantMasterId, now, now,
          uuidv4(), voucherId, creditorId, amount, tenantMasterId, now, now,
        ]
      );
      
      console.log(`   ✓ Created payment voucher: PAY-2024-${String(i + 1).padStart(4, '0')} - ₹${amount.toFixed(2)}`);
    }
    
    console.log('\n📋 Step 7: Creating Receipt Vouchers...');
    
    // Create 3 receipt vouchers from debtors (in February 2026)
    for (let i = 0; i < 3; i++) {
      const voucherId = uuidv4();
      const debtorId = debtorIds[i];
      const amount = 25000 + (i * 7000);
      
      // Create receipts in February 2026 (dates: Feb 3, 5, 7)
      const receiptDate = new Date(currentYear, 1, 3 + (i * 2)); // Early February 2026
      
      await connection.query(
        `INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, party_ledger_id,
         total_amount, narration, status, reference_number, company_id, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, 'receipt', ?, ?, ?, ?, 'posted', ?, ?, ?, ?, ?)`,
        [
          voucherId,
          `REC-2026-${String(i + 1).padStart(4, '0')}`,
          receiptDate,
          debtorId,
          amount,
          `Receipt from ${debtors[i].name}`,
          `NEFT-${String(200001 + i)}`,
          COMPANY_ID,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      // Create ledger entries (Bank Dr, Debtor Cr)
      await connection.query(
        `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount,
         narration, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 0, 'Receipt received', ?, ?, ?), (?, ?, ?, 0, ?, 'Payment made', ?, ?, ?)`,
        [
          uuidv4(), voucherId, bankLedgerId, amount, tenantMasterId, now, now,
          uuidv4(), voucherId, debtorId, amount, tenantMasterId, now, now,
        ]
      );
      
      console.log(`   ✓ Created receipt voucher: REC-2026-${String(i + 1).padStart(4, '0')} - ₹${amount.toFixed(2)}`);
    }

    
    console.log('\n📋 Step 8: Creating Journal Vouchers...');
    
    // Get expense and income ledgers
    const [expenseLedgers] = await connection.query(
      'SELECT id FROM ledgers WHERE ledger_code = ? AND tenant_id = ?',
      ['PUR-001', tenantMasterId]
    );
    const expenseLedgerId = expenseLedgers[0]?.id;
    
    const [incomeLedgers] = await connection.query(
      'SELECT id FROM ledgers WHERE ledger_code = ? AND tenant_id = ?',
      ['SAL-001', tenantMasterId]
    );
    const incomeLedgerId = incomeLedgers[0]?.id;
    
    // Create 2 journal vouchers (in January 2026)
    const journalEntries = [
      { narration: 'Adjustment entry for expenses', amount: 5000, debit: expenseLedgerId, credit: bankLedgerId },
      { narration: 'Adjustment entry for income', amount: 7500, debit: bankLedgerId, credit: incomeLedgerId },
    ];
    
    for (let i = 0; i < journalEntries.length; i++) {
      const voucherId = uuidv4();
      const entry = journalEntries[i];
      
      // Create journals in January 2026 (dates: Jan 26, 27)
      const journalDate = new Date(currentYear, 0, 26 + i); // Late January 2026
      
      await connection.query(
        `INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, total_amount,
         narration, status, company_id, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, 'journal', ?, ?, ?, 'posted', ?, ?, ?, ?)`,
        [
          voucherId,
          `JV-2026-${String(i + 1).padStart(4, '0')}`,
          journalDate,
          entry.amount,
          entry.narration,
          COMPANY_ID,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      // Create ledger entries
      await connection.query(
        `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount,
         narration, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?), (?, ?, ?, 0, ?, ?, ?, ?, ?)`,
        [
          uuidv4(), voucherId, entry.debit, entry.amount, entry.narration, tenantMasterId, now, now,
          uuidv4(), voucherId, entry.credit, entry.amount, entry.narration, tenantMasterId, now, now,
        ]
      );
      
      console.log(`   ✓ Created journal voucher: JV-2026-${String(i + 1).padStart(4, '0')} - ₹${entry.amount.toFixed(2)}`);
    }
    
    console.log('\n📋 Step 9: Creating Contra Vouchers...');
    
    // Get cash ledger
    const [cashLedgers] = await connection.query(
      'SELECT id FROM ledgers WHERE ledger_code = ? AND tenant_id = ?',
      ['CASH-001', tenantMasterId]
    );
    const cashLedgerId = cashLedgers[0]?.id;
    
    // Create 2 contra vouchers (cash to bank and bank to cash) in February 2026
    const contraEntries = [
      { narration: 'Cash deposited to bank', amount: 10000, debit: bankLedgerId, credit: cashLedgerId },
      { narration: 'Cash withdrawn from bank', amount: 8000, debit: cashLedgerId, credit: bankLedgerId },
    ];
    
    for (let i = 0; i < contraEntries.length; i++) {
      const voucherId = uuidv4();
      const entry = contraEntries[i];
      
      // Create contras in February 2026 (dates: Feb 9, 10)
      const contraDate = new Date(currentYear, 1, 9 + i); // Early February 2026
      
      await connection.query(
        `INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, total_amount,
         narration, status, company_id, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, 'contra', ?, ?, ?, 'posted', ?, ?, ?, ?)`,
        [
          voucherId,
          `CNT-2026-${String(i + 1).padStart(4, '0')}`,
          contraDate,
          entry.amount,
          entry.narration,
          COMPANY_ID,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      // Create ledger entries
      await connection.query(
        `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount,
         narration, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?), (?, ?, ?, 0, ?, ?, ?, ?, ?)`,
        [
          uuidv4(), voucherId, entry.debit, entry.amount, entry.narration, tenantMasterId, now, now,
          uuidv4(), voucherId, entry.credit, entry.amount, entry.narration, tenantMasterId, now, now,
        ]
      );
      
      console.log(`   ✓ Created contra voucher: CNT-2024-${String(i + 1).padStart(4, '0')} - ₹${entry.amount.toFixed(2)}`);
    }

    console.log('\n📋 Step 10: Creating Debit Notes...');
    
    // Create 3 debit notes (purchase returns)
    for (let i = 0; i < 3; i++) {
      const voucherId = uuidv4();
      const creditorId = creditorIds[i];
      const itemId = itemIds[i];
      const item = items[i];
      
      const quantity = 2; // Return quantity
      const rate = item.rate * 0.8;
      const taxableAmount = quantity * rate;
      const gstAmount = (taxableAmount * item.gst) / 100;
      const totalAmount = taxableAmount + gstAmount;
      
      // Create debit note voucher
      await connection.query(
        `INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, party_ledger_id,
         total_amount, narration, status, reference_number, company_id, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, 'debit_note', ?, ?, ?, ?, 'posted', ?, ?, ?, ?, ?)`,
        [
          voucherId,
          `DN-2024-${String(i + 1).padStart(4, '0')}`,
          new Date(2024, 1, 5 + i),
          creditorId,
          totalAmount,
          `Debit note for purchase return - ${item.name}`,
          `PI-2024-${String(i + 1).padStart(4, '0')}`,
          COMPANY_ID,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      // Create voucher item
      await connection.query(
        `INSERT INTO voucher_items (id, voucher_id, inventory_item_id, item_code, item_name, item_description,
         quantity, uqc, rate, taxable_amount, amount, hsn_sac_code, gst_rate, cgst_amount, sgst_amount,
         igst_amount, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PCS', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [
          uuidv4(),
          voucherId,
          itemId,
          `ITEM-${String(i + 1).padStart(3, '0')}`,
          item.name,
          `Return: ${item.name}`,
          quantity,
          rate,
          taxableAmount,
          totalAmount,
          item.hsn,
          item.gst,
          gstAmount / 2,
          gstAmount / 2,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      console.log(`   ✓ Created debit note: DN-2024-${String(i + 1).padStart(4, '0')} - ₹${totalAmount.toFixed(2)}`);
    }
    
    console.log('\n📋 Step 11: Creating Credit Notes...');
    
    // Create 3 credit notes (sales returns)
    for (let i = 0; i < 3; i++) {
      const voucherId = uuidv4();
      const debtorId = debtorIds[i];
      const itemId = itemIds[i];
      const item = items[i];
      
      const quantity = 1; // Return quantity
      const rate = item.rate;
      const taxableAmount = quantity * rate;
      const gstAmount = (taxableAmount * item.gst) / 100;
      const totalAmount = taxableAmount + gstAmount;
      
      // Create credit note voucher
      await connection.query(
        `INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, party_ledger_id,
         total_amount, narration, status, reference_number, company_id, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, 'credit_note', ?, ?, ?, ?, 'posted', ?, ?, ?, ?, ?)`,
        [
          voucherId,
          `CN-2024-${String(i + 1).padStart(4, '0')}`,
          new Date(2024, 1, 8 + i),
          debtorId,
          totalAmount,
          `Credit note for sales return - ${item.name}`,
          `SI-2024-${String(i + 1).padStart(4, '0')}`,
          COMPANY_ID,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      // Create voucher item
      await connection.query(
        `INSERT INTO voucher_items (id, voucher_id, inventory_item_id, item_code, item_name, item_description,
         quantity, uqc, rate, taxable_amount, amount, hsn_sac_code, gst_rate, cgst_amount, sgst_amount,
         igst_amount, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PCS', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [
          uuidv4(),
          voucherId,
          itemId,
          `ITEM-${String(i + 1).padStart(3, '0')}`,
          item.name,
          `Return: ${item.name}`,
          quantity,
          rate,
          taxableAmount,
          totalAmount,
          item.hsn,
          item.gst,
          gstAmount / 2,
          gstAmount / 2,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      console.log(`   ✓ Created credit note: CN-2024-${String(i + 1).padStart(4, '0')} - ₹${totalAmount.toFixed(2)}`);
    }
    
    console.log('\n📋 Step 12: Creating Warehouses...');
    
    // Create 2 warehouses
    const warehouses = [
      { name: 'Main Warehouse', city: 'Mumbai', state: 'Maharashtra', code: 'WH-001', pincode: '400001' },
      { name: 'Branch Warehouse', city: 'Pune', state: 'Maharashtra', code: 'WH-002', pincode: '411001' },
    ];
    
    const warehouseIds = [];
    for (const warehouse of warehouses) {
      const id = uuidv4();
      warehouseIds.push(id);
      
      await connection.query(
        `INSERT INTO warehouses (id, warehouse_name, warehouse_code, address, city, state,
         pincode, is_active, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, true, ?, ?, ?)`,
        [
          id,
          warehouse.name,
          warehouse.code,
          `${warehouse.code} Building, Industrial Area, ${warehouse.city}`,
          warehouse.city,
          warehouse.state,
          warehouse.pincode,
          tenantMasterId,
          now,
          now,
        ]
      );
      
      console.log(`   ✓ Created warehouse: ${warehouse.name} (${warehouse.city})`);
    }
    
    console.log('\n📋 Step 13: Creating Stock Movements & Warehouse Stocks...');
    
    // Create stock movements and warehouse stocks for each item
    for (let i = 0; i < itemIds.length; i++) {
      const itemId = itemIds[i];
      const item = items[i];
      
      for (let w = 0; w < warehouseIds.length; w++) {
        const warehouseId = warehouseIds[w];
        const quantity = 50 + (i * 10) + (w * 5);
        
        // Create stock movement (initial stock)
        await connection.query(
          `INSERT INTO stock_movements (id, inventory_item_id, warehouse_id, movement_type, quantity,
           rate, amount, reference_number, narration, movement_date, tenant_id, createdAt, updatedAt)
           VALUES (?, ?, ?, 'IN', ?, ?, ?, 'OPENING-STOCK', 'Opening stock', ?, ?, ?, ?)`,
          [
            uuidv4(),
            itemId,
            warehouseId,
            quantity,
            item.rate * 0.8,
            quantity * item.rate * 0.8,
            new Date(2024, 0, 1),
            tenantMasterId,
            now,
            now,
          ]
        );
        
        // Create warehouse stock
        await connection.query(
          `INSERT INTO warehouse_stocks (id, inventory_item_id, warehouse_id, quantity,
           avg_cost, last_updated, tenant_id, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            itemId,
            warehouseId,
            quantity,
            item.rate * 0.8,
            now,
            tenantMasterId,
            now,
            now,
          ]
        );
      }
      
      console.log(`   ✓ Created stock for: ${item.name} (Total: ${(50 + (i * 10)) * 2 + 5} units across warehouses)`);
    }
    
    console.log('\n📋 Step 14: Creating GSTIN Records...');
    
    // Create GSTIN record for the company
    await connection.query(
      `INSERT INTO gstins (id, gstin, legal_name, trade_name, state_code, state,
       is_active, is_primary, tenant_id, createdAt, updatedAt)
       VALUES (?, '27AABCT1234F1Z5', 'Test Trader Company Pvt Ltd', 'Test Trader Company', '27',
       'Maharashtra', true, true, ?, ?, ?)`,
      [uuidv4(), tenantMasterId, now, now]
    );
    
    console.log('   ✓ Created GSTIN record for company');

    
    console.log('\n📋 Step 15: Updating Ledger Balances...');
    
    // Update all ledger balances based on voucher_ledger_entries
    const [allLedgers] = await connection.query(
      'SELECT id, ledger_code, ledger_name, opening_balance, opening_balance_type, balance_type FROM ledgers WHERE tenant_id = ?',
      [tenantMasterId]
    );
    
    for (const ledger of allLedgers) {
      // Calculate total debits and credits from ledger entries
      const [entries] = await connection.query(
        'SELECT SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit FROM voucher_ledger_entries WHERE ledger_id = ?',
        [ledger.id]
      );
      
      const totalDebit = parseFloat(entries[0]?.total_debit || 0);
      const totalCredit = parseFloat(entries[0]?.total_credit || 0);
      const openingBalance = parseFloat(ledger.opening_balance || 0);
      
      // Calculate current balance based on ledger type
      let currentBalance = openingBalance;
      if (ledger.balance_type === 'debit' || ledger.opening_balance_type === 'Dr') {
        currentBalance = openingBalance + totalDebit - totalCredit;
      } else {
        currentBalance = openingBalance + totalCredit - totalDebit;
      }
      
      // Update the ledger's current balance
      await connection.query(
        'UPDATE ledgers SET current_balance = ? WHERE id = ?',
        [Math.abs(currentBalance), ledger.id]
      );
    }
    
    console.log(`   ✓ Updated balances for ${allLedgers.length} ledgers`);
    
    console.log('\n📋 Step 16: Summary...\n');
    
    // Get counts
    const [debtorCount] = await connection.query(
      'SELECT COUNT(*) as count FROM ledgers WHERE ledger_code LIKE "DEB-%" AND tenant_id = ?',
      [tenantMasterId]
    );
    
    const [creditorCount] = await connection.query(
      'SELECT COUNT(*) as count FROM ledgers WHERE ledger_code LIKE "CRE-%" AND tenant_id = ?',
      [tenantMasterId]
    );
    
    const [itemCount] = await connection.query(
      'SELECT COUNT(*) as count FROM inventory_items',
      []
    );
    
    const [voucherCount] = await connection.query(
      'SELECT voucher_type, COUNT(*) as count FROM vouchers WHERE tenant_id = ? GROUP BY voucher_type',
      [tenantMasterId]
    );
    
    const [tdsCount] = await connection.query(
      'SELECT COUNT(*) as count FROM tds_details WHERE tenant_id = ?',
      [tenantMasterId]
    );
    
    const [warehouseCount] = await connection.query(
      'SELECT COUNT(*) as count FROM warehouses WHERE tenant_id = ?',
      [tenantMasterId]
    );
    
    const [stockMovementCount] = await connection.query(
      'SELECT COUNT(*) as count FROM stock_movements WHERE tenant_id = ?',
      [tenantMasterId]
    );
    
    const [warehouseStockCount] = await connection.query(
      'SELECT COUNT(*) as count FROM warehouse_stocks WHERE tenant_id = ?',
      [tenantMasterId]
    );
    
    const [gstinCount] = await connection.query(
      'SELECT COUNT(*) as count FROM gstins WHERE tenant_id = ?',
      [tenantMasterId]
    );
    
    console.log('✅ Test Data Seeding Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Debtors (Sundry Debtors): ${debtorCount[0].count}`);
    console.log(`   Creditors (Sundry Creditors): ${creditorCount[0].count}`);
    console.log(`   Inventory Items: ${itemCount[0].count}`);
    console.log(`   Warehouses: ${warehouseCount[0].count}`);
    console.log(`   Vouchers:`);
    voucherCount.forEach(v => {
      console.log(`      - ${v.voucher_type}: ${v.count}`);
    });
    console.log(`   TDS Entries: ${tdsCount[0].count}`);
    console.log(`   Stock Movements: ${stockMovementCount[0].count}`);
    console.log(`   Warehouse Stocks: ${warehouseStockCount[0].count}`);
    console.log(`   GSTIN Records: ${gstinCount[0].count}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error seeding test data:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the seeder
seedTestData()
  .then(() => {
    console.log('✨ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
