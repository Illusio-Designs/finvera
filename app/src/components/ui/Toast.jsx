import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Platform,
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Toast({ 
  visible, 
  type = 'success', // 'success', 'error', 'warning', 'info'
  message, 
  duration = 3000,
  onHide,
  position = 'bottom' // 'top', 'bottom', 'center'
}) {
  const [slideAnim] = useState(new Animated.Value(position === 'bottom' ? 100 : -100));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Slide in animation
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
      ]).start();

      // Auto hide after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          hideToast();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: position === 'bottom' ? 100 : -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10b981',
          iconName: 'checkmark-circle',
          iconColor: '#ffffff',
          shadowColor: '#10b981',
        };
      case 'error':
        return {
          backgroundColor: '#ef4444',
          iconName: 'close-circle',
          iconColor: '#ffffff',
          shadowColor: '#ef4444',
        };
      case 'warning':
        return {
          backgroundColor: '#f59e0b',
          iconName: 'warning',
          iconColor: '#ffffff',
          shadowColor: '#f59e0b',
        };
      case 'info':
        return {
          backgroundColor: '#3e60ab',
          iconName: 'information-circle',
          iconColor: '#ffffff',
          shadowColor: '#3e60ab',
        };
      default:
        return {
          backgroundColor: '#3e60ab',
          iconName: 'information-circle',
          iconColor: '#ffffff',
          shadowColor: '#3e60ab',
        };
    }
  };

  const toastStyle = getToastStyle();

  // Calculate position based on placement
  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return {
          top: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
        };
      case 'center':
        return {
          top: '50%',
          marginTop: -25,
        };
      case 'bottom':
      default:
        return {
          bottom: Platform.OS === 'ios' ? 100 : 120,
        };
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle(),
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: toastStyle.backgroundColor,
          shadowColor: toastStyle.shadowColor,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={toastStyle.iconName}
          size={20}
          color={toastStyle.iconColor}
          style={styles.icon}
        />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
    fontFamily: 'Agency',
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
});