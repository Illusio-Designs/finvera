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
          backgroundColor: '#ffffff',
          borderColor: '#10b981',
          iconName: 'checkmark-circle',
          iconColor: '#10b981',
          iconBackgroundColor: '#ecfdf5',
          titleColor: '#111827',
          messageColor: '#6b7280',
          progressColor: '#10b981',
        };
      case 'error':
        return {
          backgroundColor: '#ffffff',
          borderColor: '#ef4444',
          iconName: 'close-circle',
          iconColor: '#ef4444',
          iconBackgroundColor: '#fef2f2',
          titleColor: '#111827',
          messageColor: '#6b7280',
          progressColor: '#ef4444',
        };
      case 'warning':
        return {
          backgroundColor: '#ffffff',
          borderColor: '#f59e0b',
          iconName: 'warning',
          iconColor: '#f59e0b',
          iconBackgroundColor: '#fffbeb',
          titleColor: '#111827',
          messageColor: '#6b7280',
          progressColor: '#f59e0b',
        };
      case 'info':
        return {
          backgroundColor: '#ffffff',
          borderColor: '#3e60ab',
          iconName: 'information-circle',
          iconColor: '#3e60ab',
          iconBackgroundColor: '#eff6ff',
          titleColor: '#111827',
          messageColor: '#6b7280',
          progressColor: '#3e60ab',
        };
      default:
        return {
          backgroundColor: '#ffffff',
          borderColor: '#3e60ab',
          iconName: 'information-circle',
          iconColor: '#3e60ab',
          iconBackgroundColor: '#eff6ff',
          titleColor: '#111827',
          messageColor: '#6b7280',
          progressColor: '#3e60ab',
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
          borderLeftColor: notificationStyle.borderColor,
        }
      ]}>
        <View style={styles.content}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: notificationStyle.iconBackgroundColor }
          ]}>
            <Ionicons
              name={notificationStyle.iconName}
              size={24}
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

          <View style={styles.actionsContainer}>
            {actionText && onActionPress && (
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: notificationStyle.borderColor }]}
                onPress={onActionPress}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionText, { color: notificationStyle.iconColor }]}>
                  {actionText}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={hideNotification}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Enhanced progress bar */}
      {duration > 0 && (
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              { 
                backgroundColor: notificationStyle.progressColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }
            ]}
          />
        </View>
      )}
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
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
    // Enhanced backdrop for better contrast
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    // Add subtle shadow to icon container
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
    paddingTop: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Agency',
    marginBottom: 6,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Agency',
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    marginRight: 10,
    // Add subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    backgroundColor: '#ffffff',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Agency',
    letterSpacing: -0.1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    // Add subtle glow effect
    shadowColor: 'currentColor',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});