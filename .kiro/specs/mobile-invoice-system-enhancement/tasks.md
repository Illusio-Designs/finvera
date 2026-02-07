# Implementation Plan: Mobile Invoice System Enhancement

## Overview

This implementation plan breaks down the mobile invoice system enhancement into discrete, manageable tasks. The approach follows a bottom-up strategy: first establishing the foundational services and data models, then building reusable UI components, and finally integrating everything into the existing voucher screens. Each task builds incrementally, ensuring that code is tested and integrated as we progress.

## Tasks

- [x] 1. Set up project structure and core interfaces
  - Create directory structure: app/src/services/invoice/, app/src/components/invoice/, app/src/types/
  - Define JavaScript interfaces/PropTypes for all data models (EInvoiceStatus, EWayBillStatus, TDSDetails, CompanySettings, etc.)
  - Add new API endpoints to existing app/src/lib/api.js (eInvoiceAPI, eWayBillAPI, tdsAPI, settingsAPI)
  - Note: React Native app uses JavaScript, not TypeScript
  - Note: Property-based testing will use existing test framework (if available) or Jest
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 9.1_

- [x] 2. Implement Settings Service and Context
  - [x] 2.1 Create SettingsService (app/src/services/invoice/SettingsService.js)
    - Implement getCompanySettings() to fetch from backend via tenantAPI.getProfile()
    - Implement refreshSettings() with cache invalidation
    - Implement boolean helpers (isEInvoiceEnabled, isEWayBillEnabled, isTDSEnabled)
    - Add AsyncStorage caching with expiration using @react-native-async-storage/async-storage
    - Parse settings from tenant profile response (tenant.settings object)
    - _Requirements: 5.1, 5.2_
  
  - [x] 2.2 Write property test for settings caching
    - **Property: Settings Cache Validity**
    - **Validates: Requirements 5.1**
  
  - [x] 2.3 Create SettingsContext (app/src/contexts/SettingsContext.jsx)
    - Implement React Context with settings state
    - Add loading and error states
    - Provide refreshSettings function to consumers
    - Follow existing context pattern from AuthContext and NotificationContext
    - _Requirements: 5.1_
  
  - [x] 2.4 Write unit tests for SettingsService
    - Test successful settings fetch
    - Test cache hit/miss scenarios
    - Test error handling
    - _Requirements: 5.1_

- [x] 3. Implement E-Invoice Service
  - [x] 3.1 Create EInvoiceService (app/src/services/invoice/EInvoiceService.js)
    - Implement generateEInvoice() method calling backend POST /einvoice/generate
    - Implement cancelEInvoice() method calling backend DELETE /einvoice/:voucher_id
    - Implement getEInvoiceStatus() method calling backend GET /einvoice/:voucher_id
    - Implement retryEInvoiceGeneration() method calling backend POST /einvoice/:id/retry
    - Add error handling with retry logic
    - Add new eInvoiceAPI endpoints to app/src/lib/api.js
    - _Requirements: 2.1, 2.4, 2.5_
  
  - [x] 3.2 Write property test for e-invoice generation
    - **Property 3: Automatic E-Invoice Generation Trigger**
    - **Validates: Requirements 2.1**
  
  - [x] 3.3 Write property test for retry functionality
    - **Property 6: Retry Functionality**
    - **Validates: Requirements 2.4**
  
  - [x] 3.4 Write unit tests for EInvoiceService
    - Test successful generation
    - Test cancellation workflow
    - Test network error handling
    - Test validation error handling
    - _Requirements: 2.1, 2.4, 2.5, 9.1_

