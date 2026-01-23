import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportsAPI } from '../../../lib/api';

export default function ReportsScreen({ navigation }) {
  const [reportStats, setReportStats] = useState({
    totalReports: 0,
    lastGenerated: null,
    pendingReports: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const reportCategories = [
    {
      id: 1,
      title: 'Financial Reports',
      description: 'Balance Sheet, P&L, Trial Balance',
      icon: 'bar-chart',
      color: '#3e60ab',
      bgColor: '#f0f4fc',
      reports: [
        { name: 'Balance Sheet', screen: 'BalanceSheet', icon: 'analytics' },
        { name: 'Profit & Loss', screen: 'ProfitLoss', icon: 'trending-up' },
        { name: 'Trial Balance', screen: 'TrialBalance', icon: 'list' },
      ]
    },
    {
      id: 2,
      title: 'Ledger Reports',
      description: 'Ledger statements and summaries',
      icon: 'document-text',
      color: '#10b981',
      bgColor: '#ecfdf5',
      reports: [
        { name: 'Ledger Statement', screen: 'LedgerStatement', icon: 'document' },
        { name: 'Outstanding Report', screen: 'OutstandingReport', icon: 'time' },
        { name: 'Party Summary', screen: 'PartySummary', icon: 'people' },
      ]
    },
    {
      id: 3,
      title: 'Inventory Reports',
      description: 'Stock ledger and summaries',
      icon: 'cube',
      color: '#f59e0b',
      bgColor: '#fffbeb',
      reports: [
        { name: 'Stock Ledger', screen: 'StockLedger', icon: 'cube' },
        { name: 'Stock Summary', screen: 'StockSummary', icon: 'list-circle' },
        { name: 'Stock Valuation', screen: 'StockValuation', icon: 'cash' },
      ]
    },
    {
      id: 4,
      title: 'GST Reports',
      description: 'GST returns and compliance reports',
      icon: 'receipt',
      color: '#ef4444',
      bgColor: '#fef2f2',
      reports: [
        { name: 'GSTR-1', screen: 'GSTR1Report', icon: 'document-text' },
        { name: 'GSTR-3B', screen: 'GSTR3BReport', icon: 'receipt' },
        { name: 'GST Summary', screen: 'GSTSummary', icon: 'analytics' },
      ]
    },
    {
      id: 5,
      title: 'Tax Reports',
      description: 'Income tax and TDS reports',
      icon: 'calculator',
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      reports: [
        { name: 'TDS Report', screen: 'TDSReport', icon: 'calculator' },
        { name: 'Tax Summary', screen: 'TaxSummary', icon: 'pie-chart' },
        { name: 'Form 26AS', screen: 'Form26AS', icon: 'document' },
      ]
    },
    {
      id: 6,
      title: 'Voucher Reports',
      description: 'Transaction and voucher reports',
      icon: 'folder',
      color: '#06b6d4',
      bgColor: '#ecfeff',
      reports: [
        { name: 'Voucher Register', screen: 'VoucherRegister', icon: 'folder-open' },
        { name: 'Day Book', screen: 'DayBook', icon: 'calendar' },
        { name: 'Cash Book', screen: 'CashBook', icon: 'wallet' },
      ]
    },
  ];

  useEffect(() => {
    loadReportStats();
  }, []);

  const loadReportStats = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.stats();
      const stats = response.data?.data || response.data || {};
      setReportStats({
        totalReports: stats.totalReports || 24,
        lastGenerated: stats.lastGenerated || new Date().toISOString(),
        pendingReports: stats.pendingReports || 0,
      });
    } catch (error) {
      console.error('Error loading report stats:', error);
      Alert.alert('Error', 'Failed to load report statistics. Please check your connection.');
      // Use default stats on error
      setReportStats({
        totalReports: 24,
        lastGenerated: new Date().toISOString(),
        pendingReports: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportStats();
    setRefreshing(false);
  };

  const handleReportPress = (reportScreen) => {
    navigation.navigate(reportScreen);
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('ReportCategory', { 
      categoryId: category.id,
      categoryTitle: category.title,
      reports: category.reports 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const CategoryCard = ({ category }) => (
    <TouchableOpacity 
      style={[styles.categoryCard, { backgroundColor: category.bgColor }]}
      onPress={() => handleCategoryPress(category)}
    >
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
          <Ionicons name={category.icon} size={24} color="white" />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
          <Text style={styles.reportCount}>{category.reports.length} reports</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={category.color} />
      </View>
      
      <View style={styles.quickReports}>
        {category.reports.slice(0, 2).map((report, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickReportButton}
            onPress={() => handleReportPress(report.screen)}
          >
            <Ionicons name={report.icon} size={16} color={category.color} />
            <Text style={[styles.quickReportText, { color: category.color }]}>
              {report.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('ReportSettings')}
        >
          <Ionicons name="settings-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{reportStats.totalReports}</Text>
          <Text style={styles.statLabel}>Available Reports</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{reportStats.pendingReports}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statDate}>{formatDate(reportStats.lastGenerated)}</Text>
          <Text style={styles.statLabel}>Last Generated</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleReportPress('BalanceSheet')}
          >
            <Ionicons name="analytics" size={20} color="#3e60ab" />
            <Text style={styles.quickActionText}>Balance Sheet</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleReportPress('ProfitLoss')}
          >
            <Ionicons name="trending-up" size={20} color="#10b981" />
            <Text style={styles.quickActionText}>P&L Statement</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleReportPress('GSTR1Report')}
          >
            <Ionicons name="document-text" size={20} color="#ef4444" />
            <Text style={styles.quickActionText}>GSTR-1</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleReportPress('StockSummary')}
          >
            <Ionicons name="cube" size={20} color="#f59e0b" />
            <Text style={styles.quickActionText}>Stock Summary</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Report Categories */}
      <ScrollView
        style={styles.categoriesContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>All Reports</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : (
          <View style={styles.categoriesGrid}>
            {reportCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </View>
        )}
        
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Agency',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  settingsButton: {
    padding: 8,
    marginRight: -8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3e60ab',
    fontFamily: 'Agency',
  },
  statDate: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3e60ab',
    textAlign: 'center',
    fontFamily: 'Agency',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Agency',
  },
  quickActionsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Agency',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Agency',
  },
  categoriesContainer: {
    flex: 1,
  },
  categoriesGrid: {
    padding: 16,
  },
  categoryCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'Agency',
  },
  reportCount: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Agency',
  },
  quickReports: {
    flexDirection: 'row',
    gap: 12,
  },
  quickReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  quickReportText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Agency',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Agency',
  },
  bottomPadding: {
    height: 50,
  },
});