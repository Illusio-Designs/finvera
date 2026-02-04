# Implementation Plan: Indian Invoice System Backend

## Overview

This implementation plan breaks down the Indian Invoice System Backend into discrete coding tasks. The system will be built using Node.js with TypeScript, Express.js, Sequelize ORM, and PostgreSQL. The implementation follows a layered architecture with services for numbering, vouchers, GST calculation, E-Invoice, E-Way Bill, and TDS.

The plan focuses on incremental development, building upon the existing database schema and codebase. Database migrations and tables have been completed (Task 1), so the implementation now focuses on core services, invoice types, and external integrations. Each major component includes property-based tests to validate correctness properties from the design document.

**Current Status**: Database schema setup is complete. The remaining tasks build upon the existing codebase and database structure.

## Tasks

- [x] 1. Database Schema Setup ✅ COMPLETED
  - ✅ Created migration files for all new tables (numbering_series, numbering_history, enhanced e_invoices, e_way_bills, tds_details)
  - ✅ Added indexes on tenant_id, voucher_type, status fields for performance
  - ✅ Added foreign key constraints linking to vouchers table
  - ✅ Added unique constraints on IRN and EWB number fields
  - ✅ Ran migrations and verified schema in development database
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.10_

- [x] 2. Sequelize Models for New Tables
  - [x] 2.1 Create NumberingSeries model with validations
    - Define model with all fields (prefix, format, sequence_length, current_sequence, reset_frequency, etc.)
    - Add validation for format containing PREFIX and SEQUENCE tokens
    - Add validation for prefix (uppercase alphanumeric only)
    - Add tenant_id and branch_id associations
    - Integrate with existing database schema from Task 1
    - _Requirements: 1.1, 1.2, 12.1_
  
  - [x] 2.2 Create NumberingHistory model
    - Define model with series_id, voucher_id, generated_number, sequence_used
    - Add foreign key associations to NumberingSeries and existing Voucher model
    - Add indexes on series_id and voucher_id
    - Ensure compatibility with existing voucher structure
    - _Requirements: 1.10, 12.2_
  
  - [x] 2.3 Enhance EInvoice model
    - Add retry_count and last_retry_at fields to existing model
    - Add status enum (pending, generated, cancelled)
    - Add indexes on voucher_id and status
    - Maintain backward compatibility with existing E-Invoice data
    - _Requirements: 2.3, 2.4, 12.4_
  
  - [x] 2.4 Enhance EWayBill model
    - Add all transport fields (transporter_id, vehicle_no, transport_mode, distance)
    - Add status enum (active, cancelled, expired)
    - Add validity calculation method
    - Ensure compatibility with existing E-Way Bill structure
    - _Requirements: 3.3, 3.4, 12.5_
  
  - [x] 2.5 Create TDSDetail model
    - Define model with section_code, tds_rate, taxable_amount, tds_amount
    - Add deductee_pan and deductee_name fields
    - Add certificate_no and certificate_date fields
    - Add foreign key to existing Voucher model
    - _Requirements: 4.1, 4.7, 12.7_