- [ ] 4. Implement E-Way Bill Service
  - [x] 4.1 Create EWayBillService (app/src/services/invoice/EWayBillService.js)
    - Implement generateEWayBill() method calling backend POST /ewaybill/generate
    - Implement cancelEWayBill() method calling backend DELETE /ewaybill/:voucher_id
    - Implement updateVehicleDetails() method calling backend PUT /ewaybill/:id/vehicle
    - Implement getEWayBillStatus() method calling backend GET /ewaybill/:voucher_id
    - Implement retryEWayBillGeneration() method
    - Add threshold checking logic (check settings.eWayBillThreshold)
    - Add new eWayBillAPI endpoints to app/src/lib/api.js
    - _Requirements: 3.1, 3.4, 3.5_
  
  - [x] 4.2 Write property test for e-way bill threshold checking
    - **Property 9: Automatic E-Way Bill Generation Trigger**
    - **Validates: Requirements 3.1**
  
  - [x] 4.3 Write property test for vehicle update workflow
    - **Property 11: Vehicle Details Update Workflow**
    - **Validates: Requirements 3.4**
  
  - [x] 4.4 Write unit tests for EWayBillService
    - Test successful generation
    - Test threshold boundary conditions
    - Test vehicle update
    - Test cancellation workflow
    - _Requirements: 3.1, 3.4, 3.5, 9.2_

- [x] 5. Implement TDS Service
  - [x] 5.1 Create TDSService (app/src/services/invoice/TDSService.js)
    - Implement calculateTDS() method calling backend POST /tds/calculate
    - Implement getTDSDetails() method calling backend GET /tds (with voucher_id filter)
    - Implement getTDSRates() method to fetch rate table from backend
    - Add validation for PAN number format (10 alphanumeric characters)
    - Add new tdsAPI endpoints to app/src/lib/api.js (extend existing taxAPI.tds)
    - _Requirements: 4.1_
  
  - [x] 5.2 Write property test for TDS calculation correctness
    - **Property 12: TDS Calculation Correctness**
    - **Validates: Requirements 4.1**
  
  - [x] 5.3 Write property test for net amount invariant
    - **Property 16: Net Amount Calculation Invariant**
    - **Validates: Requirements 4.5**
  
  - [x] 5.4 Write unit tests for TDSService
    - Test calculation for different sections
    - Test rate lookup
    - Test PAN validation
    - Test edge cases (zero amount, invalid section)
    - _Requirements: 4.1, 9.3_

- [x] 6. Checkpoint - Ensure all service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Notification Service
  - [x] 7.1 Create NotificationService (app/src/services/invoice/NotificationService.js)
    - Implement sendNotification() method using existing CustomNotification component
    - Implement scheduleNotification() for delayed notifications using expo-notifications
    - Implement getNotificationHistory() calling backend GET /notifications
    - Add notification payload formatting for e-invoice, e-way bill, and TDS events
    - Integrate with existing NotificationContext (app/src/contexts/NotificationContext.jsx)
    - Use existing notificationAPI from app/src/lib/api.js
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [x] 7.2 Write property test for notification sending
    - **Property 17: Comprehensive Notification Sending**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**
  
  - [x] 7.3 Write property test for notification persistence
    - **Property 18: Notification Persistence**
    - **Validates: Requirements 6.7**
  
  - [x] 7.4 Write unit tests for NotificationService
    - Test notification formatting
    - Test platform-specific notification APIs
    - Test notification history retrieval
    - _Requirements: 6.1, 6.7_

- [x] 8. Implement Error Handling Infrastructure
  - [x] 8.1 Create APIErrorHandler (app/src/utils/invoice/APIErrorHandler.js)
    - Implement error categorization (network, server, validation, business logic)
    - Implement error response formatting
    - Add retry logic with exponential backoff
    - Integrate with existing apiClient error interceptors in app/src/lib/apiClient.js
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 8.2 Create OfflineQueueManager (app/src/utils/invoice/OfflineQueueManager.js)
    - Implement operation queueing for offline scenarios
    - Implement queue processing when connectivity restored
    - Add queue persistence to AsyncStorage using @react-native-async-storage/async-storage
    - _Requirements: 9.6_
  
  - [x] 8.3 Write property test for network error handling
    - **Property 21: Network Error Handling**
    - **Validates: Requirements 9.1, 9.2, 9.3**
  
  - [x] 8.4 Write property test for offline queueing
    - **Property 24: Offline Operation Queueing**
    - **Validates: Requirements 9.6**
  
  - [x] 8.5 Write unit tests for error handling
    - Test each error category
    - Test retry logic
    - Test offline queue operations
    - _Requirements: 9.1, 9.4, 9.5, 9.6_

