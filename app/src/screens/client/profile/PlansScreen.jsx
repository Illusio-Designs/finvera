import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';

// For now, we'll use mock data since the backend subscription plans API might not be available in mobile
// In the future, you can replace this with: import { subscriptionAPI } from '../../../lib/api';
const plansAPI = {
  list: () => {
    // Mock data based on backend subscription plans structure
    return Promise.resolve({
      data: [
        {
          id: 1,
          plan_code: 'STARTER',
          plan_name: 'Starter',
          description: 'Perfect for small businesses getting started',
          base_price: 999,
          discounted_price: 830,
          currency: 'INR',
          max_users: 5,
          max_companies: 1,
          max_invoices_per_month: 500,
          storage_limit_gb: 10,
          features: [
            'Up to 5 users',
            '1 company',
            '500 invoices per month',
            '10 GB storage',
            'Basic GST filing',
            'Email support',
            'Mobile app access'
          ],
          is_featured: false,
          is_active: true
        },
        {
          id: 2,
          plan_code: 'PROFESSIONAL',
          plan_name: 'Professional',
          description: 'Most popular for growing businesses',
          base_price: 1999,
          discounted_price: 1660,
          currency: 'INR',
          max_users: 15,
          max_companies: 3,
          max_invoices_per_month: 2000,
          storage_limit_gb: 50,
          features: [
            'Up to 15 users',
            '3 companies',
            '2000 invoices per month',
            '50 GB storage',
            'Advanced GST & TDS',
            'E-invoice & E-way bill',
            'Priority support',
            'Multi-branch support',
            'Advanced reports'
          ],
          is_featured: true,
          is_active: true
        },
        {
          id: 3,
          plan_code: 'ENTERPRISE',
          plan_name: 'Enterprise',
          description: 'For large businesses with advanced needs',
          base_price: 3999,
          discounted_price: 3320,
          currency: 'INR',
          max_users: null, // unlimited
          max_companies: null, // unlimited
          max_invoices_per_month: null, // unlimited
          storage_limit_gb: 500,
          features: [
            'Unlimited users',
            'Unlimited companies',
            'Unlimited invoices',
            '500 GB storage',
            'Complete tax suite',
            'API access',
            'Dedicated support',
            'Custom integrations',
            'Advanced analytics',
            'White-label options'
          ],
          is_featured: false,
          is_active: true
        }
      ]
    });
  }
};

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
      const response = await plansAPI.list();
      const plansData = response.data || [];
      setPlans(plansData);
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

  const getYearlyPrice = (monthlyPrice) => {
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
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
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
            const monthlyPrice = billingCycle === 'monthly' ? plan.base_price : getYearlyPrice(plan.base_price) / 12;
            
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
                      {formatPrice(monthlyPrice)}
                    </Text>
                    <Text style={styles.pricePeriod}>
                      /month {billingCycle === 'yearly' && '(billed yearly)'}
                    </Text>
                    {billingCycle === 'yearly' && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>Save 17%</Text>
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
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 22,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    fontFamily: 'Agency',
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
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
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
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Agency',
  },
  planHeader: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginBottom: 16,
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Agency',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginTop: 2,
  },
  savingsBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    fontFamily: 'Agency',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Agency',
    marginLeft: 8,
    flex: 1,
  },
  selectButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Agency',
  },
  bottomMargin: {
    height: 40,
  },
});