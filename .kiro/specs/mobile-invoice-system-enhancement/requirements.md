# Requirements Document: Mobile Invoice System Enhancement

## Introduction

This document specifies the requirements for enhancing the mobile invoice system in a React Native Expo financial/accounting application. The enhancement integrates e-invoice generation, e-way bill management, and TDS (Tax Deducted at Source) calculation capabilities into existing voucher screens. The system will leverage existing backend controllers (eInvoiceController, eWayBillController, tdsController) and maintain consistency with the current mobile app architecture.

## Glossary

- **Mobile_App**: The React Native Expo mobile application for financial/accounting operations
- **Voucher_Screen**: Any of the transaction entry screens (Sales Invoice, Purchase Invoice, Credit Note, Debit Note, Payment, Receipt, Journal, Contra)
- **E_Invoice_System**: The electronic invoice generation and management subsystem
- **E_Way_Bill_System**: The electronic way bill generation and management subsystem
- **TDS_System**: The Tax Deducted at Source calculation and management subsystem
- **Backend_API**: The existing server-side controllers providing e-invoice, e-way bill, and TDS functionality
- **Company_Settings**: Configuration parameters that control feature availability (e-invoice enabled, e-way bill enabled, TDS enabled)
- **IRN**: Invoice Reference Number - unique identifier for e-invoices
- **Notification_System**: The existing CustomNotification component and push notification infrastructure
- **Voucher**: A financial transaction document (invoice, note, payment, receipt, journal entry, or contra entry)
- **Status_Badge**: UI component displaying the current state of e-invoice or e-way bill
- **TDS_Section**: Tax code category (e.g., 194C for contractor payments, 194J for professional services)

## Requirements

### Requirement 1: Voucher Screen Enhancement

**User Story:** As a mobile app user, I want all voucher screens to support e-invoice, e-way bill, and TDS features, so that I can manage complete invoice workflows from the mobile app.

#### Acceptance Criteria

1. WHEN a user opens any Voucher_Screen (Sales Invoice, Purchase Invoice, Credit Note, Debit Note, Payment, Receipt, Journal, Contra), THE Mobile_App SHALL display UI elements for e-invoice, e-way bill, and TDS based on Company_Settings
2. WHEN Company_Settings indicate e-invoice is disabled, THE Mobile_App SHALL hide all e-invoice related UI elements on Voucher_Screens
3. WHEN Company_Settings indicate e-way bill is disabled, THE Mobile_App SHALL hide all e-way bill related UI elements on Voucher_Screens
4. WHEN Company_Settings indicate TDS is disabled, THE Mobile_App SHALL hide all TDS related UI elements on Voucher_Screens
5. WHEN a Voucher_Screen loads, THE Mobile_App SHALL fetch the current status of e-invoice, e-way bill, and TDS for that voucher from Backend_API

### Requirement 2: E-Invoice Generation and Management

**User Story:** As a mobile app user, I want to generate and manage e-invoices for eligible invoices, so that I can comply with electronic invoicing regulations.

#### Acceptance Criteria

1. WHEN a user saves an eligible invoice and e-invoice is enabled in Company_Settings, THE E_Invoice_System SHALL automatically initiate e-invoice generation via Backend_API
2. WHEN e-invoice generation succeeds, THE E_Invoice_System SHALL display the IRN, acknowledgment number, acknowledgment date, and QR code on the Voucher_Screen
3. WHEN e-invoice generation fails, THE E_Invoice_System SHALL display an error message and provide a retry button
4. WHEN a user clicks the retry button for a failed e-invoice, THE E_Invoice_System SHALL attempt to regenerate the e-invoice via Backend_API
5. WHEN a user requests to cancel an e-invoice, THE E_Invoice_System SHALL prompt for a cancellation reason and submit the cancellation request to Backend_API
6. THE E_Invoice_System SHALL display e-invoice status as one of: pending, generated, cancelled, or failed

### Requirement 3: E-Way Bill Generation and Management

**User Story:** As a mobile app user, I want to generate and manage e-way bills for invoices meeting threshold requirements, so that I can comply with goods transportation regulations.

#### Acceptance Criteria

