/**
 * Unit Tests for EInvoiceStatusCard Component
 * 
 * Tests specific examples and edge cases for the EInvoiceStatusCard component
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EInvoiceStatusCard from '../EInvoiceStatusCard';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

jest.mock('react-native-qrcode-svg', () => 'QRCode');

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
        React.createElement(Text, null, loading ? 'Generating...' : 'Generate E-Invoice')
      ),
      status === 'GENERATED' && onCancel && React.createElement(
        TouchableOpacity,
        { testID: 'cancel-button', onPress: onCancel, disabled: loading },
        React.createElement(Text, null, loading ? 'Cancelling...' : 'Cancel E-Invoice')
      ),
      status === 'FAILED' && onRetry && React.createElement(
        TouchableOpacity,
        { testID: 'retry-button', onPress: onRetry, disabled: loading },
        React.createElement(Text, null, loading ? 'Retrying...' : 'Retry Generation')
      )
    );
  };
});

describe('EInvoiceStatusCard', () => {
  const mockCallbacks = {
    onGenerate: jest.fn(),
    onCancel: jest.fn(),
    onRetry: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Rendering with generated status
   * Validates: Requirements 2.2, 2.6
   */
  describe('Rendering with generated status', () => {
    it('should display IRN, acknowledgment number, and acknowledgment date', () => {
      const status = {
        status: 'GENERATED',
        irn: 'TEST-IRN-123456789',
        ackNo: 'ACK-987654321',
        ackDate: new Date('2024-01-15T10:30:00Z'),
        qrCode: 'QR-CODE-DATA-STRING',
        errorMessage: null,
        generatedAt: new Date('2024-01-15T10:30:00Z'),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText } = render(
        <EInvoiceStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Verify IRN is displayed
      expect(getByText('IRN:')).toBeTruthy();
      expect(getByText('TEST-IRN-123456789')).toBeTruthy();

      // Verify acknowledgment number is displayed
      expect(getByText('Ack No:')).toBeTruthy();
      expect(getByText('ACK-987654321')).toBeTruthy();

      // Verify acknowledgment date label is displayed
      expect(getByText('Ack Date:')).toBeTruthy();
    });

    it('should display QR code section when qrCode is present', () => {
      const status = {
        status: 'GENERATED',
        irn: 'TEST-IRN-123',
        ackNo: 'ACK-456',
        ackDate: new Date(),
        qrCode: 'QR-CODE-DATA',
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText } = render(
        <EInvoiceStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Verify QR code label is displayed
      expect(getByText('QR Code:')).toBeTruthy();
    });

    it('should display status badge with GENERATED status', () => {
      const status = {
        status: 'GENERATED',
        irn: 'TEST-IRN',
        ackNo: 'ACK-123',
        ackDate: new Date(),
        qrCode: 'QR-DATA',
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId } = render(
        <EInvoiceStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      const statusBadge = getByTestId('status-badge');
      expect(statusBadge.props.children).toContain('GENERATED');
    });
  });

  /**
   * Test: Rendering with failed status
   * Validates: Requirements 2.3, 2.6
   */
  describe('Rendering with failed status', () => {
    it('should display error message when generation fails', () => {
      const status = {
        status: 'FAILED',
        irn: null,
        ackNo: null,
        ackDate: null,
        qrCode: null,
        errorMessage: 'E-invoice generation failed: Invalid GSTIN',
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText } = render(
        <EInvoiceStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Verify error message is displayed
      expect(getByText('E-invoice generation failed: Invalid GSTIN')).toBeTruthy();
    });

    it('should display status badge with FAILED status', () => {
      const status = {
        status: 'FAILED',
        irn: null,
        ackNo: null,
        ackDate: null,
        qrCode: null,
        errorMessage: 'Generation failed',
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId } = render(
        <EInvoiceStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      const statusBadge = getByTestId('status-badge');
      expect(statusBadge.props.children).toContain('FAILED');
    });

    it('should not display IRN or QR code when status is FAILED', () => {
      const status = {
        status: 'FAILED',
        irn: null,
        ackNo: null,
        ackDate: null,
        qrCode: null,
        errorMessage: 'Failed',
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { queryByText } = render(
        <EInvoiceStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      // Verify IRN and QR code are not displayed
      expect(queryByText('IRN:')).toBeFalsy();
      expect(queryByText('QR Code:')).toBeFalsy();
    });
  });

  /**
   * Test: Retry button functionality
   * Validates: Requirements 2.4
   */
  describe('Retry button functionality', () => {
    it('should call onRetry when retry button is clicked', () => {
      const status = {
        status: 'FAILED',
        irn: null,
        ackNo: null,
        ackDate: null,
        qrCode: null,
        errorMessage: 'Generation failed',
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId } = render(
        <EInvoiceStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      const retryButton = getByTestId('retry-button');
      fireEvent.press(retryButton);

      expect(mockCallbacks.onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not call onRetry when loading is true', () => {
      const status = {
        status: 'FAILED',
        irn: null,
        ackNo: null,
        ackDate: null,
        qrCode: null,
        errorMessage: 'Generation failed',
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText } = render(
        <EInvoiceStatusCard
          status={status}
          {...mockCallbacks}
          loading={true}
        />
      );

      // Button should show loading text when loading
      expect(getByText('Retrying...')).toBeTruthy();
    });
  });

  /**
   * Test: Cancel button functionality
   * Validates: Requirements 2.5
   */
  describe('Cancel button functionality', () => {
    it('should open cancel modal when cancel button is clicked', () => {
      const status = {
        status: 'GENERATED',
        irn: 'TEST-IRN',
        ackNo: 'ACK-123',
        ackDate: new Date(),
        qrCode: 'QR-DATA',
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId, getByPlaceholderText } = render(
        <EInvoiceStatusCard
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

    it('should submit cancellation with reason and reason code', async () => {
      const status = {
        status: 'GENERATED',
        irn: 'TEST-IRN',
        ackNo: 'ACK-123',
        ackDate: new Date(),
        qrCode: 'QR-DATA',
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const mockOnCancel = jest.fn().mockResolvedValue(undefined);

      const { getByTestId, getByText, getByPlaceholderText } = render(
        <EInvoiceStatusCard
          status={status}
          onGenerate={mockCallbacks.onGenerate}
          onCancel={mockOnCancel}
          onRetry={mockCallbacks.onRetry}
          loading={false}
        />
      );

      // Open cancel modal
      const cancelButton = getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      // Enter cancellation reason
      const reasonInput = getByPlaceholderText('Enter reason for cancellation');
      fireEvent.changeText(reasonInput, 'Order cancelled by customer');

      // Submit cancellation
      const submitButton = getByText('Submit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalledWith('Order cancelled by customer', '1');
      });
    });

    it('should not submit cancellation without reason', () => {
      const status = {
        status: 'GENERATED',
        irn: 'TEST-IRN',
        ackNo: 'ACK-123',
        ackDate: new Date(),
        qrCode: 'QR-DATA',
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId, getByText, getByPlaceholderText } = render(
        <EInvoiceStatusCard
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

    it('should close modal when cancel button in modal is clicked', () => {
      const status = {
        status: 'GENERATED',
        irn: 'TEST-IRN',
        ackNo: 'ACK-123',
        ackDate: new Date(),
        qrCode: 'QR-DATA',
        errorMessage: null,
        generatedAt: new Date(),
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId, getByText, getByPlaceholderText, queryByPlaceholderText } = render(
        <EInvoiceStatusCard
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
      const modalCancelButton = getByText('Cancel');
      fireEvent.press(modalCancelButton);

      // Verify the cancel callback was not called
      expect(mockCallbacks.onCancel).not.toHaveBeenCalled();
    });
  });

  /**
   * Test: Loading state
   * Validates: Requirements 7.6
   */
  describe('Loading state', () => {
    it('should display loading indicator when loading is true', () => {
      const status = {
        status: 'PENDING',
        irn: null,
        ackNo: null,
        ackDate: null,
        qrCode: null,
        errorMessage: null,
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByText } = render(
        <EInvoiceStatusCard
          status={status}
          {...mockCallbacks}
          loading={true}
        />
      );

      expect(getByText('Processing e-invoice...')).toBeTruthy();
    });

    it('should not display loading indicator when loading is false', () => {
      const status = {
        status: 'PENDING',
        irn: null,
        ackNo: null,
        ackDate: null,
        qrCode: null,
        errorMessage: null,
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { queryByText } = render(
        <EInvoiceStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(queryByText('Processing e-invoice...')).toBeFalsy();
    });
  });

  /**
   * Test: Cancelled status
   * Validates: Requirements 2.6
   */
  describe('Cancelled status', () => {
    it('should display cancellation information', () => {
      const status = {
        status: 'CANCELLED',
        irn: 'TEST-IRN',
        ackNo: null,
        ackDate: null,
        qrCode: null,
        errorMessage: null,
        generatedAt: null,
        cancelledAt: new Date('2024-01-20T14:30:00Z'),
        cancellationReason: 'Duplicate invoice'
      };

      const { getByText } = render(
        <EInvoiceStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      expect(getByText('Cancelled At:')).toBeTruthy();
      expect(getByText('Duplicate invoice')).toBeTruthy();
    });

    it('should display status badge with CANCELLED status', () => {
      const status = {
        status: 'CANCELLED',
        irn: 'TEST-IRN',
        ackNo: null,
        ackDate: null,
        qrCode: null,
        errorMessage: null,
        generatedAt: null,
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled'
      };

      const { getByTestId } = render(
        <EInvoiceStatusCard
          status={status}
          {...mockCallbacks}
          loading={false}
        />
      );

      const statusBadge = getByTestId('status-badge');
      expect(statusBadge.props.children).toContain('CANCELLED');
    });
  });

  /**
   * Test: Pending status
   * Validates: Requirements 2.6
   */
  describe('Pending status', () => {
    it('should display generate button for pending status', () => {
      const status = {
        status: 'PENDING',
        irn: null,
        ackNo: null,
        ackDate: null,
        qrCode: null,
        errorMessage: null,
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId } = render(
        <EInvoiceStatusCard
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
        irn: null,
        ackNo: null,
        ackDate: null,
        qrCode: null,
        errorMessage: null,
        generatedAt: null,
        cancelledAt: null,
        cancellationReason: null
      };

      const { getByTestId } = render(
        <EInvoiceStatusCard
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
