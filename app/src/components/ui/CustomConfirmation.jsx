import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Dimensions,
  Modal,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../../utils/fonts';

const { width, height } = Dimensions.get('window');

export default function CustomConfirmation({ 
  visible, 
  type = 'warning', // 'warning', 'danger', 'info'
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}) {
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getConfirmationStyle = () => {
    switch (type) {
      case 'danger':
        return {
          iconName: 'alert-circle',
          iconColor: '#ef4444',
          iconBackgroundColor: '#fee2e2',
          confirmButtonColor: '#ef4444',
          confirmButtonBackground: '#ef4444',
        };
      case 'warning':
        return {
          iconName: 'warning',
          iconColor: '#f59e0b',
          iconBackgroundColor: '#fef3c7',
          confirmButtonColor: '#f59e0b',
          confirmButtonBackground: '#f59e0b',
        };
      case 'info':
        return {
          iconName: 'information-circle',
          iconColor: '#3b82f6',
          iconBackgroundColor: '#dbeafe',
          confirmButtonColor: '#3b82f6',
          confirmButtonBackground: '#3b82f6',
        };
      default:
        return {
          iconName: 'help-circle',
          iconColor: '#6b7280',
          iconBackgroundColor: '#f3f4f6',
          confirmButtonColor: '#3e60ab',
          confirmButtonBackground: '#3e60ab',
        };
    }
  };

  const confirmationStyle = getConfirmationStyle();

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleCancel}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: opacityAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleCancel}
        />
        
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.content}>
            {/* Icon */}
            <View style={[
              styles.iconContainer,
              { backgroundColor: confirmationStyle.iconBackgroundColor }
            ]}>
              <Ionicons
                name={confirmationStyle.iconName}
                size={48}
                color={confirmationStyle.iconColor}
              />
            </View>

            {/* Title */}
            {title && (
              <Text style={styles.title}>{title}</Text>
            )}

            {/* Message */}
            {message && (
              <Text style={styles.message}>{message}</Text>
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.confirmButton,
                  { backgroundColor: confirmationStyle.confirmButtonBackground }
                ]}
                onPress={handleConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: width - 64,
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    ...FONT_STYLES.h4,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    ...FONT_STYLES.button,
    color: '#6b7280',
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
  },
});