- [x] 9. Create reusable UI components
  - [x] 9.1 Create StatusBadge component (app/src/components/invoice/StatusBadge.jsx)
    - Implement status badge with color coding (pending=#f59e0b, generated=#10b981, cancelled=#6b7280, failed=#ef4444)
    - Add consistent styling matching existing app theme (use StyleSheet from react-native)
    - Use Ionicons for status icons
    - _Requirements: 7.3, 7.4_
  
  - [x] 9.2 Create DocumentActionButtons component (app/src/components/invoice/DocumentActionButtons.jsx)
    - Implement generate, cancel, and retry buttons using TouchableOpacity
    - Add loading state handling with ActivityIndicator
    - Add button disabling during operations
    - Match existing button styles from SalesInvoiceScreen and PurchaseInvoiceScreen
    - _Requirements: 7.5, 12.4_
  
  - [x] 9.3 Write property test for button disabling
    - **Property 28: Button Disabling During API Calls**
    - **Validates: Requirements 12.4**
  
  - [x] 9.4 Write unit tests for UI components
    - Test StatusBadge rendering for each status
    - Test DocumentActionButtons click handlers
    - Test loading state display
    - _Requirements: 7.3, 7.5, 12.4_

- [x] 10. Create E-Invoice Status Card component
  - [x] 10.1 Implement EInvoiceStatusCard component (app/src/components/invoice/EInvoiceStatusCard.jsx)
    - Display IRN, acknowledgment number, acknowledgment date in View with Text components
    - Display QR code using react-native-qrcode-svg (add to package.json if not present)
    - Integrate StatusBadge for status display
    - Integrate DocumentActionButtons for actions
    - Add loading indicators using ActivityIndicator
    - Use Modal for cancel reason input (similar to existing modals in voucher screens)
    - Match card styling from existing screens (borderRadius, padding, shadows)
    - _Requirements: 2.2, 2.3, 2.6, 7.6_
  
  - [x] 10.2 Write property test for e-invoice success display
    - **Property 4: E-Invoice Success Display**
    - **Validates: Requirements 2.2**
  
  - [x] 10.3 Write property test for status display
    - **Property 8: Status Display Correctness**
    - **Validates: Requirements 2.6**
  
  - [x] 10.4 Write unit tests for EInvoiceStatusCard
    - Test rendering with generated status
    - Test rendering with failed status
    - Test retry button functionality
    - Test cancel button functionality
    - _Requirements: 2.2, 2.3, 2.6_

- [x] 11. Create E-Way Bill Status Card component
  - [x] 11.1 Implement EWayBillStatusCard component (app/src/components/invoice/EWayBillStatusCard.jsx)
    - Display e-way bill number and validity date in View with Text components
    - Integrate StatusBadge for status display
    - Integrate DocumentActionButtons for actions
    - Add vehicle details update form modal using Modal component with TextInput
    - Add loading indicators using ActivityIndicator
    - Match card styling from existing screens
    - _Requirements: 3.2, 3.3, 3.4, 3.6_
  
  - [x] 11.2 Write property test for e-way bill success display
    - **Property 10: E-Way Bill Success Display**
    - **Validates: Requirements 3.2**
  
  - [x] 11.3 Write unit tests for EWayBillStatusCard
    - Test rendering with generated status
    - Test vehicle update modal
    - Test cancel functionality
    - _Requirements: 3.2, 3.4, 3.6_

- [x] 12. Create TDS Calculation Card component
  - [x] 12.1 Implement TDSCalculationCard component (app/src/components/invoice/TDSCalculationCard.jsx)
    - Display TDS section selector using existing CustomDropdown component
    - Display TDS rate (read-only) in Text component
    - Display calculated TDS amount with formatCurrency utility
    - Display deduction details in formatted View
    - Add auto-calculation on amount/section change using useEffect
    - Match card styling from existing screens
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [x] 12.2 Write property test for TDS display completeness
    - **Property 13: TDS Display Completeness**
    - **Validates: Requirements 4.2**
  
  - [x] 12.3 Write property test for TDS recalculation on amount change
    - **Property 14: TDS Recalculation on Amount Change**
    - **Validates: Requirements 4.3**
  
  - [x] 12.4 Write property test for TDS recalculation on section change
    - **Property 15: TDS Recalculation on Section Change**
    - **Validates: Requirements 4.4**
  
  - [x] 12.5 Write unit tests for TDSCalculationCard
    - Test section selector
    - Test amount display
    - Test recalculation triggers
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 13. Checkpoint - Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Create VoucherContext for voucher state management
  - [x] 14.1 Implement VoucherContext (app/src/contexts/VoucherContext.jsx)
    - Add voucher state (voucher, eInvoiceStatus, eWayBillStatus, tdsDetails)
    - Implement updateVoucher() action
    - Implement refreshVoucherData() action
    - Add loading and error states
    - Follow existing context pattern from AuthContext and NotificationContext
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 14.2 Write property test for data fetching on load
    - **Property 2: Voucher Data Fetching on Load**
    - **Validates: Requirements 1.5, 10.1**
  
  - [x] 14.3 Write property test for reactive UI updates
    - **Property 25: Reactive UI Updates**
    - **Validates: Requirements 10.2, 10.3, 10.4**
  
  - [x] 14.4 Write unit tests for VoucherContext
    - Test state updates
    - Test data fetching
    - Test error handling
    - _Requirements: 10.1, 10.2_

- [x] 15. Integrate features into Sales Invoice screen (EXISTING SCREEN - app/src/screens/client/vouchers/SalesInvoiceScreen.jsx)
  - [x] 15.1 Update SalesInvoiceScreen component
    - Wrap with SettingsContext and VoucherContext
    - Add conditional rendering based on settings (e-invoice, e-way bill, TDS)
    - Integrate EInvoiceStatusCard component after invoice summary section
    - Integrate EWayBillStatusCard component after e-invoice section
    - Integrate TDSCalculationCard component in invoice summary
    - Add auto-generation triggers in handleSave() method after successful voucher creation
    - Add loading indicators with operation-specific messages
    - Use existing CustomNotification for status updates
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 12.1_
  
  - [x] 15.2 Write property test for settings-based UI visibility
    - **Property 1: Settings-Based UI Visibility**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  
  - [x] 15.3 Write property test for loading indicators
    - **Property 27: Operation-Specific Loading Messages**
    - **Validates: Requirements 12.1, 12.2, 12.3**
  
  - [x] 15.4 Write integration tests for Sales Invoice flow
    - Test complete e-invoice generation flow
    - Test complete e-way bill generation flow
    - Test complete TDS calculation flow
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 16. Integrate features into Purchase Invoice screen (EXISTING SCREEN - app/src/screens/client/vouchers/PurchaseInvoiceScreen.jsx)
  - [ ] 16.1 Update PurchaseInvoiceScreen component
    - Apply same integration pattern as Sales Invoice
    - Add conditional rendering based on settings
    - Integrate all three feature cards after invoice summary
    - Add auto-generation triggers in handleSave() method
    - Use existing loading state and CustomNotification
    - _Requirements: 1.1, 2.1, 3.1, 4.1_
  
  - [ ] 16.2 Write integration tests for Purchase Invoice flow
    - Test e-invoice generation
    - Test e-way bill generation
    - Test TDS calculation
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 17. Integrate features into Credit Note screen (EXISTING LIST SCREEN - app/src/screens/client/vouchers/CreditNoteScreen.jsx)
  - [ ] 17.1 Create CreditNoteFormScreen component (NEW SCREEN)
    - Create new form screen similar to SalesInvoiceScreen structure
    - Add conditional rendering based on settings
    - Integrate EInvoiceStatusCard component
    - Add navigation from CreditNoteScreen list to form
    - _Requirements: 1.1, 2.1_
  
  - [ ] 17.2 Write integration tests for Credit Note flow
    - Test e-invoice generation
    - _Requirements: 1.1, 2.1_

- [ ] 18. Integrate features into Debit Note screen (EXISTING LIST SCREEN - app/src/screens/client/vouchers/DebitNoteScreen.jsx)
  - [ ] 18.1 Create DebitNoteFormScreen component (NEW SCREEN)
    - Create new form screen similar to PurchaseInvoiceScreen structure
    - Add conditional rendering based on settings
    - Integrate EInvoiceStatusCard component
    - Add navigation from DebitNoteScreen list to form
    - _Requirements: 1.1, 2.1_
  
  - [ ] 18.2 Write integration tests for Debit Note flow
    - Test e-invoice generation
    - _Requirements: 1.1, 2.1_

- [ ] 19. Integrate features into Payment screen (EXISTING LIST SCREEN - app/src/screens/client/vouchers/PaymentScreen.jsx)
  - [ ] 19.1 Create PaymentFormScreen component (NEW SCREEN)
    - Create new form screen for payment voucher entry
    - Add conditional rendering for TDS (primary feature for payments)
    - Integrate TDSCalculationCard component
    - Add navigation from PaymentScreen list to form
    - _Requirements: 1.1, 4.1_
  
  - [ ] 19.2 Write integration tests for Payment flow
    - Test TDS calculation
    - _Requirements: 1.1, 4.1_

- [ ] 20. Integrate features into Receipt screen (EXISTING LIST SCREEN - app/src/screens/client/vouchers/ReceiptScreen.jsx)
  - [ ] 20.1 Create ReceiptFormScreen component (NEW SCREEN)
    - Create new form screen for receipt voucher entry
    - Add conditional rendering for TDS
    - Integrate TDSCalculationCard component
    - Add navigation from ReceiptScreen list to form
    - _Requirements: 1.1, 4.1_
  
  - [ ] 20.2 Write integration tests for Receipt flow
    - Test TDS calculation
    - _Requirements: 1.1, 4.1_

- [ ] 21. Integrate features into Journal screen (EXISTING LIST SCREEN - app/src/screens/client/vouchers/JournalScreen.jsx)
  - [ ] 21.1 Create JournalFormScreen component (NEW SCREEN)
    - Create new form screen for journal entry
    - Add conditional rendering based on settings
    - Integrate relevant feature cards if applicable
    - Add navigation from JournalScreen list to form
    - _Requirements: 1.1_
  
  - [ ] 21.2 Write integration tests for Journal flow
    - Test feature visibility based on settings
    - _Requirements: 1.1_

- [ ] 22. Integrate features into Contra screen (EXISTING LIST SCREEN - app/src/screens/client/vouchers/ContraScreen.jsx)
  - [ ] 22.1 Create ContraFormScreen component (NEW SCREEN)
    - Create new form screen for contra entry
    - Add conditional rendering based on settings
    - Integrate relevant feature cards if applicable
    - Add navigation from ContraScreen list to form
    - _Requirements: 1.1_
  
  - [ ] 22.2 Write integration tests for Contra flow
    - Test feature visibility based on settings
    - _Requirements: 1.1_

- [ ] 23. Checkpoint - Ensure all voucher screen integrations work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Implement notification integration
  - [ ] 24.1 Add notification triggers to all services
    - Add notification calls in EInvoiceService (success/failure)
    - Add notification calls in EWayBillService (success/failure)
    - Add notification calls in TDSService (calculation complete)
    - Add notification calls on status changes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ] 24.2 Write property test for success notifications
    - **Property 29: Success Notification Display**
    - **Validates: Requirements 12.5**
  
  - [ ] 24.3 Write property test for error notifications
    - **Property 30: Error Notification Display**
    - **Validates: Requirements 12.6**
  
  - [ ] 24.4 Write integration tests for notification flow
    - Test notifications sent on e-invoice generation
    - Test notifications sent on e-way bill generation
    - Test notifications sent on TDS calculation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 25. Implement data synchronization
  - [ ] 25.1 Add data refresh logic to VoucherContext
    - Implement automatic refresh on screen focus
    - Implement manual refresh on pull-to-refresh gesture
    - Add optimistic UI updates
    - _Requirements: 10.5_
  
  - [ ] 25.2 Write property test for data freshness on navigation
    - **Property 26: Data Freshness on Navigation**
    - **Validates: Requirements 10.5**
  
  - [ ] 25.3 Write unit tests for data synchronization
    - Test refresh on focus
    - Test pull-to-refresh
    - Test optimistic updates
    - _Requirements: 10.5_

