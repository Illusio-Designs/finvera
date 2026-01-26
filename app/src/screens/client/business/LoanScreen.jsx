import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { finboxAPI } from '../../../lib/api';

export default function LoanScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [loanStatus, setLoanStatus] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationData, setApplicationData] = useState({
    amount: '',
    purpose: '',
    tenure: '12'
  });

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchLoanData = useCallback(async () => {
    try {
      const [statusRes, eligibilityRes] = await Promise.all([
        finboxAPI.loanStatus(),
        finboxAPI.checkEligibility()
      ]);
      
      setLoanStatus(statusRes.data || null);
      setEligibility(eligibilityRes.data || null);
    } catch (error) {
      console.error('Loan data fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load loan information'
      });
      setLoanStatus(null);
      setEligibility(null);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchLoanData();
  }, [fetchLoanData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLoanData();
    setRefreshing(false);
  }, [fetchLoanData]);

  const handleApplyLoan = async () => {
    if (!applicationData.amount || !applicationData.purpose) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    try {
      await finboxAPI.applyLoan({
        amount: parseFloat(applicationData.amount),
        purpose: applicationData.purpose,
        tenure: parseInt(applicationData.tenure)
      });
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Loan application submitted successfully'
      });
      
      setShowApplicationModal(false);
      setApplicationData({ amount: '', purpose: '', tenure: '12' });
      fetchLoanData();
    } catch (error) {
      console.error('Apply loan error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to submit loan application'
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'approved': '#10b981',
      'pending': '#f59e0b',
      'rejected': '#ef4444',
      'disbursed': '#3b82f6',
      'under_review': '#8b5cf6',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'approved': 'checkmark-circle',
      'pending': 'time',
      'rejected': 'close-circle',
      'disbursed': 'card',
      'under_review': 'eye',
    };
    return icons[status?.toLowerCase()] || 'help-circle';
  };

  // Default data if API doesn't return any
  const defaultEligibility = {
    eligible: true,
    max_amount: 500000,
    min_amount: 50000,
    interest_rate: 12.5,
    processing_fee: 2.5,
    credit_score: 750
  };

  const displayEligibility = eligibility || defaultEligibility;

  const loanPurposes = [
    'Business Expansion',
    'Working Capital',
    'Equipment Purchase',
    'Inventory Purchase',
    'Marketing & Advertising',
    'Technology Upgrade',
    'Office Setup',
    'Other'
  ];

  const tenureOptions = [
    { value: '6', label: '6 Months' },
    { value: '12', label: '12 Months' },
    { value: '18', label: '18 Months' },
    { value: '24', label: '24 Months' },
    { value: '36', label: '36 Months' }
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="Business Loan" 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.sectionTitle}>Business Loan</Text>
          <Text style={styles.sectionSubtitle}>
            Get instant business loans powered by FinBox
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading loan information...</Text>
            </View>
          </View>
        ) : (
          <>
            {/* Current Loan Status */}
            {loanStatus && (
              <View style={styles.loanStatusCard}>
                <View style={styles.loanStatusHeader}>
                  <View style={[
                    styles.loanStatusIcon,
                    { backgroundColor: getStatusColor(loanStatus.status) + '20' }
                  ]}>
                    <Ionicons 
                      name={getStatusIcon(loanStatus.status)} 
                      size={32} 
                      color={getStatusColor(loanStatus.status)} 
                    />
                  </View>
                  <View style={styles.loanStatusInfo}>
                    <Text style={styles.loanStatusTitle}>Current Loan Application</Text>
                    <View style={[
                      styles.loanStatusBadge,
                      { backgroundColor: getStatusColor(loanStatus.status) }
                    ]}>
                      <Text style={styles.loanStatusBadgeText}>
                        {loanStatus.status?.toUpperCase().replace('_', ' ') || 'PENDING'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.loanStatusDetails}>
                  <View style={styles.loanStatusDetail}>
                    <Text style={styles.loanStatusDetailLabel}>Loan Amount:</Text>
                    <Text style={styles.loanStatusDetailValue}>
                      {formatCurrency(loanStatus.amount)}
                    </Text>
                  </View>
                  <View style={styles.loanStatusDetail}>
                    <Text style={styles.loanStatusDetailLabel}>Applied On:</Text>
                    <Text style={styles.loanStatusDetailValue}>
                      {formatDate(loanStatus.applied_date)}
                    </Text>
                  </View>
                  <View style={styles.loanStatusDetail}>
                    <Text style={styles.loanStatusDetailLabel}>Application ID:</Text>
                    <Text style={styles.loanStatusDetailValue}>
                      {loanStatus.application_id || 'LN' + Date.now().toString().slice(-6)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Eligibility Card */}
            <View style={styles.eligibilityCard}>
              <View style={styles.eligibilityHeader}>
                <View style={styles.eligibilityIcon}>
                  <Ionicons name="shield-checkmark" size={32} color="#10b981" />
                </View>
                <View style={styles.eligibilityInfo}>
                  <Text style={styles.eligibilityTitle}>Loan Eligibility</Text>
                  <Text style={styles.eligibilitySubtitle}>
                    {displayEligibility.eligible ? 'You are eligible for a business loan!' : 'Not eligible at this time'}
                  </Text>
                </View>
              </View>

              {displayEligibility.eligible && (
                <View style={styles.eligibilityDetails}>
                  <View style={styles.eligibilityRow}>
                    <View style={styles.eligibilityItem}>
                      <Text style={styles.eligibilityLabel}>Max Amount</Text>
                      <Text style={styles.eligibilityValue}>
                        {formatCurrency(displayEligibility.max_amount)}
                      </Text>
                    </View>
                    <View style={styles.eligibilityItem}>
                      <Text style={styles.eligibilityLabel}>Interest Rate</Text>
                      <Text style={styles.eligibilityValue}>
                        {displayEligibility.interest_rate}% p.a.
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.eligibilityRow}>
                    <View style={styles.eligibilityItem}>
                      <Text style={styles.eligibilityLabel}>Processing Fee</Text>
                      <Text style={styles.eligibilityValue}>
                        {displayEligibility.processing_fee}%
                      </Text>
                    </View>
                    <View style={styles.eligibilityItem}>
                      <Text style={styles.eligibilityLabel}>Credit Score</Text>
                      <Text style={styles.eligibilityValue}>
                        {displayEligibility.credit_score}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {displayEligibility.eligible && !loanStatus && (
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => setShowApplicationModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={20} color="white" />
                  <Text style={styles.applyButtonText}>Apply for Loan</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Features */}
            <View style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>Why Choose Our Business Loans?</Text>
              
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="flash" size={24} color="#3e60ab" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Instant Approval</Text>
                    <Text style={styles.featureDescription}>
                      Get loan approval in minutes with our AI-powered system
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="document-text" size={24} color="#10b981" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Minimal Documentation</Text>
                    <Text style={styles.featureDescription}>
                      Simple application process with minimal paperwork
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="trending-down" size={24} color="#f59e0b" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Competitive Rates</Text>
                    <Text style={styles.featureDescription}>
                      Best-in-class interest rates starting from 12% p.a.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="calendar" size={24} color="#8b5cf6" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Flexible Tenure</Text>
                    <Text style={styles.featureDescription}>
                      Choose repayment tenure from 6 to 36 months
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* How It Works */}
            <View style={styles.howItWorksCard}>
              <Text style={styles.howItWorksTitle}>How It Works</Text>
              
              <View style={styles.stepsList}>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Check Eligibility</Text>
                    <Text style={styles.stepDescription}>
                      Instantly check your loan eligibility based on your business data
                    </Text>
                  </View>
                </View>

                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Apply Online</Text>
                    <Text style={styles.stepDescription}>
                      Fill out the simple application form with basic details
                    </Text>
                  </View>
                </View>

                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Get Approved</Text>
                    <Text style={styles.stepDescription}>
                      Receive instant approval and loan amount in your account
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Powered By FinBox */}
            <View style={styles.finboxCard}>
              <View style={styles.finboxHeader}>
                <View style={styles.finboxLogo}>
                  <Ionicons name="business" size={24} color="#3e60ab" />
                </View>
                <Text style={styles.finboxTitle}>Powered by FinBox</Text>
              </View>
              <Text style={styles.finboxDescription}>
                Our loan services are powered by FinBox, a leading fintech platform that provides 
                instant credit solutions for businesses across India.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Loan Application Modal */}
      <Modal
        visible={showApplicationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowApplicationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIcon}>
                <Ionicons name="document-text" size={20} color="#3e60ab" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Apply for Business Loan</Text>
                <Text style={styles.modalSubtitle}>Fill in the details below</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setShowApplicationModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.applicationForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Loan Amount *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter loan amount"
                  placeholderTextColor="#9ca3af"
                  value={applicationData.amount}
                  onChangeText={(text) => setApplicationData(prev => ({ ...prev, amount: text }))}
                  keyboardType="numeric"
                />
                <Text style={styles.formHint}>
                  Amount between {formatCurrency(displayEligibility.min_amount)} - {formatCurrency(displayEligibility.max_amount)}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Loan Purpose *</Text>
                <View style={styles.purposeGrid}>
                  {loanPurposes.map((purpose) => (
                    <TouchableOpacity
                      key={purpose}
                      style={[
                        styles.purposeOption,
                        applicationData.purpose === purpose && styles.purposeOptionSelected
                      ]}
                      onPress={() => setApplicationData(prev => ({ ...prev, purpose }))}
                    >
                      <Text style={[
                        styles.purposeOptionText,
                        applicationData.purpose === purpose && styles.purposeOptionTextSelected
                      ]}>
                        {purpose}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Repayment Tenure</Text>
                <View style={styles.tenureOptions}>
                  {tenureOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.tenureOption,
                        applicationData.tenure === option.value && styles.tenureOptionSelected
                      ]}
                      onPress={() => setApplicationData(prev => ({ ...prev, tenure: option.value }))}
                    >
                      <Text style={[
                        styles.tenureOptionText,
                        applicationData.tenure === option.value && styles.tenureOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.loanSummary}>
                <Text style={styles.loanSummaryTitle}>Loan Summary</Text>
                <View style={styles.loanSummaryItem}>
                  <Text style={styles.loanSummaryLabel}>Loan Amount:</Text>
                  <Text style={styles.loanSummaryValue}>
                    {applicationData.amount ? formatCurrency(parseFloat(applicationData.amount)) : '₹0'}
                  </Text>
                </View>
                <View style={styles.loanSummaryItem}>
                  <Text style={styles.loanSummaryLabel}>Interest Rate:</Text>
                  <Text style={styles.loanSummaryValue}>{displayEligibility.interest_rate}% p.a.</Text>
                </View>
                <View style={styles.loanSummaryItem}>
                  <Text style={styles.loanSummaryLabel}>Processing Fee:</Text>
                  <Text style={styles.loanSummaryValue}>
                    {applicationData.amount ? 
                      formatCurrency((parseFloat(applicationData.amount) * displayEligibility.processing_fee) / 100) : 
                      '₹0'
                    }
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleApplyLoan}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit Application</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingCard: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  spinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    borderTopColor: '#3e60ab',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  loanStatusCard: {
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
  loanStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  loanStatusIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loanStatusInfo: {
    flex: 1,
  },
  loanStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 8,
  },
  loanStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  loanStatusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  loanStatusDetails: {
    gap: 12,
  },
  loanStatusDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanStatusDetailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  loanStatusDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  eligibilityCard: {
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
  eligibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  eligibilityIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eligibilityInfo: {
    flex: 1,
  },
  eligibilityTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  eligibilitySubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 20,
  },
  eligibilityDetails: {
    marginBottom: 20,
    gap: 16,
  },
  eligibilityRow: {
    flexDirection: 'row',
    gap: 16,
  },
  eligibilityItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  eligibilityLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Agency',
    marginBottom: 4,
    textAlign: 'center',
  },
  eligibilityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3e60ab',
    fontFamily: 'Agency',
    textAlign: 'center',
  },
  applyButton: {
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
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  featuresCard: {
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
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 20,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 20,
  },
  howItWorksCard: {
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
  howItWorksTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 20,
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3e60ab',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Agency',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 20,
  },
  finboxCard: {
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
  finboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  finboxLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  finboxTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  finboxDescription: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 20,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  applicationForm: {
    gap: 24,
  },
  formGroup: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 12,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 8,
  },
  formHint: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  purposeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  purposeOptionSelected: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  purposeOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  purposeOptionTextSelected: {
    color: 'white',
  },
  tenureOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tenureOption: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  tenureOptionSelected: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
  },
  tenureOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  tenureOptionTextSelected: {
    color: 'white',
  },
  loanSummary: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  loanSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  loanSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loanSummaryLabel: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  loanSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  submitButton: {
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
});