1. WHEN a user saves an invoice meeting the e-way bill threshold and e-way bill is enabled in Company_Settings, THE E_Way_Bill_System SHALL automatically initiate e-way bill generation via Backend_API
2. WHEN e-way bill generation succeeds, THE E_Way_Bill_System SHALL display the e-way bill number and validity date on the Voucher_Screen
3. WHEN e-way bill generation fails, THE E_Way_Bill_System SHALL display an error message and provide a retry button
4. WHEN a user requests to update vehicle details for an e-way bill, THE E_Way_Bill_System SHALL display a form and submit updated details to Backend_API
5. WHEN a user requests to cancel an e-way bill, THE E_Way_Bill_System SHALL prompt for a cancellation reason and submit the cancellation request to Backend_API
6. THE E_Way_Bill_System SHALL display e-way bill status as one of: pending, generated, cancelled, or failed

### Requirement 4: TDS Calculation and Display

**User Story:** As a mobile app user, I want automatic TDS calculation and deduction on applicable transactions, so that I can ensure correct tax compliance.

#### Acceptance Criteria

1. WHEN a user enters a transaction amount on a Voucher_Screen and TDS is enabled in Company_Settings, THE TDS_System SHALL automatically calculate the TDS amount based on the applicable TDS_Section and rate
2. WHEN TDS calculation completes, THE TDS_System SHALL display the TDS amount, TDS_Section, and applicable rate in the voucher summary
3. WHEN a user changes the transaction amount, THE TDS_System SHALL recalculate the TDS amount immediately
4. WHEN a user selects a different TDS_Section, THE TDS_System SHALL recalculate the TDS amount using the new section's rate
5. THE TDS_System SHALL deduct the calculated TDS amount from the net payable amount in the voucher

### Requirement 5: Settings-Based Feature Control

**User Story:** As a system administrator, I want to control which features are available based on company settings, so that users only see relevant functionality for their business needs.

#### Acceptance Criteria

1. WHEN the Mobile_App starts, THE Mobile_App SHALL fetch Company_Settings from Backend_API including e-invoice enabled status, e-way bill enabled status, and TDS enabled status
2. WHEN Company_Settings are updated on the backend, THE Mobile_App SHALL refresh settings within 5 minutes or on next app launch
3. WHERE e-invoice is enabled in Company_Settings, THE Mobile_App SHALL display e-invoice UI components on applicable Voucher_Screens
4. WHERE e-way bill is enabled in Company_Settings, THE Mobile_App SHALL display e-way bill UI components on applicable Voucher_Screens
5. WHERE TDS is enabled in Company_Settings, THE Mobile_App SHALL display TDS UI components on applicable Voucher_Screens

### Requirement 6: Notification System Integration

**User Story:** As a mobile app user, I want to receive notifications about e-invoice, e-way bill, and TDS events, so that I stay informed about document status changes.

#### Acceptance Criteria

1. WHEN e-invoice generation succeeds, THE Notification_System SHALL send a push notification with the IRN and acknowledgment details
2. WHEN e-invoice generation fails, THE Notification_System SHALL send a push notification with the error message
3. WHEN e-way bill generation succeeds, THE Notification_System SHALL send a push notification with the e-way bill number and validity
4. WHEN e-way bill generation fails, THE Notification_System SHALL send a push notification with the error message
5. WHEN TDS calculation completes, THE Notification_System SHALL send a push notification with the calculated TDS amount
6. WHEN any document status changes (e-invoice cancelled, e-way bill cancelled), THE Notification_System SHALL send a push notification with the updated status
7. THE Notification_System SHALL store all notifications in the backend for historical reference

### Requirement 7: UI Component Consistency

**User Story:** As a mobile app user, I want consistent UI design across all voucher screens, so that I have a familiar and predictable experience.

#### Acceptance Criteria

1. THE Mobile_App SHALL use existing UI components (CustomNotification, ModernDatePicker, TopBar, CustomDrawer) for all new features
2. THE Mobile_App SHALL maintain the existing color scheme and styling patterns for all new UI elements
3. WHEN displaying e-invoice status, THE Mobile_App SHALL use Status_Badge components with consistent styling
4. WHEN displaying e-way bill status, THE Mobile_App SHALL use Status_Badge components with consistent styling
5. WHEN displaying action buttons (generate, cancel, retry), THE Mobile_App SHALL use consistent button styles matching existing voucher screen buttons
6. THE Mobile_App SHALL display loading indicators during API calls using the existing loading component pattern

### Requirement 8: Reusable Component Architecture

**User Story:** As a developer, I want reusable components for e-invoice, e-way bill, and TDS features, so that I can maintain consistency and reduce code duplication across voucher screens.