- [x] 3. Numbering Service Implementation
  - [x] 3.1 Implement core NumberingService class
    - Create generateVoucherNumber method with database locking (SELECT FOR UPDATE)
    - Implement formatVoucherNumber with token replacement logic
    - Implement checkAndResetSequence for reset frequency handling
    - Add getNextSequence method with transaction support
    - Add updateCurrentSequence method
    - Integrate with existing voucher creation workflow
    - _Requirements: 1.3, 1.5, 1.6, 1.9_
  
  - [x] 3.2 Implement numbering series management methods
    - Create createNumberingSeries with validation
    - Create updateNumberingSeries
    - Create setDefaultSeries
    - Create previewNextNumber
    - Add getNumberingSeries helper method
    - Ensure compatibility with existing voucher types
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [x] 3.3 Implement GST compliance validations
    - Add validateGSTCompliance method checking 16 character limit
    - Add validateFormat method checking required tokens
    - Add validatePrefix method checking alphanumeric only
    - _Requirements: 1.2, 1.7_
  
  - [ ]* 3.4 Write property test for sequential number generation
    - **Property 1: Sequential Number Generation**
    - Generate N numbers and verify sequences are 1, 2, ..., N without gaps
    - **Validates: Requirements 1.3**
  
  - [ ]* 3.5 Write property test for format token validation
    - **Property 2: Format Token Validation**
    - Test that formats without PREFIX or SEQUENCE are rejected
    - **Validates: Requirements 1.2**
  
  - [ ]* 3.6 Write property test for GST compliance length
    - **Property 3: GST Compliance Length Constraint**
    - Generate random series configs and verify all numbers ≤ 16 chars
    - **Validates: Requirements 1.7**
  
  - [ ]* 3.7 Write property test for tenant-scoped uniqueness
    - **Property 4: Tenant-Scoped Uniqueness**
    - Generate numbers for same tenant and verify all unique
    - **Validates: Requirements 1.8**
  
  - [ ]* 3.8 Write property test for concurrent generation safety
    - **Property 8: Concurrent Generation Safety**
    - Generate numbers concurrently and verify no duplicates
    - **Validates: Requirements 1.9**

- [x] 4. GST Calculation Service Implementation
  - [x] 4.1 Implement GSTCalculationService class
    - Create calculateItemGST method with intrastate/interstate logic
    - Create calculateVoucherGST method aggregating all items
    - Implement isIntrastate helper method
    - Add round-off calculation logic
    - _Requirements: 10.1, 10.2, 10.8, 10.9, 10.10_
  
  - [x] 4.2 Implement GSTIN validation methods
    - Create validateGSTIN with format and checksum validation
    - Create extractStateCode method
    - Add state code caching for performance
    - _Requirements: 10.5_
  
  - [ ]* 4.3 Write property test for intrastate GST calculation
    - **Property 58: Intrastate GST Calculation**
    - Test CGST = SGST = (amount × rate) / 200 for all amounts and rates
    - **Validates: Requirements 10.1**
  
  - [ ]* 4.4 Write property test for interstate GST calculation
    - **Property 59: Interstate GST Calculation**
    - Test IGST = (amount × rate) / 100 for all amounts and rates
    - **Validates: Requirements 10.2**
  
  - [ ]* 4.5 Write property test for total calculation invariant
    - **Property 66: Total Amount Calculation Invariant**
    - Test total = subtotal + CGST + SGST + IGST + cess + round_off
    - **Validates: Requirements 10.10**

- [x] 5. Voucher Service Core Implementation
  - [x] 5.1 Enhance existing VoucherService class
    - Extend createVoucher method with advanced numbering integration
    - Enhance updateVoucher method (only for draft status)
    - Enhance postVoucher method (finalize and create ledger entries)
    - Enhance cancelVoucher method (soft delete)
    - Improve getVoucher and listVouchers methods with new fields
    - Maintain backward compatibility with existing voucher workflow
    - _Requirements: 13.1, 13.2, 13.8_
  
  - [x] 5.2 Enhance voucher validation logic
    - Extend validateVoucherData method with new invoice types
    - Add validateInvoiceDate (not future, within FY)
    - Add validatePartyDetails with GSTIN validation
    - Add validateItems (HSN codes, quantities, rates)
    - Integrate with existing validation framework
    - _Requirements: 10.6, 10.7, 10.3_
  
  - [x] 5.3 Integrate NumberingService and GSTCalculationService
    - Call NumberingService.generateVoucherNumber in createVoucher
    - Call GSTCalculationService.calculateVoucherGST for all items
    - Store calculated GST amounts in voucher and items
    - Ensure compatibility with existing GST calculation logic
    - _Requirements: 1.3, 10.1, 10.2_
  
  - [x] 5.4 Enhance ledger entry generation
    - Extend generateLedgerEntries method for new invoice types
    - Generate customer/supplier debit/credit entries
    - Generate sales/purchase ledger entries
    - Generate GST output/input ledger entries
    - Generate round-off ledger entry
    - Maintain compatibility with existing accounting structure
    - _Requirements: 10.9_
  
  - [x] 5.5 Write property test for audit timestamp tracking
    - **Property 67: Audit Timestamp Tracking**
    - Test created_at is set and immutable, updated_at changes on modification
    - **Validates: Requirements 13.1, 13.2, 13.3**
  
  - [x] 5.6 Write property test for voucher cancellation soft delete
    - **Property 69: Voucher Cancellation Soft Delete**
    - Test cancelled vouchers have status='cancelled' and record exists
    - **Validates: Requirements 13.8**

