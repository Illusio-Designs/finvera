# Sandbox.co.in Utility APIs List

## Overview
This document lists all utility and master data APIs available from Sandbox.co.in that will be integrated into our GST system for supporting various tax compliance operations.

## Base Configuration
- **Production URL**: `https://api.sandbox.co.in`
- **Test URL**: `https://test-api.sandbox.co.in`
- **Authentication**: JWT Token (24-hour validity)
- **Response Format**: JSON

---

## 1. **Master Data APIs** 📊

### 1.1 HSN/SAC Code APIs
- **GET** `/gst/compliance/public/hsn/details` - Get HSN/SAC Details
- **GET** `/gst/compliance/public/hsn/search` - Search HSN/SAC Codes
- **GET** `/gst/compliance/public/hsn/rates` - Get GST Rates for HSN/SAC
- **GET** `/gst/compliance/public/hsn/categories` - Get HSN Categories

### 1.2 GST Rate APIs
- **GET** `/gst/compliance/public/rates/current` - Current GST Rates
- **GET** `/gst/compliance/public/rates/history` - Historical GST Rates
- **GET** `/gst/compliance/public/rates/by-hsn/{hsn_code}` - Rates by HSN Code

### 1.3 State & Location APIs
- **GET** `/utilities/states` - List of Indian States
- **GET** `/utilities/states/{state_code}/districts` - Districts by State
- **GET** `/utilities/pincode/{pincode}` - Pincode Details
- **GET** `/utilities/pincode/search` - Search Pincode by Area

---

## 2. **GSTIN Verification & Search APIs** 🔍

### 2.1 GSTIN Operations
- **POST** `/gst/compliance/public/gstin/search` - Search GSTIN Details
- **GET** `/gst/compliance/public/gstin/{gstin}/verify` - Verify GSTIN
- **GET** `/gst/compliance/public/gstin/{gstin}/status` - GSTIN Status Check
- **GET** `/gst/compliance/public/gstin/{gstin}/returns-status` - Returns Filing Status

### 2.2 Business Verification
- **GET** `/gst/compliance/public/gstin/{gstin}/business-details` - Business Information
- **GET** `/gst/compliance/public/gstin/{gstin}/addresses` - Registered Addresses
- **GET** `/gst/compliance/public/gstin/{gstin}/authorized-signatory` - Authorized Persons

---

## 3. **Bank & Financial APIs** 🏦

### 3.1 Bank Details
- **GET** `/utilities/banks` - List of Banks
- **GET** `/utilities/ifsc/{ifsc_code}` - IFSC Code Details
- **POST** `/utilities/bank-account/verify` - Bank Account Verification (Penny Drop)
- **GET** `/utilities/banks/search` - Search Banks by Name/Code

### 3.2 Currency & Exchange
- **GET** `/utilities/currency/rates` - Current Exchange Rates
- **GET** `/utilities/currency/rates/history` - Historical Exchange Rates

---

## 4. **Date & Time Utilities** 📅

### 4.1 Calendar APIs
- **GET** `/utilities/calendar/holidays` - Government Holidays
- **GET** `/utilities/calendar/holidays/{year}` - Holidays by Year
- **GET** `/utilities/calendar/working-days` - Working Days Calculator
- **GET** `/utilities/calendar/gst-due-dates` - GST Filing Due Dates

### 4.2 Financial Year APIs
- **GET** `/utilities/financial-year/current` - Current Financial Year
- **GET** `/utilities/financial-year/periods` - FY Periods & Quarters
- **GET** `/utilities/financial-year/gst-periods` - GST Filing Periods

---

## 5. **Validation & Format APIs** ✅

### 5.1 Format Validation
- **POST** `/utilities/validate/pan` - PAN Format Validation
- **POST** `/utilities/validate/gstin` - GSTIN Format Validation
- **POST** `/utilities/validate/aadhaar` - Aadhaar Format Validation
- **POST** `/utilities/validate/ifsc` - IFSC Code Validation

