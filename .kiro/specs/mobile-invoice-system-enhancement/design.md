# Design Document: Mobile Invoice System Enhancement

## Overview

This design document outlines the technical architecture for enhancing the mobile invoice system in a React Native Expo application. The enhancement integrates three major subsystems: e-invoice generation and management, e-way bill generation and management, and TDS (Tax Deducted at Source) calculation. The design maintains consistency with the existing mobile app architecture, leverages existing backend APIs, and provides a seamless user experience across all voucher screens.

The system follows a modular component-based architecture where reusable UI components are composed into voucher screens. Feature visibility is controlled by company settings fetched from the backend, ensuring that users only see functionality relevant to their business needs. The design emphasizes error handling, offline capability, and cross-platform compatibility.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Voucher Screens (8 types)                  │   │
│  │  Sales Invoice │ Purchase │ Credit Note │ Debit Note │   │
│  │  Payment │ Receipt │ Journal │ Contra                │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ▲                                   │
│                          │                                   │
│  ┌──────────────────────┴───────────────────────────────┐   │
│  │         Reusable Feature Components                  │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐  │   │
│  │  │ E-Invoice   │ │ E-Way Bill   │ │ TDS          │  │   │
│  │  │ Status Card │ │ Status Card  │ │ Calculation  │  │   │
│  │  └─────────────┘ └──────────────┘ └──────────────┘  │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │      Document Action Buttons Component         │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ▲                                   │
│                          │                                   │
│  ┌──────────────────────┴───────────────────────────────┐   │
│  │              Service Layer                           │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐  │   │
│  │  │ E-Invoice    │ │ E-Way Bill   │ │ TDS         │  │   │
│  │  │ Service      │ │ Service      │ │ Service     │  │   │
│  │  └──────────────┘ └──────────────┘ └─────────────┘  │   │
│  │  ┌──────────────┐ ┌──────────────┐                  │   │
│  │  │ Settings     │ │ Notification │                  │   │
│  │  │ Service      │ │ Service      │                  │   │
│  │  └──────────────┘ └──────────────┘                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ▲                                   │
│                          │                                   │
│  ┌──────────────────────┴───────────────────────────────┐   │
│  │              API Client Layer                        │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │  HTTP Client (Axios/Fetch)                   │    │   │
│  │  │  - Request/Response Interceptors             │    │   │
│  │  │  - Error Handling                            │    │   │
│  │  │  - Retry Logic                               │    │   │
│  │  │  - Offline Queue                             │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend API Layer                        │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐         │
│  │ eInvoice     │ │ eWayBill     │ │ TDS         │         │
│  │ Controller   │ │ Controller   │ │ Controller  │         │
│  └──────────────┘ └──────────────┘ └─────────────┘         │
│  ┌──────────────┐ ┌──────────────┐                         │
│  │ Settings     │ │ Notification │                         │
│  │ Controller   │ │ Controller   │                         │
│  └──────────────┘ └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

Each voucher screen follows this component structure:

```
VoucherScreen
├── TopBar (existing)
├── VoucherForm (existing)
│   ├── BasicDetails
│   ├── LineItems
│   └── Summary
├── E_Invoice_Status_Card (new, conditional)
│   ├── Status_Badge
│   ├── IRN_Display
│   ├── QR_Code_Display
│   └── Document_Action_Buttons
├── E_Way_Bill_Status_Card (new, conditional)
│   ├── Status_Badge
│   ├── EWB_Number_Display
│   ├── Validity_Display
│   └── Document_Action_Buttons
├── TDS_Calculation_Card (new, conditional)
│   ├── TDS_Section_Selector
│   ├── TDS_Amount_Display
│   └── TDS_Details_Display
└── CustomNotification (existing)
```

### State Management

The application uses React Context API for global state management:

```typescript
// Settings Context - manages company settings
interface SettingsContextType {
  eInvoiceEnabled: boolean;
  eWayBillEnabled: boolean;
  tdsEnabled: boolean;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

// Voucher Context - manages voucher-specific state
interface VoucherContextType {
  voucher: Voucher;
  eInvoiceStatus: EInvoiceStatus | null;
  eWayBillStatus: EWayBillStatus | null;
  tdsDetails: TDSDetails | null;
  updateVoucher: (data: Partial<Voucher>) => void;
  refreshVoucherData: () => Promise<void>;
}
```

