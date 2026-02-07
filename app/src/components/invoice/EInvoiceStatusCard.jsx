import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import QRCode from 'react-native-qrcode-svg';
import StatusBadge from './StatusBadge';
import DocumentActionButtons from './DocumentActionButtons';

const { width } = Dimensions.get('window');

/**
 * EInvoiceStatusCard Component
 * 
 * Displays e-invoice status information including IRN, acknowledgment details,
 * QR code, and action buttons for generate/cancel/retry operations
 * 
 * @param {Object} props - Component props
 * @param {Object} props.status - E-invoice status object
 * @param {Function} props.onGenerate - Callback for generate action
 * @param {Function} props.onCancel - Callback for cancel action (reason, reasonCode)
 * @param {Function} props.onRetry - Callback for retry action
 * @param {boolean} props.loading - Loading state indicator
 */
const EInvoiceStatusCard = ({
  status,
  onGenerate,
  onCancel,
  onRetry,
  loading = false
}) => {
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonCode, setCancelReasonCode] = useState('1');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Cancellation reason codes as per GST e-invoice standards
  const CANCEL_REASON_CODES = [
    { value: '1', label: 'Duplicate' },
    { value: '2', label: 'Data Entry Mistake' },
    { value: '3', label: 'Order Cancelled' },
    { value: '4', label: 'Others' }
  ];

  const handleCancelPress = () => {
    setCancelModalVisible(true);
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      return;
    }

    try {
      setSubmittingCancel(true);
      await onCancel(cancelReason, cancelReasonCode);
      setCancelModalVisible(false);
      setCancelReason('');
      setCancelReasonCode('1');
    } catch (error) {
      console.error('Cancel error:', error);
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleCancelModalClose = () => {
    setCancelModalVisible(false);
    setCancelReason('');
    setCancelReasonCode('1');
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="document-text-outline" size={24} color="#10b981" />
          <Text style={styles.headerTitle}>E-Invoice</Text>
        </View>
        <StatusBadge status={status.status} label={status.status} />
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Processing e-invoice...</Text>
        </View>
      )}

      {/* E-Invoice Details - Show when generated */}
      {status.status === 'GENERATED' && status.irn && (
        <View style={styles.detailsContainer}>
          {/* IRN */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>IRN:</Text>
            <Text style={styles.detailValue} selectable>
              {status.irn}
            </Text>
          </View>

          {/* Acknowledgment Number */}
          {status.ackNo && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ack No:</Text>
              <Text style={styles.detailValue} selectable>
                {status.ackNo}
              </Text>
            </View>
          )}

          {/* Acknowledgment Date */}
          {status.ackDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ack Date:</Text>
              <Text style={styles.detailValue}>
                {formatDate(status.ackDate)}
              </Text>
            </View>
          )}

          {/* Generated At */}
          {status.generatedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Generated:</Text>
              <Text style={styles.detailValue}>
                {formatDate(status.generatedAt)}
              </Text>
            </View>
          )}

          {/* QR Code */}
          {status.qrCode && (
            <View style={styles.qrCodeContainer}>
              <Text style={styles.qrCodeLabel}>QR Code:</Text>
              <View style={styles.qrCodeWrapper}>
                <QRCode
                  value={status.qrCode}
                  size={150}
                  backgroundColor="white"
                  color="black"
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Error Message - Show when failed */}
      {status.status === 'FAILED' && status.errorMessage && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#ef4444" />
          <Text style={styles.errorText}>{status.errorMessage}</Text>
        </View>
      )}

      {/* Cancelled Info */}
      {status.status === 'CANCELLED' && (
        <View style={styles.cancelledContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cancelled At:</Text>
            <Text style={styles.detailValue}>
              {formatDate(status.cancelledAt)}
            </Text>
          </View>
          {status.cancellationReason && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reason:</Text>
              <Text style={styles.detailValue}>
                {status.cancellationReason}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <DocumentActionButtons
        status={status.status}
        onGenerate={onGenerate}
        onCancel={handleCancelPress}
        onRetry={onRetry}
        loading={loading}
        generateLabel="Generate E-Invoice"
        cancelLabel="Cancel E-Invoice"
        retryLabel="Retry Generation"
      />

      {/* Cancel Reason Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancelModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel E-Invoice</Text>
              <TouchableOpacity
                onPress={handleCancelModalClose}
                disabled={submittingCancel}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Reason Code Selector */}
              <Text style={styles.inputLabel}>Cancellation Reason Code</Text>
              <View style={styles.reasonCodeContainer}>
                {CANCEL_REASON_CODES.map((code) => (
                  <TouchableOpacity
                    key={code.value}
                    style={[
                      styles.reasonCodeButton,
                      cancelReasonCode === code.value && styles.reasonCodeButtonActive
                    ]}
                    onPress={() => setCancelReasonCode(code.value)}
                    disabled={submittingCancel}
                  >
                    <Text
                      style={[
                        styles.reasonCodeText,
                        cancelReasonCode === code.value && styles.reasonCodeTextActive
                      ]}
                    >
                      {code.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Reason Text Input */}
              <Text style={styles.inputLabel}>Cancellation Reason *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter reason for cancellation"
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!submittingCancel}
              />
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleCancelModalClose}
                disabled={submittingCancel}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  (!cancelReason.trim() || submittingCancel) && styles.modalButtonDisabled
                ]}
                onPress={handleCancelSubmit}
                disabled={!cancelReason.trim() || submittingCancel}
              >
                {submittingCancel ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

EInvoiceStatusCard.propTypes = {
  status: PropTypes.shape({
    status: PropTypes.oneOf(['PENDING', 'GENERATED', 'CANCELLED', 'FAILED']).isRequired,
    irn: PropTypes.string,
    ackNo: PropTypes.string,
    ackDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    qrCode: PropTypes.string,
    errorMessage: PropTypes.string,
    generatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    cancelledAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    cancellationReason: PropTypes.string
  }).isRequired,
  onGenerate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  detailsContainer: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    width: 100,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  qrCodeContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  qrCodeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ef4444',
  },
  cancelledContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  reasonCodeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reasonCodeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  reasonCodeButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  reasonCodeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  reasonCodeTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 100,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  modalButtonPrimary: {
    backgroundColor: '#ef4444',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default EInvoiceStatusCard;
