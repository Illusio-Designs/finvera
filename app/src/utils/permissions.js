import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import * as MediaLibrary from 'expo-media-library';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { Alert, Platform } from 'react-native';

/**
 * Permission utility functions for the Finvera mobile app
 */

export const PermissionTypes = {
  CAMERA: 'camera',
  MEDIA_LIBRARY: 'mediaLibrary',
  LOCATION: 'location',
  CONTACTS: 'contacts',
  CALENDAR: 'calendar',
  NOTIFICATIONS: 'notifications',
  AUDIO: 'audio',
  BACKGROUND_LOCATION: 'backgroundLocation',
};

/**
 * Request camera permission
 */
export const requestCameraPermission = async () => {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to capture profile pictures and document photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => openAppSettings() }
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

/**
 * Request media library permission
 */
export const requestMediaLibraryPermission = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please enable photo library access in your device settings to select images for your profile and documents.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => openAppSettings() }
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting media library permission:', error);
    return false;
  }
};

/**
 * Request location permission
 */
export const requestLocationPermission = async (background = false) => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Please enable location access to provide location-based business services and GST compliance features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => openAppSettings() }
        ]
      );
      return false;
    }

    if (background) {
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        Alert.alert(
          'Background Location Permission',
          'Background location access helps provide automated business services and GST compliance features.',
          [
            { text: 'Skip', style: 'cancel' },
            { text: 'Settings', onPress: () => openAppSettings() }
          ]
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Request contacts permission
 */
export const requestContactsPermission = async () => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Contacts Permission Required',
        'Please enable contacts access to help you manage customer and vendor information for your business.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => openAppSettings() }
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return false;
  }
};

/**
 * Request calendar permission
 */
export const requestCalendarPermission = async () => {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Calendar Permission Required',
        'Please enable calendar access to schedule business meetings and GST filing reminders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => openAppSettings() }
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting calendar permission:', error);
    return false;
  }
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Notification Permission Required',
        'Please enable notifications to receive important updates about your GST filings, payments, and business activities.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => openAppSettings() }
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Request audio recording permission
 */
export const requestAudioPermission = async () => {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Microphone Permission Required',
        'Please enable microphone access for voice notes and audio recordings related to business transactions.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => openAppSettings() }
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting audio permission:', error);
    return false;
  }
};

/**
 * Request media library write permission
 */
export const requestMediaLibraryWritePermission = async () => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Media Library Permission Required',
        'Please enable media library access to save business documents and receipts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => openAppSettings() }
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting media library write permission:', error);
    return false;
  }
};

/**
 * Check if a specific permission is granted
 */