- [ ] 6. Checkpoint - Core Services Complete
  - Ensure all tests pass for Numbering, GST Calculation, and enhanced Voucher services
  - Verify database schema integration is working correctly
  - Test creating a basic sales invoice end-to-end with new numbering system
  - Validate that existing voucher functionality remains intact
  - Ask the user if questions arise

- [-] 7. E-Invoice Service Implementation
  - [x] 7.1 Implement IRP Portal client
    - Create IRPClient class with authentication methods
    - Implement OAuth2 token management with auto-refresh
    - Add generateEInvoice API call method
    - Add cancelEInvoice API call method
    - Implement retry logic with exponential backoff
    - Support both sandbox and production environments
    - _Requirements: 2.7, 2.8, 2.10_
  
  - [x] 7.2 Implement EInvoiceService class
    - Create generateEInvoice method
    - Implement validateEInvoiceFields for mandatory field checking
    - Transform voucher data to IRP JSON format
    - Store IRN, ack_no, ack_date, signed_invoice, signed_qr_code on success
    - Store error_message on failure
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.9_
  
  - [x] 7.3 Implement E-Invoice cancellation
    - Create cancelEInvoice method with 24-hour window check
    - Validate reason code and remarks are provided
    - Call IRP portal cancellation API
    - Update E-Invoice status to 'cancelled'
    - _Requirements: 2.5, 2.6_
  
  - [x] 7.4 Implement retry mechanism
    - Create retryEInvoiceGeneration method
    - Increment retry_count and update last_retry_at
    - Implement circuit breaker pattern for IRP portal
    - _Requirements: 14.1, 14.3_
  
  - [x] 7.5 Write property test for E-Invoice threshold triggering
    - **Property 10: E-Invoice Threshold Triggering**
    - Test invoices above threshold trigger E-Invoice generation
    - **Validates: Requirements 2.1**
  
  - [-] 7.6 Write property test for mandatory field validation
    - **Property 11: E-Invoice Mandatory Field Validation**
    - Test requests with missing fields are rejected
    - **Validates: Requirements 2.2**
  
  - [ ] 7.7 Write property test for 24-hour cancellation window
    - **Property 14: E-Invoice Cancellation Time Window**
    - Test cancellation allowed within 24 hours, rejected after
    - **Validates: Requirements 2.5**

- [ ] 8. E-Way Bill Service Implementation
  - [ ] 8.1 Implement E-Way Bill Portal client
    - Create EWayBillClient class with authentication
    - Implement generateEWayBill API call method
    - Implement cancelEWayBill API call method
    - Implement updateVehicleDetails API call method
    - Add retry logic with exponential backoff
    - _Requirements: 3.9_
  
  - [ ] 8.2 Implement EWayBillService class
    - Create generateEWayBill method with threshold check (₹50,000)
    - Validate transporter GSTIN, vehicle number, transport mode
    - Calculate validity period based on distance (1 day per 200 KM)
    - Store EWB number, dates, transport details on success
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 8.3 Implement E-Way Bill management methods
    - Create cancelEWayBill with reason code validation
    - Create updateVehicleDetails (only for active status)
    - Create isEWayBillRequired helper method
    - Implement status tracking (active, cancelled, expired)
    - _Requirements: 3.5, 3.6, 3.7, 3.10_
  
  - [ ] 8.4 Write property test for E-Way Bill threshold triggering
    - **Property 17: E-Way Bill Threshold Triggering**
    - Test invoices above ₹50,000 trigger E-Way Bill prompt
    - **Validates: Requirements 3.1**
  
  - [ ] 8.5 Write property test for validity calculation
    - **Property 20: E-Way Bill Validity Calculation**
    - Test validity = ceil(distance / 200) days for all distances
    - **Validates: Requirements 3.4**
  
  - [ ] 8.6 Write property test for vehicle update constraint
    - **Property 21: E-Way Bill Vehicle Update Constraint**
    - Test updates allowed only when status='active'
    - **Validates: Requirements 3.5**

