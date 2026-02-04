# Requirements Document: Indian Invoice System Backend

## Introduction

The Indian Invoice System Backend is a comprehensive GST-compliant invoicing system designed for Indian businesses. The system supports multiple invoice types, complete GST calculations (CGST, SGST, IGST), E-Invoice integration with the government IRP portal, E-Way Bill generation, TDS calculations, advanced invoice numbering with multiple series support, and proper double-entry bookkeeping.

This backend system builds upon an existing foundation that includes basic sales invoices (Tax Invoice), core voucher types, and basic GST calculation. The enhancements focus on advanced invoice numbering, E-Invoice/E-Way Bill integration, TDS implementation, additional invoice types, and enhanced GST compliance features.

## Glossary

- **System**: The Indian Invoice System Backend
- **IRP**: Invoice Registration Portal - Government portal for E-Invoice registration
- **IRN**: Invoice Reference Number - Unique identifier for E-Invoices
- **GST**: Goods and Services Tax
- **CGST**: Central Goods and Services Tax (for intrastate transactions)
- **SGST**: State Goods and Services Tax (for intrastate transactions)
- **IGST**: Integrated Goods and Services Tax (for interstate transactions)
- **GSTIN**: GST Identification Number
- **HSN**: Harmonized System of Nomenclature code for goods
- **SAC**: Services Accounting Code for services
- **E-Way_Bill**: Electronic waybill for goods movement
- **TDS**: Tax Deducted at Source
- **PAN**: Permanent Account Number
- **TAN**: Tax Deduction Account Number
- **Voucher**: An accounting document representing a transaction
- **Numbering_Series**: A configuration defining how voucher numbers are generated
- **Place_of_Supply**: The state where goods/services are supplied
- **Taxable_Amount**: Amount on which GST is calculated (excluding GST)
- **Financial_Year**: April 1 to March 31 period for Indian accounting
- **Tenant**: An organization using the multi-tenant system
- **Ledger**: An account in the double-entry bookkeeping system
- **QR_Code**: Quick Response code containing E-Invoice details
- **Deductee**: Person/entity from whom TDS is deducted

## Requirements

### Requirement 1: Advanced Invoice Numbering System

**User Story:** As an accountant, I want flexible invoice numbering with multiple series support, so that I can organize invoices by type, branch, or business unit while maintaining GST compliance.

#### Acceptance Criteria

1. THE System SHALL support multiple numbering series per voucher type
2. WHEN creating a numbering series, THE System SHALL validate that the format contains both PREFIX and SEQUENCE tokens
3. THE System SHALL generate sequential voucher numbers without gaps within each series
4. WHEN a voucher is created, THE System SHALL use the default numbering series if no series is specified
5. THE System SHALL support format tokens including PREFIX, YEAR, YY, MONTH, MM, SEQUENCE, BRANCH, COMPANY, and SEPARATOR
6. WHEN the reset frequency is reached, THE System SHALL reset the sequence to the start number
7. THE System SHALL ensure generated voucher numbers do not exceed 16 characters for GST compliance
8. THE System SHALL prevent duplicate voucher numbers within a tenant
9. WHEN generating a voucher number, THE System SHALL use database-level locking to prevent race conditions
10. THE System SHALL maintain a history of all generated voucher numbers with timestamps

### Requirement 2: E-Invoice Integration with IRP Portal

**User Story:** As a business owner, I want automatic E-Invoice generation with IRN and QR codes, so that I can comply with GST E-Invoice regulations and provide digitally signed invoices to customers.

#### Acceptance Criteria

1. WHEN a sales invoice exceeds the E-Invoice threshold, THE System SHALL automatically generate an E-Invoice request
2. THE System SHALL validate all mandatory E-Invoice fields before sending to IRP portal
3. WHEN E-Invoice generation succeeds, THE System SHALL store the IRN, acknowledgment number, acknowledgment date, signed invoice, and QR code
4. WHEN E-Invoice generation fails, THE System SHALL store the error message and allow manual retry
5. THE System SHALL support E-Invoice cancellation within 24 hours of generation
6. WHEN cancelling an E-Invoice, THE System SHALL provide a reason code and remarks
7. THE System SHALL authenticate with the IRP portal using client credentials
8. THE System SHALL handle IRP portal authentication token expiry and refresh automatically
9. THE System SHALL include the QR code on printed invoices for E-Invoice enabled transactions
10. THE System SHALL support both production and sandbox IRP environments