## Components and Interfaces

### Core Data Models

```typescript
// Voucher Types
type VoucherType = 
  | 'SALES_INVOICE' 
  | 'PURCHASE_INVOICE' 
  | 'CREDIT_NOTE' 
  | 'DEBIT_NOTE' 
  | 'PAYMENT' 
  | 'RECEIPT' 
  | 'JOURNAL' 
  | 'CONTRA';

// Base Voucher Interface
interface Voucher {
  id: string;
  type: VoucherType;
  voucherNumber: string;
  date: Date;
  partyName: string;
  amount: number;
  netAmount: number;
  lineItems: LineItem[];
  status: 'DRAFT' | 'SAVED' | 'POSTED';
}

// E-Invoice Models
interface EInvoiceStatus {
  status: 'PENDING' | 'GENERATED' | 'CANCELLED' | 'FAILED';
  irn: string | null;
  ackNo: string | null;
  ackDate: Date | null;
  qrCode: string | null;
  errorMessage: string | null;
  generatedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
}

interface EInvoiceGenerateRequest {
  voucherId: string;
  voucherType: VoucherType;
}

interface EInvoiceCancelRequest {
  voucherId: string;
  irn: string;
  reason: string;
  reasonCode: string;
}

// E-Way Bill Models
interface EWayBillStatus {
  status: 'PENDING' | 'GENERATED' | 'CANCELLED' | 'FAILED';
  ewbNumber: string | null;
  validUntil: Date | null;
  vehicleNumber: string | null;
  transporterId: string | null;
  errorMessage: string | null;
  generatedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
}

interface EWayBillGenerateRequest {
  voucherId: string;
  voucherType: VoucherType;
  vehicleNumber?: string;
  transporterId?: string;
  distance?: number;
}

interface EWayBillUpdateVehicleRequest {
  ewbNumber: string;
  vehicleNumber: string;
  reasonCode: string;
  reasonRemark: string;
}

interface EWayBillCancelRequest {
  ewbNumber: string;
  reason: string;
  reasonCode: string;
}

// TDS Models
interface TDSDetails {
  section: TDSSection;
  rate: number;
  amount: number;
  deducteeType: 'INDIVIDUAL' | 'COMPANY' | 'FIRM';
  panNumber: string | null;
  calculatedAt: Date;
}

type TDSSection = 
  | '194C' // Contractor payments
  | '194J' // Professional services
  | '194H' // Commission
  | '194I' // Rent
  | '194A' // Interest
  | '192'  // Salary
  | '194D' // Insurance commission
  | '194G' // Lottery winnings
  | 'OTHER';

interface TDSCalculateRequest {
  voucherId: string;
  amount: number;
  section: TDSSection;
  deducteeType: string;
  panNumber?: string;
}

// Company Settings
interface CompanySettings {
  companyId: string;
  eInvoiceEnabled: boolean;
  eWayBillEnabled: boolean;
  tdsEnabled: boolean;
  eInvoiceThreshold: number;
  eWayBillThreshold: number;
  autoGenerateEInvoice: boolean;
  autoGenerateEWayBill: boolean;
  defaultTDSSection: TDSSection | null;
}

// Notification Models
interface NotificationPayload {
  type: 'E_INVOICE' | 'E_WAY_BILL' | 'TDS' | 'STATUS_CHANGE';
  title: string;
  message: string;
  voucherId: string;
  voucherNumber: string;
  timestamp: Date;
  data?: Record<string, any>;
}
```

### Service Layer Interfaces