- [ ] 26. Add Error Boundary components (OPTIONAL - React Native has limited Error Boundary support)
  - [ ] 26.1 Create VoucherScreenErrorBoundary component (app/src/components/invoice/VoucherScreenErrorBoundary.jsx)
    - Implement error catching using React Error Boundary
    - Add error UI with reload option
    - Log errors to console and backend
    - Note: React Native Error Boundaries have limitations compared to web
    - _Requirements: 9.1_
  
  - [ ] 26.2 Wrap voucher form screens with ErrorBoundary
    - Add ErrorBoundary to SalesInvoiceScreen and PurchaseInvoiceScreen
    - Add ErrorBoundary to new form screens (CreditNoteForm, DebitNoteForm, etc.)
    - Test error recovery
    - _Requirements: 9.1_

- [ ] 27. Implement component behavior consistency tests
  - [ ] 27.1 Write property test for component consistency
    - **Property 20: Component Behavior Consistency**
    - **Validates: Requirements 8.5**
  
  - [ ] 27.2 Write cross-screen component tests
    - Test EInvoiceStatusCard on multiple screens
    - Test EWayBillStatusCard on multiple screens
    - Test TDSCalculationCard on multiple screens
    - _Requirements: 8.5_

- [ ] 28. Final checkpoint - End-to-end testing
  - [ ] 28.1 Run all property-based tests (minimum 100 iterations each)
    - Verify all 30 properties pass
    - Check test execution time
    - _Requirements: All_
  
  - [ ] 28.2 Run all unit tests
    - Verify 80%+ code coverage
    - Fix any failing tests
    - _Requirements: All_
  
  - [ ] 28.3 Run all integration tests
    - Test all voucher screens
    - Test all critical flows
    - _Requirements: All_
  
  - [ ] 28.4 Manual testing on iOS and Android
    - Test on iOS device/simulator
    - Test on Android device/emulator
    - Verify cross-platform consistency
    - _Requirements: 11.1, 11.2_

