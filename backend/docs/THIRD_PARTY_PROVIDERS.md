# Third-Party API Providers

This document describes the supported third-party API providers for tax compliance services in India (GST, TDS, E-Invoice, E-Way Bill, HSN).

## Supported Providers

### 1. E-Invoice Providers

#### Sandbox (Recommended - Comprehensive Platform)
- **Base URL**: `https://api.sandbox.co.in`
- **Authentication**: API Key (Bearer token)
- **Provider Name**: `sandbox`
- **Documentation**: https://developer.sandbox.co.in
- **Features**: 
  - Generate e-Invoice (IRN)
  - Cancel e-Invoice
  - Get e-Invoice status
  - Generate E-Way Bill from IRN
  - **200+ APIs** covering all tax compliance needs
- **Note**: Authorized TSP (Tax Service Provider), trusted by major enterprises. Provides end-to-end tax automation.

#### NIC (National Informatics Centre) - Official Government Provider
- **Base URL**: `https://einvoice.gst.gov.in` or `https://einvoice1.gst.gov.in`
- **Authentication**: Username/Password + Client ID/Secret (OAuth2)
- **Provider Name**: `nic`
- **Documentation**: https://einvoice.gst.gov.in
- **Note**: Official government portal, requires GSTIN registration

#### FastGST
- **Base URL**: `https://api.fastgst.in`
- **Authentication**: API Key
- **Provider Name**: `fastgst`
- **Documentation**: https://fastgst.in/api-docs
- **Note**: Popular third-party provider with comprehensive API

#### ClearTax
- **Base URL**: `https://api.cleartax.in`
- **Authentication**: API Key
- **Provider Name**: `cleartax`
- **Documentation**: https://developer.cleartax.in
- **Note**: Well-established provider with good documentation

### 2. E-Way Bill Providers

#### Sandbox (Recommended)
- **Base URL**: `https://api.sandbox.co.in`
- **Authentication**: API Key (Bearer token)
- **Provider Name**: `sandbox`
- **Documentation**: https://developer.sandbox.co.in
- **Features**:
  - Generate E-Way Bill
  - Update E-Way Bill
  - Cancel E-Way Bill
  - Extend E-Way Bill
  - Generate Consolidated E-Way Bill
  - Multi-vehicle movement support
- **Note**: Comprehensive E-Way Bill management with direct TRACES integration

#### NIC (National Informatics Centre) - Official Government Provider
- **Base URL**: `https://ewaybillgst.gov.in` or `https://ewaybill1.gst.gov.in`
- **Authentication**: Username/Password + Client ID/Secret (OAuth2)
- **Provider Name**: `nic`
- **Documentation**: https://ewaybillgst.gov.in
- **Note**: Official government portal

#### FastGST
- **Base URL**: `https://api.fastgst.in`
- **Authentication**: API Key
- **Provider Name**: `fastgst`
- **Documentation**: https://fastgst.in/api-docs

### 3. HSN/SAC Lookup Providers

#### Sandbox (Recommended)
- **Base URL**: `https://api.sandbox.co.in`
- **Authentication**: API Key (Bearer token)
- **Provider Name**: `sandbox`
- **Features**: 
  - HSN/SAC search
  - HSN validation
  - GST rate lookup
  - Comprehensive tax lookup APIs

#### FastGST
- **Base URL**: `https://api.fastgst.in`
- **Authentication**: API Key
- **Provider Name**: `fastgst`
- **Features**: HSN/SAC search, validation, GST rate lookup

#### GST Portal (Official)
- **Base URL**: `https://services.gst.gov.in`
- **Authentication**: API Key (if available)
- **Provider Name**: `gst_portal`
- **Note**: Official government API

### 4. GST Services Providers

#### Sandbox (Recommended)
- **Base URL**: `https://api.sandbox.co.in`
- **Authentication**: API Key (Bearer token)
- **Provider Name**: `sandbox`
- **Features**: 
  - GSTIN validation
  - GSTIN details lookup
  - GST return generation (GSTR-1, GSTR-3B)
  - GST rate lookup
  - Comprehensive GST compliance APIs

#### FastGST
- **Base URL**: `https://api.fastgst.in`
- **Authentication**: API Key
- **Provider Name**: `fastgst`
- **Features**: GSTIN validation, GST return generation, GST rate lookup

#### ClearTax
- **Base URL**: `https://api.cleartax.in`
- **Authentication**: API Key
- **Provider Name**: `cleartax`
- **Features**: GSTIN validation, GST returns

