import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext';
import { useNotification } from '../../../contexts/NotificationContext';
import usePermissions, { 
  useCameraPermissions, 
  useLocationPermissions, 
  useNotificationPermissions 
} from '../../../hooks/usePermissions';
import { PermissionTypes, openAppSettings } from '../../../utils/permissions';

export default function PermissionsScreen({ navigation }) {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const { permissions, loading, checkAllPermissions, requestPermission } = usePermissions();
  const { requestCameraAccess, requestMediaLibraryAccess } = useCameraPermissions();
  const { requestLocationAccess } = useLocationPermissions();
  const { requestNotificationAccess } = useNotificationPermissions();
  const [refreshing, setRefreshing] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkAllPermissions();
    setRefreshing(false);
  };

  const handlePermissionRequest = async (permissionType) => {
    let granted = false;
    
    switch (permissionType) {
      case PermissionTypes.CAMERA:
        granted = await requestCameraAccess();
        break;
      case PermissionTypes.MEDIA_LIBRARY:
        granted = await requestMediaLibraryAccess();
        break;
      case PermissionTypes.LOCATION:
        granted = await requestLocationAccess();
        break;
      case PermissionTypes.NOTIFICATIONS:
        granted = await requestNotificationAccess();
        break;
      default:
        granted = await requestPermission(permissionType);
    }

    if (granted) {
      showNotification({
        type: 'success',
        title: 'Permission Granted',
        message: 'Permission has been granted successfully'
      });
    } else {
      showNotification({
        type: 'error',
        title: 'Permission Denied',
        message: 'Permission was denied. You can enable it in Settings.'
      });
    }

    // Refresh permissions after request
    await checkAllPermissions();
  };

  const getPermissionIcon = (permissionType) => {
    const icons = {
      [PermissionTypes.CAMERA]: 'camera-outline',
      [PermissionTypes.MEDIA_LIBRARY]: 'image-outline',
      [PermissionTypes.LOCATION]: 'location-outline',
      [PermissionTypes.CONTACTS]: 'people-outline',
      [PermissionTypes.CALENDAR]: 'calendar-outline',
      [PermissionTypes.NOTIFICATIONS]: 'notifications-outline',
      [PermissionTypes.AUDIO]: 'mic-outline',
      [PermissionTypes.BACKGROUND_LOCATION]: 'navigate-outline',
    };
    return icons[permissionType] || 'help-outline';
  };

  const getPermissionTitle = (permissionType) => {
    const titles = {
      [PermissionTypes.CAMERA]: 'Camera',
      [PermissionTypes.MEDIA_LIBRARY]: 'Photo Library',
      [PermissionTypes.LOCATION]: 'Location',
      [PermissionTypes.CONTACTS]: 'Contacts',
      [PermissionTypes.CALENDAR]: 'Calendar',
      [PermissionTypes.NOTIFICATIONS]: 'Notifications',
      [PermissionTypes.AUDIO]: 'Microphone',
      [PermissionTypes.BACKGROUND_LOCATION]: 'Background Location',
    };
    return titles[permissionType] || permissionType;
  };

  const getPermissionDescription = (permissionType) => {
    const descriptions = {
      [PermissionTypes.CAMERA]: 'Take photos for profile pictures and documents',
      [PermissionTypes.MEDIA_LIBRARY]: 'Select images from your photo library',
      [PermissionTypes.LOCATION]: 'Provide location-based business services',
      [PermissionTypes.CONTACTS]: 'Manage customer and vendor information',
      [PermissionTypes.CALENDAR]: 'Schedule meetings and GST filing reminders',
      [PermissionTypes.NOTIFICATIONS]: 'Receive important business updates',
      [PermissionTypes.AUDIO]: 'Record voice notes for transactions',
      [PermissionTypes.BACKGROUND_LOCATION]: 'Automated location-based services',
    };
    return descriptions[permissionType] || 'Required for app functionality';
  };

  const getStatusColor = (status) => {
    if (status === true) return '#10b981'; // green
    if (status === false) return '#ef4444'; // red
    return '#6b7280'; // gray for undefined
  };

  const getStatusText = (status) => {
    if (status === true) return 'Granted';
    if (status === false) return 'Denied';
    return 'Unknown';
  };

  const permissionItems = [
    PermissionTypes.NOTIFICATIONS,
    PermissionTypes.CAMERA,
    PermissionTypes.MEDIA_LIBRARY,
    PermissionTypes.LOCATION,
    PermissionTypes.CONTACTS,
    PermissionTypes.CALENDAR,
    PermissionTypes.AUDIO,
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="App Permissions" 
        onMenuPress={handleMenuPress}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={32} color="#3e60ab" />
          </View>
          <Text style={styles.title}>App Permissions</Text>
          <Text style={styles.subtitle}>
            Manage permissions to enhance your Fintranzact experience
          </Text>
        </View>

        {/* Permissions List */}
        <View style={styles.permissionsContainer}>
          {permissionItems.map((permissionType) => {
            const status = permissions[permissionType];
            const isGranted = status === true;
            
            return (
              <View key={permissionType} style={styles.permissionItem}>
                <View style={styles.permissionInfo}>
                  <View style={styles.permissionIcon}>
                    <Ionicons 
                      name={getPermissionIcon(permissionType)} 
                      size={24} 
                      color={getStatusColor(status)} 
                    />
                  </View>
                  <View style={styles.permissionDetails}>
                    <Text style={styles.permissionTitle}>
                      {getPermissionTitle(permissionType)}
                    </Text>
                    <Text style={styles.permissionDescription}>
                      {getPermissionDescription(permissionType)}
                    </Text>
                    <View style={styles.statusContainer}>
                      <View 
                        style={[
                          styles.statusDot, 
                          { backgroundColor: getStatusColor(status) }
                        ]} 
                      />
                      <Text 
                        style={[
                          styles.statusText, 
                          { color: getStatusColor(status) }
                        ]}
                      >
                        {getStatusText(status)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.permissionActions}>
                  {!isGranted ? (
                    <TouchableOpacity
                      style={styles.requestButton}
                      onPress={() => handlePermissionRequest(permissionType)}
                      disabled={loading}
                    >
                      <Text style={styles.requestButtonText}>Request</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.settingsButton}
                      onPress={openAppSettings}
                    >
                      <Ionicons name="settings-outline" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#3e60ab" />
            <Text style={styles.infoTitle}>About Permissions</Text>
          </View>
          <Text style={styles.infoText}>
            Fintranzact requests permissions only when needed to provide you with the best experience. 
            You can change these permissions anytime in your device settings.
          </Text>
          
          <TouchableOpacity style={styles.settingsLinkButton} onPress={openAppSettings}>
            <Ionicons name="settings-outline" size={20} color="#3e60ab" />
            <Text style={styles.settingsLinkText}>Open App Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#3e60ab" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...FONT_STYLES.h2,
    color: '#111827',
    marginBottom: 8
  },
  subtitle: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
    textAlign: 'center'
  },
  permissionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  permissionDetails: {
    flex: 1,
  },
  permissionTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4
  },
  permissionDescription: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    marginBottom: 8
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    ...FONT_STYLES.caption,
  },
  permissionActions: {
    marginLeft: 12,
  },
  requestButton: {
    backgroundColor: '#3e60ab',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  requestButtonText: {
    ...FONT_STYLES.label,
    color: 'white'
  },
  settingsButton: {
    padding: 8,
  },
  infoContainer: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    ...FONT_STYLES.h5,
    color: '#3e60ab',
    marginLeft: 8
  },
  infoText: {
    ...FONT_STYLES.label,
    color: '#6366f1',
    lineHeight: 20,
    marginBottom: 16
  },
  settingsLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
  },
  settingsLinkText: {
    ...FONT_STYLES.label,
    color: '#3e60ab',
    flex: 1,
    marginLeft: 8
  },
});