```typescript
// E-Invoice Service
interface IEInvoiceService {
  generateEInvoice(request: EInvoiceGenerateRequest): Promise<EInvoiceStatus>;
  cancelEInvoice(request: EInvoiceCancelRequest): Promise<EInvoiceStatus>;
  getEInvoiceStatus(voucherId: string): Promise<EInvoiceStatus | null>;
  retryEInvoiceGeneration(voucherId: string): Promise<EInvoiceStatus>;
}

// E-Way Bill Service
interface IEWayBillService {
  generateEWayBill(request: EWayBillGenerateRequest): Promise<EWayBillStatus>;
  cancelEWayBill(request: EWayBillCancelRequest): Promise<EWayBillStatus>;
  updateVehicleDetails(request: EWayBillUpdateVehicleRequest): Promise<EWayBillStatus>;
  getEWayBillStatus(voucherId: string): Promise<EWayBillStatus | null>;
  retryEWayBillGeneration(voucherId: string): Promise<EWayBillStatus>;
}

// TDS Service
interface ITDSService {
  calculateTDS(request: TDSCalculateRequest): Promise<TDSDetails>;
  getTDSDetails(voucherId: string): Promise<TDSDetails | null>;
  getTDSRates(): Promise<Map<TDSSection, number>>;
}

// Settings Service
interface ISettingsService {
  getCompanySettings(): Promise<CompanySettings>;
  refreshSettings(): Promise<CompanySettings>;
  isEInvoiceEnabled(): boolean;
  isEWayBillEnabled(): boolean;
  isTDSEnabled(): boolean;
}

// Notification Service
interface INotificationService {
  sendNotification(payload: NotificationPayload): Promise<void>;
  scheduleNotification(payload: NotificationPayload, delay: number): Promise<void>;
  getNotificationHistory(voucherId: string): Promise<NotificationPayload[]>;
}
```

### Reusable Component Interfaces

```typescript
// E-Invoice Status Card Props
interface EInvoiceStatusCardProps {
  status: EInvoiceStatus;
  onGenerate: () => Promise<void>;
  onCancel: (reason: string, reasonCode: string) => Promise<void>;
  onRetry: () => Promise<void>;
  loading: boolean;
}

// E-Way Bill Status Card Props
interface EWayBillStatusCardProps {
  status: EWayBillStatus;
  onGenerate: (vehicleNumber?: string, transporterId?: string) => Promise<void>;
  onCancel: (reason: string, reasonCode: string) => Promise<void>;
  onUpdateVehicle: (vehicleNumber: string, reason: string) => Promise<void>;
  onRetry: () => Promise<void>;
  loading: boolean;
}

// TDS Calculation Card Props
interface TDSCalculationCardProps {
  tdsDetails: TDSDetails | null;
  amount: number;
  onSectionChange: (section: TDSSection) => Promise<void>;
  onCalculate: () => Promise<void>;
  loading: boolean;
}

// Document Action Buttons Props
interface DocumentActionButtonsProps {
  status: 'PENDING' | 'GENERATED' | 'CANCELLED' | 'FAILED';
  onGenerate?: () => Promise<void>;
  onCancel?: () => Promise<void>;
  onRetry?: () => Promise<void>;
  loading: boolean;
  generateLabel?: string;
  cancelLabel?: string;
  retryLabel?: string;
}

// Status Badge Props
interface StatusBadgeProps {
  status: 'PENDING' | 'GENERATED' | 'CANCELLED' | 'FAILED';
  label: string;
}
```

## Data Models

### Database Schema Extensions

The existing voucher tables will be extended with foreign keys to new tables:

```sql
-- E-Invoice table
CREATE TABLE e_invoices (
  id UUID PRIMARY KEY,
  voucher_id UUID NOT NULL REFERENCES vouchers(id),
  status VARCHAR(20) NOT NULL,
  irn VARCHAR(64) UNIQUE,
  ack_no VARCHAR(50),
  ack_date TIMESTAMP,
  qr_code TEXT,
  error_message TEXT,
  generated_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- E-Way Bill table
CREATE TABLE e_way_bills (
  id UUID PRIMARY KEY,
  voucher_id UUID NOT NULL REFERENCES vouchers(id),
  status VARCHAR(20) NOT NULL,
  ewb_number VARCHAR(12) UNIQUE,
  valid_until TIMESTAMP,
  vehicle_number VARCHAR(20),
  transporter_id VARCHAR(15),
  distance INTEGER,
  error_message TEXT,
  generated_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TDS table
CREATE TABLE tds_entries (
  id UUID PRIMARY KEY,
  voucher_id UUID NOT NULL REFERENCES vouchers(id),
  section VARCHAR(10) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  deductee_type VARCHAR(20) NOT NULL,
  pan_number VARCHAR(10),
  calculated_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification history table
CREATE TABLE notification_history (
  id UUID PRIMARY KEY,
  voucher_id UUID NOT NULL REFERENCES vouchers(id),
  type VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);
```

