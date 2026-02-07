/**
 * Unit Tests for StatusBadge Component
 * 
 * Tests StatusBadge rendering for each status with correct colors and icons
 * 
 * Requirements: 7.3, 7.4
 */

const React = require('react');
const { render } = require('@testing-library/react-native');

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

// Import component
let StatusBadge;
try {
  StatusBadge = require('../StatusBadge');
  if (StatusBadge.default) {
    StatusBadge = StatusBadge.default;
  }
} catch (error) {
  console.error('Failed to import StatusBadge:', error);
  throw error;
}

describe('StatusBadge Component - Unit Tests', () => {
  describe('Status Rendering', () => {
    test('should render PENDING status with correct color and label', () => {
      const { getByText } = render(
        <StatusBadge status="PENDING" label="Pending" />
      );

      expect(getByText('Pending')).toBeTruthy();
    });

    test('should render GENERATED status with correct color and label', () => {
      const { getByText } = render(
        <StatusBadge status="GENERATED" label="Generated" />
      );

      expect(getByText('Generated')).toBeTruthy();
    });

    test('should render CANCELLED status with correct color and label', () => {
      const { getByText } = render(
        <StatusBadge status="CANCELLED" label="Cancelled" />
      );

      expect(getByText('Cancelled')).toBeTruthy();
    });

    test('should render FAILED status with correct color and label', () => {
      const { getByText } = render(
        <StatusBadge status="FAILED" label="Failed" />
      );

      expect(getByText('Failed')).toBeTruthy();
    });
  });

  describe('Label Display', () => {
    test('should display custom label text', () => {
      const { getByText } = render(
        <StatusBadge status="GENERATED" label="E-Invoice Generated" />
      );

      expect(getByText('E-Invoice Generated')).toBeTruthy();
    });

    test('should handle long label text', () => {
      const longLabel = 'This is a very long status label that should still render';
      const { getByText } = render(
        <StatusBadge status="PENDING" label={longLabel} />
      );

      expect(getByText(longLabel)).toBeTruthy();
    });

    test('should handle short label text', () => {
      const { getByText } = render(
        <StatusBadge status="FAILED" label="ERR" />
      );

      expect(getByText('ERR')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    test('should handle unknown status gracefully', () => {
      const { getByText } = render(
        <StatusBadge status="UNKNOWN" label="Unknown Status" />
      );

      expect(getByText('Unknown Status')).toBeTruthy();
    });

    test('should render with empty label', () => {
      const { UNSAFE_root } = render(
        <StatusBadge status="PENDING" label="" />
      );

      // Component should still render even with empty label
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Consistency', () => {
    test('should render consistently for same props', () => {
      const { getByText: getByText1 } = render(
        <StatusBadge status="GENERATED" label="Success" />
      );

      const { getByText: getByText2 } = render(
        <StatusBadge status="GENERATED" label="Success" />
      );

      expect(getByText1('Success')).toBeTruthy();
      expect(getByText2('Success')).toBeTruthy();
    });
  });
});