- [ ] 9. TDS Service Implementation
  - [ ] 9.1 Implement TDS sections configuration
    - Create TDS_SECTIONS constant with 194C, 194I, 194J, 194H
    - Define rates, thresholds, and descriptions for each section
    - Add helper method to get section configuration
    - _Requirements: 4.4_
  
  - [ ] 9.2 Implement TDSService class
    - Create calculateTDS method with formula: (amount × rate) / 100
    - Validate PAN format before TDS calculation
    - Apply threshold check (no TDS if amount < threshold)
    - Return TDSCalculation object with all details
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 9.3 Implement TDS entry and ledger creation
    - Create createTDSEntry method
    - Generate TDS payable ledger entry
    - Reduce supplier payment by TDS amount
    - Link TDS detail to voucher
    - _Requirements: 4.5, 4.6, 4.10_
  
  - [ ] 9.4 Implement TDS certificate generation
    - Create generateTDSCertificate method
    - Generate sequential certificate numbers
    - Include all mandatory fields (PAN, TAN, section, amounts)
    - Store certificate_no and certificate_date
    - _Requirements: 4.7, 4.9_
  
  - [ ] 9.5 Implement TDS return generation
    - Create generateTDSReturn method
    - Query all TDS entries for specified quarter and FY
    - Format return data according to requirements
    - _Requirements: 4.8_
  
  - [ ]* 9.6 Write property test for TDS calculation formula
    - **Property 25: TDS Calculation Formula**
    - Test TDS = (amount × rate) / 100 for all amounts and rates
    - **Validates: Requirements 4.1**
  
  - [ ]* 9.7 Write property test for TDS threshold application
    - **Property 27: TDS Threshold Application**
    - Test TDS deducted only when amount ≥ threshold
    - **Validates: Requirements 4.3**
  
  - [ ]* 9.8 Write property test for TDS payment reduction
    - **Property 29: TDS Payment Reduction**
    - Test supplier credit = invoice amount - TDS amount
    - **Validates: Requirements 4.6**

- [ ] 10. Checkpoint - External Integrations Complete
  - Ensure all tests pass for E-Invoice, E-Way Bill, and TDS services
  - Test E-Invoice generation with sandbox IRP portal
  - Test E-Way Bill generation with sandbox portal
  - Verify TDS calculations and certificate generation
  - Ask the user if questions arise

- [ ] 11. Bill of Supply Implementation
  - [ ] 11.1 Add Bill of Supply voucher type support
    - Add 'Bill of Supply' to voucher type enum
    - Create separate numbering series for Bill of Supply
    - Add validation to ensure items are exempt/nil-rated
    - _Requirements: 5.1, 5.4, 5.5_
  
  - [ ] 11.2 Implement Bill of Supply specific logic
    - Override GST calculation to return zero for all taxes
    - Skip GST ledger entry generation
    - Add voucher type label "Bill of Supply"
    - _Requirements: 5.2, 5.3, 5.6_
  
  - [ ] 11.3 Add composition dealer support
    - Add is_composition_dealer flag to tenant settings
    - Default to Bill of Supply when composition dealer flag is true
    - Add validation to prevent taxable items in Bill of Supply
    - _Requirements: 5.7, 5.8_
  
  - [ ]* 11.4 Write property test for Bill of Supply zero GST
    - **Property 34: Bill of Supply Zero GST**
    - Test all GST amounts are zero for Bill of Supply
    - **Validates: Requirements 5.2**
  
  - [ ]* 11.5 Write property test for Bill of Supply no GST ledgers
    - **Property 35: Bill of Supply No GST Ledgers**
    - Test no GST ledger entries created for Bill of Supply
    - **Validates: Requirements 5.6**

