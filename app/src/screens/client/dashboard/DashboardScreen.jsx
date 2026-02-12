import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext.jsx';
import { accountingAPI, companyAPI, clientSupportAPI } from '../../../lib/api.js';
import { formatCurrency } from '../../../utils/businessLogic.js';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { FONT_STYLES } from '../../../utils/fonts';
import { SkeletonStatCard, SkeletonActivityItem, SkeletonListItem } from '../../../components/ui/SkeletonLoader';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const scrollViewRef = useRef(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const dotAnimations = useRef([0, 1, 2, 3].map(() => new Animated.Value(8))).current;
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
    gst: {
      input_gst: 0,
      output_gst: 0,
      rcm_input: 0,
      net_gst: 0,
      gst_payable: 0,
      gst_credit: 0,
    },
    recent_activity: [],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [companyName, setCompanyName] = useState('Your Business');
  const [recentTickets, setRecentTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const { user } = useAuth();

  const handleMenuPress = () => {
    openDrawer();
  };

  const handleNavigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setStatsLoading(true);
      setActivityLoading(true);
      
      // Minimum display time for skeleton (3 seconds)
      const startTime = Date.now();
      
      const response = await accountingAPI.dashboard();
      const data = response.data?.data || response.data || {};
      setDashboardData({
        stats: data.stats || {},
        gst: data.gst || {
          input_gst: 0,
          output_gst: 0,
          rcm_input: 0,
          net_gst: 0,
          gst_payable: 0,
          gst_credit: 0,
        },
        recent_activity: data.recent_activity || [],
      });
      
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setStatsLoading(false);
        setActivityLoading(false);
      }, remainingTime);
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
        gst: {
          input_gst: 0,
          output_gst: 0,
          rcm_input: 0,
          net_gst: 0,
          gst_payable: 0,
          gst_credit: 0,
        },
        recent_activity: [],
      });
      
      // Still show skeleton for 3 seconds even on error
      setTimeout(() => {
        setStatsLoading(false);
        setActivityLoading(false);
      }, 3000);
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
      
      // Minimum display time for skeleton (3 seconds)
      const startTime = Date.now();
      
      const response = await clientSupportAPI.tickets.list({
        page: 1,
        limit: 3, // Show only 3 tickets on mobile
      });
      const data = response.data?.data || response.data || [];
      setRecentTickets(Array.isArray(data) ? data : []);
      
      // Ensure skeleton shows for at least 3 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      setTimeout(() => {
        setTicketsLoading(false);
      }, remainingTime);
    } catch (error) {
      console.error('Error fetching recent tickets:', error);
      setRecentTickets([]);
      
      // Still show skeleton for 3 seconds even on error
      setTimeout(() => {
        setTicketsLoading(false);
      }, 3000);
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

  // Animate pagination dots
  useEffect(() => {
    dotAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index === activeCardIndex ? 24 : 8,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [activeCardIndex, dotAnimations]);

  // Auto-scroll carousel
  useEffect(() => {
    if (statsLoading) return;

    const interval = setInterval(() => {
      setActiveCardIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % 4; // 4 cards total
        
        // Scroll to next card
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: nextIndex * 356, // 340px card + 16px margin
            animated: true,
          });
        }
        
        return nextIndex;
      });
    }, 5000); // Auto-scroll every 5 seconds (slower)

    return () => clearInterval(interval);
  }, [statsLoading]);

  // Handle manual scroll
  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / 356);
    if (index >= 0 && index < 4) {
      setActiveCardIndex(index);
    }
  };

  // Handle scroll end - reset auto-scroll timer
  const handleScrollEnd = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / 356);
    if (index >= 0 && index < 4) {
      setActiveCardIndex(index);
    }
  };

  const { stats, gst } = dashboardData;

  // Calculate GST display value (Input - Output)
  const gstDisplayValue = (gst.input_gst || 0) - (gst.output_gst || 0);
  const gstDisplayText = gstDisplayValue >= 0 
    ? `${formatCurrency(Math.abs(gstDisplayValue))} Credit`
    : `${formatCurrency(Math.abs(gstDisplayValue))} Payable`;

  // Calculate Cash on Hand display
  const cashOnHand = stats.cash_on_hand || 0;
  const cashDisplayText = cashOnHand >= 0
    ? formatCurrency(Math.abs(cashOnHand))
    : `${formatCurrency(Math.abs(cashOnHand))} -`;

  const statCards = [
    {
      title: 'Receivables',
      value: formatCurrency(stats.receivables || 0),
      subtitle: 'Amount to receive',
      icon: 'trending-up',
      color: '#10b981',
      bgColor: '#ecfdf5',
      screen: 'Receivables',
    },
    {
      title: 'Payables',
      value: formatCurrency(stats.payables || 0),
      subtitle: 'Amount to pay',
      icon: 'trending-down',
      color: '#ef4444',
      bgColor: '#fef2f2',
      screen: 'Payables',
    },
    {
      title: 'Cash on Hand',
      value: cashDisplayText,
      subtitle: cashOnHand >= 0 ? 'Available cash' : 'Cash deficit',
      icon: 'wallet',
      color: cashOnHand >= 0 ? '#3e60ab' : '#ef4444',
      bgColor: cashOnHand >= 0 ? '#f0f4fc' : '#fef2f2',
    },
    {
      title: 'GST (Input - Output)',
      value: gstDisplayText,
      subtitle: `In: ${formatCurrency(gst.input_gst || 0)} | Out: ${formatCurrency(gst.output_gst || 0)}`,
      icon: 'alert-circle',
      color: gstDisplayValue >= 0 ? '#10b981' : '#ef4444',
      bgColor: gstDisplayValue >= 0 ? '#ecfdf5' : '#fef2f2',
    }
  ];

  const quickActions = [
    { label: 'Create Voucher', icon: 'document-text', color: '#3e60ab', screen: 'Vouchers' },
    { label: 'Manage Ledgers', icon: 'folder', color: '#6b7280', screen: 'Ledgers' },
    { label: 'View Reports', icon: 'bar-chart', color: '#10b981', screen: 'Reports' },
    { label: 'GST Filing', icon: 'receipt', color: '#f59e0b', screen: 'GST' },
    { label: 'Support Tickets', icon: 'help-circle', color: '#ef4444', screen: 'Support' },
    { label: 'Inventory', icon: 'cube', color: '#8b5cf6', screen: 'Inventory' },
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

        {/* Stats Carousel */}
        <View style={styles.statsSection}>
          {statsLoading ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              decelerationRate="fast"
              contentContainerStyle={styles.statsCarousel}
              style={{ overflow: 'visible' }}
            >
              <SkeletonStatCard fullWidth />
              <SkeletonStatCard fullWidth />
              <SkeletonStatCard fullWidth />
              <SkeletonStatCard fullWidth />
            </ScrollView>
          ) : (
            <>
              <ScrollView 
                ref={scrollViewRef}
                horizontal 
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                decelerationRate="fast"
                snapToInterval={356}
                contentContainerStyle={styles.statsCarousel}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleScrollEnd}
                scrollEventThrottle={16}
                style={{ overflow: 'visible' }}
              >
                {statCards.map((card, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.statCardFull}
                    onPress={() => card.screen && handleNavigateToScreen(card.screen)}
                    activeOpacity={card.screen ? 0.7 : 1}
                  >
                    <View style={styles.statCardHeader}>
                      <View style={styles.statCardTitleContainer}>
                        <Text style={styles.statCardTitle}>{card.title}</Text>
                        <Text style={styles.statCardSubtitle}>{card.subtitle}</Text>
                      </View>
                      <View style={[styles.statCardIcon, { backgroundColor: card.bgColor }]}>
                        <Ionicons name={card.icon} size={26} color={card.color} />
                      </View>
                    </View>
                    <View style={styles.statCardValueContainer}>
                      <Text style={[styles.statCardValue, { color: card.color }]}>{card.value}</Text>
                      {card.screen && (
                        <View style={styles.viewDetailsContainer}>
                          <Text style={styles.viewDetailsText}>Tap to view details</Text>
                          <Ionicons name="arrow-forward" size={14} color="#6b7280" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Pagination Dots */}
              <View style={styles.paginationContainer}>
                {statCards.map((_, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.paginationDot,
                      {
                        width: dotAnimations[index],
                        backgroundColor: activeCardIndex === index ? '#3e60ab' : '#d1d5db',
                      },
                    ]}
                  />
                ))}
              </View>
            </>
          )}
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
              <View style={styles.ticketsList}>
                <SkeletonListItem />
                <SkeletonListItem />
                <SkeletonListItem />
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
    ...FONT_STYLES.h5,
    color: 'white',
    marginBottom: 4,
  },
  loanBannerSubtitle: {
    ...FONT_STYLES.bodySmall,
    color: '#e0e7ff',
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
    ...FONT_STYLES.labelSmall,
    color: '#3e60ab',
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
    ...FONT_STYLES.label,
    color: '#6b7280',
  },
  companyName: {
    ...FONT_STYLES.h3,
    color: '#111827',
  },
  statsSection: {
    marginTop: 20,
    marginBottom: 24,
    paddingBottom: 8,
  },
  statsCarousel: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  statCardFull: {
    width: 340,
    borderRadius: 24,
    padding: 24,
    height: 210,
    backgroundColor: 'white',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 36,
  },
  statCardTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  statCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  statCardSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '400',
    lineHeight: 18,
  },
  statCardValueContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  statCardValue: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 40,
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  viewDetailsText: {
    ...FONT_STYLES.captionSmall,
    color: '#6b7280',
  },
  statCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
    gap: 8,
    height: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
    transition: 'all 0.3s ease',
  },
  paginationDotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3e60ab',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 16,
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
    ...FONT_STYLES.labelSmall,
    color: '#6b7280',
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
    ...FONT_STYLES.labelSmall,
    color: '#374151',
    textAlign: 'center',
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
    ...FONT_STYLES.body,
    color: '#6b7280',
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
    ...FONT_STYLES.label,
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    ...FONT_STYLES.captionSmall,
    fontWeight: '600',
  },
  ticketSubject: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
    marginBottom: 2,
  },
  ticketDate: {
    ...FONT_STYLES.captionSmall,
    color: '#9ca3af',
  },
  emptyTickets: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTicketsText: {
    ...FONT_STYLES.body,
    color: '#9ca3af',
    marginTop: 8,
    marginBottom: 12,
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
    ...FONT_STYLES.labelSmall,
    color: 'white',
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
    ...FONT_STYLES.label,
    color: '#111827',
  },
  activityStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activityStatusText: {
    ...FONT_STYLES.captionSmall,
    fontWeight: '600',
  },
  activitySubtitle: {
    ...FONT_STYLES.bodySmall,
    color: '#6b7280',
    marginBottom: 2,
  },
  activityDate: {
    ...FONT_STYLES.captionSmall,
    color: '#9ca3af',
  },
  activityAmount: {
    ...FONT_STYLES.label,
    color: '#111827',
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyActivityText: {
    ...FONT_STYLES.body,
    color: '#9ca3af',
    marginTop: 8,
  },
  bottomPadding: {
    height: 20,
  },
});