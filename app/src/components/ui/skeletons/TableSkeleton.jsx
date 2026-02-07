import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

/**
 * Skeleton for table/report screens
 */
export default function TableSkeleton({ rows = 8, columns = 4 }) {
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        {Array.from({ length: columns }).map((_, index) => (
          <View key={index} style={styles.headerCell}>
            <SkeletonLoader width="80%" height={14} />
          </View>
        ))}
      </View>

      {/* Data Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.dataRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <View key={colIndex} style={styles.dataCell}>
              <SkeletonLoader width="70%" height={12} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerCell: {
    flex: 1,
    paddingHorizontal: 8,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dataCell: {
    flex: 1,
    paddingHorizontal: 8,
  },
});
