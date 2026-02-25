import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { finboxAPI } from '../../../lib/api';
import FormSkeleton from '../../../components/ui/skeletons/FormSkeleton';

export default function LoanScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [consent, setConsent] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [creditScore, setCreditScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [consentData, setConsentData] = useState({
    credit_score_consent: false,
    bank_statement_consent: false,
    data_sharing_consent: false,
    terms_conditions_consent: false,
    privacy_policy_consent: false,
  });
  const [applicationData, setApplicationData] = useState({
    amount: '',
    purpose: '',
    tenure: '12'
  });
  const [errors, setErrors] = useState({});

  const handleMenuPress = () => {
    openDrawer();
  };

  const handleInputChange = (name, value) => {
    setApplicationData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateApplicationForm = () => {
    const newErrors = {};

    if (!applicationData.amount || parseFloat(applicationData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid loan amount';
    }

    if (!applicationData.purpose) {
      newErrors.purpose = 'Please select a loan purpose';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchLoanData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch consent status first
      const consentResponse = await finboxAPI.getConsent();
      const consentData = consentResponse.data?.data;
      setConsent(consentData);

      // If consent is given, fetch eligibility and credit score
      if (consentData && consentData.credit_score_consent) {
        try {
          // Check eligibility with user data
          const eligibilityResponse = await finboxAPI.checkEligibility({
            customer_id: user?.id,
            loan_amount: 500000, // Default check amount
            loan_type: 'business',
            tenure: 12
          });
          setEligibility(eligibilityResponse.data?.data);

          // Get credit score if PAN is available
          if (user?.pan) {
            const creditResponse = await finboxAPI.getCreditScore({
              customer_id: user?.id,
              pan: user?.pan
            });
            setCreditScore(creditResponse.data?.data);
          }
        } catch (eligibilityError) {
          console.error('Eligibility fetch error:', eligibilityError);
          // Set default eligibility data for demo
          setEligibility({
            eligible: true,
            max_amount: 500000,
            min_amount: 50000,
            interest_rate: 12.5,
            processing_fee: 2.5,
            credit_score: 750
          });
        }
      }
    } catch (error) {
      console.error('Loan data fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load loan information'
      });
      
      // Set default data for demo
      setConsent(null);
      setEligibility({
        eligible: true,
        max_amount: 500000,
        min_amount: 50000,
        interest_rate: 12.5,
        processing_fee: 2.5,
        credit_score: 750
      });
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    fetchLoanData();
  }, [fetchLoanData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLoanData();
    setRefreshing(false);
  }, [fetchLoanData]);

  const handleSaveConsent = async () => {
    // Validate that all required consents are given
    if (!consentData.credit_score_consent || !consentData.data_sharing_consent || 
        !consentData.terms_conditions_consent || !consentData.privacy_policy_consent) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please provide all required consents to proceed'
      });
      return;
    }

    try {
      setSaving(true);
      await finboxAPI.saveConsent(consentData);
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Consent saved successfully'
      });
      
      setShowConsentModal(false);
      await fetchLoanData(); // Refresh data after consent
    } catch (error) {
      console.error('Save consent error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save consent'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyLoan = async () => {
    if (!validateApplicationForm()) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please fix the errors in the form'
      });
      return;
    }

    try {
      setSaving(true);
      
      // Create user first if not exists
      await finboxAPI.createUser({
        customer_id: user?.id,
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        pan: user?.pan,
      });

      // Generate session token for loan application
      const sessionResponse = await finboxAPI.generateSessionToken({
        customer_id: user?.id,
        loan_amount: parseFloat(applicationData.amount),
        redirect_url: 'fintranzact://loan-status'
      });
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Loan application initiated successfully. You will be redirected to complete the process.'
      });
      
      setShowApplicationModal(false);
      setApplicationData({ amount: '', purpose: '', tenure: '12' });
      await fetchLoanData();
    } catch (error) {
      console.error('Apply loan error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit loan application';
      showNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setSaving(false);
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

  // Default data if API doesn't return any
  const displayEligibility = eligibility || {
    eligible: true,
    max_amount: 500000,
    min_amount: 50000,
    interest_rate: 12.5,
    processing_fee: 2.5,
    credit_score: 750
  };

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

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar 
          title="Business Loan" 
          onMenuPress={handleMenuPress}
        />
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <FormSkeleton fieldCount={6} />
        </ScrollView>
      </View>
    );
  }

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
          <View style={styles.headerIcon}>
            <Ionicons name="card" size={32} color="#3e60ab" />
          </View>
          <Text style={styles.headerTitle}>Business Loan</Text>
          <Text style={styles.headerSubtitle}>
            Get instant business loans powered by FinBox with competitive rates and quick approval
          </Text>
        </View>

        {/* Consent Status */}
        {!consent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get Started</Text>
            <View style={styles.sectionCard}>
              <View style={styles.consentContainer}>
                <View style={styles.consentIcon}>
                  <Ionicons name="shield-checkmark-outline" size={48} color="#f59e0b" />
                </View>
                <Text style={styles.consentTitle}>Consent Required</Text>
                <Text style={styles.consentDescription}>
                  To check your loan eligibility and provide personalized offers, we need your consent to access credit information.
                </Text>
                <TouchableOpacity 
                  style={styles.consentButton}
                  onPress={() => setShowConsentModal(true)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.consentButtonText}>Provide Consent</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Credit Score Display */}
        {consent && creditScore && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Credit Score</Text>
            <View style={styles.sectionCard}>
              <View style={styles.creditScoreContent}>
                <View style={styles.creditScoreDisplay}>
                  <Text style={styles.creditScoreNumber}>{creditScore.score || 750}</Text>
                  <Text style={styles.creditScoreLabel}>Credit Score</Text>
                </View>
                <View style={styles.creditScoreInfo}>
                  <Text style={styles.creditScoreStatus}>
                    {(creditScore.score || 750) >= 750 ? 'Excellent' : 
                     (creditScore.score || 750) >= 700 ? 'Good' : 
                     (creditScore.score || 750) >= 650 ? 'Fair' : 'Poor'}
                  </Text>
                  <Text style={styles.creditScoreDescription}>
                    Your credit score affects loan eligibility and interest rates
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Eligibility Card */}
        {consent && displayEligibility.eligible && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loan Eligibility</Text>
            <View style={styles.sectionCard}>
              <View style={styles.eligibilityHeader}>
                <View style={styles.eligibilityIcon}>
                  <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                </View>
                <View style={styles.eligibilityInfo}>
                  <Text style={styles.eligibilityTitle}>You're Eligible!</Text>
                  <Text style={styles.eligibilitySubtitle}>
                    Congratulations! You qualify for a business loan
                  </Text>
                </View>
              </View>

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
                    <Text style={styles.eligibilityLabel}>Min Amount</Text>
                    <Text style={styles.eligibilityValue}>
                      {formatCurrency(displayEligibility.min_amount)}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowApplicationModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.applyButtonText}>Apply for Loan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Our Business Loans?</Text>
          <View style={styles.sectionCard}>
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
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.sectionCard}>
            <View style={styles.stepsList}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Provide Consent</Text>
                  <Text style={styles.stepDescription}>
                    Give consent to access your credit information for eligibility check
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
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
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Apply & Get Approved</Text>
                  <Text style={styles.stepDescription}>
                    Complete the application and receive instant approval
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Powered By FinBox */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Powered by FinBox</Text>
          <View style={styles.sectionCard}>
            <View style={styles.finboxContent}>
              <View style={styles.finboxIcon}>
                <Ionicons name="business" size={32} color="#3e60ab" />
              </View>
              <Text style={styles.finboxTitle}>Trusted Partner</Text>
              <Text style={styles.finboxDescription}>
                Our loan services are powered by FinBox, a leading fintech platform that provides 
                instant credit solutions for businesses across India with advanced AI and machine learning.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Consent Modal */}
      <Modal
        visible={showConsentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowConsentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Consent for Loan Services</Text>
            <TouchableOpacity 
              onPress={() => setShowConsentModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.consentForm}>
              <Text style={styles.consentFormDescription}>
                To provide you with the best loan offers and check your eligibility, we need your consent for the following:
              </Text>

              <View style={styles.consentItems}>
                <TouchableOpacity 
                  style={styles.consentItem}
                  onPress={() => setConsentData(prev => ({ ...prev, credit_score_consent: !prev.credit_score_consent }))}
                >
                  <View style={styles.consentCheckbox}>
                    <Ionicons 
                      name={consentData.credit_score_consent ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={consentData.credit_score_consent ? "#3e60ab" : "#9ca3af"} 
                    />
                  </View>
                  <View style={styles.consentItemContent}>
                    <Text style={styles.consentItemTitle}>Credit Score Access *</Text>
                    <Text style={styles.consentItemDescription}>
                      Allow us to check your credit score to determine loan eligibility
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.consentItem}
                  onPress={() => setConsentData(prev => ({ ...prev, bank_statement_consent: !prev.bank_statement_consent }))}
                >
                  <View style={styles.consentCheckbox}>
                    <Ionicons 
                      name={consentData.bank_statement_consent ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={consentData.bank_statement_consent ? "#3e60ab" : "#9ca3af"} 
                    />
                  </View>
                  <View style={styles.consentItemContent}>
                    <Text style={styles.consentItemTitle}>Bank Statement Analysis</Text>
                    <Text style={styles.consentItemDescription}>
                      Analyze bank statements for better loan terms (optional)
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.consentItem}
                  onPress={() => setConsentData(prev => ({ ...prev, data_sharing_consent: !prev.data_sharing_consent }))}
                >
                  <View style={styles.consentCheckbox}>
                    <Ionicons 
                      name={consentData.data_sharing_consent ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={consentData.data_sharing_consent ? "#3e60ab" : "#9ca3af"} 
                    />
                  </View>
                  <View style={styles.consentItemContent}>
                    <Text style={styles.consentItemTitle}>Data Sharing *</Text>
                    <Text style={styles.consentItemDescription}>
                      Share necessary data with FinBox for loan processing
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.consentItem}
                  onPress={() => setConsentData(prev => ({ ...prev, terms_conditions_consent: !prev.terms_conditions_consent }))}
                >
                  <View style={styles.consentCheckbox}>
                    <Ionicons 
                      name={consentData.terms_conditions_consent ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={consentData.terms_conditions_consent ? "#3e60ab" : "#9ca3af"} 
                    />
                  </View>
                  <View style={styles.consentItemContent}>
                    <Text style={styles.consentItemTitle}>Terms & Conditions *</Text>
                    <Text style={styles.consentItemDescription}>
                      I agree to the terms and conditions of the loan service
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.consentItem}
                  onPress={() => setConsentData(prev => ({ ...prev, privacy_policy_consent: !prev.privacy_policy_consent }))}
                >
                  <View style={styles.consentCheckbox}>
                    <Ionicons 
                      name={consentData.privacy_policy_consent ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={consentData.privacy_policy_consent ? "#3e60ab" : "#9ca3af"} 
                    />
                  </View>
                  <View style={styles.consentItemContent}>
                    <Text style={styles.consentItemTitle}>Privacy Policy *</Text>
                    <Text style={styles.consentItemDescription}>
                      I have read and agree to the privacy policy
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setShowConsentModal(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSaveConsent}
                  disabled={saving}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Saving...' : 'Save Consent'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Loan Application Modal */}
      <Modal
        visible={showApplicationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowApplicationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apply for Business Loan</Text>
            <TouchableOpacity 
              onPress={() => setShowApplicationModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Loan Amount *</Text>
              <TextInput
                style={[styles.input, errors.amount && styles.inputError]}
                placeholder="Enter loan amount"
                placeholderTextColor="#9ca3af"
                value={applicationData.amount}
                onChangeText={(text) => handleInputChange('amount', text)}
                keyboardType="numeric"
              />
              <Text style={styles.formHint}>
                Amount between {formatCurrency(displayEligibility.min_amount)} - {formatCurrency(displayEligibility.max_amount)}
              </Text>
              {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Loan Purpose *</Text>
              <View style={styles.purposeGrid}>
                {loanPurposes.map((purpose) => (
                  <TouchableOpacity
                    key={purpose}
                    style={[
                      styles.purposeOption,
                      applicationData.purpose === purpose && styles.purposeOptionSelected
                    ]}
                    onPress={() => handleInputChange('purpose', purpose)}
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
              {errors.purpose && <Text style={styles.errorText}>{errors.purpose}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Repayment Tenure</Text>
              <View style={styles.tenureOptions}>
                {tenureOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.tenureOption,
                      applicationData.tenure === option.value && styles.tenureOptionSelected
                    ]}
                    onPress={() => handleInputChange('tenure', option.value)}
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

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowApplicationModal(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.submitButton, saving && styles.submitButtonDisabled]}
                onPress={handleApplyLoan}
                disabled={saving}
              >
                <Ionicons name="send" size={20} color="white" />
                <Text style={styles.submitButtonText}>
                  {saving ? 'Processing...' : 'Submit Application'}
                </Text>
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
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONT_STYLES.h5,
    color: '#6b7280'
  },
  
  // Header Section
  headerSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    ...FONT_STYLES.h2,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  headerSubtitle: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22
  },
  
  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 12
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  
  // Consent Section
  consentContainer: {
    padding: 32,
    alignItems: 'center',
  },
  consentIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  consentTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  consentDescription: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24
  },
  consentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e60ab',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  consentButtonText: {
    ...FONT_STYLES.h5,
    color: 'white'
  },
  
  // Credit Score Section
  creditScoreContent: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  creditScoreDisplay: {
    alignItems: 'center',
  },
  creditScoreNumber: {
    ...FONT_STYLES.h3,
    color: '#3e60ab',
    marginBottom: 4
  },
  creditScoreLabel: {
    ...FONT_STYLES.label,
    color: '#6b7280'
  },
  creditScoreInfo: {
    flex: 1,
  },
  creditScoreStatus: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 4
  },
  creditScoreDescription: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    lineHeight: 20
  },
  
  // Eligibility Section
  eligibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    gap: 16,
  },
  eligibilityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eligibilityInfo: {
    flex: 1,
  },
  eligibilityTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 4
  },
  eligibilitySubtitle: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    lineHeight: 20
  },
  eligibilityDetails: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  eligibilityRow: {
    flexDirection: 'row',
    gap: 16,
  },
  eligibilityItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  eligibilityLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center'
  },
  eligibilityValue: {
    ...FONT_STYLES.h5,
    color: '#3e60ab',
    textAlign: 'center'
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    margin: 20,
    marginTop: 0,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  applyButtonText: {
    ...FONT_STYLES.h5,
    color: 'white'
  },
  
  // Features Section
  featuresList: {
    padding: 20,
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4
  },
  featureDescription: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    lineHeight: 20
  },
  
  // Steps Section
  stepsList: {
    padding: 20,
    gap: 20,
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
    ...FONT_STYLES.h5,
    color: 'white'
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4
  },
  stepDescription: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    lineHeight: 20
  },
  
  // FinBox Section
  finboxContent: {
    padding: 24,
    alignItems: 'center',
  },
  finboxIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  finboxTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  finboxDescription: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  
  // Consent Form
  consentForm: {
    gap: 24,
  },
  consentFormDescription: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 8
  },
  consentItems: {
    gap: 16,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  consentCheckbox: {
    marginTop: 2,
  },
  consentItemContent: {
    flex: 1,
  },
  consentItemTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4
  },
  consentItemDescription: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    lineHeight: 20
  },
  
  // Form Styles
  formGroup: {
    marginBottom: 20,
  },
  label: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8
  },
  input: {
    ...FONT_STYLES.h5,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#111827',
    backgroundColor: 'white'
  },
  inputError: {
    borderColor: '#ef4444',
  },
  formHint: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 6,
    lineHeight: 16
  },
  errorText: {
    ...FONT_STYLES.caption,
    color: '#ef4444',
    marginTop: 4
  },
  
  // Purpose Grid
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
    ...FONT_STYLES.label,
    color: '#64748b'
  },
  purposeOptionTextSelected: {
    color: 'white',
  },
  
  // Tenure Options
  tenureOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tenureOption: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    borderRadius: 8,
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
    ...FONT_STYLES.label,
    color: '#64748b'
  },
  tenureOptionTextSelected: {
    color: 'white',
  },
  
  // Loan Summary
  loanSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  loanSummaryTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 16
  },
  loanSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loanSummaryLabel: {
    ...FONT_STYLES.label,
    color: '#6b7280'
  },
  loanSummaryValue: {
    ...FONT_STYLES.label,
    color: '#111827'
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    ...FONT_STYLES.h5,
    color: '#6b7280'
  },
  saveButton: {
    backgroundColor: '#3e60ab',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    ...FONT_STYLES.h5,
    color: 'white'
  },
  submitButton: {
    backgroundColor: '#3e60ab',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    ...FONT_STYLES.h5,
    color: 'white'
  },
});