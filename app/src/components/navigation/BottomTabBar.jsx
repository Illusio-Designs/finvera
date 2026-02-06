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
      icon: 'home-outline',
      activeIcon: 'home',
      label: 'Home',
      action: 'home',
      screen: 'Dashboard',
      isActive: currentRoute === 'Dashboard'
    },
    {
      icon: 'search-outline',
      activeIcon: 'search',
      label: 'Search',
      action: 'navigate',
      screen: 'Ledgers',
      isActive: currentRoute === 'Ledgers'
    },
    {
      icon: 'notifications-outline',
      activeIcon: 'notifications',
      label: 'Notifications',
      action: 'navigate',
      screen: 'NotificationDemo',
      isActive: currentRoute === 'NotificationDemo'
    },
    {
      icon: 'person-outline',
      activeIcon: 'person',
      label: 'Profile',
      action: 'navigate',
      screen: 'Profile',
      isActive: currentRoute === 'Profile'
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
      Animated.spring(scaleAnim, {
        toValue: tab.isActive ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(widthAnim, {
        toValue: tab.isActive ? 1 : 0,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  }, [tab.isActive, scaleAnim, widthAnim]);

  const iconScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const pillWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [48, 120],
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
            size={24}
            color={tab.isActive ? '#ffffff' : '#6b7280'}
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
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  activeTabContent: {
    backgroundColor: '#1f2937',
  },
  tabLabel: {
    ...FONT_STYLES.labelSmall,
    color: '#ffffff',
    fontWeight: '600',
  },
});