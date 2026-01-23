import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { accountingAPI, companyAPI, clientSupportAPI } from '../../lib/api.js';
import { formatCurrency, formatDate } from '../../utils/businessLogic.js';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }) {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      receivables: 0,
      payables: 0,
      cash_on_hand: 0,
      gst_payable: 0,
    },
    recent_activity: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [companyName, setCompanyName] = useState('Client');
  const { user, logout } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await accountingAPI.dashboard();
      const data = response.data?.data || response.data || {};
      setDashboardData({
        stats: data.stats || {
          receivables: 0,
          payables: 0,
          cash_on_hand: 0,
          gst_payable: 0,
        },
        recent_activity: data.recent_activity || [],
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      // Fallback to default data on error
      setDashboardData({
        stats: {
          receivables: 0,
          payables: 0,
          cash_on_hand: 0,
          gst_payable: 0,
        },
        recent_activity: [],
      });
      Alert.alert('Error', 'Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompanyName = useCallback(async () => {
    try {
      if (!user?.company_id) {
        setCompanyName('Client');
        return;
      }
      const response = await companyAPI.list();
      const companies = response.data?.data || response.data || [];
      const currentCompany = companies.find(c => c.id === user.company_id);
      if (currentCompany?.company_name) {
        setCompanyName(currentCompany.company_name);
      } else {
        setCompanyName('Client');
      }
    } catch (error) {
      console.error('Failed to fetch company name:', error);
      setCompanyName('Client');
    }
  }, [user?.company_id]);

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
    { label: 'Create Voucher', icon: 'document-text', color: '#3e60ab', screen: 'Vouchers' },
    { label: 'Manage Ledgers', icon: 'folder', color: '#6b7280', screen: 'Ledgers' },
    { label: 'View Reports', icon: 'bar-chart', color: '#10b981', screen: 'Reports' },
    { label: 'GST Management', icon: 'receipt', color: '#f59e0b', screen: 'GSTINs' },
  ];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.companyName}>{companyName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
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
              onPress={() => navigation.navigate(action.screen)}
            >
              <Ionicons name={action.icon} size={24} color={action.color} />
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>✅ Connected to Finvera API</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    padding: 8,
    marginRight: 4,
  },
  settingsButton: {
    padding: 8,
    marginRight: 4,
  },
  logoutButton: {
    padding: 8,
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
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontFamily: 'Agency',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    fontFamily: 'Agency',
  },
});