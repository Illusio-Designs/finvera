# GSTZen API Setup Guide

## Overview

GSTZen is a comprehensive GST compliance API provider that offers all the services you need:
- ✅ **GST API**: GSTIN validation, GST return filing (GSTR-1, GSTR-3B)
- ✅ **E-Invoice**: IRN generation and cancellation
- ✅ **E-Way Bill**: E-way bill generation and cancellation
- ✅ **HSN Lookup**: HSN/SAC code search (limited)

## Services Provided by GSTZen

### 1. GST Services
- GSTIN validation
- GSTIN details lookup
- GST rate lookup by HSN code
- GSTR-1 return generation
- GSTR-3B return generation

### 2. E-Invoice Services
- Generate IRN (Invoice Reference Number)
- Cancel IRN
- Get IRN status
- Download signed invoice
- QR code generation

### 3. E-Way Bill Services
- Generate E-way bill
- Cancel E-way bill
- Get E-way bill status
- Update E-way bill

## Setup Steps

### 1. Create Account
- Visit: https://gstzen.in
- Sign up for an account
- Complete verification process

### 2. Subscribe to API Plan
- Choose a plan that includes:
  - E-Invoice API
  - E-Way Bill API
  - GST API (GSTIN validation, returns)
- Plans vary by usage limits

### 3. Generate API Key
- Log in to GSTZen dashboard
- Navigate to API Keys section
- Generate new API key
- Copy and save securely

### 4. Configure in System

Update your company compliance configuration:

```json
{
  "gst_api": {
    "applicable": true,
    "provider": "gstzen",
    "base_url": "https://api.gstzen.in",
    "api_key": "your_gstzen_api_key_here"
  },
  "e_invoice": {
    "applicable": true,
    "provider": "gstzen",
    "base_url": "https://api.gstzen.in",
    "api_key": "your_gstzen_api_key_here"
  },
  "e_way_bill": {
    "applicable": true,
    "provider": "gstzen",
    "base_url": "https://api.gstzen.in",
    "api_key": "your_gstzen_api_key_here"
  }
}
```

## API Endpoints

### GST Services

#### Validate GSTIN
- **Endpoint**: `POST /api/v1/gst/validate`
- **Request**: `{ "gstin": "27AABCU9603R1ZX" }`
- **Response**: Validation result with business details

#### Get GSTIN Details
- **Endpoint**: `GET /api/v1/gst/details/{gstin}`
- **Response**: Complete GSTIN information

#### Get GST Rate
- **Endpoint**: `POST /api/v1/gst/rate`
- **Request**: `{ "hsn_code": "1234", "state": "MH" }`
- **Response**: CGST, SGST, IGST rates

#### Generate GSTR-1
- **Endpoint**: `POST /api/v1/gst/returns/gstr1`
- **Request**: GSTR-1 JSON data
- **Response**: Generated return with acknowledgment

#### Generate GSTR-3B
- **Endpoint**: `POST /api/v1/gst/returns/gstr3b`
- **Request**: GSTR-3B JSON data
- **Response**: Generated return with summary

### E-Invoice Services

#### Generate IRN
- **Endpoint**: `POST /api/v1/einvoice/generate`
- **Request**: Invoice JSON data
- **Response**: IRN, acknowledgment number, QR code

#### Cancel IRN
- **Endpoint**: `POST /api/v1/einvoice/cancel`
- **Request**: `{ "irn": "...", "reason": "..." }`
- **Response**: Cancellation status

#### Get IRN Status
- **Endpoint**: `GET /api/v1/einvoice/status/{irn}`
- **Response**: Current status of IRN

### E-Way Bill Services

#### Generate E-Way Bill
- **Endpoint**: `POST /api/v1/ewaybill/generate`
- **Request**: E-way bill JSON data
- **Response**: E-way bill number, validity

#### Cancel E-Way Bill
- **Endpoint**: `POST /api/v1/ewaybill/cancel`
- **Request**: `{ "eway_bill_no": "...", "reason": "..." }`
- **Response**: Cancellation status

#### Get E-Way Bill Status
- **Endpoint**: `GET /api/v1/ewaybill/status/{eway_bill_no}`
- **Response**: Current status

## Authentication

GSTZen uses API key authentication:
- Add header: `X-API-Key: your_api_key`
- Or: `Authorization: Bearer your_api_key`

## Rate Limits

- Varies by subscription plan
- Check your plan details in GSTZen dashboard
- Contact support for custom limits

## Documentation

- GSTZen Website: https://gstzen.in
- API Documentation: Check GSTZen dashboard
- Support: Contact through GSTZen portal

## Benefits of Using GSTZen

1. **Single Provider**: All services from one API
2. **Unified Authentication**: One API key for all services
3. **Consistent API Structure**: Similar endpoints across services
4. **Reliable Service**: Established provider with good support
5. **Comprehensive Coverage**: All GST compliance needs covered

## Notes

- All services use the same base URL: `https://api.gstzen.in`
- Same API key works for all services
- Ensure your subscription includes all required services
- Test in sandbox mode before going live
