import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

/**
 * Skeleton for form screens (invoice forms, etc.)
 */
export default function FormSkeleton({ fieldCount = 6 }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonLoader width="60%" height={24} marginBottom={8} />
        <SkeletonLoader width="40%" height={14} />
      </View>

      {/* Form Fields */}
      {Array.from({ length: fieldCount }).map((_, index) => (
        <View key={index} style={styles.field}>
          <SkeletonLoader width="30%" height={14} marginBottom={8} />
          <SkeletonLoader width="100%" height={48} borderRadius={8} />
        </View>
      ))}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <SkeletonLoader width="48%" height={48} borderRadius={8} />
        <SkeletonLoader width="48%" height={48} borderRadius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
});
