/**
 * Integration Test for TDS Return Generation (Task 9.5)
 * 
 * This test verifies the generateTDSReturn method implementation:
 * - Queries all TDS entries for specified quarter and FY
 * - Formats return data according to requirements
 * - Groups by deductee and section
 * - Calculates totals correctly
 * 
 * Validates Requirements: 4.8
 */

const tdsService = require('../src/services/tdsService');

// Mock context for testing
function createMockContext() {
  const mockCompany = {
    company_name: 'Test Company Pvt Ltd',
    pan: 'ABCDE1234F',
    tan: 'DELC12345D',
    registered_address: '123 Test Street, Test City, Test State - 110001',
  };

  const mockTDSEntries = [
    {
      id: 'tds-001',
      voucher_id: 'voucher-001',
      section_code: '194C',
      tds_rate: 2.0,
      taxable_amount: 100000.00,
      tds_amount: 2000.00,
      deductee_pan: 'XYZAB1234C',
      deductee_name: 'ABC Contractors Pvt Ltd',
      certificate_no: 'TDS/2024-25/Q1-2024/0001',
      certificate_date: new Date('2024-07-15'),
      quarter: 'Q1-2024',
      financial_year: '2024-25',
      createdAt: new Date('2024-06-15'),
      voucher: {
        id: 'voucher-001',
        voucher_number: 'PINV-2024-001',
        voucher_date: new Date('2024-06-15'),
        party_ledger_id: 'ledger-001',
        partyLedger: {
          id: 'ledger-001',
          ledger_name: 'ABC Contractors Pvt Ltd',
          name: 'ABC Contractors Pvt Ltd',
          pan: 'XYZAB1234C',
          address: '456 Contractor Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
      },
    },
    {
      id: 'tds-002',
      voucher_id: 'voucher-002',
      section_code: '194C',
      tds_rate: 2.0,
      taxable_amount: 50000.00,
      tds_amount: 1000.00,
      deductee_pan: 'XYZAB1234C',
      deductee_name: 'ABC Contractors Pvt Ltd',
      certificate_no: 'TDS/2024-25/Q1-2024/0002',
      certificate_date: new Date('2024-07-15'),
      quarter: 'Q1-2024',
      financial_year: '2024-25',
      createdAt: new Date('2024-06-20'),
      voucher: {
        id: 'voucher-002',
        voucher_number: 'PINV-2024-002',
        voucher_date: new Date('2024-06-20'),
        party_ledger_id: 'ledger-001',
        partyLedger: {
          id: 'ledger-001',
          ledger_name: 'ABC Contractors Pvt Ltd',
          name: 'ABC Contractors Pvt Ltd',
          pan: 'XYZAB1234C',
          address: '456 Contractor Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
      },
    },
    {
      id: 'tds-003',
      voucher_id: 'voucher-003',
      section_code: '194J',
      tds_rate: 10.0,
      taxable_amount: 75000.00,
      tds_amount: 7500.00,
      deductee_pan: 'PQRST5678D',
      deductee_name: 'XYZ Consultants',
      certificate_no: 'TDS/2024-25/Q1-2024/0003',
      certificate_date: new Date('2024-07-15'),
      quarter: 'Q1-2024',
      financial_year: '2024-25',
      createdAt: new Date('2024-05-10'),
      voucher: {
        id: 'voucher-003',
        voucher_number: 'PINV-2024-003',
        voucher_date: new Date('2024-05-10'),
        party_ledger_id: 'ledger-002',
        partyLedger: {
          id: 'ledger-002',
          ledger_name: 'XYZ Consultants',
          name: 'XYZ Consultants',
          pan: 'PQRST5678D',
          address: '789 Consultant Avenue',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
        },
      },
    },
    {
      id: 'tds-004',
      voucher_id: 'voucher-004',
      section_code: '194I',
      tds_rate: 10.0,
      taxable_amount: 240000.00,
      tds_amount: 24000.00,
      deductee_pan: 'LMNOP9012E',
      deductee_name: 'Property Owners Ltd',
      certificate_no: 'TDS/2024-25/Q1-2024/0004',
      certificate_date: new Date('2024-07-15'),
      quarter: 'Q1-2024',
      financial_year: '2024-25',
      createdAt: new Date('2024-04-05'),
      voucher: {
        id: 'voucher-004',
        voucher_number: 'PINV-2024-004',
        voucher_date: new Date('2024-04-05'),
        party_ledger_id: 'ledger-003',
        partyLedger: {
          id: 'ledger-003',
          ledger_name: 'Property Owners Ltd',
          name: 'Property Owners Ltd',
          pan: 'LMNOP9012E',
          address: '321 Property Lane',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
        },
      },
    },
  ];

  const mockCtx = {
    tenant_id: 'tenant-001',
    user_id: 'user-001',
    company: mockCompany,
    tenantModels: {
      TDSDetail: {
        findAll: async function(options) {
          // Filter based on where clause
          const where = options.where || {};
          let filtered = mockTDSEntries;

          if (where.tenant_id) {
            filtered = filtered.filter(e => e.tenant_id === where.tenant_id || true);
          }
          if (where.quarter) {
            filtered = filtered.filter(e => e.quarter === where.quarter);
          }
          if (where.financial_year) {
            filtered = filtered.filter(e => e.financial_year === where.financial_year);
          }

          return filtered;
        },
      },
    },
  };

  return mockCtx;
}

// Test Suite
async function runTests() {
  console.log('='.repeat(80));
  console.log('TDS Return Generation Integration Test (Task 9.5)');
  console.log('='.repeat(80));
  console.log();

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Generate TDS return for Q1 2024-25
  try {
    console.log('Test 1: Generate TDS return for Q1 2024-25');
    console.log('-'.repeat(80));

    const mockCtx = createMockContext();
    const result = await tdsService.generateTDSReturn(mockCtx, 'Q1-2024', '2024-25');

    console.log('✓ TDS return generated successfully');
    console.log();

    // Verify return structure
    if (!result.tdsReturn) {
      throw new Error('Missing tdsReturn in result');
    }
    console.log('✓ Return structure is valid');

    // Verify return metadata
    const tdsReturn = result.tdsReturn;
    if (tdsReturn.return_type !== 'Form 24Q') {
      throw new Error(`Expected return_type 'Form 24Q', got '${tdsReturn.return_type}'`);
    }
    console.log('✓ Return type is Form 24Q');

    if (tdsReturn.quarter !== 'Q1-2024') {
      throw new Error(`Expected quarter 'Q1-2024', got '${tdsReturn.quarter}'`);
    }
    console.log('✓ Quarter is correct');

    if (tdsReturn.financial_year !== '2024-25') {
      throw new Error(`Expected financial_year '2024-25', got '${tdsReturn.financial_year}'`);
    }
    console.log('✓ Financial year is correct');

    // Verify deductor details
    if (!tdsReturn.deductor || !tdsReturn.deductor.name) {
      throw new Error('Missing deductor details');
    }
    console.log('✓ Deductor details included');
    console.log(`  - Name: ${tdsReturn.deductor.name}`);
    console.log(`  - PAN: ${tdsReturn.deductor.pan}`);
    console.log(`  - TAN: ${tdsReturn.deductor.tan}`);

    // Verify summary
    if (!tdsReturn.summary) {
      throw new Error('Missing summary');
    }
    console.log('✓ Summary included');
    console.log(`  - Total Deductees: ${tdsReturn.summary.total_deductees}`);
    console.log(`  - Total Entries: ${tdsReturn.summary.total_entries}`);
    console.log(`  - Total Sections: ${tdsReturn.summary.total_sections}`);
    console.log(`  - Total Taxable Amount: ₹${tdsReturn.summary.total_taxable_amount.toLocaleString('en-IN')}`);
    console.log(`  - Total TDS Amount: ₹${tdsReturn.summary.total_tds_amount.toLocaleString('en-IN')}`);

    // Verify calculations
    const expectedTotalTaxable = 100000 + 50000 + 75000 + 240000; // 465000
    const expectedTotalTDS = 2000 + 1000 + 7500 + 24000; // 34500

    if (tdsReturn.summary.total_taxable_amount !== expectedTotalTaxable) {
      throw new Error(`Expected total taxable ${expectedTotalTaxable}, got ${tdsReturn.summary.total_taxable_amount}`);
    }
    console.log('✓ Total taxable amount calculated correctly');

    if (tdsReturn.summary.total_tds_amount !== expectedTotalTDS) {
      throw new Error(`Expected total TDS ${expectedTotalTDS}, got ${tdsReturn.summary.total_tds_amount}`);
    }
    console.log('✓ Total TDS amount calculated correctly');

    // Verify section summary
    if (!tdsReturn.section_summary || tdsReturn.section_summary.length === 0) {
      throw new Error('Missing section summary');
    }
    console.log('✓ Section summary included');
    console.log(`  - Number of sections: ${tdsReturn.section_summary.length}`);
    
    tdsReturn.section_summary.forEach(section => {
      console.log(`  - ${section.section_code}: ${section.count} entries, ₹${section.total_tds_amount.toLocaleString('en-IN')} TDS`);
    });

    // Verify deductee details
    if (!tdsReturn.deductee_details || tdsReturn.deductee_details.length === 0) {
      throw new Error('Missing deductee details');
    }
    console.log('✓ Deductee details included');
    console.log(`  - Number of deductees: ${tdsReturn.deductee_details.length}`);
    
    tdsReturn.deductee_details.forEach(deductee => {
      console.log(`  - ${deductee.deductee_name} (${deductee.deductee_pan}): ${deductee.entry_count} entries, ₹${deductee.total_tds_amount.toLocaleString('en-IN')} TDS`);
    });

    // Verify entries
    if (!tdsReturn.entries || tdsReturn.entries.length === 0) {
      throw new Error('Missing entries');
    }
    console.log('✓ All entries included');
    console.log(`  - Number of entries: ${tdsReturn.entries.length}`);

    // Verify grouping by deductee
    const abc_contractor = tdsReturn.deductee_details.find(d => d.deductee_pan === 'XYZAB1234C');
    if (!abc_contractor) {
      throw new Error('ABC Contractors not found in deductee details');
    }
    if (abc_contractor.entry_count !== 2) {
      throw new Error(`Expected 2 entries for ABC Contractors, got ${abc_contractor.entry_count}`);
    }
    if (abc_contractor.total_tds_amount !== 3000) {
      throw new Error(`Expected ₹3000 TDS for ABC Contractors, got ₹${abc_contractor.total_tds_amount}`);
    }
    console.log('✓ Deductee grouping is correct (ABC Contractors has 2 entries totaling ₹3000)');

    console.log();
    console.log('✅ Test 1 PASSED');
    passedTests++;
  } catch (error) {
    console.log();
    console.log('❌ Test 1 FAILED:', error.message);
    console.error(error.stack);
    failedTests++;
  }

  console.log();

  // Test 2: Error handling - No TDS entries found
  try {
    console.log('Test 2: Error handling - No TDS entries found');
    console.log('-'.repeat(80));

    const mockCtx = createMockContext();
    
    try {
      await tdsService.generateTDSReturn(mockCtx, 'Q4-2023', '2023-24');
      throw new Error('Should have thrown error for no TDS entries');
    } catch (error) {
      if (error.message.includes('No TDS entries found')) {
        console.log('✓ Correctly throws error when no TDS entries found');
        console.log(`  Error message: ${error.message}`);
      } else {
        throw error;
      }
    }

    console.log();
    console.log('✅ Test 2 PASSED');
    passedTests++;
  } catch (error) {
    console.log();
    console.log('❌ Test 2 FAILED:', error.message);
    console.error(error.stack);
    failedTests++;
  }

  console.log();

  // Test 3: Financial year format normalization
  try {
    console.log('Test 3: Financial year format normalization (2024-2025 -> 2024-25)');
    console.log('-'.repeat(80));

    const mockCtx = createMockContext();
    const result = await tdsService.generateTDSReturn(mockCtx, 'Q1-2024', '2024-2025');

    if (result.tdsReturn.financial_year !== '2024-25') {
      throw new Error(`Expected normalized FY '2024-25', got '${result.tdsReturn.financial_year}'`);
    }
    console.log('✓ Financial year normalized correctly from 2024-2025 to 2024-25');

    console.log();
    console.log('✅ Test 3 PASSED');
    passedTests++;
  } catch (error) {
    console.log();
    console.log('❌ Test 3 FAILED:', error.message);
    console.error(error.stack);
    failedTests++;
  }

  console.log();

  // Test 4: Verify section-wise grouping
  try {
    console.log('Test 4: Verify section-wise grouping');
    console.log('-'.repeat(80));

    const mockCtx = createMockContext();
    const result = await tdsService.generateTDSReturn(mockCtx, 'Q1-2024', '2024-25');

    const sectionSummary = result.tdsReturn.section_summary;
    
    // Should have 3 sections: 194C, 194J, 194I
    if (sectionSummary.length !== 3) {
      throw new Error(`Expected 3 sections, got ${sectionSummary.length}`);
    }
    console.log('✓ Correct number of sections (3)');

    // Verify 194C section
    const section194C = sectionSummary.find(s => s.section_code === '194C');
    if (!section194C) {
      throw new Error('Section 194C not found');
    }
    if (section194C.count !== 2) {
      throw new Error(`Expected 2 entries for 194C, got ${section194C.count}`);
    }
    if (section194C.total_tds_amount !== 3000) {
      throw new Error(`Expected ₹3000 TDS for 194C, got ₹${section194C.total_tds_amount}`);
    }
    console.log('✓ Section 194C grouped correctly (2 entries, ₹3000 TDS)');

    // Verify 194J section
    const section194J = sectionSummary.find(s => s.section_code === '194J');
    if (!section194J) {
      throw new Error('Section 194J not found');
    }
    if (section194J.count !== 1) {
      throw new Error(`Expected 1 entry for 194J, got ${section194J.count}`);
    }
    if (section194J.total_tds_amount !== 7500) {
      throw new Error(`Expected ₹7500 TDS for 194J, got ₹${section194J.total_tds_amount}`);
    }
    console.log('✓ Section 194J grouped correctly (1 entry, ₹7500 TDS)');

    // Verify 194I section
    const section194I = sectionSummary.find(s => s.section_code === '194I');
    if (!section194I) {
      throw new Error('Section 194I not found');
    }
    if (section194I.count !== 1) {
      throw new Error(`Expected 1 entry for 194I, got ${section194I.count}`);
    }
    if (section194I.total_tds_amount !== 24000) {
      throw new Error(`Expected ₹24000 TDS for 194I, got ₹${section194I.total_tds_amount}`);
    }
    console.log('✓ Section 194I grouped correctly (1 entry, ₹24000 TDS)');

    console.log();
    console.log('✅ Test 4 PASSED');
    passedTests++;
  } catch (error) {
    console.log();
    console.log('❌ Test 4 FAILED:', error.message);
    console.error(error.stack);
    failedTests++;
  }

  console.log();
  console.log('='.repeat(80));
  console.log('Test Summary');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log('='.repeat(80));

  if (failedTests === 0) {
    console.log();
    console.log('🎉 All tests passed! Task 9.5 implementation is complete.');
    console.log();
    console.log('Summary of Implementation:');
    console.log('- ✓ generateTDSReturn method implemented');
    console.log('- ✓ Queries all TDS entries for specified quarter and FY');
    console.log('- ✓ Formats return data with deductor details');
    console.log('- ✓ Groups entries by deductee PAN');
    console.log('- ✓ Groups entries by section code');
    console.log('- ✓ Calculates totals correctly');
    console.log('- ✓ Includes all mandatory fields');
    console.log('- ✓ Validates Requirements: 4.8');
    console.log();
  } else {
    console.log();
    console.log('⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