### Requirement 3: E-Way Bill Generation and Management

**User Story:** As a logistics manager, I want automatic E-Way Bill generation for goods movement, so that I can comply with GST transportation regulations and track vehicle details.

#### Acceptance Criteria

1. WHEN a sales invoice with goods value exceeding ₹50,000 is posted, THE System SHALL prompt for E-Way Bill generation
2. THE System SHALL validate transporter GSTIN, vehicle number, and transport mode before generating E-Way Bill
3. WHEN E-Way Bill generation succeeds, THE System SHALL store the EWB number, generation date, and validity period
4. THE System SHALL calculate E-Way Bill validity based on distance (1 day per 200 KM for normal goods)
5. WHEN an E-Way Bill is active, THE System SHALL support vehicle number updates during transit
6. THE System SHALL support E-Way Bill cancellation with reason codes
7. WHEN goods value is below ₹50,000 for intrastate movement, THE System SHALL mark E-Way Bill as optional
8. THE System SHALL support multiple transport modes including road, rail, air, and ship
9. THE System SHALL authenticate with the E-Way Bill portal using client credentials
10. THE System SHALL track E-Way Bill status including active, cancelled, and expired states

### Requirement 4: TDS Calculation and Certificate Generation

**User Story:** As an accounts payable clerk, I want automatic TDS calculation on purchase invoices, so that I can comply with Income Tax TDS regulations and generate Form 16A certificates.

#### Acceptance Criteria

1. WHEN a purchase invoice is created with a TDS-applicable section, THE System SHALL calculate TDS amount based on the section rate
2. THE System SHALL validate that the supplier has a valid PAN before applying TDS
3. WHEN taxable amount is below the section threshold, THE System SHALL not deduct TDS
4. THE System SHALL support TDS sections including 194C, 194I, 194J, and 194H with their respective rates
5. WHEN TDS is deducted, THE System SHALL create ledger entries for TDS payable
6. THE System SHALL reduce the payment amount to supplier by the TDS amount
7. WHEN generating TDS certificates, THE System SHALL include deductee PAN, TAN, section code, and amounts
8. THE System SHALL support quarterly TDS return generation in the required format
9. THE System SHALL track TDS certificate numbers sequentially
10. THE System SHALL maintain TDS details linked to the original voucher for audit trails

### Requirement 5: Bill of Supply for Exempted Goods

**User Story:** As a composition dealer, I want to issue Bills of Supply for exempted goods, so that I can comply with GST regulations for non-taxable supplies.

#### Acceptance Criteria

1. THE System SHALL support a Bill of Supply voucher type distinct from Tax Invoice
2. WHEN creating a Bill of Supply, THE System SHALL not calculate or display GST amounts
3. THE System SHALL clearly mark the document as "Bill of Supply" in the voucher
4. WHEN items are marked as exempt or nil-rated, THE System SHALL allow them in Bill of Supply
5. THE System SHALL generate sequential Bill of Supply numbers using a separate numbering series
6. THE System SHALL create proper ledger entries for Bill of Supply without GST ledgers
7. WHEN a composition dealer is configured, THE System SHALL default to Bill of Supply for sales
8. THE System SHALL validate that Bill of Supply is not used for taxable supplies

### Requirement 6: Retail Invoice for B2C Transactions

**User Story:** As a retailer, I want simplified invoices for B2C sales below ₹50,000, so that I can issue compliant invoices without requiring customer GSTIN.

#### Acceptance Criteria

1. WHEN invoice value is ≤ ₹50,000 and customer GSTIN is not provided, THE System SHALL generate a Retail Invoice
2. THE System SHALL make customer GSTIN optional for Retail Invoices
3. THE System SHALL allow simplified customer details including only name and location
4. THE System SHALL calculate GST normally for Retail Invoices based on place of supply
5. THE System SHALL use a separate numbering series for Retail Invoices
6. WHEN invoice value exceeds ₹50,000, THE System SHALL require full customer details and GSTIN
7. THE System SHALL create proper ledger entries for Retail Invoices identical to Tax Invoices

### Requirement 7: Export Invoice with LUT/Bond Support

**User Story:** As an export manager, I want to issue export invoices with foreign currency and shipping details, so that I can comply with export documentation requirements.

#### Acceptance Criteria

