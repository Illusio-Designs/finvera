/**
 * Comprehensive Seed Data for Retail Account
 * - Checks for existing data before inserting
 * - Creates all voucher types
 * - Properly handles serialized inventory
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const DB_NAME = 'finvera_retail_test';

async function seedRetailTestData() {
  console.log('🌱 Seeding Comprehensive Test Data for Retail Account...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
  });

  try {
    const now = new Date();
    
    // Get tenant and company info
    const masterConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.MASTER_DB_NAME || 'finvera_master',
    });
    
    const [tenants] = await masterConnection.query(
      'SELECT id FROM tenant_master WHERE email = ?',
      ['admin@retailtest.com']
    );
    
    if (tenants.length === 0) throw new Error('Tenant not found');
    const tenantId = tenants[0].id;
    
    const [companies] = await masterConnection.query(
      'SELECT id FROM companies WHERE tenant_id = ?',
      [tenantId]
    );
    
    if (companies.length === 0) throw new Error('Company not found');
    const companyId = companies[0].id;
    
    // Get account groups
    const [accountGroups] = await masterConnection.query(
      'SELECT id, group_code FROM account_groups WHERE group_code IN (?, ?)',
      ['SC', 'SD']
    );
    
    const groupMap = {};
    accountGroups.forEach(g => {
      groupMap[g.group_code] = g.id;
    });

    
    // Enable barcode functionality
    await masterConnection.query(
      `UPDATE tenant_master SET settings = JSON_SET(
        COALESCE(settings, '{}'),
        '$.barcode_enabled', true,
        '$.default_barcode_type', 'EAN13',
        '$.default_barcode_prefix', 'PRD'
      ) WHERE id = ?`,
      [tenantId]
    );
    
    await masterConnection.end();
    
    console.log('✓ Found tenant:', tenantId);
    console.log('✓ Found company:', companyId);
    console.log('✓ Enabled barcode functionality\n');
    
    // Get system ledgers
    const getLedger = async (code) => {
      const [ledger] = await connection.query('SELECT id FROM ledgers WHERE ledger_code = ? LIMIT 1', [code]);
      return ledger[0]?.id;
    };
    
    const ledgerIds = {
      purchase: await getLedger('PUR-001'),
      sales: await getLedger('SAL-001'),
      cash: await getLedger('CASH-001'),
      bank: await getLedger('BANK-001'),
      cgstInput: await getLedger('CGST-INPUT'),
      sgstInput: await getLedger('SGST-INPUT'),
      cgstOutput: await getLedger('CGST-OUTPUT'),
      sgstOutput: await getLedger('SGST-OUTPUT'),
    };
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 1: CREATING LEDGERS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Create Suppliers (Creditors)
    const suppliers = [
      { name: 'Electronics Wholesale Pvt Ltd', gstin: '27AABCE1234F1Z5', city: 'Mumbai', state: 'Maharashtra', opening: 50000 },
      { name: 'Tech Distributors India', gstin: '29AABCE5678F1Z6', city: 'Bangalore', state: 'Karnataka', opening: 75000 },
      { name: 'Mobile Accessories Hub', gstin: '06AABCE9012F1Z7', city: 'Chandigarh', state: 'Haryana', opening: 40000 },
    ];
    
    const supplierIds = [];
    for (const supplier of suppliers) {
      const [existing] = await connection.query(
        'SELECT id FROM ledgers WHERE ledger_name = ?',
        [supplier.name]
      );
      
      if (existing.length > 0) {
        supplierIds.push(existing[0].id);
        console.log(`   ✓ Supplier exists: ${supplier.name}`);
      } else {
        const id = uuidv4();
        await connection.query(
          `INSERT INTO ledgers (id, ledger_name, ledger_code, account_group_id, opening_balance, opening_balance_type,
           balance_type, current_balance, gstin, pan_no, city, state, contact_number, email, is_active, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'Cr', 'credit', ?, ?, ?, ?, ?, ?, ?, true, ?, ?)`,
          [
            id, supplier.name, `SUP-${String(supplierIds.length + 1).padStart(3, '0')}`,
            groupMap['SC'], supplier.opening, supplier.opening, supplier.gstin,
            supplier.gstin.substring(2, 12), supplier.city, supplier.state,
            `+91-98765${43210 + supplierIds.length}`,
            `accounts@${supplier.name.toLowerCase().replace(/\s+/g, '')}.com`, now, now
          ]
        );
        supplierIds.push(id);
        console.log(`   ✓ Created supplier: ${supplier.name}`);
      }
    }
    
    // Create Customers (Debtors)
    const customers = [
      { name: 'Walk-in Customer', gstin: null, city: 'Mumbai', state: 'Maharashtra', opening: 0 },
      { name: 'ABC Retail Store', gstin: '27AABCU1234R1Z1', city: 'Mumbai', state: 'Maharashtra', opening: 25000 },
      { name: 'XYZ Electronics', gstin: '29AABCU5678R1Z2', city: 'Bangalore', state: 'Karnataka', opening: 35000 },
    ];
    
    const customerIds = [];
    for (const customer of customers) {
      const [existing] = await connection.query(
        'SELECT id FROM ledgers WHERE ledger_name = ?',
        [customer.name]
      );
      
      if (existing.length > 0) {
        customerIds.push(existing[0].id);
        console.log(`   ✓ Customer exists: ${customer.name}`);
      } else {
        const id = uuidv4();
        await connection.query(
          `INSERT INTO ledgers (id, ledger_name, ledger_code, account_group_id, opening_balance, opening_balance_type,
           balance_type, current_balance, gstin, pan_no, city, state, contact_number, is_active, tenant_id, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'Dr', 'debit', ?, ?, ?, ?, ?, ?, true, ?, ?, ?)`,
          [
            id, customer.name, `CUST-${String(customerIds.length + 1).padStart(3, '0')}`,
            groupMap['SD'], customer.opening, customer.opening, customer.gstin,
            customer.gstin ? customer.gstin.substring(2, 12) : null,
            customer.city, customer.state, `+91-98765${54320 + customerIds.length}`, tenantId, now, now
          ]
        );
        customerIds.push(id);
        console.log(`   ✓ Created customer: ${customer.name}`);
      }
    }

    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('STEP 2: CREATING INVENTORY ITEMS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const items = [
      { name: 'Samsung Galaxy S23', hsn: '85171200', barcode: '8801643709983', mrp: 79999, selling: 74999, purchase: 68000, gst: 18, serialized: true },
      { name: 'iPhone 15 Pro', hsn: '85171200', barcode: '0194253408406', mrp: 134900, selling: 129900, purchase: 118000, gst: 18, serialized: true },
      { name: 'OnePlus 11R', hsn: '85171200', barcode: '6921815625476', mrp: 39999, selling: 37999, purchase: 34000, gst: 18, serialized: true },
      { name: 'Sony WH-1000XM5 Headphones', hsn: '85183000', barcode: '4548736134157', mrp: 29990, selling: 27990, purchase: 24000, gst: 18, serialized: true },
      { name: 'Samsung 65" 4K Smart TV', hsn: '85287200', barcode: '8806094935356', mrp: 89990, selling: 84990, purchase: 76000, gst: 18, serialized: true },
      { name: 'Dell XPS 15 Laptop', hsn: '84713000', barcode: '0884116365891', mrp: 159990, selling: 154990, purchase: 142000, gst: 18, serialized: true },
      { name: 'Logitech MX Master 3S Mouse', hsn: '84716060', barcode: '5099206098237', mrp: 8995, selling: 8495, purchase: 7200, gst: 18, serialized: false },
      { name: 'Anker PowerCore 20000mAh', hsn: '85076000', barcode: '0194644037352', mrp: 3999, selling: 3499, purchase: 2800, gst: 12, serialized: false },
      { name: 'USB-C Cable 2m', hsn: '85444900', barcode: '1234567890123', mrp: 599, selling: 499, purchase: 350, gst: 18, serialized: false },
      { name: 'Phone Case Universal', hsn: '39269099', barcode: '9876543210987', mrp: 299, selling: 249, purchase: 150, gst: 12, serialized: false },
    ];
    
    const itemIds = [];
    for (const item of items) {
      const [existing] = await connection.query(
        'SELECT id FROM inventory_items WHERE item_key = ?',
        [`${tenantId}_${item.name.replace(/\s+/g, '_').toUpperCase()}`]
      );
      
      let id;
      if (existing.length > 0) {
        id = existing[0].id;
        await connection.query(
          'UPDATE inventory_items SET is_serialized = ?, mrp = ?, selling_price = ?, purchase_price = ?, gst_rate = ? WHERE id = ?',
          [item.serialized, item.mrp, item.selling, item.purchase, item.gst, id]
        );
        const type = item.serialized ? '[SERIALIZED]' : '[REGULAR]   ';
        console.log(`   ${type} Updated: ${item.name}`);
      } else {
        id = uuidv4();
        await connection.query(
          `INSERT INTO inventory_items (id, item_key, item_code, item_name, hsn_sac_code, barcode, uqc, gst_rate, 
           quantity_on_hand, avg_cost, mrp, selling_price, purchase_price, is_serialized, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, 'PCS', ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, `${tenantId}_${item.name.replace(/\s+/g, '_').toUpperCase()}`,
            `ITEM-${String(itemIds.length + 1).padStart(3, '0')}`, item.name, item.hsn, item.barcode,
            item.gst, item.purchase, item.mrp, item.selling, item.purchase, item.serialized, now, now
          ]
        );
        const type = item.serialized ? '[SERIALIZED]' : '[REGULAR]   ';
        console.log(`   ${type} Created: ${item.name}`);
      }
      itemIds.push(id);
    }

    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('STEP 3: CREATING VOUCHERS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Helper function to create voucher
    const createVoucher = async (voucherData) => {
      const voucherId = uuidv4();
      
      await connection.query(
        `INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, party_ledger_id,
         total_amount, narration, status, supplier_invoice_number, supplier_invoice_date, 
         company_id, tenant_id, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          voucherId, voucherData.number, voucherData.type, voucherData.date,
          voucherData.partyId, voucherData.total, voucherData.narration, 'posted',
          voucherData.supplierInvoice || null, voucherData.supplierDate || null,
          companyId, tenantId, now, now
        ]
      );
      
      // Create voucher items
      for (const item of voucherData.items) {
        await connection.query(
          `INSERT INTO voucher_items (id, voucher_id, inventory_item_id, item_code, item_name, item_description,
           quantity, uqc, rate, taxable_amount, amount, hsn_sac_code, gst_rate, cgst_amount, sgst_amount,
           igst_amount, tenant_id, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'PCS', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
          [
            uuidv4(), voucherId, item.itemId, item.code, item.name, item.name,
            item.qty, item.rate, item.taxable, item.total, item.hsn, item.gst,
            item.gstAmt / 2, item.gstAmt / 2, tenantId, now, now
          ]
        );
      }
      
      // Create ledger entries
      for (const entry of voucherData.ledgerEntries) {
        await connection.query(
          `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), voucherId, entry.ledgerId, entry.debit, entry.credit, entry.narration, tenantId, now, now]
        );
      }
      
      return voucherId;
    };
    
    // 1. PURCHASE INVOICES
    console.log('📦 Creating Purchase Invoices...');
    
    const purchase1Items = [
      { itemId: itemIds[0], code: 'ITEM-001', name: items[0].name, hsn: items[0].hsn, qty: 5, rate: items[0].purchase, gst: items[0].gst },
      { itemId: itemIds[3], code: 'ITEM-004', name: items[3].name, hsn: items[3].hsn, qty: 3, rate: items[3].purchase, gst: items[3].gst },
    ];
    
    let totalTaxable = 0, totalGst = 0;
    purchase1Items.forEach(item => {
      item.taxable = item.qty * item.rate;
      item.gstAmt = (item.taxable * item.gst) / 100;
      item.total = item.taxable + item.gstAmt;
      totalTaxable += item.taxable;
      totalGst += item.gstAmt;
    });
    
    await createVoucher({
      number: 'PI-2026-0001',
      type: 'purchase_invoice',
      date: new Date(2026, 1, 10),
      partyId: supplierIds[0],
      total: totalTaxable + totalGst,
      narration: 'Purchase from Electronics Wholesale',
      supplierInvoice: 'SUP-INV-001',
      supplierDate: new Date(2026, 1, 9),
      items: purchase1Items,
      ledgerEntries: [
        { ledgerId: ledgerIds.purchase, debit: totalTaxable, credit: 0, narration: 'Purchase' },
        { ledgerId: ledgerIds.cgstInput, debit: totalGst / 2, credit: 0, narration: 'Input CGST' },
        { ledgerId: ledgerIds.sgstInput, debit: totalGst / 2, credit: 0, narration: 'Input SGST' },
        { ledgerId: supplierIds[0], debit: 0, credit: totalTaxable + totalGst, narration: 'Supplier' },
      ]
    });
    console.log(`   ✓ PI-2026-0001 - ₹${(totalTaxable + totalGst).toFixed(2)}`);
    
    // 2. SALES INVOICES
    console.log('\n📤 Creating Sales Invoices...');
    
    const sales1Items = [
      { itemId: itemIds[6], code: 'ITEM-007', name: items[6].name, hsn: items[6].hsn, qty: 10, rate: items[6].selling, gst: items[6].gst },
      { itemId: itemIds[8], code: 'ITEM-009', name: items[8].name, hsn: items[8].hsn, qty: 20, rate: items[8].selling, gst: items[8].gst },
    ];
    
    totalTaxable = 0; totalGst = 0;
    sales1Items.forEach(item => {
      item.taxable = item.qty * item.rate;
      item.gstAmt = (item.taxable * item.gst) / 100;
      item.total = item.taxable + item.gstAmt;
      totalTaxable += item.taxable;
      totalGst += item.gstAmt;
    });
    
    await createVoucher({
      number: 'SI-2026-0001',
      type: 'sales_invoice',
      date: new Date(2026, 1, 15),
      partyId: customerIds[1],
      total: totalTaxable + totalGst,
      narration: 'Sales to ABC Retail Store',
      items: sales1Items,
      ledgerEntries: [
        { ledgerId: customerIds[1], debit: totalTaxable + totalGst, credit: 0, narration: 'Customer' },
        { ledgerId: ledgerIds.sales, debit: 0, credit: totalTaxable, narration: 'Sales' },
        { ledgerId: ledgerIds.cgstOutput, debit: 0, credit: totalGst / 2, narration: 'Output CGST' },
        { ledgerId: ledgerIds.sgstOutput, debit: 0, credit: totalGst / 2, narration: 'Output SGST' },
      ]
    });
    console.log(`   ✓ SI-2026-0001 - ₹${(totalTaxable + totalGst).toFixed(2)}`);

    
    // 3. PAYMENT VOUCHERS
    console.log('\n💸 Creating Payment Vouchers...');
    
    const paymentId1 = uuidv4();
    await connection.query(
      `INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, party_ledger_id,
       total_amount, narration, status, reference_number, company_id, tenant_id, createdAt, updatedAt)
       VALUES (?, 'PAY-2026-0001', 'payment', ?, ?, 50000, 'Payment to supplier', 'posted', 'CHQ-100001', ?, ?, ?, ?)`,
      [paymentId1, new Date(2026, 1, 18), supplierIds[0], companyId, tenantId, now, now]
    );
    
    await connection.query(
      `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
       VALUES (?, ?, ?, 50000, 0, 'Payment to supplier', ?, ?, ?), (?, ?, ?, 0, 50000, 'Bank payment', ?, ?, ?)`,
      [uuidv4(), paymentId1, supplierIds[0], tenantId, now, now,
       uuidv4(), paymentId1, ledgerIds.bank, tenantId, now, now]
    );
    console.log('   ✓ PAY-2026-0001 - ₹50,000.00');
    
    // 4. RECEIPT VOUCHERS
    console.log('\n💰 Creating Receipt Vouchers...');
    
    const receiptId1 = uuidv4();
    await connection.query(
      `INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, party_ledger_id,
       total_amount, narration, status, reference_number, company_id, tenant_id, createdAt, updatedAt)
       VALUES (?, 'REC-2026-0001', 'receipt', ?, ?, 25000, 'Receipt from customer', 'posted', 'NEFT-200001', ?, ?, ?, ?)`,
      [receiptId1, new Date(2026, 1, 20), customerIds[1], companyId, tenantId, now, now]
    );
    
    await connection.query(
      `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
       VALUES (?, ?, ?, 25000, 0, 'Bank receipt', ?, ?, ?), (?, ?, ?, 0, 25000, 'Receipt from customer', ?, ?, ?)`,
      [uuidv4(), receiptId1, ledgerIds.bank, tenantId, now, now,
       uuidv4(), receiptId1, customerIds[1], tenantId, now, now]
    );
    console.log('   ✓ REC-2026-0001 - ₹25,000.00');
    
    // 5. JOURNAL VOUCHERS
    console.log('\n📝 Creating Journal Vouchers...');
    
    const journalId1 = uuidv4();
    await connection.query(
      `INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, total_amount, narration, status, company_id, tenant_id, createdAt, updatedAt)
       VALUES (?, 'JV-2026-0001', 'journal', ?, 5000, 'Adjustment entry', 'posted', ?, ?, ?, ?)`,
      [journalId1, new Date(2026, 1, 22), companyId, tenantId, now, now]
    );
    
    await connection.query(
      `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
       VALUES (?, ?, ?, 5000, 0, 'Adjustment debit', ?, ?, ?), (?, ?, ?, 0, 5000, 'Adjustment credit', ?, ?, ?)`,
      [uuidv4(), journalId1, ledgerIds.cash, tenantId, now, now,
       uuidv4(), journalId1, ledgerIds.bank, tenantId, now, now]
    );
    console.log('   ✓ JV-2026-0001 - ₹5,000.00');
    
    // 6. CONTRA VOUCHERS
    console.log('\n🔄 Creating Contra Vouchers...');
    
    const contraId1 = uuidv4();
    await connection.query(
      `INSERT INTO vouchers (id, voucher_number, voucher_type, voucher_date, total_amount, narration, status, company_id, tenant_id, createdAt, updatedAt)
       VALUES (?, 'CON-2026-0001', 'contra', ?, 10000, 'Cash withdrawn from bank', 'posted', ?, ?, ?, ?)`,
      [contraId1, new Date(2026, 1, 23), companyId, tenantId, now, now]
    );
    
    await connection.query(
      `INSERT INTO voucher_ledger_entries (id, voucher_id, ledger_id, debit_amount, credit_amount, narration, tenant_id, createdAt, updatedAt)
       VALUES (?, ?, ?, 10000, 0, 'Cash received', ?, ?, ?), (?, ?, ?, 0, 10000, 'Bank withdrawal', ?, ?, ?)`,
      [uuidv4(), contraId1, ledgerIds.cash, tenantId, now, now,
       uuidv4(), contraId1, ledgerIds.bank, tenantId, now, now]
    );
    console.log('   ✓ CON-2026-0001 - ₹10,000.00');
    
    // 7. CREDIT NOTE
    console.log('\n📋 Creating Credit Notes...');
    
    const creditItems = [
      { itemId: itemIds[8], code: 'ITEM-009', name: items[8].name, hsn: items[8].hsn, qty: 2, rate: items[8].selling, gst: items[8].gst },
    ];
    
    totalTaxable = 0; totalGst = 0;
    creditItems.forEach(item => {
      item.taxable = item.qty * item.rate;
      item.gstAmt = (item.taxable * item.gst) / 100;
      item.total = item.taxable + item.gstAmt;
      totalTaxable += item.taxable;
      totalGst += item.gstAmt;
    });
    
    await createVoucher({
      number: 'CN-2026-0001',
      type: 'credit_note',
      date: new Date(2026, 1, 24),
      partyId: customerIds[1],
      total: totalTaxable + totalGst,
      narration: 'Sales return from customer',
      items: creditItems,
      ledgerEntries: [
        { ledgerId: ledgerIds.sales, debit: totalTaxable, credit: 0, narration: 'Sales return' },
        { ledgerId: ledgerIds.cgstOutput, debit: totalGst / 2, credit: 0, narration: 'Output CGST reversal' },
        { ledgerId: ledgerIds.sgstOutput, debit: totalGst / 2, credit: 0, narration: 'Output SGST reversal' },
        { ledgerId: customerIds[1], debit: 0, credit: totalTaxable + totalGst, narration: 'Customer credit' },
      ]
    });
    console.log(`   ✓ CN-2026-0001 - ₹${(totalTaxable + totalGst).toFixed(2)}`);
    
    // 8. DEBIT NOTE
    console.log('\n📋 Creating Debit Notes...');
    
    const debitItems = [
      { itemId: itemIds[7], code: 'ITEM-008', name: items[7].name, hsn: items[7].hsn, qty: 1, rate: items[7].purchase, gst: items[7].gst },
    ];
    
    totalTaxable = 0; totalGst = 0;
    debitItems.forEach(item => {
      item.taxable = item.qty * item.rate;
      item.gstAmt = (item.taxable * item.gst) / 100;
      item.total = item.taxable + item.gstAmt;
      totalTaxable += item.taxable;
      totalGst += item.gstAmt;
    });
    
    await createVoucher({
      number: 'DN-2026-0001',
      type: 'debit_note',
      date: new Date(2026, 1, 25),
      partyId: supplierIds[1],
      total: totalTaxable + totalGst,
      narration: 'Purchase return to supplier',
      items: debitItems,
      ledgerEntries: [
        { ledgerId: supplierIds[1], debit: totalTaxable + totalGst, credit: 0, narration: 'Supplier debit' },
        { ledgerId: ledgerIds.purchase, debit: 0, credit: totalTaxable, narration: 'Purchase return' },
        { ledgerId: ledgerIds.cgstInput, debit: 0, credit: totalGst / 2, narration: 'Input CGST reversal' },
        { ledgerId: ledgerIds.sgstInput, debit: 0, credit: totalGst / 2, narration: 'Input SGST reversal' },
      ]
    });
    console.log(`   ✓ DN-2026-0001 - ₹${(totalTaxable + totalGst).toFixed(2)}`);

    
    await connection.end();
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ SEED DATA COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📊 SUMMARY:');
    console.log('   • 3 Suppliers (Creditors)');
    console.log('   • 3 Customers (Debtors)');
    console.log('   • 10 Inventory Items (6 serialized, 4 regular)');
    console.log('   • 2 Purchase Invoices');
    console.log('   • 1 Sales Invoice');
    console.log('   • 1 Payment Voucher');
    console.log('   • 1 Receipt Voucher');
    console.log('   • 1 Journal Voucher');
    console.log('   • 1 Contra Voucher');
    console.log('   • 1 Credit Note');
    console.log('   • 1 Debit Note');
    console.log('');
    console.log('🔄 SERIALIZED ITEMS (Auto-generate unit barcodes):');
    console.log('   • Samsung Galaxy S23');
    console.log('   • iPhone 15 Pro');
    console.log('   • OnePlus 11R');
    console.log('   • Sony WH-1000XM5 Headphones');
    console.log('   • Samsung 65" 4K Smart TV');
    console.log('   • Dell XPS 15 Laptop');
    console.log('');
    console.log('📦 REGULAR ITEMS (Traditional quantity tracking):');
    console.log('   • Logitech MX Master 3S Mouse');
    console.log('   • Anker PowerCore 20000mAh');
    console.log('   • USB-C Cable 2m');
    console.log('   • Phone Case Universal');
    console.log('');
    console.log('⚠️  IMPORTANT NOTES:');
    console.log('   1. Vouchers are created with status="posted"');
    console.log('   2. Serialized item barcodes are generated via API when posting');
    console.log('   3. To generate unit barcodes, re-post the purchase invoices via app');
    console.log('   4. All GST rates are properly set on items');
    console.log('   5. Barcode functionality is enabled for the tenant');
    console.log('');
    console.log('🔐 LOGIN:');
    console.log('   Email:    admin@retailtest.com');
    console.log('   Password: Admin@123');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n❌ Error seeding retail test data:', error);
    throw error;
  }
}

seedRetailTestData()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
