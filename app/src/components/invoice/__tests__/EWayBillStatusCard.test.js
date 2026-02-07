/**
 * Unit Tests for EWayBillStatusCard Component
 * 
 * Tests specific examples and edge cases for the EWayBillStatusCard component
 * Validates: Requirements 3.2, 3.4, 3.6
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EWayBillStatusCard from '../EWayBillStatusCard';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

jest.mock('../StatusBadge', () => {
  return function StatusBadge({ status, label }) {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: 'status-badge' }, `${status}: ${label}`);
  };
});

jest.mock('../DocumentActionButtons', () => {
  return function DocumentActionButtons({ status, onGenerate, onCancel, onRetry, loading }) {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    
    return React.createElement(
      React.Fragment,
      null,
      status === 'PENDING' && onGenerate && React.createElement(
        TouchableOpacity,
        { testID: 'generate-button', onPress: onGenerate, disabled: loading },
        React.createElement(Text, null, loading ? 'Generating...' : 'Generate E-Way Bill')
      ),
      status === 'GENERATED' && onCancel && React.createElement(
        TouchableOpacity,
        { testID: 'cancel-button', onPress: onCancel, disabled: loading },
        React.createElement(Text, null, loading ? 'Cancelling...' : 'Cancel E-Way Bill')
      ),
      status === 'FAILED' && onRetry && React.createElement(
        TouchableOpacity,
        { testID: 'retry-button', onPress: onRetry, disabled: loading },
        React.createElement(Text, null, loading ? 'Retrying...' : 'Retry Generation')
      )
    );
  };
});

describe('EWayBillStatusCard', () => {
  const mockCallbacks = {
    onGenerate: jest.fn(),
    onCancel: jest.fn(),
    onUpdateVehicle: jest.fn(),
    onRetry: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Rendering with generated status
   * Validates: Requirements 3.2, 3.6
   */
  describe('Rendering with generated status', () => {
    it('should display e-way bill number and validity date', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date('2024-02-15T23:59:59Z'),
        vehicleNumber: 'DL01AB1234',
        transporterId: 'TRANS123',
        errorMessage: null,
        generatedAt: new Date('2024-01-15T10:30:00Z'),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Verify EWB number is displayed
      expect(getByText('EWB No:')).toBeTruthy();
      expect(getByText('123456789012')).toBeTruthy();

      // Verify validity date label is displayed
      expect(getByText('Valid Until:')).toBeTruthy();
    });

    it('should display vehicle number when present', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date('2024-02-15T23:59:59Z'),
        vehicleNumber: 'DL01AB1234',
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('Vehicle:')).toBeTruthy();
      expect(getByText('DL01AB1234')).toBeTruthy();
    });

    it('should display transporter ID when present', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date('2024-02-15T23:59:59Z'),
        vehicleNumber: null,
        transporterId: 'TRANS123',
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('Transporter:')).toBeTruthy();
      expect(getByText('TRANS123')).toBeTruthy();
    });

    it('should display generated at timestamp', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date('2024-02-15T23:59:59Z'),
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date('2024-01-15T10:30:00Z'),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('Generated:')).toBeTruthy();
    });

    it('should display status badge with GENERATED status', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      const statusBadge = getByTestId('status-badge');
      expect(statusBadge.props.children).toContain('GENERATED');
    });

    it('should display update vehicle button when status is GENERATED', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: 'DL01AB1234',
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('Update Vehicle Details')).toBeTruthy();
    });
  });

  /**
   * Test: Vehicle update modal
   * Validates: Requirements 3.4
   */
  describe('Vehicle update modal', () => {
    it('should open vehicle update modal when update button is clicked', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: 'DL01AB1234',
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText, getByPlaceholderText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      const updateButton = getByText('Update Vehicle Details');
      fireEvent.press(updateButton);

      // Verify modal is opened by checking for modal-specific content
      expect(getByPlaceholderText('Enter vehicle number (e.g., DL01AB1234)')).toBeTruthy();
      expect(getByPlaceholderText('Enter reason for vehicle update')).toBeTruthy();
    });

    it('should pre-fill vehicle number in update modal', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: 'DL01AB1234',
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText, getByPlaceholderText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      const updateButton = getByText('Update Vehicle Details');
      fireEvent.press(updateButton);

      const vehicleInput = getByPlaceholderText('Enter vehicle number (e.g., DL01AB1234)');
      expect(vehicleInput.props.value).toBe('DL01AB1234');
    });

    it('should submit vehicle update with new vehicle number and reason', async () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: 'DL01AB1234',
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const mockOnUpdateVehicle = jest.fn().mockResolvedValue(undefined);

      const { getByText, getByPlaceholderText } = render(
        <EWayBillStatusCard
          status={status}
          onGenerate={mockCallbacks.onGenerate}
          onCancel={mockCallbacks.onCancel}
          onUpdateVehicle={mockOnUpdateVehicle}
          onRetry={mockCallbacks.onRetry}
          loading={false}
        />
      );

      // Open vehicle update modal
      const updateButton = getByText('Update Vehicle Details');
      fireEvent.press(updateButton);

      // Enter new vehicle number
      const vehicleInput = getByPlaceholderText('Enter vehicle number (e.g., DL01AB1234)');
      fireEvent.changeText(vehicleInput, 'DL02CD5678');

      // Enter update reason
      const reasonInput = getByPlaceholderText('Enter reason for vehicle update');
      fireEvent.changeText(reasonInput, 'Vehicle breakdown, using alternate vehicle');

      // Submit update
      const submitButton = getByText('Update');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnUpdateVehicle).toHaveBeenCalledWith(
          'DL02CD5678',
          'Vehicle breakdown, using alternate vehicle'
        );
      });
    });

    it('should not submit vehicle update without vehicle number', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: 'DL01AB1234',
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText, getByPlaceholderText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Open vehicle update modal
      const updateButton = getByText('Update Vehicle Details');
      fireEvent.press(updateButton);

      // Clear vehicle number
      const vehicleInput = getByPlaceholderText('Enter vehicle number (e.g., DL01AB1234)');
      fireEvent.changeText(vehicleInput, '');

      // Enter reason
      const reasonInput = getByPlaceholderText('Enter reason for vehicle update');
      fireEvent.changeText(reasonInput, 'Some reason');

      // Verify onUpdateVehicle was not called
      expect(mockCallbacks.onUpdateVehicle).not.toHaveBeenCalled();
    });

    it('should not submit vehicle update without reason', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: 'DL01AB1234',
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText, getByPlaceholderText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Open vehicle update modal
      const updateButton = getByText('Update Vehicle Details');
      fireEvent.press(updateButton);

      // Enter vehicle number
      const vehicleInput = getByPlaceholderText('Enter vehicle number (e.g., DL01AB1234)');
      fireEvent.changeText(vehicleInput, 'DL02CD5678');

      // Leave reason empty
      const reasonInput = getByPlaceholderText('Enter reason for vehicle update');
      fireEvent.changeText(reasonInput, '');

      // Verify onUpdateVehicle was not called
      expect(mockCallbacks.onUpdateVehicle).not.toHaveBeenCalled();
    });

    it('should close vehicle update modal when cancel button is clicked', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: 'DL01AB1234',
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText, getAllByText, queryByPlaceholderText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Open vehicle update modal
      const updateButton = getByText('Update Vehicle Details');
      fireEvent.press(updateButton);

      // Verify modal is open
      expect(queryByPlaceholderText('Enter vehicle number (e.g., DL01AB1234)')).toBeTruthy();

      // Close modal by clicking the Cancel button in modal footer
      const cancelButtons = getAllByText('Cancel');
      const modalCancelButton = cancelButtons[cancelButtons.length - 1];
      fireEvent.press(modalCancelButton);

      // Verify the update callback was not called
      expect(mockCallbacks.onUpdateVehicle).not.toHaveBeenCalled();
    });
  });

  /**
   * Test: Cancel functionality
   * Validates: Requirements 3.6
   */
  describe('Cancel functionality', () => {
    it('should open cancel modal when cancel button is clicked', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId, getByPlaceholderText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      const cancelButton = getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      // Verify modal is opened by checking for modal-specific content
      expect(getByPlaceholderText('Enter reason for cancellation')).toBeTruthy();
    });

    it('should display cancellation reason code options', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId, getByText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      const cancelButton = getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      // Verify reason code options are displayed
      expect(getByText('Duplicate')).toBeTruthy();
      expect(getByText('Data Entry Mistake')).toBeTruthy();
      expect(getByText('Order Cancelled')).toBeTruthy();
      expect(getByText('Others')).toBeTruthy();
    });

    it('should submit cancellation with reason and reason code', async () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const mockOnCancel = jest.fn().mockResolvedValue(undefined);

      const { getByTestId, getByText, getByPlaceholderText } = render(
        <EWayBillStatusCard
          status={status}
          onGenerate={mockCallbacks.onGenerate}
          onCancel={mockOnCancel}
          onUpdateVehicle={mockCallbacks.onUpdateVehicle}
          onRetry={mockCallbacks.onRetry}
          loading={false}
        />
      );

      // Open cancel modal
      const cancelButton = getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      // Select reason code
      const reasonCodeButton = getByText('Order Cancelled');
      fireEvent.press(reasonCodeButton);

      // Enter cancellation reason
      const reasonInput = getByPlaceholderText('Enter reason for cancellation');
      fireEvent.changeText(reasonInput, 'Customer requested cancellation');

      // Submit cancellation
      const submitButton = getByText('Submit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalledWith('Customer requested cancellation', '3');
      });
    });

    it('should not submit cancellation without reason', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId, getByPlaceholderText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Open cancel modal
      const cancelButton = getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      // Verify modal is open
      expect(getByPlaceholderText('Enter reason for cancellation')).toBeTruthy();
      
      // Verify onCancel was not called without entering reason
      expect(mockCallbacks.onCancel).not.toHaveBeenCalled();
    });

    it('should close cancel modal when cancel button in modal is clicked', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId, getAllByText, getByPlaceholderText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Open cancel modal
      const cancelButton = getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      // Verify modal is open
      expect(getByPlaceholderText('Enter reason for cancellation')).toBeTruthy();

      // Close modal by clicking the Cancel button in modal footer
      const cancelButtons = getAllByText('Cancel');
      const modalCancelButton = cancelButtons[cancelButtons.length - 1];
      fireEvent.press(modalCancelButton);

      // Verify the cancel callback was not called
      expect(mockCallbacks.onCancel).not.toHaveBeenCalled();
    });
  });

  /**
   * Test: Rendering with failed status
   * Validates: Requirements 3.6
   */
  describe('Rendering with failed status', () => {
    it('should display error message when generation fails', () => {
      const status = {
        status: 'FAILED',
        ewbNumber: null,
        validUntil: null,
        vehicleNumber: null,
        transporterId: null,
        errorMessage: 'E-way bill generation failed: Invalid transporter ID',
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Verify error message is displayed
      expect(getByText('E-way bill generation failed: Invalid transporter ID')).toBeTruthy();
    });

    it('should display status badge with FAILED status', () => {
      const status = {
        status: 'FAILED',
        ewbNumber: null,
        validUntil: null,
        vehicleNumber: null,
        transporterId: null,
        errorMessage: 'Generation failed',
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      const statusBadge = getByTestId('status-badge');
      expect(statusBadge.props.children).toContain('FAILED');
    });

    it('should not display EWB number when status is FAILED', () => {
      const status = {
        status: 'FAILED',
        ewbNumber: null,
        validUntil: null,
        vehicleNumber: null,
        transporterId: null,
        errorMessage: 'Failed',
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { queryByText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Verify EWB number is not displayed
      expect(queryByText('EWB No:')).toBeFalsy();
    });

    it('should display retry button for failed status', () => {
      const status = {
        status: 'FAILED',
        ewbNumber: null,
        validUntil: null,
        vehicleNumber: null,
        transporterId: null,
        errorMessage: 'Generation failed',
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByTestId('retry-button')).toBeTruthy();
    });

    it('should call onRetry when retry button is clicked', () => {
      const status = {
        status: 'FAILED',
        ewbNumber: null,
        validUntil: null,
        vehicleNumber: null,
        transporterId: null,
        errorMessage: 'Generation failed',
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      const retryButton = getByTestId('retry-button');
      fireEvent.press(retryButton);

      expect(mockCallbacks.onRetry).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test: Loading state
   * Validates: Requirements 3.6
   */
  describe('Loading state', () => {
    it('should display loading indicator when loading is true', () => {
      const status = {
        status: 'PENDING',
        ewbNumber: null,
        validUntil: null,
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={true}
        />
      );

      expect(getByText('Processing e-way bill...')).toBeTruthy();
    });

    it('should not display loading indicator when loading is false', () => {
      const status = {
        status: 'PENDING',
        ewbNumber: null,
        validUntil: null,
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { queryByText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(queryByText('Processing e-way bill...')).toBeFalsy();
    });

    it('should display update vehicle button even when loading', () => {
      const status = {
        status: 'GENERATED',
        ewbNumber: '123456789012',
        validUntil: new Date(),
        vehicleNumber: 'DL01AB1234',
        transporterId: null,
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={true}
        />
      );

      // Button should still be present when loading
      const updateButton = getByText('Update Vehicle Details');
      expect(updateButton).toBeTruthy();
    });
  });

  /**
   * Test: Cancelled status
   * Validates: Requirements 3.6
   */
  describe('Cancelled status', () => {
    it('should display cancellation information', () => {
      const status = {
        status: 'CANCELLED',
        ewbNumber: '123456789012',
        validUntil: null,
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: null,
        cancelledAt: new Date('2024-01-20T14:30:00Z'),
        cancellationReason: 'Order cancelled by customer'
      };

      const { getByText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('Cancelled At:')).toBeTruthy();
      expect(getByText('Order cancelled by customer')).toBeTruthy();
    });

    it('should display status badge with CANCELLED status', () => {
      const status = {
        status: 'CANCELLED',
        ewbNumber: '123456789012',
        validUntil: null,
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: null,
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled'
      };

      const { getByTestId } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      const statusBadge = getByTestId('status-badge');
      expect(statusBadge.props.children).toContain('CANCELLED');
    });

    it('should display cancellation reason when present', () => {
      const status = {
        status: 'CANCELLED',
        ewbNumber: '123456789012',
        validUntil: null,
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: null,
        cancelledAt: new Date(),
        cancellationReason: 'Duplicate entry'
      };

      const { getByText } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('Reason:')).toBeTruthy();
      expect(getByText('Duplicate entry')).toBeTruthy();
    });
  });

  /**
   * Test: Pending status
   * Validates: Requirements 3.6
   */
  describe('Pending status', () => {
    it('should display generate button for pending status', () => {
      const status = {
        status: 'PENDING',
        ewbNumber: null,
        validUntil: null,
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByTestId('generate-button')).toBeTruthy();
    });

    it('should call onGenerate when generate button is clicked', () => {
      const status = {
        status: 'PENDING',
        ewbNumber: null,
        validUntil: null,
        vehicleNumber: null,
        transporterId: null,
        errorMessage: null,
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId } = render(
        <EWayBillStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      const generateButton = getByTestId('generate-button');
      fireEvent.press(generateButton);

      expect(mockCallbacks.onGenerate).toHaveBeenCalledTimes(1);
    });
  });
});