1. THE System SHALL support Export Invoice as a distinct voucher type
2. WHEN creating an Export Invoice, THE System SHALL allow foreign currency selection
3. THE System SHALL support zero-rated GST for exports with LUT (Letter of Undertaking)
4. WHEN LUT is not available, THE System SHALL calculate IGST and mark it as refundable
5. THE System SHALL capture shipping bill number, date, port of loading, and destination country
6. THE System SHALL support currency conversion rates for foreign currency invoices
7. THE System SHALL generate sequential Export Invoice numbers using a separate numbering series
8. THE System SHALL validate that place of supply is marked as "Export" for Export Invoices
9. THE System SHALL create ledger entries in base currency after conversion

### Requirement 8: Delivery Challan for Non-Sale Movement

**User Story:** As a warehouse manager, I want to issue delivery challans for job work and stock transfers, so that I can document goods movement without creating tax liability.

#### Acceptance Criteria

1. THE System SHALL support Delivery Challan as a distinct voucher type
2. WHEN creating a Delivery Challan, THE System SHALL not calculate GST or create sales ledger entries
3. THE System SHALL capture purpose of movement including job work, stock transfer, or sample
4. THE System SHALL generate sequential Delivery Challan numbers using a separate numbering series
5. THE System SHALL support conversion of Delivery Challan to Sales Invoice when goods are sold
6. THE System SHALL track inventory movement for Delivery Challans without affecting COGS
7. WHEN Delivery Challan is for interstate movement, THE System SHALL support E-Way Bill generation
8. THE System SHALL maintain reference between Delivery Challan and subsequent Sales Invoice

### Requirement 9: Proforma Invoice for Quotations

**User Story:** As a sales representative, I want to issue proforma invoices as quotations, so that I can provide formal price quotes that can be converted to actual invoices.

#### Acceptance Criteria

1. THE System SHALL support Proforma Invoice as a distinct voucher type
2. WHEN creating a Proforma Invoice, THE System SHALL clearly mark it as "PROFORMA INVOICE"
3. THE System SHALL calculate GST for display purposes but not create tax liability
4. THE System SHALL not create ledger entries for Proforma Invoices
5. THE System SHALL generate sequential Proforma Invoice numbers using a separate numbering series
6. THE System SHALL support conversion of Proforma Invoice to Sales Invoice
7. WHEN converting to Sales Invoice, THE System SHALL copy all item details and recalculate with new date
8. THE System SHALL track validity period for Proforma Invoices
9. THE System SHALL not affect inventory or accounts until converted to actual invoice

### Requirement 10: Enhanced GST Compliance and Validation

**User Story:** As a compliance officer, I want comprehensive GST validation and compliance checks, so that I can ensure all invoices meet GST regulations and avoid penalties.

#### Acceptance Criteria

1. WHEN place of supply equals supplier state, THE System SHALL calculate CGST and SGST
2. WHEN place of supply differs from supplier state, THE System SHALL calculate IGST
3. THE System SHALL validate that HSN codes are minimum 6 digits for businesses with turnover > ₹5 crores
4. WHEN reverse charge is applicable, THE System SHALL mark the invoice and adjust GST calculation
5. THE System SHALL validate GSTIN format using checksum validation
6. THE System SHALL ensure invoice date is not in the future
7. THE System SHALL validate that invoice date is within the current or previous financial year
8. WHEN items have different GST rates, THE System SHALL calculate tax separately for each rate
9. THE System SHALL apply round-off to the nearest rupee and create round-off ledger entry
10. THE System SHALL validate that total amount equals sum of taxable amount plus all taxes plus round-off

### Requirement 11: API Endpoints for All Features

**User Story:** As a frontend developer, I want comprehensive REST API endpoints for all invoice features, so that I can build user interfaces for invoice management.

#### Acceptance Criteria

1. THE System SHALL provide POST endpoint for creating numbering series with validation
2. THE System SHALL provide GET endpoint for retrieving all numbering series for a tenant
3. THE System SHALL provide PUT endpoint for updating numbering series configuration
4. THE System SHALL provide POST endpoint for generating E-Invoice with IRN response
5. THE System SHALL provide POST endpoint for cancelling E-Invoice with reason
6. THE System SHALL provide POST endpoint for generating E-Way Bill with EWB number response
7. THE System SHALL provide PUT endpoint for updating vehicle details on active E-Way Bill
8. THE System SHALL provide POST endpoint for calculating TDS with amount breakdown
9. THE System SHALL provide POST endpoint for generating TDS certificates
10. THE System SHALL provide GET endpoints for retrieving vouchers by type with pagination
11. THE System SHALL provide POST endpoint for converting Proforma Invoice to Sales Invoice
12. THE System SHALL provide POST endpoint for converting Delivery Challan to Sales Invoice
13. THE System SHALL return appropriate HTTP status codes including 200, 201, 400, 404, and 500
14. WHEN validation fails, THE System SHALL return detailed error messages with field-level errors

