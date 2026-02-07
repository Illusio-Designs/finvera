import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../utils/formatters';

/**
 * TDSCalculationCard Component
 * 
 * Displays TDS calculation details including section selector, rate, calculated amount,
 * and deduction details. Auto-calculates TDS when amount or section changes.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.tdsDetails - TDS details object (section, rate, amount, etc.)
 * @param {number} props.amount - Transaction amount for TDS calculation
 * @param {Function} props.onSectionChange - Callback when TDS section changes (section)
 * @param {Function} props.onCalculate - Callback to trigger TDS calculation
 * @param {boolean} props.loading - Loading state indicator
 */
const TDSCalculationCard = ({
  tdsDetails,
  amount,
  onSectionChange,
  onCalculate,
  loading = false
}) => {
  const [selectorModalVisible, setSelectorModalVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState(tdsDetails?.section || null);

  // TDS sections with descriptions
  const TDS_SECTIONS = [
    { value: '194C', label: '194C - Contractor Payments', description: 'Payments to contractors and sub-contractors' },
    { value: '194J', label: '194J - Professional Services', description: 'Fees for professional or technical services' },
    { value: '194H', label: '194H - Commission', description: 'Commission or brokerage payments' },
    { value: '194I', label: '194I - Rent', description: 'Rent payments for land, building, or equipment' },
    { value: '194A', label: '194A - Interest', description: 'Interest payments other than on securities' },
    { value: '192', label: '192 - Salary', description: 'Salary payments to employees' },
    { value: '194D', label: '194D - Insurance Commission', description: 'Insurance commission payments' },
    { value: '194G', label: '194G - Lottery Winnings', description: 'Lottery, crossword puzzle, or game winnings' },
    { value: 'OTHER', label: 'Other', description: 'Other TDS sections' }
  ];

  // Auto-calculate TDS when amount or section changes
  useEffect(() => {
    if (amount && selectedSection && onCalculate) {
      onCalculate();
    }
  }, [amount, selectedSection]);

  // Update selected section when tdsDetails changes
  useEffect(() => {
    if (tdsDetails?.section) {
      setSelectedSection(tdsDetails.section);
    }
  }, [tdsDetails?.section]);

  const handleSectionSelect = async (section) => {
    setSelectedSection(section);
    setSelectorModalVisible(false);
    if (onSectionChange) {
      await onSectionChange(section);
    }
  };

  const handleSelectorOpen = () => {
    setSelectorModalVisible(true);
  };

  const handleSelectorClose = () => {
    setSelectorModalVisible(false);
  };

  // Get selected section label
  const getSelectedSectionLabel = () => {
    if (!selectedSection) return 'Select TDS Section';
    const section = TDS_SECTIONS.find(s => s.value === selectedSection);
    return section ? section.label : selectedSection;
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

  // Calculate net amount after TDS deduction
  const calculateNetAmount = () => {
    if (!amount || !tdsDetails?.amount) return amount || 0;
    return amount - tdsDetails.amount;
  };

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calculator-outline" size={24} color="#8b5cf6" />
          <Text style={styles.headerTitle}>TDS Calculation</Text>
        </View>
        {tdsDetails && (
          <View style={styles.calculatedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.calculatedText}>Calculated</Text>
          </View>
        )}
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Calculating TDS...</Text>
        </View>
      )}

      {/* TDS Section Selector */}
      <View style={styles.sectionContainer}>
        <Text style={styles.inputLabel}>TDS Section *</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={handleSelectorOpen}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.selectorText,
            !selectedSection && styles.selectorPlaceholder
          ]}>
            {getSelectedSectionLabel()}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* TDS Details - Show when calculated */}
      {tdsDetails && !loading && (
        <View style={styles.detailsContainer}>
          {/* TDS Rate */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TDS Rate:</Text>
            <Text style={styles.detailValue}>
              {tdsDetails.rate ? `${tdsDetails.rate}%` : 'N/A'}
            </Text>
          </View>

          {/* Transaction Amount */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction Amount:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(amount || 0)}
            </Text>
          </View>

          {/* TDS Amount */}
          <View style={styles.highlightRow}>
            <Text style={styles.highlightLabel}>TDS Amount:</Text>
            <Text style={styles.highlightValue}>
              {formatCurrency(tdsDetails.amount || 0)}
            </Text>
          </View>

          {/* Net Payable Amount */}
          <View style={styles.netAmountRow}>
            <Text style={styles.netAmountLabel}>Net Payable:</Text>
            <Text style={styles.netAmountValue}>
              {formatCurrency(calculateNetAmount())}
            </Text>
          </View>

          {/* Deductee Type */}
          {tdsDetails.deducteeType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Deductee Type:</Text>
              <Text style={styles.detailValue}>
                {tdsDetails.deducteeType}
              </Text>
            </View>
          )}

          {/* PAN Number */}
          {tdsDetails.panNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>PAN Number:</Text>
              <Text style={styles.detailValue} selectable>
                {tdsDetails.panNumber}
              </Text>
            </View>
          )}

          {/* Calculated At */}
          {tdsDetails.calculatedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Calculated At:</Text>
              <Text style={styles.detailValue}>
                {formatDate(tdsDetails.calculatedAt)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* No TDS Calculated Message */}
      {!tdsDetails && !loading && (
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#8b5cf6" />
          <Text style={styles.infoText}>
            Select a TDS section and enter transaction amount to calculate TDS
          </Text>
        </View>
      )}

      {/* TDS Section Selector Modal */}
      <Modal
        visible={selectorModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleSelectorClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select TDS Section</Text>
              <TouchableOpacity onPress={handleSelectorClose}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Section List */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {TDS_SECTIONS.map((section) => (
                <TouchableOpacity
                  key={section.value}
                  style={[
                    styles.sectionOption,
                    selectedSection === section.value && styles.sectionOptionActive
                  ]}
                  onPress={() => handleSectionSelect(section.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionOptionContent}>
                    <Text style={[
                      styles.sectionOptionLabel,
                      selectedSection === section.value && styles.sectionOptionLabelActive
                    ]}>
                      {section.label}
                    </Text>
                    <Text style={styles.sectionOptionDescription}>
                      {section.description}
                    </Text>
                  </View>
                  {selectedSection === section.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#8b5cf6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

TDSCalculationCard.propTypes = {
  tdsDetails: PropTypes.shape({
    section: PropTypes.string,
    rate: PropTypes.number,
    amount: PropTypes.number,
    deducteeType: PropTypes.string,
    panNumber: PropTypes.string,
    calculatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }),
  amount: PropTypes.number,
  onSectionChange: PropTypes.func.isRequired,
  onCalculate: PropTypes.func.isRequired,
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
  calculatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#d1fae5',
    gap: 4,
  },
  calculatedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
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
  sectionContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  selectorPlaceholder: {
    color: '#9ca3af',
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f3e8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  highlightLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  highlightValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  netAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  netAmountLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  netAmountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f5f3ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#8b5cf6',
    lineHeight: 20,
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
  sectionOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  sectionOptionActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#8b5cf6',
  },
  sectionOptionContent: {
    flex: 1,
    marginRight: 12,
  },
  sectionOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionOptionLabelActive: {
    color: '#8b5cf6',
  },
  sectionOptionDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});

export default TDSCalculationCard;
