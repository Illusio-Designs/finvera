import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

/**
 * Skeleton for list items (vouchers, ledgers, etc.)
 */
export default function ListItemSkeleton({ count = 5 }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.item}>
          <View style={styles.leftSection}>
            <SkeletonLoader width={40} height={40} borderRadius={8} />
          </View>
          <View style={styles.middleSection}>
            <SkeletonLoader width="80%" height={16} marginBottom={8} />
            <SkeletonLoader width="60%" height={12} />
          </View>
          <View style={styles.rightSection}>
            <SkeletonLoader width={60} height={20} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftSection: {
    marginRight: 12,
  },
  middleSection: {
    flex: 1,
  },
  rightSection: {
    marginLeft: 12,
  },
});