### API Response Formats

```typescript
// Standard API Response Wrapper
interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error: APIError | null;
  timestamp: Date;
}

interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// E-Invoice API Responses
type EInvoiceGenerateResponse = APIResponse<EInvoiceStatus>;
type EInvoiceCancelResponse = APIResponse<EInvoiceStatus>;
type EInvoiceStatusResponse = APIResponse<EInvoiceStatus>;

// E-Way Bill API Responses
type EWayBillGenerateResponse = APIResponse<EWayBillStatus>;
type EWayBillCancelResponse = APIResponse<EWayBillStatus>;
type EWayBillUpdateResponse = APIResponse<EWayBillStatus>;
type EWayBillStatusResponse = APIResponse<EWayBillStatus>;

// TDS API Responses
type TDSCalculateResponse = APIResponse<TDSDetails>;
type TDSDetailsResponse = APIResponse<TDSDetails>;
type TDSRatesResponse = APIResponse<Map<TDSSection, number>>;

// Settings API Response
type SettingsResponse = APIResponse<CompanySettings>;
```

### Local Storage Schema

```typescript
// Cached settings (refreshed periodically)
interface CachedSettings {
  settings: CompanySettings;
  cachedAt: Date;
  expiresAt: Date;
}

// Offline operation queue
interface OfflineOperation {
  id: string;
  type: 'E_INVOICE_GENERATE' | 'E_WAY_BILL_GENERATE' | 'TDS_CALCULATE' | 'CANCEL_DOCUMENT';
  payload: any;
  voucherId: string;
  createdAt: Date;
  retryCount: number;
  maxRetries: number;
}

// Local storage keys
const STORAGE_KEYS = {
  SETTINGS: '@app/settings',
  OFFLINE_QUEUE: '@app/offline_queue',
  NOTIFICATION_HISTORY: '@app/notifications',
  USER_PREFERENCES: '@app/preferences'
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies:

**Redundant Properties:**
- Criteria 1.2, 1.3, 1.4 are specific cases of 1.1 (conditional UI display based on settings)
- Criteria 5.3, 5.4, 5.5 duplicate 1.1 (conditional UI display based on settings)
- Criterion 10.1 duplicates 1.5 (data fetching on screen load)
- Criteria 2.3 and 3.3 can be combined into one property about error handling UI
- Criteria 2.4 and retry functionality across all systems can be unified
- Criteria 6.1, 6.2, 6.3, 6.4, 6.5 follow the same pattern and can be combined into one comprehensive notification property
- Criteria 9.1, 9.2, 9.3 follow the same pattern for error handling across different API types
- Criteria 10.2, 10.3, 10.4 follow the same pattern for reactive UI updates
- Criteria 12.1, 12.2, 12.3 follow the same pattern for loading indicators

**Combined Properties:**
After reflection, I will create comprehensive properties that cover multiple related criteria rather than creating separate properties for each minor variation.

### Correctness Properties

**Property 1: Settings-Based UI Visibility**

*For any* voucher screen and any company settings configuration, when the screen renders, the UI elements for e-invoice, e-way bill, and TDS should be visible if and only if the corresponding feature is enabled in the settings.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 5.3, 5.4, 5.5**

**Property 2: Voucher Data Fetching on Load**

*For any* voucher screen, when the screen loads, the app should fetch the current voucher data including e-invoice status, e-way bill status, and TDS details from the backend API.

**Validates: Requirements 1.5, 10.1**

**Property 3: Automatic E-Invoice Generation Trigger**

*For any* eligible invoice where e-invoice is enabled in settings, when the user saves the invoice, the system should automatically initiate e-invoice generation via the backend API.

**Validates: Requirements 2.1**

**Property 4: E-Invoice Success Display**

*For any* successful e-invoice generation response, the system should display all required fields (IRN, acknowledgment number, acknowledgment date, and QR code) on the voucher screen.

**Validates: Requirements 2.2**

**Property 5: Document Generation Error Handling**

*For any* failed document generation (e-invoice or e-way bill), the system should display an error message and provide a retry button.

**Validates: Requirements 2.3, 3.3**

**Property 6: Retry Functionality**

*For any* failed document generation operation, when the user clicks the retry button, the system should attempt to regenerate the document via the backend API.

**Validates: Requirements 2.4**

**Property 7: Document Cancellation Workflow**

*For any* generated document (e-invoice or e-way bill), when the user requests cancellation, the system should prompt for a cancellation reason and submit the cancellation request to the backend API with that reason.

**Validates: Requirements 2.5, 3.5**

**Property 8: Status Display Correctness**

*For any* document status value (pending, generated, cancelled, or failed), the system should display the status correctly using the appropriate status badge.

**Validates: Requirements 2.6, 3.6**

**Property 9: Automatic E-Way Bill Generation Trigger**

*For any* invoice where the amount meets or exceeds the e-way bill threshold and e-way bill is enabled in settings, when the user saves the invoice, the system should automatically initiate e-way bill generation via the backend API.

**Validates: Requirements 3.1**

**Property 10: E-Way Bill Success Display**

*For any* successful e-way bill generation response, the system should display the e-way bill number and validity date on the voucher screen.

**Validates: Requirements 3.2**

**Property 11: Vehicle Details Update Workflow**

*For any* generated e-way bill, when the user requests to update vehicle details, the system should display a form and submit the updated details to the backend API.

**Validates: Requirements 3.4**

**Property 12: TDS Calculation Correctness**

*For any* transaction amount and TDS section with a known rate, when TDS is enabled in settings, the calculated TDS amount should equal the transaction amount multiplied by the section's rate.

**Validates: Requirements 4.1**

**Property 13: TDS Display Completeness**

*For any* completed TDS calculation, the system should display the TDS amount, TDS section, and applicable rate in the voucher summary.

**Validates: Requirements 4.2**

**Property 14: TDS Recalculation on Amount Change**

*For any* voucher with TDS enabled, when the transaction amount changes, the TDS amount should be recalculated immediately and correctly based on the current TDS section and rate.

**Validates: Requirements 4.3**

**Property 15: TDS Recalculation on Section Change**

*For any* voucher with TDS enabled, when the TDS section changes, the TDS amount should be recalculated immediately using the new section's rate.

**Validates: Requirements 4.4**

**Property 16: Net Amount Calculation Invariant**

*For any* voucher with TDS, the net payable amount should always equal the gross amount minus the TDS amount (netAmount = grossAmount - tdsAmount).

**Validates: Requirements 4.5**

**Property 17: Comprehensive Notification Sending**

*For any* significant event (e-invoice success/failure, e-way bill success/failure, TDS calculation completion, document status change), the system should send a push notification with appropriate details about the event.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

**Property 18: Notification Persistence**

*For any* notification sent by the system, the notification should be stored in the backend for historical reference.

**Validates: Requirements 6.7**

**Property 19: Loading Indicator Display**

*For any* API call in progress, the system should display a loading indicator.

**Validates: Requirements 7.6**

**Property 20: Component Behavior Consistency**

*For any* reusable component (E_Invoice_Status_Card, E_Way_Bill_Status_Card, TDS_Calculation_Card, Document_Action_Buttons), when used on different voucher screens, the component should function identically with the same inputs.

**Validates: Requirements 8.5**

**Property 21: Network Error Handling**

*For any* API call (e-invoice, e-way bill, or TDS operations) that fails due to network error, the system should handle the error gracefully and display a user-friendly error message.

**Validates: Requirements 9.1, 9.2, 9.3**

**Property 22: Server Error Retry Option**

*For any* API call that fails due to server error, the system should provide a retry option to the user.

**Validates: Requirements 9.4**

**Property 23: Validation Error Display**

*For any* API call that fails due to validation error, the system should display the specific validation error message from the backend.

**Validates: Requirements 9.5**

**Property 24: Offline Operation Queueing**

*For any* operation attempted while the app is offline, the system should display an offline indicator and queue the operation for retry when connectivity is restored.

**Validates: Requirements 9.6**

**Property 25: Reactive UI Updates**

*For any* document generation or calculation that completes (e-invoice, e-way bill, or TDS), the system should update the UI immediately without requiring a screen refresh.

**Validates: Requirements 10.2, 10.3, 10.4**

**Property 26: Data Freshness on Navigation**

*For any* voucher screen, when a user navigates away and then returns to the screen, the system should fetch and display the most recent data from the backend API.

**Validates: Requirements 10.5**

**Property 27: Operation-Specific Loading Messages**

*For any* operation type (e-invoice generation, e-way bill generation, TDS calculation), when the operation is initiated, the system should display a loading indicator with an operation-specific message.

**Validates: Requirements 12.1, 12.2, 12.3**

**Property 28: Button Disabling During API Calls**

*For any* API call in progress, the system should disable action buttons to prevent duplicate submissions.

**Validates: Requirements 12.4**

**Property 29: Success Notification Display**

*For any* operation that completes successfully, the system should display a success message using the CustomNotification component.

**Validates: Requirements 12.5**

**Property 30: Error Notification Display**

*For any* operation that fails, the system should display an error message using the CustomNotification component with details about the failure.

**Validates: Requirements 12.6**

## Error Handling

### Error Categories

The system handles four categories of errors:

1. **Network Errors**: Connection failures, timeouts, DNS resolution failures
2. **Server Errors**: 5xx HTTP status codes, backend service unavailability
3. **Validation Errors**: 4xx HTTP status codes with validation messages
4. **Business Logic Errors**: Application-specific errors (e.g., invoice not eligible for e-invoice)

### Error Handling Strategy

```typescript
interface ErrorHandler {
  handleError(error: Error, context: ErrorContext): ErrorResponse;
}

