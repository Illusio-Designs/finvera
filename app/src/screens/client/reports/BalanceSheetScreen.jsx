import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { reportsAPI } from '../../../lib/api';

export default function BalanceSheetScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [balanceSheetData, setBalanceSheetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current_year');

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchBalanceSheet = useCallback(async () => {
    try {
      const response = await reportsAPI.balanceSheet({ 
        period: selectedPeriod,
        format: 'detailed'
      });
      setBalanceSheetData(response.data);
    } catch (error) {
      console.error('Balance sheet fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load balance sheet'
      });
      setBalanceSheetData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, showNotification]);

  useEffect(() => {
    fetchBalanceSheet();
  }, [fetchBalanceSheet]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBalanceSheet();
    setRefreshing(false);
  }, [fetchBalanceSheet]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const periodOptions = [
    { key: 'current_year', label: 'Current Year' },
    { key: 'previous_year', label: 'Previous Year' },
    { key: 'current_quarter', label: 'Current Quarter' },
    { key: 'current_month', label: 'Current Month' },
  ];

  const renderBalanceSheetSection = (title, items, isLiability = false) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={[
          styles.sectionIcon,
          { backgroundColor: isLiability ? '#fee2e2' : '#d1fae5' }
        ]}>
          <Ionicons 
            name={isLiability ? 'trending-down' : 'trending-up'} 
            size={20} 
            color={isLiability ? '#ef4444' : '#10b981'} 
          />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      
      {items?.map((item, index) => (
        <View key={index} style={styles.balanceItem}>
          <View style={styles.balanceItemLeft}>
            <Text style={styles.balanceItemName}>{item.name}</Text>
            {item.subItems && (
              <View style={styles.subItems}>
                {item.subItems.map((subItem, subIndex) => (
                  <View key={subIndex} style={styles.subItem}>
                    <Text style={styles.subItemName}>{subItem.name}</Text>
                    <Text style={styles.subItemAmount}>
                      {formatCurrency(subItem.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Text style={[
            styles.balanceItemAmount,
            item.isTotal && styles.totalAmount
          ]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <TopBar 
        title="Balance Sheet" 
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
          <Text style={styles.sectionTitle}>Balance Sheet</Text>
          <Text style={styles.sectionSubtitle}>
            Statement of financial position showing assets, liabilities and equity
          </Text>
        </View>

        {/* Period Selection */}
        <View style={styles.periodContainer}>
          <Text style={styles.periodLabel}>Select Period:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.periodTabs}
          >
            {periodOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.periodTab,
                  selectedPeriod === option.key && styles.periodTabActive
                ]}
                onPress={() => setSelectedPeriod(option.key)}
              >
                <Text style={[
                  styles.periodTabText,
                  selectedPeriod === option.key && styles.periodTabTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <View style={styles.spinner} />
              <Text style={styles.loadingText}>Loading balance sheet...</Text>
            </View>
          </View>
        ) : !balanceSheetData ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Data Available</Text>
              <Text style={styles.emptySubtitle}>
                Balance sheet data is not available for the selected period
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Balance Sheet Header */}
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>
                {balanceSheetData.company_name || 'Company Name'}
              </Text>
              <Text style={styles.reportSubtitle}>Balance Sheet</Text>
              <Text style={styles.reportPeriod}>
                As on {balanceSheetData.as_on_date || 'Date'}
              </Text>
            </View>

            {/* Assets Section */}
            {renderBalanceSheetSection(
              'ASSETS',
              balanceSheetData.assets,
              false
            )}

            {/* Liabilities Section */}
            {renderBalanceSheetSection(
              'LIABILITIES',
              balanceSheetData.liabilities,
              true
            )}

            {/* Equity Section */}
            {renderBalanceSheetSection(
              'EQUITY',
              balanceSheetData.equity,
              false
            )}

            {/* Balance Verification */}
            <View style={styles.balanceVerification}>
              <View style={styles.verificationCard}>
                <View style={styles.verificationHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={styles.verificationTitle}>Balance Verification</Text>
                </View>
                
                <View style={styles.verificationRow}>
                  <Text style={styles.verificationLabel}>Total Assets:</Text>
                  <Text style={styles.verificationAmount}>
                    {formatCurrency(balanceSheetData.total_assets)}
                  </Text>
                </View>
                
                <View style={styles.verificationRow}>
                  <Text style={styles.verificationLabel}>Total Liabilities + Equity:</Text>
                  <Text style={styles.verificationAmount}>
                    {formatCurrency(balanceSheetData.total_liabilities_equity)}
                  </Text>
                </View>
                
                <View style={[styles.verificationRow, styles.differenceRow]}>
                  <Text style={styles.verificationLabel}>Difference:</Text>
                  <Text style={[
                    styles.verificationAmount,
                    { color: balanceSheetData.difference === 0 ? '#10b981' : '#ef4444' }
                  ]}>
                    {formatCurrency(balanceSheetData.difference)}
                  </Text>
                </View>
                
                {balanceSheetData.difference === 0 ? (
                  <View style={styles.balancedIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.balancedText}>Balance Sheet is Balanced</Text>
                  </View>
                ) : (
                  <View style={styles.unbalancedIndicator}>
                    <Ionicons name="warning" size={16} color="#ef4444" />
                    <Text style={styles.unbalancedText}>Balance Sheet is Not Balanced</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Export Options */}
            <View style={styles.exportContainer}>
              <TouchableOpacity style={styles.exportButton} activeOpacity={0.8}>
                <Ionicons name="download" size={20} color="#3e60ab" />
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.exportButton} activeOpacity={0.8}>
                <Ionicons name="document-text" size={20} color="#10b981" />
                <Text style={styles.exportButtonText}>Export Excel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  periodContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Agency',
    marginBottom: 12,
  },
  periodTabs: {
    flexDirection: 'row',
  },
  periodTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  periodTabActive: {
    backgroundColor: '#3e60ab',
    borderColor: '#3e60ab',
    shadowColor: '#3e60ab',
    shadowOpacity: 0.3,
  },
  periodTabText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    fontWeight: '500',
  },
  periodTabTextActive: {
    color: 'white',
    fontWeight: '600',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyCard: {
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
    width: '100%',
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
    textAlign: 'center',
    lineHeight: 24,
  },
  reportHeader: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
    textAlign: 'center',
  },
  reportSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3e60ab',
    fontFamily: 'Agency',
    marginBottom: 8,
    textAlign: 'center',
  },
  reportPeriod: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  balanceItemLeft: {
    flex: 1,
    paddingRight: 16,
  },
  balanceItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  balanceItemAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    textAlign: 'right',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3e60ab',
  },
  subItems: {
    marginTop: 8,
    paddingLeft: 16,
  },
  subItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  subItemName: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Agency',
    flex: 1,
  },
  subItemAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    fontFamily: 'Agency',
  },
  balanceVerification: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  verificationCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  verificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  differenceRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    marginBottom: 16,
  },
  verificationLabel: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  verificationAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  balancedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  balancedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    fontFamily: 'Agency',
  },
  unbalancedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  unbalancedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    fontFamily: 'Agency',
  },
  exportContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
});