- [ ] 29. Documentation and cleanup
  - [ ] 29.1 Add inline code documentation
    - Document all public interfaces
    - Add JSDoc comments to services
    - Add prop documentation to components
    - _Requirements: All_
  
  - [ ] 29.2 Create developer guide
    - Document component usage
    - Document service APIs
    - Add integration examples
    - _Requirements: All_
  
  - [ ] 29.3 Update README with new features
    - Document e-invoice feature
    - Document e-way bill feature
    - Document TDS feature
    - _Requirements: All_

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows across all voucher screens
- The implementation follows a bottom-up approach: services → components → integration
- All features are conditionally rendered based on company settings
- Error handling and offline support are built into the foundation
- Cross-platform compatibility is ensured through React Native and Expo APIs

## Key Implementation Notes

### Existing Screens Structure
- **Sales Invoice & Purchase Invoice**: Full form screens with item entry - READY for integration
- **Credit Note, Debit Note, Payment, Receipt, Journal, Contra**: Currently LIST-ONLY screens - NEED new form screens
- **Settings**: Located at app/src/screens/client/profile/SettingsScreen.jsx - uses tenant profile settings

### Existing Components to Reuse
- **CustomNotification**: Already implemented with success/error/warning/info types
- **ModernDatePicker**: Date picker component
- **CustomDropdown**: Dropdown selector component
- **TopBar**: Navigation bar component
- **Existing Contexts**: AuthContext, NotificationContext, DrawerContext

### API Structure
- All APIs defined in app/src/lib/api.js
- Uses apiClient from app/src/lib/apiClient.js
- Backend endpoints already exist for e-invoice, e-way bill, and TDS
- Need to add new API endpoint groups: eInvoiceAPI, eWayBillAPI (extend existing taxAPI.tds)

### Technology Stack
- React Native with Expo
- JavaScript (not TypeScript)
- AsyncStorage for local caching
- Axios for HTTP requests
- Ionicons for icons
- expo-notifications for push notifications
- react-native-qrcode-svg for QR code display (may need to add to package.json)