interface ErrorContext {
  operation: string;
  voucherId: string;
  retryable: boolean;
}

interface ErrorResponse {
  message: string;
  displayToUser: boolean;
  allowRetry: boolean;
  logToBackend: boolean;
  notifyUser: boolean;
}

class APIErrorHandler implements ErrorHandler {
  handleError(error: Error, context: ErrorContext): ErrorResponse {
    if (error instanceof NetworkError) {
      return {
        message: "Unable to connect. Please check your internet connection.",
        displayToUser: true,
        allowRetry: true,
        logToBackend: false,
        notifyUser: false
      };
    }
    
    if (error instanceof ServerError) {
      return {
        message: "Server error occurred. Please try again.",
        displayToUser: true,
        allowRetry: true,
        logToBackend: true,
        notifyUser: true
      };
    }
    
    if (error instanceof ValidationError) {
      return {
        message: error.details.message,
        displayToUser: true,
        allowRetry: false,
        logToBackend: true,
        notifyUser: false
      };
    }
    
    if (error instanceof BusinessLogicError) {
      return {
        message: error.message,
        displayToUser: true,
        allowRetry: false,
        logToBackend: true,
        notifyUser: false
      };
    }
    
    // Unknown error
    return {
      message: "An unexpected error occurred. Please contact support.",
      displayToUser: true,
      allowRetry: true,
      logToBackend: true,
      notifyUser: true
    };
  }
}
```

### Retry Logic

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < config.maxRetries && isRetryable(error)) {
        await sleep(delay);
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}

function isRetryable(error: Error): boolean {
  return error instanceof NetworkError || 
         error instanceof ServerError ||
         (error instanceof APIError && error.statusCode >= 500);
}
```

