import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { reportsAPI } from '../../../lib/api';

export default function ProfitLossScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [profitLossData, setProfitLossData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current_year');

  const handleMenuPress = () => {
    openDrawer();
  };

  const fetchProfitLoss = useCallback(async () => {
    try {
      const response = await reportsAPI.profitLoss({ 
        period: selectedPeriod,
        format: 'detailed'
      });
      setProfitLossData(response.data);
    } catch (error) {
      console.error('Profit & Loss fetch error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load profit & loss statement'
      });
      setProfitLossData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, showNotification]);

  useEffect(() => {
    fetchProfitLoss();
  }, [fetchProfitLoss]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfitLoss();
    setRefreshing(false);
  }, [fetchProfitLoss]);

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

  const renderPLSection = (title, items, isExpense = false) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={[
          styles.sectionIcon,
          { backgroundColor: isExpense ? '#fee2e2' : '#d1fae5' }
        ]}>
          <Ionicons 
            name={isExpense ? 'trending-down' : 'trending-up'} 
            size={20} 
            color={isExpense ? '#ef4444' : '#10b981'} 
          />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      
      {items?.map((item, index) => (
        <View key={index} style={styles.plItem}>
          <View style={styles.plItemLeft}>
            <Text style={[
              styles.plItemName,
              item.isTotal && styles.totalItemName
            ]}>
              {item.name}
            </Text>
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
            styles.plItemAmount,
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
        title="Profit & Loss" 
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
          <Text style={styles.sectionTitle}>Profit & Loss Statement</Text>
          <Text style={styles.sectionSubtitle}>
            Statement of income and expenses showing business profitability
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
              <Text style={styles.loadingText}>Loading profit & loss...</Text>
            </View>
          </View>
        ) : !profitLossData ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="bar-chart-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Data Available</Text>
              <Text style={styles.emptySubtitle}>
                Profit & loss data is not available for the selected period
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Report Header */}
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>
                {profitLossData.company_name || 'Company Name'}
              </Text>
              <Text style={styles.reportSubtitle}>Profit & Loss Statement</Text>
              <Text style={styles.reportPeriod}>
                For the period {profitLossData.period_from} to {profitLossData.period_to}
              </Text>
            </View>

            {/* Key Metrics */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: '#d1fae5' }]}>
                  <Ionicons name="trending-up" size={24} color="#10b981" />
                </View>
                <View style={styles.metricInfo}>
                  <Text style={styles.metricValue}>
                    {formatCurrency(profitLossData.total_revenue)}
                  </Text>
                  <Text style={styles.metricLabel}>Total Revenue</Text>
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="trending-down" size={24} color="#ef4444" />
                </View>
                <View style={styles.metricInfo}>
                  <Text style={styles.metricValue}>
                    {formatCurrency(profitLossData.total_expenses)}
                  </Text>
                  <Text style={styles.metricLabel}>Total Expenses</Text>
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={[
                  styles.metricIcon, 
                  { backgroundColor: profitLossData.net_profit >= 0 ? '#d1fae5' : '#fee2e2' }
                ]}>
                  <Ionicons 
                    name={profitLossData.net_profit >= 0 ? 'trophy' : 'trending-down'} 
                    size={24} 
                    color={profitLossData.net_profit >= 0 ? '#10b981' : '#ef4444'} 
                  />
                </View>
                <View style={styles.metricInfo}>
                  <Text style={[
                    styles.metricValue,
                    { color: profitLossData.net_profit >= 0 ? '#10b981' : '#ef4444' }
                  ]}>
                    {formatCurrency(Math.abs(profitLossData.net_profit))}
                  </Text>
                  <Text style={styles.metricLabel}>
                    {profitLossData.net_profit >= 0 ? 'Net Profit' : 'Net Loss'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Revenue Section */}
            {renderPLSection(
              'REVENUE',
              profitLossData.revenue,
              false
            )}

            {/* Cost of Goods Sold */}
            {profitLossData.cost_of_goods_sold && renderPLSection(
              'COST OF GOODS SOLD',
              profitLossData.cost_of_goods_sold,
              true
            )}

            {/* Gross Profit */}
            <View style={styles.grossProfitCard}>
              <View style={styles.grossProfitHeader}>
                <View style={[
                  styles.grossProfitIcon,
                  { backgroundColor: profitLossData.gross_profit >= 0 ? '#d1fae5' : '#fee2e2' }
                ]}>
                  <Ionicons 
                    name="calculator" 
                    size={20} 
                    color={profitLossData.gross_profit >= 0 ? '#10b981' : '#ef4444'} 
                  />
                </View>
                <Text style={styles.grossProfitTitle}>Gross Profit</Text>
              </View>
              <Text style={[
                styles.grossProfitAmount,
                { color: profitLossData.gross_profit >= 0 ? '#10b981' : '#ef4444' }
              ]}>
                {formatCurrency(profitLossData.gross_profit)}
              </Text>
            </View>

            {/* Operating Expenses */}
            {renderPLSection(
              'OPERATING EXPENSES',
              profitLossData.operating_expenses,
              true
            )}

            {/* Other Income */}
            {profitLossData.other_income && renderPLSection(
              'OTHER INCOME',
              profitLossData.other_income,
              false
            )}

            {/* Other Expenses */}
            {profitLossData.other_expenses && renderPLSection(
              'OTHER EXPENSES',
              profitLossData.other_expenses,
              true
            )}

            {/* Net Profit/Loss */}
            <View style={styles.netProfitCard}>
              <View style={styles.netProfitHeader}>
                <View style={[
                  styles.netProfitIcon,
                  { backgroundColor: profitLossData.net_profit >= 0 ? '#d1fae5' : '#fee2e2' }
                ]}>
                  <Ionicons 
                    name={profitLossData.net_profit >= 0 ? 'trophy' : 'trending-down'} 
                    size={24} 
                    color={profitLossData.net_profit >= 0 ? '#10b981' : '#ef4444'} 
                  />
                </View>
                <Text style={styles.netProfitTitle}>
                  {profitLossData.net_profit >= 0 ? 'Net Profit' : 'Net Loss'}
                </Text>
              </View>
              <Text style={[
                styles.netProfitAmount,
                { color: profitLossData.net_profit >= 0 ? '#10b981' : '#ef4444' }
              ]}>
                {formatCurrency(Math.abs(profitLossData.net_profit))}
              </Text>
              
              {/* Profit Margin */}
              <View style={styles.profitMargin}>
                <Text style={styles.profitMarginLabel}>Profit Margin:</Text>
                <Text style={[
                  styles.profitMarginValue,
                  { color: profitLossData.profit_margin >= 0 ? '#10b981' : '#ef4444' }
                ]}>
                  {profitLossData.profit_margin?.toFixed(2) || 0}%
                </Text>
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
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricInfo: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 12,
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
  plItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  plItemLeft: {
    flex: 1,
    paddingRight: 16,
  },
  plItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'Agency',
    marginBottom: 4,
  },
  totalItemName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3e60ab',
  },
  plItemAmount: {
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
  grossProfitCard: {
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
  grossProfitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  grossProfitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grossProfitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  grossProfitAmount: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Agency',
    textAlign: 'center',
  },
  netProfitCard: {
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
  netProfitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  netProfitIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  netProfitTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'Agency',
  },
  netProfitAmount: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'Agency',
    textAlign: 'center',
    marginBottom: 16,
  },
  profitMargin: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  profitMarginLabel: {
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Agency',
  },
  profitMarginValue: {
    fontSize: 18,
    fontWeight: '700',
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