/**
 * Status Badge Component
 * 
 * Displays status with color coding and icons
 * - PENDING: Orange (#f59e0b)
 * - GENERATED: Green (#10b981)
 * - CANCELLED: Gray (#6b7280)
 * - FAILED: Red (#ef4444)
 * 
 * This component will be implemented in Task 9
 */

import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

const StatusBadge = ({ status, label }) => {
  // Implementation will be added in Task 9
  return (
    <View>
      <Text>Status Badge - {status}</Text>
    </View>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['PENDING', 'GENERATED', 'CANCELLED', 'FAILED']).isRequired,
  label: PropTypes.string.isRequired,
};

export default StatusBadge;
