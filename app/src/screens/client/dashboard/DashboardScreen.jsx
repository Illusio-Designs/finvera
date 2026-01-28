import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext.jsx';
import { accountingAPI, companyAPI, clientSupportAPI } from '../../../lib/api.js';
import { formatCurrency } from '../../../utils/businessLogic.js';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      total_vouchers: 0,
      total_ledgers: 0,
      total_invoices: 0,
      total_sales_invoices: 0,
      total_purchase_invoices: 0,
      total_payments: 0,
      total_receipts: 0,
      pending_bills: 0,
      total_outstanding: 0,
      receivables: 0,
      payables: 0,
      cash_on_hand: 0,
      gst_payable: 0,
      current_month_sales: 0,
      current_month_purchase: 0,
      active_ledgers: 0,
    },
    recent_activity: [],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [companyName, setCompanyName] = useState('Your Business');
  const [recentTickets, setRecentTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const { user } = useAuth();

  const handleMenuPress = () => {
    openDrawer();
  };

  const handleNavigateToScreen = (screenName) => {
    // Navigate to screens within the Client navigator
    navigation.navigate('Client', { screen: screenName });
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
      // Use default empty data for any error
      setDashboardData({
        stats: {
          total_vouchers: 0,
          total_ledgers: 0,
          total_invoices: 0,
          total_sales_invoices: 0,
          total_purchase_invoices: 0,
          total_payments: 0,
          total_receipts: 0,
          pending_bills: 0,
          total_outstanding: 0,
          receivables: 0,
          payables: 0,
          cash_on_hand: 0,
          gst_payable: 0,
          current_month_sales: 0,
          current_month_purchase: 0,
          active_ledgers: 0,
        },
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

  const fetchRecentTickets = useCallback(async () => {
    try {
      setTicketsLoading(true);
      const response = await clientSupportAPI.tickets.list({
        page: 1,
        limit: 3, // Show only 3 tickets on mobile
      });
      const data = response.data?.data || response.data || [];
      setRecentTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching recent tickets:', error);
      setRecentTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchCompanyName();
    fetchRecentTickets();
  }, [fetchDashboardData, fetchCompanyName, fetchRecentTickets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchCompanyName(),
      fetchRecentTickets(),
    ]);
    setRefreshing(false);
  }, [fetchDashboardData, fetchCompanyName, fetchRecentTickets]);

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
    { label: 'GST Filing', icon: 'receipt', color: '#f59e0b', screen: 'GST' },
    { label: 'Support Tickets', icon: 'help-circle', color: '#ef4444', screen: 'Support' },
    { label: 'Notifications', icon: 'notifications', color: '#8b5cf6', screen: 'NotificationDemo' },
  ];

  const handleGetLoanClick = () => {
    showNotification({
      type: 'info',
      title: 'Business Loan',
      message: 'Business loan feature will be available soon. Get quick loans up to ₹15 Crore!'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

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
        {/* Loan Banner */}
        <View style={styles.loanBanner}>
          <View style={styles.loanBannerContent}>
            <View style={styles.loanBannerText}>
              <Text style={styles.loanBannerTitle}>Get Business Loan</Text>
              <Text style={styles.loanBannerSubtitle}>Quick loans up to ₹15 Crore. Check eligibility in minutes.</Text>
            </View>
            <TouchableOpacity style={styles.loanBannerButton} onPress={handleGetLoanClick}>
              <Ionicons name="layers" size={16} color="#3e60ab" />
              <Text style={styles.loanBannerButtonText}>Get Loan</Text>
              <Ionicons name="arrow-forward" size={16} color="#3e60ab" />
            </TouchableOpacity>
          </View>
        </View>

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
                  <Ionicons name={action.icon} size={20} color="white" />
                </View>
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Support Tickets Widget */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Support Tickets</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => handleNavigateToScreen('Support')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.supportTicketsCard}>
            {ticketsLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading tickets...</Text>
              </View>
            ) : recentTickets.length > 0 ? (
              <View style={styles.ticketsList}>
                {recentTickets.map((ticket) => (
                  <TouchableOpacity
                    key={ticket.id}
                    style={styles.ticketItem}
                    onPress={() => handleNavigateToScreen('Support')}
                  >
                    <View style={styles.ticketIcon}>
                      <Ionicons name="help-circle" size={20} color="#3e60ab" />
                    </View>
                    <View style={styles.ticketContent}>
                      <View style={styles.ticketHeader}>
                        <Text style={styles.ticketNumber}>{ticket.ticket_number}</Text>
                        <View style={[styles.statusBadge, { 
                          backgroundColor: ticket.status === 'resolved' ? '#ecfdf5' : 
                                         ticket.status === 'closed' ? '#f3f4f6' :
                                         ticket.status === 'in_progress' ? '#fffbeb' :
                                         ticket.status === 'assigned' ? '#eff6ff' : '#fef2f2'
                        }]}>
                          <Text style={[styles.statusText, {
                            color: ticket.status === 'resolved' ? '#059669' : 
                                   ticket.status === 'closed' ? '#6b7280' :
                                   ticket.status === 'in_progress' ? '#d97706' :
                                   ticket.status === 'assigned' ? '#2563eb' : '#dc2626'
                          }]}>
                            {ticket.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
                      <Text style={styles.ticketDate}>{formatDate(ticket.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyTickets}>
                <Ionicons name="help-circle-outline" size={32} color="#9ca3af" />
                <Text style={styles.emptyTicketsText}>No support tickets yet</Text>
                <TouchableOpacity 
                  style={styles.createTicketButton}
                  onPress={() => handleNavigateToScreen('Support')}
                >
                  <Ionicons name="add" size={16} color="white" />
                  <Text style={styles.createTicketText}>Create Ticket</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {dashboardData.recent_activity && dashboardData.recent_activity.length > 0 ? (
              dashboardData.recent_activity.map((activity, index) => (
                <TouchableOpacity key={activity.id || index} style={styles.activityItem}>
                  <View style={[styles.activityIcon, {
                    backgroundColor: activity.type === 'Sales' ? '#ecfdf5' :
                                   activity.type === 'Purchase' ? '#eff6ff' :
                                   activity.type === 'Payment' ? '#fef2f2' :
                                   activity.type === 'Receipt' ? '#ecfdf5' : '#f3f4f6'
                  }]}>
                    <Ionicons 
                      name={
                        activity.type === 'Sales' ? 'trending-up' :
                        activity.type === 'Purchase' ? 'trending-down' :
                        activity.type === 'Payment' ? 'wallet' :
                        activity.type === 'Receipt' ? 'card' : 'document-text'
                      } 
                      size={20} 
                      color={
                        activity.type === 'Sales' ? '#059669' :
                        activity.type === 'Purchase' ? '#2563eb' :
                        activity.type === 'Payment' ? '#dc2626' :
                        activity.type === 'Receipt' ? '#059669' : '#6b7280'
                      } 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      <Text style={styles.activityTitle}>{activity.number}</Text>
                      <View style={[styles.activityStatusBadge, {
                        backgroundColor: activity.status === 'posted' ? '#ecfdf5' :
                                       activity.status === 'draft' ? '#fffbeb' : '#fef2f2'
                      }]}>
                        <Text style={[styles.activityStatusText, {
                          color: activity.status === 'posted' ? '#059669' :
                                 activity.status === 'draft' ? '#d97706' : '#dc2626'
                        }]}>
                          {activity.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.activitySubtitle} numberOfLines={1}>
                      {activity.party || activity.narration || activity.type}
                    </Text>
                    <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
                  </View>
                  <Text style={styles.activityAmount}>{formatCurrency(activity.amount)}</Text>
                </TouchableOpacity>
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
  loanBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#3e60ab',
    borderRadius: 12,
    padding: 16,
  },
  loanBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loanBannerText: {
    flex: 1,
    marginRight: 12,
  },
  loanBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  loanBannerSubtitle: {
    fontSize: 12,
    color: '#e0e7ff',
    fontFamily: 'Agency',
  },
  loanBannerButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  loanBannerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3e60ab',
    fontFamily: 'Agency',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  viewAllText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    fontWeight: '600',
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
  supportTicketsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  ticketsList: {
    gap: 12,
  },
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  ticketIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ticketContent: {
    flex: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Agency',
  },
  ticketSubject: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Agency',
    marginBottom: 2,
  },
  ticketDate: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'Agency',
  },
  emptyTickets: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTicketsText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    marginBottom: 12,
    fontFamily: 'Agency',
  },
  createTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e60ab',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  createTicketText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Agency',
  },
  activityStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activityStatusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Agency',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
    fontFamily: 'Agency',
  },
  activityDate: {
    fontSize: 10,
    color: '#9ca3af',
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