import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { businessAPI } from '../../../lib/api';

export default function ReferralScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [referralData, setReferralData] = useState(null);
  const [referralRewards, setReferralRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchReferralData = useCallback(async () => {
    try {
      const [referralRes, rewardsRes] = await Promise.all([
        businessAPI.referral.get(),
        businessAPI.referral.rewards()
      ]);
      
      setReferralData(referralRes.data);
      setReferralRewards(rewardsRes.data?.data || rewardsRes.data || []);
    } catch (error) {
      console.error('Referral data fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load referral data'
      });
      setReferralData(null);
      setReferralRewards([]);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReferralData();
    setRefreshing(false);
  }, [fetchReferralData]);

  const handleShareReferral = async () => {
    try {
      const referralLink = referralData?.referral_link || 'https://finvera.com/refer';
      const message = `Join Finvera using my referral link and get exclusive benefits! ${referralLink}`;
      
      await Share.share({
        message: message,
        url: referralLink,
        title: 'Join Finvera',
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
      month: 'short',
      year: 'numeric',
    });
  };

  const getRewardStatusColor = (status) => {
    const colors = {
      'earned': '#10b981',
      'pending': '#f59e0b',
      'paid': '#3b82f6',
      'expired': '#ef4444',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

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
          <Text style={styles.sectionTitle}>Referral Program</Text>
          <Text style={styles.sectionSubtitle}>
            Earn rewards by referring friends and colleagues to Finvera
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading referral data...</Text>
            </View>
          </View>
        ) : (
          <>
            {/* Referral Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="people" size={24} color="#3e60ab" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{referralData?.total_referrals || 0}</Text>
                  <Text style={styles.statLabel}>Total Referrals</Text>
                </View>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{referralData?.successful_referrals || 0}</Text>
                  <Text style={styles.statLabel}>Successful</Text>
                </View>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="gift" size={24} color="#f59e0b" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{formatCurrency(referralData?.total_earnings)}</Text>
                  <Text style={styles.statLabel}>Total Earned</Text>
                </View>
              </View>
            </View>

            {/* Referral Link Card */}
            <View style={styles.referralLinkCard}>
              <View style={styles.referralLinkHeader}>
                <View style={styles.referralLinkIcon}>
                  <Ionicons name="link" size={24} color="#3e60ab" />
                </View>
                <Text style={styles.referralLinkTitle}>Your Referral Link</Text>
              </View>
              
              <View style={styles.referralLinkContainer}>
                <Text style={styles.referralLinkText} numberOfLines={1}>
                  {referralData?.referral_link || 'https://finvera.com/refer/your-code'}
                </Text>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => {
                    // Copy to clipboard functionality would go here
                    showNotification({
                      type: 'success',
                      title: 'Copied',
                      message: 'Referral link copied to clipboard'
                    });
                  }}
                >
                  <Ionicons name="copy" size={16} color="#3e60ab" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.referralActions}>
                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={handleShareReferral}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share" size={20} color="white" />
                  <Text style={styles.shareButtonText}>Share Link</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.qrButton}
                  onPress={() => setShowShareModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="qr-code" size={20} color="#3e60ab" />
                  <Text style={styles.qrButtonText}>QR Code</Text>
                </TouchableOpacity>
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
                    <Text style={styles.stepTitle}>Share Your Link</Text>
                    <Text style={styles.stepDescription}>
                      Share your unique referral link with friends and colleagues
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
                      Your referrals sign up and start using Finvera
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
                      Get rewarded for each successful referral
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Reward Tiers */}
            <View style={styles.rewardTiersCard}>
              <Text style={styles.rewardTiersTitle}>Reward Tiers</Text>
              
              <View style={styles.tiersList}>
                <View style={styles.tierItem}>
                  <View style={[styles.tierIcon, { backgroundColor: '#d1fae5' }]}>
                    <Ionicons name="star" size={20} color="#10b981" />
                  </View>
                  <View style={styles.tierContent}>
                    <Text style={styles.tierTitle}>Basic Plan Referral</Text>
                    <Text style={styles.tierReward}>₹500 per referral</Text>
                  </View>
                </View>

                <View style={styles.tierItem}>
                  <View style={[styles.tierIcon, { backgroundColor: '#dbeafe' }]}>
                    <Ionicons name="diamond" size={20} color="#3e60ab" />
                  </View>
                  <View style={styles.tierContent}>
                    <Text style={styles.tierTitle}>Premium Plan Referral</Text>
                    <Text style={styles.tierReward}>₹1,000 per referral</Text>
                  </View>
                </View>

                <View style={styles.tierItem}>
                  <View style={[styles.tierIcon, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="trophy" size={20} color="#f59e0b" />
                  </View>
                  <View style={styles.tierContent}>
                    <Text style={styles.tierTitle}>Enterprise Plan Referral</Text>
                    <Text style={styles.tierReward}>₹2,000 per referral</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Recent Rewards */}
            <View style={styles.rewardsSection}>
              <Text style={styles.rewardsTitle}>Recent Rewards</Text>
              
              {referralRewards.length === 0 ? (
                <View style={styles.emptyRewards}>
                  <Ionicons name="gift-outline" size={48} color="#94a3b8" />
                  <Text style={styles.emptyRewardsTitle}>No Rewards Yet</Text>
                  <Text style={styles.emptyRewardsText}>
                    Start referring friends to earn your first reward!
                  </Text>
                </View>
              ) : (
                <View style={styles.rewardsList}>
                  {referralRewards.map((reward, index) => (
                    <View key={reward.id || index} style={styles.rewardCard}>
                      <View style={styles.rewardCardContent}>
                        <View style={[
                          styles.rewardIcon,
                          { backgroundColor: getRewardStatusColor(reward.status) + '20' }
                        ]}>
                          <Ionicons 
                            name="gift" 
                            size={20} 
                            color={getRewardStatusColor(reward.status)} 
                          />
                        </View>
                        <View style={styles.rewardInfo}>
                          <Text style={styles.rewardTitle}>
                            {reward.referral_name || 'Referral Reward'}
                          </Text>
                          <Text style={styles.rewardDate}>
                            {formatDate(reward.earned_date)}
                          </Text>
                        </View>
                        <View style={styles.rewardAmount}>
                          <Text style={styles.rewardAmountText}>
                            {formatCurrency(reward.amount)}
                          </Text>
                          <View style={[
                            styles.rewardStatus,
                            { backgroundColor: getRewardStatusColor(reward.status) }
                          ]}>
                            <Text style={styles.rewardStatusText}>
                              {reward.status?.toUpperCase() || 'PENDING'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIcon}>
                <Ionicons name="qr-code" size={20} color="#3e60ab" />
              </View>
              <View>
                <Text style={styles.modalTitle}>QR Code</Text>
                <Text style={styles.modalSubtitle}>Share your referral link</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setShowShareModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodePlaceholder}>
                <Ionicons name="qr-code" size={120} color="#94a3b8" />
                <Text style={styles.qrCodeText}>QR Code</Text>
              </View>
              <Text style={styles.qrCodeDescription}>
                Scan this QR code to access your referral link
              </Text>
            </View>

            <View style={styles.comingSoonContainer}>
              <Ionicons name="construct" size={32} color="#94a3b8" />
              <Text style={styles.comingSoonTitle}>Coming Soon</Text>
              <Text style={styles.comingSoonText}>
                QR code generation will be available in the next update
              </Text>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  referralLinkCard: {
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
  referralLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  referralLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralLinkTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  referralLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
  },
  referralLinkText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  referralActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e60ab',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#3e60ab',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  qrButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3e60ab',
    fontFamily: 'Agency',
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
  rewardTiersCard: {
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
  rewardTiersTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 20,
  },
  tiersList: {
    gap: 16,
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  tierIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierContent: {
    flex: 1,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  tierReward: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
    fontFamily: 'Agency',
  },
  rewardsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  rewardsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  emptyRewards: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyRewardsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyRewardsText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 20,
  },
  rewardsList: {
    gap: 12,
  },
  rewardCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  rewardCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  rewardDate: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  rewardAmount: {
    alignItems: 'flex-end',
  },
  rewardAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  rewardStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rewardStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
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
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: 'white',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  qrCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    fontFamily: 'Agency',
    marginTop: 8,
  },
  qrCodeDescription: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 20,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 20,
  },
});