### Requirement 12: Database Schema Enhancements

**User Story:** As a database administrator, I want properly designed database tables with indexes and constraints, so that the system performs efficiently and maintains data integrity.

#### Acceptance Criteria

1. THE System SHALL create a numbering_series table with fields for tenant, voucher type, format, and sequence
2. THE System SHALL create a numbering_history table to track all generated voucher numbers
3. THE System SHALL create indexes on tenant_id and voucher_type for numbering_series table
4. THE System SHALL enforce unique constraint on IRN field in e_invoices table
5. THE System SHALL enforce unique constraint on EWB number field in e_way_bills table
6. THE System SHALL create foreign key constraints linking voucher_id to vouchers table
7. THE System SHALL create indexes on voucher_id for e_invoices, e_way_bills, and tds_details tables
8. THE System SHALL support tenant_id field in all tables for multi-tenant isolation
9. THE System SHALL create indexes on status fields for efficient filtering
10. THE System SHALL use UUID as primary key type for all tables

### Requirement 13: Audit Trail and Transaction History

**User Story:** As an auditor, I want complete audit trails for all invoice transactions, so that I can track changes and ensure compliance during audits.

#### Acceptance Criteria

1. THE System SHALL record created_by user ID for all vouchers
2. THE System SHALL record created_at and updated_at timestamps for all vouchers
3. WHEN a voucher is modified, THE System SHALL update the updated_at timestamp
4. THE System SHALL maintain numbering history with generation timestamps
5. THE System SHALL log all E-Invoice generation attempts with success or failure status
6. THE System SHALL log all E-Way Bill generation and cancellation events
7. THE System SHALL track TDS certificate generation with certificate numbers and dates
8. WHEN a voucher is cancelled, THE System SHALL update status without deleting the record
9. THE System SHALL maintain references between related documents (e.g., Credit Note to original Invoice)
10. THE System SHALL support querying audit trail by date range, user, and voucher type

### Requirement 14: Error Handling and Retry Mechanisms

**User Story:** As a system administrator, I want robust error handling and retry mechanisms for external API calls, so that temporary failures do not disrupt business operations.

#### Acceptance Criteria

1. WHEN IRP portal API call fails, THE System SHALL store the error message and allow manual retry
2. WHEN E-Way Bill portal API call fails, THE System SHALL store the error message and allow manual retry
3. THE System SHALL implement exponential backoff for API retry attempts
4. WHEN authentication token expires, THE System SHALL automatically refresh and retry the request
5. THE System SHALL log all API errors with request and response details for debugging
6. WHEN network timeout occurs, THE System SHALL return a user-friendly error message
7. THE System SHALL validate API responses and handle malformed responses gracefully
8. WHEN API rate limit is exceeded, THE System SHALL queue requests and retry after delay
9. THE System SHALL provide admin interface to view failed API calls and retry manually
10. THE System SHALL send notifications for critical API failures requiring attention

### Requirement 15: Multi-Tenant Data Isolation

**User Story:** As a SaaS provider, I want complete data isolation between tenants, so that each organization's data remains secure and private.

#### Acceptance Criteria

1. THE System SHALL include tenant_id in all database queries as a filter
2. THE System SHALL validate tenant_id from authentication token before processing requests
3. WHEN creating records, THE System SHALL automatically set tenant_id from authenticated user
4. THE System SHALL prevent cross-tenant data access through API endpoints
5. THE System SHALL isolate numbering series by tenant to prevent number conflicts
6. THE System SHALL maintain separate E-Invoice and E-Way Bill records per tenant
7. THE System SHALL ensure TDS calculations are isolated per tenant
8. THE System SHALL support tenant-specific configuration for GST rates and sections
9. WHEN querying data, THE System SHALL apply tenant_id filter at the database level
10. THE System SHALL audit log any attempts to access data across tenant boundaries

