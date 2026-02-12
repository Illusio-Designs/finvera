import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

/**
 * Skeleton Loader Component with Shimmer Animation
 * Uses brand color #3e60ab for shimmer effect
 */
export function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <View style={[styles.skeletonContainer, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.skeleton,
          {
            width,
            height,
            borderRadius,
            opacity,
          },
        ]}
      />
    </View>
  );
}

/**
 * Skeleton Stat Card - For dashboard stats
 */
export function SkeletonStatCard({ style, fullWidth = false }) {
  return (
    <View style={[fullWidth ? styles.statCardFull : styles.statCard, style]}>
      <View style={styles.statCardHeader}>
        <View style={{ flex: 1, marginRight: 16 }}>
          <SkeletonBox width="75%" height={18} style={{ marginBottom: 8 }} />
          <SkeletonBox width="55%" height={14} />
        </View>
        <SkeletonBox width={52} height={52} borderRadius={26} />
      </View>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <SkeletonBox width="90%" height={40} />
      </View>
    </View>
  );
}

/**
 * Skeleton List Item - For list entries
 */
export function SkeletonListItem({ style }) {
  return (
    <View style={[styles.listItem, style]}>
      <SkeletonBox width={40} height={40} borderRadius={20} />
      <View style={styles.listItemContent}>
        <SkeletonBox width="70%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonBox width="50%" height={14} />
      </View>
    </View>
  );
}

/**
 * Skeleton Activity Item - For activity feed
 */
export function SkeletonActivityItem({ style }) {
  return (
    <View style={[styles.activityItem, style]}>
      <SkeletonBox width={40} height={40} borderRadius={20} />
      <View style={styles.activityContent}>
        <SkeletonBox width="60%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="80%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonBox width="40%" height={12} />
      </View>
      <SkeletonBox width={60} height={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  skeleton: {
    backgroundColor: '#d1d5db',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardFull: {
    width: 340,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    height: 210,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 36,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statCardLeft: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
});

export default SkeletonBox;
