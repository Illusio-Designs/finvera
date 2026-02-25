import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as MediaLibrary from 'expo-media-library';
import { Camera } from 'expo-camera';
import { Alert, Platform } from 'react-native';

/**
 * Permission utility functions for the Fintranzact mobile app
 */

export const PermissionTypes = {
  CAMERA: 'camera',
  MEDIA_LIBRARY: 'mediaLibrary',
  NOTIFICATIONS: 'notifications',
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
        
      case PermissionTypes.NOTIFICATIONS:
        const notificationStatus = await Notifications.getPermissionsAsync();
        return notificationStatus.status === 'granted';
        
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
      case PermissionTypes.NOTIFICATIONS:
        results[permission] = await requestNotificationPermission();
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
        { data: 'package:com.fintranzact.mobile' }
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
      message: 'Fintranzact needs camera access to capture profile pictures and document photos for GST and accounting purposes.',
    },
    [PermissionTypes.MEDIA_LIBRARY]: {
      title: 'Photo Library Access Needed',
      message: 'Fintranzact needs photo library access to select images for your profile and business documents.',
    },
    [PermissionTypes.NOTIFICATIONS]: {
      title: 'Notification Permission Needed',
      message: 'Fintranzact needs notification access to send you important updates about GST filings, payments, and business activities.',
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
  requestNotificationPermission,
  requestMediaLibraryWritePermission,
  checkPermission,
  requestMultiplePermissions,
  openAppSettings,
  initializeEssentialPermissions,
  showPermissionRationale,
};