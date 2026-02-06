import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES, getFontStyle } from '../../utils/fonts';

const { width } = Dimensions.get('window');

export default function CustomNotification({ 
  visible, 
  type = 'success', // 'success', 'error', 'warning', 'info'
  title, 
  message, 
  duration = 4000,
  onHide,
  actionText,
  onActionPress
}) {
  const [slideAnim] = useState(new Animated.Value(-200));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Enhanced slide in animation with scale and bounce
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Progress bar animation
      if (duration > 0) {
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: false,
        }).start();

        // Auto hide after duration
        const timer = setTimeout(() => {
          hideNotification();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      hideNotification();
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  const getNotificationStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#d1fae5',
          iconName: 'checkmark-circle',
          iconColor: '#10b981',
          iconBackgroundColor: '#ffffff',
          titleColor: '#111827',
          messageColor: '#6b7280',
          progressColor: '#10b981',
        };
      case 'error':
        return {
          backgroundColor: '#fee2e2',
          iconName: 'alert-circle',
          iconColor: '#ef4444',
          iconBackgroundColor: '#ffffff',
          titleColor: '#111827',
          messageColor: '#6b7280',
          progressColor: '#ef4444',
        };
      case 'warning':
        return {
          backgroundColor: '#fef3c7',
          iconName: 'warning',
          iconColor: '#f59e0b',
          iconBackgroundColor: '#ffffff',
          titleColor: '#111827',
          messageColor: '#6b7280',
          progressColor: '#f59e0b',
        };
      case 'info':
        return {
          backgroundColor: '#dbeafe',
          iconName: 'information-circle',
          iconColor: '#3b82f6',
          iconBackgroundColor: '#ffffff',
          titleColor: '#111827',
          messageColor: '#6b7280',
          progressColor: '#3b82f6',
        };
      default:
        return {
          backgroundColor: '#dbeafe',
          iconName: 'information-circle',
          iconColor: '#3b82f6',
          iconBackgroundColor: '#ffffff',
          titleColor: '#111827',
          messageColor: '#6b7280',
          progressColor: '#3b82f6',
        };
    }
  };

  const notificationStyle = getNotificationStyle();

  // Calculate top position based on platform and status bar
  const getTopPosition = () => {
    if (Platform.OS === 'ios') {
      return StatusBar.currentHeight ? StatusBar.currentHeight + 60 : 100;
    }
    return StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 70;
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: getTopPosition(),
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={[
        styles.notificationContent,
        {
          backgroundColor: notificationStyle.backgroundColor,
        }
      ]}>
        <View style={styles.content}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: notificationStyle.iconBackgroundColor }
          ]}>
            <Ionicons
              name={notificationStyle.iconName}
              size={28}
              color={notificationStyle.iconColor}
            />
          </View>
          
          <View style={styles.textContainer}>
            {title && (
              <Text style={[styles.title, { color: notificationStyle.titleColor }]} numberOfLines={1}>
                {title}
              </Text>
            )}
            {message && (
              <Text style={[styles.message, { color: notificationStyle.messageColor }]} numberOfLines={2}>
                {message}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideNotification}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        
        {actionText && onActionPress && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: notificationStyle.iconColor }]}
              onPress={onActionPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionText, { color: notificationStyle.iconColor }]}>
                {actionText}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  notificationContent: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    ...FONT_STYLES.h4,
    marginBottom: 4,
  },
  message: {
    ...FONT_STYLES.body,
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: {
    ...FONT_STYLES.button,
  },
});