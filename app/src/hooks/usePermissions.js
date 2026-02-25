import { useState, useEffect, useCallback } from 'react';
import {
  PermissionTypes,
  checkPermission,
  requestCameraPermission,
  requestMediaLibraryPermission,
  requestNotificationPermission,
  requestMultiplePermissions,
  showPermissionRationale,
} from '../utils/permissions';

/**
 * Custom hook for managing app permissions
 */
export const usePermissions = () => {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  /**
   * Check current status of all permissions
   */
  const checkAllPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const permissionTypes = Object.values(PermissionTypes);
      const results = {};
      
      for (const type of permissionTypes) {
        results[type] = await checkPermission(type);
      }
      
      setPermissions(results);
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Request a specific permission
   */
  const requestPermission = useCallback(async (permissionType, showRationale = true) => {
    setLoading(true);
    
    try {
      let granted = false;
      
      const requestFunction = async () => {
        switch (permissionType) {
          case PermissionTypes.CAMERA:
            return await requestCameraPermission();
          case PermissionTypes.MEDIA_LIBRARY:
            return await requestMediaLibraryPermission();
          case PermissionTypes.NOTIFICATIONS:
            return await requestNotificationPermission();
          default:
            return false;
        }
      };

      if (showRationale) {
        // Show rationale first, then request permission
        return new Promise((resolve) => {
          showPermissionRationale(
            permissionType,
            async () => {
              granted = await requestFunction();
              setPermissions(prev => ({ ...prev, [permissionType]: granted }));
              resolve(granted);
            },
            () => {
              resolve(false);
            }
          );
        });
      } else {
        granted = await requestFunction();
        setPermissions(prev => ({ ...prev, [permissionType]: granted }));
      }
      
      return granted;
    } catch (error) {
      console.error(`Error requesting ${permissionType} permission:`, error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Request multiple permissions
   */
  const requestPermissions = useCallback(async (permissionTypes) => {
    setLoading(true);
    try {
      const results = await requestMultiplePermissions(permissionTypes);
      setPermissions(prev => ({ ...prev, ...results }));
      return results;
    } catch (error) {
      console.error('Error requesting multiple permissions:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if a specific permission is granted
   */
  const hasPermission = useCallback((permissionType) => {
    return permissions[permissionType] === true;
  }, [permissions]);

  /**
   * Check if all specified permissions are granted
   */
  const hasAllPermissions = useCallback((permissionTypes) => {
    return permissionTypes.every(type => permissions[type] === true);
  }, [permissions]);

  /**
   * Get permission status for a specific type
   */
  const getPermissionStatus = useCallback((permissionType) => {
    return permissions[permissionType];
  }, [permissions]);

  /**
   * Initialize permissions on mount
   */
  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  return {
    permissions,
    loading,
    checkAllPermissions,
    requestPermission,
    requestPermissions,
    hasPermission,
    hasAllPermissions,
    getPermissionStatus,
  };
};

/**
 * Hook for camera-related permissions
 */
export const useCameraPermissions = () => {
  const { requestPermission, hasPermission, getPermissionStatus } = usePermissions();

  const requestCameraAccess = useCallback(async (showRationale = true) => {
    return await requestPermission(PermissionTypes.CAMERA, showRationale);
  }, [requestPermission]);

  const requestMediaLibraryAccess = useCallback(async (showRationale = true) => {
    return await requestPermission(PermissionTypes.MEDIA_LIBRARY, showRationale);
  }, [requestPermission]);

  const requestBothPermissions = useCallback(async () => {
    const cameraGranted = await requestCameraAccess();
    const mediaGranted = await requestMediaLibraryAccess();
    return { camera: cameraGranted, mediaLibrary: mediaGranted };
  }, [requestCameraAccess, requestMediaLibraryAccess]);

  return {
    requestCameraAccess,
    requestMediaLibraryAccess,
    requestBothPermissions,
    hasCameraPermission: hasPermission(PermissionTypes.CAMERA),
    hasMediaLibraryPermission: hasPermission(PermissionTypes.MEDIA_LIBRARY),
    cameraStatus: getPermissionStatus(PermissionTypes.CAMERA),
    mediaLibraryStatus: getPermissionStatus(PermissionTypes.MEDIA_LIBRARY),
  };
};



/**
 * Hook for notification permissions
 */
export const useNotificationPermissions = () => {
  const { requestPermission, hasPermission, getPermissionStatus } = usePermissions();

  const requestNotificationAccess = useCallback(async (showRationale = true) => {
    return await requestPermission(PermissionTypes.NOTIFICATIONS, showRationale);
  }, [requestPermission]);

  return {
    requestNotificationAccess,
    hasNotificationPermission: hasPermission(PermissionTypes.NOTIFICATIONS),
    notificationStatus: getPermissionStatus(PermissionTypes.NOTIFICATIONS),
  };
};

export default usePermissions;