### 5. TDS Services Providers

#### Sandbox (Recommended - Only Comprehensive TDS Provider)
- **Base URL**: `https://api.sandbox.co.in`
- **Authentication**: API Key (Bearer token)
- **Provider Name**: `sandbox`
- **Documentation**: https://developer.sandbox.co.in
- **Features**:
  - TDS calculation
  - Prepare TDS returns (Forms 24Q, 26Q, 27EQ)
  - File TDS returns
  - Generate Form 16A certificates
  - TDS return status tracking
  - Direct TRACES, NSDL, Income Tax Department integration
- **Note**: **Best TDS API provider** - Comprehensive end-to-end TDS compliance automation. Trusted by Razorpay, Airbnb, and other major enterprises.

## Configuration Structure

### Company Compliance Configuration

#### Using Sandbox (Recommended - All-in-One Solution)
```json
{
  "e_invoice": {
    "applicable": true,
    "provider": "sandbox",
    "base_url": "https://api.sandbox.co.in",
    "api_key": "your_sandbox_api_key"
  },
  "e_way_bill": {
    "applicable": true,
    "provider": "sandbox",
    "base_url": "https://api.sandbox.co.in",
    "api_key": "your_sandbox_api_key"
  },
  "hsn_api": {
    "applicable": true,
    "provider": "sandbox",
    "base_url": "https://api.sandbox.co.in",
    "api_key": "your_sandbox_api_key"
  },
  "gst_api": {
    "applicable": true,
    "provider": "sandbox",
    "base_url": "https://api.sandbox.co.in",
    "api_key": "your_sandbox_api_key"
  },
  "tds_api": {
    "applicable": true,
    "provider": "sandbox",
    "base_url": "https://api.sandbox.co.in",
    "api_key": "your_sandbox_api_key"
  }
}
```

#### Using Multiple Providers
```json
{
  "e_invoice": {
    "applicable": true,
    "provider": "nic",
    "base_url": "https://einvoice.gst.gov.in",
    "username": "your_username",
    "password": "your_password",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "auth_endpoint": "/api/v1/auth/login"
  },
  "e_way_bill": {
    "applicable": true,
    "provider": "nic",
    "base_url": "https://ewaybillgst.gov.in",
    "username": "your_username",
    "password": "your_password",
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "auth_endpoint": "/api/v1/auth/login"
  },
  "hsn_api": {
    "applicable": true,
    "provider": "fastgst",
    "base_url": "https://api.fastgst.in",
    "api_key": "your_api_key"
  },
  "gst_api": {
    "applicable": true,
    "provider": "fastgst",
    "base_url": "https://api.fastgst.in",
    "api_key": "your_api_key"
  },
  "tds_api": {
    "applicable": true,
    "provider": "sandbox",
    "base_url": "https://api.sandbox.co.in",
    "api_key": "your_sandbox_api_key"
  }
}
```

## Provider-Specific Endpoints

### Sandbox (Comprehensive API Platform)
#### E-Invoice
- Generate IRN: `/api/v1/gst/compliance/e-invoice`
- Cancel IRN: `/api/v1/gst/compliance/e-invoice/{irn}/cancel`
- Get Status: `/api/v1/gst/compliance/e-invoice/{irn}`

#### E-Way Bill
- Generate: `/api/v1/gst/compliance/e-way-bill`
- Update: `/api/v1/gst/compliance/e-way-bill/{ewayBillNo}`
- Cancel: `/api/v1/gst/compliance/e-way-bill/{ewayBillNo}/cancel`
- Extend: `/api/v1/gst/compliance/e-way-bill/{ewayBillNo}/extend`
- Get Status: `/api/v1/gst/compliance/e-way-bill/{ewayBillNo}`

#### GST
- GSTIN Validate: `/api/v1/gst/kyc/gstin/validate`
- GSTIN Details: `/api/v1/gst/kyc/gstin/{gstin}`
- GST Rate: `/api/v1/gst/tax-lookup/rate`
- GSTR-1: `/api/v1/gst/compliance/returns/gstr1`
- GSTR-3B: `/api/v1/gst/compliance/returns/gstr3b`

#### HSN
- HSN Search: `/api/v1/gst/tax-lookup/hsn/search`
- HSN Details: `/api/v1/gst/tax-lookup/hsn/{code}`
- HSN Validate: `/api/v1/gst/tax-lookup/hsn/{code}/validate`

