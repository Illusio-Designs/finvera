# Indian Invoice System Backend

## Overview

This spec implements a comprehensive Indian Invoice System Backend with support for multiple invoice types, GST compliance, E-Invoice, E-Way Bill, TDS, and advanced numbering series.

The system is built using Node.js with TypeScript, Express.js, Sequelize ORM, and PostgreSQL. The implementation follows a layered architecture with services for numbering, vouchers, GST calculation, E-Invoice, E-Way Bill, and TDS.

## Related Documents

- [Requirements](./requirements.md) - Detailed functional requirements
- [Design](./design.md) - System design and architecture  
- [Tasks](./tasks.md) - Full implementation task breakdown

## Current Status

Database schema setup is complete ✅. Core services (Numbering, GST Calculation, Voucher, E-Invoice, E-Way Bill, TDS) are implemented. Now working on specialized invoice types and API endpoints.

## Tasks

- [ ] 9.6 Write property test for TDS calculation formula - Test TDS = (amount × rate) / 100 for all amounts and rates
- [ ] 9.7 Write property test for TDS threshold application - Test TDS deducted only when amount ≥ threshold
- [ ] 9.8 Write property test for TDS payment reduction - Test supplier credit = invoice amount - TDS amount
- [ ] 11.2 Implement Bill of Supply specific logic - Override GST calculation to return zero for all taxes, skip GST ledger entry generation
- [ ] 11.3 Add composition dealer support - Add is_composition_dealer flag to tenant settings, default to Bill of Supply when flag is true
- [ ] 11.4 Write property test for Bill of Supply zero GST - Test all GST amounts are zero for Bill of Supply
- [ ] 11.5 Write property test for Bill of Supply no GST ledgers - Test no GST ledger entries created for Bill of Supply
- [ ] 12.1 Implement Retail Invoice detection logic - Add isRetailInvoice helper method (amount ≤ ₹50,000 AND no GSTIN)
- [ ] 12.2 Implement Retail Invoice validation - Make customer GSTIN optional, allow simplified customer details
- [ ] 12.3 Ensure GST calculation parity with Tax Invoice - Use same GST calculation logic as Tax Invoice
- [ ] 12.4 Write property test for Retail Invoice threshold detection - Test classification when amount ≤ ₹50,000 and no GSTIN
- [ ] 12.5 Write property test for high value invoice mandatory GSTIN - Test GSTIN required when amount > ₹50,000
- [ ] 13.1 Add Export Invoice voucher type support - Add 'Export Invoice' to voucher type enum, create numbering series, add foreign currency fields
- [ ] 13.2 Implement Export Invoice GST logic - Add has_lut flag, calculate zero GST when LUT present, calculate IGST when LUT absent
- [ ] 13.3 Implement currency conversion - Add convertToBaseCurrency method, apply exchange rate to all amounts
- [ ] 13.4 Write property test for Export Invoice zero GST with LUT - Test all GST amounts are zero when LUT present
- [ ] 13.5 Write property test for currency conversion - Test base amount = foreign amount × exchange rate
- [ ] 14.1 Add Delivery Challan voucher type support - Add 'Delivery Challan' to voucher type enum, create numbering series, add purpose field
- [ ] 14.2 Implement Delivery Challan specific logic - Set all GST amounts to zero, skip sales ledger entry generation
- [ ] 14.3 Implement Delivery Challan to Sales Invoice conversion - Create convertVoucher method, copy all items, generate new Sales Invoice
- [ ] 14.4 Write property test for Delivery Challan no tax liability - Test GST=0 and no sales ledger entries
- [ ] 14.5 Write property test for Delivery Challan conversion - Test Sales Invoice contains same items as Delivery Challan
- [ ] 15.1 Add Proforma Invoice voucher type support - Add 'Proforma Invoice' to voucher type enum, create numbering series, add validity_period field
- [ ] 15.2 Implement Proforma Invoice specific logic - Calculate GST for display but don't create ledger entries, skip all ledger entry generation
- [ ] 15.3 Implement Proforma to Sales Invoice conversion - Copy all items and amounts, set voucher_date to conversion date
- [ ] 15.4 Write property test for Proforma Invoice no ledger entries - Test no ledger entries created for Proforma Invoice
- [ ] 15.5 Write property test for Proforma conversion - Test Sales Invoice has same items, new date
- [ ] 16.1 Implement Numbering Series API endpoints - POST/GET/PUT for numbering series management
- [ ] 16.2 Implement E-Invoice API endpoints - POST/GET for E-Invoice generation, cancellation, retry
- [ ] 16.3 Implement E-Way Bill API endpoints - POST/GET/PUT for E-Way Bill generation, cancellation, vehicle updates
- [ ] 16.4 Implement TDS API endpoints - POST/GET for TDS calculation, certificate generation, return generation
- [ ] 16.5 Implement Voucher conversion endpoints - POST /accounting/vouchers/:id/convert for Proforma and Delivery Challan conversions
- [ ] 16.6 Add error handling and validation middleware - Implement request validation, error response formatting, appropriate HTTP status codes
- [ ] 17.1 Enhance tenant isolation middleware - Extend tenant_id extraction from JWT token, add tenant_id to request context
- [ ] 17.2 Add tenant filtering to all new queries - Update all new Sequelize queries to include tenant_id filter
- [ ] 17.3 Implement tenant-specific configuration - Support tenant-specific GST rates, TDS sections, numbering series
- [ ] 17.4 Write property test for multi-tenant query isolation - Test all new queries include tenant_id filter
- [ ] 17.5 Write property test for multi-tenant numbering isolation - Test numbering sequences independent per tenant
- [ ] 18.1 Integration test: Complete sales invoice flow - Create sales invoice → Generate E-Invoice → Generate E-Way Bill
- [ ] 18.2 Integration test: Purchase invoice with TDS - Create purchase invoice → Calculate TDS → Generate certificate
- [ ] 18.3 Integration test: Document conversions - Test Proforma and Delivery Challan conversions to Sales Invoice
- [ ] 18.4 Performance testing with existing data - Test concurrent voucher number generation, query performance, API response times
- [ ] 18.5 Run all property-based tests - Execute all 72 property tests with 100 iterations each
- [ ] 19. Final Checkpoint - System Complete - Ensure all tests pass, verify API endpoints, test multi-tenant isolation, review error handling