- [ ] 12. Retail Invoice Implementation
  - [ ] 12.1 Implement Retail Invoice detection logic
    - Add isRetailInvoice helper method (amount ≤ ₹50,000 AND no GSTIN)
    - Auto-classify voucher as Retail Invoice based on criteria
    - Create separate numbering series for Retail Invoice
    - _Requirements: 6.1, 6.5_
  
  - [ ] 12.2 Implement Retail Invoice validation
    - Make customer GSTIN optional for Retail Invoice
    - Allow simplified customer details (name and location only)
    - Require full details and GSTIN when amount > ₹50,000
    - _Requirements: 6.2, 6.3, 6.6_
  
  - [ ] 12.3 Ensure GST calculation parity with Tax Invoice
    - Use same GST calculation logic as Tax Invoice
    - Generate same ledger entry pattern as Tax Invoice
    - _Requirements: 6.4, 6.7_
  
  - [ ]* 12.4 Write property test for Retail Invoice threshold detection
    - **Property 38: Retail Invoice Threshold Detection**
    - Test classification when amount ≤ ₹50,000 and no GSTIN
    - **Validates: Requirements 6.1**
  
  - [ ]* 12.5 Write property test for high value invoice mandatory GSTIN
    - **Property 41: High Value Invoice Mandatory GSTIN**
    - Test GSTIN required when amount > ₹50,000
    - **Validates: Requirements 6.6**

- [ ] 13. Export Invoice Implementation
  - [ ] 13.1 Add Export Invoice voucher type support
    - Add 'Export Invoice' to voucher type enum
    - Create separate numbering series for Export Invoice
    - Add foreign currency fields (currency_code, exchange_rate)
    - Add export fields (shipping_bill_no, port, destination_country)
    - _Requirements: 7.1, 7.5, 7.7_
  
  - [ ] 13.2 Implement Export Invoice GST logic
    - Add has_lut flag to determine zero-rated vs IGST
    - Calculate zero GST when LUT is present
    - Calculate IGST and mark refundable when LUT absent
    - Validate place_of_supply = "Export"
    - _Requirements: 7.3, 7.4, 7.8_
  
  - [ ] 13.3 Implement currency conversion
    - Add convertToBaseCurrency method
    - Apply exchange rate to all amounts
    - Create ledger entries in base currency
    - _Requirements: 7.6, 7.9_
  
  - [ ]* 13.4 Write property test for Export Invoice zero GST with LUT
    - **Property 43: Export Invoice Zero GST with LUT**
    - Test all GST amounts are zero when LUT present
    - **Validates: Requirements 7.3**
  
  - [ ]* 13.5 Write property test for currency conversion
    - **Property 46: Export Invoice Currency Conversion**
    - Test base amount = foreign amount × exchange rate
    - **Validates: Requirements 7.6**

- [ ] 14. Delivery Challan Implementation
  - [ ] 14.1 Add Delivery Challan voucher type support
    - Add 'Delivery Challan' to voucher type enum
    - Create separate numbering series for Delivery Challan
    - Add purpose field (job_work, stock_transfer, sample)
    - _Requirements: 8.1, 8.3, 8.4_
  
  - [ ] 14.2 Implement Delivery Challan specific logic
    - Set all GST amounts to zero
    - Skip sales ledger entry generation
    - Update inventory without COGS entries
    - Support E-Way Bill generation for interstate movement
    - _Requirements: 8.2, 8.6, 8.7_
  
  - [ ] 14.3 Implement Delivery Challan to Sales Invoice conversion
    - Create convertVoucher method in VoucherService
    - Copy all items from Delivery Challan
    - Generate new Sales Invoice with current date
    - Maintain reference to original Delivery Challan
    - _Requirements: 8.5, 8.8_
  
  - [ ]* 14.4 Write property test for Delivery Challan no tax liability
    - **Property 49: Delivery Challan No Tax Liability**
    - Test GST=0 and no sales ledger entries for Delivery Challan
    - **Validates: Requirements 8.2**
  
  - [ ]* 14.5 Write property test for Delivery Challan conversion
    - **Property 51: Delivery Challan to Sales Invoice Conversion**
    - Test Sales Invoice contains same items as Delivery Challan
    - **Validates: Requirements 8.5**

