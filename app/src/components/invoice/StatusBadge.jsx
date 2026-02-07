import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

/**
 * StatusBadge Component
 * 
 * Displays a status badge with color coding and icon for document statuses
 * (e-invoice, e-way bill, etc.)
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - Status value: 'PENDING', 'GENERATED', 'CANCELLED', 'FAILED'
 * @param {string} props.label - Display label for the status
 */
const StatusBadge = ({ status, label }) => {
  // Get status-specific styling
  const getStatusConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          backgroundColor: '#f59e0b',
          color: '#ffffff',
          icon: 'time-outline'
        };
      case 'GENERATED':
        return {
          backgroundColor: '#10b981',
          color: '#ffffff',
          icon: 'checkmark-circle-outline'
        };
      case 'CANCELLED':
        return {
          backgroundColor: '#6b7280',
          color: '#ffffff',
          icon: 'close-circle-outline'
        };
      case 'FAILED':
        return {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          icon: 'alert-circle-outline'
        };
      default:
        return {
          backgroundColor: '#9ca3af',
          color: '#ffffff',
          icon: 'help-circle-outline'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Ionicons name={config.icon} size={16} color={config.color} />
      <Text style={[styles.badgeText, { color: config.color }]}>
        {label}
      </Text>
    </View>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['PENDING', 'GENERATED', 'CANCELLED', 'FAILED']).isRequired,
  label: PropTypes.string.isRequired
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});

export default StatusBadge;