export const checkPermission = async (permissionType) => {
  try {
    switch (permissionType) {
      case PermissionTypes.CAMERA:
        const cameraStatus = await Camera.getCameraPermissionsAsync();
        return cameraStatus.status === 'granted';
        
      case PermissionTypes.MEDIA_LIBRARY:
        const mediaStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
        return mediaStatus.status === 'granted';
        
      case PermissionTypes.LOCATION:
        const locationStatus = await Location.getForegroundPermissionsAsync();
        return locationStatus.status === 'granted';
        
      case PermissionTypes.CONTACTS:
        const contactsStatus = await Contacts.getPermissionsAsync();
        return contactsStatus.status === 'granted';
        
      case PermissionTypes.CALENDAR:
        const calendarStatus = await Calendar.getCalendarPermissionsAsync();
        return calendarStatus.status === 'granted';
        
      case PermissionTypes.NOTIFICATIONS:
        const notificationStatus = await Notifications.getPermissionsAsync();
        return notificationStatus.status === 'granted';
        
      case PermissionTypes.AUDIO:
        const audioStatus = await Audio.getPermissionsAsync();
        return audioStatus.status === 'granted';
        
      case PermissionTypes.BACKGROUND_LOCATION:
        const bgLocationStatus = await Location.getBackgroundPermissionsAsync();
        return bgLocationStatus.status === 'granted';
        
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking ${permissionType} permission:`, error);
    return false;
  }
};

/**
 * Request multiple permissions at once
 */
export const requestMultiplePermissions = async (permissions) => {
  const results = {};
  
  for (const permission of permissions) {
    switch (permission) {
      case PermissionTypes.CAMERA:
        results[permission] = await requestCameraPermission();
        break;
      case PermissionTypes.MEDIA_LIBRARY:
        results[permission] = await requestMediaLibraryPermission();
        break;
      case PermissionTypes.LOCATION:
        results[permission] = await requestLocationPermission();
        break;
      case PermissionTypes.CONTACTS:
        results[permission] = await requestContactsPermission();
        break;
      case PermissionTypes.CALENDAR:
        results[permission] = await requestCalendarPermission();
        break;
      case PermissionTypes.NOTIFICATIONS:
        results[permission] = await requestNotificationPermission();
        break;
      case PermissionTypes.AUDIO:
        results[permission] = await requestAudioPermission();
        break;
      case PermissionTypes.BACKGROUND_LOCATION:
        results[permission] = await requestLocationPermission(true);
        break;
      default:
        results[permission] = false;
    }
  }
  
  return results;
};

/**
 * Open app settings (platform specific)
 */
export const openAppSettings = () => {
  if (Platform.OS === 'ios') {
    // iOS - open app settings
    import('expo-linking').then(({ Linking }) => {
      Linking.openURL('app-settings:');
    });
  } else {
    // Android - open app info settings
    import('expo-intent-launcher').then(({ IntentLauncher }) => {
      IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        { data: 'package:com.finvera.mobile' }
      );
    });
  }
};

/**
 * Initialize essential permissions on app start
 */
export const initializeEssentialPermissions = async () => {
  console.log('Initializing essential permissions...');
  
  const essentialPermissions = [
    PermissionTypes.NOTIFICATIONS,
    PermissionTypes.CAMERA,
    PermissionTypes.MEDIA_LIBRARY,
  ];
  
  const results = await requestMultiplePermissions(essentialPermissions);
  
  console.log('Essential permissions results:', results);
  
  return results;
};

/**
 * Show permission rationale dialog
 */
export const showPermissionRationale = (permissionType, onAccept, onDecline) => {
  const messages = {
    [PermissionTypes.CAMERA]: {
      title: 'Camera Access Needed',
      message: 'Finvera needs camera access to capture profile pictures and document photos for GST and accounting purposes.',
    },
    [PermissionTypes.MEDIA_LIBRARY]: {
      title: 'Photo Library Access Needed',
      message: 'Finvera needs photo library access to select images for your profile and business documents.',
    },
    [PermissionTypes.LOCATION]: {
      title: 'Location Access Needed',
      message: 'Finvera uses location to provide location-based business services and GST compliance features.',
    },
    [PermissionTypes.CONTACTS]: {
      title: 'Contacts Access Needed',
      message: 'Finvera needs contacts access to help you manage customer and vendor information for your business.',
    },
    [PermissionTypes.CALENDAR]: {
      title: 'Calendar Access Needed',
      message: 'Finvera needs calendar access to schedule business meetings and GST filing reminders.',
    },
    [PermissionTypes.NOTIFICATIONS]: {
      title: 'Notification Permission Needed',
      message: 'Finvera needs notification access to send you important updates about GST filings, payments, and business activities.',
    },
    [PermissionTypes.AUDIO]: {
      title: 'Microphone Access Needed',
      message: 'Finvera needs microphone access for voice notes and audio recordings related to business transactions.',
    },
  };
  
  const { title, message } = messages[permissionType] || {
    title: 'Permission Required',
    message: 'This permission is required for the app to function properly.',
  };
  
  Alert.alert(
    title,
    message,
    [
      { text: 'Not Now', style: 'cancel', onPress: onDecline },
      { text: 'Allow', onPress: onAccept },
    ]
  );
};

export default {
  PermissionTypes,
  requestCameraPermission,
  requestMediaLibraryPermission,
  requestLocationPermission,
  requestContactsPermission,
  requestCalendarPermission,
  requestNotificationPermission,
  requestAudioPermission,
  requestMediaLibraryWritePermission,
  checkPermission,
  requestMultiplePermissions,
  openAppSettings,
  initializeEssentialPermissions,
  showPermissionRationale,
};