### Offline Handling

```typescript
interface OfflineQueueManager {
  enqueue(operation: OfflineOperation): void;
  processQueue(): Promise<void>;
  clearQueue(): void;
  getQueueSize(): number;
}

class OfflineQueueManagerImpl implements OfflineQueueManager {
  private queue: OfflineOperation[] = [];
  private processing: boolean = false;
  
  enqueue(operation: OfflineOperation): void {
    this.queue.push(operation);
    this.persistQueue();
  }
  
  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const operation = this.queue[0];
      
      try {
        await this.executeOperation(operation);
        this.queue.shift(); // Remove successful operation
        this.persistQueue();
      } catch (error) {
        if (operation.retryCount >= operation.maxRetries) {
          this.queue.shift(); // Remove failed operation after max retries
          this.notifyOperationFailed(operation);
        } else {
          operation.retryCount++;
          break; // Stop processing on failure
        }
      }
    }
    
    this.processing = false;
  }
  
  private async executeOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.type) {
      case 'E_INVOICE_GENERATE':
        return await eInvoiceService.generateEInvoice(operation.payload);
      case 'E_WAY_BILL_GENERATE':
        return await eWayBillService.generateEWayBill(operation.payload);
      case 'TDS_CALCULATE':
        return await tdsService.calculateTDS(operation.payload);
      case 'CANCEL_DOCUMENT':
        return await this.cancelDocument(operation.payload);
    }
  }
  
  private persistQueue(): void {
    AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.queue));
  }
  
  clearQueue(): void {
    this.queue = [];
    this.persistQueue();
  }
  
  getQueueSize(): number {
    return this.queue.length;
  }
  
  private notifyOperationFailed(operation: OfflineOperation): void {
    notificationService.sendNotification({
      type: 'STATUS_CHANGE',
      title: 'Operation Failed',
      message: `Failed to complete ${operation.type} after ${operation.maxRetries} attempts`,
      voucherId: operation.voucherId,
      voucherNumber: '',
      timestamp: new Date()
    });
  }
}
```

