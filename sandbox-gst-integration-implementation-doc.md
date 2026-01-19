# Sandbox.co.in GST System Integration - Implementation Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Authentication Implementation](#authentication-implementation)
4. [Core API Integration Modules](#core-api-integration-modules)
5. [Database Schema Changes](#database-schema-changes)
6. [Service Layer Implementation](#service-layer-implementation)
7. [Controller Layer Implementation](#controller-layer-implementation)
8. [Frontend Integration](#frontend-integration)
9. [Error Handling Strategy](#error-handling-strategy)
10. [Testing Strategy](#testing-strategy)
11. [Deployment & Configuration](#deployment-configuration)
12. [Monitoring & Logging](#monitoring-logging)

---

## 1. Overview

### 1.1 Integration Scope
This document outlines the implementation strategy for integrating Sandbox.co.in APIs into our existing GST system to provide comprehensive tax compliance automation.

### 1.2 Integration Modules
- **Utility APIs** - Master data and validation services
- **GST Compliance APIs** - GSTR filing and compliance
- **E-Invoice APIs** - Electronic invoice generation
- **E-Way Bill APIs** - E-way bill management
- **TDS APIs** - Tax deduction at source
- **Income Tax APIs** - Direct tax compliance

### 1.3 Technical Stack
- **Backend**: Node.js/Express.js
- **Database**: MySQL/PostgreSQL
- **Cache**: Redis
- **Queue**: Bull/Agenda
- **Authentication**: JWT
- **API Client**: Axios
- **Validation**: Joi/Yup

---

## 2. System Architecture

### 2.1 High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  Sandbox APIs   │
│   (React/Vue)   │◄──►│   (Node.js)     │◄──►│  (sandbox.co.in)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (MySQL/PG)    │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Cache/Queue   │
                       │   (Redis/Bull)  │
                       └─────────────────┘
```

### 2.2 Service Layer Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Sandbox Integration Layer                │
├─────────────────────────────────────────────────────────────┤
│  AuthService │ UtilityService │ GSTService │ InvoiceService  │
├─────────────────────────────────────────────────────────────┤
│              HTTP Client Layer (Axios)                     │
├─────────────────────────────────────────────────────────────┤
│              Error Handling & Retry Logic                  │
├─────────────────────────────────────────────────────────────┤
│              Caching Layer (Redis)                         │
├─────────────────────────────────────────────────────────────┤
│              Queue Management (Bull)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Authentication Implementation

### 3.1 Authentication Service Structure
```javascript
// services/sandboxAuthService.js
class SandboxAuthService {
  constructor() {
    this.baseURL = process.env.SANDBOX_BASE_URL;
    this.apiKey = process.env.SANDBOX_API_KEY;
    this.apiSecret = process.env.SANDBOX_API_SECRET;
    this.tokenCache = new Map();
  }

  async authenticate() {
    // Implementation for JWT token generation
  }

  async getValidToken() {
    // Token validation and refresh logic
  }

  isTokenValid(token) {
    // Token expiry validation
  }
}
```

### 3.2 Token Management Strategy
- **Token Caching**: Store tokens in Redis with TTL
- **Auto-Refresh**: Refresh tokens 1 hour before expiry
- **Fallback**: Generate new token if refresh fails
- **Rate Limiting**: Implement authentication rate limiting

---

## 4. Core API Integration Modules

### 4.1 Base HTTP Client
```javascript
// services/sandboxHttpClient.js
class SandboxHttpClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.SANDBOX_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '1.0'
      }
    });
    
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor for authentication
    // Response interceptor for error handling
    // Retry logic implementation
  }
}
```

### 4.2 Utility Service Implementation
```javascript
// services/sandboxUtilityService.js
class SandboxUtilityService extends SandboxHttpClient {
  // HSN/SAC Code APIs
  async getHSNDetails(hsnCode) {}
  async searchHSN(query) {}
  async getGSTRates(hsnCode) {}

  // GSTIN Verification APIs
  async verifyGSTIN(gstin) {}
  async searchGSTIN(gstin) {}
  async getGSTINStatus(gstin) {}

  // Location APIs
  async getPincodeDetails(pincode) {}
  async getStatesList() {}
  async getDistrictsByState(stateCode) {}

  // Bank APIs
  async verifyBankAccount(accountDetails) {}
  async getIFSCDetails(ifscCode) {}

  // Validation APIs
  async validatePAN(pan) {}
  async validateGSTIN(gstin) {}
  async validateAadhaar(aadhaar) {}
}
```

### 4.3 GST Service Implementation
```javascript
// services/sandboxGSTService.js
class SandboxGSTService extends SandboxHttpClient {
  // GSTR Filing APIs
  async getGSTR1Data(gstin, year, month) {}
  async getGSTR2AData(gstin, year, month) {}
  async getGSTR2BData(gstin, year, month) {}
  async getGSTR3BData(gstin, year, month) {}

  // Invoice Management
  async getInvoices(gstin, filters) {}
  async createInvoice(invoiceData) {}
  async updateInvoice(invoiceId, updateData) {}
  async getInvoiceCount(gstin) {}

  // Compliance APIs
  async checkComplianceStatus(gstin) {}
  async getFilingStatus(gstin, period) {}
}
```

### 4.4 E-Invoice Service Implementation
```javascript
// services/sandboxEInvoiceService.js
class SandboxEInvoiceService extends SandboxHttpClient {
  async authenticateEInvoice(gstin) {}
  async generateEInvoice(invoiceData) {}
  async cancelEInvoice(irn, reason) {}
  async getEInvoiceDetails(irn) {}
  async generateQRCode(irn) {}
}
```

### 4.5 E-Way Bill Service Implementation
```javascript
// services/sandboxEWayBillService.js
class SandboxEWayBillService extends SandboxHttpClient {
  async generateEWayBill(billData) {}
  async cancelEWayBill(ewbNumber, reason) {}
  async updateVehicleDetails(ewbNumber, vehicleData) {}
  async extendValidity(ewbNumber, extensionData) {}
  async getEWayBillDetails(ewbNumber) {}
}
```

### 4.6 TDS Service Implementation
```javascript
// services/sandboxTDSService.js
class SandboxTDSService extends SandboxHttpClient {
  // TDS Calculation
  async calculateTDS(amount, section, panAvailable) {}
  async getTDSRates(section) {}

  // TDS Filing
  async fileForm24Q(quarterData) {}
  async fileForm26Q(quarterData) {}
  async generateTDSCertificate(certificateData) {}

  // TDS Compliance
  async getTDSLiability(pan, period) {}
  async reconcileTDS(reconciliationData) {}
}
```

### 4.7 Income Tax Service Implementation
```javascript
// services/sandboxIncomeTaxService.js
class SandboxIncomeTaxService extends SandboxHttpClient {
  async calculateIncomeTax(incomeData) {}
  async prepareITR(itrData) {}
  async fileITR(itrData) {}
  async generateForm16(employeeData) {}
  async getAdvanceTaxLiability(incomeData) {}
}
```

---

## 5. Database Schema Changes

### 5.1 New Tables Required

#### 5.1.1 Sandbox Configuration Table
```sql
CREATE TABLE sandbox_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  api_key VARCHAR(255) NOT NULL,
  api_secret VARCHAR(255) NOT NULL,
  environment ENUM('test', 'live') DEFAULT 'test',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.2 API Call Logs Table
```sql
CREATE TABLE sandbox_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  api_endpoint VARCHAR(255) NOT NULL,
  request_method VARCHAR(10) NOT NULL,
  request_data JSONB,
  response_data JSONB,
  response_status INTEGER,
  response_time INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.3 HSN Master Data Table
```sql
CREATE TABLE hsn_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hsn_code VARCHAR(10) NOT NULL UNIQUE,
  description TEXT,
  gst_rate DECIMAL(5,2),
  igst_rate DECIMAL(5,2),
  cgst_rate DECIMAL(5,2),
  sgst_rate DECIMAL(5,2),
  cess_rate DECIMAL(5,2),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.4 GSTIN Verification Cache Table
```sql
CREATE TABLE gstin_verification_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gstin VARCHAR(15) NOT NULL UNIQUE,
  business_name VARCHAR(255),
  business_address TEXT,
  registration_date DATE,
  status VARCHAR(50),
  verification_data JSONB,
  last_verified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);
```

#### 5.1.5 E-Invoice Records Table
```sql
CREATE TABLE e_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  irn VARCHAR(64) UNIQUE,
  ack_number VARCHAR(20),
  ack_date TIMESTAMP,
  qr_code TEXT,
  signed_invoice JSONB,
  status VARCHAR(20) DEFAULT 'generated',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.1.6 E-Way Bill Records Table
```sql
CREATE TABLE e_way_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  invoice_id UUID REFERENCES invoices(id),
  ewb_number VARCHAR(12) UNIQUE,
  ewb_date TIMESTAMP,
  valid_until TIMESTAMP,
  vehicle_number VARCHAR(20),
  transporter_id VARCHAR(15),
  status VARCHAR(20) DEFAULT 'active',
  generation_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 Existing Table Modifications

#### 5.2.1 Add Sandbox Integration Fields to Companies
```sql
ALTER TABLE companies 
ADD COLUMN sandbox_gstin_verified BOOLEAN DEFAULT false,
ADD COLUMN sandbox_gstin_verification_date TIMESTAMP,
ADD COLUMN sandbox_business_data JSONB;
```

#### 5.2.2 Add HSN Integration to Inventory Items
```sql
ALTER TABLE inventory_items 
ADD COLUMN hsn_verified BOOLEAN DEFAULT false,
ADD COLUMN hsn_verification_date TIMESTAMP,
ADD COLUMN sandbox_hsn_data JSONB;
```

---

## 6. Service Layer Implementation

### 6.1 Service Registration
```javascript
// services/index.js
const SandboxAuthService = require('./sandboxAuthService');
const SandboxUtilityService = require('./sandboxUtilityService');
const SandboxGSTService = require('./sandboxGSTService');
// ... other services

module.exports = {
  sandboxAuth: new SandboxAuthService(),
  sandboxUtility: new SandboxUtilityService(),
  sandboxGST: new SandboxGSTService(),
  // ... other services
};
```

### 6.2 Service Configuration
```javascript
// config/sandbox.js
module.exports = {
  baseURL: process.env.SANDBOX_BASE_URL || 'https://api.sandbox.co.in',
  testURL: process.env.SANDBOX_TEST_URL || 'https://test-api.sandbox.co.in',
  apiKey: process.env.SANDBOX_API_KEY,
  apiSecret: process.env.SANDBOX_API_SECRET,
  environment: process.env.SANDBOX_ENVIRONMENT || 'test',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  cacheEnabled: true,
  cacheTTL: 3600, // 1 hour
};
```

---

## 7. Controller Layer Implementation

### 7.1 Utility Controller
```javascript
// controllers/sandboxUtilityController.js
class SandboxUtilityController {
  async verifyGSTIN(req, res, next) {
    try {
      const { gstin } = req.params;
      const result = await sandboxUtility.verifyGSTIN(gstin);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getHSNDetails(req, res, next) {
    try {
      const { hsnCode } = req.params;
      const result = await sandboxUtility.getHSNDetails(hsnCode);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async validatePAN(req, res, next) {
    try {
      const { pan } = req.body;
      const result = await sandboxUtility.validatePAN(pan);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
```

### 7.2 GST Controller
```javascript
// controllers/sandboxGSTController.js
class SandboxGSTController {
  async getGSTR1Data(req, res, next) {
    try {
      const { gstin, year, month } = req.params;
      const result = await sandboxGST.getGSTR1Data(gstin, year, month);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async syncInvoices(req, res, next) {
    try {
      const { gstin } = req.params;
      const result = await sandboxGST.getInvoices(gstin);
      // Process and store invoices
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
```

### 7.3 E-Invoice Controller
```javascript
// controllers/sandboxEInvoiceController.js
class SandboxEInvoiceController {
  async generateEInvoice(req, res, next) {
    try {
      const { invoiceId } = req.params;
      const invoice = await Invoice.findByPk(invoiceId);
      
      const eInvoiceData = await this.prepareEInvoiceData(invoice);
      const result = await sandboxEInvoice.generateEInvoice(eInvoiceData);
      
      // Store E-Invoice record
      await EInvoice.create({
        tenant_id: req.tenant_id,
        invoice_id: invoiceId,
        irn: result.irn,
        ack_number: result.ackNumber,
        ack_date: result.ackDate,
        qr_code: result.qrCode,
        signed_invoice: result.signedInvoice
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async cancelEInvoice(req, res, next) {
    try {
      const { irn } = req.params;
      const { reason } = req.body;
      
      const result = await sandboxEInvoice.cancelEInvoice(irn, reason);
      
      // Update E-Invoice record
      await EInvoice.update(
        { status: 'cancelled' },
        { where: { irn } }
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
```

---

## 8. Frontend Integration

### 8.1 API Service Layer (Frontend)
```javascript
// frontend/services/sandboxApi.js
class SandboxApiService {
  constructor() {
    this.baseURL = '/api/sandbox';
  }

  // Utility APIs
  async verifyGSTIN(gstin) {
    return await api.get(`${this.baseURL}/utility/gstin/${gstin}/verify`);
  }

  async getHSNDetails(hsnCode) {
    return await api.get(`${this.baseURL}/utility/hsn/${hsnCode}`);
  }

  async validatePAN(pan) {
    return await api.post(`${this.baseURL}/utility/validate/pan`, { pan });
  }

  // GST APIs
  async getGSTR1Data(gstin, year, month) {
    return await api.get(`${this.baseURL}/gst/gstr1/${gstin}/${year}/${month}`);
  }

  // E-Invoice APIs
  async generateEInvoice(invoiceId) {
    return await api.post(`${this.baseURL}/e-invoice/generate/${invoiceId}`);
  }

  async cancelEInvoice(irn, reason) {
    return await api.post(`${this.baseURL}/e-invoice/cancel/${irn}`, { reason });
  }
}
```

### 8.2 React Components Integration
```jsx
// components/GST/GSTINVerification.jsx
import { useState } from 'react';
import { sandboxApi } from '../../services/sandboxApi';

const GSTINVerification = ({ onVerified }) => {
  const [gstin, setGstin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const response = await sandboxApi.verifyGSTIN(gstin);
      setResult(response.data);
      onVerified(response.data);
    } catch (error) {
      console.error('GSTIN verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gstin-verification">
      <input
        type="text"
        value={gstin}
        onChange={(e) => setGstin(e.target.value)}
        placeholder="Enter GSTIN"
        maxLength={15}
      />
      <button onClick={handleVerify} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify GSTIN'}
      </button>
      {result && (
        <div className="verification-result">
          <h4>Verification Result:</h4>
          <p>Business Name: {result.businessName}</p>
          <p>Status: {result.status}</p>
          <p>Registration Date: {result.registrationDate}</p>
        </div>
      )}
    </div>
  );
};
```

---

## 9. Error Handling Strategy

### 9.1 Error Types and Handling
```javascript
// utils/sandboxErrorHandler.js
class SandboxErrorHandler {
  static handle(error) {
    if (error.response) {
      // API responded with error status
      return this.handleAPIError(error.response);
    } else if (error.request) {
      // Network error
      return this.handleNetworkError(error.request);
    } else {
      // Other errors
      return this.handleGenericError(error);
    }
  }

  static handleAPIError(response) {
    const { status, data } = response;
    
    switch (status) {
      case 401:
        return { type: 'AUTH_ERROR', message: 'Authentication failed' };
      case 403:
        return { type: 'PERMISSION_ERROR', message: 'Access denied' };
      case 429:
        return { type: 'RATE_LIMIT_ERROR', message: 'Rate limit exceeded' };
      case 500:
        return { type: 'SERVER_ERROR', message: 'Sandbox server error' };
      default:
        return { type: 'API_ERROR', message: data.message || 'API error' };
    }
  }

  static handleNetworkError(request) {
    return { type: 'NETWORK_ERROR', message: 'Network connection failed' };
  }

  static handleGenericError(error) {
    return { type: 'GENERIC_ERROR', message: error.message };
  }
}
```

### 9.2 Retry Logic Implementation
```javascript
// utils/retryLogic.js
class RetryLogic {
  static async executeWithRetry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        if (this.shouldRetry(error)) {
          await this.delay(delay * attempt);
        } else {
          throw error;
        }
      }
    }
  }

  static shouldRetry(error) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return error.response && retryableStatuses.includes(error.response.status);
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests
```javascript
// tests/services/sandboxUtilityService.test.js
describe('SandboxUtilityService', () => {
  let service;
  
  beforeEach(() => {
    service = new SandboxUtilityService();
  });

  describe('verifyGSTIN', () => {
    it('should verify valid GSTIN', async () => {
      const mockResponse = {
        gstin: '27ABCDE1234F1Z5',
        businessName: 'Test Company',
        status: 'Active'
      };
      
      jest.spyOn(service, 'verifyGSTIN').mockResolvedValue(mockResponse);
      
      const result = await service.verifyGSTIN('27ABCDE1234F1Z5');
      expect(result.status).toBe('Active');
    });

    it('should handle invalid GSTIN', async () => {
      jest.spyOn(service, 'verifyGSTIN').mockRejectedValue(
        new Error('Invalid GSTIN format')
      );
      
      await expect(service.verifyGSTIN('INVALID')).rejects.toThrow('Invalid GSTIN format');
    });
  });
});
```

### 10.2 Integration Tests
```javascript
// tests/integration/sandboxIntegration.test.js
describe('Sandbox Integration', () => {
  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
  });

  afterAll(async () => {
    // Cleanup test database
    await cleanupTestDatabase();
  });

  describe('GSTIN Verification Flow', () => {
    it('should complete full GSTIN verification flow', async () => {
      const response = await request(app)
        .get('/api/sandbox/utility/gstin/27ABCDE1234F1Z5/verify')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.gstin).toBe('27ABCDE1234F1Z5');
    });
  });
});
```

### 10.3 Mock Data for Testing
```javascript
// tests/mocks/sandboxMockData.js
module.exports = {
  validGSTIN: {
    gstin: '27ABCDE1234F1Z5',
    businessName: 'Test Company Pvt Ltd',
    status: 'Active',
    registrationDate: '2020-01-01',
    businessAddress: 'Test Address, Mumbai, Maharashtra'
  },
  
  hsnDetails: {
    hsnCode: '8517',
    description: 'Telephone sets and other apparatus',
    gstRate: 18,
    category: 'Electronics'
  },
  
  eInvoiceResponse: {
    irn: 'test-irn-123456789',
    ackNumber: 'ACK123456789',
    ackDate: '2024-01-01T10:00:00Z',
    qrCode: 'data:image/png;base64,test-qr-code'
  }
};
```

---

## 11. Deployment & Configuration

### 11.1 Environment Variables
```bash
# .env file
SANDBOX_BASE_URL=https://api.sandbox.co.in
SANDBOX_TEST_URL=https://test-api.sandbox.co.in
SANDBOX_API_KEY=key_live_xxxxxxxxxx
SANDBOX_API_SECRET=secret_live_xxxxxxxxxx
SANDBOX_ENVIRONMENT=live
SANDBOX_TIMEOUT=30000
SANDBOX_RETRY_ATTEMPTS=3
SANDBOX_CACHE_TTL=3600
```

### 11.2 Docker Configuration
```dockerfile
# Dockerfile additions for Sandbox integration
ENV SANDBOX_BASE_URL=https://api.sandbox.co.in
ENV SANDBOX_TIMEOUT=30000
ENV SANDBOX_RETRY_ATTEMPTS=3

# Install additional dependencies if needed
RUN npm install axios redis bull
```

### 11.3 Kubernetes Configuration
```yaml
# k8s/sandbox-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: sandbox-config
data:
  SANDBOX_BASE_URL: "https://api.sandbox.co.in"
  SANDBOX_TIMEOUT: "30000"
  SANDBOX_RETRY_ATTEMPTS: "3"
---
apiVersion: v1
kind: Secret
metadata:
  name: sandbox-secrets
type: Opaque
data:
  SANDBOX_API_KEY: <base64-encoded-key>
  SANDBOX_API_SECRET: <base64-encoded-secret>
```

---

## 12. Monitoring & Logging

### 12.1 Logging Strategy
```javascript
// utils/sandboxLogger.js
const winston = require('winston');

const sandboxLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sandbox-integration' },
  transports: [
    new winston.transports.File({ filename: 'logs/sandbox-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/sandbox-combined.log' })
  ]
});

