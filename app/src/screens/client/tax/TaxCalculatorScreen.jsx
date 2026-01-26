import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { taxAPI } from '../../../lib/api';

export default function TaxCalculatorScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    totalIncome: '',
    deductions: '',
    exemptions: '',
    previousTaxPaid: '',
  });
  const [calculationResult, setCalculationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTax = async () => {
    if (!formData.totalIncome) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your total income'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await taxAPI.incomeTax.calculate({
        total_income: parseFloat(formData.totalIncome) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        exemptions: parseFloat(formData.exemptions) || 0,
        previous_tax_paid: parseFloat(formData.previousTaxPaid) || 0,
      });
      
      setCalculationResult(response.data);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Tax calculation completed'
      });
    } catch (error) {
      console.error('Tax calculation error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to calculate tax'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      totalIncome: '',
      deductions: '',
      exemptions: '',
      previousTaxPaid: '',
    });
    setCalculationResult(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <View style={styles.container}>
      <TopBar 
        title="Tax Calculator" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.sectionTitle}>Income Tax Calculator</Text>
          <Text style={styles.sectionSubtitle}>
            Calculate your income tax liability for the current assessment year
          </Text>
        </View>

        {/* Input Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Income Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Annual Income *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your total annual income"
                value={formData.totalIncome}
                onChangeText={(value) => handleInputChange('totalIncome', value)}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Deductions (80C, 80D, etc.)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="remove-circle-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.textInput}
                placeholder="Enter total deductions"
                value={formData.deductions}
                onChangeText={(value) => handleInputChange('deductions', value)}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Exemptions (HRA, LTA, etc.)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="shield-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.textInput}
                placeholder="Enter total exemptions"
                value={formData.exemptions}
                onChangeText={(value) => handleInputChange('exemptions', value)}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Previous Tax Paid (TDS/Advance Tax)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="card-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.textInput}
                placeholder="Enter tax already paid"
                value={formData.previousTaxPaid}
                onChangeText={(value) => handleInputChange('previousTaxPaid', value)}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.calculateButton}
              onPress={calculateTax}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingSpinner} />
              ) : (
                <Ionicons name="calculator" size={20} color="white" />
              )}
              <Text style={styles.calculateButtonText}>
                {loading ? 'Calculating...' : 'Calculate Tax'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearForm}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color="#64748b" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calculation Result */}
        {calculationResult && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}>
                <Ionicons name="calculator" size={24} color="#3e60ab" />
              </View>
              <Text style={styles.resultTitle}>Tax Calculation Result</Text>
            </View>

            <View style={styles.resultGrid}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Gross Income</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(calculationResult.gross_income)}
                </Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Total Deductions</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(calculationResult.total_deductions)}
                </Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Taxable Income</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(calculationResult.taxable_income)}
                </Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Tax Before Cess</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(calculationResult.tax_before_cess)}
                </Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Health & Education Cess</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(calculationResult.cess)}
                </Text>
              </View>

              <View style={[styles.resultItem, styles.totalTaxItem]}>
                <Text style={styles.totalTaxLabel}>Total Tax Liability</Text>
                <Text style={styles.totalTaxValue}>
                  {formatCurrency(calculationResult.total_tax)}
                </Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Tax Already Paid</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(calculationResult.tax_paid)}
                </Text>
              </View>

              <View style={[styles.resultItem, styles.finalResultItem]}>
                <Text style={styles.finalResultLabel}>
                  {calculationResult.balance_tax >= 0 ? 'Tax Payable' : 'Refund Due'}
                </Text>
                <Text style={[
                  styles.finalResultValue,
                  { color: calculationResult.balance_tax >= 0 ? '#ef4444' : '#10b981' }
                ]}>
                  {formatCurrency(Math.abs(calculationResult.balance_tax))}
                </Text>
              </View>
            </View>

            {/* Tax Slabs Information */}
            <View style={styles.taxSlabsContainer}>
              <Text style={styles.taxSlabsTitle}>Tax Slabs Applied</Text>
              {calculationResult.tax_slabs?.map((slab, index) => (
                <View key={index} style={styles.taxSlabItem}>
                  <Text style={styles.taxSlabRange}>
                    {formatCurrency(slab.min)} - {slab.max ? formatCurrency(slab.max) : 'Above'}
                  </Text>
                  <Text style={styles.taxSlabRate}>{slab.rate}%</Text>
                  <Text style={styles.taxSlabTax}>{formatCurrency(slab.tax)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tax Saving Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color="#f59e0b" />
            <Text style={styles.tipsTitle}>Tax Saving Tips</Text>
          </View>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.tipText}>
                Maximize Section 80C deductions (₹1.5 lakh limit)
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.tipText}>
                Claim medical insurance under Section 80D
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.tipText}>
                Consider NPS investment for additional ₹50,000 deduction
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.tipText}>
                Plan HRA and LTA exemptions properly
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerSection: {
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    fontFamily: 'Agency',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 24,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Agency',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  calculateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'Agency',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  resultGrid: {
    gap: 16,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resultLabel: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    flex: 1,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  totalTaxItem: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderBottomWidth: 0,
    marginVertical: 8,
  },
  totalTaxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    flex: 1,
  },
  totalTaxValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  finalResultItem: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderBottomWidth: 0,
    marginTop: 8,
  },
  finalResultLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    flex: 1,
  },
  finalResultValue: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Agency',
  },
  taxSlabsContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  taxSlabsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  taxSlabItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  taxSlabRange: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Agency',
    flex: 2,
  },
  taxSlabRate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    flex: 1,
    textAlign: 'center',
  },
  taxSlabTax: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3e60ab',
    fontFamily: 'Agency',
    flex: 1,
    textAlign: 'right',
  },
  tipsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    flex: 1,
    lineHeight: 20,
  },
});