### Error Boundary Component

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class VoucherScreenErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Voucher screen error:', error, errorInfo);
    // Log to backend error tracking service
    logErrorToBackend(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            We encountered an error loading this screen. Please try again.
          </Text>
          <Button
            title="Reload"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }
    
    return this.props.children;
  }
}
```

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of e-invoice, e-way bill, and TDS operations
- Edge cases (empty data, boundary values, special characters)
- Error conditions (network failures, validation errors, server errors)
- Integration points between components and services
- UI component rendering with specific props

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs (see Correctness Properties section)
- Comprehensive input coverage through randomization
- Invariants that must be maintained (e.g., net amount calculation)
- Round-trip properties (e.g., serialization/deserialization)
- Metamorphic properties (e.g., TDS calculation relationships)

### Property-Based Testing Configuration

**Testing Library**: We will use `fast-check` for property-based testing in TypeScript/JavaScript.

**Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: `Feature: mobile-invoice-system-enhancement, Property {number}: {property_text}`

**Example Property Test**:

```typescript
import fc from 'fast-check';

describe('Feature: mobile-invoice-system-enhancement', () => {
  test('Property 12: TDS Calculation Correctness', () => {
    // Feature: mobile-invoice-system-enhancement, Property 12
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000000 }), // transaction amount
        fc.constantFrom('194C', '194J', '194H', '194I', '194A'), // TDS section
        async (amount, section) => {
          const rate = await getTDSRate(section);
          const calculated = await tdsService.calculateTDS({
            voucherId: 'test-voucher',
            amount,
            section,
            deducteeType: 'COMPANY'
          });
          
          const expected = amount * rate;
          expect(calculated.amount).toBeCloseTo(expected, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property 16: Net Amount Calculation Invariant', () => {
    // Feature: mobile-invoice-system-enhancement, Property 16
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000000 }), // gross amount
        fc.float({ min: 0, max: 0.2 }), // TDS rate (0-20%)
        (grossAmount, tdsRate) => {
          const tdsAmount = grossAmount * tdsRate;
          const netAmount = grossAmount - tdsAmount;
          
          // Invariant: netAmount = grossAmount - tdsAmount
          expect(netAmount).toBeCloseTo(grossAmount - tdsAmount, 2);
          expect(netAmount).toBeLessThanOrEqual(grossAmount);
          expect(netAmount).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Strategy

**Component Tests**:
```typescript
describe('EInvoiceStatusCard', () => {
  it('should display IRN when e-invoice is generated', () => {
    const status: EInvoiceStatus = {
      status: 'GENERATED',
      irn: 'TEST-IRN-123',
      ackNo: 'ACK-456',
      ackDate: new Date(),
      qrCode: 'QR-CODE-DATA',
      errorMessage: null,
      generatedAt: new Date(),
      cancelledAt: null,
      cancellationReason: null
    };
    
    const { getByText } = render(
      <EInvoiceStatusCard
        status={status}
        onGenerate={jest.fn()}
        onCancel={jest.fn()}
        onRetry={jest.fn()}
        loading={false}
      />
    );
    
    expect(getByText('TEST-IRN-123')).toBeTruthy();
    expect(getByText('ACK-456')).toBeTruthy();
  });
  
  it('should show retry button when e-invoice generation fails', () => {
    const status: EInvoiceStatus = {
      status: 'FAILED',
      irn: null,
      ackNo: null,
      ackDate: null,
      qrCode: null,
      errorMessage: 'Generation failed',
      generatedAt: null,
      cancelledAt: null,
      cancellationReason: null
    };
    
    const onRetry = jest.fn();
    const { getByText } = render(
      <EInvoiceStatusCard
        status={status}
        onGenerate={jest.fn()}
        onCancel={jest.fn()}
        onRetry={onRetry}
        loading={false}
      />
    );
    
    const retryButton = getByText('Retry');
    fireEvent.press(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });
});
```

**Service Tests**:
```typescript
describe('EInvoiceService', () => {
  it('should generate e-invoice successfully', async () => {
    const mockResponse: EInvoiceStatus = {
      status: 'GENERATED',
      irn: 'TEST-IRN',
      ackNo: 'ACK-123',
      ackDate: new Date(),
      qrCode: 'QR-DATA',
      errorMessage: null,
      generatedAt: new Date(),
      cancelledAt: null,
      cancellationReason: null
    };
    
    mockAPI.post.mockResolvedValue({ data: mockResponse });
    
    const result = await eInvoiceService.generateEInvoice({
      voucherId: 'voucher-123',
      voucherType: 'SALES_INVOICE'
    });
    
    expect(result.status).toBe('GENERATED');
    expect(result.irn).toBe('TEST-IRN');
  });
  
  it('should handle network error gracefully', async () => {
    mockAPI.post.mockRejectedValue(new NetworkError('Connection failed'));
    
    await expect(
      eInvoiceService.generateEInvoice({
        voucherId: 'voucher-123',
        voucherType: 'SALES_INVOICE'
      })
    ).rejects.toThrow('Connection failed');
  });
});
```

### Integration Testing

**End-to-End Flow Tests**:
```typescript
describe('Sales Invoice E-Invoice Flow', () => {
  it('should complete full e-invoice generation flow', async () => {
    // 1. Load voucher screen
    const { getByText, getByTestId } = render(<SalesInvoiceScreen />);
    
    // 2. Fill in voucher details
    fireEvent.changeText(getByTestId('amount-input'), '100000');
    fireEvent.press(getByText('Save'));
    
    // 3. Wait for auto e-invoice generation
    await waitFor(() => {
      expect(getByText('Generating e-invoice...')).toBeTruthy();
    });
    
    // 4. Verify e-invoice status displayed
    await waitFor(() => {
      expect(getByText(/IRN:/)).toBeTruthy();
    });
    
    // 5. Verify notification sent
    expect(notificationService.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'E_INVOICE',
        title: expect.stringContaining('E-Invoice Generated')
      })
    );
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 30 correctness properties must have corresponding property tests
- **Integration Test Coverage**: All critical user flows (e-invoice generation, e-way bill generation, TDS calculation)
- **Error Scenario Coverage**: All error categories (network, server, validation, business logic)

### Continuous Testing

- Run unit tests on every commit
- Run property tests on every pull request
- Run integration tests before deployment
- Monitor test execution time and optimize slow tests
- Track flaky tests and fix root causes
