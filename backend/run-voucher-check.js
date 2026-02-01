#!/usr/bin/env node

const { checkPostedVoucher } = require('./check-posted-voucher');

console.log('🚀 Starting Voucher Integration Checker...\n');

// Check recent posted vouchers
checkPostedVoucher().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});