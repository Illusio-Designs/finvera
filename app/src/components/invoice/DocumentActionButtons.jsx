import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

/**
 * DocumentActionButtons Component
 * 
 * Provides action buttons for document operations (generate, cancel, retry)
 * with loading state handling and conditional rendering based on document status
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - Document status: 'PENDING', 'GENERATED', 'CANCELLED', 'FAILED'
 * @param {Function} props.onGenerate - Callback for generate action
 * @param {Function} props.onCancel - Callback for cancel action
 * @param {Function} props.onRetry - Callback for retry action
 * @param {boolean} props.loading - Loading state indicator
 * @param {string} props.generateLabel - Custom label for generate button (default: 'Generate')
 * @param {string} props.cancelLabel - Custom label for cancel button (default: 'Cancel')
 * @param {string} props.retryLabel - Custom label for retry button (default: 'Retry')
 */
const DocumentActionButtons = ({
  status,
  onGenerate,
  onCancel,
  onRetry,
  loading = false,
  generateLabel = 'Generate',
  cancelLabel = 'Cancel',
  retryLabel = 'Retry'
}) => {
  // Determine which buttons to show based on status
  const showGenerate = status === 'PENDING' && onGenerate;
  const showCancel = status === 'GENERATED' && onCancel;
  const showRetry = status === 'FAILED' && onRetry;

  // Don't render anything if no actions are available
  if (!showGenerate && !showCancel && !showRetry) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Generate Button */}
      {showGenerate && (
        <TouchableOpacity
          style={[styles.button, styles.generateButton, loading && styles.disabledButton]}
          onPress={onGenerate}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
          )}
          <Text style={styles.buttonText}>
            {loading ? 'Generating...' : generateLabel}
          </Text>
        </TouchableOpacity>
      )}

      {/* Cancel Button */}
      {showCancel && (
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, loading && styles.disabledButton]}
          onPress={onCancel}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
          )}
          <Text style={[styles.buttonText, styles.cancelButtonText]}>
            {loading ? 'Cancelling...' : cancelLabel}
          </Text>
        </TouchableOpacity>
      )}

      {/* Retry Button */}
      {showRetry && (
        <TouchableOpacity
          style={[styles.button, styles.retryButton, loading && styles.disabledButton]}
          onPress={onRetry}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="refresh-outline" size={20} color="#ffffff" />
          )}
          <Text style={styles.buttonText}>
            {loading ? 'Retrying...' : retryLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

DocumentActionButtons.propTypes = {
  status: PropTypes.oneOf(['PENDING', 'GENERATED', 'CANCELLED', 'FAILED']).isRequired,
  onGenerate: PropTypes.func,
  onCancel: PropTypes.func,
  onRetry: PropTypes.func,
  loading: PropTypes.bool,
  generateLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  retryLabel: PropTypes.string
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  generateButton: {
    backgroundColor: '#10b981',
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  retryButton: {
    backgroundColor: '#f59e0b',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButtonText: {
    color: '#ef4444',
  }
});

export default DocumentActionButtons;
module.exports = DocumentActionButtons;