- [ ] 15. Proforma Invoice Implementation
  - [ ] 15.1 Add Proforma Invoice voucher type support
    - Add 'Proforma Invoice' to voucher type enum
    - Create separate numbering series for Proforma Invoice
    - Add validity_period field
    - Mark voucher type clearly as "PROFORMA INVOICE"
    - _Requirements: 9.1, 9.2, 9.5, 9.8_
  
  - [ ] 15.2 Implement Proforma Invoice specific logic
    - Calculate GST for display but don't create ledger entries
    - Skip all ledger entry generation
    - Don't update inventory quantities
    - _Requirements: 9.3, 9.4, 9.9_
  
  - [ ] 15.3 Implement Proforma to Sales Invoice conversion
    - Copy all items and amounts
    - Set voucher_date to conversion date
    - Generate new voucher number for Sales Invoice
    - Recalculate GST with new date
    - _Requirements: 9.6, 9.7_
  
  - [ ]* 15.4 Write property test for Proforma Invoice no ledger entries
    - **Property 54: Proforma Invoice No Ledger Entries**
    - Test no ledger entries created for Proforma Invoice
    - **Validates: Requirements 9.4**
  
  - [ ]* 15.5 Write property test for Proforma conversion
    - **Property 56: Proforma to Sales Invoice Conversion**
    - Test Sales Invoice has same items, new date
    - **Validates: Requirements 9.7**

- [ ] 16. API Endpoints Implementation
  - [ ] 16.1 Implement Numbering Series API endpoints
    - POST /accounting/numbering-series (create series)
    - GET /accounting/numbering-series (list all series)
    - PUT /accounting/numbering-series/:id (update series)
    - POST /accounting/numbering-series/:id/set-default (set default)
    - GET /accounting/numbering-series/:id/preview (preview next number)
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [ ] 16.2 Implement E-Invoice API endpoints
    - POST /gst/einvoice/generate (generate E-Invoice)
    - POST /gst/einvoice/:id/cancel (cancel E-Invoice)
    - GET /gst/einvoice (list E-Invoices)
    - GET /gst/einvoice/:id (get E-Invoice details)
    - POST /gst/einvoice/:id/retry (retry failed generation)
    - _Requirements: 11.4, 11.5_
  
  - [ ] 16.3 Implement E-Way Bill API endpoints
    - POST /gst/ewaybill/generate (generate E-Way Bill)
    - POST /gst/ewaybill/:id/cancel (cancel E-Way Bill)
    - PUT /gst/ewaybill/:id/vehicle (update vehicle details)
    - GET /gst/ewaybill (list E-Way Bills)
    - GET /gst/ewaybill/:id (get E-Way Bill details)
    - _Requirements: 11.6, 11.7_
  
  - [ ] 16.4 Implement TDS API endpoints
    - POST /tds/calculate (calculate TDS)
    - POST /tds/:id/generate-certificate (generate certificate)
    - POST /tds/generate-return (generate quarterly return)
    - GET /tds (list TDS details with filters)
    - _Requirements: 11.8, 11.9_
  
  - [ ] 16.5 Implement Voucher conversion endpoints
    - POST /accounting/vouchers/:id/convert (convert voucher type)
    - Support Proforma → Sales Invoice conversion
    - Support Delivery Challan → Sales Invoice conversion
    - _Requirements: 11.11, 11.12_
  
  - [ ] 16.6 Add error handling and validation middleware
    - Implement request validation middleware
    - Add error response formatting
    - Return appropriate HTTP status codes (200, 201, 400, 404, 500)
    - Return field-level error details for validation failures
    - _Requirements: 11.13, 11.14_

