import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

/**
 * Skeleton for stat cards (dashboard metrics)
 */
export default function StatCardSkeleton({ count = 4 }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.card}>
          <SkeletonLoader width={32} height={32} borderRadius={8} marginBottom={12} />
          <SkeletonLoader width="70%" height={14} marginBottom={8} />
          <SkeletonLoader width="50%" height={20} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  card: {
    width: '48%',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
