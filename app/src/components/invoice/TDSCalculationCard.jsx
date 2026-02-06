/**
 * TDS Calculation Card Component
 * 
 * Displays TDS calculation details:
 * - TDS section selector
 * - TDS rate (read-only)
 * - Calculated TDS amount
 * - Deduction details
 * - Auto-calculation on amount/section change
 * 
 * This component will be implemented in Task 12
 */

import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import { TDSDetailsPropType } from '../../types/invoice';

const TDSCalculationCard = ({
  tdsDetails,
  amount,
  onSectionChange,
  onCalculate,
  loading,
}) => {
  // Implementation will be added in Task 12
  return (
    <View>
      {/* TDS calculation card will be implemented in Task 12 */}
    </View>
  );
};

TDSCalculationCard.propTypes = {
  tdsDetails: TDSDetailsPropType,
  amount: PropTypes.number.isRequired,
  onSectionChange: PropTypes.func.isRequired,
  onCalculate: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default TDSCalculationCard;
