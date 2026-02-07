import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { FONT_STYLES } from '../../../utils/fonts';;
import { useNavigation } from '@react-navigation/native';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';

import { pricingAPI } from '../../../lib/api';
import { SkeletonStatCard } from '../../../components/ui/SkeletonLoader';

export default function PlansScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [billingCycle, setBillingCycle] = useState('yearly'); // 'monthly' or 'yearly'

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pricingAPI.list({ 
        is_active: 'true', 
        is_visible: 'true',
        limit: 10 
      });
      const plansData = response.data?.data || response.data || [];
      
      // Transform API data to include features array
      const transformedPlans = plansData.map(plan => {
        const features = [];
        
        // Add user limit
        if (plan.max_users) {
          features.push(`Up to ${plan.max_users === -1 ? 'unlimited' : plan.max_users} users`);
        }
        
        // Add company limit
        if (plan.max_companies) {
          features.push(`${plan.max_companies === -1 ? 'Unlimited' : plan.max_companies} ${plan.max_companies === 1 ? 'company' : 'companies'}`);
        }
        
        // Add branch limit
        if (plan.max_branches && plan.max_branches > 0) {
          features.push(`${plan.max_branches === -1 ? 'Unlimited' : plan.max_branches} ${plan.max_branches === 1 ? 'branch' : 'branches'}`);
        }
        
        // Add invoice limit
        if (plan.max_invoices_per_month) {
          features.push(`${plan.max_invoices_per_month === -1 ? 'Unlimited' : plan.max_invoices_per_month} invoices per month`);
        }
        
        // Add storage limit
        if (plan.storage_limit_gb) {
          features.push(`${plan.storage_limit_gb === -1 ? 'Unlimited' : plan.storage_limit_gb + ' GB'} storage`);
        }
        
        // Parse features from JSON if available
        if (plan.features) {
          try {
            const planFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
            if (planFeatures.gst_filing) {
              features.push('GST filing support');
            }
            if (planFeatures.e_invoicing) {
              features.push('E-invoice & E-way bill');
            }
          } catch (e) {
            console.warn('Error parsing plan features:', e);
          }
        }
        
        // Add trial days
        if (plan.trial_days && plan.trial_days > 0) {
          features.push(`${plan.trial_days} days free trial`);
        }
        
        // Add default features
        features.push('Mobile app access');
        features.push('Email support');
        
        return {
          ...plan,
          features
        };
      });
      
      setPlans(transformedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load plans'
      });
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

  const handleSelectPlan = (plan) => {
    showNotification({
      type: 'info',
      title: 'Plan Selection',
      message: `${plan.plan_name} plan selected. Payment integration coming soon!`
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const getYearlyPrice = (monthlyPrice, discountedPrice) => {
    if (discountedPrice) {
      return discountedPrice * 12;
    }
    return monthlyPrice * 12 * 0.83; // 17% discount
  };

  const getPlanColor = (plan) => {
    if (plan.is_featured) return '#3e60ab';
    if (plan.plan_code === 'ENTERPRISE') return '#059669';
    return '#6b7280';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar 
          title="Choose Your Plan" 
          onMenuPress={handleMenuPress}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
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
        title="Choose Your Plan" 
        onMenuPress={handleMenuPress}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select the Perfect Plan</Text>
          <Text style={styles.subtitle}>
            Choose a plan that fits your business needs. Upgrade or downgrade anytime.
          </Text>
        </View>

        {/* Billing Toggle */}
        <View style={styles.billingToggle}>
          <TouchableOpacity 
            style={[styles.toggleButton, billingCycle === 'monthly' && styles.toggleButtonActive]}
            onPress={() => setBillingCycle('monthly')}
          >
            <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, billingCycle === 'yearly' && styles.toggleButtonActive]}
            onPress={() => setBillingCycle('yearly')}
          >
            <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.toggleTextActive]}>
              Yearly
            </Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>Save 17%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map((plan, index) => {
            const planColor = getPlanColor(plan);
            const monthlyPrice = parseFloat(plan.base_price || 0);
            const yearlyPrice = getYearlyPrice(monthlyPrice, plan.discounted_price);
            const displayPrice = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice / 12;
            
            return (
              <View key={plan.id} style={[styles.planCard, plan.is_featured && styles.popularPlan]}>
                {plan.is_featured && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.plan_name}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                  
                  <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: planColor }]}>
                      {formatPrice(displayPrice)}
                    </Text>
                    <Text style={styles.pricePeriod}>
                      /month {billingCycle === 'yearly' && '(billed yearly)'}
                    </Text>
                    {billingCycle === 'yearly' && plan.discounted_price && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>
                          Save {Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100)}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>What's included:</Text>
                  {plan.features.map((feature, featureIndex) => (
                    <View key={featureIndex} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={planColor} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity 
                  style={[
                    styles.selectButton, 
                    { backgroundColor: plan.is_featured ? planColor : 'white' },
                    !plan.is_featured && { borderWidth: 1, borderColor: planColor }
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                >
                  <Text style={[
                    styles.selectButtonText,
                    { color: plan.is_featured ? 'white' : planColor }
                  ]}>
                    Select {plan.plan_name}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Bottom margin */}
        <View style={styles.bottomMargin} />
      </ScrollView>
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
  },
  scrollContent: {
    paddingBottom: 40,
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
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    ...FONT_STYLES.h2,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    ...FONT_STYLES.h5,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    ...FONT_STYLES.label,
    color: '#6b7280'
  },
  toggleTextActive: {
    color: '#111827',
  },
  discountBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  discountText: {
    ...FONT_STYLES.captionSmall,
    color: 'white'
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    position: 'relative',
  },
  popularPlan: {
    borderWidth: 2,
    borderColor: '#3e60ab',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#3e60ab',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    ...FONT_STYLES.caption,
    color: 'white'
  },
  planHeader: {
    marginBottom: 20,
  },
  planName: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 4
  },
  planDescription: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    marginBottom: 16
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  price: {
    ...FONT_STYLES.h3,
  },
  pricePeriod: {
    ...FONT_STYLES.label,
    color: '#6b7280',
    marginTop: 2
  },
  savingsBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  savingsText: {
    ...FONT_STYLES.caption,
    color: '#059669'
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 12
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginLeft: 8,
    flex: 1
  },
  selectButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    ...FONT_STYLES.h5,
  },
  bottomMargin: {
    height: 40,
  },
});