import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import * as Clipboard from 'expo-clipboard';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { referralAPI } from '../../../lib/api';
import { SkeletonStatCard } from '../../../components/ui/SkeletonLoader';

export default function ReferralScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState(null);
  const [discountConfig, setDiscountConfig] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchReferralData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch referral code (most important)
      try {
        const codeResponse = await referralAPI.getMyCode();
        const codeData = codeResponse.data?.referralCode || codeResponse.data;
        setReferralCode(codeData);
      } catch (codeError) {
        console.error('Referral code fetch error:', codeError);
        // Set demo data for referral code
        setReferralCode({
          code: 'DEMO123',
          discount_type: 'percentage',
          discount_value: 10,
          free_trial_days: 30,
          total_uses: 0
        });
      }

      // Try to fetch discount config
      try {
        const configResponse = await referralAPI.getCurrentDiscountConfig();
        const configData = configResponse.data?.config || configResponse.data;
        setDiscountConfig(configData);
      } catch (configError) {
        console.error('Discount config fetch error:', configError);
        // Provide fallback config
        setDiscountConfig({
          discount_percentage: 10,
          free_trial_days: 30
        });
      }

      // Don't fetch analytics for regular users - it's admin-only
      // Analytics will remain null for regular users
      setAnalytics(null);
      
    } catch (error) {
      console.error('Referral data fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load referral data'
      });
      
      // Set default data for demo
      setReferralCode({
        code: 'DEMO123',
        discount_type: 'percentage',
        discount_value: 10,
        free_trial_days: 30,
        total_uses: 0
      });
      setDiscountConfig({
        discount_percentage: 10,
        free_trial_days: 30
      });
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReferralData();
    setRefreshing(false);
  }, [fetchReferralData]);

  const handleCopyReferralLink = async () => {
    try {
      const referralLink = getReferralLink();
      await Clipboard.setStringAsync(referralLink);
      showNotification({
        type: 'success',
        title: 'Copied',
        message: 'Referral link copied to clipboard'
      });
    } catch (error) {
      console.error('Copy error:', error);
      // Fallback to share if clipboard fails
      try {
        await Share.share({
          message: `Join Fintranzact using my referral code "${referralCode?.code}" and get ${referralCode?.discount_value || 10}% discount plus ${referralCode?.free_trial_days || 30} days free trial! ${getReferralLink()}`,
          title: 'Join Fintranzact with my referral',
        });
        showNotification({
          type: 'success',
          title: 'Shared',
          message: 'Referral link shared successfully'
        });
      } catch (shareError) {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to copy or share referral link'
        });
      }
    }
  };

  const handleShareReferral = async () => {
    try {
      const referralLink = getReferralLink();
      const message = `Join Fintranzact using my referral code "${referralCode?.code}" and get ${referralCode?.discount_value || 10}% discount plus ${referralCode?.free_trial_days || 30} days free trial! ${referralLink}`;
      
      await Share.share({
        message: message,
        url: referralLink,
        title: 'Join Fintranzact with my referral',
      });
    } catch (error) {
      console.error('Share error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to share referral link'
      });
    }
  };

  const getReferralLink = () => {
    const baseUrl = 'https://fintranzact.com/register';
    const code = referralCode?.code || 'DEMO123';
    return `${baseUrl}?ref=${code}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatsData = () => {
    // Calculate stats from available data
    const totalReferrals = referralCode?.total_uses || referralCode?.current_uses || 0;
    
    return {
      totalReferrals,
      discountOffered: referralCode?.discount_value || 10,
      trialDays: referralCode?.free_trial_days || 30
    };
  };

  const stats = getStatsData();

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar 
          title="Referral Program" 
          onMenuPress={handleMenuPress}
        />
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerSection}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#e5e7eb', marginBottom: 16 }} />
            <View style={{ width: 200, height: 24, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
            <View style={{ width: 300, height: 16, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
          </View>
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar 
        title="Referral Program" 
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
            <Ionicons name="people" size={32} color="#3e60ab" />
          </View>
          <Text style={styles.headerTitle}>Referral Program</Text>
          <Text style={styles.headerSubtitle}>
            Earn rewards by referring friends and colleagues to Fintranzact
          </Text>
        </View>

        {/* Referral Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referral Program</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="people" size={24} color="#3e60ab" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.totalReferrals}</Text>
                <Text style={styles.statLabel}>Total Uses</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="pricetag" size={24} color="#10b981" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.discountOffered}%</Text>
                <Text style={styles.statLabel}>Discount</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="calendar" size={24} color="#f59e0b" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.trialDays}</Text>
                <Text style={styles.statLabel}>Trial Days</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Referral Code Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
          <View style={styles.sectionCard}>
            <View style={styles.referralCodeHeader}>
              <View style={styles.referralCodeIcon}>
                <Ionicons name="ticket" size={32} color="#3e60ab" />
              </View>
              <View style={styles.referralCodeInfo}>
                <Text style={styles.referralCodeTitle}>Referral Code</Text>
                <Text style={styles.referralCodeSubtitle}>
                  Share this code to earn rewards
                </Text>
              </View>
            </View>
            
            <View style={styles.referralCodeDisplay}>
              <Text style={styles.referralCodeText}>{referralCode?.code || 'DEMO123'}</Text>
              <TouchableOpacity 
                style={styles.copyCodeButton}
                onPress={handleCopyReferralLink}
              >
                <Ionicons name="copy" size={16} color="#3e60ab" />
              </TouchableOpacity>
            </View>

            <View style={styles.referralBenefits}>
              <View style={styles.benefitItem}>
                <Ionicons name="pricetag" size={16} color="#10b981" />
                <Text style={styles.benefitText}>
                  {referralCode?.discount_value || 10}% discount for new users
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="calendar" size={16} color="#3e60ab" />
                <Text style={styles.benefitText}>
                  {referralCode?.free_trial_days || 30} days free trial
                </Text>
              </View>
            </View>
            
            <View style={styles.referralActions}>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleShareReferral}
                activeOpacity={0.8}
              >
                <Ionicons name="share" size={20} color="white" />
                <Text style={styles.shareButtonText}>Share Code</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={handleCopyReferralLink}
                activeOpacity={0.8}
              >
                <Ionicons name="link" size={20} color="#3e60ab" />
                <Text style={styles.linkButtonText}>Copy Link</Text>
              </TouchableOpacity>
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
                  <Text style={styles.stepTitle}>Share Your Code</Text>
                  <Text style={styles.stepDescription}>
                    Share your unique referral code with friends and colleagues
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>They Sign Up</Text>
                  <Text style={styles.stepDescription}>
                    Your referrals sign up using your code and get instant benefits
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Earn Rewards</Text>
                  <Text style={styles.stepDescription}>
                    Get rewarded for each successful referral that subscribes
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referral Benefits</Text>
          <View style={styles.sectionCard}>
            <View style={styles.benefitsContent}>
              <View style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="pricetag" size={32} color="#10b981" />
                </View>
                <Text style={styles.benefitTitle}>Instant Discount</Text>
                <Text style={styles.benefitDescription}>
                  New users get {referralCode?.discount_value || 10}% off their first bill when they use your code
                </Text>
              </View>

              <View style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="calendar" size={32} color="#3e60ab" />
                </View>
                <Text style={styles.benefitTitle}>Free Trial</Text>
                <Text style={styles.benefitDescription}>
                  Plus {referralCode?.free_trial_days || 30} days of free trial to explore all features
                </Text>
              </View>

              <View style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="rocket" size={32} color="#f59e0b" />
                </View>
                <Text style={styles.benefitTitle}>Quick Setup</Text>
                <Text style={styles.benefitDescription}>
                  Instant activation - no waiting period or complex approval process
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <View style={styles.sectionCard}>
            <View style={styles.termsContent}>
              <View style={styles.termItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.termText}>
                  Rewards are credited after successful subscription
                </Text>
              </View>
              <View style={styles.termItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.termText}>
                  Minimum subscription period of 3 months required
                </Text>
              </View>
              <View style={styles.termItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.termText}>
                  Rewards are processed within 30 days of qualification
                </Text>
              </View>
              <View style={styles.termItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.termText}>
                  Self-referrals and fraudulent activities are not allowed
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share Referral</Text>
            <TouchableOpacity 
              onPress={() => setShowShareModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.shareContent}>
              <View style={styles.shareIcon}>
                <Ionicons name="share" size={48} color="#3e60ab" />
              </View>
              <Text style={styles.shareTitle}>Share Your Referral</Text>
              <Text style={styles.shareDescription}>
                Choose how you'd like to share your referral code with others
              </Text>
              
              <View style={styles.shareOptions}>
                <TouchableOpacity 
                  style={styles.shareOption}
                  onPress={handleShareReferral}
                >
                  <Ionicons name="share" size={24} color="#3e60ab" />
                  <Text style={styles.shareOptionText}>Share via Apps</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.shareOption}
                  onPress={handleCopyReferralLink}
                >
                  <Ionicons name="copy" size={24} color="#3e60ab" />
                  <Text style={styles.shareOptionText}>Copy Link</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
    marginBottom: 12,
    paddingHorizontal: 4
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  
  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statInfo: {
    alignItems: 'center',
  },
  statValue: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 4
  },
  statLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    textAlign: 'center'
  },
  
  // Referral Code Section
  referralCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
    gap: 16,
  },
  referralCodeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralCodeInfo: {
    flex: 1,
  },
  referralCodeTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 6
  },
  referralCodeSubtitle: {
    ...FONT_STYLES.body,
    color: '#6b7280'
  },
  referralCodeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  referralCodeText: {
    ...FONT_STYLES.h3,
    flex: 1,
    color: '#3e60ab',
    letterSpacing: 2
  },
  copyCodeButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  referralBenefits: {
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    ...FONT_STYLES.body,
    color: '#6b7280'
  },
  referralActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  shareButtonText: {
    ...FONT_STYLES.body,
    color: 'white'
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#3e60ab',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  linkButtonText: {
    ...FONT_STYLES.body,
    color: '#3e60ab'
  },
  
  // Steps Section
  stepsList: {
    padding: 24,
    gap: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3e60ab',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumberText: {
    ...FONT_STYLES.h5,
    color: 'white'
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 8
  },
  stepDescription: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    lineHeight: 22
  },
  
  // Benefits Section
  benefitsContent: {
    padding: 24,
    gap: 24,
  },
  benefitCard: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 24,
  },
  benefitIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center'
  },
  benefitDescription: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22
  },
  
  // Terms Section
  termsContent: {
    padding: 20,
    gap: 12,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  termText: {
    ...FONT_STYLES.label,
    flex: 1,
    color: '#6b7280',
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
  shareContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  shareIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  shareTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  shareDescription: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32
  },
  shareOptions: {
    width: '100%',
    gap: 16,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  shareOptionText: {
    ...FONT_STYLES.h5,
    color: '#111827'
  },
});