# Finvera Mobile App Permissions

This document outlines all the permissions used by the Finvera mobile app and their purposes.

## Overview

Finvera is a comprehensive GST & Accounting mobile app that requires various permissions to provide full functionality for business management, document handling, and compliance features.

## Android Permissions

### Essential Permissions

- **INTERNET** - Network access for API calls and data synchronization
- **ACCESS_NETWORK_STATE** - Check network connectivity status
- **ACCESS_WIFI_STATE** - Monitor WiFi connection status
- **VIBRATE** - Provide haptic feedback for user interactions

### Camera & Media Permissions

- **CAMERA** - Capture profile pictures and document photos
- **READ_EXTERNAL_STORAGE** - Access existing photos and documents
- **WRITE_EXTERNAL_STORAGE** - Save documents and receipts
- **READ_MEDIA_IMAGES** - Access image files (Android 13+)
- **READ_MEDIA_VIDEO** - Access video files (Android 13+)
- **MANAGE_EXTERNAL_STORAGE** - Full file system access for document management

### Audio Permissions

- **RECORD_AUDIO** - Record voice notes for business transactions

### Location Permissions

- **ACCESS_FINE_LOCATION** - Precise location for business services
- **ACCESS_COARSE_LOCATION** - Approximate location for GST compliance
- **ACCESS_BACKGROUND_LOCATION** - Background location for automated services

### Contact & Calendar Permissions

- **READ_CONTACTS** - Access customer and vendor contact information
- **WRITE_CONTACTS** - Add new business contacts
- **READ_CALENDAR** - View existing calendar events
- **WRITE_CALENDAR** - Schedule GST filing reminders and meetings

### Security & Authentication Permissions

- **USE_FINGERPRINT** - Fingerprint authentication (older Android versions)
- **USE_BIOMETRIC** - Biometric authentication (newer Android versions)

### Communication Permissions

- **READ_PHONE_STATE** - Access device information for security
- **CALL_PHONE** - Direct calling to customers/vendors
- **READ_SMS** - Read OTP messages for verification
- **SEND_SMS** - Send SMS notifications
- **RECEIVE_SMS** - Receive SMS verification codes
- **READ_PHONE_NUMBERS** - Access phone number for account verification

### Notification & Background Permissions

- **POST_NOTIFICATIONS** - Show push notifications (Android 13+)
- **SCHEDULE_EXACT_ALARM** - Schedule precise GST filing reminders
- **USE_EXACT_ALARM** - Use exact alarm scheduling
- **FOREGROUND_SERVICE** - Run background services for sync
- **WAKE_LOCK** - Keep device awake during important operations
- **RECEIVE_BOOT_COMPLETED** - Start services after device reboot

### System Permissions

- **SYSTEM_ALERT_WINDOW** - Show overlay windows for important alerts
- **REQUEST_IGNORE_BATTERY_OPTIMIZATIONS** - Prevent battery optimization interference
- **CHANGE_WIFI_STATE** - Manage WiFi connections for business devices

### Bluetooth Permissions

- **BLUETOOTH** - Connect to business devices (printers, scanners)
- **BLUETOOTH_ADMIN** - Manage Bluetooth connections
- **BLUETOOTH_CONNECT** - Connect to Bluetooth devices (Android 12+)
- **BLUETOOTH_SCAN** - Scan for Bluetooth devices (Android 12+)

## iOS Permissions (Info.plist)

### Camera & Photo Library

- **NSCameraUsageDescription** - Camera access for profile pictures and documents
- **NSPhotoLibraryUsageDescription** - Photo library access for image selection

### Location Services

- **NSLocationWhenInUseUsageDescription** - Location access for business services
- **NSLocationAlwaysAndWhenInUseUsageDescription** - Background location access

### Contacts & Calendar

- **NSContactsUsageDescription** - Access contacts for customer/vendor management
- **NSCalendarsUsageDescription** - Calendar access for scheduling
- **NSRemindersUsageDescription** - Reminders for GST filing dates

### Audio & Media

- **NSMicrophoneUsageDescription** - Microphone access for voice notes
- **NSAppleMusicUsageDescription** - Media library access for attachments

### Security & Privacy

- **NSFaceIDUsageDescription** - Face ID authentication for secure access
- **NSUserTrackingUsageDescription** - App tracking for analytics and personalization

### Network & Bluetooth

- **NSLocalNetworkUsageDescription** - Local network access for business devices
- **NSBluetoothAlwaysUsageDescription** - Bluetooth access for device connectivity
- **NSBluetoothPeripheralUsageDescription** - Bluetooth peripheral connections

### Motion & Sensors

- **NSMotionUsageDescription** - Motion sensors for enhanced security

## Permission Usage by Feature

### Profile Management
- Camera (profile pictures)
- Photo Library (image selection)

### Document Management
- Camera (document scanning)
- Photo Library (document selection)
- File System (document storage)

### Business Contacts
- Contacts (customer/vendor management)
- Phone (direct calling)
- SMS (communication)

### GST Compliance
- Location (location-based compliance)
- Calendar (filing reminders)
- Notifications (deadline alerts)

### Security Features
- Biometric Authentication (Face ID/Fingerprint)
- Device Information (security verification)

### Business Operations
- Bluetooth (printer/scanner connectivity)
- Audio (voice notes)
- Background Services (data synchronization)

## Permission Management

### Runtime Permissions
The app requests permissions at runtime when features are accessed, providing clear explanations for each permission request.

### Permission Rationale
Before requesting permissions, the app shows rationale dialogs explaining why each permission is needed and how it benefits the user.

### Settings Integration
Users can manage permissions through:
1. In-app permissions screen
2. Device system settings
3. App-specific settings page

### Graceful Degradation
The app continues to function even if optional permissions are denied, with reduced functionality in affected areas.

## Privacy Considerations

### Data Minimization
- Only essential permissions are requested
- Permissions are requested when needed, not at app startup
- Clear explanations provided for each permission

### User Control
- Users can revoke permissions at any time
- App respects permission denials
- Alternative workflows provided when possible

### Security
- Sensitive operations require biometric authentication
- Data is encrypted in transit and at rest
- Minimal data collection and retention

## Installation Notes

### For Developers

1. Install required Expo packages:
```bash
npx expo install expo-camera expo-image-picker expo-location expo-contacts expo-calendar expo-notifications expo-local-authentication expo-media-library expo-av expo-barcode-scanner expo-document-picker expo-file-system expo-sharing expo-print
```

2. Update app.json with permission configurations

3. Test permissions on both Android and iOS devices

4. Verify permission rationale dialogs are working correctly

### For Users

1. Grant essential permissions during onboarding
2. Additional permissions will be requested as features are used
3. Manage permissions through Settings > Apps > Finvera > Permissions
4. Contact support if experiencing permission-related issues

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check device settings and re-enable required permissions
2. **Camera Not Working**: Ensure camera permission is granted and camera is not in use by another app
3. **Location Services**: Verify location services are enabled system-wide
4. **Notifications Not Received**: Check notification permissions and Do Not Disturb settings

### Support

For permission-related issues, contact support with:
- Device model and OS version
- Specific permission causing issues
- Steps to reproduce the problem
- Screenshots of error messages

## Compliance

This app complies with:
- Google Play Store policies
- Apple App Store guidelines
- GDPR privacy requirements
- Indian data protection regulations

Last updated: January 2025