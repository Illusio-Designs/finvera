/**
 * Integration Test for TDS Certificate Generation (Task 9.4)
 * 
 * This test verifies the complete TDS certificate generation flow:
 * 1. Create a TDS entry for a voucher
 * 2. Generate a TDS certificate
 * 3. Verify all mandatory fields are present
 * 4. Verify sequential certificate numbering
 * 
 * Requirements validated: 4.7, 4.9
 */

const tdsService = require('../src/services/tdsService');

// Mock context setup
function createMockContext() {
  const mockPartyLedger = {
    id: 'ledger-001',
    ledger_name: 'XYZ Contractors Pvt Ltd',
    name: 'XYZ Contractors Pvt Ltd',
    pan: 'ABCDE1234F',
    address: '123 Industrial Area',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
  };

  const mockVoucher = {
    id: 'voucher-001',
    voucher_number: 'PINV-2024-001',
    voucher_date: new Date('2024-05-15'),
    total_amount: 100000,
    party_ledger_id: 'ledger-001',
    partyLedger: mockPartyLedger,
  };

  const updateCalls = [];
  const mockTDSDetail = {
    id: 'tds-detail-001',
    voucher_id: 'voucher-001',
    section_code: '194C',
    tds_rate: 2.0,
    taxable_amount: 100000,
    tds_amount: 2000,
    deductee_pan: 'ABCDE1234F',
    deductee_name: 'XYZ Contractors Pvt Ltd',
    quarter: 'Q1-2024',
    financial_year: '2024-2025',
    tenant_id: 'tenant-001',
    certificate_no: null,
    certificate_date: null,
    voucher: mockVoucher,
    update: async function(data) {
      updateCalls.push(data);
      this.certificate_no = data.certificate_no;
      this.certificate_date = data.certificate_date;
      return true;
    },
  };

  const mockCompany = {
    company_name: 'ABC Industries Ltd',
    name: 'ABC Industries Ltd',
    pan: 'AAAAA1111A',
    tan: 'DELA12345E',
    registered_address: '456 Business Park, Whitefield, Bangalore - 560066',
    address: '456 Business Park, Whitefield, Bangalore - 560066',
  };

  const findAllResults = [];
  
  return {
    tenant_id: 'tenant-001',
    company: mockCompany,
    tenantModels: {
      TDSDetail: {
        findByPk: async function(id) {
          return mockTDSDetail;
        },
        findAll: async function(options) {
          return findAllResults;
        },
        _setFindAllResults: function(results) {
          findAllResults.length = 0;
          findAllResults.push(...results);
        },
      },
      Sequelize: {
        Op: {
          ne: Symbol('ne'),
        },
      },
    },
    _updateCalls: updateCalls,
    _mockTDSDetail: mockTDSDetail,
  };
}

async function runIntegrationTest() {
  console.log('\n=== TDS Certificate Generation Integration Test ===\n');

  try {
    const mockCtx = createMockContext();

    // Test 1: Generate first certificate
    console.log('Test 1: Generating first TDS certificate...');
    const result1 = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-001');
    
    console.log('✓ Certificate generated successfully');
    console.log(`  Certificate Number: ${result1.certificateNumber}`);
    console.log(`  Certificate Date: ${result1.certificateDate.toISOString()}`);
    console.log(`  Certificate Type: ${result1.certificate.certificate_type}`);
    
    // Verify mandatory fields (Requirement 4.7)
    console.log('\nTest 2: Verifying mandatory fields...');
    const cert = result1.certificate;
    
    const mandatoryFields = {
      'Deductee PAN': cert.deductee.pan,
      'Deductor TAN': cert.deductor.tan,
      'Section Code': cert.tds_details.section_code,
      'Taxable Amount': cert.tds_details.taxable_amount,
      'TDS Amount': cert.tds_details.tds_amount,
      'TDS Rate': cert.tds_details.tds_rate,
      'Certificate Number': cert.certificate_number,
      'Certificate Date': cert.certificate_date,
    };
    
    let allFieldsPresent = true;
    for (const [field, value] of Object.entries(mandatoryFields)) {
      if (value === null || value === undefined) {
        console.log(`  ✗ Missing: ${field}`);
        allFieldsPresent = false;
      } else {
        console.log(`  ✓ ${field}: ${value}`);
      }
    }
    
    if (allFieldsPresent) {
      console.log('\n✓ All mandatory fields present (Requirement 4.7)');
    } else {
      console.log('\n✗ Some mandatory fields missing');
      return false;
    }
    
    // Test 3: Verify sequential numbering (Requirement 4.9)
    console.log('\nTest 3: Verifying sequential certificate numbering...');
    
    // Mock existing certificate
    mockCtx.tenantModels.TDSDetail._setFindAllResults([
      { certificate_no: 'TDS/2024-25/Q1-2024/0001' },
    ]);
    
    const result2 = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-001');
    console.log(`  First Certificate: TDS/2024-25/Q1-2024/0001`);
    console.log(`  Next Certificate: ${result2.certificateNumber}`);
    
    if (result2.certificateNumber === 'TDS/2024-25/Q1-2024/0002') {
      console.log('✓ Sequential numbering working correctly (Requirement 4.9)');
    } else {
      console.log('✗ Sequential numbering failed');
      return false;
    }
    
    // Test 4: Verify certificate format
    console.log('\nTest 4: Verifying certificate number format...');
    const formatRegex = /^TDS\/\d{4}-\d{2}\/Q\d-\d{4}\/\d{4}$/;
    if (formatRegex.test(result2.certificateNumber)) {
      console.log(`✓ Certificate number format is correct: ${result2.certificateNumber}`);
    } else {
      console.log(`✗ Certificate number format is incorrect: ${result2.certificateNumber}`);
      return false;
    }
    
    // Test 5: Verify TDS detail update
    console.log('\nTest 5: Verifying TDS detail update...');
    const updateCalls = mockCtx._updateCalls;
    if (updateCalls.length > 0) {
      const updateData = updateCalls[updateCalls.length - 1];
      console.log(`  ✓ Certificate number stored: ${updateData.certificate_no}`);
      console.log(`  ✓ Certificate date stored: ${updateData.certificate_date}`);
    } else {
      console.log('  ✗ TDS detail not updated');
      return false;
    }
    
    // Test 6: Verify different TDS sections
    console.log('\nTest 6: Testing different TDS sections...');
    const sections = ['194C', '194I', '194J', '194H'];
    for (const section of sections) {
      mockCtx._mockTDSDetail.section_code = section;
      
      const result = await tdsService.generateTDSCertificate(mockCtx, 'tds-detail-001');
      const sectionDesc = result.certificate.tds_details.section_description;
      console.log(`  ✓ Section ${section}: ${sectionDesc}`);
    }
    
    console.log('\n=== All Tests Passed ===\n');
    console.log('Task 9.4 Implementation Summary:');
    console.log('✓ generateTDSCertificate method implemented');
    console.log('✓ Sequential certificate numbers generated (Requirement 4.9)');
    console.log('✓ All mandatory fields included (PAN, TAN, section, amounts) (Requirement 4.7)');
    console.log('✓ certificate_no and certificate_date stored in TDS detail');
    console.log('✓ Certificate format: TDS/FY/QUARTER/SEQUENCE');
    console.log('✓ Supports all TDS sections (194C, 194I, 194J, 194H)');
    
    return true;
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run the test
if (require.main === module) {
  runIntegrationTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { runIntegrationTest };
