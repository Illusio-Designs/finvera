# FastGST API Setup Guide

## FastGST Services Available

FastGST provides the following APIs:

### ✅ Available from FastGST:
1. **HSN/SAC Code Lookup** - Search and validate HSN/SAC codes
2. **GST Tax Rate Lookup** - Get GST rates for HSN codes

### ❌ NOT Available from FastGST:
- E-Invoice generation
- E-Way Bill generation
- GSTIN validation
- GST Return filing (GSTR-1, GSTR-3B)

## Recommended Provider Combination

Since FastGST doesn't provide all services, we recommend using:

### Option 1: FastGST + GSTZen (Recommended)
- **FastGST**: HSN/SAC lookup, GST rate lookup
- **GSTZen**: E-Invoice, E-Way Bill, GSTIN validation

### Option 2: FastGST + NIC (Government)
- **FastGST**: HSN/SAC lookup, GST rate lookup
- **NIC**: E-Invoice, E-Way Bill (official government portal)

## FastGST Setup Steps

### 1. Create Account
- Visit: https://www.fastgst.in
- Sign up using Google account
- Access FastGST Console

### 2. Activate Tax Lookup API
- Go to Marketplace section
- Find "Tax Lookup API"
- Click "Activate"

### 3. Choose Plan
- **Developer Trial**: 300 requests/month (Free)
- **Paid Plans**: Higher limits available

### 4. Generate API Key
- Go to API Keys section
- Generate new API key
- Copy and save the key securely

### 5. Configure in System

Update your company compliance configuration:

```json
{
  "hsn_api": {
    "applicable": true,
    "provider": "fastgst",
    "base_url": "https://api.fastgst.in",
    "api_key": "your_fastgst_api_key_here"
  },
  "gst_api": {
    "applicable": true,
    "provider": "fastgst",
    "base_url": "https://api.fastgst.in",
    "api_key": "your_fastgst_api_key_here"
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

## FastGST API Endpoints

### HSN Search
- **Endpoint**: `POST /api/v1/tax-lookup/search`
- **Request**: `{ "query": "text", "type": "GOODS|SERVICES" }`
- **Response**: Array of HSN/SAC codes with descriptions and GST rates

### Get HSN by Code
- **Endpoint**: `GET /api/v1/tax-lookup/hsn/{code}`
- **Response**: HSN code details with GST rates

### Validate HSN
- **Endpoint**: `GET /api/v1/tax-lookup/validate/{code}`
- **Response**: Validation result

### Get GST Rate
- **Endpoint**: `POST /api/v1/tax-lookup/rate`
- **Request**: `{ "hsn_code": "1234", "state": "MH" }`
- **Response**: CGST, SGST, IGST, Cess rates

## Authentication

FastGST uses API key authentication:
- Add header: `X-API-Key: your_api_key`
- Or: `Authorization: Bearer your_api_key`

## Rate Limits

- Free Trial: 300 requests/month
- Paid Plans: Varies by plan
- Check your plan details in FastGST Console

## Documentation

- FastGST Tax Lookup API: https://docs.taxlookupapi.fastgst.in
- FastGST Website: https://www.fastgst.in
- Support: twileloop@outlook.com