- [ ] 17. Multi-Tenant Security Implementation
  - [ ] 17.1 Enhance tenant isolation middleware
    - Extend existing tenant_id extraction from JWT token
    - Add tenant_id to request context
    - Validate tenant_id on all requests
    - Ensure compatibility with existing authentication system
    - _Requirements: 15.2, 15.3_
  
  - [ ] 17.2 Add tenant filtering to all new queries
    - Update all new Sequelize queries to include tenant_id filter
    - Add default scope to new models with tenant_id
    - Prevent cross-tenant data access for new features
    - Maintain existing tenant isolation for current features
    - _Requirements: 15.1, 15.4, 15.9_
  
  - [ ] 17.3 Implement tenant-specific configuration
    - Support tenant-specific GST rates
    - Support tenant-specific TDS sections
    - Isolate numbering series by tenant
    - Integrate with existing tenant configuration system
    - _Requirements: 15.5, 15.6, 15.8_
  
  - [ ]* 17.4 Write property test for multi-tenant query isolation
    - **Property 70: Multi-Tenant Query Isolation**
    - Test all new queries include tenant_id filter
    - **Validates: Requirements 15.1, 15.9**
  
  - [ ] 17.5 Write property test for multi-tenant numbering isolation
    - **Property 72: Multi-Tenant Numbering Isolation**
    - Test numbering sequences independent per tenant
    - **Validates: Requirements 15.5**

- [ ] 18. Final Integration and Testing
  - [ ] 18.1 Integration test: Complete sales invoice flow with new features
    - Create sales invoice with advanced numbering → Generate E-Invoice → Generate E-Way Bill
    - Verify all data persisted correctly in new schema
    - Verify ledger entries created with existing accounting system
    - Test with different invoice types and numbering series
    - Ensure backward compatibility with existing invoices
  
  - [ ] 18.2 Integration test: Purchase invoice with TDS
    - Create purchase invoice → Calculate TDS → Generate certificate
    - Verify TDS ledger entries integrate with existing accounting
    - Verify supplier payment reduction
    - Test with existing supplier data
  
  - [ ] 18.3 Integration test: Document conversions
    - Create Proforma → Convert to Sales Invoice
    - Create Delivery Challan → Convert to Sales Invoice
    - Verify data copied correctly
    - Ensure compatibility with existing voucher workflow
  
  - [ ] 18.4 Performance testing with existing data
    - Test concurrent voucher number generation (100 concurrent requests)
    - Test query performance with indexes on existing data
    - Test API response times under load with mixed old/new data
    - Verify no performance regression on existing features
  
  - [ ]* 18.5 Run all property-based tests
    - Execute all 72 property tests with 100 iterations each
    - Verify all properties pass
    - Generate coverage report including existing code

- [ ] 19. Final Checkpoint - System Complete
  - Ensure all unit tests pass (target: 90%+ coverage)
  - Ensure all property tests pass (100 iterations each)
  - Verify all API endpoints work correctly
  - Test multi-tenant isolation with existing and new features
  - Verify external API integrations (sandbox)
  - Review error handling and logging
  - Validate backward compatibility with existing voucher system
  - Confirm database migrations are reversible if needed
  - Ask the user if questions arise

## Notes

- **Database Schema**: Task 1 is completed ✅ - all new tables and migrations are in place
- **Backward Compatibility**: All tasks ensure compatibility with existing voucher system and codebase
- **Incremental Enhancement**: Tasks build upon existing functionality rather than replacing it
- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Integration tests ensure new components work with existing system
- The implementation uses TypeScript for type safety
- All external API calls include retry logic and circuit breakers
- Multi-tenant isolation is enhanced for new features while maintaining existing isolation
- Sequential numbering uses database-level locking to prevent race conditions
- New features integrate seamlessly with existing accounting and voucher workflows