#### TDS
- Calculate TDS: `/api/v1/tds/calculate`
- Prepare Return: `/api/v1/tds/returns/{formType}/prepare`
- File Return: `/api/v1/tds/returns/{formType}/file`
- Generate Form 16A: `/api/v1/tds/certificates/form16a/{tdsDetailId}`
- Return Status: `/api/v1/tds/returns/{formType}/{returnId}/status`

### NIC (E-Invoice)
- Generate IRN: `/api/v1/invoice/generate`
- Cancel IRN: `/api/v1/invoice/cancel`
- Get Status: `/api/v1/invoice/status/{irn}`

### FastGST
- HSN Search: `/api/v1/hsn/search`
- GSTIN Validate: `/api/v1/gst/validate`
- GST Rate: `/api/v1/gst/rate`

## Getting API Credentials

### Sandbox (Recommended)
1. Sign up at https://sandbox.co.in
2. Create an account and verify your email
3. Navigate to Developer Dashboard
4. Generate API key from the dashboard
5. Use base URL: `https://api.sandbox.co.in`
6. Use API key as Bearer token in Authorization header
7. **Documentation**: https://developer.sandbox.co.in
8. **Postman Collections**: Available in documentation
9. **SDKs**: Available for Node.js, Python, Java, etc.

**Benefits of Sandbox:**
- Single API key for all services (TDS, GST, E-Invoice, E-Way Bill, HSN)
- 200+ APIs covering all tax compliance needs
- Authorized TSP (Tax Service Provider)
- Direct integration with government portals (TRACES, NSDL, Income Tax Department)
- 99.999% uptime SLA
- Trusted by Amazon, Razorpay, Airbnb, Tata, and other major enterprises

### NIC (Government Portal)
1. Register on https://einvoice.gst.gov.in
2. Complete GSTIN verification
3. Generate Client ID and Secret from the portal
4. Use your GST portal username and password

### FastGST
1. Sign up at https://fastgst.in
2. Subscribe to API plan
3. Generate API key from dashboard
4. Use the provided base URL and API key

### ClearTax
1. Sign up at https://cleartax.in
2. Access developer portal
3. Create API application
4. Get API key and base URL

## Environment Variables

You can also set default providers via environment variables:

### Using Sandbox (Recommended)
```env
EINVOICE_API_URL=https://api.sandbox.co.in
EINVOICE_PROVIDER=sandbox
EWAYBILL_API_URL=https://api.sandbox.co.in
EWAYBILL_PROVIDER=sandbox
HSN_API_URL=https://api.sandbox.co.in
HSN_PROVIDER=sandbox
GST_API_URL=https://api.sandbox.co.in
GST_PROVIDER=sandbox
TDS_API_URL=https://api.sandbox.co.in
TDS_PROVIDER=sandbox
SANDBOX_API_KEY=your_sandbox_api_key
```

### Using Multiple Providers
```env
EINVOICE_API_URL=https://einvoice.gst.gov.in
EINVOICE_PROVIDER=nic
EWAYBILL_API_URL=https://ewaybillgst.gov.in
EWAYBILL_PROVIDER=nic
HSN_API_URL=https://api.fastgst.in
HSN_PROVIDER=fastgst
GST_API_URL=https://api.fastgst.in
GST_PROVIDER=fastgst
TDS_API_URL=https://api.sandbox.co.in
TDS_PROVIDER=sandbox
```

## Why Choose Sandbox?

**Sandbox is the best choice for comprehensive tax compliance** because:

1. **All-in-One Platform**: Single API key for TDS, GST, E-Invoice, E-Way Bill, HSN, Income Tax, and KYC
2. **200+ APIs**: Comprehensive coverage of all tax compliance needs
3. **Authorized TSP**: Direct integration with government portals (TRACES, NSDL, Income Tax Department)
4. **Enterprise Grade**: 99.999% uptime, trusted by major enterprises
5. **Developer Friendly**: Excellent documentation, Postman collections, SDKs
6. **Best TDS Provider**: Only comprehensive TDS API provider with end-to-end compliance
7. **Cost Effective**: Single subscription for all services vs. multiple providers

## Notes

- The system supports multiple providers simultaneously
- Provider can be specified per service (e-invoice, e-way bill, HSN, GST, TDS)
- If provider is not specified, defaults to "default" provider
- Each provider may have different authentication mechanisms
- API endpoints may vary between providers
- **Sandbox is recommended** for new integrations as it provides the most comprehensive coverage
