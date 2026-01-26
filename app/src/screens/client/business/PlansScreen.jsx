import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { businessAPI } from '../../../lib/api';

export default function PlansScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchPlans = useCallback(async () => {
    try {
      const [plansRes, currentRes] = await Promise.all([
        businessAPI.subscription.plans(),
        businessAPI.subscription.current()
      ]);
      
      setPlans(plansRes.data?.data || plansRes.data || []);
      setCurrentPlan(currentRes.data || null);
    } catch (error) {
      console.error('Plans fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load subscription plans'
      });
      setPlans([]);
      setCurrentPlan(null);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  }, [fetchPlans]);

  const handlePlanSelect = async (plan) => {
    try {
      showNotification({
        type: 'info',
        title: 'Plan Selection',
        message: `Redirecting to subscription for ${plan.name} plan...`
      });
      
      // In a real app, this would navigate to payment/subscription flow
      // For now, we'll just show a notification
      setTimeout(() => {
        showNotification({
          type: 'success',
          title: 'Coming Soon',
          message: 'Plan subscription will be available in the next update'
        });
      }, 1000);
    } catch (error) {
      console.error('Plan selection error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to process plan selection'
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

  const getPlanColor = (planType) => {
    const colors = {
      'basic': '#10b981',
      'premium': '#3e60ab',
      'enterprise': '#f59e0b',
    };
    return colors[planType?.toLowerCase()] || '#6b7280';
  };

  const getPlanIcon = (planType) => {
    const icons = {
      'basic': 'star',
      'premium': 'diamond',
      'enterprise': 'trophy',
    };
    return icons[planType?.toLowerCase()] || 'document-text';
  };

  // Default plans if API doesn't return any
  const defaultPlans = [
    {
      id: 1,
      name: 'Basic Plan',
      type: 'basic',
      price: 999,
      billing_cycle: 'monthly',
      features: [
        'Up to 100 invoices per month',
        'Basic GST compliance',
        'Email support',
        'Mobile app access',
        'Basic reports'
      ],
      popular: false
    },
    {
      id: 2,
      name: 'Premium Plan',
      type: 'premium',
      price: 1999,
      billing_cycle: 'monthly',
      features: [
        'Unlimited invoices',
        'Advanced GST features',
        'Priority support',
        'Multi-user access',
        'Advanced reports',
        'E-invoice & E-way bill',
        'Inventory management'
      ],
      popular: true
    },
    {
      id: 3,
      name: 'Enterprise Plan',
      type: 'enterprise',
      price: 4999,
      billing_cycle: 'monthly',
      features: [
        'Everything in Premium',
        'Custom integrations',
        'Dedicated support',
        'Advanced analytics',
        'Multi-company support',
        'API access',
        'Custom reports'
      ],
      popular: false
    }
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <View style={styles.container}>
      <TopBar 
        title="Subscription Plans" 
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
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          <Text style={styles.sectionSubtitle}>
            Select the perfect plan for your business needs
          </Text>
        </View>

        {/* Current Plan */}
        {currentPlan && (
          <View style={styles.currentPlanSection}>
            <View style={styles.currentPlanCard}>
              <View style={styles.currentPlanHeader}>
                <View style={[styles.currentPlanIcon, { backgroundColor: getPlanColor(currentPlan.type) + '20' }]}>
                  <Ionicons name={getPlanIcon(currentPlan.type)} size={24} color={getPlanColor(currentPlan.type)} />
                </View>
                <View style={styles.currentPlanInfo}>
                  <Text style={styles.currentPlanTitle}>Current Plan</Text>
                  <Text style={styles.currentPlanName}>{currentPlan.name}</Text>
                </View>
                <View style={[styles.currentPlanBadge, { backgroundColor: getPlanColor(currentPlan.type) }]}>
                  <Text style={styles.currentPlanBadgeText}>ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.currentPlanPrice}>
                {formatCurrency(currentPlan.price)}/{currentPlan.billing_cycle}
              </Text>
            </View>
          </View>
        )}

        {/* Plans List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading subscription plans...</Text>
            </View>
          </View>
        ) : (
          <View style={styles.plansContainer}>
            {displayPlans.map((plan, index) => (
              <View key={plan.id || index} style={styles.planCard}>
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                  </View>
                )}
                
                <View style={styles.planCardContent}>
                  <View style={styles.planHeader}>
                    <View style={[styles.planIcon, { backgroundColor: getPlanColor(plan.type) + '20' }]}>
                      <Ionicons name={getPlanIcon(plan.type)} size={32} color={getPlanColor(plan.type)} />
                    </View>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.planPricing}>
                      <Text style={styles.planPrice}>{formatCurrency(plan.price)}</Text>
                      <Text style={styles.planBilling}>per {plan.billing_cycle}</Text>
                    </View>
                  </View>

                  <View style={styles.planFeatures}>
                    <Text style={styles.planFeaturesTitle}>Features included:</Text>
                    {plan.features?.map((feature, featureIndex) => (
                      <View key={featureIndex} style={styles.planFeature}>
                        <Ionicons name="checkmark-circle" size={16} color={getPlanColor(plan.type)} />
                        <Text style={styles.planFeatureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={[
                      styles.planButton,
                      { 
                        backgroundColor: currentPlan?.id === plan.id ? '#6b7280' : getPlanColor(plan.type),
                        opacity: currentPlan?.id === plan.id ? 0.6 : 1
                      }
                    ]}
                    onPress={() => handlePlanSelect(plan)}
                    disabled={currentPlan?.id === plan.id}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.planButtonText}>
                      {currentPlan?.id === plan.id ? 'Current Plan' : 'Choose Plan'}
                    </Text>
                    {currentPlan?.id !== plan.id && (
                      <Ionicons name="arrow-forward" size={16} color="white" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Decorative elements */}
                <View style={[
                  styles.planDecorative,
                  { backgroundColor: getPlanColor(plan.type) + '10' }
                ]} />
              </View>
            ))}
          </View>
        )}

        {/* Features Comparison */}
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>Why Choose Finvera?</Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="shield-checkmark" size={24} color="#10b981" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Secure & Compliant</Text>
                <Text style={styles.benefitDescription}>
                  Bank-grade security with full GST compliance
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="flash" size={24} color="#3e60ab" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Lightning Fast</Text>
                <Text style={styles.benefitDescription}>
                  Generate invoices and reports in seconds
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="people" size={24} color="#f59e0b" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Expert Support</Text>
                <Text style={styles.benefitDescription}>
                  24/7 support from accounting experts
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="sync" size={24} color="#8b5cf6" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Auto Sync</Text>
                <Text style={styles.benefitDescription}>
                  Seamless data sync across all devices
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqList}>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Can I change my plan anytime?</Text>
              <Text style={styles.faqAnswer}>
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Is there a free trial?</Text>
              <Text style={styles.faqAnswer}>
                Yes, we offer a 14-day free trial for all new users. No credit card required.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>What payment methods do you accept?</Text>
              <Text style={styles.faqAnswer}>
                We accept all major credit cards, debit cards, UPI, and net banking.
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
  currentPlanSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  currentPlanCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentPlanIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currentPlanInfo: {
    flex: 1,
  },
  currentPlanTitle: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  currentPlanBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentPlanBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  currentPlanPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3e60ab',
    fontFamily: 'Agency',
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
  plansContainer: {
    paddingHorizontal: 20,
    gap: 20,
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#3e60ab',
    paddingVertical: 8,
    zIndex: 2,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Agency',
  },
  planCardContent: {
    padding: 24,
    paddingTop: 32,
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  planIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 8,
    textAlign: 'center',
  },
  planPricing: {
    alignItems: 'center',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  planBilling: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    marginTop: 4,
  },
  planFeatures: {
    marginBottom: 24,
  },
  planFeaturesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  planFeatureText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    flex: 1,
    lineHeight: 20,
  },
  planButton: {
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
  planButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  planDecorative: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.1,
  },
  comparisonSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  comparisonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
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
    gap: 16,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 20,
  },
  faqSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  faqTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 20,
    textAlign: 'center',
  },
  faqList: {
    gap: 16,
  },
  faqItem: {
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
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    lineHeight: 20,
  },
});