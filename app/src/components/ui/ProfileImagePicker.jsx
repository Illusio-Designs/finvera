import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

export default function ProfileImagePicker({ 
  imageUri, 
  onImageChange, 
  size = 80,
  showEditButton = true 
}) {
  const { uploadProfileImage } = useAuth();
  const { showNotification } = useNotification();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showNotification({
        type: 'error',
        title: 'Permission Required',
        message: 'Please grant camera roll permissions to upload profile picture'
      });
      return false;
    }
    return true;
  };

  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to pick image'
      });
    }
    setIsModalVisible(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showNotification({
        type: 'error',
        title: 'Permission Required',
        message: 'Please grant camera permissions to take profile picture'
      });
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to take photo'
      });
    }
    setIsModalVisible(false);
  };

  const handleImageUpload = async (uri) => {
    try {
      setIsUploading(true);
      const result = await uploadProfileImage(uri);
      
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Profile picture updated successfully'
        });
        if (onImageChange) {
          onImageChange(result.user?.profile_image || uri);
        }
      } else {
        showNotification(result.message || 'Failed to update profile picture', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to upload image'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    // For now, just show a notification. In a real app, you'd want a proper confirmation dialog
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: 'Image removal feature will be available soon'
    });
    setIsModalVisible(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.imageContainer, { width: size, height: size }]}
        onPress={() => showEditButton && setIsModalVisible(true)}
        disabled={isUploading}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={[styles.image, { width: size, height: size }]} />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size }]}>
            <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
              {getInitials('User')}
            </Text>
          </View>
        )}
        
        {showEditButton && (
          <View style={styles.editButton}>
            {isUploading ? (
              <Ionicons name="hourglass-outline" size={16} color="white" />
            ) : (
              <Ionicons name="camera" size={16} color="white" />
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Image Picker Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Picture</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={24} color="#3e60ab" />
                <Text style={styles.optionText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButton} onPress={pickImageFromLibrary}>
                <Ionicons name="image-outline" size={24} color="#3e60ab" />
                <Text style={styles.optionText}>Choose from Library</Text>
              </TouchableOpacity>

              {imageUri && (
                <TouchableOpacity style={styles.optionButton} onPress={removeImage}>
                  <Ionicons name="trash-outline" size={24} color="#ef4444" />
                  <Text style={[styles.optionText, { color: '#ef4444' }]}>Remove Picture</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 50,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 50,
  },
  placeholder: {
    backgroundColor: '#3e60ab',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'Agency',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3e60ab',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area padding
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    marginBottom: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
    fontFamily: 'Agency',
  },
});