module.exports = sandboxLogger;
```

### 12.2 Metrics Collection
```javascript
// utils/sandboxMetrics.js
const prometheus = require('prom-client');

const sandboxApiCalls = new prometheus.Counter({
  name: 'sandbox_api_calls_total',
  help: 'Total number of Sandbox API calls',
  labelNames: ['endpoint', 'method', 'status']
});

const sandboxApiDuration = new prometheus.Histogram({
  name: 'sandbox_api_duration_seconds',
  help: 'Duration of Sandbox API calls',
  labelNames: ['endpoint', 'method']
});

module.exports = {
  sandboxApiCalls,
  sandboxApiDuration
};
```

### 12.3 Health Check Implementation
```javascript
// routes/health.js
router.get('/sandbox-health', async (req, res) => {
  try {
    const startTime = Date.now();
    await sandboxAuth.authenticate();
    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      service: 'sandbox-integration',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'sandbox-integration',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

---

## 13. Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Setup authentication service
- [ ] Implement base HTTP client
- [ ] Create database schema
- [ ] Setup error handling

### Phase 2: Utility APIs (Week 3-4)
- [ ] Implement GSTIN verification
- [ ] Implement HSN/SAC lookup
- [ ] Implement validation APIs
- [ ] Add caching layer

### Phase 3: GST Compliance (Week 5-7)
- [ ] Implement GSTR APIs
- [ ] Add invoice management
- [ ] Create compliance dashboard
- [ ] Add reporting features

### Phase 4: E-Invoice & E-Way Bill (Week 8-10)
- [ ] Implement E-Invoice generation
- [ ] Implement E-Way Bill management
- [ ] Add QR code generation
- [ ] Create management interface

### Phase 5: TDS & Income Tax (Week 11-13)
- [ ] Implement TDS calculation
- [ ] Add TDS filing APIs
- [ ] Implement Income Tax APIs
- [ ] Create tax planning tools

### Phase 6: Testing & Deployment (Week 14-15)
- [ ] Complete unit testing
- [ ] Integration testing
- [ ] Performance testing
- [ ] Production deployment

---

## 14. Success Metrics

### 14.1 Technical Metrics
- **API Response Time**: < 2 seconds average
- **API Success Rate**: > 99.5%
- **Cache Hit Rate**: > 80%
- **Error Rate**: < 0.5%

### 14.2 Business Metrics
- **GSTIN Verification Accuracy**: > 99%
- **E-Invoice Generation Success**: > 98%
- **Compliance Report Accuracy**: > 99%
- **User Adoption Rate**: > 80%

---

## 15. Risk Mitigation

### 15.1 Technical Risks
- **API Rate Limiting**: Implement intelligent rate limiting and queuing
- **Service Downtime**: Add circuit breaker pattern and fallback mechanisms
- **Data Consistency**: Implement proper transaction management
- **Security**: Encrypt sensitive data and implement proper access controls

### 15.2 Business Risks
- **Compliance Changes**: Regular monitoring of regulatory updates
- **Data Accuracy**: Implement validation and verification processes
- **User Training**: Comprehensive documentation and training materials
- **Support**: 24/7 technical support for critical issues

---

This implementation documentation provides a comprehensive roadmap for integrating Sandbox.co.in APIs into your GST system. The modular approach ensures scalability and maintainability while providing robust error handling and monitoring capabilities.