### 5.2 Data Formatting
- **POST** `/utilities/format/amount` - Amount Formatting (Indian Format)
- **POST** `/utilities/format/date` - Date Format Conversion
- **POST** `/utilities/format/address` - Address Standardization

---

## 6. **Error Handling & Status APIs** ⚠️

### 6.1 Error Management
- **GET** `/utilities/errors/codes` - Error Code Dictionary
- **GET** `/utilities/errors/messages` - Error Messages
- **GET** `/utilities/status/api-health` - API Health Check

### 6.2 System Status
- **GET** `/utilities/status/gstn` - GSTN Portal Status
- **GET** `/utilities/status/e-invoice` - E-Invoice Portal Status
- **GET** `/utilities/status/e-waybill` - E-Way Bill Portal Status

---

## 7. **Document & Template APIs** 📄

### 7.1 Document Templates
- **GET** `/utilities/templates/invoice` - Invoice Templates
- **GET** `/utilities/templates/challan` - Delivery Challan Templates
- **GET** `/utilities/templates/credit-note` - Credit Note Templates
- **GET** `/utilities/templates/debit-note` - Debit Note Templates

### 7.2 Document Validation
- **POST** `/utilities/validate/invoice-format` - Invoice Format Validation
- **POST** `/utilities/validate/gst-document` - GST Document Validation

---

## 8. **Compliance & Rules APIs** 📋

### 8.1 GST Rules
- **GET** `/utilities/rules/gst-rates` - Current GST Rate Rules
- **GET** `/utilities/rules/exemptions` - GST Exemptions List
- **GET** `/utilities/rules/reverse-charge` - Reverse Charge Mechanism Rules
- **GET** `/utilities/rules/composition-scheme` - Composition Scheme Rules

### 8.2 Compliance Checks
- **POST** `/utilities/compliance/check-threshold` - Turnover Threshold Check
- **POST** `/utilities/compliance/check-registration` - Registration Requirement Check
- **POST** `/utilities/compliance/check-filing-frequency` - Filing Frequency Check

---

## 9. **Integration Support APIs** 🔧

### 9.1 Webhook Management
- **GET** `/utilities/webhooks/events` - Available Webhook Events
- **POST** `/utilities/webhooks/test` - Test Webhook Endpoint
- **GET** `/utilities/webhooks/logs` - Webhook Delivery Logs

### 9.2 API Management
- **GET** `/utilities/api/limits` - API Rate Limits
- **GET** `/utilities/api/usage` - API Usage Statistics
- **GET** `/utilities/api/versions` - Available API Versions

---

## 10. **Reporting Utilities** 📊

### 10.1 Report Formats
- **GET** `/utilities/reports/formats/gstr1` - GSTR-1 Format Specifications
- **GET** `/utilities/reports/formats/gstr3b` - GSTR-3B Format Specifications
- **GET** `/utilities/reports/formats/e-invoice` - E-Invoice Format Specifications

### 10.2 Data Export
- **POST** `/utilities/export/csv` - Export Data to CSV
- **POST** `/utilities/export/excel` - Export Data to Excel
- **POST** `/utilities/export/pdf` - Export Data to PDF

---

## **Total Utility APIs: 60+ endpoints**

## **Priority Implementation Order:**
1. **Authentication & Health Check**
2. **HSN/SAC Code APIs** (Critical for product setup)
3. **GSTIN Verification APIs** (Critical for customer onboarding)
4. **State & Pincode APIs** (Required for address validation)
5. **GST Rate APIs** (Required for tax calculations)
6. **Bank & IFSC APIs** (Required for payment processing)
7. **Validation APIs** (Required for data integrity)
8. **Calendar & Due Date APIs** (Required for compliance)
9. **Error Handling APIs** (Required for debugging)
10. **Remaining utility APIs** (As needed)

## **Integration Notes:**
- All APIs require JWT authentication
- Rate limiting applies based on subscription plan
- Test environment available for development
- Webhook support for real-time updates
- Comprehensive error handling with detailed error codes