import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FONT_STYLES } from '../../utils/fonts';

export default function BottomTabBar({ currentRoute = 'Dashboard' }) {
  const navigation = useNavigation();

  const handleTabPress = (action, screen) => {
    if (action === 'navigate' && screen) {
      navigation.navigate(screen);
    } else if (action === 'home') {
      navigation.navigate('Dashboard');
    }
  };

  const tabs = [
    {
      icon: 'document-text-outline',
      activeIcon: 'document-text',
      label: 'Vouchers',
      action: 'navigate',
      screen: 'Vouchers',
      isActive: currentRoute === 'Vouchers'
    },
    {
      icon: 'analytics-outline',
      activeIcon: 'analytics',
      label: 'Reports',
      action: 'navigate',
      screen: 'Reports',
      isActive: currentRoute === 'Reports'
    },
    {
      icon: 'home-outline',
      activeIcon: 'home',
      label: 'Home',
      action: 'home',
      screen: 'Dashboard',
      isActive: currentRoute === 'Dashboard'
    },
    {
      icon: 'bookmark-outline',
      activeIcon: 'bookmark',
      label: 'Ledgers',
      action: 'navigate',
      screen: 'Ledgers',
      isActive: currentRoute === 'Ledgers'
    },
    {
      icon: 'headset-outline',
      activeIcon: 'headset',
      label: 'Support',
      action: 'navigate',
      screen: 'Support',
      isActive: currentRoute === 'Support'
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => (
          <AnimatedTab
            key={index}
            tab={tab}
            onPress={() => handleTabPress(tab.action, tab.screen)}
          />
        ))}
      </View>
    </View>
  );
}

function AnimatedTab({ tab, onPress }) {
  const scaleAnim = useRef(new Animated.Value(tab.isActive ? 1 : 0)).current;
  const widthAnim = useRef(new Animated.Value(tab.isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: tab.isActive ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(widthAnim, {
        toValue: tab.isActive ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [tab.isActive, scaleAnim, widthAnim]);

  const iconScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const pillWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [48, 90],
  });

  const labelOpacity = widthAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.tabContent,
          tab.isActive && styles.activeTabContent,
          { width: pillWidth },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Ionicons
            name={tab.isActive ? tab.activeIcon : tab.icon}
            size={21}
            color={tab.isActive ? '#ffffff' : '#9ca3af'}
          />
        </Animated.View>
        {tab.isActive && (
          <Animated.Text
            style={[
              styles.tabLabel,
              { opacity: labelOpacity },
            ]}
            numberOfLines={1}
          >
            {tab.label}
          </Animated.Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
    paddingBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 48,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 5,
    minHeight: 40,
  },
  activeTabContent: {
    backgroundColor: '#3e60ab',
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    ...FONT_STYLES.captionSmall,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.2,
  },
});