import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../../../utils/fonts';
import TopBar from '../../../components/navigation/TopBar';
import { useDrawer } from '../../../contexts/DrawerContext.jsx';
import { useNotification } from '../../../contexts/NotificationContext';
import { taxAPI } from '../../../lib/api';
import { formatCurrency } from '../../../utils/businessLogic';
import ModernDatePicker from '../../../components/ui/ModernDatePicker';

export default function TCSReportScreen() {
  const { openDrawer } = useDrawer();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Report filters
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    section: '',
    buyer_pan: '',
  });
  
  // Report data
  const [reportData, setReportData] = useState(null);

  const handleMenuPress = () => {
    openDrawer();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (reportData) {
      await generateReport();
    }
    setRefreshing(false);
  }, [reportData]);

  const generateReport = async () => {
    if (!filters.from_date || !filters.to_date) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Please select from and to dates'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await taxAPI.tcs.report(filters);
      const data = response.data?.data || response.data;
      setReportData(data);
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'TCS report generated successfully'
      });
    } catch (error) {
      console.error('TCS report error:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to generate TCS report'
      });
    } finally {
      setLoading(false);
    }
  };

  const tcsSection = [
    '206C(1H)', '206C(1)', '206C(1F)', '206C(1G)'
  ];

  return (
    <View style={styles.container}>
      <TopBar 
        title="TCS Report" 
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
          <View style={styles.headerIcon}>
            <Ionicons name="document-attach" size={32} color="#10b981" />
          </View>
          <Text style={styles.headerTitle}>TCS Report</Text>
          <Text style={styles.headerSubtitle}>
            Tax Collected at Source summary and details
          </Text>
        </View>

        {/* Filter Card */}
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>Report Filters</Text>
          
          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <ModernDatePicker
                label="From Date *"
                value={filters.from_date}
                onDateChange={(date) => setFilters(prev => ({ ...prev, from_date: date }))}
                placeholder="Select from date"
              />
            </View>
            <View style={styles.formGroupHalf}>
              <ModernDatePicker
                label="To Date *"
                value={filters.to_date}
                onDateChange={(date) => setFilters(prev => ({ ...prev, to_date: date }))}
                placeholder="Select to date"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>TCS Section (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionScroll}>
              <TouchableOpacity
                style={[styles.sectionChip, !filters.section && styles.sectionChipActive]}
                onPress={() => setFilters(prev => ({ ...prev, section: '' }))}
              >
                <Text style={[styles.sectionChipText, !filters.section && styles.sectionChipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {tcsSection.map((section) => (
                <TouchableOpacity
                  key={section}
                  style={[styles.sectionChip, filters.section === section && styles.sectionChipActive]}
                  onPress={() => setFilters(prev => ({ ...prev, section }))}
                >
                  <Text style={[styles.sectionChipText, filters.section === section && styles.sectionChipTextActive]}>
                    {section}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Buyer PAN (Optional)</Text>
            <TextInput
              style={styles.input}
              value={filters.buyer_pan}
              onChangeText={(text) => setFilters(prev => ({ ...prev, buyer_pan: text.toUpperCase() }))}
              placeholder="ABCDE1234F"
              maxLength={10}
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity
            style={[styles.generateButton, loading && styles.generateButtonDisabled]}
            onPress={generateReport}
            disabled={loading}
          >
            <Ionicons name="bar-chart" size={20} color="white" />
            <Text style={styles.generateButtonText}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Report Results */}
        {reportData && (
          <>
            {/* Summary Cards */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <View style={[styles.summaryIcon, { backgroundColor: '#d1fae5' }]}>
                    <Ionicons name="receipt" size={24} color="#10b981" />
                  </View>
                  <Text style={styles.summaryValue}>
                    {reportData.summary?.total_transactions || 0}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Transactions</Text>
                </View>

                <View style={styles.summaryCard}>
                  <View style={[styles.summaryIcon, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="cash" size={24} color="#16a34a" />
                  </View>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(reportData.summary?.total_tcs_amount || 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total TCS Collected</Text>
                </View>

                <View style={styles.summaryCard}>
                  <View style={[styles.summaryIcon, { backgroundColor: '#dbeafe' }]}>
                    <Ionicons name="wallet" size={24} color="#3b82f6" />
                  </View>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(reportData.summary?.total_sale_amount || 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Sale Amount</Text>
                </View>
              </View>
            </View>

            {/* Section-wise Breakdown */}
            {reportData.section_wise && reportData.section_wise.length > 0 && (
              <View style={styles.breakdownSection}>
                <Text style={styles.sectionTitle}>Section-wise Breakdown</Text>
                {reportData.section_wise.map((item, index) => (
                  <View key={index} style={styles.breakdownCard}>
                    <View style={styles.breakdownHeader}>
                      <View style={styles.breakdownIconContainer}>
                        <Ionicons name="document-attach" size={20} color="#10b981" />
                      </View>
                      <View style={styles.breakdownInfo}>
                        <Text style={styles.breakdownSection}>Section {item.section}</Text>
                        <Text style={styles.breakdownCount}>{item.count} transactions</Text>
                      </View>
                      <Text style={styles.breakdownAmount}>
                        {formatCurrency(item.total_tcs)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Detailed Transactions */}
            {reportData.transactions && reportData.transactions.length > 0 && (
              <View style={styles.transactionsSection}>
                <Text style={styles.sectionTitle}>Detailed Transactions</Text>
                {reportData.transactions.map((txn, index) => (
                  <View key={index} style={styles.transactionCard}>
                    <View style={styles.transactionHeader}>
                      <Text style={styles.transactionBuyer}>{txn.buyer_name}</Text>
                      <Text style={styles.transactionAmount}>{formatCurrency(txn.tcs_amount)}</Text>
                    </View>
                    <View style={styles.transactionDetails}>
                      <View style={styles.transactionDetail}>
                        <Ionicons name="person-outline" size={14} color="#64748b" />
                        <Text style={styles.transactionDetailText}>PAN: {txn.buyer_pan}</Text>
                      </View>
                      <View style={styles.transactionDetail}>
                        <Ionicons name="document-text-outline" size={14} color="#64748b" />
                        <Text style={styles.transactionDetailText}>Section: {txn.tcs_section}</Text>
                      </View>
                      <View style={styles.transactionDetail}>
                        <Ionicons name="calendar-outline" size={14} color="#64748b" />
                        <Text style={styles.transactionDetailText}>
                          Date: {new Date(txn.collection_date).toLocaleDateString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {!reportData && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No Report Generated</Text>
            <Text style={styles.emptyStateText}>
              Select filters and click "Generate Report" to view TCS summary
            </Text>
          </View>
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
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    ...FONT_STYLES.h3,
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
  },
  filterCard: {
    backgroundColor: 'white',
    margin: 16,
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
  filterTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    ...FONT_STYLES.label,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    ...FONT_STYLES.body,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    backgroundColor: 'white',
  },
  sectionScroll: {
    marginTop: 8,
  },
  sectionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  sectionChipText: {
    ...FONT_STYLES.label,
    color: '#6b7280',
  },
  sectionChipTextActive: {
    color: 'white',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  generateButtonText: {
    ...FONT_STYLES.button,
    color: 'white',
  },
  summarySection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    ...FONT_STYLES.h5,
    color: '#111827',
    marginBottom: 12,
  },
  summaryGrid: {
    gap: 12,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    textAlign: 'center',
  },
  breakdownSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  breakdownCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownSection: {
    ...FONT_STYLES.h6,
    color: '#111827',
  },
  breakdownCount: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 2,
  },
  breakdownAmount: {
    ...FONT_STYLES.h5,
    color: '#10b981',
  },
  transactionsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionBuyer: {
    ...FONT_STYLES.h6,
    color: '#111827',
    flex: 1,
  },
  transactionAmount: {
    ...FONT_STYLES.h6,
    color: '#10b981',
  },
  transactionDetails: {
    gap: 6,
  },
  transactionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transactionDetailText: {
    ...FONT_STYLES.caption,
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    ...FONT_STYLES.h4,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...FONT_STYLES.body,
    color: '#6b7280',
    textAlign: 'center',
  },
});
