import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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
      action: 'navigate',
      screen: 'Vouchers',
      isActive: currentRoute === 'Vouchers'
    },
    {
      icon: 'analytics-outline',
      activeIcon: 'analytics',
      action: 'navigate',
      screen: 'Reports',
      isActive: currentRoute === 'Reports'
    },
    {
      icon: 'home-outline',
      activeIcon: 'home',
      action: 'home',
      screen: 'Dashboard',
      isActive: currentRoute === 'Dashboard'
    },
    {
      icon: 'bookmark-outline',
      activeIcon: 'bookmark',
      action: 'navigate',
      screen: 'Ledgers',
      isActive: currentRoute === 'Ledgers'
    },
    {
      icon: 'headset-outline',
      activeIcon: 'headset',
      action: 'navigate',
      screen: 'Support',
      isActive: currentRoute === 'Support'
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tab}
            onPress={() => handleTabPress(tab.action, tab.screen)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.tabContent,
              tab.isActive && styles.activeTab
            ]}>
              <Ionicons
                name={tab.isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={tab.isActive ? '#3e60ab' : '#9ca3af'}
              />
            </View>
            {/* Active indicator dot */}
            {tab.isActive && (
              <View style={styles.activeIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 1000, // Ensure it stays on top
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 24, // Extra padding for safe area
    borderTopWidth: 0.5, // Made even thinner
    borderTopColor: '#f9fafb', // Made even lighter
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 }, // Reduced shadow offset
    shadowOpacity: 0.03, // Further reduced shadow opacity
    shadowRadius: 4, // Further reduced shadow radius
    elevation: 4, // Further reduced elevation
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabContent: {
    padding: 10,
    borderRadius: 16,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#f0f4fc', // Light Finvera blue background for active state
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3e60ab',
    marginTop: 2,
  },
});