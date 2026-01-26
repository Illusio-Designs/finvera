import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { accountingAPI, companyAPI } from '../../../lib/api.js';
import { formatCurrency } from '../../../utils/businessLogic.js';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      receivables: 0,
      payables: 0,
      cash_on_hand: 0,
      gst_payable: 0,
    },
    recent_activity: [],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [companyName, setCompanyName] = useState('Your Business');
  const { user } = useAuth();

  const handleMenuPress = () => {
    openDrawer();
  };

  const handleNavigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await accountingAPI.dashboard();
      const data = response.data?.data || response.data || {};
      setDashboardData({
        stats: data.stats || {},
        recent_activity: data.recent_activity || [],
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      setDashboardData({
        stats: {},
        recent_activity: [],
      });
    }
  }, []);

  const fetchCompanyName = useCallback(async () => {
    try {
      if (!user?.company_id) {
        setCompanyName(user?.name || 'Your Business');
        return;
      }
      const response = await companyAPI.list();
      const companies = response.data?.data || response.data || [];
      const currentCompany = companies.find(c => c.id === user.company_id);
      if (currentCompany?.company_name) {
        setCompanyName(currentCompany.company_name);
      } else {
        setCompanyName(user?.name || 'Your Business');
      }
    } catch (error) {
      console.error('Failed to fetch company name:', error);
      setCompanyName(user?.name || 'Your Business');
    }
  }, [user?.company_id, user?.name]);

  useEffect(() => {
    fetchDashboardData();
    fetchCompanyName();
  }, [fetchDashboardData, fetchCompanyName]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchCompanyName(),
    ]);
    setRefreshing(false);
  }, [fetchDashboardData, fetchCompanyName]);

  const { stats } = dashboardData;

  const statCards = [
    {
      title: 'Receivables',
      value: formatCurrency(stats.receivables || 0),
      subtitle: 'Amount to receive',
      icon: 'trending-up',
      color: '#10b981',
      bgColor: '#ecfdf5',
    },
    {
      title: 'Payables',
      value: formatCurrency(stats.payables || 0),
      subtitle: 'Amount to pay',
      icon: 'trending-down',
      color: '#ef4444',
      bgColor: '#fef2f2',
    },
    {
      title: 'Cash on Hand',
      value: formatCurrency(stats.cash_on_hand || 0),
      subtitle: 'Available cash',
      icon: 'wallet',
      color: '#3e60ab',
      bgColor: '#f0f4fc',
    },
    {
      title: 'Duties & Taxes',
      value: formatCurrency(stats.gst_payable || 0),
      subtitle: 'GST Payable',
      icon: 'alert-circle',
      color: '#f59e0b',
      bgColor: '#fffbeb',
    }
  ];

  const quickActions = [
    { label: 'Create Invoice', icon: 'document-text', color: '#3e60ab', screen: 'Vouchers' },
    { label: 'Manage Ledgers', icon: 'folder', color: '#6b7280', screen: 'Ledgers' },
    { label: 'View Reports', icon: 'bar-chart', color: '#10b981', screen: 'Reports' },
    { label: 'GST Returns', icon: 'receipt', color: '#f59e0b', screen: 'GST' },
    { label: 'Inventory', icon: 'cube', color: '#8b5cf6', screen: 'Inventory' },
    { label: 'Support', icon: 'help-circle', color: '#ef4444', screen: 'Support' },
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title={`Welcome, ${companyName}`} 
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.welcomeText}>Dashboard Overview</Text>
            <Text style={styles.companyName}>Financial Summary</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((card, index) => (
            <TouchableOpacity key={index} style={[styles.statCard, { backgroundColor: card.bgColor }]}>
              <View style={styles.statCardContent}>
                <View style={styles.statCardLeft}>
                  <Text style={styles.statCardTitle}>{card.title}</Text>
                  <Text style={[styles.statCardValue, { color: card.color }]}>{card.value}</Text>
                  <Text style={styles.statCardSubtitle}>{card.subtitle}</Text>
                </View>
                <View style={[styles.statCardIcon, { backgroundColor: card.color }]}>
                  <Ionicons name={card.icon} size={24} color="white" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.quickActionCard}
                onPress={() => handleNavigateToScreen(action.screen)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={24} color="white" />
                </View>
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {dashboardData.recent_activity.length > 0 ? (
              dashboardData.recent_activity.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name={activity.icon || "document-text"} size={20} color="#3e60ab" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                  </View>
                  <Text style={styles.activityAmount}>{activity.amount || ''}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyActivity}>
                <Ionicons name="time-outline" size={32} color="#9ca3af" />
                <Text style={styles.emptyActivityText}>No recent activity</Text>
              </View>
            )}
          </View>
        </View>

        {/* Add bottom padding to account for sticky bottom tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statCardLeft: {
    flex: 1,
  },
  statCardTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
    fontFamily: 'Agency',
  },
  statCardSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'Agency',
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Agency',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: 'white',
    width: '31%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontFamily: 'Agency',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: 'Agency',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyActivityText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    fontFamily: 'Agency',
  },
  bottomPadding: {
    height: 20,
  },
});