#### Acceptance Criteria

1. THE Mobile_App SHALL provide a reusable E_Invoice_Status_Card component that displays IRN, acknowledgment details, QR code, and status
2. THE Mobile_App SHALL provide a reusable E_Way_Bill_Status_Card component that displays e-way bill number, validity, and status
3. THE Mobile_App SHALL provide a reusable TDS_Calculation_Card component that displays TDS amount, section, rate, and deduction details
4. THE Mobile_App SHALL provide a reusable Document_Action_Buttons component that handles generate, cancel, and retry operations
5. WHEN any of these reusable components are used on different Voucher_Screens, THE components SHALL function identically and maintain consistent appearance

### Requirement 9: API Integration and Error Handling

**User Story:** As a mobile app user, I want reliable API integration with clear error messages, so that I understand what's happening and can take corrective action when needed.

#### Acceptance Criteria

1. WHEN the Mobile_App calls Backend_API for e-invoice operations, THE Mobile_App SHALL handle network errors gracefully and display user-friendly error messages
2. WHEN the Mobile_App calls Backend_API for e-way bill operations, THE Mobile_App SHALL handle network errors gracefully and display user-friendly error messages
3. WHEN the Mobile_App calls Backend_API for TDS operations, THE Mobile_App SHALL handle network errors gracefully and display user-friendly error messages
4. WHEN an API call fails due to server error, THE Mobile_App SHALL provide a retry option to the user
5. WHEN an API call fails due to validation error, THE Mobile_App SHALL display the specific validation error message from the backend
6. WHEN the Mobile_App is offline, THE Mobile_App SHALL display an offline indicator and queue operations for retry when connectivity is restored

### Requirement 10: Data Synchronization and State Management

**User Story:** As a mobile app user, I want voucher data to stay synchronized with e-invoice, e-way bill, and TDS information, so that I always see accurate and up-to-date information.

#### Acceptance Criteria

1. WHEN a Voucher_Screen loads, THE Mobile_App SHALL fetch the latest voucher data including e-invoice status, e-way bill status, and TDS details from Backend_API
2. WHEN e-invoice generation completes, THE Mobile_App SHALL update the voucher status immediately without requiring a screen refresh
3. WHEN e-way bill generation completes, THE Mobile_App SHALL update the voucher status immediately without requiring a screen refresh
4. WHEN TDS calculation completes, THE Mobile_App SHALL update the voucher summary immediately without requiring a screen refresh
5. WHEN a user navigates away from a Voucher_Screen and returns, THE Mobile_App SHALL display the most recent data from Backend_API

### Requirement 11: Cross-Platform Compatibility

**User Story:** As a mobile app user, I want all features to work consistently on both iOS and Android devices, so that I have the same experience regardless of my device.

#### Acceptance Criteria

1. WHEN the Mobile_App runs on iOS, THE Mobile_App SHALL display all e-invoice, e-way bill, and TDS features with identical functionality to Android
2. WHEN the Mobile_App runs on Android, THE Mobile_App SHALL display all e-invoice, e-way bill, and TDS features with identical functionality to iOS
3. THE Mobile_App SHALL use React Native and Expo APIs that are compatible with both iOS and Android platforms
4. WHEN notifications are sent, THE Notification_System SHALL use platform-appropriate notification APIs for both iOS and Android
5. THE Mobile_App SHALL handle platform-specific UI differences (status bar, navigation) while maintaining functional consistency

### Requirement 12: Loading States and User Feedback

**User Story:** As a mobile app user, I want clear visual feedback during operations, so that I know the app is working and understand what's happening.

#### Acceptance Criteria

1. WHEN the Mobile_App initiates e-invoice generation, THE Mobile_App SHALL display a loading indicator with the message "Generating e-invoice..."
2. WHEN the Mobile_App initiates e-way bill generation, THE Mobile_App SHALL display a loading indicator with the message "Generating e-way bill..."
3. WHEN the Mobile_App calculates TDS, THE Mobile_App SHALL display a loading indicator with the message "Calculating TDS..."
4. WHEN any API call is in progress, THE Mobile_App SHALL disable action buttons to prevent duplicate submissions
5. WHEN an operation completes successfully, THE Mobile_App SHALL display a success message using CustomNotification component
6. WHEN an operation fails, THE Mobile_App SHALL display an error message using CustomNotification component with details about the failure
